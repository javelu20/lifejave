/**
 * Lógica pura del módulo Recetas.
 *
 * Sin imports de React ni de plataforma: misma entrada => misma salida, fácil de
 * testear. La UI decide qué hacer con `undefined` (estado vacío), aquí no se
 * revienta ni se inventan datos.
 */
import type { ComidasDelDia, DiaSemana, Receta, RecetasData } from '@/src/models/receta';

/**
 * Mapa Date.getDay() (0=domingo … 6=sábado) → nombre de día en español, tal como
 * aparece en el campo `dia` del JSON.
 */
const DIAS_SEMANA: DiaSemana[] = [
  'domingo',
  'lunes',
  'martes',
  'miércoles',
  'jueves',
  'viernes',
  'sábado',
];

/**
 * Receta del día según el día de la semana LOCAL del dispositivo.
 * Devuelve `undefined` si no hay receta para ese día o la lista está vacía.
 */
export function getRecetaDelDia(
  recetas: Receta[],
  fecha: Date = new Date(),
): Receta | undefined {
  const dia = DIAS_SEMANA[fecha.getDay()];
  return recetas.find((receta) => receta.dia === dia);
}

/**
 * Las 4 comidas del día ya resueltas, con el total de proteína.
 * - desayuno y snack: comidas fijas del JSON.
 * - almuerzo: receta del día.
 * - cena: MISMA receta del día (batch cooking; ver segunda_comida como alternativa).
 * Si no hay receta para hoy, devuelve `undefined` (la UI muestra estado vacío).
 */
export function getComidasDelDia(
  data: RecetasData,
  fecha: Date = new Date(),
): ComidasDelDia | undefined {
  const receta = getRecetaDelDia(data.recetas, fecha);
  if (!receta) {
    return undefined;
  }

  const { desayuno, snack } = data.comidas_fijas;
  const proteinaTotal_g =
    desayuno.proteina_g + receta.proteina_g + receta.proteina_g + snack.proteina_g;

  return {
    desayuno,
    almuerzo: receta,
    cena: receta,
    snack,
    proteinaTotal_g,
  };
}

// TODO (fuera de alcance del MVP): rotación de menús / múltiples semanas,
// 7 cenas distintas (hoy la cena repite el almuerzo).
