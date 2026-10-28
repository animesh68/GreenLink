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
    <div className="fixed inset-0 z-50 bg-[#1D2A22]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white border border-[#D5D1C3] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#1D2A22]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2DFD2] flex items-center justify-between bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EBF2ED] border border-[#86A68A]/60 text-[#285943]">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1D2A22] m-0">
                  Planning Scenario Comparison
                </h2>
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-[#EBF2ED] text-[#285943] border border-[#86A68A]/60 font-semibold">
                  Budget: ₹{budgetCrores} Cr
                </span>
              </div>
              <p className="text-xs text-[#607065] mt-0.5 m-0">
                Side-by-side trade-off analysis between Connectivity-First and Heat-Priority-First strategies
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-[#FAF9F5] hover:bg-[#E8E5DA] text-[#607065] hover:text-[#1D2A22] border border-[#D5D1C3] transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Summary Narrative */}
          <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2]">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#285943] mb-1.5">
              <Info className="w-4 h-4 text-[#285943]" />
              <span>Automated Strategic Evaluation</span>
            </div>
            <p className="text-xs text-[#4A5850] leading-relaxed m-0">
              {summary_narrative}
            </p>
          </div>

          {/* Side-by-Side Comparison Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. Connectivity-First Card */}
            <div className="bg-[#FAF9F5] border border-[#86A68A]/60 rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DA]">
                  <div className="flex items-center gap-2">
                    <Network className="w-4 h-4 text-[#285943]" />
                    <span className="text-sm font-bold text-[#285943]">
                      Connectivity-First Plan
                    </span>
                  </div>
                  <span className="text-[10px] text-[#607065] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E5DA]">
                    {connectivity_plan.selected_candidates.length} Corridors
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Network IIC_dist Score
                    </span>
                    <span className="text-lg font-extrabold text-[#285943]">
                      {connectivity_plan.objective.optimized_value.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#285943] block font-semibold">
                      +{connectivity_plan.objective.gain_absolute.toFixed(2)} pts ({connectivity_plan.objective.gain_percent?.toFixed(1)}%)
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Heat-Priority Area
                    </span>
                    <span className="text-lg font-extrabold text-[#1D2A22]">
                      {(connectivity_plan.secondary_metrics.heat_priority_coverage_ha ?? connectivity_plan.secondary_metrics.heat_mitigation_coverage_ha ?? 0).toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-[#7A8A7F] block">
                      {(connectivity_plan.secondary_metrics.corridor_buffer_physical_ha ?? connectivity_plan.secondary_metrics.canopy_buffer_physical_ha ?? 0).toFixed(1)} ha 50m buffer
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Budget Utilization
                    </span>
                    <span className="text-sm font-bold text-[#1D2A22]">
                      ₹{(connectivity_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[10px] text-[#285943] block font-medium">
                      {connectivity_plan.metadata.budget_utilization_pct.toFixed(1)}% spent
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Component Reduction
                    </span>
                    <span className="text-sm font-bold text-[#1D2A22]">
                      {connectivity_plan.secondary_metrics.connected_components_baseline} → {connectivity_plan.secondary_metrics.connected_components_optimized}
                    </span>
                    <span className="text-[10px] text-[#607065] block">
                      -{connectivity_plan.secondary_metrics.connected_components_reduction} clusters
                    </span>
                  </div>
                </div>

                {/* Corridors Selected */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-semibold text-[#4A5850] block">
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
                              ? 'bg-[#EBF2ED] text-[#285943] border border-[#86A68A] font-bold'
                              : 'bg-white text-[#4A5850] border border-[#E2DFD2]'
                          }`}
                          title={`${c.name} (${c.length_km} km, ₹${(c.estimated_cost_inr / 100000).toFixed(1)}L)`}
                        >
                          {isConsensus && <CheckCircle2 className="w-2.5 h-2.5 text-[#285943]" />}
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
                className="w-full mt-2 py-2 px-3 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>Apply Connectivity-First Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* 2. Heat-Priority-First Card */}
            <div className="bg-[#FAF6ED] border border-[#C28B39]/50 rounded-xl p-4 flex flex-col justify-between shadow-xs">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-[#E8E5DA]">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-[#C28B39]" />
                    <span className="text-sm font-bold text-[#C28B39]">
                      Heat-Priority-First Plan
                    </span>
                  </div>
                  <span className="text-[10px] text-[#607065] font-mono bg-white px-1.5 py-0.5 rounded border border-[#E8E5DA]">
                    {heat_priority_plan.selected_candidates.length} Corridors
                  </span>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-2.5 my-4">
                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Heat-Priority Coverage
                    </span>
                    <span className="text-lg font-extrabold text-[#C28B39]">
                      {heat_priority_plan.objective.optimized_value.toFixed(1)} ha
                    </span>
                    <span className="text-[10px] text-[#C28B39] block font-semibold">
                      +{heat_priority_plan.objective.gain_absolute.toFixed(1)} ha coverage
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Network IIC_dist Score
                    </span>
                    <span className="text-lg font-extrabold text-[#1D2A22]">
                      {heat_priority_plan.secondary_metrics.connectivity_index_iic.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-[#607065] block">
                      +{heat_priority_plan.secondary_metrics.connectivity_index_gain.toFixed(2)} pts gain
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Budget Utilization
                    </span>
                    <span className="text-sm font-bold text-[#1D2A22]">
                      ₹{(heat_priority_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                    </span>
                    <span className="text-[10px] text-[#C28B39] block font-medium">
                      {heat_priority_plan.metadata.budget_utilization_pct.toFixed(1)}% spent
                    </span>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-[#E8E5DA]">
                    <span className="text-[10px] uppercase text-[#607065] block font-medium">
                      Component Reduction
                    </span>
                    <span className="text-sm font-bold text-[#1D2A22]">
                      {heat_priority_plan.secondary_metrics.connected_components_baseline} → {heat_priority_plan.secondary_metrics.connected_components_optimized}
                    </span>
                    <span className="text-[10px] text-[#607065] block">
                      -{heat_priority_plan.secondary_metrics.connected_components_reduction} clusters
                    </span>
                  </div>
                </div>

                {/* Corridors Selected */}
                <div className="space-y-1.5 mb-4">
                  <span className="text-[11px] font-semibold text-[#4A5850] block">
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
                              ? 'bg-[#EBF2ED] text-[#285943] border border-[#86A68A] font-bold'
                              : 'bg-white text-[#4A5850] border border-[#E2DFD2]'
                          }`}
                          title={`${c.name} (${c.length_km} km, ₹${(c.estimated_cost_inr / 100000).toFixed(1)}L)`}
                        >
                          {isConsensus && <CheckCircle2 className="w-2.5 h-2.5 text-[#285943]" />}
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
                className="w-full mt-2 py-2 px-3 rounded-lg bg-[#C28B39] hover:bg-[#A9752D] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
              >
                <span>Apply Heat-Priority-First Plan</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Overlap & Divergence Deep Dive */}
          <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] space-y-3">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#285943]">
              <Layers className="w-4 h-4 text-[#285943]" />
              <span>Corridor Agreement & Divergence Breakdown</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-white p-3 rounded-lg border border-[#86A68A]/60">
                <div className="flex items-center justify-between text-[#285943] font-bold mb-1">
                  <span>Consensus Routes</span>
                  <span className="font-mono bg-[#EBF2ED] px-1.5 py-0.2 rounded border border-[#86A68A]/50">
                    {overlap_candidate_ids.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#607065] mb-2">
                  High-priority under BOTH metrics (core no-regret investments):
                </p>
                <div className="flex flex-wrap gap-1">
                  {overlap_candidate_ids.length > 0 ? (
                    overlap_candidate_ids.map((id) => (
                      <span
                        key={id}
                        className="px-1.5 py-0.5 rounded bg-[#EBF2ED] text-[#285943] font-mono text-[10px] font-bold border border-[#86A68A]/60"
                      >
                        {id}
                      </span>
                    ))
                  ) : (
                    <span className="text-[10px] text-[#7A8A7F] italic">No exact overlap</span>
                  )}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E2DFD2]">
                <div className="flex items-center justify-between text-[#285943] font-bold mb-1">
                  <span>Connectivity-Specific</span>
                  <span className="font-mono bg-[#FAF9F5] px-1.5 py-0.2 rounded border border-[#E2DFD2]">
                    {divergent_connectivity_ids.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#607065] mb-2">
                  Favored for bridging isolated habitat components:
                </p>
                <div className="flex flex-wrap gap-1">
                  {divergent_connectivity_ids.map((id) => (
                    <span
                      key={id}
                      className="px-1.5 py-0.5 rounded bg-[#FAF9F5] text-[#4A5850] font-mono text-[10px] border border-[#E2DFD2]"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>

              <div className="bg-white p-3 rounded-lg border border-[#E2DFD2]">
                <div className="flex items-center justify-between text-[#C28B39] font-bold mb-1">
                  <span>Heat-Specific</span>
                  <span className="font-mono bg-[#FAF6ED] px-1.5 py-0.2 rounded border border-[#C28B39]/40">
                    {divergent_heat_ids.length}
                  </span>
                </div>
                <p className="text-[11px] text-[#607065] mb-2">
                  Favored for cooling dense built-up thermal hotspots:
                </p>
                <div className="flex flex-wrap gap-1">
                  {divergent_heat_ids.map((id) => (
                    <span
                      key={id}
                      className="px-1.5 py-0.5 rounded bg-[#FAF6ED] text-[#C28B39] font-mono text-[10px] border border-[#C28B39]/40"
                    >
                      {id}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E2DFD2] bg-[#FAF9F5] flex items-center justify-between shrink-0">
          <div className="text-[11px] text-[#7A8A7F]">
            Methodology Note: Urban Heat Priority uses an empirical spatial proxy grid (not satellite LST). Corridor costs are provisional planning benchmarks.
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-[#FAF9F5] hover:bg-[#E8E5DA] text-[#1D2A22] text-xs font-semibold border border-[#D5D1C3] transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
