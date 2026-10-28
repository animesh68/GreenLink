import React from 'react'
import {
  Sliders,
  Network,
  Flame,
  Play,
  GitCompare,
  AlertCircle,
  Download
} from 'lucide-react'

interface PlanningPanelProps {
  budgetInr: number
  profile: 'connectivity_first' | 'heat_priority_first'
  isOptimizing: boolean
  isComparing: boolean
  isStale: boolean
  hasOptimizedPlan: boolean
  onBudgetChange: (newBudget: number) => void
  onProfileChange: (newProfile: 'connectivity_first' | 'heat_priority_first') => void
  onOptimize: () => void
  onCompare: () => void
  onExportPlan?: () => void
}

const BUDGET_PRESETS = [
  { label: '₹1 Cr', value: 10000000 },
  { label: '₹3 Cr', value: 30000000 },
  { label: '₹5 Cr', value: 50000000 },
  { label: '₹10 Cr', value: 100000000 },
  { label: 'Max (₹17.2 Cr)', value: 171600000 }
]

export const PlanningPanel: React.FC<PlanningPanelProps> = ({
  budgetInr,
  profile,
  isOptimizing,
  isComparing,
  isStale,
  hasOptimizedPlan,
  onBudgetChange,
  onProfileChange,
  onOptimize,
  onCompare,
  onExportPlan
}) => {
  const budgetInCrores = (budgetInr / 10000000).toFixed(2)

  return (
    <div className="relative border-t border-slate-800 bg-slate-900/95 backdrop-blur-md px-4 sm:px-6 py-3 z-20 shrink-0 shadow-2xl">
      {/* Stale Parameters Notification Pill */}
      {isStale && hasOptimizedPlan && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500/95 text-slate-950 font-semibold text-[11px] px-3.5 py-0.5 rounded-full shadow-lg flex items-center gap-1.5 border border-amber-300">
          <AlertCircle className="w-3.5 h-3.5 text-slate-950" />
          <span>Parameters changed — Run optimization to refresh plan</span>
        </div>
      )}

      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left Section: Budget Controls */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full lg:w-auto">
          <div className="flex items-center gap-2 shrink-0">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Budget Cap:
            </span>
            <span className="text-sm font-extrabold text-emerald-400 font-mono bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800/60">
              ₹{budgetInCrores} Cr
            </span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-64">
            <input
              type="range"
              min="5000000"
              max="175000000"
              step="2500000"
              value={budgetInr}
              onChange={(e) => onBudgetChange(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              id="budget-slider"
            />
          </div>

          {/* Preset Buttons */}
          <div className="flex items-center gap-1">
            {BUDGET_PRESETS.map((preset) => {
              const isSelected = budgetInr === preset.value
              return (
                <button
                  key={preset.value}
                  onClick={() => onBudgetChange(preset.value)}
                  className={`px-2 py-1 text-[11px] font-medium rounded transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-slate-950 font-bold shadow'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/60'
                  }`}
                >
                  {preset.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Middle Section: Optimization Profile Selector */}
        <div className="flex items-center gap-2 bg-slate-950/60 p-1 rounded-lg border border-slate-800 shrink-0">
          <button
            onClick={() => onProfileChange('connectivity_first')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              profile === 'connectivity_first'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Prioritize ecological network connectivity using Distance-Weighted Connectivity Index (IIC_dist)"
          >
            <Network className="w-3.5 h-3.5" />
            <span>Connectivity-First</span>
          </button>

          <button
            onClick={() => onProfileChange('heat_priority_first')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              profile === 'heat_priority_first'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
            title="Prioritize empirical heat vulnerability proxy coverage using 50m corridor buffers"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Heat-Priority</span>
            <span
              className="text-[9px] px-1 py-0.2 rounded bg-amber-950/90 text-amber-300 border border-amber-700/50 font-normal ml-0.5"
              title="Urban Heat Vulnerability Proxy Grid (Empirical Model)"
            >
              Proxy
            </span>
          </button>
        </div>

        {/* Right Section: Action Triggers */}
        <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end shrink-0">
          {/* Export Plan Button */}
          {hasOptimizedPlan && onExportPlan && (
            <button
              onClick={onExportPlan}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-sm transition-all cursor-pointer"
              title="Export optimized green corridor plan as GeoJSON and brief"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export</span>
            </button>
          )}

          {/* Compare Scenarios Button */}
          <button
            onClick={onCompare}
            disabled={isComparing || isOptimizing}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-700/60 text-xs font-semibold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Compare Connectivity-First vs Heat-Priority-First scenarios side-by-side"
          >
            <GitCompare className={`w-3.5 h-3.5 ${isComparing ? 'animate-spin' : ''}`} />
            <span>{isComparing ? 'Comparing...' : 'Compare Scenarios'}</span>
          </button>

          {/* Optimize Button */}
          <button
            onClick={onOptimize}
            disabled={isOptimizing}
            className="flex items-center gap-2 px-4 py-1.5 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            title="Execute deterministic greedy marginal-benefit optimization under budget constraint"
            id="optimize-plan-btn"
          >
            <Play className={`w-3.5 h-3.5 fill-current ${isOptimizing ? 'animate-spin' : ''}`} />
            <span>{isOptimizing ? 'Optimizing...' : 'Optimize Plan'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}
