/**
 * Tests de la lógica pura de recetas.
 *
 * Imports relativos (no el alias @/*) para no depender de la config de módulos
 * del runner: la lib solo importa tipos, que se borran en runtime.
 *
 * IMPORTANTE: las fechas de prueba se construyen con `new Date(año, mesIndex,
 * día)` (constructor LOCAL). No usar strings ISO ("2026-07-13"): se parsean en
 * UTC y `getDay()` es local, lo que volvería el test flaky según la zona horaria.
 */
import recetasData from '../data/recetas.json';
import type { DiaSemana, RecetasData } from '../models/receta';
import { getComidasDelDia, getRecetaDelDia } from './recetas';

const data = recetasData as RecetasData;

// Julio 2026: el día 1 es miércoles. Elegimos una fecha por cada día de la
// semana y el nombre en español que le corresponde.
const CASOS_POR_DIA: { fecha: Date; dia: DiaSemana; getDay: number }[] = [
  { fecha: new Date(2026, 6, 6), dia: 'lunes', getDay: 1 },
  { fecha: new Date(2026, 6, 7), dia: 'martes', getDay: 2 },
  { fecha: new Date(2026, 6, 8), dia: 'miércoles', getDay: 3 },
  { fecha: new Date(2026, 6, 9), dia: 'jueves', getDay: 4 },
  { fecha: new Date(2026, 6, 10), dia: 'viernes', getDay: 5 },
  { fecha: new Date(2026, 6, 11), dia: 'sábado', getDay: 6 },
  { fecha: new Date(2026, 6, 12), dia: 'domingo', getDay: 0 },
];

describe('getRecetaDelDia', () => {
  it.each(CASOS_POR_DIA)(
    'devuelve la receta de $dia para esa fecha local',
    ({ fecha, dia, getDay }) => {
      // Guardia: confirma que la fecha construida cae en el día esperado.
      expect(fecha.getDay()).toBe(getDay);

      const receta = getRecetaDelDia(data.recetas, fecha);
      expect(receta).toBeDefined();
      expect(receta?.dia).toBe(dia);
    },
  );

  it('devuelve undefined cuando la lista de recetas está vacía', () => {
    expect(getRecetaDelDia([], new Date(2026, 6, 6))).toBeUndefined();
  });
});

describe('getComidasDelDia', () => {
  const fechaLunes = new Date(2026, 6, 6);

  it('la cena es la misma receta que el almuerzo (batch cooking)', () => {
    const comidas = getComidasDelDia(data, fechaLunes);
    expect(comidas).toBeDefined();
    expect(comidas?.cena).toBe(comidas?.almuerzo);
  });

  it('desayuno y snack provienen de comidas_fijas', () => {
    const comidas = getComidasDelDia(data, fechaLunes);
    expect(comidas?.desayuno).toEqual(data.comidas_fijas.desayuno);
    expect(comidas?.snack).toEqual(data.comidas_fijas.snack);
  });

  it('proteinaTotal_g es la suma de las 4 comidas (cena = almuerzo)', () => {
    const comidas = getComidasDelDia(data, fechaLunes);
    expect(comidas).toBeDefined();
    const esperado =
      comidas!.desayuno.proteina_g +
      comidas!.almuerzo.proteina_g +
      comidas!.cena.proteina_g +
      comidas!.snack.proteina_g;
    expect(comidas!.proteinaTotal_g).toBe(esperado);
  });

  it('devuelve undefined cuando no hay receta para ese día', () => {
    const sinRecetas: RecetasData = { ...data, recetas: [] };
    expect(getComidasDelDia(sinRecetas, fechaLunes)).toBeUndefined();
  });
});
