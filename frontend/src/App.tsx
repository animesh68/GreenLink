import { useState, useEffect } from 'react'
import { LandingPage } from './components/LandingPage/LandingPage'
import { WorkstationApp } from './components/Workstation/WorkstationApp'

export function App() {
  const getInitialView = (): 'landing' | 'workstation' => {
    const path = window.location.pathname.toLowerCase()
    const hash = window.location.hash.toLowerCase()
    return path === '/app' ||
      path.startsWith('/app/') ||
      hash === '#/app' ||
      hash === '#app' ||
      hash === '#workstation'
      ? 'workstation'
      : 'landing'
  }

  const [view, setView] = useState<'landing' | 'workstation'>(getInitialView)

  useEffect(() => {
    const handleLocationChange = () => {
      const path = window.location.pathname.toLowerCase()
      const hash = window.location.hash.toLowerCase()
      if (
        path === '/app' ||
        path.startsWith('/app/') ||
        hash === '#/app' ||
        hash === '#app' ||
        hash === '#workstation'
      ) {
        setView('workstation')
      } else {
        setView('landing')
      }
    }

    window.addEventListener('hashchange', handleLocationChange)
    window.addEventListener('popstate', handleLocationChange)
    return () => {
      window.removeEventListener('hashchange', handleLocationChange)
      window.removeEventListener('popstate', handleLocationChange)
    }
  }, [])

  const handleNavigateToWorkstation = () => {
    window.location.hash = '#workstation'
    setView('workstation')
  }

  const handleBackToLanding = () => {
    window.location.hash = ''
    if (window.location.pathname === '/app') {
      window.history.pushState(null, '', '/')
    }
    setView('landing')
  }

  if (view === 'workstation') {
    return (
      <div id="workstation" className="min-h-screen bg-[#F7F6F0]">
        <WorkstationApp onBackToLanding={handleBackToLanding} />
      </div>
    )
  }

  return <LandingPage onExploreMap={handleNavigateToWorkstation} />
}

export default App
