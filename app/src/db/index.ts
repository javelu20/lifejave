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
const DB_VERSION = 2;

/**
 * Las 13 categorías de gasto de FINANZAS.md, con ids ESTABLES 1..13 y su emoji
 * en `icono`. Los ingresos no usan categoría (guardan `fuente` libre), por eso
 * todas son de tipo 'gasto'. El seed las inserta con INSERT OR IGNORE: es
 * idempotente y no las duplica al reabrir.
 */
const CATEGORIAS_SEED: { id: number; nombre: string; icono: string }[] = [
  { id: 1, nombre: 'Comida / Supermercado', icono: '🛒' },
  { id: 2, nombre: 'Comer fuera / Delivery', icono: '🍔' },
  { id: 3, nombre: 'Gym / Suplementos', icono: '🏋️' },
  { id: 4, nombre: 'Transporte', icono: '🚌' },
  { id: 5, nombre: 'Vivienda / Servicios', icono: '🏠' },
  { id: 6, nombre: 'Telefonía / Datos', icono: '📱' },
  { id: 7, nombre: 'Ocio', icono: '🎉' },
  { id: 8, nombre: 'Salud', icono: '💊' },
  { id: 9, nombre: 'Educación', icono: '📚' },
  { id: 10, nombre: 'Ropa / Personal', icono: '👕' },
  { id: 11, nombre: 'Deudas / Préstamos', icono: '💸' },
  { id: 12, nombre: 'Ahorro / Inversión', icono: '💰' },
  { id: 13, nombre: 'Otros', icono: '🔧' },
];

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

  // Migración incremental y acumulativa: cada bloque `if (version < N)` aplica
  // SOLO los cambios de esa versión. Instalación limpia (0) corre v1 y v2;
  // instalación existente (1) corre solo v2, sin tocar sesion/serie.
  if (version < DB_VERSION) {
    if (version < 1) {
      // v1: esquema base del módulo Gym (tal cual ARQUITECTURA.md).
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

    if (version < 2) {
      // v2: módulo Finanzas (tal cual ARQUITECTURA.md, sección Módulo Finanzas).
      // UNIQUE(categoria_id) en presupuesto: un solo tope por categoría, para que
      // ni el seed ni upsertPresupuesto puedan crear dos topes de la misma.
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS categoria (
          id      INTEGER PRIMARY KEY,
          nombre  TEXT NOT NULL,
          icono   TEXT,
          tipo    TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS movimiento (
          id            INTEGER PRIMARY KEY,
          tipo          TEXT NOT NULL,
          monto         REAL NOT NULL,
          fecha         TEXT NOT NULL,
          categoria_id  INTEGER REFERENCES categoria(id),
          fuente        TEXT,
          metodo_pago   TEXT,
          recurrente    INTEGER DEFAULT 0,
          nota          TEXT
        );
        CREATE TABLE IF NOT EXISTS presupuesto (
          id             INTEGER PRIMARY KEY,
          categoria_id   INTEGER REFERENCES categoria(id),
          monto_mensual  REAL NOT NULL,
          UNIQUE(categoria_id)
        );
      `);

      // Seed idempotente de las 13 categorías de gasto (ids estables 1..13).
      for (const cat of CATEGORIAS_SEED) {
        await db.runAsync(
          "INSERT OR IGNORE INTO categoria (id, nombre, icono, tipo) VALUES (?, ?, ?, 'gasto')",
          cat.id,
          cat.nombre,
          cat.icono,
        );
      }

      // Presupuesto por defecto: Comida / Supermercado = 800 Bs (FINANZAS.md).
      // INSERT OR IGNORE + UNIQUE(categoria_id) evita duplicar al reabrir.
      await db.runAsync(
        'INSERT OR IGNORE INTO presupuesto (categoria_id, monto_mensual) VALUES (1, 800)',
      );
    }

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
