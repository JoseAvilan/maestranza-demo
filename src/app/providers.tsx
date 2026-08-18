import { useState, type ReactNode } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ErrorApi } from '@/api/client'

export function Providers({ children }: { children: ReactNode }) {
  // El cliente vive en estado para no recrearse en cada render.
  const [cliente] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (intentos, error) => {
              // Reintentar un 404 o un 403 no cambia el resultado.
              if (error instanceof ErrorApi && error.status < 500) return false
              return intentos < 2
            },
          },
          mutations: { retry: false },
        },
      }),
  )

  return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
}
