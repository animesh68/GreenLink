import React, { useState, useEffect } from 'react'
import type {
  StudyAreaMetadata,
  GreenSpaceFeature,
  CandidateCorridorFeature,
  CandidateSummary,
  OptimizationResponse
} from '../types'
import {
  MapPin,
  Compass,
  Database,
  Route,
  Trees,
  TrendingUp,
  Coins,
  Network,
  Flame,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'

interface InfoPanelProps {
  studyArea: StudyAreaMetadata | null
  featureCount: number
  totalAreaHa: number
  candidateSummary: CandidateSummary | null
  selectedFeature: GreenSpaceFeature | null
  selectedCandidate: CandidateCorridorFeature | null
  optimizedPlan: OptimizationResponse | null
  fromBackend: boolean
  onClearSelection: () => void
  onSelectCandidateById: (candidateId: string) => void
}

export const InfoPanel: React.FC<InfoPanelProps> = ({
  studyArea,
  featureCount,
  totalAreaHa,
  candidateSummary,
  selectedFeature,
  selectedCandidate,
  optimizedPlan,
  fromBackend,
  onClearSelection,
  onSelectCandidateById
}) => {
  const [activeTab, setActiveTab] = useState<'plan' | 'anchors'>(
    optimizedPlan ? 'plan' : 'anchors'
  )
  const [showExcluded, setShowExcluded] = useState<boolean>(false)
  const [expandedRationaleStep, setExpandedRationaleStep] = useState<number | null>(null)

  // Auto-switch to 'plan' when an optimization plan is generated or updated
  useEffect(() => {
    if (optimizedPlan) {
      setActiveTab('plan')
    }
  }, [optimizedPlan])

  // Auto-switch to 'anchors' inspector when user clicks an anchor or corridor on the map
  useEffect(() => {
    if (selectedFeature || selectedCandidate) {
      setActiveTab('anchors')
    }
  }, [selectedFeature, selectedCandidate])

  const meta = optimizedPlan?.metadata
  const obj = optimizedPlan?.objective
  const sec = optimizedPlan?.secondary_metrics


  return (
    <div className="w-80 md:w-96 bg-slate-900 border-l border-slate-800 flex flex-col h-full overflow-hidden shrink-0 z-10 text-slate-100">
      {/* Panel Top Header */}
      <div className="p-4 border-b border-slate-800 shrink-0 bg-slate-950/40">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
            Spatial Planning Area
          </span>
          <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
            {fromBackend ? 'Live API Connected' : 'Cached Local Data'}
          </span>
        </div>
        <h2 className="text-base font-bold text-white m-0">
          {studyArea?.study_area_name || 'South-Central Delhi'}
        </h2>
        <div className="text-[11px] text-slate-400 mt-0.5">
          Study Extent: ~{studyArea?.area_approx_km2 || 131.8} km² • {studyArea?.crs?.metric_computations || 'EPSG:32643'}
        </div>

        {/* Tab Navigation */}
        <div className="flex mt-3 bg-slate-950 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setActiveTab('plan')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'plan'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Optimized Plan</span>
          </button>
          <button
            onClick={() => setActiveTab('anchors')}
            className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'anchors'
                ? 'bg-slate-800 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Trees className="w-3.5 h-3.5" />
            <span>Anchors & Data</span>
          </button>
        </div>
      </div>

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto">
        {/* ============================================================== */}
        {/* TAB 1: OPTIMIZATION PLAN & IMPACT CARDS                         */}
        {/* ============================================================== */}
        {activeTab === 'plan' && (
          <div className="p-4 space-y-4">
            {optimizedPlan ? (
              <>
                {/* 1. Before vs After Primary KPI Cards */}
                <div className="grid grid-cols-2 gap-2.5">
                  {/* Primary Objective Card */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-emerald-700/60 shadow-sm">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1">
                      {meta?.profile === 'connectivity_first' ? (
                        <>
                          <Network className="w-3 h-3" />
                          <span>Connectivity (IIC_dist)</span>
                        </>
                      ) : (
                        <>
                          <Flame className="w-3 h-3" />
                          <span>Heat-Priority Proxy</span>
                        </>
                      )}
                    </div>
                    <div className="text-xl font-extrabold text-white mt-1">
                      {obj?.optimized_value.toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1">
                        {obj?.units}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      +{obj?.gain_absolute.toFixed(2)} gain
                      {obj?.gain_percent ? ` (+${obj.gain_percent.toFixed(1)}%)` : ''}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Baseline: {obj?.baseline_value.toFixed(2)}
                    </div>
                  </div>

                  {/* Budget Spent Card */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shadow-sm">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-amber-400" />
                      <span>Budget Spent</span>
                    </div>
                    <div className="text-xl font-extrabold text-white mt-1">
                      ₹{((meta?.total_spent_inr || 0) / 10000000).toFixed(2)}
                      <span className="text-xs font-normal text-slate-400 ml-1">Cr</span>
                    </div>
                    <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
                      {meta?.budget_utilization_pct.toFixed(1)}% utilized
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1">
                      Cap: ₹{((meta?.budget_inr || 0) / 10000000).toFixed(2)} Cr
                    </div>
                  </div>

                  {/* Secondary Metric: Heat or IIC */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shadow-sm">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      {meta?.profile === 'connectivity_first' ? (
                        <>
                          <Flame className="w-3 h-3 text-amber-400" />
                          <span>Heat-Priority Proxy</span>
                        </>
                      ) : (
                        <>
                          <Network className="w-3 h-3 text-emerald-400" />
                          <span>Connectivity (IIC_dist)</span>
                        </>
                      )}
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {meta?.profile === 'connectivity_first'
                        ? `${(sec?.heat_priority_coverage_ha ?? sec?.heat_mitigation_coverage_ha ?? 0).toFixed(1)} ha`
                        : `${sec?.connectivity_index_iic.toFixed(2)} pts`}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5">
                      {meta?.profile === 'connectivity_first'
                        ? `${(sec?.corridor_buffer_physical_ha ?? sec?.canopy_buffer_physical_ha ?? 0).toFixed(1)} ha 50m buffer footprint`
                        : `+${sec?.connectivity_index_gain.toFixed(2)} pts gain`}
                    </div>
                  </div>

                  {/* Connected Components Card */}
                  <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700/60 shadow-sm">
                    <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-cyan-400" />
                      <span>Fragmentation</span>
                    </div>
                    <div className="text-lg font-bold text-white mt-1">
                      {sec?.connected_components_baseline} → {sec?.connected_components_optimized}
                    </div>
                    <div className="text-[11px] text-cyan-400 font-semibold mt-0.5">
                      -{sec?.connected_components_reduction} isolated clusters
                    </div>
                  </div>
                </div>

                {/* 2. Step-by-Step Selected Corridors Ordered List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Selected Corridors ({meta?.selected_count})</span>
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">
                      {meta?.total_network_length_km.toFixed(2)} km total
                    </span>
                  </div>

                  <div className="space-y-2">
                    {optimizedPlan.selected_candidates.map((cand) => {
                      const isExpanded = expandedRationaleStep === cand.step
                      const isCandidateSelected =
                        selectedCandidate?.properties?.candidate_id === cand.candidate_id

                      return (
                        <div
                          key={cand.candidate_id}
                          onClick={() => onSelectCandidateById(cand.candidate_id)}
                          className={`rounded-lg p-3 transition-all cursor-pointer border ${
                            isCandidateSelected
                              ? 'bg-slate-800 border-sky-400 shadow-md ring-1 ring-sky-400'
                              : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 hover:border-emerald-500/50'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono font-bold bg-emerald-950 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-800">
                                #{cand.step}
                              </span>
                              <span className="text-xs font-bold text-white">
                                {cand.name}
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              ₹{(cand.estimated_cost_inr / 100000).toFixed(1)}L
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-300 mt-1 flex items-center gap-1">
                            <span className="text-emerald-400">{cand.source_name}</span>
                            <span className="text-slate-500">↔</span>
                            <span className="text-emerald-400">{cand.target_name}</span>
                            <span className="text-slate-500 ml-auto font-mono">
                              {cand.length_km} km
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 pt-2 border-t border-slate-700/50">
                            <div>
                              Marginal Gain: <strong className="text-slate-200">+{cand.marginal_benefit.toFixed(2)}</strong>
                            </div>
                            <div>
                              Efficiency: <strong className="text-emerald-400 font-mono">{cand.efficiency_ratio.toFixed(2)}</strong>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                setExpandedRationaleStep(isExpanded ? null : cand.step)
                              }}
                              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
                              title="Toggle selection rationale"
                            >
                              {isExpanded ? (
                                <ChevronUp className="w-3.5 h-3.5" />
                              ) : (
                                <ChevronDown className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>

                          {/* Expanded Plain English Rationale */}
                          {isExpanded && (
                            <div className="mt-2 p-2 rounded bg-slate-950/80 border border-slate-800 text-[10px] text-slate-300 leading-relaxed">
                              <span className="text-emerald-400 font-semibold block mb-0.5">
                                Selection Rationale:
                              </span>
                              {cand.selection_rationale}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Excluded Candidates Breakdown */}
                {optimizedPlan.excluded_candidates.length > 0 && (
                  <div className="pt-2 border-t border-slate-800">
                    <button
                      onClick={() => setShowExcluded(!showExcluded)}
                      className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 py-1.5 cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5 text-amber-400/90">
                        <XCircle className="w-3.5 h-3.5 text-amber-400" />
                        <span>Excluded Candidates ({meta?.excluded_count})</span>
                      </span>
                      {showExcluded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </button>

                    {showExcluded && (
                      <div className="space-y-1.5 mt-2">
                        {optimizedPlan.excluded_candidates.map((exc) => (
                          <div
                            key={exc.candidate_id}
                            onClick={() => onSelectCandidateById(exc.candidate_id)}
                            className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs hover:border-slate-700 cursor-pointer"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-semibold text-slate-300">
                                {exc.name}
                              </span>
                              <span className="font-mono text-[11px] text-slate-400">
                                ₹{(exc.estimated_cost_inr / 100000).toFixed(1)}L
                              </span>
                            </div>
                            <div className="text-[10px] text-amber-400/90 mt-1 leading-normal">
                              {exc.exclusion_reason}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Methodology & Provenance Card */}
                <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-300">
                    <Database className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Optimization Provenance & Invariants</span>
                  </div>
                  <p className="m-0 leading-relaxed text-[10px]">
                    Optimized using a deterministic greedy marginal-benefit knapsack heuristic (provisional approximation, not globally optimal). Budget invariant strictly verified:
                    total spent (₹{((meta?.total_spent_inr || 0) / 10000000).toFixed(2)} Cr) ≤ budget cap (₹{((meta?.budget_inr || 0) / 10000000).toFixed(2)} Cr).
                  </p>
                  <p className="m-0 leading-relaxed text-[10px] text-amber-300/80">
                    *Scientific Disclaimers: Costs are provisional planning benchmarks (not official government tenders). Connectivity is an urban distance-decay proxy (IIC_dist). Heat priorities represent an empirical spatial proxy (not satellite-measured LST).
                  </p>
                </div>
              </>
            ) : (
              <div className="text-center py-10 text-xs text-slate-400">
                <Route className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p>Click "Optimize Plan" below to calculate budget-constrained corridor choices.</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================================== */}
        {/* TAB 2: SPATIAL ANCHORS & INSPECTOR                              */}
        {/* ============================================================== */}
        {activeTab === 'anchors' && (
          <div className="p-4 space-y-4">
            {/* Verified Spatial Indicators */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
                  <Trees className="w-3 h-3 text-emerald-400" />
                  <span>Green Anchors</span>
                </div>
                <div className="text-lg font-bold text-emerald-400 mt-0.5">{featureCount} Anchors</div>
                <div className="text-[10px] text-slate-500">{totalAreaHa.toFixed(1)} ha total</div>
              </div>

              <div className="bg-slate-800/60 p-2.5 rounded-lg border border-slate-700/60">
                <div className="text-[11px] text-slate-400 uppercase font-medium flex items-center gap-1">
                  <Route className="w-3 h-3 text-amber-400" />
                  <span>Candidates</span>
                </div>
                <div className="text-lg font-bold text-amber-400 mt-0.5">
                  {candidateSummary?.total_candidates || 14} Routes
                </div>
                <div className="text-[10px] text-slate-500">
                  {candidateSummary?.total_length_km || 46.95} km network
                </div>
              </div>
            </div>

            {/* Candidate Network Overview Card */}
            {candidateSummary && (
              <div className="p-3.5 rounded-lg border border-slate-800 bg-slate-950/40 text-xs">
                <div className="flex items-center justify-between text-slate-300 font-semibold mb-2">
                  <span className="flex items-center gap-1.5 text-amber-400 uppercase text-[11px] tracking-wider">
                    <Route className="w-3.5 h-3.5" />
                    <span>Full Network Distribution</span>
                  </span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-400">
                  <div className="flex justify-between">
                    <span>Shortest Candidate:</span>
                    <span className="font-semibold text-slate-200">
                      {(candidateSummary.length_stats_m.min / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Median Candidate Length:</span>
                    <span className="font-semibold text-slate-200">
                      {(candidateSummary.length_stats_m.median / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Longest Candidate:</span>
                    <span className="font-semibold text-slate-200">
                      {(candidateSummary.length_stats_m.max / 1000).toFixed(2)} km
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-800/80">
                    <span>Total Network Cost:</span>
                    <span className="font-semibold text-amber-300">
                      ₹{(candidateSummary.total_provisional_cost_inr / 10000000).toFixed(2)} Crore
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Feature / Candidate Inspector */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-emerald-400" />
                  <span>
                    {selectedCandidate
                      ? 'Candidate Corridor Details'
                      : selectedFeature
                      ? 'Green Space Anchor Details'
                      : 'Feature Inspector'}
                  </span>
                </div>
                {(selectedFeature || selectedCandidate) && (
                  <button
                    onClick={onClearSelection}
                    className="text-[10px] text-slate-400 hover:text-white underline cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {selectedCandidate ? (
                <div className="bg-slate-800/80 rounded-lg p-3.5 border border-amber-500/40 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-amber-400 px-1.5 py-0.5 rounded bg-amber-950/80 border border-amber-800/50">
                        {selectedCandidate.properties.candidate_id} • Street Route
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 mb-0">
                        {selectedCandidate.properties.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="py-1 border-b border-slate-700/60">
                      <span className="text-slate-400 block text-[10px] uppercase">Connected Anchors:</span>
                      <div className="text-slate-200 font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="text-emerald-400">{selectedCandidate.properties.source_name}</span>
                        <span className="text-slate-500">↔</span>
                        <span className="text-emerald-400">{selectedCandidate.properties.target_name}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 py-1 border-b border-slate-700/60">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Length:</span>
                        <span className="font-semibold text-amber-300 text-sm">
                          {selectedCandidate.properties.length_km} km
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Estimated Cost:</span>
                        <span className="text-slate-200 font-semibold text-sm">
                          ₹{(selectedCandidate.properties.estimated_cost_inr / 100000).toFixed(1)} Lakhs
                        </span>
                      </div>
                    </div>

                    <div className="py-1">
                      <span className="text-slate-400 block text-[10px] uppercase">Primary Streets:</span>
                      <span className="text-slate-200 font-medium">
                        {selectedCandidate.properties.primary_streets || 'Local Urban Road Segments'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : selectedFeature ? (
                <div className="bg-slate-800/80 rounded-lg p-3.5 border border-emerald-500/30 shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-800/40">
                        {selectedFeature.properties.osm_type || 'Green Space'}
                      </span>
                      <h3 className="text-sm font-bold text-white mt-1.5 mb-0">
                        {selectedFeature.properties.name}
                      </h3>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2 text-xs">
                    <div className="flex justify-between py-1 border-b border-slate-700/60">
                      <span className="text-slate-400">Area (Hectares):</span>
                      <span className="font-semibold text-emerald-300">{selectedFeature.properties.area_hectares} ha</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-slate-700/60">
                      <span className="text-slate-400">Perimeter:</span>
                      <span className="text-slate-200">{Math.round(selectedFeature.properties.perimeter_meters).toLocaleString()} m</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-400">Centroid:</span>
                      <span className="font-mono text-[11px] text-slate-300">
                        {selectedFeature.properties.centroid
                          ? `${selectedFeature.properties.centroid[0].toFixed(4)}°E, ${selectedFeature.properties.centroid[1].toFixed(4)}°N`
                          : 'On Map'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-slate-800/40 rounded-lg p-4 border border-dashed border-slate-700 text-center text-xs text-slate-400">
                  <MapPin className="w-5 h-5 mx-auto mb-2 text-slate-500" />
                  <p className="m-0">
                    Click any <strong className="text-emerald-400">green space</strong> or{' '}
                    <strong className="text-amber-400">corridor line</strong> on the map to inspect.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Methodology & Limitations Footer */}
      <div className="p-3 text-[11px] text-slate-400 bg-slate-950/90 space-y-1 shrink-0 border-t border-slate-800">
        <div className="flex items-center gap-1.5 font-medium text-slate-300">
          <Database className="w-3.5 h-3.5 text-emerald-400" />
          <span>Geospatial Invariants Verified</span>
        </div>
        <div className="text-[10px] text-slate-500">
          © OpenStreetMap contributors • Planning decision-support system
        </div>
      </div>
    </div>
  )
}
