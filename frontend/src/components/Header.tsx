import React from 'react'
import { Trees, Info, HelpCircle } from 'lucide-react'

interface HeaderProps {
  isBackendLive: boolean
  backendVersion: string
  onOpenGuide?: () => void
}

export const Header: React.FC<HeaderProps> = ({
  isBackendLive,
  backendVersion,
  onOpenGuide
}) => {
  return (
    <header className="h-16 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-6 flex items-center justify-between z-20 shrink-0">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
          <Trees className="w-6 h-6" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg font-bold tracking-tight text-white m-0">GreenLink Delhi</h1>
            <span className="text-[11px] font-medium uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60">
              Decision-Support Prototype
            </span>
          </div>
          <p className="text-xs text-slate-400 m-0">Urban Green Infrastructure & Spatial Decision Support</p>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Judge Demo Guide Trigger */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="flex items-center gap-1.5 text-xs text-emerald-300 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/60 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer shadow-sm"
            title="Open Judge & Evaluator 5-step walkthrough guide"
            id="judge-guide-btn"
          >
            <HelpCircle className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Judge Demo Guide</span>
            <span className="sm:hidden">Guide</span>
          </button>
        )}

        {/* Research / Disclaimer Notice */}
        <div className="hidden lg:flex items-center gap-1.5 text-xs text-slate-400 bg-slate-800/60 px-3 py-1.5 rounded-md border border-slate-700/50">
          <Info className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>Research Decision-Support Tool • South-Central Delhi Study Area</span>
        </div>

        {/* Backend Connectivity Status */}
        <div className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-md border bg-slate-800/80 border-slate-700">
          <span className={`w-2 h-2 rounded-full ${isBackendLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-slate-300 font-medium">
            {isBackendLive ? `FastAPI v${backendVersion} Connected` : 'Local Client Fallback'}
          </span>
        </div>
      </div>
    </header>
  )
}

