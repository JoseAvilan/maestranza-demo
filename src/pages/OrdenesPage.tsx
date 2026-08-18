import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, ClipboardList, Plus, Search } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Field'
import { SkeletonFilas } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { EstadoBadge, PrioridadBadge } from '@/components/EstadoBadge'
import { NuevaOrdenModal } from '@/features/ordenes/NuevaOrdenModal'
import { useOrdenes, useUsuarios } from '@/api/queries'
import { useAuth } from '@/store/auth'
import { tienePermiso } from '@/domain/permissions'
import { OT_ESTADOS, OT_ESTADO_LABEL, OT_PRIORIDADES, OT_PRIORIDAD_LABEL, ROLES } from '@/domain/types'
import { esEstadoAbierto } from '@/domain/workflow'
import { formatearCLP, formatearFecha } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { FiltroOrdenes } from '@/api/contracts'

const POR_PAGINA = 12

export function OrdenesPage() {
  const [params, setParams] = useSearchParams()
  const [nuevaAbierta, setNuevaAbierta] = useState(false)
  const usuario = useAuth((s) => s.usuario)
  const { data: usuarios } = useUsuarios()

  const esTecnico = usuario?.rol === ROLES.tecnico
  const puedeVerMontos = usuario ? tienePermiso(usuario.rol, 'ver_montos') : false
  const puedeCrear = usuario ? tienePermiso(usuario.rol, 'crear_ot') : false

  /** Los filtros viven en la URL: el estado es compartible y sobrevive al refresco. */
  function actualizar(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params)
    if (valor && valor !== 'todas') siguiente.set(clave, valor)
    else siguiente.delete(clave)
    // Cualquier cambio de filtro vuelve a la primera página.
    if (clave !== 'pagina') siguiente.delete('pagina')
    setParams(siguiente, { replace: true })
  }

  const filtro: FiltroOrdenes = {
    q: params.get('q') ?? '',
    estado: (params.get('estado') as FiltroOrdenes['estado']) ?? 'todas',
    prioridad: (params.get('prioridad') as FiltroOrdenes['prioridad']) ?? 'todas',
    // Un técnico solo ve su propia carga: no es un filtro que pueda quitar.
    tecnicoId: esTecnico ? usuario?.id : (params.get('tecnicoId') ?? undefined),
    soloAtrasadas: params.get('atrasadas') === '1',
    pagina: Number(params.get('pagina') ?? '1'),
    porPagina: POR_PAGINA,
    orden: (params.get('orden') as FiltroOrdenes['orden']) ?? 'recientes',
  }

  const { data, isPending, isError } = useOrdenes(filtro)
  const tecnicos = usuarios?.filter((u) => u.rol === ROLES.tecnico) ?? []
  const hayFiltros = Boolean(filtro.q || filtro.estado !== 'todas' || filtro.prioridad !== 'todas' || filtro.soloAtrasadas)

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">
            {esTecnico ? 'Mis órdenes asignadas' : 'Órdenes de trabajo'}
          </h1>
          <p className="mt-0.5 text-sm text-slate-600">
            {esTecnico
              ? 'Trabajos aprobados o en ejecución bajo tu responsabilidad.'
              : 'Seguimiento de todo lo que entra y sale del taller.'}
          </p>
        </div>
        {puedeCrear && (
          <Button onClick={() => setNuevaAbierta(true)} iconoIzquierda={<Plus className="size-4" aria-hidden />}>
            Nueva orden
          </Button>
        )}
      </div>

      <Card>
        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-3">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Buscar órdenes"
              placeholder="Folio, cliente, equipo o falla…"
              className="pl-9"
              defaultValue={filtro.q}
              onChange={(e) => actualizar('q', e.target.value)}
            />
          </div>

          <Select
            aria-label="Filtrar por estado"
            className="w-auto"
            value={filtro.estado}
            onChange={(e) => actualizar('estado', e.target.value)}
          >
            <option value="todas">Todos los estados</option>
            {OT_ESTADOS.map((estado) => (
              <option key={estado} value={estado}>
                {OT_ESTADO_LABEL[estado]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filtrar por prioridad"
            className="w-auto"
            value={filtro.prioridad}
            onChange={(e) => actualizar('prioridad', e.target.value)}
          >
            <option value="todas">Toda prioridad</option>
            {OT_PRIORIDADES.map((p) => (
              <option key={p} value={p}>
                {OT_PRIORIDAD_LABEL[p]}
              </option>
            ))}
          </Select>

          {!esTecnico && (
            <Select
              aria-label="Filtrar por técnico"
              className="w-auto"
              value={filtro.tecnicoId ?? ''}
              onChange={(e) => actualizar('tecnicoId', e.target.value)}
            >
              <option value="">Todos los técnicos</option>
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nombre}
                </option>
              ))}
            </Select>
          )}

          <button
            type="button"
            onClick={() => actualizar('atrasadas', filtro.soloAtrasadas ? '' : '1')}
            aria-pressed={filtro.soloAtrasadas}
            className={cn(
              'inline-flex h-9.5 items-center gap-1.5 rounded-lg px-3 text-sm font-medium transition-colors',
              filtro.soloAtrasadas
                ? 'bg-amber-100 text-amber-900 ring-1 ring-amber-300 ring-inset'
                : 'text-slate-600 ring-1 ring-slate-300 ring-inset hover:bg-slate-50',
            )}
          >
            <AlertTriangle className="size-4" aria-hidden />
            Fuera de plazo
          </button>
        </div>

        {/* Tabla */}
        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Folio</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Cliente y trabajo</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Prioridad</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Compromiso</th>
                {puedeVerMontos && (
                  <th scope="col" className="px-4 py-2.5 text-right font-medium">Total</th>
                )}
              </tr>
            </thead>
            <tbody>
              {isPending && <SkeletonFilas filas={8} columnas={puedeVerMontos ? 6 : 5} />}

              {data?.datos.map((orden) => {
                const atrasada =
                  esEstadoAbierto(orden.estado) && new Date(orden.fechaCompromiso) < new Date()

                return (
                  <tr key={orden.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        to={`/ordenes/${orden.id}`}
                        className="tabular text-brand-700 hover:text-brand-800 font-medium hover:underline"
                      >
                        {orden.folio}
                      </Link>
                    </td>
                    <td className="max-w-md px-4 py-3">
                      <p className="truncate font-medium text-slate-900">{orden.cliente.razonSocial}</p>
                      <p className="truncate text-slate-500">
                        {orden.equipo.nombre} · {orden.titulo}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <EstadoBadge estado={orden.estado} />
                    </td>
                    <td className="px-4 py-3">
                      <PrioridadBadge prioridad={orden.prioridad} />
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('tabular', atrasada ? 'font-medium text-red-600' : 'text-slate-600')}>
                        {formatearFecha(orden.fechaCompromiso)}
                      </span>
                    </td>
                    {puedeVerMontos && (
                      <td className="tabular px-4 py-3 text-right text-slate-900">
                        {orden.total > 0 ? formatearCLP(orden.total) : <span className="text-slate-400">—</span>}
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {isError && (
          <EmptyState
            icono={<AlertTriangle className="size-5" aria-hidden />}
            titulo="No se pudieron cargar las órdenes"
            descripcion="Ocurrió un error al consultar el listado. Vuelve a intentarlo en unos segundos."
          />
        )}

        {data && data.datos.length === 0 && (
          <EmptyState
            icono={<ClipboardList className="size-5" aria-hidden />}
            titulo={hayFiltros ? 'Sin resultados para estos filtros' : 'Todavía no hay órdenes'}
            descripcion={
              hayFiltros
                ? 'Prueba con otros criterios o limpia los filtros para ver el listado completo.'
                : 'Cuando ingrese un equipo al taller, la orden aparecerá aquí.'
            }
            accion={
              hayFiltros ? (
                <Button variante="secundario" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                  Limpiar filtros
                </Button>
              ) : undefined
            }
          />
        )}

        {data && data.total > POR_PAGINA && (
          <Pagination
            pagina={data.pagina}
            porPagina={data.porPagina}
            total={data.total}
            onCambiar={(p) => actualizar('pagina', String(p))}
          />
        )}
      </Card>

      {puedeCrear && <NuevaOrdenModal abierto={nuevaAbierta} onCerrar={() => setNuevaAbierta(false)} />}
    </div>
  )
}
