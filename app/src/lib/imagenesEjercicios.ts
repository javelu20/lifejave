/**
 * Mapa ESTÁTICO slug → imagen de referencia del ejercicio.
 *
 * Gotcha de React Native: require() de un asset DEBE ser una cadena LITERAL en
 * tiempo de compilación (el bundler resuelve el path al empaquetar). Por eso NO
 * se puede hacer require(variable) ni require(nombreDelJson). La solución es este
 * mapa: cada entrada es un require() literal, y el player busca por slug.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * CÓMO AÑADIR UNA IMAGEN (2 pasos, sin tocar nada más):
 *   1. Copia el PNG a app/assets/ejercicios/ con EXACTAMENTE el nombre de archivo
 *      indicado abajo (es el slug + ".png"). El nombre debe coincidir carácter a
 *      carácter con la clave, o el require no la encontrará.
 *   2. DESCOMENTA su línea (quita el "// " del principio).
 * Mientras una línea siga comentada, ese ejercicio muestra el placeholder
 * "Imagen próximamente" y la app corre igual. Todo local, sin URLs remotas.
 *
 * Las 33 líneas están pre-escritas (una por archivo único). Los slugs se calculan
 * con slugify(nombre) (ver src/lib/gym.ts); ya vienen resueltos aquí.
 * ────────────────────────────────────────────────────────────────────────────
 */
import type { ImageSourcePropType } from 'react-native';

/** Clave = slugify(nombre del ejercicio). Valor = require() literal del asset. */
const IMAGENES_EJERCICIOS: Record<string, ImageSourcePropType> = {
  // ── PUSH A ──────────────────────────────────────────────────────────────
  'press-banca-con-barra': require('@/assets/ejercicios/press-banca-con-barra.png'),           // Press banca con barra
  'press-inclinado-con-mancuernas': require('@/assets/ejercicios/press-inclinado-con-mancuernas.png'), // Press inclinado con mancuernas
  'press-militar-sentado': require('@/assets/ejercicios/press-militar-sentado.png'),           // Press militar sentado
  'elevaciones-laterales': require('@/assets/ejercicios/elevaciones-laterales.png'),           // Elevaciones laterales (también en Push B)
  'press-frances-o-fondos': require('@/assets/ejercicios/press-frances-o-fondos.png'),         // Press francés o fondos
  'extension-triceps-en-polea': require('@/assets/ejercicios/extension-triceps-en-polea.png'), // Extensión tríceps en polea

  // ── PULL A ──────────────────────────────────────────────────────────────
  'dominadas-o-jalon-al-pecho': require('@/assets/ejercicios/dominadas-o-jalon-al-pecho.png'), // Dominadas o jalón al pecho
  'remo-con-barra': require('@/assets/ejercicios/remo-con-barra.png'),                         // Remo con barra
  'remo-en-polea-agarre-neutro': require('@/assets/ejercicios/remo-en-polea-agarre-neutro.png'), // Remo en polea (agarre neutro)
  'face-pull': require('@/assets/ejercicios/face-pull.png'),                                   // Face pull (también en Pull B)
  'curl-con-barra': require('@/assets/ejercicios/curl-con-barra.png'),                         // Curl con barra
  'curl-martillo': require('@/assets/ejercicios/curl-martillo.png'),                           // Curl martillo

  // ── LEGS A ──────────────────────────────────────────────────────────────
  'sentadilla-con-barra': require('@/assets/ejercicios/sentadilla-con-barra.png'),             // Sentadilla con barra
  'prensa-de-pierna': require('@/assets/ejercicios/prensa-de-pierna.png'),                     // Prensa de pierna
  'peso-muerto-rumano': require('@/assets/ejercicios/peso-muerto-rumano.png'),                 // Peso muerto rumano
  'extension-de-cuadriceps': require('@/assets/ejercicios/extension-de-cuadriceps.png'),       // Extensión de cuádriceps (también en Legs B)
  'curl-femoral-tumbado': require('@/assets/ejercicios/curl-femoral-tumbado.png'),             // Curl femoral tumbado
  'elevacion-de-pantorrilla': require('@/assets/ejercicios/elevacion-de-pantorrilla.png'),     // Elevación de pantorrilla

  // ── PUSH B ──────────────────────────────────────────────────────────────
  'press-militar-con-barra': require('@/assets/ejercicios/press-militar-con-barra.png'),       // Press militar con barra
  'press-inclinado-con-barra': require('@/assets/ejercicios/press-inclinado-con-barra.png'),   // Press inclinado con barra
  'aperturas-en-polea-o-pec-deck': require('@/assets/ejercicios/aperturas-en-polea-o-pec-deck.png'), // Aperturas en polea o pec-deck
  //   (Elevaciones laterales → usa 'elevaciones-laterales', ya listada en Push A)
  'press-cerrado-con-barra': require('@/assets/ejercicios/press-cerrado-con-barra.png'),       // Press cerrado con barra
  'extension-sobre-la-cabeza-mancuerna': require('@/assets/ejercicios/extension-sobre-la-cabeza-mancuerna.png'), // Extensión sobre la cabeza (mancuerna)

  // ── PULL B ──────────────────────────────────────────────────────────────
  'jalon-agarre-ancho': require('@/assets/ejercicios/jalon-agarre-ancho.png'),                 // Jalón agarre ancho
  'remo-con-mancuerna-unilateral': require('@/assets/ejercicios/remo-con-mancuerna-unilateral.png'), // Remo con mancuerna (unilateral)
  'pull-over-en-polea': require('@/assets/ejercicios/pull-over-en-polea.png'),                 // Pull-over en polea
  //   (Face pull → usa 'face-pull', ya listada en Pull A)
  'curl-inclinado-con-mancuernas': require('@/assets/ejercicios/curl-inclinado-con-mancuernas.png'), // Curl inclinado con mancuernas
  'curl-predicador-o-concentrado': require('@/assets/ejercicios/curl-predicador-o-concentrado.png'), // Curl predicador o concentrado

  // ── LEGS B ──────────────────────────────────────────────────────────────
  'peso-muerto-rumano-pesado': require('@/assets/ejercicios/peso-muerto-rumano-pesado.png'),   // Peso muerto rumano (pesado)
  'sentadilla-bulgara-o-hack': require('@/assets/ejercicios/sentadilla-bulgara-o-hack.png'),   // Sentadilla búlgara o hack
  'hip-thrust': require('@/assets/ejercicios/hip-thrust.png'),                                 // Hip thrust
  'curl-femoral-sentado': require('@/assets/ejercicios/curl-femoral-sentado.png'),             // Curl femoral sentado
  //   (Extensión de cuádriceps → usa 'extension-de-cuadriceps', ya listada en Legs A)
  'elevacion-de-pantorrilla-sentado': require('@/assets/ejercicios/elevacion-de-pantorrilla-sentado.png'), // Elevación de pantorrilla sentado
};

/**
 * Devuelve la imagen del ejercicio si existe en el mapa, o null para que el
 * player muestre el placeholder temático. `slug` debe venir de slugify().
 */
export function getImagenEjercicio(slug: string): ImageSourcePropType | null {
  return IMAGENES_EJERCICIOS[slug] ?? null;
}
