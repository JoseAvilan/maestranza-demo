/**
 * Modelo de dominio de Maestranza.
 *
 * Sin `enum`: el tsconfig usa `erasableSyntaxOnly`, así que los conjuntos
 * cerrados se expresan como objetos `as const` + unión derivada. Además esto
 * mantiene los valores serializables tal cual viajan por la API.
 */

export const ROLES = {
  jefeTaller: 'jefe_taller',
  tecnico: 'tecnico',
  recepcion: 'recepcion',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABEL: Record<Role, string> = {
  jefe_taller: 'Jefe de taller',
  tecnico: 'Técnico',
  recepcion: 'Recepción',
}

export interface Usuario {
  id: string
  nombre: string
  email: string
  rol: Role
  iniciales: string
}

export interface Cliente {
  id: string
  razonSocial: string
  rut: string
  giro: string
  contactoNombre: string
  contactoEmail: string
  contactoTelefono: string
  direccion: string
  comuna: string
  creadoEn: string
}

export interface Equipo {
  id: string
  clienteId: string
  nombre: string
  marca: string
  modelo: string
  numeroSerie: string
}

/** Estados de la orden de trabajo, en orden de avance del flujo. */
export const OT_ESTADOS = [
  'recepcionada',
  'cotizada',
  'aprobada',
  'en_ejecucion',
  'cerrada',
  'anulada',
] as const

export type OtEstado = (typeof OT_ESTADOS)[number]

export const OT_ESTADO_LABEL: Record<OtEstado, string> = {
  recepcionada: 'Recepcionada',
  cotizada: 'Cotizada',
  aprobada: 'Aprobada',
  en_ejecucion: 'En ejecución',
  cerrada: 'Cerrada',
  anulada: 'Anulada',
}

export const OT_PRIORIDADES = ['baja', 'normal', 'alta', 'critica'] as const
export type OtPrioridad = (typeof OT_PRIORIDADES)[number]

export const OT_PRIORIDAD_LABEL: Record<OtPrioridad, string> = {
  baja: 'Baja',
  normal: 'Normal',
  alta: 'Alta',
  critica: 'Crítica',
}

/** Entrada de bitácora: toda transición de estado deja rastro auditable. */
export interface OtEvento {
  id: string
  fecha: string
  autorNombre: string
  autorRol: Role
  desde: OtEstado | null
  hasta: OtEstado
  nota: string
}

export interface OtItem {
  id: string
  descripcion: string
  cantidad: number
  /** Precio unitario neto en pesos chilenos, sin IVA. */
  precioUnitario: number
  tipo: 'repuesto' | 'servicio'
}

export interface OrdenTrabajo {
  id: string
  /** Folio legible por humanos, p. ej. OT-2026-0184. */
  folio: string
  clienteId: string
  equipoId: string
  tecnicoId: string | null
  estado: OtEstado
  prioridad: OtPrioridad
  titulo: string
  descripcionFalla: string
  items: OtItem[]
  /** Fecha comprometida de entrega al cliente. */
  fechaCompromiso: string
  creadaEn: string
  cerradaEn: string | null
  eventos: OtEvento[]
}

/** OT con las entidades relacionadas ya resueltas, tal como la sirve la API. */
export interface OrdenTrabajoDetalle extends OrdenTrabajo {
  cliente: Cliente
  equipo: Equipo
  tecnico: Usuario | null
  neto: number
  iva: number
  total: number
}

export interface KpiResumen {
  otAbiertas: number
  otAtrasadas: number
  /** Días promedio entre recepción y cierre, últimos 90 días. */
  tiempoCicloDias: number
  ingresosMes: number
  variacionIngresosPct: number
  porEstado: { estado: OtEstado; label: string; cantidad: number }[]
  ingresosMensuales: { mes: string; label: string; total: number }[]
  cargaTecnicos: { tecnicoId: string; nombre: string; abiertas: number }[]
}
