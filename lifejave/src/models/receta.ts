/**
 * Tipos del módulo Recetas semanales.
 * Datos fijos (semilla) en src/data/recetas.json, sin base de datos.
 * Ver ARQUITECTURA.md / RECETAS.md.
 */

/** Un ingrediente de una receta. `cantidad` puede venir vacía cuando el doc no la precisa. */
export type Ingrediente = {
  item: string;
  cantidad: string;
};

/** Día de la semana en español, en minúscula, tal como aparece en el JSON. */
export type DiaSemana =
  | 'domingo'
  | 'lunes'
  | 'martes'
  | 'miércoles'
  | 'jueves'
  | 'viernes'
  | 'sábado';

/** Plato principal del día (almuerzo/cena). */
export type Receta = {
  dia: DiaSemana;
  nombre: string;
  ingredientes: Ingrediente[];
  pasos: string[];
  kcal: number;
  proteina_g: number;
};

/**
 * Comida fija de todos los días (desayuno, snack, segunda comida).
 * El doc solo afirma nombre y proteína aproximada: sin kcal ni cantidades.
 */
export type ComidaFija = {
  nombre: string;
  proteina_g: number;
};

/** Las tres comidas fijas del módulo. */
export type ComidasFijas = {
  desayuno: ComidaFija;
  snack: ComidaFija;
  /** Alternativa de cena (se muestra como nota; la cena repite el almuerzo). */
  segunda_comida: ComidaFija;
};

/** Ítem de la lista de compras semanal (categoría asignada a mano). */
export type CategoriaCompra =
  | 'proteina'
  | 'carbohidrato'
  | 'verdura'
  | 'fruta'
  | 'lacteo'
  | 'otros';

export type ItemCompra = {
  item: string;
  cantidad: string;
  precio_bs: number;
  categoria: CategoriaCompra;
};

/** Las 4 comidas de un día ya resueltas, con el total de proteína. */
export type ComidasDelDia = {
  desayuno: ComidaFija;
  almuerzo: Receta;
  /** Misma receta que el almuerzo (batch cooking). */
  cena: Receta;
  snack: ComidaFija;
  proteinaTotal_g: number;
};

/** Forma completa de src/data/recetas.json. */
export type RecetasData = {
  comidas_fijas: ComidasFijas;
  recetas: Receta[];
  lista_compras: ItemCompra[];
};
