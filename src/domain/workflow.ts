import { ROLES, type OtEstado, type Role } from './types'

/**
 * Máquina de estados de la orden de trabajo.
 *
 * Cada transición declara qué roles pueden ejecutarla. La misma tabla alimenta
 * la UI (qué botones se muestran) y la API simulada (qué transiciones acepta),
 * de modo que no puedan divergir.
 */
export interface Transicion {
  desde: OtEstado
  hasta: OtEstado
  /** Texto del botón que dispara la transición. */
  accion: string
  roles: readonly Role[]
  /** Obliga a escribir una nota antes de confirmar. */
  requiereNota?: boolean
  intencion: 'avanzar' | 'destructiva'
}

const { jefeTaller, tecnico, recepcion } = ROLES

export const TRANSICIONES: readonly Transicion[] = [
  {
    desde: 'recepcionada',
    hasta: 'cotizada',
    accion: 'Enviar cotización',
    roles: [jefeTaller, recepcion],
    intencion: 'avanzar',
  },
  {
    desde: 'cotizada',
    hasta: 'aprobada',
    accion: 'Registrar aprobación',
    roles: [jefeTaller, recepcion],
    intencion: 'avanzar',
  },
  {
    desde: 'aprobada',
    hasta: 'en_ejecucion',
    accion: 'Iniciar trabajo',
    roles: [jefeTaller, tecnico],
    intencion: 'avanzar',
  },
  {
    desde: 'en_ejecucion',
    hasta: 'cerrada',
    accion: 'Cerrar orden',
    roles: [jefeTaller, tecnico],
    requiereNota: true,
    intencion: 'avanzar',
  },
  {
    desde: 'recepcionada',
    hasta: 'anulada',
    accion: 'Anular',
    roles: [jefeTaller],
    requiereNota: true,
    intencion: 'destructiva',
  },
  {
    desde: 'cotizada',
    hasta: 'anulada',
    accion: 'Anular',
    roles: [jefeTaller],
    requiereNota: true,
    intencion: 'destructiva',
  },
  {
    desde: 'aprobada',
    hasta: 'anulada',
    accion: 'Anular',
    roles: [jefeTaller],
    requiereNota: true,
    intencion: 'destructiva',
  },
]

/** Transiciones disponibles desde `estado` para `rol`. */
export function transicionesDisponibles(estado: OtEstado, rol: Role): Transicion[] {
  return TRANSICIONES.filter((t) => t.desde === estado && t.roles.includes(rol))
}

/** Valida una transición sin importar el rol (invariante del flujo). */
export function esTransicionValida(desde: OtEstado, hasta: OtEstado): boolean {
  return TRANSICIONES.some((t) => t.desde === desde && t.hasta === hasta)
}

/** Valida transición y autorización en un solo paso. */
export function puedeTransicionar(desde: OtEstado, hasta: OtEstado, rol: Role): boolean {
  return TRANSICIONES.some((t) => t.desde === desde && t.hasta === hasta && t.roles.includes(rol))
}

/** Estados en que la OT sigue consumiendo capacidad del taller. */
export const ESTADOS_ABIERTOS: readonly OtEstado[] = [
  'recepcionada',
  'cotizada',
  'aprobada',
  'en_ejecucion',
]

export function esEstadoAbierto(estado: OtEstado): boolean {
  return ESTADOS_ABIERTOS.includes(estado)
}
