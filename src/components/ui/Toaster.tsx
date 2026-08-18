import { useEffect } from 'react'
import { AlertTriangle, CheckCircle2, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useToasts, type Toast, type TipoToast } from './toast'

const ESTILOS: Record<TipoToast, { clase: string; icono: typeof Info }> = {
  exito: { clase: 'border-emerald-200 bg-emerald-50 text-emerald-900', icono: CheckCircle2 },
  error: { clase: 'border-red-200 bg-red-50 text-red-900', icono: AlertTriangle },
  info: { clase: 'border-slate-200 bg-white text-slate-900', icono: Info },
}

function Item({ toast: t }: { toast: Toast }) {
  const descartar = useToasts((s) => s.descartar)
  const { clase, icono: Icono } = ESTILOS[t.tipo]

  useEffect(() => {
    const temporizador = setTimeout(() => descartar(t.id), 4500)
    return () => clearTimeout(temporizador)
  }, [t.id, descartar])

  return (
    <div
      className={cn(
        'pointer-events-auto flex w-80 items-start gap-2.5 rounded-lg border px-3.5 py-3 shadow-lg',
        clase,
      )}
    >
      <Icono className="mt-0.5 size-4 shrink-0" aria-hidden />
      <p className="flex-1 text-sm">{t.mensaje}</p>
      <button
        type="button"
        onClick={() => descartar(t.id)}
        aria-label="Descartar"
        className="-m-1 rounded p-1 opacity-50 transition-opacity hover:opacity-100"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  )
}

export function Toaster() {
  const toasts = useToasts((s) => s.toasts)

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 bottom-4 z-50 flex flex-col gap-2"
    >
      {toasts.map((t) => (
        <Item key={t.id} toast={t} />
      ))}
    </div>
  )
}
