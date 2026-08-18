import type { ApiError } from './contracts'
import { usuarioActual } from '@/store/auth'

/**
 * Cliente HTTP mínimo.
 *
 * Es deliberadamente convencional: si mañana `/api` apunta a un servidor real,
 * este archivo no cambia. La identidad viaja en cabeceras, igual que lo haría
 * un token de sesión.
 */

export class ErrorApi extends Error {
  readonly status: number
  readonly campo?: string

  constructor(mensaje: string, status: number, campo?: string) {
    super(mensaje)
    this.name = 'ErrorApi'
    this.status = status
    this.campo = campo
  }
}

const BASE = '/api'

async function request<T>(ruta: string, init: RequestInit = {}): Promise<T> {
  const usuario = usuarioActual()

  const respuesta = await fetch(`${BASE}${ruta}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(usuario ? { 'x-usuario-id': usuario.id } : {}),
      ...init.headers,
    },
  })

  if (!respuesta.ok) {
    let mensaje = 'Ocurrió un error inesperado.'
    let campo: string | undefined

    try {
      const cuerpo = (await respuesta.json()) as ApiError
      mensaje = cuerpo.mensaje ?? mensaje
      campo = cuerpo.campo
    } catch {
      // Respuesta sin cuerpo JSON: se conserva el mensaje genérico.
    }

    throw new ErrorApi(mensaje, respuesta.status, campo)
  }

  if (respuesta.status === 204) return undefined as T
  return (await respuesta.json()) as T
}

export const api = {
  get: <T>(ruta: string) => request<T>(ruta),
  post: <T>(ruta: string, cuerpo?: unknown) =>
    request<T>(ruta, { method: 'POST', body: JSON.stringify(cuerpo ?? {}) }),
  patch: <T>(ruta: string, cuerpo: unknown) =>
    request<T>(ruta, { method: 'PATCH', body: JSON.stringify(cuerpo) }),
}

/** Construye un query string omitiendo valores vacíos. */
export function queryString(params: Record<string, string | number | boolean | undefined>): string {
  const sp = new URLSearchParams()
  for (const [clave, valor] of Object.entries(params)) {
    if (valor === undefined || valor === '' || valor === false) continue
    sp.set(clave, valor === true ? '1' : String(valor))
  }
  const texto = sp.toString()
  return texto ? `?${texto}` : ''
}
