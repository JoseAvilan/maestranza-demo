import { CircleCheck } from 'lucide-react'
import { ROLE_LABEL, type OtEvento } from '@/domain/types'
import { OT_ESTADO_LABEL } from '@/domain/types'
import { formatearFechaHora } from '@/lib/format'

/**
 * Historial de la orden. Es de solo lectura a propósito: la trazabilidad de un
 * sistema de taller pierde todo valor si las entradas se pueden editar.
 */
export function Bitacora({ eventos }: { eventos: OtEvento[] }) {
  return (
    <ol className="relative space-y-5 px-5 py-4">
      {eventos.map((evento, indice) => (
        <li key={evento.id} className="relative flex gap-3">
          {/* Línea que conecta los hitos, salvo en el último. */}
          {indice < eventos.length - 1 && (
            <span className="absolute top-7 left-3 h-[calc(100%+0.5rem)] w-px bg-slate-200" aria-hidden />
          )}

          <span className="bg-brand-50 text-brand-700 relative flex size-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white">
            <CircleCheck className="size-4" aria-hidden />
          </span>

          <div className="min-w-0 flex-1 pb-1">
            <p className="text-sm text-slate-900">
              <span className="font-medium">{OT_ESTADO_LABEL[evento.hasta]}</span>
              {evento.desde && (
                <span className="text-slate-500"> · desde {OT_ESTADO_LABEL[evento.desde]}</span>
              )}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">
              {evento.autorNombre} ({ROLE_LABEL[evento.autorRol]}) · {formatearFechaHora(evento.fecha)}
            </p>
            {evento.nota && (
              <p className="mt-1.5 rounded-lg bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-700">
                {evento.nota}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  )
}
