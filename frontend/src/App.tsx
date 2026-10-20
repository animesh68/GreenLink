import { useState, useEffect, useCallback } from 'react'
import { Header } from './components/Header'
import { MapContainer } from './components/Map/MapContainer'
import { InfoPanel } from './components/InfoPanel'
import { PlanningPanel } from './components/PlanningPanel'
import { ScenarioModal } from './components/ScenarioModal'
import { GuideModal } from './components/GuideModal'
import {
  fetchHealth,
  fetchStudyArea,
  fetchGreenSpaces,
  fetchCandidateCorridors,
  fetchCandidateSummary,
  fetchHeatPriorityGrid,
  optimizePlan,
  compareScenarios
} from './services/api'
import type {
  GreenSpaceCollection,
  GreenSpaceFeature,
  StudyAreaMetadata,
  HealthStatus,
  CandidateCorridorCollection,
  CandidateCorridorFeature,
  CandidateSummary,
  OptimizationResponse,
  ScenarioComparisonResponse,
  HeatGridCollection
} from './types'
import { AlertCircle, RefreshCw } from 'lucide-react'

export function App() {
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [isBackendLive, setIsBackendLive] = useState<boolean>(false)
  const [studyArea, setStudyArea] = useState<StudyAreaMetadata | null>(null)
  const [greenSpaces, setGreenSpaces] = useState<GreenSpaceCollection | null>(null)
  const [candidateCorridors, setCandidateCorridors] = useState<CandidateCorridorCollection | null>(null)
  const [candidateSummary, setCandidateSummary] = useState<CandidateSummary | null>(null)
  const [heatGrid, setHeatGrid] = useState<HeatGridCollection | null>(null)
  const [selectedFeature, setSelectedFeature] = useState<GreenSpaceFeature | null>(null)
  const [selectedCandidate, setSelectedCandidate] = useState<CandidateCorridorFeature | null>(null)
  const [showCandidates, setShowCandidates] = useState<boolean>(true)
  const [showHeatGrid, setShowHeatGrid] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [fromBackend, setFromBackend] = useState<boolean>(false)

  // Phase 3 Optimization State
  const [budgetInr, setBudgetInr] = useState<number>(50000000) // ₹5.00 Crore default
  const [profile, setProfile] = useState<'connectivity_first' | 'heat_priority_first'>('connectivity_first')
  const [optimizedPlan, setOptimizedPlan] = useState<OptimizationResponse | null>(null)
  const [scenarioComparison, setScenarioComparison] = useState<ScenarioComparisonResponse | null>(null)
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false)
  const [isComparing, setIsComparing] = useState<boolean>(false)
  const [showScenarioModal, setShowScenarioModal] = useState<boolean>(false)
  const [showGuideModal, setShowGuideModal] = useState<boolean>(false)
  const [lastOptimizedBudget, setLastOptimizedBudget] = useState<number>(50000000)
  const [lastOptimizedProfile, setLastOptimizedProfile] = useState<string>('connectivity_first')

  const isStale =
    optimizedPlan !== null &&
    (budgetInr !== lastOptimizedBudget || profile !== lastOptimizedProfile)

  // Execute optimization
  const executeOptimization = useCallback(
    async (
      targetBudget = budgetInr,
      targetProfile = profile
    ) => {
      setIsOptimizing(true)
      try {
        const result = await optimizePlan(targetBudget, targetProfile)
        setOptimizedPlan(result)
        setLastOptimizedBudget(targetBudget)
        setLastOptimizedProfile(targetProfile)
      } catch (err: any) {
        console.error('Optimization error:', err)
        setError(err?.message || 'Failed to calculate optimization plan.')
      } finally {
        setIsOptimizing(false)
      }
    },
    [budgetInr, profile]
  )

  // Execute scenario comparison
  const executeComparison = async () => {
    setIsComparing(true)
    try {
      const result = await compareScenarios(budgetInr)
      setScenarioComparison(result)
      setShowScenarioModal(true)
    } catch (err: any) {
      console.error('Scenario comparison error:', err)
      setError(err?.message || 'Failed to compare planning scenarios.')
    } finally {
      setIsComparing(false)
    }
  }

  // Export Plan Handler
  const handleExportPlan = () => {
    if (!optimizedPlan) return

    // 1. Download Selected Corridors GeoJSON
    const geojsonBlob = new Blob(
      [JSON.stringify(optimizedPlan.selected_corridors_geojson, null, 2)],
      { type: 'application/geo+json' }
    )
    const geojsonUrl = URL.createObjectURL(geojsonBlob)
    const geojsonLink = document.createElement('a')
    geojsonLink.href = geojsonUrl
    geojsonLink.download = `greenlink_delhi_${optimizedPlan.metadata.profile}_corridors.geojson`
    document.body.appendChild(geojsonLink)
    geojsonLink.click()
    document.body.removeChild(geojsonLink)
    URL.revokeObjectURL(geojsonUrl)

    // 2. Download Summary Planning Brief JSON
    const briefData = {
      title: 'GreenLink Delhi Optimization Planning Brief',
      timestamp: new Date().toISOString(),
      study_area: studyArea?.study_area_name || 'South-Central Delhi',
      metadata: optimizedPlan.metadata,
      objective: optimizedPlan.objective,
      secondary_metrics: optimizedPlan.secondary_metrics,
      selected_candidates: optimizedPlan.selected_candidates,
      excluded_candidates: optimizedPlan.excluded_candidates
    }
    const briefBlob = new Blob(
      [JSON.stringify(briefData, null, 2)],
      { type: 'application/json' }
    )
    const briefUrl = URL.createObjectURL(briefBlob)
    const briefLink = document.createElement('a')
    briefLink.href = briefUrl
    briefLink.download = `greenlink_delhi_${optimizedPlan.metadata.profile}_brief.json`
    document.body.appendChild(briefLink)
    briefLink.click()
    document.body.removeChild(briefLink)
    URL.revokeObjectURL(briefUrl)
  }

  // Initial Data Load
  const loadData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 1. Health check
      const healthRes = await fetchHealth()
      setHealth(healthRes.data)
      setIsBackendLive(healthRes.isLive)

      // 2. Concurrently fetch study area, green spaces, candidate corridors, summary, and heat grid
      const [studyRes, greenRes, candRes, summaryRes, heatRes] = await Promise.all([
        fetchStudyArea(),
        fetchGreenSpaces(),
        fetchCandidateCorridors(),
        fetchCandidateSummary(),
        fetchHeatPriorityGrid()
      ])

      setStudyArea(studyRes.data)
      setGreenSpaces(greenRes.data)
      setCandidateCorridors(candRes.data)
      setCandidateSummary(summaryRes.data)
      setHeatGrid(heatRes.data)
      setFromBackend(studyRes.fromBackend && greenRes.fromBackend && candRes.fromBackend)

      // 3. Automatically run initial Phase 3 optimization at ₹5 Crore
      try {
        const initialPlan = await optimizePlan(50000000, 'connectivity_first')
        setOptimizedPlan(initialPlan)
        setLastOptimizedBudget(50000000)
        setLastOptimizedProfile('connectivity_first')
      } catch (optErr) {
        console.warn('Initial optimization run error:', optErr)
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load geospatial datasets.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleSelectFeature = (feat: GreenSpaceFeature | null) => {
    setSelectedFeature(feat)
    if (feat) setSelectedCandidate(null)
  }

  const handleSelectCandidate = (cand: CandidateCorridorFeature | null) => {
    setSelectedCandidate(cand)
    if (cand) setSelectedFeature(null)
  }

  const handleClearSelection = () => {
    setSelectedFeature(null)
    setSelectedCandidate(null)
  }

  const handleSelectCandidateById = (candidateId: string) => {
    if (!candidateCorridors) return
    const match = candidateCorridors.features.find(
      (f) => f.properties.candidate_id === candidateId
    )
    if (match) {
      handleSelectCandidate(match)
    }
  }

  const handleApplyScenarioPlan = (
    appliedProfile: 'connectivity_first' | 'heat_priority_first'
  ) => {
    if (!scenarioComparison) return
    setProfile(appliedProfile)
    const planToApply =
      appliedProfile === 'connectivity_first'
        ? scenarioComparison.connectivity_plan
        : scenarioComparison.heat_priority_plan
    setOptimizedPlan(planToApply)
    setLastOptimizedBudget(scenarioComparison.budget_inr)
    setLastOptimizedProfile(appliedProfile)
  }

  const featureCount = greenSpaces?.features?.length || 0
  const totalAreaHa =
    greenSpaces?.features?.reduce(
      (acc, f) => acc + (f.properties?.area_hectares || 0),
      0
    ) || 0

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* 1. Dashboard Header */}
      <Header
        isBackendLive={isBackendLive}
        backendVersion={health?.version || '0.1.0'}
        onOpenGuide={() => setShowGuideModal(true)}
      />

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 z-30 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="text-sm font-medium text-slate-300">
              Loading South-Central Delhi Geospatial Layers & Optimizer...
            </div>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-red-950/90 border border-red-700/80 text-red-200 px-4 py-2.5 rounded-lg shadow-2xl flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
            <button
              onClick={loadData}
              className="ml-2 underline font-semibold text-white hover:text-red-200 cursor-pointer"
            >
              Retry
            </button>
          </div>
        )}

        {/* Map Container */}
        <div className="flex-1 h-full relative">
          <MapContainer
            greenSpaces={greenSpaces}
            studyBoundary={studyArea?.boundary_geojson || null}
            candidateCorridors={candidateCorridors}
            heatGrid={heatGrid}
            optimizedPlan={optimizedPlan}
            selectedFeature={selectedFeature}
            selectedCandidate={selectedCandidate}
            showCandidates={showCandidates}
            showHeatGrid={showHeatGrid}
            onToggleCandidates={() => setShowCandidates(!showCandidates)}
            onToggleHeatGrid={() => setShowHeatGrid(!showHeatGrid)}
            onSelectFeature={handleSelectFeature}
            onSelectCandidate={handleSelectCandidate}
          />
        </div>

        {/* Spatial Information & Decision Support Panel */}
        <InfoPanel
          studyArea={studyArea}
          featureCount={featureCount}
          totalAreaHa={totalAreaHa}
          candidateSummary={candidateSummary}
          selectedFeature={selectedFeature}
          selectedCandidate={selectedCandidate}
          optimizedPlan={optimizedPlan}
          fromBackend={fromBackend}
          onClearSelection={handleClearSelection}
          onSelectCandidateById={handleSelectCandidateById}
        />
      </div>

      {/* 3. Phase 3 Interactive Planning Toolbar */}
      <PlanningPanel
        budgetInr={budgetInr}
        profile={profile}
        isOptimizing={isOptimizing}
        isComparing={isComparing}
        isStale={isStale}
        hasOptimizedPlan={optimizedPlan !== null}
        onBudgetChange={(val) => setBudgetInr(val)}
        onProfileChange={(prof) => setProfile(prof)}
        onOptimize={() => executeOptimization(budgetInr, profile)}
        onCompare={executeComparison}
        onExportPlan={handleExportPlan}
      />

      {/* 4. Side-by-Side Scenario Comparison Modal */}
      <ScenarioModal
        comparison={scenarioComparison}
        isOpen={showScenarioModal}
        onClose={() => setShowScenarioModal(false)}
        onApplyPlan={handleApplyScenarioPlan}
      />

      {/* 5. Judge & Evaluator Demonstration Guide Modal */}
      <GuideModal
        isOpen={showGuideModal}
        onClose={() => setShowGuideModal(false)}
        onRunQuickDemo={(budget, prof) => {
          setBudgetInr(budget)
          setProfile(prof)
          executeOptimization(budget, prof)
        }}
      />
    </div>

  )
}

export default App
