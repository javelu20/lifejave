/**
 * Tests de las dos garantías anti-duplicado de useEntrenamiento, contra el hook
 * REAL (la capa de datos se mockea para contar INSERT/UPDATE y crearSesion):
 *
 *  1. Una sola sesión por entreno aunque dos series se confirmen casi a la vez
 *     antes de que resuelva crearSesion() (promesa de sesión memoizada).
 *  2. ✓ idempotente: reconfirmar la misma serie hace UPDATE, no un segundo INSERT
 *     (tanto secuencial como en doble toque simultáneo).
 *
 * Se renderiza con react-test-renderer (transitivo de jest-expo) un componente
 * "arnés" que expone el API del hook por referencia.
 */
import { act, create } from 'react-test-renderer';

import type { EjercicioPlantilla } from '@/src/models/gym';
import { useEntrenamiento } from './useEntrenamiento';

jest.mock('@/src/db', () => ({
  crearSesion: jest.fn(),
  agregarSerie: jest.fn(),
  actualizarSerie: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const db = require('@/src/db') as {
  crearSesion: jest.Mock;
  agregarSerie: jest.Mock;
  actualizarSerie: jest.Mock;
};

const EJERCICIOS: EjercicioPlantilla[] = [
  { ejercicio: 'Press banca con barra', series: 4, reps: '6-8', descanso_s: 150, rir: '1-2' },
];

type Api = ReturnType<typeof useEntrenamiento>;

/** Monta el hook y devuelve un getter siempre-al-día de su API. */
function montarHook(): () => Api {
  let apiActual: Api;
  function Arnes() {
    apiActual = useEntrenamiento('PushA', EJERCICIOS);
    return null;
  }
  act(() => {
    create(<Arnes />);
  });
  return () => apiActual;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('garantía 1: una sola sesión sin carreras', () => {
  it('dos series confirmadas antes de resolver crearSesion() → un solo crearSesion', async () => {
    // crearSesion queda "en el aire" hasta que lo resolvamos a mano.
    let resolverSesion!: (id: number) => void;
    db.crearSesion.mockImplementation(
      () => new Promise<number>((resolve) => { resolverSesion = resolve; }),
    );
    let siguienteId = 10;
    db.agregarSerie.mockImplementation(async () => siguienteId++);

    const getApi = montarHook();

    // Dos series distintas confirmadas en el mismo tick, antes de que exista sesión.
    let p1: Promise<void>;
    let p2: Promise<void>;
    act(() => {
      p1 = getApi().guardarSerie(0, 'Press banca con barra', 1, { peso_kg: 100, reps: 8, rir: null });
      p2 = getApi().guardarSerie(0, 'Press banca con barra', 2, { peso_kg: 100, reps: 7, rir: null });
    });

    // Deja correr los microtasks para que ambas lleguen a `await obtenerSesionId()`,
    // pero SIN resolver aún crearSesion (sigue pendiente): así comprobamos que las
    // dos confirmaciones concurrentes comparten la MISMA promesa de sesión.
    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(db.crearSesion).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolverSesion(1);
      await Promise.all([p1, p2]);
    });

    // Sigue siendo una sola sesión, y ambas series se asociaron a ella (id 1).
    expect(db.crearSesion).toHaveBeenCalledTimes(1);
    expect(db.agregarSerie).toHaveBeenCalledTimes(2);
    expect(db.agregarSerie.mock.calls.every(([arg]) => arg.sesion_id === 1)).toBe(true);
  });
});

describe('garantía 2: ✓ idempotente por serie', () => {
  it('reconfirmar la misma serie (secuencial) → UPDATE, no un segundo INSERT', async () => {
    db.crearSesion.mockResolvedValue(1);
    db.agregarSerie.mockResolvedValue(42);

    const getApi = montarHook();

    await act(async () => {
      await getApi().guardarSerie(0, 'Press banca con barra', 1, { peso_kg: 100, reps: 8, rir: null });
    });
    await act(async () => {
      await getApi().guardarSerie(0, 'Press banca con barra', 1, { peso_kg: 105, reps: 6, rir: null });
    });

    expect(db.agregarSerie).toHaveBeenCalledTimes(1);
    expect(db.actualizarSerie).toHaveBeenCalledTimes(1);
    // El UPDATE apunta a la fila insertada (id 42) con los valores nuevos.
    expect(db.actualizarSerie).toHaveBeenCalledWith(42, { peso_kg: 105, reps: 6, rir: null });
  });

  it('doble toque simultáneo en la misma serie → un INSERT + un UPDATE', async () => {
    db.crearSesion.mockResolvedValue(1);
    db.agregarSerie.mockResolvedValue(7);

    const getApi = montarHook();

    let a: Promise<void>;
    let b: Promise<void>;
    act(() => {
      a = getApi().guardarSerie(0, 'Press banca con barra', 1, { peso_kg: 100, reps: 8, rir: null });
      b = getApi().guardarSerie(0, 'Press banca con barra', 1, { peso_kg: 100, reps: 8, rir: null });
    });
    await act(async () => {
      await Promise.all([a, b]);
    });

    expect(db.agregarSerie).toHaveBeenCalledTimes(1);
    expect(db.actualizarSerie).toHaveBeenCalledTimes(1);
  });
});
