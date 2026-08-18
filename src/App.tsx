import { BrowserRouter } from 'react-router-dom'
import { Providers } from '@/app/providers'
import { Router } from '@/app/router'
import { Toaster } from '@/components/ui/Toaster'

export default function App() {
  return (
    <Providers>
      <BrowserRouter>
        <Router />
        <Toaster />
      </BrowserRouter>
    </Providers>
  )
}
