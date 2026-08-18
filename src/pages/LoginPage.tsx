import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Factory, LogIn } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useLogin } from '@/api/queries'
import { useAuth } from '@/store/auth'
import { ErrorApi } from '@/api/client'
import { cn } from '@/lib/cn'

/** Cuentas visibles en pantalla: un demo con login oculto no lo abre nadie. */
const CUENTAS = [
  {
    email: 'jefe@maestranza.demo',
    nombre: 'Rodrigo Sanhueza',
    rol: 'Jefe de taller',
    detalle: 'Ve todo: panel, montos, clientes y todas las transiciones.',
  },
  {
    email: 'recepcion@maestranza.demo',
    nombre: 'Camila Vergara',
    rol: 'Recepción',
    detalle: 'Levanta órdenes y cotiza, pero no asigna técnicos.',
  },
  {
    email: 'tecnico@maestranza.demo',
    nombre: 'Matías Riquelme',
    rol: 'Técnico',
    detalle: 'Solo su carga de trabajo. Sin panel de gestión ni montos.',
  },
] as const

const PASSWORD = 'demo1234'

export function LoginPage() {
  const [email, setEmail] = useState<string>(CUENTAS[0].email)
  const [password, setPassword] = useState<string>(PASSWORD)
  const usuario = useAuth((s) => s.usuario)
  const iniciarSesion = useAuth((s) => s.iniciarSesion)
  const login = useLogin()
  const navegar = useNavigate()

  if (usuario) return <Navigate to="/" replace />

  function enviar(e: FormEvent) {
    e.preventDefault()
    login.mutate(
      { email, password },
      {
        onSuccess: ({ usuario: u, token }) => {
          iniciarSesion(u, token)
          navegar('/', { replace: true })
        },
      },
    )
  }

  const mensajeError = login.error instanceof ErrorApi ? login.error.message : null

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-2">
      {/* Panel de presentación: contexto del proyecto antes de entrar. */}
      <div className="bg-shell-900 flex flex-col justify-between px-6 py-10 sm:px-10 lg:px-14">
        <div className="flex items-center gap-2.5">
          <div className="bg-brand-600 flex size-9 items-center justify-center rounded-lg">
            <Factory className="size-5 text-white" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Maestranza</p>
            <p className="text-xs text-slate-400">Gestión de órdenes de trabajo</p>
          </div>
        </div>

        <div className="my-10 max-w-lg lg:my-0">
          <h1 className="text-2xl font-semibold text-balance text-white sm:text-3xl">
            El taller completo en una sola pantalla: desde que entra el equipo hasta que se factura.
          </h1>
          <p className="mt-4 text-sm leading-relaxed text-slate-300">
            Demostración funcional de un sistema de gestión para maestranzas y talleres
            industriales. Órdenes de trabajo con flujo de estados auditado, control de plazos,
            permisos por rol e indicadores de operación.
          </p>

          <dl className="mt-8 grid grid-cols-3 gap-4 border-t border-slate-700 pt-6">
            {[
              { valor: '260', etiqueta: 'órdenes de ejemplo' },
              { valor: '14', etiqueta: 'meses de historial' },
              { valor: '3', etiqueta: 'roles con permisos' },
            ].map((dato) => (
              <div key={dato.etiqueta}>
                <dt className="text-xl font-semibold text-white tabular">{dato.valor}</dt>
                <dd className="mt-0.5 text-xs leading-snug text-slate-400">{dato.etiqueta}</dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="text-xs text-slate-500">
          Datos ficticios generados en el navegador. Ninguna información sale de tu equipo.
        </p>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center bg-slate-100 px-6 py-10 sm:px-10">
        <div className="w-full max-w-md">
          <h2 className="text-lg font-semibold text-slate-900">Ingresar a la demostración</h2>
          <p className="mt-1 text-sm text-slate-600">
            Elige un perfil para ver cómo cambian los permisos y la interfaz.
          </p>

          <div className="mt-5 space-y-2">
            {CUENTAS.map((cuenta) => (
              <button
                key={cuenta.email}
                type="button"
                onClick={() => {
                  setEmail(cuenta.email)
                  setPassword(PASSWORD)
                }}
                className={cn(
                  'w-full rounded-lg border px-3.5 py-3 text-left transition-colors',
                  email === cuenta.email
                    ? 'border-brand-600 bg-brand-50 ring-brand-600/20 ring-2'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
                )}
              >
                <span className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-slate-900">{cuenta.rol}</span>
                  <span className="text-xs text-slate-500">{cuenta.nombre}</span>
                </span>
                <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">
                  {cuenta.detalle}
                </span>
              </button>
            ))}
          </div>

          <form onSubmit={enviar} className="mt-5 space-y-4">
            <Field etiqueta="Correo">
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              )}
            </Field>

            <Field etiqueta="Contraseña" ayuda={`Para todas las cuentas: ${PASSWORD}`}>
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              )}
            </Field>

            {mensajeError && (
              <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
                {mensajeError}
              </p>
            )}

            <Button
              type="submit"
              className="w-full"
              cargando={login.isPending}
              iconoIzquierda={<LogIn className="size-4" aria-hidden />}
            >
              Entrar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
