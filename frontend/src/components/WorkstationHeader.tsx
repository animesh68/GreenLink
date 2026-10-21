import React from 'react'
import {
  Trees,
  Compass,
  Sliders,
  CheckCircle2,
  GitCompare,
  HelpCircle
} from 'lucide-react'

export type WorkflowStage = 'explore' | 'configure' | 'review' | 'compare'

interface WorkstationHeaderProps {
  activeStage: WorkflowStage
  onStageChange: (stage: WorkflowStage) => void
  isBackendLive: boolean
  backendVersion: string
  hasPlan: boolean
  isStale: boolean
  onOpenGuide: () => void
}

export const WorkstationHeader: React.FC<WorkstationHeaderProps> = ({
  activeStage,
  onStageChange,
  isBackendLive,
  backendVersion,
  hasPlan,
  isStale,
  onOpenGuide
}) => {
  const stages: {
    id: WorkflowStage
    label: string
    icon: React.ComponentType<{ className?: string }>
    badge?: string
    badgeColor?: string
  }[] = [
    {
      id: 'explore',
      label: '1. Explore',
      icon: Compass
    },
    {
      id: 'configure',
      label: '2. Configure',
      icon: Sliders,
      badge: isStale ? 'Stale' : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300'
    },
    {
      id: 'review',
      label: '3. Review Plan',
      icon: CheckCircle2,
      badge: hasPlan ? (isStale ? 'Update' : 'Ready') : undefined,
      badgeColor: isStale
        ? 'bg-amber-100 text-amber-800 border-amber-300'
        : 'bg-emerald-100 text-emerald-800 border-emerald-300'
    },
    {
      id: 'compare',
      label: '4. Compare Scenarios',
      icon: GitCompare
    }
  ]

  return (
    <header className="h-16 bg-white border-b border-[#E2DFD2] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0 shadow-sm">
      {/* Brand & Study Context */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#285943] text-white flex items-center justify-center shadow-sm">
          <Trees className="w-5 h-5 text-[#86A68A]" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-bold text-[#1D2A22] tracking-tight m-0">
              GreenLink Delhi
            </h1>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-[#F7F6F0] text-[#285943] border border-[#D5D1C3]">
              GIS Workstation
            </span>
          </div>
          <p className="text-[11px] text-[#607065] m-0 hidden sm:block">
            South-Central Delhi • Urban Green Infrastructure Decision Support
          </p>
        </div>
      </div>

      {/* 4 Workflow Stage Tabs */}
      <nav
        aria-label="Workflow Navigation"
        className="flex items-center gap-1 bg-[#F7F6F0] p-1 rounded-lg border border-[#E2DFD2]"
      >
        {stages.map((stg) => {
          const Icon = stg.icon
          const isActive = activeStage === stg.id

          return (
            <button
              key={stg.id}
              onClick={() => onStageChange(stg.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer relative ${
                isActive
                  ? 'bg-white text-[#285943] shadow-sm border border-[#D5D1C3]'
                  : 'text-[#607065] hover:text-[#1D2A22] hover:bg-white/60'
              }`}
              id={`nav-stage-${stg.id}`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? 'text-[#285943]' : 'text-[#86A68A]'
                }`}
              />
              <span className="hidden md:inline">{stg.label}</span>
              <span className="md:hidden">{stg.label.replace(/^\d+\.\s*/, '')}</span>

              {stg.badge && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wider border ml-0.5 ${
                    stg.badgeColor || 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {stg.badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Status Badges & Evaluator Guide Trigger */}
      <div className="flex items-center gap-2.5">
        {/* Judge Demo Guide Trigger */}
        <button
          onClick={onOpenGuide}
          className="flex items-center gap-1.5 text-xs text-[#285943] bg-[#EBF2ED] hover:bg-[#DCE7E0] border border-[#86A68A]/60 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shadow-xs"
          title="Open Judge & Evaluator 5-step walkthrough guide"
          id="judge-guide-btn"
        >
          <HelpCircle className="w-3.5 h-3.5 text-[#285943]" />
          <span className="hidden lg:inline">Walkthrough Guide</span>
          <span className="lg:hidden">Guide</span>
        </button>

        {/* Backend Connectivity Status */}
        <div
          className="flex items-center gap-2 text-[11px] px-2.5 py-1.5 rounded-md border bg-[#FAF9F5] border-[#E2DFD2] text-[#4A5850]"
          title={isBackendLive ? 'Connected to live FastAPI backend' : 'Using cached local GeoJSON fallback'}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isBackendLive ? 'bg-emerald-600 animate-pulse' : 'bg-amber-500'
            }`}
          />
          <span className="font-medium hidden sm:inline">
            {isBackendLive ? `API v${backendVersion}` : 'Local Fallback'}
          </span>
        </div>
      </div>
    </header>
  )
}
