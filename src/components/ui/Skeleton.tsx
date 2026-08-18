import { cn } from '@/lib/cn'

/** Bloque de carga. El brillo se apaga solo si el sistema pide menos movimiento. */
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('animate-shimmer relative overflow-hidden rounded-md bg-slate-200', className)}
    />
  )
}

/** Filas de tabla en carga, para que el alto no salte cuando llegan los datos. */
export function SkeletonFilas({ filas = 6, columnas = 5 }: { filas?: number; columnas?: number }) {
  return (
    <>
      {Array.from({ length: filas }).map((_, i) => (
        <tr key={i} className="border-b border-slate-100">
          {Array.from({ length: columnas }).map((__, j) => (
            <td key={j} className="px-4 py-3.5">
              <Skeleton className={cn('h-4', j === 0 ? 'w-24' : 'w-full max-w-40')} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
