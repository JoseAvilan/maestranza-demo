import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Plus, Search, Users } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Field'
import { SkeletonFilas } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/ui/EmptyState'
import { Pagination } from '@/components/ui/Pagination'
import { ClienteModal } from '@/features/clientes/ClienteModal'
import { useClientes } from '@/api/queries'

const POR_PAGINA = 10

export function ClientesPage() {
  const [params, setParams] = useSearchParams()
  const [modalAbierto, setModalAbierto] = useState(false)

  const q = params.get('q') ?? ''
  const pagina = Number(params.get('pagina') ?? '1')
  const { data, isPending, isError } = useClientes(q, pagina)

  function actualizar(clave: string, valor: string) {
    const siguiente = new URLSearchParams(params)
    if (valor) siguiente.set(clave, valor)
    else siguiente.delete(clave)
    if (clave !== 'pagina') siguiente.delete('pagina')
    setParams(siguiente, { replace: true })
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Clientes</h1>
          <p className="mt-0.5 text-sm text-slate-600">
            Empresas atendidas por el taller y sus equipos registrados.
          </p>
        </div>
        <Button onClick={() => setModalAbierto(true)} iconoIzquierda={<Plus className="size-4" aria-hidden />}>
          Nuevo cliente
        </Button>
      </div>

      <Card>
        <div className="border-b border-slate-200 p-3">
          <div className="relative max-w-md">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
              aria-hidden
            />
            <Input
              type="search"
              aria-label="Buscar clientes"
              placeholder="Razón social, RUT o comuna…"
              className="pl-9"
              defaultValue={q}
              onChange={(e) => actualizar('q', e.target.value)}
            />
          </div>
        </div>

        <div className="scrollbar-slim overflow-x-auto">
          <table className="w-full min-w-3xl text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs tracking-wide text-slate-500 uppercase">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-medium">Razón social</th>
                <th scope="col" className="px-4 py-2.5 font-medium">RUT</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Comuna</th>
                <th scope="col" className="px-4 py-2.5 font-medium">Contacto</th>
              </tr>
            </thead>
            <tbody>
              {isPending && <SkeletonFilas filas={8} columnas={4} />}

              {data?.datos.map((cliente) => (
                <tr key={cliente.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="px-4 py-3">
                    <Link
                      to={`/clientes/${cliente.id}`}
                      className="text-brand-700 hover:text-brand-800 font-medium hover:underline"
                    >
                      {cliente.razonSocial}
                    </Link>
                    <p className="truncate text-xs text-slate-500">{cliente.giro}</p>
                  </td>
                  <td className="tabular px-4 py-3 text-slate-600">{cliente.rut}</td>
                  <td className="px-4 py-3 text-slate-600">{cliente.comuna}</td>
                  <td className="px-4 py-3">
                    <p className="text-slate-900">{cliente.contactoNombre}</p>
                    <p className="text-xs text-slate-500">{cliente.contactoTelefono}</p>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {isError && (
          <EmptyState
            icono={<AlertTriangle className="size-5" aria-hidden />}
            titulo="No se pudieron cargar los clientes"
            descripcion="Ocurrió un error al consultar el listado. Vuelve a intentarlo en unos segundos."
          />
        )}

        {data && data.datos.length === 0 && (
          <EmptyState
            icono={<Users className="size-5" aria-hidden />}
            titulo={q ? 'Sin resultados' : 'Todavía no hay clientes'}
            descripcion={
              q
                ? `Ninguna empresa coincide con "${q}". Prueba con otro término.`
                : 'Registra la primera empresa para poder emitir órdenes de trabajo.'
            }
            accion={
              q ? undefined : <Button onClick={() => setModalAbierto(true)}>Nuevo cliente</Button>
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

      <ClienteModal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} />
    </div>
  )
}
