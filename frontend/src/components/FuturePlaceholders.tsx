import React from 'react'
import { Lock, Route, Coins, Network, Flame, GitCompare } from 'lucide-react'

export const FuturePlaceholders: React.FC = () => {
  const futureModules = [
    {
      name: 'Candidate Corridors',
      desc: 'Street-aligned candidate routes & rights-of-way',
      icon: Route
    },
    {
      name: 'Budget Optimizer',
      desc: 'Marginal benefit-per-cost greedy knapsack engine',
      icon: Coins
    },
    {
      name: 'Connectivity Modeling',
      desc: 'Integral Index of Connectivity (IIC) graph theory',
      icon: Network
    },
    {
      name: 'Heat Vulnerability',
      desc: 'Urban thermal hot spot mitigation weighting',
      icon: Flame
    },
    {
      name: 'Scenario Comparison',
      desc: 'Connectivity-First vs Heat-First trade-off diffing',
      icon: GitCompare
    }
  ]

  return (
    <div className="border-t border-slate-800 bg-slate-900/90 px-6 py-2.5 z-20 shrink-0">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Phase 2 Planned Capabilities (Locked)
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {futureModules.map((m, idx) => {
            const Icon = m.icon
            return (
              <div
                key={idx}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/50 border border-slate-800 text-[11px] text-slate-400 opacity-70 cursor-not-allowed select-none"
                title={`${m.name}: ${m.desc} (Coming in Phase 2)`}
              >
                <Icon className="w-3 h-3 text-slate-500" />
                <span>{m.name}</span>
                <Lock className="w-2.5 h-2.5 text-slate-600" />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
