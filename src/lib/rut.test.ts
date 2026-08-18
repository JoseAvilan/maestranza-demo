import { describe, expect, it } from 'vitest'
import { calcularDv, formatearRut, limpiarRut, rutDesdeCuerpo, validarRut } from './rut'

describe('calcularDv', () => {
  // RUT de control ampliamente conocidos, útiles para verificar el algoritmo
  // contra una fuente externa y no solo contra sí mismo.
  it('calcula el dígito verificador numérico', () => {
    expect(calcularDv('12345678')).toBe('5')
    expect(calcularDv('11111111')).toBe('1')
    expect(calcularDv('22222222')).toBe('2')
    expect(calcularDv('7654321')).toBe('6')
  })

  it('devuelve K cuando el resto es 10', () => {
    expect(calcularDv('16000004')).toBe('K')
  })

  it('devuelve 0 cuando el resto es 11', () => {
    expect(calcularDv('16000009')).toBe('0')
  })
})

describe('validarRut', () => {
  it('acepta un RUT correcto en cualquier formato', () => {
    expect(validarRut('12.345.678-5')).toBe(true)
    expect(validarRut('12345678-5')).toBe(true)
    expect(validarRut('123456785')).toBe(true)
  })

  it('acepta el verificador K en minúscula', () => {
    expect(validarRut('16.000.004-k')).toBe(true)
  })

  it('rechaza un dígito verificador equivocado', () => {
    expect(validarRut('12.345.678-9')).toBe(false)
  })

  it('rechaza entradas fuera de rango o con basura', () => {
    expect(validarRut('')).toBe(false)
    expect(validarRut('1-9')).toBe(false)
    expect(validarRut('999.999-9')).toBe(false)
    expect(validarRut('1234567890123')).toBe(false)
  })
})

describe('formatearRut', () => {
  it('aplica puntos y guion', () => {
    expect(formatearRut('123456785')).toBe('12.345.678-5')
    expect(formatearRut('16000004K')).toBe('16.000.004-K')
  })

  it('normaliza un RUT que ya venía formateado', () => {
    expect(formatearRut('12.345.678-5')).toBe('12.345.678-5')
  })
})

describe('limpiarRut', () => {
  it('deja solo dígitos y verificador en mayúscula', () => {
    expect(limpiarRut('12.345.678-k')).toBe('12345678K')
  })
})

describe('rutDesdeCuerpo', () => {
  it('genera RUT válidos y formateados, como los usa la semilla', () => {
    for (const cuerpo of [76000000, 77123456, 78999999, 16000004, 16000009]) {
      const rut = rutDesdeCuerpo(cuerpo)
      expect(validarRut(rut), `${cuerpo} -> ${rut}`).toBe(true)
    }
  })
})
