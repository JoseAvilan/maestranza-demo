import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

interface CardProps {
  children: ReactNode
  className?: string
}

export function Card({ children, className }: CardProps) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white shadow-sm', className)}>
      {children}
    </div>
  )
}

interface CardHeaderProps {
  titulo: string
  descripcion?: string
  accion?: ReactNode
}

export function CardHeader({ titulo, descripcion, accion }: CardHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold text-slate-900">{titulo}</h2>
        {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
      </div>
      {accion}
    </div>
  )
}

export function CardBody({ children, className }: CardProps) {
  return <div className={cn('px-5 py-4', className)}>{children}</div>
}
