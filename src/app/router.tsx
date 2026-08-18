import { Suspense, lazy, type ReactNode } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { LoginPage } from '@/pages/LoginPage'
import { Skeleton } from '@/components/ui/Skeleton'
import { useAuth } from '@/store/auth'
import { tienePermiso, type Permiso } from '@/domain/permissions'

/**
 * Las vistas se cargan bajo demanda. El panel arrastra la librería de gráficos
 * —de lejos la dependencia más pesada— y un técnico, que entra directo al
 * listado de órdenes, nunca llega a descargarla.
 */
const DashboardPage = lazy(() =>
  import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })),
)
const OrdenesPage = lazy(() => import('@/pages/OrdenesPage').then((m) => ({ default: m.OrdenesPage })))
const OrdenDetallePage = lazy(() =>
  import('@/pages/OrdenDetallePage').then((m) => ({ default: m.OrdenDetallePage })),
)
const ClientesPage = lazy(() =>
  import('@/pages/ClientesPage').then((m) => ({ default: m.ClientesPage })),
)
const ClienteDetallePage = lazy(() =>
  import('@/pages/ClienteDetallePage').then((m) => ({ default: m.ClienteDetallePage })),
)
const NoEncontradaPage = lazy(() =>
  import('@/pages/NoEncontradaPage').then((m) => ({ default: m.NoEncontradaPage })),
)

/** Reserva el espacio de la vista mientras baja su código. */
function CargandoVista() {
  return (
    <div className="space-y-5">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-28" />
      <Skeleton className="h-72" />
    </div>
  )
}

function RutaProtegida({ children }: { children: ReactNode }) {
  const usuario = useAuth((s) => s.usuario)
  if (!usuario) return <Navigate to="/ingresar" replace />
  return <>{children}</>
}

/** Rutas que además exigen un permiso: sin él, se redirige en vez de mostrar un vacío. */
function RutaConPermiso({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const usuario = useAuth((s) => s.usuario)
  if (!usuario) return <Navigate to="/ingresar" replace />
  if (!tienePermiso(usuario.rol, permiso)) return <Navigate to="/ordenes" replace />
  return <>{children}</>
}

export function Router() {
  return (
    <Routes>
      <Route path="/ingresar" element={<LoginPage />} />

      <Route
        element={
          <RutaProtegida>
            <AppShell />
          </RutaProtegida>
        }
      >
        <Route
          index
          element={
            <RutaConPermiso permiso="ver_dashboard">
              <Suspense fallback={<CargandoVista />}>
                <DashboardPage />
              </Suspense>
            </RutaConPermiso>
          }
        />
        <Route
          path="ordenes"
          element={
            <Suspense fallback={<CargandoVista />}>
              <OrdenesPage />
            </Suspense>
          }
        />
        <Route
          path="ordenes/:id"
          element={
            <Suspense fallback={<CargandoVista />}>
              <OrdenDetallePage />
            </Suspense>
          }
        />
        <Route
          path="clientes"
          element={
            <RutaConPermiso permiso="gestionar_clientes">
              <Suspense fallback={<CargandoVista />}>
                <ClientesPage />
              </Suspense>
            </RutaConPermiso>
          }
        />
        <Route
          path="clientes/:id"
          element={
            <RutaConPermiso permiso="gestionar_clientes">
              <Suspense fallback={<CargandoVista />}>
                <ClienteDetallePage />
              </Suspense>
            </RutaConPermiso>
          }
        />
        <Route
          path="*"
          element={
            <Suspense fallback={<CargandoVista />}>
              <NoEncontradaPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  )
}
