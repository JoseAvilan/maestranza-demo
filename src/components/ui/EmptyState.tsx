import type { ReactNode } from 'react'
import { Inbox } from 'lucide-react'

interface Props {
  titulo: string
  descripcion: string
  icono?: ReactNode
  accion?: ReactNode
}

export function EmptyState({ titulo, descripcion, icono, accion }: Props) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-slate-100 text-slate-400">
        {icono ?? <Inbox className="size-5" aria-hidden />}
      </div>
      <h3 className="text-sm font-semibold text-slate-900">{titulo}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-500">{descripcion}</p>
      {accion && <div className="mt-4">{accion}</div>}
    </div>
  )
}
