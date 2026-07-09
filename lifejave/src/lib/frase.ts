/**
 * Selección determinista de la "frase del día".
 *
 * Regla: el mismo día (en HORA LOCAL del dispositivo) siempre devuelve la misma
 * frase, y cambia a medianoche local (no a medianoche UTC). Así en Bolivia
 * (UTC-4) la frase cambia a las 00:00 hora boliviana, no a las 20:00.
 *
 * Función pura: misma `fecha` + mismas `frases` => mismo resultado.
 */
/** Se muestra cuando aún no hay frases cargadas (evita `undefined`). */
const FRASE_POR_DEFECTO = 'Hoy es un buen día para empezar.';

export function getFraseDelDia(frases: string[], fecha: Date = new Date()): string {
  // Sin frases no hay nada que indexar (evita `diaDelAnio % 0 = NaN`).
  if (frases.length === 0) {
    return FRASE_POR_DEFECTO;
  }

  // "Día del año" calculado en hora local. `new Date(anio, 0, 0)` es el día 0
  // (31 de diciembre del año anterior) a medianoche LOCAL, por eso restar da el
  // número de día 1..366 respetando la zona horaria del dispositivo.
  const inicio = new Date(fecha.getFullYear(), 0, 0);
  const diaDelAnio = Math.floor((fecha.getTime() - inicio.getTime()) / 86400000);

  const indice = diaDelAnio % frases.length;
  return frases[indice];
}

// TODO (fuera de alcance del MVP): botón "otra frase" (aleatoria sin romper la
// del día), marcar favoritas (SQLite), notificación diaria a hora fija.
