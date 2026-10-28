import React, { useEffect, useRef, useState } from 'react'
import {
  MapPin,
  Trees,
  Route,
  TrendingUp,
  Flame,
  GitCompare,
  Network,
  Layers,
  ThermometerSun,
  Target
} from 'lucide-react'
import insightsVideoSrc from '../../assets/insights-aerial.mp4'

interface InsightsSectionProps {
  onExploreMap?: () => void
}

export const InsightsSection: React.FC<InsightsSectionProps> = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sectionRef = useRef<HTMLElement | null>(null)
  const [videoError, setVideoError] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    // Respect user motion preferences
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (prefersReducedMotion) {
      video.pause()
    } else {
      video.play().catch(() => {
        // Autoplay policy fallback: video remains on initial frame
      })
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    setHasMounted(true)

    // Immediate reveal if user prefers reduced motion or if IntersectionObserver is unsupported
    if (prefersReducedMotion || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true)
      return
    }

    const target = sectionRef.current
    if (!target) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsRevealed(true)
          observer.disconnect() // One-time organic reveal
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.1
      }
    )

    observer.observe(target)

    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true)
    }, 2500)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [prefersReducedMotion])

  const isHidden = hasMounted && !isRevealed && !prefersReducedMotion

  return (
    <section
      ref={sectionRef}
      id="insights"
      aria-label="Insights from the Landscape"
      className="relative w-full py-20 sm:py-24 lg:py-28 overflow-hidden bg-[#071913] text-white select-none"
    >
      {/* =========================================================================
          1. FULL-WIDTH AERIAL BACKGROUND VIDEO
          Aerial view of urban canopy, roads, and living city greenery
          ========================================================================= */}
      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        {!videoError && !prefersReducedMotion ? (
          <video
            ref={videoRef}
            src={insightsVideoSrc}
            autoPlay
            loop
            muted
            playsInline
            disablePictureInPicture
            disableRemotePlayback
            onError={() => setVideoError(true)}
            className="w-full h-full object-cover object-center scale-105"
            aria-hidden="true"
          />
        ) : (
          <div
            className="w-full h-full bg-[#081C15] bg-cover bg-center"
            style={{
              backgroundImage:
                'radial-gradient(circle at 50% 35%, rgba(20, 60, 45, 0.9) 0%, rgba(7, 25, 19, 0.98) 100%)'
            }}
            aria-hidden="true"
          />
        )}

        {/* Multi-layer forest-green vignette to guarantee pristine glass contrast */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 26, 20, 0.88) 0%, rgba(10, 31, 24, 0.72) 30%, rgba(8, 28, 21, 0.82) 75%, rgba(6, 20, 15, 0.95) 100%)'
          }}
          aria-hidden="true"
        />

        {/* Soft radial lime/emerald highlight in the background */}
        <div
          className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none blur-[140px] opacity-25 bg-[#7BEC78]"
          aria-hidden="true"
        />
      </div>

      {/* =========================================================================
          2. CONTENT CONTAINER
          Floating translucent liquid-glass dashboard
          ========================================================================= */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-8 sm:gap-10">
        
        {/* =====================================================================
            SECTION HEADER
            ===================================================================== */}
        <div
          className={`text-center max-w-3xl mx-auto flex flex-col items-center transition-all duration-700 ease-out ${
            isHidden ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Eyebrow badge with subtle lime accent */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#103D30]/80 border border-[#B7F34A]/30 text-[#B7F34A] text-xs font-semibold tracking-widest uppercase mb-4 shadow-[0_0_15px_rgba(183,243,74,0.15)]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A] animate-pulse" />
            Decision-Support Intelligence
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white mb-4 leading-[1.1]">
            INSIGHTS FROM THE <span className="text-[#B7F34A]">LANDSCAPE</span>
          </h2>

          <p className="text-sm sm:text-base md:text-lg text-white/80 max-w-2xl font-editorial-sans leading-relaxed">
            Turning spatial data into informed green-infrastructure decisions for Delhi.
          </p>
        </div>

        {/* =====================================================================
            PANEL A: STUDY AREA OVERVIEW (Verified Core Datasets)
            ===================================================================== */}
        <div
          className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 transition-all duration-700 delay-100 ease-out ${
            isHidden ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Metric 1: Geographic Extent */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0A1F18]/65 backdrop-blur-md border border-white/15 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group hover:border-[#B7F34A]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Study Extent</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                <MapPin className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">131.8</span>
                <span className="text-lg font-semibold text-[#B7F34A]">km²</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                South-Central Delhi geometric study extent bounded between 28.53°N–28.64°N and 77.16°E–77.27°E.
              </p>
            </div>
          </div>

          {/* Metric 2: Mapped Green Anchors */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0A1F18]/65 backdrop-blur-md border border-white/15 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group hover:border-[#B7F34A]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Green Anchors</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                <Trees className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">12</span>
                <span className="text-sm font-semibold text-[#B7F34A] uppercase tracking-wide">Anchors (1,752.7 ha)</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                OpenStreetMap polygons enclosing major regional parks (Central Ridge, Lodhi Garden, Sunder Nursery, Deer Park).
              </p>
            </div>
          </div>

          {/* Metric 3: Candidate Corridors */}
          <div className="relative overflow-hidden rounded-2xl bg-[#0A1F18]/65 backdrop-blur-md border border-white/15 p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group hover:border-[#B7F34A]/40 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Candidate Network</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                <Route className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">14</span>
                <span className="text-sm font-semibold text-[#B7F34A] uppercase tracking-wide">Routes (46.95 km)</span>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Real walkable street routes calculated via Dijkstra shortest-path along Delhi's 77k-node OSM urban road graph.
              </p>
            </div>
          </div>
        </div>

        {/* =====================================================================
            PANEL B: TWO PLANNING OBJECTIVES (Explanatory Decision Logic)
            Explaining WHY and HOW GreenLink uses these two planning parameters
            ===================================================================== */}
        <div
          className={`relative overflow-hidden rounded-3xl bg-[#0A1F18]/70 backdrop-blur-lg border border-white/15 p-6 sm:p-8 lg:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.4)] transition-all duration-700 delay-200 ease-out ${
            isHidden ? 'opacity-0 translate-y-6' : 'opacity-100 translate-y-0'
          }`}
        >
          {/* Header */}
          <div className="pb-6 border-b border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B7F34A] mb-1">
              <GitCompare className="w-4 h-4" />
              Strategic Planning Parameters
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Understanding the Two Planning Objectives
            </h3>
            <p className="text-xs sm:text-sm text-white/70 mt-1 max-w-3xl leading-relaxed">
              GreenLink evaluates potential green corridors through two complementary lenses. Here is why each parameter matters and how it shapes urban green-infrastructure decisions.
            </p>
          </div>

          {/* Side-by-Side Explanatory Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            
            {/* Objective 1: Connectivity-First */}
            <div className="relative rounded-2xl bg-gradient-to-b from-emerald-950/40 to-[#0A1F18]/80 border border-emerald-500/30 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                    <TrendingUp className="w-3.5 h-3.5 text-[#B7F34A]" />
                    Connectivity-First
                  </div>
                  <span className="text-xs text-emerald-400/70 font-mono">Topological Priority</span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  Linking Fragmented Urban Green Spaces
                </h4>
                <p className="text-xs text-white/75 leading-relaxed mb-6">
                  Urban green spaces across Delhi are fragmented by dense vehicular road networks. Connecting these isolated islands creates a continuous network rather than isolated parks.
                </p>

                {/* Explanatory Points */}
                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-500/20">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                      <Network className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                      Why it matters
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Large ecological anchors like the Central Ridge, Lodhi Garden, and Sunder Nursery function as isolated islands when cut off by multi-lane roads. Increasing network connectivity helps create continuous vegetative stepping stones.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-500/20">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                      <Layers className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                      How the metric works
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Uses the distance-weighted Integral Index of Connectivity (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-[11px]">IIC_dist</code>). It scores potential corridor additions based on the joint areas of the connected anchors and the shortest street-network distance separating them, applying a 1 km distance-decay penalty.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-emerald-500/20">
                    <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                      <Target className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                      Planning impact
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Guides municipal capital toward routes that bridge the most critical gaps in the urban matrix, prioritizing routes that tie major disjointed anchors into unified green networks.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Objective 2: Heat-Priority-First */}
            <div className="relative rounded-2xl bg-gradient-to-b from-amber-950/30 to-[#0A1F18]/80 border border-amber-500/30 p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    Heat-Priority-First
                  </div>
                  <span className="text-xs text-amber-400/70 font-mono">Thermal Vulnerability</span>
                </div>

                <h4 className="text-lg font-bold text-white mb-2">
                  Targeting High-Vulnerability Transit Spines
                </h4>
                <p className="text-xs text-white/75 leading-relaxed mb-6">
                  Concrete arterials, unshaded junctions, and dense transit corridors experience acute thermal exposure. This objective prioritizes tree canopies where pedestrian heat stress is highest.
                </p>

                {/* Explanatory Points */}
                <div className="space-y-3.5 text-xs">
                  <div className="p-3.5 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                      <ThermometerSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Why it matters
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Delhi's heavily built, high-traffic commercial and transit corridors absorb and trap solar radiation with minimal shade. Prioritizing green corridors along concrete corridors brings canopy cover to areas of high pedestrian exposure.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                      <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      How the metric works
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Calculates the spatial overlap between a candidate corridor's 50-meter right-of-way buffer and a 143-cell empirical heat-priority grid. Higher weights are assigned to cells near dense transit hubs and unshaded concrete corridors.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-black/30 border border-amber-500/20">
                    <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                      <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      Planning impact
                    </div>
                    <p className="text-white/70 leading-relaxed text-[11.5px]">
                      Flags street segments that deserve further site investigation for shaded sidewalk canopies and urban forestry, directing resources to where vegetative buffers can provide the greatest social and environmental relief.
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Scientific Disclaimer & Transparency Callout */}
          <div className="mt-6 p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white/70 flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-white/80 font-bold text-[11px]">i</div>
            <p className="leading-relaxed">
              <strong className="text-white">Methodological Transparency Note:</strong> The heat-priority layer is an empirical spatial vulnerability proxy grid reflecting proximity to dense concrete corridors versus cool vegetative sinks. It does not represent satellite-measured land-surface temperature (LST) observations or proven microclimate cooling drops. Similarly, <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-[11px]">IIC_dist</code> models network topological connectivity between mapped green-anchor centroids along street alignments, not direct field-verified biodiversity or species mobility.
            </p>
          </div>
        </div>

      </div>
    </section>
  )
}

export default InsightsSection
