import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from './Button'
import { formatearNumero } from '@/lib/format'

interface Props {
  pagina: number
  porPagina: number
  total: number
  onCambiar: (pagina: number) => void
}

export function Pagination({ pagina, porPagina, total, onCambiar }: Props) {
  const paginas = Math.max(1, Math.ceil(total / porPagina))
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1
  const hasta = Math.min(pagina * porPagina, total)

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 sm:flex-row">
      <p className="text-sm text-slate-600">
        Mostrando <span className="font-medium text-slate-900">{formatearNumero(desde)}</span>–
        <span className="font-medium text-slate-900">{formatearNumero(hasta)}</span> de{' '}
        <span className="font-medium text-slate-900">{formatearNumero(total)}</span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          variante="secundario"
          tamano="sm"
          disabled={pagina <= 1}
          onClick={() => onCambiar(pagina - 1)}
          iconoIzquierda={<ChevronLeft className="size-4" aria-hidden />}
        >
          Anterior
        </Button>
        <span className="px-1 text-sm text-slate-600">
          {pagina} / {paginas}
        </span>
        <Button
          variante="secundario"
          tamano="sm"
          disabled={pagina >= paginas}
          onClick={() => onCambiar(pagina + 1)}
        >
          Siguiente
          <ChevronRight className="size-4" aria-hidden />
        </Button>
      </div>
    </div>
  )
}
