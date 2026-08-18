import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Role, Usuario } from '@/domain/types'

/**
 * Sesión del demo.
 *
 * Persiste en localStorage para que un refresco no expulse al visitante. En un
 * sistema real el token sería un JWT emitido por el servidor y verificado en
 * cada petición; aquí es un identificador opaco que la API simulada usa para
 * saber quién actúa.
 */
interface EstadoAuth {
  usuario: Usuario | null
  token: string | null
  iniciarSesion: (usuario: Usuario, token: string) => void
  cerrarSesion: () => void
  /** Cambia de rol sin volver a autenticar: atajo pensado para el recorrido del demo. */
  cambiarUsuario: (usuario: Usuario) => void
}

export const useAuth = create<EstadoAuth>()(
  persist(
    (set) => ({
      usuario: null,
      token: null,
      iniciarSesion: (usuario, token) => set({ usuario, token }),
      cerrarSesion: () => set({ usuario: null, token: null }),
      cambiarUsuario: (usuario) => set({ usuario, token: `demo-${usuario.id}` }),
    }),
    { name: 'maestranza:sesion' },
  ),
)

/** Lectura fuera de React, para que el cliente HTTP pueda firmar las peticiones. */
export function usuarioActual(): Usuario | null {
  return useAuth.getState().usuario
}

export function rolActual(): Role | null {
  return useAuth.getState().usuario?.rol ?? null
}
