/**
 * Tipos del módulo Finanzas.
 *
 * Todo el historial vive en SQLite (tablas categoria, movimiento, presupuesto,
 * ver ARQUITECTURA.md → "Módulo Finanzas"). Las categorías de gasto son semilla
 * fija (FINANZAS.md); los ingresos no usan categoría, guardan `fuente` libre.
 *
 * Fechas: strings 'YYYY-MM-DD' locales (ver fechaLocalISO). El mes se determina
 * leyendo el string, nunca con new Date(), para no depender de la zona horaria.
 */

/** Un movimiento es una entrada de dinero ('ingreso') o una salida ('gasto'). */
export type TipoMovimiento = 'ingreso' | 'gasto';

/** Cómo se pagó un gasto. */
export type MetodoPago = 'efectivo' | 'qr' | 'tarjeta';

/** Estado de un presupuesto según cuánto se lleva gastado de su tope. */
export type EstadoPresupuesto = 'ok' | 'alerta' | 'excedido';

/** Una categoría de gasto (fila de la tabla `categoria`). */
export type Categoria = {
  id: number;
  nombre: string;
  icono?: string | null;
  tipo: TipoMovimiento; // FASE 1: todas las semilla son 'gasto'
};

/** Un movimiento registrado (fila de la tabla `movimiento`). */
export type Movimiento = {
  id: number;
  tipo: TipoMovimiento;
  monto: number; // en Bs
  fecha: string; // ISO local 'YYYY-MM-DD'
  categoria_id?: number | null; // obligatoria en gastos, null en ingresos
  fuente?: string | null; // libre en ingresos (sueldo, freelance…), null en gastos
  metodo_pago?: MetodoPago | null;
  recurrente: boolean; // se guarda como 0/1 en SQLite
  nota?: string | null;
};

/** Un tope mensual por categoría (fila de la tabla `presupuesto`). */
export type Presupuesto = {
  id: number;
  categoria_id: number;
  monto_mensual: number; // ej. Comida = 800
};

/**
 * Entrada para crear un movimiento (sin id). La `fecha` es OPCIONAL: si se omite
 * la capa de datos usa la fecha local de hoy (fechaLocalISO); si el usuario la
 * cambió en el formulario, se pasa aquí para que el movimiento caiga en su mes real.
 */
export type NuevoMovimiento = Omit<Movimiento, 'id' | 'fecha'> & { fecha?: string };

// ── Salidas de los reportes (lógica pura, no se guardan) ────────────────────

/** Resumen económico de un mes. */
export type ResumenMes = {
  ingresos: number;
  gastos: number;
  balance: number; // ingresos − gastos
  tasaAhorro: number; // balance / ingresos × 100 (0 si no hubo ingresos)
};

/** Cuánto se gastó en una categoría y qué porción del gasto total representa. */
export type GastoCategoria = {
  categoria: Categoria;
  total: number;
  porcentaje: number; // sobre el total de gastos del mes
};

/** Comparación de lo gastado contra el tope de una categoría. */
export type PresupuestoReal = {
  categoria: Categoria;
  gastado: number;
  tope: number;
  porcentaje: number; // gastado / tope × 100
  estado: EstadoPresupuesto; // ok <90% · alerta 90–100% · excedido >100%
};
