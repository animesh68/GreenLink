import React from 'react'
import {
  X,
  Compass,
  CheckCircle2,
  Flame,
  Network,
  AlertTriangle
} from 'lucide-react'

interface GuideModalProps {
  isOpen: boolean
  onClose: () => void
  onRunQuickDemo: (budget: number, profile: 'connectivity_first' | 'heat_priority_first') => void
}

export const GuideModal: React.FC<GuideModalProps> = ({
  isOpen,
  onClose,
  onRunQuickDemo
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-[#1D2A22]/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-[#D5D1C3] rounded-xl shadow-2xl flex flex-col overflow-hidden text-[#1D2A22]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#E2DFD2] flex items-center justify-between bg-[#FAF9F5] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[#EBF2ED] border border-[#86A68A]/60 text-[#285943]">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-[#1D2A22] m-0">
                  Judge & Evaluator Demonstration Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#EBF2ED] text-[#285943] border border-[#86A68A]/60 font-semibold uppercase">
                  90s Walkthrough
                </span>
              </div>
              <p className="text-xs text-[#607065] mt-0.5 m-0">
                How to evaluate GreenLink Delhi's geospatial optimization workflows
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Overview */}
          <div className="p-4 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] leading-relaxed text-xs text-[#4A5850]">
            <span className="text-[#285943] font-bold block text-sm mb-1">
              Urban Challenge & Demonstration Goal
            </span>
            South-Central Delhi spans 12 large green patches (1,752.7 ha) isolated by dense road grids and heat islands.
            Municipal green-corridor planning is typically manual and unconstrained. <strong>GreenLink Delhi</strong> demonstrates
            a transparent, budget-capped decision-support platform that algorithmically selects street greenways based on
            metric distance-decay connectivity and empirical heat-vulnerability coverage.
          </div>

          {/* 5-Step Evaluator Flow */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-[#285943]" />
              <span>Recommended 5-Step Evaluation Flow</span>
            </span>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#EBF2ED] text-[#285943] font-mono font-bold text-xs shrink-0 border border-[#86A68A]/60">
                  Step 1
                </span>
                <div>
                  <strong className="text-[#1D2A22] block mb-0.5">Explore the Spatial Baseline</strong>
                  <span className="text-[#607065]">
                    Inspect the 12 green anchors on the detailed MapLibre street basemap. Click any anchor (e.g., Lodhi Garden, Central Ridge) to view mapped boundary geometry, area, and centroid metadata.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#FAF6ED] text-[#C28B39] font-mono font-bold text-xs shrink-0 border border-[#C28B39]/50">
                  Step 2
                </span>
                <div>
                  <strong className="text-[#1D2A22] block mb-0.5">Inspect Candidate Street Corridors</strong>
                  <span className="text-[#607065]">
                    Observe the 14 candidate routes (46.95 km) generated via Dijkstra shortest paths along OSM street centerlines. Click any candidate line to view length, typology breakdown, and provisional cost.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#EBF2ED] text-[#285943] font-mono font-bold text-xs shrink-0 border border-[#86A68A]/60">
                  Step 3
                </span>
                <div>
                  <strong className="text-[#1D2A22] block mb-0.5">Set Municipal Budget Cap</strong>
                  <span className="text-[#607065]">
                    Use the workflow navigation to pick budget presets (₹1 Cr, ₹3 Cr, ₹5 Cr, ₹10 Cr, or Max ₹17.16 Cr). Notice how stale results are immediately flagged when parameters change.
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#EBF2ED] text-[#285943] font-mono font-bold text-xs shrink-0 border border-[#86A68A]/60">
                  Step 4
                </span>
                <div>
                  <strong className="text-[#1D2A22] block mb-0.5">Execute Optimization & Review Rationales</strong>
                  <span className="text-[#607065]">
                    Click <em>"Run Greedy Optimizer"</em>. Observe the strictly verified budget invariant, primary KPI cards, and step-by-step selection rationales explaining the marginal benefit and efficiency ratio for each selected route.
                  </span>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-[#FAF6ED] text-[#C28B39] font-mono font-bold text-xs shrink-0 border border-[#C28B39]/50">
                  Step 5
                </span>
                <div>
                  <strong className="text-[#1D2A22] block mb-0.5">Side-by-Side Scenario Trade-Off Comparison</strong>
                  <span className="text-[#607065]">
                    Click <em>"Compare Scenarios"</em> to analyze Connectivity-First vs Heat-Priority under the exact same budget. Examine consensus "no-regret" routes vs divergent corridors with genuine trade-offs.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Caveats & Transparent Disclaimers */}
          <div className="p-4 rounded-lg bg-[#FAF6ED] border border-[#C28B39]/40 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#C28B39] font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Scientific Caveats & Methodological Honesty</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-[#4A5850] m-0">
              <li><strong>OpenStreetMap Polygons:</strong> Mapped park landmarks, not field-verified ecological habitats.</li>
              <li><strong>Candidate Routes:</strong> Algorithmic street centerlines, not physically surveyed or legally approved planting sites.</li>
              <li><strong>Heat-Priority Proxy:</strong> Empirical spatial proxy (1 km grid) based on transit/green proximity, not satellite-derived LST or measured Celsius drops.</li>
              <li><strong>Cost Estimates:</strong> Typology benchmarks (₹2,000–₹6,000/m + ₹1.5L mobilization) are provisional planning estimates, not official tender prices.</li>
              <li><strong>Greedy Knapsack:</strong> Deterministic approximation heuristic; does not guarantee a global optimum.</li>
            </ul>
          </div>
        </div>

        {/* Footer with Quick Demo Triggers */}
        <div className="px-6 py-3.5 border-t border-[#E2DFD2] bg-[#FAF9F5] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-[#607065]">
            Quick 1-Click Demo Scenarios:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRunQuickDemo(50000000, 'connectivity_first')
                onClose()
              }}
              className="px-3 py-1.5 rounded-md bg-[#285943] hover:bg-[#1E4332] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Demo ₹5 Cr Connectivity</span>
            </button>
            <button
              onClick={() => {
                onRunQuickDemo(50000000, 'heat_priority_first')
                onClose()
              }}
              className="px-3 py-1.5 rounded-md bg-[#C28B39] hover:bg-[#A9752D] text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Demo ₹5 Cr Heat Proxy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
