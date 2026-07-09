/**
 * Declaración de tipos mínima para react-test-renderer.
 *
 * Es una dependencia transitiva de jest-expo (ya instalada) que no trae tipos
 * propios y no existe @types oficial estable. En vez de añadir una dependencia
 * nueva, declaramos aquí lo poco que usan los tests (act + create). Zero deps.
 */
declare module 'react-test-renderer' {
  import type { ReactElement } from 'react';

  export function act(callback: () => void | Promise<void>): Promise<void>;
  export function create(element: ReactElement): unknown;
}
