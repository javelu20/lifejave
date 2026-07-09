/**
 * Lógica pura del módulo Finanzas.
 *
 * Sin React ni SQLite: misma entrada => misma salida, fácil de testear.
 *
 * IMPORTANTE (zona horaria): el mes de un movimiento se determina LEYENDO el
 * string 'YYYY-MM-DD' (substring), NUNCA con new Date(), que parsea en UTC y
 * puede correr el día ±1. Los prefijos de mes se arman con padStart(2,'0') para
 * que coincidan con el mes de 2 dígitos guardado en la fecha.
 */
import type {
  Categoria,
  GastoCategoria,
  Movimiento,
  Presupuesto,
  PresupuestoReal,
  ResumenMes,
} from '@/src/models/finanzas';

/** Prefijo 'YYYY-MM' de un año/mes (mes 1..12), con el mes a 2 dígitos. */
export function prefijoMes(year: number, month: number): string {
  return `${year}-${String(month).padStart(2, '0')}`;
}

/** Mes actual LOCAL (getFullYear/getMonth). month en 1..12. */
export function mesActual(fecha: Date = new Date()): { year: number; month: number } {
  return { year: fecha.getFullYear(), month: fecha.getMonth() + 1 };
}

/**
 * Movimientos cuyo mes coincide con year/month, comparando el string
 * 'YYYY-MM-DD' por su prefijo (sin construir Date, sin corrimiento por UTC).
 */
export function filtrarPorMes(movs: Movimiento[], year: number, month: number): Movimiento[] {
  const prefijo = prefijoMes(year, month);
  return movs.filter((m) => m.fecha.slice(0, 7) === prefijo);
}

/**
 * Resumen del mes: ingresos y gastos como sumas por tipo, balance = ingresos −
 * gastos y tasa de ahorro = balance / ingresos × 100 (0 si no hubo ingresos).
 */
export function resumenMes(movs: Movimiento[]): ResumenMes {
  let ingresos = 0;
  let gastos = 0;
  for (const m of movs) {
    if (m.tipo === 'ingreso') ingresos += m.monto;
    else gastos += m.monto;
  }
  const balance = ingresos - gastos;
  const tasaAhorro = ingresos > 0 ? (balance / ingresos) * 100 : 0;
  return { ingresos, gastos, balance, tasaAhorro };
}

/**
 * Gasto por categoría: solo movimientos de tipo gasto, agrupados por
 * categoria_id, con % sobre el total de gastos y orden descendente por total.
 * Ignora gastos sin categoría o con categoría desconocida.
 */
export function gastoPorCategoria(
  movs: Movimiento[],
  categorias: Categoria[],
): GastoCategoria[] {
  const porId = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));

  const totales = new Map<number, number>();
  let totalGastos = 0;
  for (const m of movs) {
    if (m.tipo !== 'gasto' || m.categoria_id == null) continue;
    if (!porId.has(m.categoria_id)) continue;
    totales.set(m.categoria_id, (totales.get(m.categoria_id) ?? 0) + m.monto);
    totalGastos += m.monto;
  }

  const filas: GastoCategoria[] = [];
  for (const [id, total] of totales) {
    const categoria = porId.get(id)!;
    const porcentaje = totalGastos > 0 ? (total / totalGastos) * 100 : 0;
    filas.push({ categoria, total, porcentaje });
  }
  return filas.sort((a, b) => b.total - a.total);
}

/**
 * Presupuesto vs. real: por cada tope definido, cuánto se gastó ese mes en su
 * categoría y su estado. estado: 'ok' <90%, 'alerta' 90–100%, 'excedido' >100%.
 * Ordena por porcentaje descendente (lo más comprometido primero).
 */
export function presupuestoVsReal(
  movs: Movimiento[],
  presupuestos: Presupuesto[],
  categorias: Categoria[],
): PresupuestoReal[] {
  const porId = new Map<number, Categoria>(categorias.map((c) => [c.id, c]));

  const gastadoPorCat = new Map<number, number>();
  for (const m of movs) {
    if (m.tipo !== 'gasto' || m.categoria_id == null) continue;
    gastadoPorCat.set(m.categoria_id, (gastadoPorCat.get(m.categoria_id) ?? 0) + m.monto);
  }

  const filas: PresupuestoReal[] = [];
  for (const p of presupuestos) {
    const categoria = porId.get(p.categoria_id);
    if (!categoria) continue;
    const gastado = gastadoPorCat.get(p.categoria_id) ?? 0;
    const tope = p.monto_mensual;
    const porcentaje = tope > 0 ? (gastado / tope) * 100 : 0;
    const estado: PresupuestoReal['estado'] =
      porcentaje > 100 ? 'excedido' : porcentaje >= 90 ? 'alerta' : 'ok';
    filas.push({ categoria, gastado, tope, porcentaje, estado });
  }
  return filas.sort((a, b) => b.porcentaje - a.porcentaje);
}

/** Los `n` gastos más grandes del mes, de mayor a menor monto. */
export function topGastos(movs: Movimiento[], n = 5): Movimiento[] {
  return movs
    .filter((m) => m.tipo === 'gasto')
    .sort((a, b) => b.monto - a.monto)
    .slice(0, n);
}

/**
 * Formato boliviano: separador de miles con punto, sin decimales.
 * Ej. 3200 → "3.200 Bs", -750 → "-750 Bs".
 */
export function formatBs(n: number): string {
  const redondeado = Math.round(n);
  const signo = redondeado < 0 ? '-' : '';
  const entero = String(Math.abs(redondeado)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${signo}${entero} Bs`;
}
