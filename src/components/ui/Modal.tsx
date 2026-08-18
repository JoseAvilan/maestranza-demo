import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  abierto: boolean
  onCerrar: () => void
  titulo: string
  descripcion?: string
  children: ReactNode
  pie?: ReactNode
}

/**
 * Diálogo modal sobre `<dialog>` nativo: trae foco atrapado, cierre con Escape
 * y capa de fondo sin necesidad de una librería ni de gestionar el foco a mano.
 */
export function Modal({ abierto, onCerrar, titulo, descripcion, children, pie }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const dialogo = ref.current
    if (!dialogo) return

    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
      onClick={(e) => {
        // Clic en el backdrop: el target es el propio <dialog>, no su contenido.
        if (e.target === ref.current) onCerrar()
      }}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl p-0 shadow-xl backdrop:bg-slate-900/50 backdrop:backdrop-blur-[1px]"
    >
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">{titulo}</h2>
          {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-m-1 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <X className="size-5" aria-hidden />
        </button>
      </div>

      <div className="scrollbar-slim max-h-[60vh] overflow-y-auto px-5 py-4">{children}</div>

      {pie && (
        <div className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-3">
          {pie}
        </div>
      )}
    </dialog>
  )
}
