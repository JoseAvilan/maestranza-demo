import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

const CONTROL =
  'w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-300 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-brand-600 disabled:bg-slate-50 disabled:text-slate-500'

const CONTROL_ERROR = 'ring-red-400 focus:ring-red-500'

interface EnvoltorioProps {
  etiqueta: string
  error?: string
  ayuda?: string
  requerido?: boolean
  children: (id: string) => ReactNode
}

/** Etiqueta, control, texto de ayuda y error, con los `aria-*` correctamente enlazados. */
export function Field({ etiqueta, error, ayuda, requerido, children }: EnvoltorioProps) {
  const id = useId()

  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta}
        {requerido && <span className="ml-0.5 text-red-600">*</span>}
      </label>
      {children(id)}
      {error ? (
        <p id={`${id}-error`} role="alert" className="mt-1.5 text-sm text-red-600">
          {error}
        </p>
      ) : (
        ayuda && <p className="mt-1.5 text-sm text-slate-500">{ayuda}</p>
      )}
    </div>
  )
}

export function Input({
  className,
  invalido,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalido?: boolean }) {
  return <input {...props} className={cn(CONTROL, invalido && CONTROL_ERROR, className)} />
}

export function Textarea({
  className,
  invalido,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalido?: boolean }) {
  return <textarea {...props} className={cn(CONTROL, invalido && CONTROL_ERROR, className)} />
}

export function Select({
  className,
  invalido,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalido?: boolean }) {
  return (
    <select {...props} className={cn(CONTROL, 'pr-8', invalido && CONTROL_ERROR, className)}>
      {children}
    </select>
  )
}
