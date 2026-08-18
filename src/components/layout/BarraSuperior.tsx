import { useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronDown, LogOut, RotateCcw } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { toast } from '@/components/ui/toast'
import { useAuth } from '@/store/auth'
import { useReiniciarDemo, useUsuarios } from '@/api/queries'
import { ROLE_LABEL } from '@/domain/types'
import { cn } from '@/lib/cn'

/** Selector de usuario: cambia de rol sin pasar de nuevo por el login. */
function SelectorRol() {
  const [abierto, setAbierto] = useState(false)
  const usuario = useAuth((s) => s.usuario)
  const cambiarUsuario = useAuth((s) => s.cambiarUsuario)
  const { data: usuarios } = useUsuarios()

  if (!usuario) return null

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        aria-expanded={abierto}
        aria-haspopup="menu"
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-slate-100"
      >
        <span className="bg-brand-700 flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-white">
          {usuario.iniciales}
        </span>
        <span className="hidden min-w-0 sm:block">
          <span className="block truncate text-sm font-medium text-slate-900">{usuario.nombre}</span>
          <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[usuario.rol]}</span>
        </span>
        <ChevronDown className="size-4 shrink-0 text-slate-400" aria-hidden />
      </button>

      {abierto && (
        <>
          <button
            type="button"
            aria-label="Cerrar menú de usuario"
            onClick={() => setAbierto(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <div
            role="menu"
            className="absolute right-0 z-20 mt-1 w-64 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg"
          >
            <p className="border-b border-slate-100 px-3 py-2 text-xs font-medium tracking-wide text-slate-500 uppercase">
              Ver el sistema como
            </p>
            {usuarios?.map((u) => (
              <button
                key={u.id}
                type="button"
                role="menuitem"
                // Nombre accesible explícito: el contenido son dos <span> con
                // nombre y rol, que un lector de pantalla anunciaría suelto.
                aria-label={`Ver como ${u.nombre}, ${ROLE_LABEL[u.rol]}`}
                aria-current={u.id === usuario.id}
                onClick={() => {
                  cambiarUsuario(u)
                  setAbierto(false)
                  toast.info(`Ahora estás viendo el sistema como ${ROLE_LABEL[u.rol]}.`)
                }}
                className={cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors hover:bg-slate-50',
                  u.id === usuario.id && 'bg-brand-50/60',
                )}
              >
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                  {u.iniciales}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm text-slate-900">{u.nombre}</span>
                  <span className="block truncate text-xs text-slate-500">{ROLE_LABEL[u.rol]}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function BotonReiniciar() {
  const [confirmando, setConfirmando] = useState(false)
  const reiniciar = useReiniciarDemo()

  return (
    <>
      <Button
        variante="fantasma"
        tamano="sm"
        onClick={() => setConfirmando(true)}
        iconoIzquierda={<RotateCcw className="size-4" aria-hidden />}
        className="hidden sm:inline-flex"
      >
        Reiniciar datos
      </Button>

      <Modal
        abierto={confirmando}
        onCerrar={() => setConfirmando(false)}
        titulo="Reiniciar los datos del demo"
        descripcion="Se descartan los cambios que hayas hecho y se regenera el conjunto de datos original."
        pie={
          <>
            <Button variante="secundario" onClick={() => setConfirmando(false)}>
              Cancelar
            </Button>
            <Button
              variante="peligro"
              cargando={reiniciar.isPending}
              onClick={() => {
                reiniciar.mutate(undefined, {
                  onSuccess: () => {
                    setConfirmando(false)
                    toast.exito('Datos del demo restaurados.')
                  },
                  onError: () => toast.error('No se pudieron restaurar los datos.'),
                })
              }}
            >
              Reiniciar
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          Las órdenes que cerraste, los clientes que creaste y cualquier otro cambio volverán a su
          estado inicial. Es útil para dejar el demo limpio antes de mostrárselo a alguien.
        </p>
      </Modal>
    </>
  )
}

export function BarraSuperior({ botonMenu }: { botonMenu: ReactNode }) {
  const cerrarSesion = useAuth((s) => s.cerrarSesion)
  const navegar = useNavigate()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/85 backdrop-blur-sm">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-2 px-4 sm:px-6 lg:px-8">
        {botonMenu}
        <div className="flex-1" />
        <BotonReiniciar />
        <SelectorRol />
        <button
          type="button"
          onClick={() => {
            cerrarSesion()
            navegar('/ingresar')
          }}
          aria-label="Cerrar sesión"
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
        >
          <LogOut className="size-4.5" aria-hidden />
        </button>
      </div>
    </header>
  )
}
