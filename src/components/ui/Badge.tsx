import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type TonoBadge = 'neutro' | 'info' | 'exito' | 'alerta' | 'peligro' | 'marca'

const TONOS: Record<TonoBadge, string> = {
  neutro: 'bg-slate-100 text-slate-700 ring-slate-200',
  info: 'bg-sky-50 text-sky-700 ring-sky-200',
  exito: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  alerta: 'bg-amber-50 text-amber-800 ring-amber-200',
  peligro: 'bg-red-50 text-red-700 ring-red-200',
  marca: 'bg-brand-50 text-brand-800 ring-brand-200',
}

interface Props {
  tono?: TonoBadge
  children: ReactNode
  className?: string
}

export function Badge({ tono = 'neutro', children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset whitespace-nowrap',
        TONOS[tono],
        className,
      )}
    >
      {children}
    </span>
  )
}
