import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, queryString } from './client'
import type {
  FiltroOrdenes,
  LoginRequest,
  LoginResponse,
  NuevaOrdenRequest,
  Paginado,
  TransicionRequest,
} from './contracts'
import type {
  Cliente,
  Equipo,
  KpiResumen,
  OrdenTrabajo,
  OrdenTrabajoDetalle,
  Usuario,
} from '@/domain/types'

/** Claves de caché centralizadas: evita invalidaciones que no calzan por un typo. */
export const claves = {
  usuarios: ['usuarios'] as const,
  kpis: ['kpis'] as const,
  clientes: (filtro: { q: string; pagina: number }) => ['clientes', filtro] as const,
  cliente: (id: string) => ['cliente', id] as const,
  ordenes: (filtro: FiltroOrdenes) => ['ordenes', filtro] as const,
  orden: (id: string) => ['orden', id] as const,
}

export interface ClienteDetalle {
  cliente: Cliente
  equipos: Equipo[]
  ordenes: OrdenTrabajoDetalle[]
}

/* ------------------------------------------------------------------ auth */

export function useLogin() {
  return useMutation({
    mutationFn: (datos: LoginRequest) => api.post<LoginResponse>('/auth/login', datos),
  })
}

export function useUsuarios() {
  return useQuery({
    queryKey: claves.usuarios,
    queryFn: () => api.get<Usuario[]>('/usuarios'),
    staleTime: Infinity,
  })
}

/* -------------------------------------------------------------- clientes */

export function useClientes(q: string, pagina: number) {
  return useQuery({
    queryKey: claves.clientes({ q, pagina }),
    queryFn: () => api.get<Paginado<Cliente>>(`/clientes${queryString({ q, pagina })}`),
    placeholderData: (previo) => previo,
  })
}

/** Listado completo sin paginar, para poblar selectores. */
export function useClientesTodos() {
  return useQuery({
    queryKey: ['clientes', 'todos'],
    queryFn: () => api.get<Paginado<Cliente>>(`/clientes${queryString({ porPagina: 500 })}`),
    staleTime: 60_000,
    select: (respuesta) => respuesta.datos,
  })
}

export function useCliente(id: string | undefined) {
  return useQuery({
    queryKey: claves.cliente(id ?? ''),
    queryFn: () => api.get<ClienteDetalle>(`/clientes/${id}`),
    enabled: Boolean(id),
  })
}

export function useCrearCliente() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: Omit<Cliente, 'id' | 'creadoEn'>) => api.post<Cliente>('/clientes', datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clientes'] })
    },
  })
}

export function useActualizarCliente(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: Partial<Cliente>) => api.patch<Cliente>(`/clientes/${id}`, datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['clientes'] })
      void qc.invalidateQueries({ queryKey: claves.cliente(id) })
    },
  })
}

/* --------------------------------------------------------------- ordenes */

export function useOrdenes(filtro: FiltroOrdenes) {
  return useQuery({
    queryKey: claves.ordenes(filtro),
    queryFn: () =>
      api.get<Paginado<OrdenTrabajoDetalle>>(
        `/ordenes${queryString({
          q: filtro.q,
          estado: filtro.estado,
          prioridad: filtro.prioridad,
          tecnicoId: filtro.tecnicoId,
          soloAtrasadas: filtro.soloAtrasadas,
          pagina: filtro.pagina,
          porPagina: filtro.porPagina,
          orden: filtro.orden,
        })}`,
      ),
    // Mantener la página anterior visible evita el parpadeo al filtrar.
    placeholderData: (previo) => previo,
  })
}

export function useOrden(id: string | undefined) {
  return useQuery({
    queryKey: claves.orden(id ?? ''),
    queryFn: () => api.get<OrdenTrabajoDetalle>(`/ordenes/${id}`),
    enabled: Boolean(id),
  })
}

export function useCrearOrden() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: NuevaOrdenRequest) => api.post<OrdenTrabajoDetalle>('/ordenes', datos),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['ordenes'] })
      void qc.invalidateQueries({ queryKey: claves.kpis })
    },
  })
}

export function useTransicionOrden(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: TransicionRequest) =>
      api.post<OrdenTrabajoDetalle>(`/ordenes/${id}/transicion`, datos),
    onSuccess: (orden) => {
      qc.setQueryData(claves.orden(id), orden)
      void qc.invalidateQueries({ queryKey: ['ordenes'] })
      void qc.invalidateQueries({ queryKey: claves.kpis })
    },
  })
}

export function useActualizarOrden(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (datos: Partial<Pick<OrdenTrabajo, 'tecnicoId' | 'items' | 'prioridad' | 'fechaCompromiso'>>) =>
      api.patch<OrdenTrabajoDetalle>(`/ordenes/${id}`, datos),
    onSuccess: (orden) => {
      qc.setQueryData(claves.orden(id), orden)
      void qc.invalidateQueries({ queryKey: ['ordenes'] })
    },
  })
}

/* ------------------------------------------------------------------ kpis */

export function useKpis() {
  return useQuery({
    queryKey: claves.kpis,
    queryFn: () => api.get<KpiResumen>('/kpis'),
  })
}

/* ------------------------------------------------------------------ demo */

export function useReiniciarDemo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => api.post<{ ok: boolean }>('/demo/reset'),
    onSuccess: () => {
      void qc.invalidateQueries()
    },
  })
}
