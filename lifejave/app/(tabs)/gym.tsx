import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';

import { ThemedView } from '@/components/themed-view';
import { EjercicioPlayer } from '@/src/components/EjercicioPlayer';
import { HistorialEntrenos } from '@/src/components/HistorialEntrenos';
import { InicioGym } from '@/src/components/InicioGym';
import { SesionDelDia } from '@/src/components/SesionDelDia';
import rutinaData from '@/src/data/rutina.json';
import { initDB } from '@/src/db';
import { useEntrenamiento } from '@/src/hooks/useEntrenamiento';
import { getTipoSesionDelDia } from '@/src/lib/gym';
import type { Rutina } from '@/src/models/gym';

const rutina = rutinaData as Rutina;

/**
 * Pantalla del módulo Gym: flujo "Entrenar guiado".
 *
 * Orquesta con estado local (sin rutas ni tabs nuevos) tres vistas —inicio,
 * sesión del día y player de ejercicio— vía useEntrenamiento, que también
 * registra en SQLite (reutilizando la capa de la Fase 1). El historial de la
 * Fase 1 se conserva como modal, abierto desde el enlace discreto del inicio.
 *
 * initDB() mantiene su estado de carga: hasta que resuelve, INICIAR e Historial
 * quedan deshabilitados (primera de las dos defensas; la otra vive en la capa de
 * datos, que hace await initDB() en cada función).
 */
export default function GymScreen() {
  const [dbLista, setDbLista] = useState(false);
  const [dbError, setDbError] = useState(false);
  const [historialVisible, setHistorialVisible] = useState(false);

  useEffect(() => {
    let vivo = true;
    initDB()
      .then(() => {
        if (vivo) setDbLista(true);
      })
      .catch((error) => {
        console.error('[GymScreen] initDB falló', error);
        if (vivo) setDbError(true);
      });
    return () => {
      vivo = false;
    };
  }, []);

  const tipo = getTipoSesionDelDia();
  const esDescanso = tipo === 'descanso';
  const ejercicios = esDescanso ? [] : rutina[tipo];

  // El hook se llama SIEMPRE (regla de hooks). En descanso el tipo es irrelevante:
  // INICIAR está deshabilitado, así que nunca se crea sesión ni se guarda serie.
  const entreno = useEntrenamiento(esDescanso ? 'PushA' : tipo, ejercicios);

  return (
    <ThemedView style={styles.container}>
      {entreno.vista === 'inicio' ? (
        <InicioGym
          esDescanso={esDescanso}
          cargandoDb={!dbLista && !dbError}
          errorDb={dbError}
          onIniciar={entreno.iniciar}
          onHistorial={() => setHistorialVisible(true)}
        />
      ) : entreno.vista === 'sesion' ? (
        <SesionDelDia
          tipo={tipo === 'descanso' ? 'PushA' : tipo}
          ejercicios={ejercicios}
          onAbrirEjercicio={entreno.abrirEjercicio}
          onVolver={entreno.volverAlInicio}
        />
      ) : (
        <EjercicioPlayer
          key={entreno.ejercicioIdx}
          ejercicioIdx={entreno.ejercicioIdx}
          ejercicio={ejercicios[entreno.ejercicioIdx]}
          haySiguiente={entreno.haySiguiente}
          serieGuardada={entreno.serieGuardada}
          guardarSerie={entreno.guardarSerie}
          onVolver={entreno.volverASesion}
          onSiguiente={entreno.siguienteEjercicio}
        />
      )}

      {/* Historial de la Fase 1, conservado. Solo se monta con la BD lista. */}
      {dbLista && !dbError ? (
        <HistorialEntrenos
          visible={historialVisible}
          onClose={() => setHistorialVisible(false)}
        />
      ) : null}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
