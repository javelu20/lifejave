/**
 * Mapa ESTÁTICO slug → imagen de referencia del ejercicio.
 *
 * Gotcha de React Native: require() de un asset DEBE ser una cadena LITERAL en
 * tiempo de compilación (el bundler resuelve el path al empaquetar). Por eso NO
 * se puede hacer require(variable) ni require(nombreDelJson). La solución es este
 * mapa: cada entrada es un require() literal, y el player busca por slug.
 *
 * Para AÑADIR una imagen:
 *  1. Copia el PNG a app/assets/ejercicios/ (p. ej. press-banca-con-barra.png).
 *  2. Añade una línea:  'press-banca-con-barra': require('@/assets/ejercicios/press-banca-con-barra.png'),
 *     donde la clave es slugify(nombreDelEjercicio) (ver src/lib/gym.ts).
 *
 * Empieza vacío: la app corre sin imágenes (el player muestra un placeholder) y
 * se van agregando PNGs + una línea aquí, offline y sin URLs remotas.
 */
import type { ImageSourcePropType } from 'react-native';

/**
 * Clave = slugify(nombre del ejercicio). Valor = require() literal del asset.
 * (Vacío por ahora; añade entradas a medida que consigas los PNGs.)
 */
const IMAGENES_EJERCICIOS: Record<string, ImageSourcePropType> = {
  // Clave = slugify('Press banca con barra'); coincide con el nombre del archivo.
  'press-banca-con-barra': require('@/assets/ejercicios/press-banca-con-barra.png'),
  // Clave = slugify('Press militar con barra'); primer ejercicio de Push B.
  'press-militar-con-barra': require('@/assets/ejercicios/press-militar-con-barra.png'),
};

/**
 * Devuelve la imagen del ejercicio si existe en el mapa, o null para que el
 * player muestre el placeholder temático. `slug` debe venir de slugify().
 */
export function getImagenEjercicio(slug: string): ImageSourcePropType | null {
  return IMAGENES_EJERCICIOS[slug] ?? null;
}
