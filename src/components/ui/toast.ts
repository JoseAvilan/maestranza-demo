import { create } from 'zustand'

/**
 * Estado de los avisos emergentes. Vive aparte del componente que los pinta
 * para que `toast.exito(...)` se pueda llamar desde cualquier parte, dentro o
 * fuera de React, sin arrastrar la vista.
 */

export type TipoToast = 'exito' | 'error' | 'info'

export interface Toast {
  id: number
  tipo: TipoToast
  mensaje: string
}

interface EstadoToasts {
  toasts: Toast[]
  emitir: (tipo: TipoToast, mensaje: string) => void
  descartar: (id: number) => void
}

export const useToasts = create<EstadoToasts>((set) => ({
  toasts: [],
  emitir: (tipo, mensaje) =>
    set((estado) => ({
      toasts: [...estado.toasts, { id: Date.now() + Math.random(), tipo, mensaje }],
    })),
  descartar: (id) => set((estado) => ({ toasts: estado.toasts.filter((t) => t.id !== id) })),
}))

/** API imperativa: `toast.exito('Guardado')`. */
export const toast = {
  exito: (mensaje: string) => useToasts.getState().emitir('exito', mensaje),
  error: (mensaje: string) => useToasts.getState().emitir('error', mensaje),
  info: (mensaje: string) => useToasts.getState().emitir('info', mensaje),
}
