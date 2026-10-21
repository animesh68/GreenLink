import React, { useState } from 'react'
import type {
  StudyAreaMetadata,
  GreenSpaceFeature,
  CandidateCorridorFeature,
  CandidateSummary,
  OptimizationResponse,
  ScenarioComparisonResponse
} from '../types'
import type { WorkflowStage } from './WorkstationHeader'
import {
  Compass,
  Sliders,
  CheckCircle2,
  GitCompare,
  Trees,
  Route,
  Flame,
  Network,
  Coins,
  TrendingUp,
  MapPin,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
  AlertCircle,
  Download,
  Play,
  Camera,
  Layers,
  Database,
  ArrowRight
} from 'lucide-react'

interface WorkstationSidebarProps {
  activeStage: WorkflowStage
  onStageChange: (stage: WorkflowStage) => void
  isOpen: boolean
  onToggleOpen: () => void

  // Spatial data & layers
  studyArea: StudyAreaMetadata | null
  featureCount: number
  totalAreaHa: number
  candidateSummary: CandidateSummary | null
  showCandidates: boolean
  showHeatGrid: boolean
  onToggleCandidates: () => void
  onToggleHeatGrid: () => void

  // Selection & feature inspection
  selectedFeature: GreenSpaceFeature | null
  selectedCandidate: CandidateCorridorFeature | null
  onClearSelection: () => void
  onSelectCandidateById: (candidateId: string) => void
  onInspectStreet: (candidate: CandidateCorridorFeature) => void

  // Optimization planning
  budgetInr: number
  profile: 'connectivity_first' | 'heat_priority_first'
  isOptimizing: boolean
  isStale: boolean
  optimizedPlan: OptimizationResponse | null
  onBudgetChange: (val: number) => void
  onProfileChange: (prof: 'connectivity_first' | 'heat_priority_first') => void
  onOptimize: () => void
  onExportPlan: () => void

  // Scenario comparison
  scenarioComparison: ScenarioComparisonResponse | null
  isComparing: boolean
  onCompare: () => void
  onApplyPlan: (profile: 'connectivity_first' | 'heat_priority_first') => void
}

const BUDGET_PRESETS = [
  { label: '₹1.0 Cr', value: 10000000 },
  { label: '₹3.0 Cr', value: 30000000 },
  { label: '₹5.0 Cr', value: 50000000 },
  { label: '₹10.0 Cr', value: 100000000 },
  { label: 'Max (₹17.2 Cr)', value: 171600000 }
]

export const WorkstationSidebar: React.FC<WorkstationSidebarProps> = ({
  activeStage,
  onStageChange,
  isOpen,
  onToggleOpen,
  studyArea,
  featureCount,
  totalAreaHa,
  candidateSummary,
  showCandidates,
  showHeatGrid,
  onToggleCandidates,
  onToggleHeatGrid,
  selectedFeature,
  selectedCandidate,
  onClearSelection,
  onSelectCandidateById,
  onInspectStreet,
  budgetInr,
  profile,
  isOptimizing,
  isStale,
  optimizedPlan,
  onBudgetChange,
  onProfileChange,
  onOptimize,
  onExportPlan,
  scenarioComparison,
  isComparing,
  onCompare,
  onApplyPlan
}) => {
  const [showExcluded, setShowExcluded] = useState<boolean>(false)
  const [expandedRationaleStep, setExpandedRationaleStep] = useState<number | null>(null)

  const meta = optimizedPlan?.metadata
  const obj = optimizedPlan?.objective
  const sec = optimizedPlan?.secondary_metrics
  const budgetInCrores = (budgetInr / 10000000).toFixed(2)

  // Budget Validation
  const MIN_FEASIBLE_BUDGET_INR = 3000000 // Minimum single corridor cost is ~₹30.3 Lakhs
  const isBudgetInsufficient = budgetInr < MIN_FEASIBLE_BUDGET_INR

  return (
    <div
      className={`relative bg-white border-r border-[#E2DFD2] flex flex-col h-full transition-all duration-300 z-10 shrink-0 shadow-sm ${
        isOpen ? 'w-84 sm:w-96' : 'w-0'
      }`}
    >
      {/* Toggle collapse button */}
      <button
        onClick={onToggleOpen}
        className="absolute -right-3.5 top-5 z-30 w-7 h-7 rounded-full bg-white border border-[#D5D1C3] shadow-md flex items-center justify-center text-[#285943] hover:text-[#1D2A22] hover:bg-[#F7F6F0] cursor-pointer transition-all"
        title={isOpen ? 'Collapse panel for full map' : 'Expand GIS workstation panel'}
        id="toggle-sidebar-btn"
      >
        {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
      </button>

      {isOpen && (
        <div className="flex flex-col h-full overflow-hidden text-[#1D2A22]">
          {/* ============================================================== */}
          {/* SIDEBAR SUB-HEADER: Current Stage Title & Breadcrumb           */}
          {/* ============================================================== */}
          <div className="p-4 border-b border-[#E2DFD2] bg-[#FAF9F5] shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
                {activeStage === 'explore' && <Compass className="w-3.5 h-3.5 text-[#285943]" />}
                {activeStage === 'configure' && <Sliders className="w-3.5 h-3.5 text-[#285943]" />}
                {activeStage === 'review' && <CheckCircle2 className="w-3.5 h-3.5 text-[#285943]" />}
                {activeStage === 'compare' && <GitCompare className="w-3.5 h-3.5 text-[#285943]" />}
                <span>
                  {activeStage === 'explore' && 'Workflow 1 • Spatial Baseline & Layers'}
                  {activeStage === 'configure' && 'Workflow 2 • Optimization Parameters'}
                  {activeStage === 'review' && 'Workflow 3 • Plan Review & Rationale'}
                  {activeStage === 'compare' && 'Workflow 4 • Scenario Trade-off Analysis'}
                </span>
              </span>

              {isStale && (
                <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-300">
                  Stale Plan
                </span>
              )}
            </div>

            <h2 className="text-sm font-bold text-[#1D2A22] mt-1 mb-0">
              {activeStage === 'explore' && 'Explore Study Area & Features'}
              {activeStage === 'configure' && 'Configure Budget & Objective'}
              {activeStage === 'review' && 'Review Selected Corridors'}
              {activeStage === 'compare' && 'Compare Strategic Profiles'}
            </h2>
          </div>

          {/* ============================================================== */}
          {/* STAGE 1: EXPLORE WORKSPACE                                     */}
          {/* ============================================================== */}
          {activeStage === 'explore' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Study Area Extent Card */}
              <div className="bg-[#FAF9F5] p-3.5 rounded-lg border border-[#E2DFD2]">
                <div className="flex items-center justify-between text-xs text-[#607065] mb-1">
                  <span className="font-semibold text-[#285943]">South-Central Delhi</span>
                  <span className="font-mono text-[10px]">EPSG:32643</span>
                </div>
                <div className="text-xs text-[#4A5850] leading-relaxed">
                  Study boundary comprises ~<strong>{studyArea?.area_approx_km2 || 131.8} km²</strong> encompassing 12 premier urban green anchors and 14 street-corridor candidates.
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-[#E2DFD2]">
                  <div className="bg-white p-2 rounded border border-[#E8E5DA]">
                    <div className="text-[10px] text-[#607065] flex items-center gap-1 font-medium">
                      <Trees className="w-3 h-3 text-[#285943]" />
                      <span>Green Spaces</span>
                    </div>
                    <div className="text-sm font-bold text-[#285943] mt-0.5">
                      {featureCount} Patches
                    </div>
                    <div className="text-[10px] text-[#7A8A7F]">{totalAreaHa.toFixed(1)} ha</div>
                  </div>

                  <div className="bg-white p-2 rounded border border-[#E8E5DA]">
                    <div className="text-[10px] text-[#607065] flex items-center gap-1 font-medium">
                      <Route className="w-3 h-3 text-[#C28B39]" />
                      <span>Candidates</span>
                    </div>
                    <div className="text-sm font-bold text-[#C28B39] mt-0.5">
                      {candidateSummary?.total_candidates || 14} Routes
                    </div>
                    <div className="text-[10px] text-[#7A8A7F]">
                      {candidateSummary?.total_length_km || 46.95} km network
                    </div>
                  </div>
                </div>
              </div>

              {/* Layer Visibility Toggles */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#607065] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#285943]" />
                  <span>Interactive Map Layers</span>
                </span>

                <div className="space-y-1.5">
                  <button
                    onClick={onToggleCandidates}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      showCandidates
                        ? 'bg-[#FAF6ED] border-[#C28B39]/60 text-[#1D2A22]'
                        : 'bg-white border-[#E2DFD2] text-[#607065] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Route className={`w-3.5 h-3.5 ${showCandidates ? 'text-[#C28B39]' : 'text-slate-400'}`} />
                      <span>Candidate Corridors (14 Street Routes)</span>
                    </span>
                    {showCandidates ? (
                      <Eye className="w-4 h-4 text-[#C28B39]" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  <button
                    onClick={onToggleHeatGrid}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                      showHeatGrid
                        ? 'bg-[#FDF3F2] border-rose-300 text-[#1D2A22]'
                        : 'bg-white border-[#E2DFD2] text-[#607065] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Flame className={`w-3.5 h-3.5 ${showHeatGrid ? 'text-rose-600' : 'text-slate-400'}`} />
                      <span>Urban Heat Priority Grid (Proxy)</span>
                    </span>
                    {showHeatGrid ? (
                      <Eye className="w-4 h-4 text-rose-600" />
                    ) : (
                      <EyeOff className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </div>
              </div>

              {/* Feature Inspector */}
              <div className="space-y-2 pt-2 border-t border-[#E2DFD2]">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-[#607065] flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#285943]" />
                    <span>Selected Feature Details</span>
                  </span>
                  {(selectedFeature || selectedCandidate) && (
                    <button
                      onClick={onClearSelection}
                      className="text-[11px] text-[#285943] hover:underline font-medium cursor-pointer"
                    >
                      Deselect
                    </button>
                  )}
                </div>

                {selectedCandidate ? (
                  <div className="bg-[#FAF9F5] rounded-lg p-3.5 border border-[#C28B39]/50 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#C28B39] px-1.5 py-0.5 rounded bg-[#FAF6ED] border border-[#C28B39]/40">
                          {selectedCandidate.properties.candidate_id} • Street Corridor
                        </span>
                        <h3 className="text-xs font-bold text-[#1D2A22] mt-1 mb-0">
                          {selectedCandidate.properties.name}
                        </h3>
                      </div>
                    </div>

                    <div className="text-xs text-[#4A5850] space-y-1.5">
                      <div className="flex items-center gap-1.5 py-1 border-b border-[#E8E5DA]">
                        <span className="text-[#285943] font-semibold">
                          {selectedCandidate.properties.source_name}
                        </span>
                        <span className="text-slate-400">↔</span>
                        <span className="text-[#285943] font-semibold">
                          {selectedCandidate.properties.target_name}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 py-1 border-b border-[#E8E5DA]">
                        <div>
                          <span className="text-[10px] text-[#607065] block">Length:</span>
                          <span className="font-semibold text-[#1D2A22]">
                            {selectedCandidate.properties.length_km} km
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#607065] block">Provisional Cost:</span>
                          <span className="font-semibold text-[#C28B39]">
                            ₹{(selectedCandidate.properties.estimated_cost_inr / 100000).toFixed(1)} Lakhs
                          </span>
                        </div>
                      </div>

                      <div className="text-[11px] text-[#607065]">
                        <span className="font-semibold text-[#4A5850]">Streets: </span>
                        {selectedCandidate.properties.primary_streets || 'Local Urban Road Segments'}
                      </div>
                    </div>

                    {/* Inspect Street Imagery Action */}
                    <button
                      onClick={() => onInspectStreet(selectedCandidate)}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-md bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-semibold shadow-xs transition-all cursor-pointer mt-2"
                      id="inspect-street-btn"
                    >
                      <Camera className="w-3.5 h-3.5 text-[#86A68A]" />
                      <span>Inspect Street-Level Imagery</span>
                    </button>
                  </div>
                ) : selectedFeature ? (
                  <div className="bg-[#FAF9F5] rounded-lg p-3.5 border border-[#86A68A]/60 shadow-xs space-y-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#285943] px-1.5 py-0.5 rounded bg-[#EBF2ED] border border-[#86A68A]/50">
                      {selectedFeature.properties.osm_type || 'Green Space Anchor'}
                    </span>
                    <h3 className="text-xs font-bold text-[#1D2A22] m-0">
                      {selectedFeature.properties.name}
                    </h3>
                    <div className="text-xs text-[#4A5850] space-y-1 pt-1">
                      <div className="flex justify-between py-1 border-b border-[#E8E5DA]">
                        <span className="text-[#607065]">Area:</span>
                        <span className="font-semibold text-[#285943]">
                          {selectedFeature.properties.area_hectares} ha
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-[#E8E5DA]">
                        <span className="text-[#607065]">Perimeter:</span>
                        <span className="font-medium text-[#1D2A22]">
                          {Math.round(selectedFeature.properties.perimeter_meters).toLocaleString()} m
                        </span>
                      </div>
                      <div className="text-[10px] text-[#7A8A7F] italic pt-1">
                        OpenStreetMap planning anchor polygon.
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF9F5] rounded-lg p-4 border border-dashed border-[#D5D1C3] text-center text-xs text-[#607065]">
                    Click any <strong className="text-[#285943]">green polygon</strong> or{' '}
                    <strong className="text-[#C28B39]">candidate line</strong> on the map to inspect properties.
                  </div>
                )}
              </div>

              {/* Call-to-action to proceed to Configure stage */}
              <div className="pt-2">
                <button
                  onClick={() => onStageChange('configure')}
                  className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-[#FAF9F5] hover:bg-[#F0EDE3] border border-[#D5D1C3] text-xs font-semibold text-[#285943] cursor-pointer transition-all"
                >
                  <span>Proceed to Configure Optimization</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: CONFIGURE OPTIMIZATION WORKSPACE                      */}
          {/* ============================================================== */}
          {activeStage === 'configure' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              {/* Stale Parameters Alert */}
              {isStale && (
                <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 text-xs text-amber-900 flex items-start gap-2 shadow-xs">
                  <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">Planning Parameters Changed</span>
                    Your budget or profile has been updated. Run optimizer to recalculate the corridor plan.
                  </div>
                </div>
              )}

              {/* 1. Budget Cap Configuration */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#C28B39]" />
                    <span>Municipal Budget Cap</span>
                  </label>
                  <span className="text-sm font-extrabold text-[#285943] font-mono bg-[#EBF2ED] px-2.5 py-0.5 rounded border border-[#86A68A]/60">
                    ₹{budgetInCrores} Cr
                  </span>
                </div>

                {/* Range Slider */}
                <input
                  type="range"
                  min="5000000"
                  max="175000000"
                  step="2500000"
                  value={budgetInr}
                  onChange={(e) => onBudgetChange(Number(e.target.value))}
                  className="w-full h-2 bg-[#E2DFD2] rounded-lg appearance-none cursor-pointer accent-[#285943]"
                  id="budget-slider"
                />

                {/* Preset Chips */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {BUDGET_PRESETS.map((preset) => {
                    const isSelected = budgetInr === preset.value
                    return (
                      <button
                        key={preset.value}
                        onClick={() => onBudgetChange(preset.value)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#285943] text-white font-bold shadow-xs'
                            : 'bg-[#FAF9F5] text-[#4A5850] hover:bg-[#F0EDE3] border border-[#D5D1C3]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Insufficient Budget Warning */}
                {isBudgetInsufficient && (
                  <div className="bg-rose-50 border border-rose-300 rounded-lg p-2.5 text-xs text-rose-800 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold block">Budget Insufficient</span>
                      Cap is lower than the lowest-cost corridor (~₹30.3 Lakhs). Please allocate at least ₹50 Lakhs (₹0.50 Cr) to enable corridor selection.
                    </div>
                  </div>
                )}
              </div>

              {/* 2. Planning Objective Profile Selector */}
              <div className="space-y-3 pt-3 border-t border-[#E2DFD2]">
                <label className="text-xs font-bold uppercase tracking-wider text-[#285943] block">
                  Select Optimization Strategy
                </label>

                {/* Profile Radio Card A: Connectivity First */}
                <div
                  onClick={() => onProfileChange('connectivity_first')}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    profile === 'connectivity_first'
                      ? 'bg-[#FAF9F5] border-[#285943] ring-1 ring-[#285943] shadow-xs'
                      : 'bg-white border-[#E2DFD2] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Network className="w-4 h-4 text-[#285943]" />
                      <span className="text-xs font-bold text-[#1D2A22]">
                        1. Connectivity-First
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#EBF2ED] text-[#285943] border border-[#86A68A]/60">
                      IIC_dist
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A5850] leading-relaxed m-0">
                    Prioritizes regional ecological graph cohesion using the distance-decay Integral Index of Connectivity. Connects fragmented park components to maximize habitat mobility.
                  </p>
                </div>

                {/* Profile Radio Card B: Heat Priority First */}
                <div
                  onClick={() => onProfileChange('heat_priority_first')}
                  className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                    profile === 'heat_priority_first'
                      ? 'bg-[#FAF6ED] border-[#C28B39] ring-1 ring-[#C28B39] shadow-xs'
                      : 'bg-white border-[#E2DFD2] hover:bg-[#FAF9F5]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <Flame className="w-4 h-4 text-[#C28B39]" />
                      <span className="text-xs font-bold text-[#1D2A22]">
                        2. Heat-Priority-First
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-[#FAF6ED] text-[#C28B39] border border-[#C28B39]/50">
                      Heat Proxy
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4A5850] leading-relaxed m-0">
                    Prioritizes 50m corridor physical buffers traversing high-vulnerability urban heat island cells. Maximizes thermal mitigation proxy area per rupee spent.
                  </p>
                </div>
              </div>

              {/* 3. Action: Run Optimizer */}
              <div className="pt-2">
                <button
                  onClick={onOptimize}
                  disabled={isOptimizing || isBudgetInsufficient}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="run-optimizer-btn"
                >
                  <Play className={`w-4 h-4 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>
                    {isOptimizing ? 'Computing Optimal Plan...' : 'Run Greedy Optimizer'}
                  </span>
                </button>
                <div className="text-[10px] text-[#7A8A7F] text-center mt-2">
                  Deterministic greedy knapsack algorithm • Response in &lt;50ms
                </div>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 3: REVIEW PLAN WORKSPACE                                 */}
          {/* ============================================================== */}
          {activeStage === 'review' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {optimizedPlan ? (
                <>
                  {/* Stale Warning if parameters changed */}
                  {isStale && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-2.5 text-xs text-amber-900 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                        <span>Parameters modified</span>
                      </div>
                      <button
                        onClick={onOptimize}
                        className="text-[10px] font-bold text-[#285943] underline cursor-pointer"
                      >
                        Refresh Plan
                      </button>
                    </div>
                  )}

                  {/* Primary KPI Summary Cards */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Primary Objective KPI */}
                    <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#86A68A]/60">
                      <div className="text-[10px] uppercase font-bold text-[#285943] flex items-center gap-1">
                        {meta?.profile === 'connectivity_first' ? (
                          <>
                            <Network className="w-3 h-3" />
                            <span>Connectivity (IIC)</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3 h-3 text-[#C28B39]" />
                            <span>Heat-Priority Area</span>
                          </>
                        )}
                      </div>
                      <div className="text-xl font-extrabold text-[#1D2A22] mt-1">
                        {obj?.optimized_value.toFixed(2)}
                        <span className="text-[11px] font-normal text-[#607065] ml-1">
                          {obj?.units}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#285943] font-semibold mt-0.5">
                        +{obj?.gain_absolute.toFixed(2)} gain
                        {obj?.gain_percent ? ` (+${obj.gain_percent.toFixed(1)}%)` : ''}
                      </div>
                    </div>

                    {/* Budget Spent KPI */}
                    <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E2DFD2]">
                      <div className="text-[10px] uppercase font-bold text-[#607065] flex items-center gap-1">
                        <Coins className="w-3 h-3 text-[#C28B39]" />
                        <span>Budget Spent</span>
                      </div>
                      <div className="text-xl font-extrabold text-[#1D2A22] mt-1">
                        ₹{((meta?.total_spent_inr || 0) / 10000000).toFixed(2)}
                        <span className="text-[11px] font-normal text-[#607065] ml-1">Cr</span>
                      </div>
                      <div className="text-[11px] text-[#285943] font-semibold mt-0.5">
                        {meta?.budget_utilization_pct.toFixed(1)}% utilized
                      </div>
                    </div>

                    {/* Secondary Metric Card */}
                    <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E2DFD2]">
                      <div className="text-[10px] uppercase font-bold text-[#607065] flex items-center gap-1">
                        {meta?.profile === 'connectivity_first' ? (
                          <>
                            <Flame className="w-3 h-3 text-[#C28B39]" />
                            <span>Heat Proxy Gain</span>
                          </>
                        ) : (
                          <>
                            <Network className="w-3 h-3 text-[#285943]" />
                            <span>IIC Score Gain</span>
                          </>
                        )}
                      </div>
                      <div className="text-base font-bold text-[#1D2A22] mt-1">
                        {meta?.profile === 'connectivity_first'
                          ? `${(sec?.heat_priority_coverage_ha ?? sec?.heat_mitigation_coverage_ha ?? 0).toFixed(1)} ha`
                          : `${sec?.connectivity_index_iic.toFixed(2)} pts`}
                      </div>
                      <div className="text-[10px] text-[#7A8A7F] mt-0.5">
                        {meta?.profile === 'connectivity_first'
                          ? `${(sec?.corridor_buffer_physical_ha ?? sec?.canopy_buffer_physical_ha ?? 0).toFixed(1)} ha 50m buffer`
                          : `+${sec?.connectivity_index_gain.toFixed(2)} pts gain`}
                      </div>
                    </div>

                    {/* Fragmentation Card */}
                    <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E2DFD2]">
                      <div className="text-[10px] uppercase font-bold text-[#607065] flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-[#285943]" />
                        <span>Fragmentation</span>
                      </div>
                      <div className="text-base font-bold text-[#1D2A22] mt-1">
                        {sec?.connected_components_baseline} → {sec?.connected_components_optimized}
                      </div>
                      <div className="text-[11px] text-[#285943] font-semibold mt-0.5">
                        -{sec?.connected_components_reduction} isolated clusters
                      </div>
                    </div>
                  </div>

                  {/* Selected Corridors Ordered List */}
                  <div className="space-y-2 pt-2 border-t border-[#E2DFD2]">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#285943]" />
                        <span>Selected Corridors ({meta?.selected_count})</span>
                      </span>
                      <span className="text-[11px] font-mono text-[#607065]">
                        {meta?.total_network_length_km.toFixed(2)} km network
                      </span>
                    </div>

                    <div className="space-y-2">
                      {optimizedPlan.selected_candidates.map((cand) => {
                        const isExpanded = expandedRationaleStep === cand.step
                        const isSelectedInMap =
                          selectedCandidate?.properties?.candidate_id === cand.candidate_id

                        return (
                          <div
                            key={cand.candidate_id}
                            onClick={() => onSelectCandidateById(cand.candidate_id)}
                            className={`rounded-lg p-3 transition-all cursor-pointer border ${
                              isSelectedInMap
                                ? 'bg-[#FAF9F5] border-[#285943] ring-1 ring-[#285943] shadow-xs'
                                : 'bg-white border-[#E2DFD2] hover:bg-[#FAF9F5]'
                            }`}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-mono font-bold bg-[#EBF2ED] text-[#285943] px-1.5 py-0.5 rounded border border-[#86A68A]/60">
                                  #{cand.step}
                                </span>
                                <span className="text-xs font-bold text-[#1D2A22]">
                                  {cand.name}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-[#285943]">
                                ₹{(cand.estimated_cost_inr / 100000).toFixed(1)}L
                              </span>
                            </div>

                            <div className="text-[11px] text-[#607065] mt-1 flex items-center gap-1">
                              <span className="text-[#285943] font-medium">{cand.source_name}</span>
                              <span className="text-slate-400">↔</span>
                              <span className="text-[#285943] font-medium">{cand.target_name}</span>
                              <span className="text-[#7A8A7F] ml-auto font-mono">
                                {cand.length_km} km
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#607065] mt-2 pt-2 border-t border-[#E8E5DA]">
                              <div>
                                Benefit: <strong className="text-[#1D2A22]">+{cand.marginal_benefit.toFixed(2)}</strong>
                              </div>
                              <div>
                                Efficiency: <strong className="text-[#285943] font-mono">{cand.efficiency_ratio.toFixed(2)}</strong>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedRationaleStep(isExpanded ? null : cand.step)
                                }}
                                className="text-[#285943] hover:text-[#1D2A22] p-0.5 cursor-pointer"
                                title="Toggle selection rationale"
                              >
                                {isExpanded ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>

                            {/* Expanded Selection Rationale */}
                            {isExpanded && (
                              <div className="mt-2 p-2 rounded bg-[#FAF9F5] border border-[#E2DFD2] text-[10px] text-[#4A5850] leading-relaxed">
                                <span className="text-[#285943] font-semibold block mb-0.5">
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

                  {/* Excluded Candidates Collapsible List */}
                  {optimizedPlan.excluded_candidates.length > 0 && (
                    <div className="pt-2 border-t border-[#E2DFD2]">
                      <button
                        onClick={() => setShowExcluded(!showExcluded)}
                        className="w-full flex items-center justify-between text-xs font-semibold text-[#607065] hover:text-[#1D2A22] py-1 cursor-pointer"
                      >
                        <span className="text-[#C28B39]">
                          Excluded Candidates ({meta?.excluded_count})
                        </span>
                        {showExcluded ? (
                          <ChevronUp className="w-4 h-4 text-[#607065]" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-[#607065]" />
                        )}
                      </button>

                      {showExcluded && (
                        <div className="space-y-1.5 mt-2">
                          {optimizedPlan.excluded_candidates.map((exc) => (
                            <div
                              key={exc.candidate_id}
                              onClick={() => onSelectCandidateById(exc.candidate_id)}
                              className="p-2.5 rounded bg-[#FAF9F5] border border-[#E2DFD2] text-xs hover:border-[#D5D1C3] cursor-pointer"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#4A5850]">{exc.name}</span>
                                <span className="font-mono text-[10px] text-[#7A8A7F]">
                                  ₹{(exc.estimated_cost_inr / 100000).toFixed(1)}L
                                </span>
                              </div>
                              <div className="text-[10px] text-[#C28B39] mt-1 leading-normal">
                                {exc.exclusion_reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Export Actions */}
                  <div className="pt-2 border-t border-[#E2DFD2]">
                    <button
                      onClick={onExportPlan}
                      className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#FAF9F5] hover:bg-[#F0EDE3] border border-[#D5D1C3] text-xs font-semibold text-[#285943] transition-all cursor-pointer shadow-xs"
                      title="Download GeoJSON and JSON planning brief"
                    >
                      <Download className="w-3.5 h-3.5 text-[#285943]" />
                      <span>Export Plan (GeoJSON & Planning Brief)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-xs text-[#607065] space-y-3">
                  <Route className="w-8 h-8 text-[#86A68A] mx-auto" />
                  <p>No optimization plan generated yet.</p>
                  <button
                    onClick={() => onStageChange('configure')}
                    className="px-3 py-1.5 bg-[#285943] text-white rounded-md font-semibold text-xs cursor-pointer"
                  >
                    Go to Configure
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 4: COMPARE SCENARIOS WORKSPACE                           */}
          {/* ============================================================== */}
          {activeStage === 'compare' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E2DFD2] text-xs text-[#4A5850]">
                <div className="font-bold text-[#285943] mb-1">
                  Strategic Trade-off Analysis at ₹{budgetInCrores} Cr
                </div>
                <p className="m-0 leading-relaxed text-[11px] text-[#607065]">
                  Compares Connectivity-First (IIC network graph) against Heat-Priority-First (thermal vulnerability cells) to reveal consensus corridors vs divergent trade-offs.
                </p>
              </div>

              {!scenarioComparison ? (
                <div className="text-center py-8 space-y-3">
                  <button
                    onClick={onCompare}
                    disabled={isComparing}
                    className="px-4 py-2.5 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isComparing ? 'Calculating Comparison...' : 'Generate Scenario Comparison'}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Strategic Narrative */}
                  <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#86A68A]/60 text-xs text-[#1D2A22] leading-relaxed">
                    <span className="font-bold text-[#285943] block mb-1">
                      Automated Strategic Synthesis
                    </span>
                    <p className="m-0 text-[11px] text-[#4A5850]">
                      {scenarioComparison.summary_narrative}
                    </p>
                  </div>

                  {/* Consensus Corridors (Shared) */}
                  <div className="p-3 rounded-lg bg-[#EBF2ED] border border-[#86A68A]/60 text-xs">
                    <div className="font-bold text-[#285943] mb-1 flex items-center justify-between">
                      <span>Shared Consensus Routes</span>
                      <span className="font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-[#86A68A]/50">
                        {scenarioComparison.overlap_candidate_ids.length} Corridors
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {scenarioComparison.overlap_candidate_ids.map((id) => (
                        <button
                          key={id}
                          onClick={() => onSelectCandidateById(id)}
                          className="px-2 py-0.5 bg-white text-[#285943] font-mono font-bold text-[10px] rounded border border-[#86A68A]/50 hover:bg-[#FAF9F5] cursor-pointer"
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Side by Side Primary Metrics Table */}
                  <div className="border border-[#E2DFD2] rounded-lg overflow-hidden text-xs">
                    <div className="grid grid-cols-3 bg-[#FAF9F5] p-2 font-bold text-[11px] border-b border-[#E2DFD2]">
                      <span>Metric</span>
                      <span className="text-[#285943]">Connectivity</span>
                      <span className="text-[#C28B39]">Heat-Priority</span>
                    </div>
                    <div className="divide-y divide-[#E8E5DA] text-[11px]">
                      <div className="grid grid-cols-3 p-2">
                        <span className="text-[#607065]">IIC Score</span>
                        <span className="font-bold text-[#285943]">
                          {scenarioComparison.connectivity_plan.objective.optimized_value.toFixed(2)}
                        </span>
                        <span className="text-[#4A5850]">
                          {scenarioComparison.heat_priority_plan.secondary_metrics.connectivity_index_iic.toFixed(2)}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-2">
                        <span className="text-[#607065]">Heat Proxy Area</span>
                        <span className="text-[#4A5850]">
                          {(scenarioComparison.connectivity_plan.secondary_metrics.heat_priority_coverage_ha ?? scenarioComparison.connectivity_plan.secondary_metrics.heat_mitigation_coverage_ha ?? 0).toFixed(1)} ha
                        </span>
                        <span className="font-bold text-[#C28B39]">
                          {scenarioComparison.heat_priority_plan.objective.optimized_value.toFixed(1)} ha
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-2">
                        <span className="text-[#607065]">Total Spent</span>
                        <span className="font-mono">
                          ₹{(scenarioComparison.connectivity_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                        </span>
                        <span className="font-mono">
                          ₹{(scenarioComparison.heat_priority_plan.metadata.total_spent_inr / 10000000).toFixed(2)} Cr
                        </span>
                      </div>
                      <div className="grid grid-cols-3 p-2">
                        <span className="text-[#607065]">Selected Routes</span>
                        <span className="font-bold">
                          {scenarioComparison.connectivity_plan.selected_candidates.length}
                        </span>
                        <span className="font-bold">
                          {scenarioComparison.heat_priority_plan.selected_candidates.length}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Apply Strategy Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                      onClick={() => {
                        onApplyPlan('connectivity_first')
                        onStageChange('review')
                      }}
                      className="px-3 py-2 rounded-md bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-semibold cursor-pointer transition-all text-center"
                    >
                      Apply Connectivity Plan
                    </button>
                    <button
                      onClick={() => {
                        onApplyPlan('heat_priority_first')
                        onStageChange('review')
                      }}
                      className="px-3 py-2 rounded-md bg-[#C28B39] hover:bg-[#A9752D] text-white text-xs font-semibold cursor-pointer transition-all text-center"
                    >
                      Apply Heat Plan
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* SIDEBAR FOOTER: Attribution & Invariant Status                 */}
          {/* ============================================================== */}
          <div className="p-3 text-[10px] text-[#7A8A7F] bg-[#FAF9F5] border-t border-[#E2DFD2] shrink-0">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1 font-semibold text-[#4A5850]">
                <Database className="w-3 h-3 text-[#285943]" />
                <span>Geospatial Invariants Verified</span>
              </span>
              <span>EPSG:32643</span>
            </div>
            <div className="mt-0.5">
              Budget invariant enforced • © OpenStreetMap contributors
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
