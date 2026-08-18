import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { AlertTriangle, ArrowLeft, Mail, MapPin, Pencil, Phone } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { EstadoBadge } from '@/components/EstadoBadge'
import { ClienteModal } from '@/features/clientes/ClienteModal'
import { useCliente } from '@/api/queries'
import { useAuth } from '@/store/auth'
import { tienePermiso } from '@/domain/permissions'
import { esEstadoAbierto } from '@/domain/workflow'
import { formatearCLP, formatearFecha } from '@/lib/format'

export function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>()
  const [editando, setEditando] = useState(false)
  const usuario = useAuth((s) => s.usuario)
  const { data, isPending, isError } = useCliente(id)

  if (isPending) {
    return (
      <div className="space-y-5">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <Card>
        <EmptyState
          icono={<AlertTriangle className="size-5" aria-hidden />}
          titulo="No se encontró el cliente"
          descripcion="La empresa que buscas no existe o fue eliminada del sistema."
          accion={
            <Link
              to="/clientes"
              className="inline-flex h-10 items-center rounded-lg bg-white px-4 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-300 ring-inset hover:bg-slate-50"
            >
              Volver al listado
            </Link>
          }
        />
      </Card>
    )
  }

  const { cliente, equipos, ordenes } = data
  const puedeVerMontos = usuario ? tienePermiso(usuario.rol, 'ver_montos') : false
  const abiertas = ordenes.filter((o) => esEstadoAbierto(o.estado)).length
  const facturado = ordenes
    .filter((o) => o.estado === 'cerrada')
    .reduce((acc, o) => acc + o.total, 0)

  return (
    <div className="space-y-5">
      <Link
        to="/clientes"
        className="inline-flex items-center gap-1.5 text-sm text-slate-600 transition-colors hover:text-slate-900"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Clientes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-semibold text-slate-900">{cliente.razonSocial}</h1>
          <p className="tabular mt-0.5 text-sm text-slate-600">
            {cliente.rut} · {cliente.giro}
          </p>
        </div>
        <Button
          variante="secundario"
          onClick={() => setEditando(true)}
          iconoIzquierda={<Pencil className="size-4" aria-hidden />}
        >
          Editar
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader titulo="Contacto" />
          <CardBody className="space-y-3 text-sm">
            <p className="font-medium text-slate-900">{cliente.contactoNombre}</p>
            <p className="flex items-center gap-2 text-slate-600">
              <Mail className="size-4 shrink-0 text-slate-400" aria-hidden />
              <a href={`mailto:${cliente.contactoEmail}`} className="hover:text-brand-700 truncate hover:underline">
                {cliente.contactoEmail}
              </a>
            </p>
            <p className="flex items-center gap-2 text-slate-600">
              <Phone className="size-4 shrink-0 text-slate-400" aria-hidden />
              {cliente.contactoTelefono}
            </p>
            <p className="flex items-start gap-2 text-slate-600">
              <MapPin className="mt-0.5 size-4 shrink-0 text-slate-400" aria-hidden />
              <span>
                {cliente.direccion}
                <br />
                {cliente.comuna}
              </span>
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Resumen" />
          <CardBody className="space-y-3">
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Órdenes históricas</span>
              <span className="tabular text-lg font-semibold text-slate-900">{ordenes.length}</span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-sm text-slate-600">Abiertas ahora</span>
              <span className="tabular text-lg font-semibold text-slate-900">{abiertas}</span>
            </div>
            {puedeVerMontos && (
              <div className="flex items-baseline justify-between border-t border-slate-100 pt-3">
                <span className="text-sm text-slate-600">Facturado histórico</span>
                <span className="tabular text-lg font-semibold text-slate-900">
                  {formatearCLP(facturado)}
                </span>
              </div>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader titulo="Equipos registrados" descripcion={`${equipos.length} en total.`} />
          {equipos.length === 0 ? (
            <EmptyState titulo="Sin equipos" descripcion="Este cliente aún no tiene equipos registrados." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {equipos.map((equipo) => (
                <li key={equipo.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-slate-900">{equipo.nombre}</p>
                  <p className="text-xs text-slate-500">
                    {equipo.marca} {equipo.modelo} · S/N {equipo.numeroSerie}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader titulo="Historial de órdenes" descripcion="De la más reciente a la más antigua." />
        {ordenes.length === 0 ? (
          <EmptyState
            titulo="Sin órdenes todavía"
            descripcion="Cuando ingrese un equipo de este cliente, la orden aparecerá aquí."
          />
        ) : (
          <div className="scrollbar-slim overflow-x-auto">
            <table className="w-full min-w-2xl text-left text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
                <tr>
                  <th scope="col" className="px-4 py-2.5 font-medium">Folio</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Trabajo</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                  <th scope="col" className="px-4 py-2.5 font-medium">Ingreso</th>
                  {puedeVerMontos && (
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ordenes.map((orden) => (
                  <tr key={orden.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/ordenes/${orden.id}`}
                        className="tabular text-brand-700 hover:text-brand-800 font-medium hover:underline"
                      >
                        {orden.folio}
                      </Link>
                    </td>
                    <td className="max-w-sm px-4 py-3">
                      <p className="truncate text-slate-900">{orden.titulo}</p>
                      <p className="truncate text-xs text-slate-500">{orden.equipo.nombre}</p>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={orden.estado} />
                    </td>
                    <td className="tabular px-4 py-3 text-slate-600">{formatearFecha(orden.creadaEn)}</td>
                    {puedeVerMontos && (
                      <td className="tabular px-4 py-3 text-right text-slate-900">
                        {orden.total > 0 ? formatearCLP(orden.total) : <span className="text-slate-400">—</span>}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <ClienteModal abierto={editando} onCerrar={() => setEditando(false)} cliente={cliente} />
    </div>
  )
}
