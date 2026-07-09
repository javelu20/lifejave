/**
 * Capa de datos SQLite del módulo Gym (impura, aislada aquí).
 *
 * API de expo-sqlite SDK 54 (openDatabaseAsync + métodos *Async). Toda la
 * interacción con la BD pasa por este archivo; el resto de la app solo ve
 * funciones tipadas que devuelven modelos.
 *
 * Blindaje de inicialización (dos defensas independientes):
 *  1. initDB() está MEMOIZADA: devuelve siempre la misma promesa, así la
 *     conexión se abre y la migración corre UNA sola vez aunque se llame en
 *     paralelo (sin carreras).
 *  2. Cada función de datos hace `await initDB()` al entrar, ANTES de tocar las
 *     tablas. Así ninguna consulta puede ejecutarse contra una BD sin migrar,
 *     independientemente de lo que haga la UI.
 */
import * as SQLite from 'expo-sqlite';

import { fechaLocalISO } from '@/src/lib/gym';
import type { NuevaSerie, NuevaSesion, Serie, Sesion } from '@/src/models/gym';

const DB_NAME = 'lifejave.db';
/** Versión de esquema. Subir e ir añadiendo bloques de migración al crecer. */
const DB_VERSION = 1;

/**
 * Promesa memoizada de la conexión ya migrada. `null` hasta la primera llamada;
 * a partir de ahí, SIEMPRE la misma promesa (misma conexión, una migración).
 */
let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Abre la conexión y aplica migraciones idempotentes. Se llama una sola vez. */
async function abrirYMigrar(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);

  // Integridad referencial (serie → sesion). Debe fijarse por conexión.
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const fila = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const version = fila?.user_version ?? 0;

  if (version < DB_VERSION) {
    if (version === 0) {
      // v1: esquema base (tal cual ARQUITECTURA.md, sección Módulo Gym).
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sesion (
          id            INTEGER PRIMARY KEY,
          fecha         TEXT NOT NULL,
          tipo          TEXT NOT NULL,
          duracion_min  INTEGER,
          nota          TEXT
        );
        CREATE TABLE IF NOT EXISTS serie (
          id            INTEGER PRIMARY KEY,
          sesion_id     INTEGER NOT NULL REFERENCES sesion(id),
          ejercicio     TEXT NOT NULL,
          numero_serie  INTEGER NOT NULL,
          peso_kg       REAL,
          reps          INTEGER,
          rir           INTEGER
        );
      `);
    }
    // Futuras versiones: if (version < 2) { ... }, etc.

    await db.execAsync(`PRAGMA user_version = ${DB_VERSION};`);
  }

  return db;
}

/**
 * Devuelve la conexión SQLite ya migrada. MEMOIZADA: llamarla N veces abre y
 * migra una sola vez. La pantalla la espera para su estado de carga; las
 * funciones de datos la esperan internamente (defensa doble).
 */
export function initDB(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = abrirYMigrar().catch((error) => {
      // Si falló, no memoizar una promesa rota: permite reintentar en el próximo
      // arranque en vez de quedar clavado para siempre.
      dbPromise = null;
      throw error;
    });
  }
  return dbPromise;
}

/**
 * Crea una sesión y devuelve su id. La `fecha` es SIEMPRE la fecha local de hoy
 * (fechaLocalISO), para que el historial no se corra por UTC.
 */
export async function crearSesion(nueva: NuevaSesion): Promise<number> {
  const db = await initDB();
  const resultado = await db.runAsync(
    'INSERT INTO sesion (fecha, tipo, duracion_min, nota) VALUES (?, ?, ?, ?)',
    fechaLocalISO(),
    nueva.tipo,
    nueva.duracion_min ?? null,
    nueva.nota ?? null,
  );
  return resultado.lastInsertRowId;
}

/** Inserta una serie asociada a una sesión existente. */
export async function agregarSerie(nueva: NuevaSerie): Promise<void> {
  const db = await initDB();
  await db.runAsync(
    'INSERT INTO serie (sesion_id, ejercicio, numero_serie, peso_kg, reps, rir) VALUES (?, ?, ?, ?, ?, ?)',
    nueva.sesion_id,
    nueva.ejercicio,
    nueva.numero_serie,
    nueva.peso_kg ?? null,
    nueva.reps ?? null,
    nueva.rir ?? null,
  );
}

/** Todas las sesiones, la más reciente primero. Devuelve [] si algo falla. */
export async function listarSesiones(): Promise<Sesion[]> {
  try {
    const db = await initDB();
    return await db.getAllAsync<Sesion>(
      'SELECT id, fecha, tipo, duracion_min, nota FROM sesion ORDER BY fecha DESC, id DESC',
    );
  } catch (error) {
    console.error('[db] listarSesiones falló', error);
    return [];
  }
}

/** Series de una sesión, en orden de ejercicio y número de serie. [] si falla. */
export async function getSeries(sesionId: number): Promise<Serie[]> {
  try {
    const db = await initDB();
    return await db.getAllAsync<Serie>(
      'SELECT id, sesion_id, ejercicio, numero_serie, peso_kg, reps, rir FROM serie WHERE sesion_id = ? ORDER BY id ASC',
      sesionId,
    );
  } catch (error) {
    console.error('[db] getSeries falló', error);
    return [];
  }
}
