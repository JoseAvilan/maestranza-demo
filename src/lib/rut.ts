/**
 * Utilidades de RUT chileno.
 *
 * El dígito verificador se calcula con módulo 11 y serie 2..7, según el
 * algoritmo del Registro Civil. Se acepta entrada con o sin puntos y guion.
 */

/** Deja solo dígitos y el verificador en mayúscula: "12.345.678-k" -> "12345678K". */
export function limpiarRut(valor: string): string {
  return valor.replace(/[^0-9kK]/g, '').toUpperCase()
}

/** Calcula el dígito verificador para un cuerpo numérico. */
export function calcularDv(cuerpo: string): string {
  let suma = 0
  let multiplicador = 2

  for (let i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo[i]) * multiplicador
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1
  }

  const resto = 11 - (suma % 11)
  if (resto === 11) return '0'
  if (resto === 10) return 'K'
  return String(resto)
}

/** Valida cuerpo + dígito verificador. Rechaza rangos absurdos. */
export function validarRut(valor: string): boolean {
  const limpio = limpiarRut(valor)
  if (limpio.length < 8 || limpio.length > 9) return false

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)

  if (!/^\d+$/.test(cuerpo)) return false
  if (Number(cuerpo) < 1_000_000) return false

  return calcularDv(cuerpo) === dv
}

/** Formatea a la convención local: "12345678K" -> "12.345.678-K". */
export function formatearRut(valor: string): string {
  const limpio = limpiarRut(valor)
  if (limpio.length < 2) return limpio

  const cuerpo = limpio.slice(0, -1)
  const dv = limpio.slice(-1)
  const conPuntos = cuerpo.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

  return `${conPuntos}-${dv}`
}

/** Genera un RUT válido a partir de un cuerpo, para los datos semilla. */
export function rutDesdeCuerpo(cuerpo: number): string {
  const texto = String(cuerpo)
  return formatearRut(texto + calcularDv(texto))
}
