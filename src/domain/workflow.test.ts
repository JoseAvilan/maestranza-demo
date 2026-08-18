import { describe, expect, it } from 'vitest'
import {
  ESTADOS_ABIERTOS,
  TRANSICIONES,
  esEstadoAbierto,
  esTransicionValida,
  puedeTransicionar,
  transicionesDisponibles,
} from './workflow'
import { OT_ESTADOS, ROLES, type OtEstado } from './types'

describe('esTransicionValida', () => {
  it('acepta el avance normal del flujo', () => {
    expect(esTransicionValida('recepcionada', 'cotizada')).toBe(true)
    expect(esTransicionValida('cotizada', 'aprobada')).toBe(true)
    expect(esTransicionValida('aprobada', 'en_ejecucion')).toBe(true)
    expect(esTransicionValida('en_ejecucion', 'cerrada')).toBe(true)
  })

  it('no permite saltarse etapas', () => {
    expect(esTransicionValida('recepcionada', 'cerrada')).toBe(false)
    expect(esTransicionValida('cotizada', 'en_ejecucion')).toBe(false)
  })

  it('no permite retroceder', () => {
    expect(esTransicionValida('cerrada', 'en_ejecucion')).toBe(false)
    expect(esTransicionValida('aprobada', 'cotizada')).toBe(false)
  })

  it('deja los estados terminales sin salida', () => {
    const terminales: OtEstado[] = ['cerrada', 'anulada']
    for (const desde of terminales) {
      for (const hasta of OT_ESTADOS) {
        expect(esTransicionValida(desde, hasta), `${desde} -> ${hasta}`).toBe(false)
      }
    }
  })
})

describe('puedeTransicionar', () => {
  it('deja al técnico ejecutar y cerrar, pero no cotizar', () => {
    expect(puedeTransicionar('aprobada', 'en_ejecucion', ROLES.tecnico)).toBe(true)
    expect(puedeTransicionar('en_ejecucion', 'cerrada', ROLES.tecnico)).toBe(true)
    expect(puedeTransicionar('recepcionada', 'cotizada', ROLES.tecnico)).toBe(false)
  })

  it('deja a recepción cotizar y registrar aprobaciones, pero no iniciar el trabajo', () => {
    expect(puedeTransicionar('recepcionada', 'cotizada', ROLES.recepcion)).toBe(true)
    expect(puedeTransicionar('cotizada', 'aprobada', ROLES.recepcion)).toBe(true)
    expect(puedeTransicionar('aprobada', 'en_ejecucion', ROLES.recepcion)).toBe(false)
  })

  it('reserva la anulación al jefe de taller', () => {
    expect(puedeTransicionar('cotizada', 'anulada', ROLES.jefeTaller)).toBe(true)
    expect(puedeTransicionar('cotizada', 'anulada', ROLES.recepcion)).toBe(false)
    expect(puedeTransicionar('cotizada', 'anulada', ROLES.tecnico)).toBe(false)
  })
})

describe('transicionesDisponibles', () => {
  it('el jefe de taller ve avanzar y anular en un estado intermedio', () => {
    const acciones = transicionesDisponibles('cotizada', ROLES.jefeTaller)
    expect(acciones.map((a) => a.hasta).sort()).toEqual(['anulada', 'aprobada'])
  })

  it('no ofrece acciones sobre una orden cerrada', () => {
    for (const rol of Object.values(ROLES)) {
      expect(transicionesDisponibles('cerrada', rol)).toEqual([])
    }
  })
})

describe('invariantes del flujo', () => {
  it('toda transición exige al menos un rol autorizado', () => {
    for (const transicion of TRANSICIONES) {
      expect(transicion.roles.length, `${transicion.desde} -> ${transicion.hasta}`).toBeGreaterThan(0)
    }
  })

  it('el cierre y la anulación siempre piden nota de bitácora', () => {
    const criticas = TRANSICIONES.filter((t) => t.hasta === 'cerrada' || t.hasta === 'anulada')
    expect(criticas.length).toBeGreaterThan(0)
    for (const transicion of criticas) {
      expect(transicion.requiereNota, `${transicion.desde} -> ${transicion.hasta}`).toBe(true)
    }
  })

  it('los estados abiertos son exactamente los no terminales', () => {
    expect(esEstadoAbierto('cerrada')).toBe(false)
    expect(esEstadoAbierto('anulada')).toBe(false)
    for (const estado of ESTADOS_ABIERTOS) {
      expect(esEstadoAbierto(estado)).toBe(true)
    }
  })
})
