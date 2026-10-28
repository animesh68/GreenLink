import React, { useState } from 'react'
import type {
  StudyAreaMetadata,
  GreenSpaceFeature,
  CandidateCorridorFeature,
  CandidateSummary,
  OptimizationResponse,
  ScenarioComparisonResponse,
  CustomPlanningPoint
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
  Download,
  Play,
  Camera,
  Layers,
  ArrowRight,
  Sparkles,
  CheckSquare,
  Square,
  Plus
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
  showGreenSpaces?: boolean
  showCandidates: boolean
  showHeatGrid: boolean
  onToggleGreenSpaces?: () => void
  onToggleCandidates: () => void
  onToggleHeatGrid: () => void

  // Selection & feature inspection
  selectedFeature: GreenSpaceFeature | null
  selectedCandidate: CandidateCorridorFeature | null
  onClearSelection: () => void
  onSelectCandidateById: (candidateId: string) => void
  onInspectStreet: (candidate: CandidateCorridorFeature) => void

  // User-directed green space selection & routing
  allPatches: GreenSpaceFeature[]
  selectedPatchIds: string[]
  onTogglePatchSelection: (patchId: string) => void
  onSelectAllPatches: () => void
  onClearPatchSelection: () => void
  customPoints: CustomPlanningPoint[]
  onAddCustomPoint: (point: CustomPlanningPoint) => void
  onRemoveCustomPoint: (id: string) => void
  onGenerateCorridors: () => void
  isGeneratingCorridors: boolean
  userCorridorCount: number
  userCorridorLengthKm: number
  userCorridorCostInr: number

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
  showGreenSpaces = false,
  showCandidates,
  showHeatGrid,
  onToggleGreenSpaces,
  onToggleCandidates,
  onToggleHeatGrid,
  selectedFeature,
  selectedCandidate,
  onClearSelection,
  onSelectCandidateById,
  onInspectStreet,
  allPatches,
  selectedPatchIds,
  onTogglePatchSelection,
  onSelectAllPatches,
  onClearPatchSelection,
  customPoints,
  onAddCustomPoint,
  onRemoveCustomPoint,
  onGenerateCorridors,
  isGeneratingCorridors,
  userCorridorCount,
  userCorridorLengthKm,
  userCorridorCostInr,
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
  const [showCustomPointForm, setShowCustomPointForm] = useState<boolean>(false)
  const [customName, setCustomName] = useState<string>('')
  const [customLat, setCustomLat] = useState<string>('28.5450')
  const [customLon, setCustomLon] = useState<string>('77.1925')

  const meta = optimizedPlan?.metadata
  const obj = optimizedPlan?.objective
  const sec = optimizedPlan?.secondary_metrics
  const budgetInCrores = (budgetInr / 10000000).toFixed(2)

  // Budget Validation
  const MIN_FEASIBLE_BUDGET_INR = 3000000 // Minimum single corridor cost is ~₹30.3 Lakhs
  const isBudgetInsufficient = budgetInr < MIN_FEASIBLE_BUDGET_INR

  const totalEndpointsCount = selectedPatchIds.length + customPoints.length

  const handleAddPointSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const lat = parseFloat(customLat)
    const lon = parseFloat(customLon)
    if (!customName.trim() || isNaN(lat) || isNaN(lon)) return

    const newPt: CustomPlanningPoint = {
      id: `pt_${Date.now()}`,
      name: customName.trim(),
      coordinates: [lon, lat]
    }
    onAddCustomPoint(newPt)
    setCustomName('')
    setShowCustomPointForm(false)
  }

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
                {activeStage === 'select' && <Sliders className="w-3.5 h-3.5 text-[#285943]" />}
                {activeStage === 'review' && <CheckCircle2 className="w-3.5 h-3.5 text-[#285943]" />}
                {activeStage === 'compare' && <GitCompare className="w-3.5 h-3.5 text-[#285943]" />}
                <span>
                  {activeStage === 'explore' && 'Workflow 1 • Spatial Baseline & Explore'}
                  {activeStage === 'select' && 'Workflow 2 • Choose Areas to Connect'}
                  {activeStage === 'review' && 'Workflow 3 • Optimize & Review Plan'}
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
              {activeStage === 'select' && 'Select Green Spaces to Connect'}
              {activeStage === 'review' && 'Optimize & Review Green Corridors'}
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
                  Study boundary comprises ~<strong>{studyArea?.area_approx_km2 || 131.8} km²</strong> encompassing 12 premier urban green anchors in Delhi.
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
                      <span>Benchmark Set</span>
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
                  <span>Map Overlays</span>
                </span>

                <div className="space-y-1.5">
                  {onToggleGreenSpaces && (
                    <button
                      onClick={onToggleGreenSpaces}
                      className={`w-full flex items-center justify-between p-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer ${
                        showGreenSpaces
                          ? 'bg-[#EBF2ED] border-[#285943]/60 text-[#1D2A22]'
                          : 'bg-white border-[#E2DFD2] text-[#607065] hover:bg-[#FAF9F5]'
                      }`}
                      id="sidebar-toggle-green-spaces-btn"
                    >
                      <span className="flex items-center gap-2">
                        <Trees className={`w-3.5 h-3.5 ${showGreenSpaces ? 'text-[#285943]' : 'text-slate-400'}`} />
                        <span>Verified Green Spaces ({featureCount} Anchors)</span>
                      </span>
                      {showGreenSpaces ? (
                        <Eye className="w-4 h-4 text-[#285943]" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  )}

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
                      <span>Benchmark Corridors (14 Standard Routes)</span>
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
                      <span>Urban Heat Priority Grid (Thermal Proxy)</span>
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

                      {selectedCandidate.properties.reference_metadata && (
                        <div className="bg-[#F4F7F5] p-2.5 rounded border border-[#D9E4DD] space-y-1 text-xs">
                          <div className="text-[9.5px] uppercase font-bold text-[#285943]">Route Reference Metadata</div>
                          {typeof selectedCandidate.properties.reference_metadata.route_length_km === 'object' ? (
                            <>
                              <div className="flex justify-between">
                                <span className="text-[#607065]">Driving Route:</span>
                                <span className="font-bold text-[#1D2A22]">{selectedCandidate.properties.reference_metadata.route_length_km.driving} km</span>
                              </div>
                              {selectedCandidate.properties.reference_metadata.route_length_km.direct != null && (
                                <div className="flex justify-between">
                                  <span className="text-[#607065]">Direct Distance:</span>
                                  <span className="font-bold text-[#1D2A22]">{selectedCandidate.properties.reference_metadata.route_length_km.direct} km</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <div className="flex justify-between">
                              <span className="text-[#607065]">Route Length:</span>
                              <span className="font-bold text-[#1D2A22]">{selectedCandidate.properties.reference_metadata.route_length_km} km</span>
                            </div>
                          )}
                          <div className="text-[9px] text-[#7A8A7F] pt-1 border-t border-[#E2EBE5]">
                            Approximate — user-supplied reference
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 py-1 border-b border-[#E8E5DA]">
                        <div>
                          <span className="text-[10px] text-[#607065] block">GIS Shortest Path:</span>
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
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#285943] px-1.5 py-0.5 rounded bg-[#EBF2ED] border border-[#86A68A]/50">
                        {selectedFeature.properties.osm_type || 'Green Space Anchor'}
                      </span>
                      {selectedFeature.properties.reference_id && (
                        <span className="text-[10px] font-mono font-semibold text-[#285943] bg-[#EBF2ED] px-1.5 py-0.5 rounded border border-[#86A68A]/30">
                          {selectedFeature.properties.reference_id}
                        </span>
                      )}
                    </div>
                    <h3 className="text-xs font-bold text-[#1D2A22] m-0">
                      {selectedFeature.properties.reference_metadata?.name || selectedFeature.properties.name}
                    </h3>

                    {selectedFeature.properties.reference_metadata && (
                      <div className="bg-[#F4F7F5] p-2.5 rounded border border-[#D9E4DD] text-xs space-y-1">
                        <div className="text-[9.5px] uppercase font-bold text-[#285943]">Reference Metadata</div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#607065]">Ref Area:</span>
                          <span className="font-bold text-[#1D2A22]">{selectedFeature.properties.reference_metadata.area_ha} ha</span>
                        </div>
                        {selectedFeature.properties.reference_metadata.area_acres && (
                          <div className="text-[10px] text-[#607065]">
                            Equivalent: {selectedFeature.properties.reference_metadata.area_acres.toLocaleString()} acres · {selectedFeature.properties.reference_metadata.area_km2} km²
                          </div>
                        )}
                        {selectedFeature.properties.reference_metadata.perimeter_km && (
                          <div className="flex justify-between text-xs">
                            <span className="text-[#607065]">Ref Perimeter:</span>
                            <span className="font-bold text-[#1D2A22]">
                              {typeof selectedFeature.properties.reference_metadata.perimeter_km === 'object'
                                ? `${selectedFeature.properties.reference_metadata.perimeter_km.min}–${selectedFeature.properties.reference_metadata.perimeter_km.max} km`
                                : `${selectedFeature.properties.reference_metadata.perimeter_km} km`}
                            </span>
                          </div>
                        )}
                        <div className="text-[9px] text-[#7A8A7F] pt-1 border-t border-[#E2EBE5]">
                          Approximate — user-supplied reference
                        </div>
                      </div>
                    )}

                    <div className="bg-[#FAFAF7] p-2 rounded border border-[#E8E6DC] text-[10.5px] space-y-1">
                      <div className="text-[9px] uppercase font-bold text-[#7A8A7F]">GIS Measurements</div>
                      <div className="flex justify-between">
                        <span className="text-[#607065]">GIS Area:</span>
                        <span className="font-semibold text-[#1D2A22]">{selectedFeature.properties.area_hectares} ha</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#607065]">GIS Perimeter:</span>
                        <span className="font-semibold text-[#1D2A22]">{(selectedFeature.properties.perimeter_meters / 1000).toFixed(3)} km</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#FAF9F5] rounded-lg p-4 border border-dashed border-[#D5D1C3] text-center text-xs text-[#607065]">
                    Click any <strong className="text-[#285943]">green polygon</strong> on the map to inspect properties.
                  </div>
                )}
              </div>

              {/* Call-to-action to proceed to Select stage */}
              <div className="pt-2">
                <button
                  onClick={() => onStageChange('select')}
                  className="w-full flex items-center justify-center gap-2 p-3 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-bold cursor-pointer shadow-sm transition-all"
                >
                  <span>Connect Green Spaces (User-Directed)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 2: SELECT GREEN SPACES TO CONNECT                         */}
          {/* ============================================================== */}
          {activeStage === 'select' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Guidance Banner */}
              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#86A68A]/60 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#285943] mb-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#C28B39]" />
                  <span>User-Directed Planning</span>
                </div>
                <p className="text-[#4A5850] text-[11px] leading-relaxed m-0">
                  Select 2 or more green spaces on the map or checklist below. GreenLink routes connecting street corridors along Delhi's road network using real typologies and costs.
                </p>
              </div>

              {/* Selected Counter & Bulk Actions */}
              <div className="flex items-center justify-between text-xs pt-1 border-b border-[#E2DFD2] pb-2">
                <span className="font-bold text-[#1D2A22] flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded-full bg-[#285943] text-white flex items-center justify-center text-[10px] font-mono">
                    {totalEndpointsCount}
                  </span>
                  <span>Selected Anchors</span>
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={onSelectAllPatches}
                    className="text-[11px] text-[#285943] hover:underline font-medium cursor-pointer"
                  >
                    Select All
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    onClick={onClearPatchSelection}
                    className="text-[11px] text-[#C28B39] hover:underline font-medium cursor-pointer"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {/* Selected Tags Chips */}
              {totalEndpointsCount > 0 && (
                <div className="flex flex-wrap gap-1.5 p-2 bg-[#F7F6F0] rounded-lg border border-[#E2DFD2]">
                  {selectedPatchIds.map((pid) => {
                    const p = allPatches.find(
                      (f) => f.properties.id === pid || (f as any).id === pid
                    )
                    const name = p?.properties.name || pid
                    return (
                      <span
                        key={pid}
                        className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-[#285943] px-2 py-0.5 rounded border border-[#86A68A]/60 shadow-2xs"
                      >
                        <span className="max-w-32 truncate">{name}</span>
                        <button
                          onClick={() => onTogglePatchSelection(pid)}
                          className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                          title="Remove selection"
                        >
                          ×
                        </button>
                      </span>
                    )
                  })}
                  {customPoints.map((cp) => (
                    <span
                      key={cp.id}
                      className="inline-flex items-center gap-1 text-[11px] font-medium bg-[#FAF6ED] text-[#C28B39] px-2 py-0.5 rounded border border-[#C28B39]/50 shadow-2xs"
                    >
                      <span className="max-w-32 truncate">{cp.name}</span>
                      <button
                        onClick={() => onRemoveCustomPoint(cp.id)}
                        className="hover:text-rose-600 font-bold ml-0.5 cursor-pointer text-xs"
                        title="Remove custom point"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Green Spaces Checklist */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#607065] block">
                  Available Green Space Anchors ({allPatches.length})
                </span>
                <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                  {allPatches.map((patch) => {
                    const pid = patch.properties.id || (patch as any).id
                    const isChecked = selectedPatchIds.includes(pid)
                    return (
                      <div
                        key={pid}
                        onClick={() => onTogglePatchSelection(pid)}
                        className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition-all ${
                          isChecked
                            ? 'bg-[#EBF2ED] border-[#86A68A] text-[#1D2A22]'
                            : 'bg-white border-[#E2DFD2] text-[#4A5850] hover:bg-[#FAF9F5]'
                        }`}
                      >
                        <div className="flex items-center gap-2 overflow-hidden">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-[#285943] shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="truncate font-medium">{patch.properties.name}</span>
                        </div>
                        <span className="text-[10px] text-[#607065] font-mono shrink-0 ml-1">
                          {patch.properties.area_hectares.toFixed(0)} ha
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Add Custom Planning Point Collapsible */}
              <div className="pt-2 border-t border-[#E2DFD2]">
                <button
                  onClick={() => setShowCustomPointForm(!showCustomPointForm)}
                  className="w-full flex items-center justify-between text-xs font-semibold text-[#285943] hover:underline cursor-pointer py-1"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Custom Planning Location</span>
                  </span>
                  {showCustomPointForm ? (
                    <ChevronUp className="w-3.5 h-3.5" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5" />
                  )}
                </button>

                {showCustomPointForm && (
                  <form onSubmit={handleAddPointSubmit} className="mt-2 p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] space-y-2 text-xs">
                    <div>
                      <label className="text-[10px] font-bold text-[#607065] block mb-1">
                        Location / Landmark Name:
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. IIT Delhi Main Gate"
                        value={customName}
                        onChange={(e) => setCustomName(e.target.value)}
                        className="w-full p-1.5 rounded border border-[#D5D1C3] bg-white text-xs"
                        required
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-[#607065] block mb-1">Latitude:</label>
                        <input
                          type="text"
                          value={customLat}
                          onChange={(e) => setCustomLat(e.target.value)}
                          className="w-full p-1.5 rounded border border-[#D5D1C3] bg-white text-xs font-mono"
                          required
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-[#607065] block mb-1">Longitude:</label>
                        <input
                          type="text"
                          value={customLon}
                          onChange={(e) => setCustomLon(e.target.value)}
                          className="w-full p-1.5 rounded border border-[#D5D1C3] bg-white text-xs font-mono"
                          required
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-1.5 rounded bg-[#285943] text-white text-xs font-semibold hover:bg-[#1E4332] cursor-pointer mt-1"
                    >
                      Add Landmark Anchor
                    </button>
                  </form>
                )}
              </div>

              {/* Route Estimation & Generate Action */}
              <div className="pt-3 border-t border-[#E2DFD2] space-y-2">
                <div className="text-[11px] text-center">
                  {totalEndpointsCount < 2 ? (
                    <span className="text-amber-800 font-medium">
                      Select at least 2 green spaces to generate connecting corridors.
                    </span>
                  ) : (
                    <span className="text-[#285943] font-semibold">
                      Ready to route {(totalEndpointsCount * (totalEndpointsCount - 1)) / 2} street corridors.
                    </span>
                  )}
                </div>

                <button
                  onClick={onGenerateCorridors}
                  disabled={isGeneratingCorridors || totalEndpointsCount < 2}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-bold shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="generate-corridors-btn"
                >
                  <Sparkles className={`w-4 h-4 ${isGeneratingCorridors ? 'animate-spin' : 'text-[#86A68A]'}`} />
                  <span>
                    {isGeneratingCorridors
                      ? 'Routing Street Network Corridors...'
                      : 'Generate Corridor Recommendations'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 3: OPTIMIZE & REVIEW PLAN                                */}
          {/* ============================================================== */}
          {activeStage === 'review' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Generated Candidates Overview */}
              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#C28B39]/50 text-xs">
                <div className="flex items-center justify-between font-bold text-[#1D2A22] mb-1">
                  <span className="flex items-center gap-1.5 text-[#C28B39]">
                    <Route className="w-3.5 h-3.5" />
                    <span>Candidate Corridors Pool</span>
                  </span>
                  <span className="font-mono text-xs text-[#285943]">
                    {userCorridorCount > 0 ? userCorridorCount : candidateSummary?.total_candidates || 14} Routes
                  </span>
                </div>
                <div className="text-[11px] text-[#607065] flex items-center justify-between">
                  <span>
                    Total Network:{' '}
                    <strong>
                      {userCorridorCount > 0
                        ? `${userCorridorLengthKm.toFixed(1)} km`
                        : `${candidateSummary?.total_length_km || 46.95} km`}
                    </strong>
                  </span>
                  <span>
                    Pool Cost:{' '}
                    <strong className="text-[#C28B39]">
                      ₹
                      {(
                        (userCorridorCount > 0
                          ? userCorridorCostInr
                          : candidateSummary?.total_provisional_cost_inr || 204368000) / 10000000
                      ).toFixed(2)}{' '}
                      Cr
                    </strong>
                  </span>
                </div>
              </div>

              {/* Optimization Parameters Controls */}
              <div className="bg-white p-3.5 rounded-lg border border-[#E2DFD2] space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-[#C28B39]" />
                    <span>Municipal Budget Cap</span>
                  </label>
                  <span className="text-xs font-extrabold text-[#285943] font-mono bg-[#EBF2ED] px-2 py-0.5 rounded border border-[#86A68A]/60">
                    ₹{budgetInCrores} Cr
                  </span>
                </div>

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

                <div className="flex flex-wrap gap-1">
                  {BUDGET_PRESETS.map((preset) => {
                    const isSelected = budgetInr === preset.value
                    return (
                      <button
                        key={preset.value}
                        onClick={() => onBudgetChange(preset.value)}
                        className={`px-2 py-0.5 text-[11px] font-medium rounded transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-[#285943] text-white font-bold shadow-2xs'
                            : 'bg-[#FAF9F5] text-[#4A5850] hover:bg-[#F0EDE3] border border-[#D5D1C3]'
                        }`}
                      >
                        {preset.label}
                      </button>
                    )
                  })}
                </div>

                {/* Profile Toggle */}
                <div className="grid grid-cols-2 gap-1.5 pt-2 border-t border-[#E8E5DA]">
                  <button
                    onClick={() => onProfileChange('connectivity_first')}
                    className={`p-2 rounded border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                      profile === 'connectivity_first'
                        ? 'bg-[#FAF9F5] border-[#285943] text-[#285943] ring-1 ring-[#285943]'
                        : 'bg-white border-[#E2DFD2] text-[#607065] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Network className="w-3 h-3 text-[#285943]" />
                      <span>Connectivity</span>
                    </div>
                    <span className="text-[9px] text-[#7A8A7F] font-normal block mt-0.5">IIC distance model</span>
                  </button>

                  <button
                    onClick={() => onProfileChange('heat_priority_first')}
                    className={`p-2 rounded border text-[11px] font-semibold text-left transition-all cursor-pointer ${
                      profile === 'heat_priority_first'
                        ? 'bg-[#FAF6ED] border-[#C28B39] text-[#C28B39] ring-1 ring-[#C28B39]'
                        : 'bg-white border-[#E2DFD2] text-[#607065] hover:bg-[#FAF9F5]'
                    }`}
                  >
                    <div className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-[#C28B39]" />
                      <span>Heat Priority</span>
                    </div>
                    <span className="text-[9px] text-[#7A8A7F] font-normal block mt-0.5">50m buffer coverage</span>
                  </button>
                </div>

                {/* Run Optimizer Button */}
                <button
                  onClick={onOptimize}
                  disabled={isOptimizing || isBudgetInsufficient}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg bg-[#285943] hover:bg-[#1E4332] text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  id="run-optimizer-btn"
                >
                  <Play className={`w-3.5 h-3.5 ${isOptimizing ? 'animate-spin' : ''}`} />
                  <span>{isOptimizing ? 'Optimizing Corridor Set...' : 'Run Greedy Optimizer'}</span>
                </button>
              </div>

              {/* Optimized Results KPIs */}
              {optimizedPlan ? (
                <>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#86A68A]/60">
                      <div className="text-[10px] uppercase font-bold text-[#285943] flex items-center gap-1">
                        {meta?.profile === 'connectivity_first' ? (
                          <>
                            <Network className="w-3 h-3" />
                            <span>Connectivity</span>
                          </>
                        ) : (
                          <>
                            <Flame className="w-3 h-3 text-[#C28B39]" />
                            <span>Heat Coverage</span>
                          </>
                        )}
                      </div>
                      <div className="text-lg font-extrabold text-[#1D2A22] mt-0.5">
                        {obj?.optimized_value.toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#607065]">{obj?.units}</span>
                      </div>
                      <div className="text-[10px] text-[#285943] font-semibold">
                        +{obj?.gain_absolute.toFixed(2)} gain
                      </div>
                    </div>

                    <div className="bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2DFD2]">
                      <div className="text-[10px] uppercase font-bold text-[#607065] flex items-center gap-1">
                        <Coins className="w-3 h-3 text-[#C28B39]" />
                        <span>Budget Spent</span>
                      </div>
                      <div className="text-lg font-extrabold text-[#1D2A22] mt-0.5">
                        ₹{((meta?.total_spent_inr || 0) / 10000000).toFixed(2)}{' '}
                        <span className="text-[10px] font-normal text-[#607065]">Cr</span>
                      </div>
                      <div className="text-[10px] text-[#285943] font-semibold">
                        {meta?.budget_utilization_pct.toFixed(1)}% utilized
                      </div>
                    </div>

                    <div className="col-span-2 bg-[#FAF9F5] p-2.5 rounded-lg border border-[#E2DFD2] flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#285943]" />
                        <div>
                          <span className="text-[10px] uppercase font-bold text-[#607065] block">
                            Ecological Fragmentation
                          </span>
                          <span className="text-xs font-bold text-[#1D2A22]">
                            {sec?.connected_components_baseline ?? 0} → {sec?.connected_components_optimized ?? 0} isolated clusters
                          </span>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-[#285943] font-mono bg-[#EBF2ED] px-2 py-0.5 rounded border border-[#86A68A]/60">
                        -{sec?.connected_components_reduction ?? 0} clusters
                      </span>
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
                            className={`rounded-lg p-2.5 transition-all cursor-pointer border ${
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
                                <span className="text-xs font-bold text-[#1D2A22] max-w-44 truncate">
                                  {cand.name}
                                </span>
                              </div>
                              <span className="text-xs font-mono font-bold text-[#285943]">
                                ₹{(cand.estimated_cost_inr / 100000).toFixed(1)}L
                              </span>
                            </div>

                            <div className="text-[11px] text-[#607065] mt-1 flex items-center gap-1">
                              <span className="text-[#285943] font-medium truncate max-w-32">{cand.source_name}</span>
                              <span className="text-slate-400">↔</span>
                              <span className="text-[#285943] font-medium truncate max-w-32">{cand.target_name}</span>
                              <span className="text-[#7A8A7F] ml-auto font-mono text-[10px]">
                                {cand.length_km} km
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[10px] text-[#607065] mt-1.5 pt-1.5 border-t border-[#E8E5DA]">
                              <div>
                                Benefit: <strong className="text-[#1D2A22]">+{cand.marginal_benefit.toFixed(2)}</strong>
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  setExpandedRationaleStep(isExpanded ? null : cand.step)
                                }}
                                className="text-[#285943] hover:text-[#1D2A22] p-0.5 cursor-pointer text-[10px] font-medium flex items-center gap-0.5"
                              >
                                <span>Rationale</span>
                                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                              </button>
                            </div>

                            {/* Expanded Selection Rationale */}
                            {isExpanded && (
                              <div className="mt-2 p-2 rounded bg-[#FAF9F5] border border-[#E2DFD2] text-[10px] text-[#4A5850] leading-relaxed">
                                {cand.selection_rationale}
                              </div>
                            )}

                            {/* Street Imagery Inspection Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                const feat = candidateSummary ? {
                                  type: 'Feature' as const,
                                  id: cand.candidate_id,
                                  properties: {
                                    candidate_id: cand.candidate_id,
                                    name: cand.name,
                                    source_anchor_id: cand.source_anchor_id,
                                    source_name: cand.source_name,
                                    target_anchor_id: cand.target_anchor_id,
                                    target_name: cand.target_name,
                                    length_m: cand.length_km * 1000,
                                    length_km: cand.length_km,
                                    euclidean_distance_m: cand.length_km * 850,
                                    circuitousness_ratio: 1.15,
                                    dominant_typology: 'secondary',
                                    road_types_breakdown_m: {},
                                    primary_streets: 'Urban Street Alignment',
                                    estimated_cost_inr: cand.estimated_cost_inr,
                                    cost_status: 'calculated',
                                    route_method: 'Dijkstra',
                                    network_source: 'OSM',
                                    status: 'selected',
                                    planning_notes: cand.selection_rationale
                                  },
                                  geometry: {
                                    type: 'LineString' as const,
                                    coordinates: [[77.215, 28.585], [77.225, 28.575]]
                                  }
                                } : null
                                if (feat) onInspectStreet(feat as any)
                              }}
                              className="w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded bg-[#F7F6F0] hover:bg-[#EAE7DC] text-[#285943] text-[10px] font-semibold border border-[#D5D1C3] transition-all cursor-pointer mt-1.5"
                            >
                              <Camera className="w-3 h-3 text-[#285943]" />
                              <span>Inspect Street Imagery</span>
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Excluded Candidates Accordion */}
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
                        <div className="mt-2 space-y-1.5">
                          {optimizedPlan.excluded_candidates.map((cand) => (
                            <div
                              key={cand.candidate_id}
                              className="p-2 rounded bg-[#FAF9F5] border border-[#E8E5DA] text-[11px]"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-[#1D2A22] truncate max-w-44">
                                  {cand.name}
                                </span>
                                <span className="text-[10px] font-mono text-[#607065]">
                                  ₹{(cand.estimated_cost_inr / 100000).toFixed(1)}L
                                </span>
                              </div>
                              <div className="text-[10px] text-rose-700 mt-0.5">
                                {cand.exclusion_reason}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Plan Export Action */}
                  <div className="pt-2 border-t border-[#E2DFD2]">
                    <button
                      onClick={onExportPlan}
                      className="w-full flex items-center justify-center gap-2 p-2.5 rounded-lg bg-white hover:bg-[#FAF9F5] border border-[#285943] text-xs font-bold text-[#285943] cursor-pointer shadow-2xs transition-all"
                      id="export-plan-btn"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export Plan (GeoJSON & Brief)</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-[#FAF9F5] rounded-lg p-4 border border-dashed border-[#D5D1C3] text-center text-xs text-[#607065] space-y-2">
                  <p className="m-0">
                    Click <strong>"Run Greedy Optimizer"</strong> above to compute the optimal corridor set for this budget.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ============================================================== */}
          {/* STAGE 4: COMPARE SCENARIOS WORKSPACE                           */}
          {/* ============================================================== */}
          {activeStage === 'compare' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div className="bg-[#FAF9F5] p-3 rounded-lg border border-[#E2DFD2] text-xs">
                <div className="flex items-center justify-between text-[#607065] mb-1">
                  <span className="font-semibold text-[#285943]">Strategic Trade-off Analysis</span>
                  <span className="font-mono text-[10px]">₹{budgetInCrores} Cr Budget</span>
                </div>
                <p className="text-[11px] text-[#4A5850] leading-relaxed m-0">
                  Compares the structural ecological graph cohesion strategy against the thermal mitigation proxy strategy under identical municipal capital constraints.
                </p>
              </div>

              {scenarioComparison ? (
                <>
                  {/* Consensus Overlap Corridors */}
                  <div className="space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#285943] flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#285943]" />
                      <span>Consensus High-Priority Corridors ({scenarioComparison.overlap_candidate_ids.length})</span>
                    </span>
                    <div className="bg-[#EBF2ED] p-2.5 rounded-lg border border-[#86A68A]/60 text-xs">
                      <div className="text-[11px] text-[#285943] font-semibold mb-1">
                        Selected by Both Strategies:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {scenarioComparison.overlap_candidate_ids.map((cid) => (
                          <span
                            key={cid}
                            className="text-[10px] font-mono px-2 py-0.5 rounded bg-white text-[#285943] border border-[#86A68A]/50 font-bold"
                          >
                            {cid}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Divergent Routes Comparison */}
                  <div className="space-y-2 pt-2 border-t border-[#E2DFD2]">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#607065] flex items-center gap-1.5">
                      <GitCompare className="w-3.5 h-3.5 text-[#C28B39]" />
                      <span>Strategy Divergence</span>
                    </span>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg bg-white border border-[#285943]/40">
                        <div className="text-[10px] uppercase font-bold text-[#285943] mb-1">
                          Connectivity Only
                        </div>
                        <div className="text-[10px] text-[#607065] space-y-1">
                          {scenarioComparison.divergent_connectivity_ids.map((id) => (
                            <div key={id} className="font-mono bg-[#FAF9F5] px-1 py-0.5 rounded">
                              {id}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="p-2.5 rounded-lg bg-white border border-[#C28B39]/40">
                        <div className="text-[10px] uppercase font-bold text-[#C28B39] mb-1">
                          Heat Priority Only
                        </div>
                        <div className="text-[10px] text-[#607065] space-y-1">
                          {scenarioComparison.divergent_heat_ids.map((id) => (
                            <div key={id} className="font-mono bg-[#FAF6ED] px-1 py-0.5 rounded">
                              {id}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Narrative */}
                  <div className="p-3 rounded-lg bg-[#FAF9F5] border border-[#E2DFD2] text-xs space-y-1">
                    <span className="font-bold text-[#1D2A22] block">Evaluation Synthesis:</span>
                    <p className="text-[11px] text-[#4A5850] leading-relaxed m-0">
                      {scenarioComparison.summary_narrative}
                    </p>
                  </div>

                  {/* Apply Strategic Scenario Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#E2DFD2]">
                    <button
                      onClick={() => onApplyPlan('connectivity_first')}
                      className="px-2 py-2 rounded bg-white hover:bg-[#FAF9F5] border border-[#285943] text-[#285943] text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Apply Connectivity Plan
                    </button>
                    <button
                      onClick={() => onApplyPlan('heat_priority_first')}
                      className="px-2 py-2 rounded bg-white hover:bg-[#FAF6ED] border border-[#C28B39] text-[#C28B39] text-xs font-semibold cursor-pointer shadow-2xs"
                    >
                      Apply Heat Plan
                    </button>
                  </div>
                </>
              ) : (
                <div className="text-center py-6">
                  <button
                    onClick={onCompare}
                    disabled={isComparing}
                    className="px-4 py-2.5 rounded-lg bg-[#285943] text-white text-xs font-bold hover:bg-[#1E4332] cursor-pointer shadow-xs"
                  >
                    {isComparing ? 'Running Scenario Models...' : 'Calculate Scenario Comparison'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
