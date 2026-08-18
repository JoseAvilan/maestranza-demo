import type { Cliente, Equipo, OrdenTrabajo, Usuario } from '@/domain/types'
import { generarDatos, type DatosSemilla } from './seed'

/**
 * Almacén en memoria que respalda la API simulada.
 *
 * Se hidrata desde localStorage para que los cambios sobrevivan a un refresco
 * —el visitante puede cerrar una OT, recargar y verla cerrada—, y se puede
 * reiniciar a la semilla desde la propia interfaz.
 *
 * localStorage y no IndexedDB porque el dataset son ~300 registros: cabe de
 * sobra y evita una capa asíncrona que no aportaría nada aquí.
 */

const CLAVE = 'maestranza:db:v1'

export interface EstadoDb extends DatosSemilla {
  version: number
}

/**
 * Se incrementa cuando cambia la forma del modelo o el generador de la semilla.
 * Así un visitante que vuelve no se queda con un dataset viejo en su navegador.
 */
const VERSION = 5

let memoria: EstadoDb | null = null

function crearEstado(): EstadoDb {
  return { ...generarDatos(), version: VERSION }
}

function leerDeStorage(): EstadoDb | null {
  try {
    const crudo = localStorage.getItem(CLAVE)
    if (!crudo) return null

    const parseado = JSON.parse(crudo) as EstadoDb
    // Un cambio de forma del modelo invalida lo guardado: se regenera.
    if (parseado.version !== VERSION) return null
    return parseado
  } catch {
    // Storage lleno, deshabilitado o JSON corrupto: se cae a la semilla.
    return null
  }
}

export function obtenerDb(): EstadoDb {
  if (!memoria) {
    memoria = leerDeStorage() ?? crearEstado()
  }
  return memoria
}

export function persistir(): void {
  if (!memoria) return
  try {
    localStorage.setItem(CLAVE, JSON.stringify(memoria))
  } catch {
    // Sin persistencia el demo sigue funcionando en memoria; no vale romper por esto.
  }
}

/** Vuelve a la semilla original. Lo usa el botón "Reiniciar datos demo". */
export function reiniciarDb(): EstadoDb {
  memoria = crearEstado()
  persistir()
  return memoria
}

export function buscarCliente(id: string): Cliente | undefined {
  return obtenerDb().clientes.find((c) => c.id === id)
}

export function buscarEquipo(id: string): Equipo | undefined {
  return obtenerDb().equipos.find((e) => e.id === id)
}

export function buscarUsuario(id: string | null): Usuario | undefined {
  if (!id) return undefined
  return obtenerDb().usuarios.find((u) => u.id === id)
}

export function buscarOrden(id: string): OrdenTrabajo | undefined {
  const db = obtenerDb()
  return db.ordenes.find((o) => o.id === id || o.folio === id)
}

/** Siguiente correlativo de folio para el año en curso. */
export function siguienteFolio(): string {
  const anio = new Date().getFullYear()
  const prefijo = `OT-${anio}-`
  const maximo = obtenerDb()
    .ordenes.filter((o) => o.folio.startsWith(prefijo))
    .reduce((acc, o) => Math.max(acc, Number(o.folio.slice(prefijo.length))), 0)

  return `${prefijo}${String(maximo + 1).padStart(4, '0')}`
}
