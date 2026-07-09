/**
 * Orquesta el flujo "Entrenar guiado" y el registro en SQLite, con dos garantías
 * anti-duplicado que son el corazón de este hook:
 *
 * 1) UNA sola sesión por entreno, sin carreras. La sesión se crea de forma
 *    PEREZOSA (al guardar la primera serie) y se memoiza la PROMESA de
 *    crearSesion() —no solo el id—. Si dos series se confirman casi a la vez
 *    antes de que resuelva el primer crearSesion(), ambas esperan la MISMA
 *    promesa, así que solo se inserta una fila en `sesion` (mismo patrón que
 *    initDB()).
 *
 * 2) ✓ idempotente por serie. Con filas fijas 1..N, cada serie tiene una
 *    identidad estable (ejercicio + numero_serie). Reconfirmar la misma serie
 *    (doble toque o re-guardar tras editar) NO inserta otra fila: la primera vez
 *    hace INSERT y recuerda el id; las siguientes hacen UPDATE de esa fila. Las
 *    confirmaciones de la MISMA serie se serializan (cadena de promesas por
 *    clave) para que un doble toque simultáneo no haga dos INSERT.
 */
import { useCallback, useMemo, useRef, useState } from 'react';

import { actualizarSerie, agregarSerie, crearSesion } from '@/src/db';
import type { EjercicioPlantilla, TipoSesion } from '@/src/models/gym';

export type VistaGym = 'inicio' | 'sesion' | 'ejercicio';

/** Valores de una serie ya parseados (lo que se persiste). */
export type ValoresSerie = {
  peso_kg: number | null;
  reps: number | null;
  rir: number | null;
};

/** Clave estable de una serie dentro del entreno: ejercicio + su número. */
function claveSerie(ejercicioIdx: number, numeroSerie: number): string {
  return `${ejercicioIdx}:${numeroSerie}`;
}

export function useEntrenamiento(tipo: TipoSesion, ejercicios: EjercicioPlantilla[]) {
  const [vista, setVista] = useState<VistaGym>('inicio');
  const [ejercicioIdx, setEjercicioIdx] = useState(0);

  // Promesa memoizada de la sesión en curso (garantía 1). Ref, no estado: se lee
  // y escribe dentro de operaciones async sin depender de un re-render.
  const sesionPromiseRef = useRef<Promise<number> | null>(null);
  // Id SQLite de cada serie ya insertada, por clave (garantía 2, fuente autoritaria).
  const serieIdsRef = useRef<Map<string, number>>(new Map());
  // Última operación en curso por clave, para serializar reconfirmaciones simultáneas.
  const opsRef = useRef<Map<string, Promise<void>>>(new Map());
  // Espejo en estado de las claves ya guardadas, solo para el ✓ visual.
  const [guardadas, setGuardadas] = useState<Set<string>>(new Set());

  /** Crea la sesión una sola vez y devuelve SIEMPRE la misma promesa. */
  const obtenerSesionId = useCallback((): Promise<number> => {
    if (!sesionPromiseRef.current) {
      sesionPromiseRef.current = crearSesion({ tipo }).catch((error) => {
        // No memoizar una promesa rota: permite reintentar en la próxima serie.
        sesionPromiseRef.current = null;
        throw error;
      });
    }
    return sesionPromiseRef.current;
  }, [tipo]);

  /** INSERT la primera vez, UPDATE si la serie ya existe. */
  const persistirSerie = useCallback(
    async (
      key: string,
      ejercicio: string,
      numeroSerie: number,
      valores: ValoresSerie,
    ): Promise<void> => {
      const sesionId = await obtenerSesionId();
      const existente = serieIdsRef.current.get(key);
      if (existente !== undefined) {
        await actualizarSerie(existente, valores);
      } else {
        const id = await agregarSerie({
          sesion_id: sesionId,
          ejercicio,
          numero_serie: numeroSerie,
          ...valores,
        });
        serieIdsRef.current.set(key, id);
      }
      setGuardadas((prev) => {
        if (prev.has(key)) return prev;
        const siguiente = new Set(prev);
        siguiente.add(key);
        return siguiente;
      });
    },
    [obtenerSesionId],
  );

  /**
   * Guarda (o re-guarda) una serie. Encadena sobre cualquier operación en curso
   * de la MISMA serie para que dos confirmaciones simultáneas no dupliquen fila.
   */
  const guardarSerie = useCallback(
    (
      ejercicioIdxSerie: number,
      ejercicio: string,
      numeroSerie: number,
      valores: ValoresSerie,
    ): Promise<void> => {
      const key = claveSerie(ejercicioIdxSerie, numeroSerie);
      const anterior = opsRef.current.get(key) ?? Promise.resolve();
      const operacion = anterior
        .catch(() => {}) // no propagar el rechazo de una confirmación previa
        .then(() => persistirSerie(key, ejercicio, numeroSerie, valores));
      opsRef.current.set(key, operacion);
      return operacion;
    },
    [persistirSerie],
  );

  /** ¿Esta serie ya está guardada? (para el ✓ visual). */
  const serieGuardada = useCallback(
    (ejercicioIdxSerie: number, numeroSerie: number): boolean =>
      guardadas.has(claveSerie(ejercicioIdxSerie, numeroSerie)),
    [guardadas],
  );

  const iniciar = useCallback(() => setVista('sesion'), []);
  const volverAlInicio = useCallback(() => setVista('inicio'), []);
  const volverASesion = useCallback(() => setVista('sesion'), []);

  const abrirEjercicio = useCallback((idx: number) => {
    setEjercicioIdx(idx);
    setVista('ejercicio');
  }, []);

  const siguienteEjercicio = useCallback(() => {
    setEjercicioIdx((idx) => {
      const proximo = idx + 1;
      if (proximo >= ejercicios.length) {
        setVista('sesion'); // era el último: vuelve a la lista del día
        return idx;
      }
      return proximo;
    });
  }, [ejercicios.length]);

  const haySiguiente = ejercicioIdx < ejercicios.length - 1;

  return useMemo(
    () => ({
      vista,
      ejercicioIdx,
      haySiguiente,
      iniciar,
      volverAlInicio,
      volverASesion,
      abrirEjercicio,
      siguienteEjercicio,
      guardarSerie,
      serieGuardada,
    }),
    [
      vista,
      ejercicioIdx,
      haySiguiente,
      iniciar,
      volverAlInicio,
      volverASesion,
      abrirEjercicio,
      siguienteEjercicio,
      guardarSerie,
      serieGuardada,
    ],
  );
}
