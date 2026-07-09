/**
 * Capa de datos SQLite del módulo Finanzas (impura, aislada aquí).
 *
 * Reutiliza la conexión memoizada y migrada de ./index (initDB): cada función
 * hace `await initDB()` antes de tocar tablas, el mismo blindaje que Gym, así
 * ninguna consulta corre contra una BD sin migrar. Todo con try/catch para no
 * romper la app (devuelven [] o propagan de forma controlada).
 */
import { fechaLocalISO } from '@/src/lib/gym';
import { prefijoMes } from '@/src/lib/finanzas';
import type {
  Categoria,
  Movimiento,
  NuevoMovimiento,
  Presupuesto,
} from '@/src/models/finanzas';

import { initDB } from './index';

/** Fila cruda de `movimiento`: recurrente llega como 0/1 desde SQLite. */
type FilaMovimiento = Omit<Movimiento, 'recurrente'> & { recurrente: number };

/** Normaliza una fila cruda a Movimiento (recurrente 0/1 → boolean). */
function aMovimiento(fila: FilaMovimiento): Movimiento {
  return { ...fila, recurrente: fila.recurrente === 1 };
}

/**
 * Crea un movimiento y devuelve su id. La `fecha` es opcional: si el formulario
 * la cambió, se guarda tal cual (formato local 'YYYY-MM-DD') y el movimiento cae
 * en su mes real; si se omite, usa la fecha local de hoy (fechaLocalISO).
 */
export async function crearMovimiento(nuevo: NuevoMovimiento): Promise<number> {
  const db = await initDB();
  const resultado = await db.runAsync(
    `INSERT INTO movimiento
       (tipo, monto, fecha, categoria_id, fuente, metodo_pago, recurrente, nota)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    nuevo.tipo,
    nuevo.monto,
    nuevo.fecha ?? fechaLocalISO(),
    nuevo.categoria_id ?? null,
    nuevo.fuente ?? null,
    nuevo.metodo_pago ?? null,
    nuevo.recurrente ? 1 : 0,
    nuevo.nota ?? null,
  );
  return resultado.lastInsertRowId;
}

/**
 * Movimientos de un mes, más reciente primero. Filtra por prefijo 'YYYY-MM%'
 * con el mes a 2 dígitos (prefijoMes) para coincidir con las fechas guardadas
 * 'YYYY-MM-DD'. Devuelve [] si algo falla.
 */
export async function listarMovimientosDelMes(
  year: number,
  month: number,
): Promise<Movimiento[]> {
  try {
    const db = await initDB();
    const filas = await db.getAllAsync<FilaMovimiento>(
      `SELECT id, tipo, monto, fecha, categoria_id, fuente, metodo_pago, recurrente, nota
         FROM movimiento
        WHERE fecha LIKE ?
        ORDER BY fecha DESC, id DESC`,
      `${prefijoMes(year, month)}%`,
    );
    return filas.map(aMovimiento);
  } catch (error) {
    console.error('[db] listarMovimientosDelMes falló', error);
    return [];
  }
}

/** Todas las categorías, por id ascendente. Devuelve [] si algo falla. */
export async function listarCategorias(): Promise<Categoria[]> {
  try {
    const db = await initDB();
    return await db.getAllAsync<Categoria>(
      'SELECT id, nombre, icono, tipo FROM categoria ORDER BY id ASC',
    );
  } catch (error) {
    console.error('[db] listarCategorias falló', error);
    return [];
  }
}

/** Todos los presupuestos definidos. Devuelve [] si algo falla. */
export async function getPresupuestos(): Promise<Presupuesto[]> {
  try {
    const db = await initDB();
    return await db.getAllAsync<Presupuesto>(
      'SELECT id, categoria_id, monto_mensual FROM presupuesto ORDER BY categoria_id ASC',
    );
  } catch (error) {
    console.error('[db] getPresupuestos falló', error);
    return [];
  }
}

/**
 * Define o actualiza el tope mensual de una categoría (upsert). Se apoya en
 * UNIQUE(categoria_id): ON CONFLICT actualiza el monto en vez de duplicar.
 */
export async function upsertPresupuesto(
  categoria_id: number,
  monto_mensual: number,
): Promise<void> {
  const db = await initDB();
  await db.runAsync(
    `INSERT INTO presupuesto (categoria_id, monto_mensual)
     VALUES (?, ?)
     ON CONFLICT(categoria_id) DO UPDATE SET monto_mensual = excluded.monto_mensual`,
    categoria_id,
    monto_mensual,
  );
}
