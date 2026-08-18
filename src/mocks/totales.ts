import type { OrdenTrabajo } from '@/domain/types'
import { IVA } from '@/lib/format'

export interface Totales {
  neto: number
  iva: number
  total: number
}

/** Neto, IVA (19%) y total de una OT. El IVA se redondea al peso. */
export function calcularTotales(orden: Pick<OrdenTrabajo, 'items'>): Totales {
  const neto = orden.items.reduce((acc, item) => acc + item.cantidad * item.precioUnitario, 0)
  const iva = Math.round(neto * IVA)
  return { neto, iva, total: neto + iva }
}
