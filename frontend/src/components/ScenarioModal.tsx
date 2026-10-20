import React from 'react'
import type { ScenarioComparisonResponse } from '../types'
import {
  X,
  GitCompare,
  Network,
  Flame,
  CheckCircle2,
  ArrowRight,
  Layers,
  Info
} from 'lucide-react'

interface ScenarioModalProps {
  comparison: ScenarioComparisonResponse | null
  isOpen: boolean
  onClose: () => void
  onApplyPlan: (profile: 'connectivity_first' | 'heat_priority_first') => void
}

export const ScenarioModal: React.FC<ScenarioModalProps> = ({
  comparison,
  isOpen,
  onClose,
  onApplyPlan
}) => {
  if (!isOpen || !comparison) return null

  const {
    budget_inr,
    connectivity_plan,
    heat_priority_plan,
    overlap_candidate_ids,
    divergent_connectivity_ids,
    divergent_heat_ids,
    summary_narrative
  } = comparison

  const budgetCrores = (budget_inr / 10000000).toFixed(2)

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-950/80 border border-indigo-700/60 text-indigo-400">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white m-0">
                  Planning Scenario Comparison
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950/90 text-emerald-400 border border-emerald-800/60 font-semibold">
                  Budget: ₹{budgetCrores} Cr
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Side-by-side trade-off analysis between Connectivity-First and Heat-Priority-First strategies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary Narrative */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-300 mb-1.5">
              <Info className="w-4 h-4 text-indigo-400" />
              <span>Automated Strategic Evaluation</span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed m-0">
              {summary_narrative}
            </p>
          </div>

          {/* Side-by-Side Comparison Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Connectivity-First Card */}
            <div className="bg-slate-950/40 border border-emerald-800/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-emerald-400" />
                    <span className="text-sm font-bold text-emerald-400">
                      Connectivity-First Plan
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {connectivity_plan.selected_candidates.length} Corridors
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Network IIC_dist Score
                    </span>
                    <span className="text-lg font-extrabold text-emerald-400">
                      {connectivity_plan.objective.optimized_value.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-emerald-300 block font-semibold">
                      +{connectivity_plan.objective.gain_absolute.toFixed(2)} pts ({connectivity_plan.objective.gain_percent?.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Heat-Priority Area
                    </span>
                    <span className="text-lg font-extrabold text-slate-200">
                      {(connectivity_plan.secondary_metrics.heat_priority_coverage_ha ?? connectivity_plan.secondary_metrics.heat_mitigation_coverage_ha ?? 0).toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      {(connectivity_plan.secondary_metrics.corridor_buffer_physical_ha ?? connectivity_plan.secondary_metrics.canopy_buffer_physical_ha ?? 0).toFixed(1)} ha 50m buffer
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Budget Utilization
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      ₹{(connectivity_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[10px] text-emerald-400 block font-medium">
                      {connectivity_plan.metadata.budget_utilization_pct.toFixed(1)}% spent
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Component Reduction
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {connectivity_plan.secondary_metrics.connected_components_baseline} → {connectivity_plan.secondary_metrics.connected_components_optimized}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      -{connectivity_plan.secondary_metrics.connected_components_reduction} isolated clusters
                    </span>
                  </div>
                </div>

                {/* Corridors Selected */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Selected Corridors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {connectivity_plan.selected_candidates.map((c) => {
                      const isConsensus = overlap_candidate_ids.includes(c.candidate_id)
                      return (
                        <span
                          key={c.candidate_id}
                          className={`text-[11px] px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                            isConsensus
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 font-semibold'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                          title={`${c.name} (${c.length_km} km, ₹${(c.estimated_cost_inr / 100000).toFixed(1)}L)`}
                        >
                          {isConsensus && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                          {c.candidate_id}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyPlan('connectivity_first')
                  onClose()
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>Apply Connectivity-First Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Heat-Priority-First Card */}
            <div className="bg-slate-950/40 border border-amber-800/50 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-400" />
                    <span className="text-sm font-bold text-amber-400">
                      Heat-Priority-First Plan
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {heat_priority_plan.selected_candidates.length} Corridors
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Heat-Priority Coverage
                    </span>
                    <span className="text-lg font-extrabold text-amber-400">
                      {heat_priority_plan.objective.optimized_value.toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-amber-300 block font-semibold">
                      +{heat_priority_plan.objective.gain_absolute.toFixed(1)} ha priority coverage
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Network IIC_dist Score
                    </span>
                    <span className="text-lg font-extrabold text-slate-200">
                      {heat_priority_plan.secondary_metrics.connectivity_index_iic.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      +{heat_priority_plan.secondary_metrics.connectivity_index_gain.toFixed(2)} pts gain
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Budget Utilization
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      ₹{(heat_priority_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[10px] text-amber-400 block font-medium">
                      {heat_priority_plan.metadata.budget_utilization_pct.toFixed(1)}% spent
                    </span>
                  </div>

                  <div className="bg-slate-800/50 p-2.5 rounded-lg border border-slate-700/50">
                    <span className="text-[10px] uppercase text-slate-400 block font-medium">
                      Component Reduction
                    </span>
                    <span className="text-sm font-bold text-slate-100">
                      {heat_priority_plan.secondary_metrics.connected_components_baseline} → {heat_priority_plan.secondary_metrics.connected_components_optimized}
                    </span>
                    <span className="text-[10px] text-slate-400 block">
                      -{heat_priority_plan.secondary_metrics.connected_components_reduction} isolated clusters
                    </span>
                  </div>
                </div>

                {/* Corridors Selected */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-semibold text-slate-300 block">
                    Selected Corridors:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {heat_priority_plan.selected_candidates.map((c) => {
                      const isConsensus = overlap_candidate_ids.includes(c.candidate_id)
                      return (
                        <span
                          key={c.candidate_id}
                          className={`text-[11px] px-2 py-0.5 rounded font-mono flex items-center gap-1 ${
                            isConsensus
                              ? 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/60 font-semibold'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                          title={`${c.name} (${c.length_km} km, ₹${(c.estimated_cost_inr / 100000).toFixed(1)}L)`}
                        >
                          {isConsensus && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />}
                          {c.candidate_id}
                        </span>
                      )
                    })}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  onApplyPlan('heat_priority_first')
                  onClose()
                }}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-md"
              >
                <span>Apply Heat-Priority-First Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Overlap & Divergence Deep Dive */}
          <div className="p-4 rounded-lg bg-slate-950/70 border border-slate-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Corridor Agreement & Divergence Breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900/80 p-3 rounded-lg border border-emerald-700/40">
                <div className="flex items-center justify-between text-emerald-400 font-bold mb-1">
                  <span>Consensus Routes</span>
                  <span className="font-mono">{overlap_candidate_ids.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  High-priority under BOTH metrics (core no-regret investments):
                </p>
                <div className="flex flex-wrap gap-1">
                  {overlap_candidate_ids.length > 0 ? (
                    overlap_candidate_ids.map((id) => (
                      <span key={id} className="px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 font-mono text-[10px] border border-emerald-800">
                        {id}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-slate-500 italic">No exact overlap</span>
                  )}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between text-emerald-300 font-bold mb-1">
                  <span>Connectivity-Specific</span>
                  <span className="font-mono">{divergent_connectivity_ids.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Favored for bridging isolated habitat components:
                </p>
                <div className="flex flex-wrap gap-1">
                  {divergent_connectivity_ids.map((id) => (
                    <span key={id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900/80 p-3 rounded-lg border border-slate-700">
                <div className="flex items-center justify-between text-amber-300 font-bold mb-1">
                  <span>Heat-Specific</span>
                  <span className="font-mono">{divergent_heat_ids.length}</span>
                </div>
                <p className="text-[11px] text-slate-400 mb-2">
                  Favored for cooling dense built-up thermal hotspots:
                </p>
                <div className="flex flex-wrap gap-1">
                  {divergent_heat_ids.map((id) => (
                    <span key={id} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px] border border-slate-700">
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="text-[11px] text-slate-400">
            Methodology Note: Urban Heat Priority uses an empirical spatial proxy grid (not satellite LST). Corridor costs are provisional planning benchmarks.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
