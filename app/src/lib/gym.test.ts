/**
 * Tests de la lógica pura de gym.
 *
 * IMPORTANTE: las fechas se construyen con `new Date(año, mesIndex, día)`
 * (constructor LOCAL). No usar strings ISO ("2026-07-06"): se parsean en UTC y
 * getDay() es local, lo que volvería el test flaky según la zona horaria.
 *
 * Imports relativos (no el alias @/*) para no depender de la config de módulos
 * del runner: la lib solo importa tipos, que se borran en runtime.
 */
import type { TipoSesion } from '../models/gym';
import { epley, fechaLocalISO, getTipoSesionDelDia, labelSesion } from './gym';

describe('getTipoSesionDelDia', () => {
  // Julio 2026: día 5 = domingo, 6 = lunes … 11 = sábado. Un caso por día.
  const CASOS: { fecha: Date; getDay: number; esperado: TipoSesion | 'descanso' }[] = [
    { fecha: new Date(2026, 6, 6), getDay: 1, esperado: 'PushA' }, // lunes
    { fecha: new Date(2026, 6, 7), getDay: 2, esperado: 'PullA' }, // martes
    { fecha: new Date(2026, 6, 8), getDay: 3, esperado: 'LegsA' }, // miércoles
    { fecha: new Date(2026, 6, 9), getDay: 4, esperado: 'PushB' }, // jueves
    { fecha: new Date(2026, 6, 10), getDay: 5, esperado: 'PullB' }, // viernes
    { fecha: new Date(2026, 6, 11), getDay: 6, esperado: 'LegsB' }, // sábado
    { fecha: new Date(2026, 6, 12), getDay: 0, esperado: 'descanso' }, // domingo
  ];

  it.each(CASOS)(
    'getDay $getDay → $esperado',
    ({ fecha, getDay, esperado }) => {
      // Guardia: confirma que la fecha construida cae en el día esperado.
      expect(fecha.getDay()).toBe(getDay);
      expect(getTipoSesionDelDia(fecha)).toBe(esperado);
    },
  );

  it('el domingo es descanso', () => {
    expect(getTipoSesionDelDia(new Date(2026, 6, 12))).toBe('descanso');
  });
});

describe('labelSesion', () => {
  it('separa el sufijo A/B con espacio', () => {
    expect(labelSesion('PushA')).toBe('Push A');
    expect(labelSesion('PullB')).toBe('Pull B');
    expect(labelSesion('LegsB')).toBe('Legs B');
  });
});

describe('epley', () => {
  it('100 kg × 5 reps → 116.67 (redondeo a 2 decimales)', () => {
    expect(epley(100, 5)).toBe(116.67);
  });

  it('con 1 rep devuelve prácticamente el mismo peso', () => {
    // 100 × (1 + 1/30) = 103.333… → 103.33
    expect(epley(100, 1)).toBe(103.33);
  });

  it('con 0 reps devuelve el peso tal cual', () => {
    expect(epley(80, 0)).toBe(80);
  });
});

describe('fechaLocalISO', () => {
  it('formatea una fecha local conocida a YYYY-MM-DD', () => {
    // 9 de julio de 2026 (mesIndex 6). Con relleno de ceros en mes y día.
    expect(fechaLocalISO(new Date(2026, 6, 9))).toBe('2026-07-09');
  });

  it('rellena con cero mes y día de un solo dígito', () => {
    expect(fechaLocalISO(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('no se corre por UTC en horas cercanas a medianoche local', () => {
    // 23:30 local del 9 de julio: toISOString podría dar el día 10 en UTC+,
    // fechaLocalISO debe seguir siendo el 9.
    expect(fechaLocalISO(new Date(2026, 6, 9, 23, 30))).toBe('2026-07-09');
  });
});
