import { useEffect } from 'react'
import { LandingPage } from './components/LandingPage/LandingPage'

export function App() {
  useEffect(() => {
    // If URL path is /app or hash targets workstation, scroll smoothly to the embedded workstation
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()

    if (
      path === '/app' ||
      path.startsWith('/app/') ||
      hash === '#/app' ||
      hash === '#app' ||
      hash === '#workstation'
    ) {
      const timer = setTimeout(() => {
        const workstationEl = document.getElementById('workstation')
        if (workstationEl) {
          workstationEl.scrollIntoView({ behavior: 'smooth' })
        }
      }, 250)
      return () => clearTimeout(timer)
    }
  }, [])

  return <LandingPage />
}

export default App
