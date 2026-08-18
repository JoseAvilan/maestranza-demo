import { Link } from 'react-router-dom'
import { FileQuestion } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'

export function NoEncontradaPage() {
  return (
    <Card>
      <EmptyState
        icono={<FileQuestion className="size-5" aria-hidden />}
        titulo="Esta página no existe"
        descripcion="La dirección que abriste no corresponde a ninguna sección del sistema."
        accion={
          <Link
            to="/ordenes"
            className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset transition-colors hover:bg-slate-50"
          >
            Ir a órdenes de trabajo
          </Link>
        }
      />
    </Card>
  )
}
