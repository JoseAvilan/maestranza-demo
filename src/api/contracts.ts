import type { OtEstado, OtPrioridad, Usuario } from '@/domain/types'

/** Contratos de request/response de la API. Compartidos entre el cliente y los handlers de MSW. */

export interface Paginado<T> {
  datos: T[]
  total: number
  pagina: number
  porPagina: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  usuario: Usuario
  token: string
}

export interface FiltroOrdenes {
  q?: string
  estado?: OtEstado | 'todas'
  prioridad?: OtPrioridad | 'todas'
  tecnicoId?: string
  soloAtrasadas?: boolean
  pagina?: number
  porPagina?: number
  orden?: 'recientes' | 'compromiso' | 'monto'
}

export interface TransicionRequest {
  hasta: OtEstado
  nota: string
}

export interface NuevaOrdenRequest {
  clienteId: string
  equipoId: string
  titulo: string
  descripcionFalla: string
  prioridad: OtPrioridad
  fechaCompromiso: string
}

export interface ApiError {
  mensaje: string
  campo?: string
}
