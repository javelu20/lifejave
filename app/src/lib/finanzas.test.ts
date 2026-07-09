/**
 * Tests de la lógica pura de finanzas.
 *
 * IMPORTANTE (zona horaria): las fechas son strings 'YYYY-MM-DD' literales, tal
 * como se guardan en SQLite. filtrarPorMes debe separarlas leyendo el string
 * (substring), sin construir Date, así el filtro por mes no se corre por UTC.
 *
 * Imports relativos (no el alias @/*) para no depender de la config de módulos
 * del runner: la lib solo importa tipos, que se borran en runtime.
 */
import type { Categoria, Movimiento, Presupuesto } from '../models/finanzas';
import {
  filtrarPorMes,
  formatBs,
  gastoPorCategoria,
  presupuestoVsReal,
  resumenMes,
  topGastos,
} from './finanzas';

// Categorías de prueba (ids estables como el seed).
const COMIDA: Categoria = { id: 1, nombre: 'Comida', icono: '🛒', tipo: 'gasto' };
const TRANSPORTE: Categoria = { id: 4, nombre: 'Transporte', icono: '🚌', tipo: 'gasto' };
const OCIO: Categoria = { id: 7, nombre: 'Ocio', icono: '🎉', tipo: 'gasto' };
const CATEGORIAS = [COMIDA, TRANSPORTE, OCIO];

/** Constructor de movimientos con defaults; se sobreescribe lo relevante. */
function mov(p: Partial<Movimiento>): Movimiento {
  return {
    id: p.id ?? 0,
    tipo: p.tipo ?? 'gasto',
    monto: p.monto ?? 0,
    fecha: p.fecha ?? '2026-07-01',
    categoria_id: p.categoria_id ?? null,
    fuente: p.fuente ?? null,
    metodo_pago: p.metodo_pago ?? null,
    recurrente: p.recurrente ?? false,
    nota: p.nota ?? null,
  };
}

describe('resumenMes', () => {
  it('calcula ingresos, gastos, balance y tasa de ahorro con datos conocidos', () => {
    const movs = [
      mov({ id: 1, tipo: 'ingreso', monto: 3200, fuente: 'sueldo' }),
      mov({ id: 2, tipo: 'gasto', monto: 2000, categoria_id: 1 }),
      mov({ id: 3, tipo: 'gasto', monto: 450, categoria_id: 4 }),
    ];
    const r = resumenMes(movs);
    expect(r.ingresos).toBe(3200);
    expect(r.gastos).toBe(2450);
    expect(r.balance).toBe(750);
    expect(r.tasaAhorro).toBeCloseTo((750 / 3200) * 100, 5); // ≈ 23.4375%
  });

  it('tasa de ahorro es 0 si no hubo ingresos (no divide por cero)', () => {
    const r = resumenMes([mov({ tipo: 'gasto', monto: 100, categoria_id: 1 })]);
    expect(r.ingresos).toBe(0);
    expect(r.balance).toBe(-100);
    expect(r.tasaAhorro).toBe(0);
  });
});

describe('gastoPorCategoria', () => {
  const movs = [
    mov({ id: 1, tipo: 'gasto', monto: 600, categoria_id: 1 }), // Comida
    mov({ id: 2, tipo: 'gasto', monto: 300, categoria_id: 4 }), // Transporte
    mov({ id: 3, tipo: 'gasto', monto: 100, categoria_id: 7 }), // Ocio
    mov({ id: 4, tipo: 'ingreso', monto: 5000, fuente: 'sueldo' }), // no cuenta
  ];

  it('ordena descendente por total', () => {
    const filas = gastoPorCategoria(movs, CATEGORIAS);
    expect(filas.map((f) => f.categoria.id)).toEqual([1, 4, 7]);
    expect(filas[0].total).toBe(600);
  });

  it('los porcentajes suman ~100', () => {
    const filas = gastoPorCategoria(movs, CATEGORIAS);
    const suma = filas.reduce((acc, f) => acc + f.porcentaje, 0);
    expect(suma).toBeCloseTo(100, 5);
    // 600/1000 = 60%
    expect(filas[0].porcentaje).toBeCloseTo(60, 5);
  });
});

describe('presupuestoVsReal', () => {
  const presupuestos: Presupuesto[] = [
    { id: 1, categoria_id: 1, monto_mensual: 800 }, // Comida → ok
    { id: 2, categoria_id: 4, monto_mensual: 100 }, // Transporte → alerta
    { id: 3, categoria_id: 7, monto_mensual: 250 }, // Ocio → excedido
  ];
  const movs = [
    mov({ id: 1, tipo: 'gasto', monto: 620, categoria_id: 1 }), // 77.5%
    mov({ id: 2, tipo: 'gasto', monto: 95, categoria_id: 4 }), // 95%
    mov({ id: 3, tipo: 'gasto', monto: 310, categoria_id: 7 }), // 124%
  ];

  it('marca ok (<90%), alerta (90–100%) y excedido (>100%)', () => {
    const filas = presupuestoVsReal(movs, presupuestos, CATEGORIAS);
    const porCat = new Map(filas.map((f) => [f.categoria.id, f]));

    expect(porCat.get(1)!.estado).toBe('ok');
    expect(porCat.get(1)!.porcentaje).toBeCloseTo(77.5, 5);

    expect(porCat.get(4)!.estado).toBe('alerta');
    expect(porCat.get(4)!.porcentaje).toBeCloseTo(95, 5);

    expect(porCat.get(7)!.estado).toBe('excedido');
    expect(porCat.get(7)!.porcentaje).toBeCloseTo(124, 5);
  });
});

describe('filtrarPorMes', () => {
  const movs = [
    mov({ id: 1, fecha: '2026-07-01' }),
    mov({ id: 2, fecha: '2026-07-31' }),
    mov({ id: 3, fecha: '2026-06-30' }),
    mov({ id: 4, fecha: '2026-12-05' }),
    mov({ id: 5, fecha: '2025-07-15' }),
  ];

  it('separa por mes leyendo el string, con el mes a 2 dígitos', () => {
    // month=7 sin padding daría "2026-7" y no matchearía "2026-07-..".
    const julio = filtrarPorMes(movs, 2026, 7);
    expect(julio.map((m) => m.id).sort()).toEqual([1, 2]);
  });

  it('respeta el año (julio 2025 ≠ julio 2026)', () => {
    expect(filtrarPorMes(movs, 2025, 7).map((m) => m.id)).toEqual([5]);
  });

  it('diciembre (month=12) se lee correctamente', () => {
    expect(filtrarPorMes(movs, 2026, 12).map((m) => m.id)).toEqual([4]);
  });
});

describe('topGastos', () => {
  it('devuelve los gastos más grandes, de mayor a menor, ignorando ingresos', () => {
    const movs = [
      mov({ id: 1, tipo: 'gasto', monto: 50, categoria_id: 1 }),
      mov({ id: 2, tipo: 'gasto', monto: 500, categoria_id: 4 }),
      mov({ id: 3, tipo: 'ingreso', monto: 9999, fuente: 'sueldo' }),
      mov({ id: 4, tipo: 'gasto', monto: 200, categoria_id: 7 }),
    ];
    const top = topGastos(movs, 2);
    expect(top.map((m) => m.id)).toEqual([2, 4]);
  });
});

describe('formatBs', () => {
  it('usa el punto como separador de miles', () => {
    expect(formatBs(3200)).toBe('3.200 Bs');
  });

  it('formatea montos de varios tamaños', () => {
    expect(formatBs(0)).toBe('0 Bs');
    expect(formatBs(750)).toBe('750 Bs');
    expect(formatBs(1234567)).toBe('1.234.567 Bs');
  });

  it('conserva el signo en negativos', () => {
    expect(formatBs(-750)).toBe('-750 Bs');
  });
});
