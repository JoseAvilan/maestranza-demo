import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

/**
 * La API simulada debe estar activa antes del primer render: si no, las
 * peticiones iniciales saldrían a la red y fallarían. Por eso el arranque es
 * asíncrono.
 *
 * Vía preferida: el service worker de MSW, que intercepta la red de verdad.
 * Si el navegador lo bloquea, se cae a un interceptor de `fetch` en el mismo
 * hilo, con los mismos handlers. El demo funciona igual en ambos casos.
 */
async function iniciarApiSimulada(): Promise<void> {
  try {
    const { worker } = await import('./mocks/browser')
    await worker.start({
      serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
      // Cualquier petición fuera de /api no es asunto del mock.
      onUnhandledRequest: 'bypass',
      quiet: true,
    })
  } catch (error) {
    console.warn(
      '[maestranza] No se pudo registrar el service worker; se usa el interceptor de fetch.',
      error,
    )
    const { instalarInterceptorFetch } = await import('./mocks/fallback')
    instalarInterceptorFetch()
  }
}

async function arrancar(): Promise<void> {
  await iniciarApiSimulada()

  const contenedor = document.getElementById('root')
  if (!contenedor) throw new Error('No se encontró el nodo raíz de la aplicación.')

  createRoot(contenedor).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void arrancar()
