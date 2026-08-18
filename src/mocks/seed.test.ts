import { describe, expect, it } from 'vitest'
import { generarDatos } from './seed'
import { EQUIPOS, FALLAS, type CategoriaEquipo } from './catalogos'
import { validarRut } from '@/lib/rut'
import { esTransicionValida } from '@/domain/workflow'
import { ROLES } from '@/domain/types'

const datos = generarDatos()

describe('determinismo', () => {
  it('produce el mismo conjunto con la misma semilla', () => {
    const otro = generarDatos()
    expect(otro.ordenes.map((o) => o.folio)).toEqual(datos.ordenes.map((o) => o.folio))
    expect(otro.clientes.map((c) => c.rut)).toEqual(datos.clientes.map((c) => c.rut))
  })

  it('produce un conjunto distinto con otra semilla', () => {
    const otro = generarDatos(999)
    expect(otro.clientes.map((c) => c.rut)).not.toEqual(datos.clientes.map((c) => c.rut))
  })
})

describe('clientes', () => {
  it('genera RUT válidos', () => {
    for (const cliente of datos.clientes) {
      expect(validarRut(cliente.rut), `${cliente.razonSocial}: ${cliente.rut}`).toBe(true)
    }
  })

  it('no repite RUT', () => {
    const ruts = datos.clientes.map((c) => c.rut)
    expect(new Set(ruts).size).toBe(ruts.length)
  })

  it('no repite el nombre base de la empresa', () => {
    // "Maderas Colcura S.A." y "Maderas Colcura Ltda." delatarían datos falsos.
    const bases = datos.clientes.map((c) => c.razonSocial.replace(/\s+(S\.A\.|SpA|Ltda\.|y Cía\. Ltda\.)$/, ''))
    expect(new Set(bases).size).toBe(bases.length)
  })

  it('asigna al menos un equipo a cada cliente', () => {
    for (const cliente of datos.clientes) {
      const equipos = datos.equipos.filter((e) => e.clienteId === cliente.id)
      expect(equipos.length, cliente.razonSocial).toBeGreaterThan(0)
    }
  })
})

describe('órdenes de trabajo', () => {
  it('no repite folios', () => {
    const folios = datos.ordenes.map((o) => o.folio)
    expect(new Set(folios).size).toBe(folios.length)
  })

  it('numera los folios correlativamente dentro de cada año', () => {
    const porAnio = new Map<string, number[]>()
    for (const orden of datos.ordenes) {
      const [, anio, numero] = orden.folio.split('-') as [string, string, string]
      porAnio.set(anio, [...(porAnio.get(anio) ?? []), Number(numero)])
    }

    for (const [anio, numeros] of porAnio) {
      const ordenados = [...numeros].sort((a, b) => a - b)
      expect(ordenados[0], `año ${anio}`).toBe(1)
      expect(ordenados.at(-1), `año ${anio}`).toBe(numeros.length)
    }
  })

  it('empareja cada falla con un equipo técnicamente compatible', () => {
    for (const orden of datos.ordenes) {
      const equipo = datos.equipos.find((e) => e.id === orden.equipoId)
      const definicion = EQUIPOS.find((e) => e.nombre === equipo?.nombre)
      const falla = FALLAS.find((f) => f.titulo === orden.titulo)

      expect(definicion, `equipo desconocido: ${equipo?.nombre}`).toBeDefined()
      expect(falla, `falla desconocida: ${orden.titulo}`).toBeDefined()

      if (falla?.categorias === null) continue

      const categorias: readonly CategoriaEquipo[] = definicion?.categorias ?? []
      const compatible = falla?.categorias.some((c) => categorias.includes(c))
      expect(compatible, `${equipo?.nombre} no puede sufrir "${orden.titulo}"`).toBe(true)
    }
  })

  it('el equipo pertenece siempre al cliente de la orden', () => {
    for (const orden of datos.ordenes) {
      const equipo = datos.equipos.find((e) => e.id === orden.equipoId)
      expect(equipo?.clienteId, orden.folio).toBe(orden.clienteId)
    }
  })

  it('solo asigna técnico desde que la orden fue aprobada', () => {
    for (const orden of datos.ordenes) {
      const requiereTecnico = ['aprobada', 'en_ejecucion', 'cerrada'].includes(orden.estado)
      if (requiereTecnico) {
        const tecnico = datos.usuarios.find((u) => u.id === orden.tecnicoId)
        expect(tecnico?.rol, orden.folio).toBe(ROLES.tecnico)
      } else {
        expect(orden.tecnicoId, orden.folio).toBeNull()
      }
    }
  })

  it('marca cerradaEn si y solo si la orden está cerrada', () => {
    for (const orden of datos.ordenes) {
      if (orden.estado === 'cerrada') expect(orden.cerradaEn, orden.folio).not.toBeNull()
      else expect(orden.cerradaEn, orden.folio).toBeNull()
    }
  })

  it('no cotiza órdenes recién recepcionadas', () => {
    for (const orden of datos.ordenes) {
      if (orden.estado === 'recepcionada') expect(orden.items, orden.folio).toHaveLength(0)
      else if (orden.estado !== 'anulada') expect(orden.items.length, orden.folio).toBeGreaterThan(0)
    }
  })
})

describe('bitácora', () => {
  it('termina siempre en el estado actual de la orden', () => {
    for (const orden of datos.ordenes) {
      expect(orden.eventos.at(-1)?.hasta, orden.folio).toBe(orden.estado)
    }
  })

  it('registra solo transiciones válidas de la máquina de estados', () => {
    for (const orden of datos.ordenes) {
      for (const evento of orden.eventos) {
        if (evento.desde === null) {
          expect(evento.hasta, orden.folio).toBe('recepcionada')
          continue
        }
        expect(
          esTransicionValida(evento.desde, evento.hasta),
          `${orden.folio}: ${evento.desde} -> ${evento.hasta}`,
        ).toBe(true)
      }
    }
  })

  it('mantiene los eventos en orden cronológico', () => {
    for (const orden of datos.ordenes) {
      const fechas = orden.eventos.map((e) => new Date(e.fecha).getTime())
      const ordenadas = [...fechas].sort((a, b) => a - b)
      expect(fechas, orden.folio).toEqual(ordenadas)
    }
  })

  it('no registra hitos con fecha futura', () => {
    // Un registro de auditoría con entradas futuras delata datos fabricados.
    const ahora = Date.now()
    for (const orden of datos.ordenes) {
      expect(new Date(orden.creadaEn).getTime(), orden.folio).toBeLessThanOrEqual(ahora)
      for (const evento of orden.eventos) {
        expect(
          new Date(evento.fecha).getTime(),
          `${orden.folio}: ${evento.hasta} el ${evento.fecha}`,
        ).toBeLessThanOrEqual(ahora)
      }
      if (orden.cerradaEn) {
        expect(new Date(orden.cerradaEn).getTime(), orden.folio).toBeLessThanOrEqual(ahora)
      }
    }
  })

  it('nunca abre una orden antes de su fecha de creación', () => {
    for (const orden of datos.ordenes) {
      expect(orden.eventos[0]?.fecha, orden.folio).toBe(orden.creadaEn)
    }
  })
})
