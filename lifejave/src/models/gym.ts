/**
 * Tipos del módulo Gym.
 *
 * Dos fuentes de datos, dos naturalezas:
 * - Plantilla de rutina (semilla, fija): src/data/rutina.json → EjercicioPlantilla / Rutina.
 * - Historial entrenado (crece con el uso): SQLite → Sesion / Serie.
 *
 * Ver RUTINA_GYM.md (contenido) y ARQUITECTURA.md (esquema SQL).
 */

/** Las 6 sesiones del split PPL ×2. Claves tal cual las llaves de rutina.json. */
export type TipoSesion = 'PushA' | 'PullA' | 'LegsA' | 'PushB' | 'PullB' | 'LegsB';

/**
 * Un ejercicio planificado dentro de una sesión (semilla).
 * `reps` y `rir` son STRINGS de rango tal cual el doc ("6-8", "1-2");
 * `descanso_s` es número en segundos.
 */
export type EjercicioPlantilla = {
  ejercicio: string;
  series: number;
  reps: string;
  descanso_s: number;
  rir: string;
};

/** Forma completa de src/data/rutina.json: cada tipo de sesión → sus ejercicios. */
export type Rutina = Record<TipoSesion, EjercicioPlantilla[]>;

/** Una sesión entrenada (fila de la tabla `sesion`). */
export type Sesion = {
  id: number;
  fecha: string; // ISO local 'YYYY-MM-DD' (ver fechaLocalISO)
  tipo: TipoSesion;
  duracion_min?: number | null;
  nota?: string | null;
};

/** Una serie realizada (fila de la tabla `serie`). */
export type Serie = {
  id: number;
  sesion_id: number;
  ejercicio: string;
  numero_serie: number; // 1, 2, 3… por ejercicio dentro de la sesión
  peso_kg?: number | null;
  reps?: number | null;
  rir?: number | null;
};

/**
 * Entrada para crear una sesión (sin id). La `fecha` la pone la capa de datos con
 * fechaLocalISO(), por eso no se pide aquí: siempre es la fecha local del entreno.
 */
export type NuevaSesion = Omit<Sesion, 'id' | 'fecha'>;

/** Entrada para crear una serie (sin id). */
export type NuevaSerie = Omit<Serie, 'id'>;
