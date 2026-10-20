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
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-400">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white m-0">
                  Judge & Evaluator Demonstration Guide
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-semibold uppercase">
                  90s Walkthrough
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 m-0">
                How to evaluate GreenLink Delhi's geospatial optimization workflows
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Executive Overview */}
          <div className="p-4 rounded-lg bg-slate-950/50 border border-slate-800 leading-relaxed text-xs text-slate-300">
            <span className="text-emerald-400 font-bold block text-sm mb-1">
              Urban Challenge & Demonstration Goal
            </span>
            South-Central Delhi spans 12 large green patches (1,752.7 ha) isolated by dense road grids and heat islands.
            Municipal green-corridor planning is typically manual and unconstrained. <strong>GreenLink Delhi</strong> demonstrates
            a transparent, budget-capped decision-support platform that algorithmically selects street greenways based on
            metric distance-decay connectivity and empirical heat-vulnerability coverage.
          </div>

          {/* 5-Step Evaluator Flow */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Recommended 5-Step Evaluation Flow</span>
            </span>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              {/* Step 1 */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-xs shrink-0 border border-emerald-800/60">
                  Step 1
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Explore the Spatial Baseline</strong>
                  <span className="text-slate-400">
                    Inspect the 12 green anchors on the MapLibre Positron basemap. Click any anchor (e.g., Lodhi Garden, Central Ridge) to view mapped boundary geometry, area, and centroid metadata.
                  </span>
                </div>
              </div>

              {/* Step 2 */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-amber-950 text-amber-400 font-mono font-bold text-xs shrink-0 border border-amber-800/60">
                  Step 2
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Inspect Candidate Street Corridors</strong>
                  <span className="text-slate-400">
                    Observe the 14 candidate routes (46.95 km) generated via Dijkstra shortest paths along OSM street centerlines. Click any candidate line to view length, typology breakdown, and provisional cost.
                  </span>
                </div>
              </div>

              {/* Step 3 */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-sky-950 text-sky-400 font-mono font-bold text-xs shrink-0 border border-sky-800/60">
                  Step 3
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Set Municipal Budget Cap</strong>
                  <span className="text-slate-400">
                    Use the bottom planning toolbar to pick budget presets (₹1 Cr, ₹3 Cr, ₹5 Cr, ₹10 Cr, or Max ₹17.16 Cr). Notice how stale results are immediately flagged when parameters change.
                  </span>
                </div>
              </div>

              {/* Step 4 */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono font-bold text-xs shrink-0 border border-emerald-800/60">
                  Step 4
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Execute Optimization & Review Rationales</strong>
                  <span className="text-slate-400">
                    Click <em>"Optimize Plan"</em>. Observe the strictly verified budget invariant, primary KPI cards, and step-by-step selection rationales explaining the marginal benefit and efficiency ratio for each selected route.
                  </span>
                </div>
              </div>

              {/* Step 5 */}
              <div className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 flex items-start gap-3">
                <span className="px-2 py-0.5 rounded bg-indigo-950 text-indigo-400 font-mono font-bold text-xs shrink-0 border border-indigo-800/60">
                  Step 5
                </span>
                <div>
                  <strong className="text-white block mb-0.5">Side-by-Side Scenario Trade-Off Comparison</strong>
                  <span className="text-slate-400">
                    Click <em>"Compare Scenarios"</em> to analyze Connectivity-First vs Heat-Priority under the exact same budget. Examine consensus "no-regret" routes vs divergent corridors with genuine trade-offs.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Scientific Caveats & Transparent Disclaimers */}
          <div className="p-4 rounded-lg bg-amber-950/20 border border-amber-800/50 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-amber-400 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>Scientific Caveats & Methodological Honesty</span>
            </div>
            <ul className="list-disc pl-5 space-y-1 text-slate-300 m-0">
              <li><strong>OpenStreetMap Polygons:</strong> Mapped park landmarks, not field-verified ecological habitats.</li>
              <li><strong>Candidate Routes:</strong> Algorithmic street centerlines, not physically surveyed or legally approved planting sites.</li>
              <li><strong>Heat-Priority Proxy:</strong> Empirical spatial proxy (1 km grid) based on transit/green proximity, not satellite-derived LST or measured Celsius drops.</li>
              <li><strong>Cost Estimates:</strong> Typology benchmarks (₹2,000–₹6,000/m + ₹1.5L mobilization) are provisional planning estimates, not official tender prices.</li>
              <li><strong>Greedy Knapsack:</strong> Deterministic approximation heuristic; does not guarantee a global optimum.</li>
            </ul>
          </div>
        </div>

        {/* Footer with Quick Demo Triggers */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <span className="text-[11px] text-slate-400">
            Quick 1-Click Demo Scenarios:
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onRunQuickDemo(50000000, 'connectivity_first')
                onClose()
              }}
              className="px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
            >
              <Network className="w-3.5 h-3.5" />
              <span>Demo ₹5 Cr Connectivity</span>
            </button>
            <button
              onClick={() => {
                onRunQuickDemo(50000000, 'heat_priority_first')
                onClose()
              }}
              className="px-3 py-1.5 rounded-md bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
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
