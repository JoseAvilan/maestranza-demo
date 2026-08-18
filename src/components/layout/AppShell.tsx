import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ClipboardList, Factory, LayoutDashboard, Menu, Users, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useAuth } from '@/store/auth'
import { PERMISOS, tienePermiso, type Permiso } from '@/domain/permissions'
import { BarraSuperior } from './BarraSuperior'
import { BannerDemo } from './BannerDemo'

interface ItemNav {
  a: string
  etiqueta: string
  icono: typeof LayoutDashboard
  permiso?: Permiso
}

const NAVEGACION: ItemNav[] = [
  { a: '/', etiqueta: 'Panel', icono: LayoutDashboard, permiso: PERMISOS.verDashboard },
  { a: '/ordenes', etiqueta: 'Órdenes de trabajo', icono: ClipboardList },
  { a: '/clientes', etiqueta: 'Clientes', icono: Users, permiso: PERMISOS.gestionarClientes },
]

function Marca() {
  return (
    <div className="flex items-center gap-2.5 px-5 py-4">
      <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand-600">
        <Factory className="size-4.5 text-white" aria-hidden />
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-white">Maestranza</p>
        <p className="truncate text-xs text-slate-400">Gestión de taller</p>
      </div>
    </div>
  )
}

function Navegacion({ onNavegar }: { onNavegar?: () => void }) {
  const rol = useAuth((s) => s.usuario?.rol)
  if (!rol) return null

  const items = NAVEGACION.filter((item) => !item.permiso || tienePermiso(rol, item.permiso))

  return (
    <nav className="flex-1 space-y-0.5 px-3 py-2">
      {items.map(({ a, etiqueta, icono: Icono }) => (
        <NavLink
          key={a}
          to={a}
          end={a === '/'}
          onClick={onNavegar}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-shell-700 text-white'
                : 'text-slate-300 hover:bg-shell-800 hover:text-white',
            )
          }
        >
          <Icono className="size-4.5 shrink-0" aria-hidden />
          {etiqueta}
        </NavLink>
      ))}
    </nav>
  )
}

export function AppShell() {
  const [menuAbierto, setMenuAbierto] = useState(false)
  const location = useLocation()

  // Cerrar el cajón al navegar evita que quede tapando la pantalla en móvil.
  useEffect(() => {
    setMenuAbierto(false)
  }, [location.pathname])

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[16rem_1fr]">
      {/* Barra lateral fija en escritorio */}
      <aside className="bg-shell-900 hidden lg:flex lg:h-dvh lg:flex-col lg:sticky lg:top-0">
        <Marca />
        <Navegacion />
        <p className="px-5 py-4 text-xs leading-relaxed text-slate-500">
          Demo de portafolio.
          <br />
          Datos ficticios generados localmente.
        </p>
      </aside>

      {/* Cajón lateral en móvil */}
      {menuAbierto && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Cerrar menú"
            onClick={() => setMenuAbierto(false)}
            className="absolute inset-0 bg-slate-900/60"
          />
          <div className="bg-shell-900 relative flex h-full w-64 flex-col">
            <div className="flex items-center justify-between pr-3">
              <Marca />
              <button
                type="button"
                onClick={() => setMenuAbierto(false)}
                aria-label="Cerrar menú"
                className="rounded-md p-1.5 text-slate-400 hover:bg-shell-800 hover:text-white"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <Navegacion onNavegar={() => setMenuAbierto(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-col">
        <BannerDemo />
        <BarraSuperior
          botonMenu={
            <button
              type="button"
              onClick={() => setMenuAbierto(true)}
              aria-label="Abrir menú"
              className="rounded-md p-2 text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <Menu className="size-5" aria-hidden />
            </button>
          }
        />
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
