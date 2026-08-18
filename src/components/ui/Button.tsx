import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro'
type Tamano = 'sm' | 'md'

const VARIANTES: Record<Variante, string> = {
  primario:
    'bg-brand-700 text-white hover:bg-brand-800 active:bg-brand-900 disabled:bg-brand-700/50 shadow-sm',
  secundario:
    'bg-white text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 active:bg-slate-100 shadow-sm',
  fantasma: 'text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  peligro: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
}

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
}

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante
  tamano?: Tamano
  cargando?: boolean
  iconoIzquierda?: ReactNode
}

export function Button({
  variante = 'primario',
  tamano = 'md',
  cargando = false,
  iconoIzquierda,
  className,
  children,
  disabled,
  ...props
}: Props) {
  return (
    <button
      {...props}
      disabled={disabled || cargando}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-medium transition-colors',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTES[variante],
        TAMANOS[tamano],
        className,
      )}
    >
      {cargando ? <Loader2 className="size-4 animate-spin" aria-hidden /> : iconoIzquierda}
      {children}
    </button>
  )
}
