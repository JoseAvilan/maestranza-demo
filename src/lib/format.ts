/** Formateo con convenciones chilenas: CLP sin decimales y fechas es-CL. */

const clp = new Intl.NumberFormat('es-CL', {
  style: 'currency',
  currency: 'CLP',
  maximumFractionDigits: 0,
})

const numero = new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 })

const fechaCorta = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
})

const fechaLarga = new Intl.DateTimeFormat('es-CL', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

export const IVA = 0.19

export function formatearCLP(monto: number): string {
  return clp.format(Math.round(monto))
}

export function formatearNumero(valor: number): string {
  return numero.format(valor)
}

export function formatearFecha(iso: string): string {
  return fechaCorta.format(new Date(iso))
}

export function formatearFechaHora(iso: string): string {
  return fechaLarga.format(new Date(iso))
}

/** Diferencia en días respecto a hoy: negativa si la fecha ya pasó. */
export function diasHasta(iso: string, referencia = new Date()): number {
  const msPorDia = 86_400_000
  const objetivo = new Date(iso)
  const a = Date.UTC(objetivo.getFullYear(), objetivo.getMonth(), objetivo.getDate())
  const b = Date.UTC(referencia.getFullYear(), referencia.getMonth(), referencia.getDate())
  return Math.round((a - b) / msPorDia)
}

/** "hace 3 días", "en 2 semanas". */
export function fechaRelativa(iso: string): string {
  const dias = diasHasta(iso)
  const rtf = new Intl.RelativeTimeFormat('es-CL', { numeric: 'auto' })

  if (Math.abs(dias) < 7) return rtf.format(dias, 'day')
  if (Math.abs(dias) < 30) return rtf.format(Math.round(dias / 7), 'week')
  return rtf.format(Math.round(dias / 30), 'month')
}

/** Quita tildes y diacríticos: "Concepción" -> "Concepcion". */
export function sinTildes(texto: string): string {
  return texto.normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function iniciales(nombre: string): string {
  return nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() ?? '')
    .join('')
}
