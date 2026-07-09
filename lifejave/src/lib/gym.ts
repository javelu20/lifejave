/**
 * Lógica pura del módulo Gym.
 *
 * Sin React ni SQLite: misma entrada => misma salida, fácil de testear.
 * Todo lo que dependa del día usa la hora LOCAL del dispositivo (getDay,
 * getFullYear/getMonth/getDate), nunca UTC (toISOString corre la fecha).
 */
import type { TipoSesion } from '@/src/models/gym';

/**
 * Sesión que toca según el día de la semana LOCAL (Date.getDay(): 0=dom … 6=sáb).
 * Lun→Push A, Mar→Pull A, Mié→Legs A, Jue→Push B, Vie→Pull B, Sáb→Legs B, Dom→descanso.
 * Índice 0 (domingo) es 'descanso'.
 */
const SESION_POR_DIA: (TipoSesion | 'descanso')[] = [
  'descanso', // 0 domingo
  'PushA', // 1 lunes
  'PullA', // 2 martes
  'LegsA', // 3 miércoles
  'PushB', // 4 jueves
  'PullB', // 5 viernes
  'LegsB', // 6 sábado
];

/** Tipo de sesión de hoy (o 'descanso' el domingo), según el día local. */
export function getTipoSesionDelDia(fecha: Date = new Date()): TipoSesion | 'descanso' {
  return SESION_POR_DIA[fecha.getDay()];
}

/** Etiqueta legible: 'PushA' → 'Push A', 'LegsB' → 'Legs B'. */
export function labelSesion(tipo: TipoSesion): string {
  return tipo.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * e1RM estimado con la fórmula de Epley: peso × (1 + reps/30).
 * Redondeado a 2 decimales. FASE 2 usará esto para PRs y progresión.
 */
export function epley(peso: number, reps: number): number {
  return Math.round(peso * (1 + reps / 30) * 100) / 100;
}

/**
 * Fecha local en formato 'YYYY-MM-DD', armada con getFullYear/getMonth/getDate.
 * NO usa toISOString (que convierte a UTC y puede correr el día ±1).
 */
export function fechaLocalISO(fecha: Date = new Date()): string {
  const anio = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${anio}-${mes}-${dia}`;
}

/**
 * Convierte el nombre de un ejercicio en un slug estable para buscar su imagen
 * en el mapa estático (ver src/lib/imagenesEjercicios.ts): minúsculas, sin
 * acentos, y todo lo no alfanumérico colapsado a guiones (sin guiones al borde).
 *
 * 'Press banca con barra'         → 'press-banca-con-barra'
 * 'Elevación de cuádriceps'       → 'elevacion-de-cuadriceps'
 * 'Remo en polea (agarre neutro)' → 'remo-en-polea-agarre-neutro'
 */
export function slugify(nombre: string): string {
  return nombre
    .normalize('NFD') // separa cada letra de su acento (é → e + combinante)
    .replace(/\p{Diacritic}/gu, '') // borra los diacríticos ya separados
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // cualquier no alfanumérico → guion
    .replace(/^-+|-+$/g, ''); // sin guiones sobrantes al principio/final
}
