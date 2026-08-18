import clsx, { type ClassValue } from 'clsx'

/** Une clases condicionales. Alias corto usado por todos los componentes de UI. */
export function cn(...values: ClassValue[]): string {
  return clsx(values)
}
