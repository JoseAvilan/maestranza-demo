import type { StrictRequest, DefaultBodyType } from 'msw'
import { handlers } from './handlers'

/**
 * Respaldo cuando el service worker no puede registrarse.
 *
 * MSW normalmente intercepta la red desde un service worker, pero hay entornos
 * donde eso no es posible: navegación privada en algunos navegadores, webviews
 * embebidos, políticas corporativas que bloquean el registro. Sin respaldo, el
 * demo quedaría en blanco justo para esos visitantes.
 *
 * Aquí se envuelve `fetch` y se despachan **los mismos handlers**, con la misma
 * API pública (`handler.run`) que usa el worker. No hay una segunda
 * implementación del backend que pueda quedar desincronizada: solo cambia el
 * punto de intercepción.
 */
export function instalarInterceptorFetch(): void {
  const fetchOriginal = globalThis.fetch.bind(globalThis)

  const interceptor: typeof globalThis.fetch = async (entrada, init) => {
    const peticion = new Request(entrada as RequestInfo, init)

    // Todo lo que no sea la API simulada sale a la red de verdad.
    if (!new URL(peticion.url).pathname.startsWith('/api/')) {
      return fetchOriginal(entrada, init)
    }

    const requestId = crypto.randomUUID()

    for (const handler of handlers) {
      const resultado = await handler.run({
        request: peticion.clone() as StrictRequest<DefaultBodyType>,
        requestId,
      })

      if (resultado?.response) return resultado.response
    }

    // Ruta de /api sin handler: el mismo 404 que daría un servidor real.
    return new Response(JSON.stringify({ mensaje: 'Recurso no encontrado.' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  globalThis.fetch = interceptor
}
