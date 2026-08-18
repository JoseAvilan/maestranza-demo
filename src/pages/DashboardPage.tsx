import { Link } from 'react-router-dom'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { AlertTriangle, ArrowRight, Clock, TrendingDown, TrendingUp, Wrench } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { EstadoBadge } from '@/components/EstadoBadge'
import { useKpis, useOrdenes } from '@/api/queries'
import { formatearCLP, formatearFecha, formatearNumero } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { OtEstado } from '@/domain/types'

const COLOR_MARCA = '#0f766e'
const COLOR_ESTADO: Record<string, string> = {
  recepcionada: '#94a3b8',
  cotizada: '#0ea5e9',
  aprobada: '#14b8a6',
  en_ejecucion: '#f59e0b',
  cerrada: '#10b981',
}

interface KpiProps {
  etiqueta: string
  valor: string
  icono: typeof Wrench
  detalle?: string
  tono?: 'normal' | 'alerta'
  tendencia?: number
}

function TarjetaKpi({ etiqueta, valor, icono: Icono, detalle, tono = 'normal', tendencia }: KpiProps) {
  const Tendencia = (tendencia ?? 0) >= 0 ? TrendingUp : TrendingDown

  return (
    <Card className={cn(tono === 'alerta' && 'border-amber-300 bg-amber-50/40')}>
      <CardBody className="flex items-start gap-3">
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-lg',
            tono === 'alerta' ? 'bg-amber-100 text-amber-700' : 'bg-brand-50 text-brand-700',
          )}
        >
          <Icono className="size-4.5" aria-hidden />
        </div>
        <div className="min-w-0">
          <p className="text-sm text-slate-600">{etiqueta}</p>
          <p className="tabular mt-0.5 text-2xl font-semibold text-slate-900">{valor}</p>
          {tendencia !== undefined ? (
            <p
              className={cn(
                'mt-1 flex items-center gap-1 text-xs font-medium',
                tendencia >= 0 ? 'text-emerald-700' : 'text-red-600',
              )}
            >
              <Tendencia className="size-3.5" aria-hidden />
              {tendencia >= 0 ? '+' : ''}
              {tendencia}% vs. igual período del mes anterior
            </p>
          ) : (
            detalle && <p className="mt-1 text-xs text-slate-500">{detalle}</p>
          )}
        </div>
      </CardBody>
    </Card>
  )
}

function TooltipPersonalizado({
  active,
  payload,
  label,
  formato,
}: {
  active?: boolean
  payload?: { value?: number | string }[]
  label?: string | number
  formato: (valor: number) => string
}) {
  if (!active || !payload?.length) return null
  const valor = Number(payload[0]?.value ?? 0)

  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-lg">
      <p className="text-xs text-slate-500 capitalize">{label}</p>
      <p className="tabular text-sm font-semibold text-slate-900">{formato(valor)}</p>
    </div>
  )
}

function PanelCargando() {
  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardBody>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="mt-2 h-8 w-20" />
            </CardBody>
          </Card>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-72 lg:col-span-2" />
        <Skeleton className="h-72" />
      </div>
    </div>
  )
}

export function DashboardPage() {
  const { data: kpis, isPending, isError } = useKpis()
  const atrasadas = useOrdenes({ soloAtrasadas: true, orden: 'compromiso', porPagina: 6, pagina: 1 })

  if (isPending) return <PanelCargando />

  if (isError || !kpis) {
    return (
      <Card>
        <EmptyState
          icono={<AlertTriangle className="size-5" aria-hidden />}
          titulo="No se pudieron cargar los indicadores"
          descripcion="Ocurrió un error al consultar el resumen de operación. Recarga la página para intentar nuevamente."
        />
      </Card>
    )
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Panel de operación</h1>
        <p className="mt-0.5 text-sm text-slate-600">
          Estado del taller al {formatearFecha(new Date().toISOString())}.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <TarjetaKpi
          etiqueta="Órdenes abiertas"
          valor={formatearNumero(kpis.otAbiertas)}
          icono={Wrench}
          detalle="En algún punto del flujo, sin cerrar"
        />
        <TarjetaKpi
          etiqueta="Fuera de plazo"
          valor={formatearNumero(kpis.otAtrasadas)}
          icono={AlertTriangle}
          tono={kpis.otAtrasadas > 0 ? 'alerta' : 'normal'}
          detalle="Pasaron su fecha comprometida"
        />
        <TarjetaKpi
          etiqueta="Tiempo de ciclo"
          valor={`${kpis.tiempoCicloDias} días`}
          icono={Clock}
          detalle="Promedio recepción → cierre, 90 días"
        />
        <TarjetaKpi
          etiqueta="Ventas del mes"
          valor={formatearCLP(kpis.ingresosMes)}
          icono={TrendingUp}
          tendencia={kpis.variacionIngresosPct}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Ventas mensuales"
            descripcion="Total con IVA de las cotizaciones aprobadas por el cliente en cada mes."
          />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={kpis.ingresosMensuales} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gradIngresos" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={COLOR_MARCA} stopOpacity={0.28} />
                      <stop offset="100%" stopColor={COLOR_MARCA} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={{ stroke: '#e2e8f0' }}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#64748b' }}
                    tickLine={false}
                    axisLine={false}
                    width={52}
                    tickFormatter={(valor: number) => `${Math.round(valor / 1_000_000)}M`}
                  />
                  <Tooltip content={<TooltipPersonalizado formato={formatearCLP} />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke={COLOR_MARCA}
                    strokeWidth={2}
                    fill="url(#gradIngresos)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader
            titulo="Carga abierta por estado"
            descripcion="Dónde está detenido el trabajo que sigue en curso."
          />
          <CardBody>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={kpis.porEstado}
                  layout="vertical"
                  margin={{ top: 4, right: 12, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 12, fill: '#64748b' }} tickLine={false} axisLine={false} />
                  <YAxis
                    type="category"
                    dataKey="label"
                    width={96}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: '#f1f5f9' }}
                    content={<TooltipPersonalizado formato={(v) => `${formatearNumero(v)} órdenes`} />}
                  />
                  <Bar dataKey="cantidad" radius={[0, 4, 4, 0]} barSize={18}>
                    {kpis.porEstado.map((entrada) => (
                      <Cell
                        key={entrada.estado}
                        fill={COLOR_ESTADO[entrada.estado as OtEstado] ?? COLOR_MARCA}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader
            titulo="Órdenes fuera de plazo"
            descripcion="Las más atrasadas primero. Requieren gestión inmediata."
            accion={
              <Link
                to="/ordenes?atrasadas=1"
                className="text-brand-700 hover:text-brand-800 inline-flex items-center gap-1 text-sm font-medium"
              >
                Ver todas
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            }
          />
          {atrasadas.data && atrasadas.data.datos.length === 0 ? (
            <EmptyState
              titulo="Ninguna orden fuera de plazo"
              descripcion="Todas las órdenes abiertas están dentro de su fecha comprometida."
            />
          ) : (
            <div className="divide-y divide-slate-100">
              {(atrasadas.data?.datos ?? []).map((orden) => (
                <Link
                  key={orden.id}
                  to={`/ordenes/${orden.id}`}
                  className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2">
                      <span className="tabular text-sm font-medium text-slate-900">{orden.folio}</span>
                      <EstadoBadge estado={orden.estado} />
                    </p>
                    <p className="mt-0.5 truncate text-sm text-slate-600">
                      {orden.cliente.razonSocial} · {orden.titulo}
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block text-sm font-medium text-red-600">
                      {formatearFecha(orden.fechaCompromiso)}
                    </span>
                    <span className="block text-xs text-slate-500">comprometida</span>
                  </p>
                </Link>
              ))}
              {atrasadas.isPending &&
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="px-5 py-3.5">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="mt-2 h-3 w-64" />
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card>
          <CardHeader titulo="Carga por técnico" descripcion="Órdenes abiertas asignadas." />
          <CardBody className="space-y-3">
            {kpis.cargaTecnicos.map((tecnico) => {
              const maximo = Math.max(...kpis.cargaTecnicos.map((t) => t.abiertas), 1)
              return (
                <div key={tecnico.tecnicoId}>
                  <div className="mb-1 flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm text-slate-700">{tecnico.nombre}</span>
                    <span className="tabular text-sm font-medium text-slate-900">
                      {tecnico.abiertas}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="bg-brand-600 h-full rounded-full"
                      style={{ width: `${(tecnico.abiertas / maximo) * 100}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
