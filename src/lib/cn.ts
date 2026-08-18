import clsx, { type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/**
 * Une clases condicionales y resuelve los conflictos de Tailwind.
 *
 * El `twMerge` no es decorativo: en CSS gana la regla declarada más abajo en la
 * hoja, no la última del atributo `class`. Tailwind emite `.w-auto` antes que
 * `.w-full`, así que `cn('w-full', 'w-auto')` con solo `clsx` deja el elemento
 * al 100 %: exactamente el bug que apilaba los filtros del listado de órdenes.
 * `twMerge` descarta la clase perdedora y deja ganar a la última escrita, que
 * es lo que cualquiera espera al pasar `className` a un componente.
 */
export function cn(...values: ClassValue[]): string {
  return twMerge(clsx(values))
}
