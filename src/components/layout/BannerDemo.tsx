import { useState } from 'react'
import { Info, X } from 'lucide-react'

/**
 * Aviso permanente de que esto es una demostración. Se puede ocultar, pero no
 * se recuerda entre sesiones a propósito: cada visitante nuevo debe verlo.
 */
export function BannerDemo() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div className="bg-shell-800 text-slate-200">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-2.5 px-4 py-2 text-xs sm:px-6 lg:px-8">
        <Info className="size-4 shrink-0 text-brand-400" aria-hidden />
        <p className="flex-1 leading-relaxed">
          Demostración de portafolio. Empresas, personas, RUT y montos son ficticios; los datos se
          generan en tu navegador y no salen de él.
        </p>
        <button
          type="button"
          onClick={() => setVisible(false)}
          aria-label="Ocultar aviso"
          className="-m-1 rounded p-1 text-slate-400 transition-colors hover:text-white"
        >
          <X className="size-4" aria-hidden />
        </button>
      </div>
    </div>
  )
}
