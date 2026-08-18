import { useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Building2, CalendarClock, Cog, UserCog } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Field'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { toast } from '@/components/ui/toast'
import { EstadoBadge, PrioridadBadge } from '@/components/EstadoBadge'
import { Bitacora } from '@/features/ordenes/Bitacora'
import { TransicionModal } from '@/features/ordenes/TransicionModal'
import { useActualizarOrden, useOrden, useUsuarios } from '@/api/queries'
import { useAuth } from '@/store/auth'
import { tienePermiso } from '@/domain/permissions'
import { ROLES } from '@/domain/types'
import { esEstadoAbierto, transicionesDisponibles, type Transicion } from '@/domain/workflow'
import { diasHasta, fechaRelativa, formatearCLP, formatearFecha } from '@/lib/format'
import { cn } from '@/lib/cn'

function Dato({ icono: Icono, etiqueta, children }: { icono: typeof Cog; etiqueta: string; children: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Icono className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
      <div className="min-w-0">
        <p className="text-xs text-slate-500">{etiqueta}</p>
        <div className="text-sm text-slate-900">{children}</div>
      </div>
    </div>
  )
}

function DetalleCargando() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-5 w-40" />
      <Skeleton className="h-24" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <Skeleton className="h-80" />
      </div>
    </div>
  )
}

export function OrdenDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [transicionActiva, setTransicionActiva] = useState<Transicion | null>(null)
  const usuario = useAuth((s) => s.usuario)
  const { data: orden, isPending, isError } = useOrden(id)
  const { data: usuarios } = useUsuarios()
  const actualizar = useActualizarOrden(id ?? '')

  if (isPending) return <DetalleCargando />

  if (isError || !orden) {
    return (
      <Card>
        <EmptyState
          icono={<AlertTriangle className="size-5" aria-hidden />}
          titulo="No se encontró la orden"
          descripcion="La orden que buscas no existe o fue eliminada del sistema."
          accion={
            <Link
              to="/ordenes"
              className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
            >
              Volver al listado
            </Link>
          }
        />
      </Card>
    )
  }

  const rol = usuario?.rol
  const puedeVerMontos = rol ? tienePermiso(rol, 'ver_montos') : false
  const puedeAsignar = rol ? tienePermiso(rol, 'asignar_tecnico') : false
  const acciones = rol ? transicionesDisponibles(orden.estado, rol) : []
  const tecnicos = usuarios?.filter((u) => u.rol === ROLES.tecnico) ?? []

  const dias = diasHasta(orden.fechaCompromiso)
  const atrasada = esEstadoAbierto(orden.estado) && dias < 0

  return (
    <div className="space-y-5">
      <Link
        to="/ordenes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Órdenes de trabajo
      </Link>

      {/* Encabezado y acciones de flujo */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="tabular text-xl font-semibold text-slate-900">{orden.folio}</h1>
            <EstadoBadge estado={orden.estado} />
            <PrioridadBadge prioridad={orden.prioridad} />
            {atrasada && (
              <Badge tono="peligro">
                <AlertTriangle className="size-3" aria-hidden />
                Fuera de plazo
              </Badge>
            )}
          </div>
          <p className="mt-1 text-sm text-slate-600">{orden.titulo}</p>
        </div>

        {acciones.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {acciones.map((accion) => (
              <Button
                key={`${accion.desde}-${accion.hasta}`}
                variante={accion.intencion === 'destructiva' ? 'secundario' : 'primario'}
                onClick={() => setTransicionActiva(accion)}
                className={cn(accion.intencion === 'destructiva' && 'text-red-700 ring-red-200')}
              >
                {accion.accion}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Ficha resumida */}
      <Card>
        <CardBody className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Dato icono={Building2} etiqueta="Cliente">
            <Link
              to={`/clientes/${orden.cliente.id}`}
              className="text-brand-700 hover:text-brand-800 font-medium hover:underline"
            >
              {orden.cliente.razonSocial}
            </Link>
            <p className="tabular text-xs text-slate-500">{orden.cliente.rut}</p>
          </Dato>

          <Dato icono={Cog} etiqueta="Equipo">
            <p className="font-medium">{orden.equipo.nombre}</p>
            <p className="text-xs text-slate-500">
              {orden.equipo.marca} {orden.equipo.modelo} · S/N {orden.equipo.numeroSerie}
            </p>
          </Dato>

          <Dato icono={CalendarClock} etiqueta="Fecha comprometida">
            <p className={cn('tabular font-medium', atrasada && 'text-red-600')}>
              {formatearFecha(orden.fechaCompromiso)}
            </p>
            <p className="text-xs text-slate-500">
              {esEstadoAbierto(orden.estado)
                ? fechaRelativa(orden.fechaCompromiso)
                : orden.cerradaEn
                  ? `Cerrada el ${formatearFecha(orden.cerradaEn)}`
                  : 'Orden anulada'}
            </p>
          </Dato>

          <Dato icono={UserCog} etiqueta="Técnico asignado">
            {puedeAsignar ? (
              <Select
                aria-label="Asignar técnico"
                className="mt-0.5"
                value={orden.tecnicoId ?? ''}
                disabled={actualizar.isPending}
                onChange={(e) => {
                  const valor = e.target.value || null
                  actualizar.mutate(
                    { tecnicoId: valor },
                    {
                      onSuccess: () =>
                        toast.exito(valor ? 'Técnico asignado.' : 'Se quitó la asignación.'),
                      onError: () => toast.error('No se pudo asignar el técnico.'),
                    },
                  )
                }}
              >
                <option value="">Sin asignar</option>
                {tecnicos.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nombre}
                  </option>
                ))}
              </Select>
            ) : (
              <p className="font-medium">{orden.tecnico?.nombre ?? 'Sin asignar'}</p>
            )}
          </Dato>
        </CardBody>
      </Card>

      <div className="grid items-start gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader titulo="Falla reportada" />
            <CardBody>
              <p className="text-sm leading-relaxed text-slate-700">{orden.descripcionFalla}</p>
            </CardBody>
          </Card>

          {puedeVerMontos && (
            <Card>
              <CardHeader
                titulo="Detalle de la cotización"
                descripcion="Valores netos en pesos. El IVA se calcula al 19%."
              />
              {orden.items.length === 0 ? (
                <EmptyState
                  titulo="Sin cotización todavía"
                  descripcion="Cuando se realice el diagnóstico, los servicios y repuestos aparecerán aquí."
                />
              ) : (
                <>
                  <div className="scrollbar-slim overflow-x-auto">
                    <table className="w-full min-w-lg text-left text-sm">
                      <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                        <tr>
                          <th scope="col" className="px-5 py-2.5 font-medium">Descripción</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Cant.</th>
                          <th scope="col" className="px-3 py-2.5 text-right font-medium">Unitario</th>
                          <th scope="col" className="px-5 py-2.5 text-right font-medium">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orden.items.map((item) => (
                          <tr key={item.id} className="border-b border-slate-100 last:border-0">
                            <td className="px-5 py-3">
                              <p className="text-slate-900">{item.descripcion}</p>
                              <p className="text-xs text-slate-500 capitalize">{item.tipo}</p>
                            </td>
                            <td className="tabular px-3 py-3 text-right text-slate-600">{item.cantidad}</td>
                            <td className="tabular px-3 py-3 text-right text-slate-600">
                              {formatearCLP(item.precioUnitario)}
                            </td>
                            <td className="tabular px-5 py-3 text-right font-medium text-slate-900">
                              {formatearCLP(item.cantidad * item.precioUnitario)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <dl className="space-y-1.5 border-t border-slate-200 bg-slate-50 px-5 py-4 text-sm">
                    <div className="flex justify-between">
                      <dt className="text-slate-600">Neto</dt>
                      <dd className="tabular text-slate-900">{formatearCLP(orden.neto)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-600">IVA (19%)</dt>
                      <dd className="tabular text-slate-900">{formatearCLP(orden.iva)}</dd>
                    </div>
                    <div className="flex justify-between border-t border-slate-200 pt-1.5 text-base font-semibold">
                      <dt className="text-slate-900">Total</dt>
                      <dd className="tabular text-slate-900">{formatearCLP(orden.total)}</dd>
                    </div>
                  </dl>
                </>
              )}
            </Card>
          )}
        </div>

        <Card>
          <CardHeader titulo="Bitácora" descripcion="Cada cambio de estado queda registrado." />
          <Bitacora eventos={orden.eventos} />
        </Card>
      </div>

      <TransicionModal
        ordenId={orden.id}
        folio={orden.folio}
        transicion={transicionActiva}
        onCerrar={() => setTransicionActiva(null)}
      />
    </div>
  )
}
