import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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

gsap.registerPlugin(ScrollTrigger)

interface InsightsSectionProps {
  onExploreMap?: () => void
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({ onExploreMap }) => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinContainerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const headerRef = useRef<HTMLDivElement | null>(null)
  const panelARef = useRef<HTMLDivElement | null>(null)
  const panelBRef = useRef<HTMLDivElement | null>(null)
  const glassWrapperRef = useRef<HTMLDivElement | null>(null)

  const [videoError, setVideoError] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  // Listen for prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches)
    }

    mediaQuery.addEventListener('change', handleMotionChange)
    return () => mediaQuery.removeEventListener('change', handleMotionChange)
  }, [])

  // Video autoplay policy handling (independent playback)
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

  // GSAP ScrollTrigger Orchestration
  useEffect(() => {
    if (prefersReducedMotion) return

    const section = sectionRef.current
    const pinContainer = pinContainerRef.current
    const header = headerRef.current
    const panelA = panelARef.current
    const panelB = panelBRef.current
    const glassWrapper = glassWrapperRef.current

    if (!section || !pinContainer || !header || !panelA || !panelB || !glassWrapper) return

    const mm = gsap.matchMedia()

    // 1. Large Desktops with ample vertical height: Pinned Multi-Stage Narrative
    mm.add('(min-width: 1024px) and (min-height: 820px)', () => {
      // Set initial states
      gsap.set(glassWrapper, { scale: 0.93, y: 60, opacity: 0.35 })
      gsap.set(header, { opacity: 0, y: 30 })
      gsap.set(panelA, { opacity: 0, y: 40, scale: 0.96 })
      gsap.set(panelB, { opacity: 0, y: 60, scale: 0.95 })

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=140%',
          pin: pinContainer,
          pinSpacing: true,
          scrub: 0.7,
          invalidateOnRefresh: true
        }
      })

      // STAGE 1: Glass dashboard scales in and centers in the viewport
      tl.to(glassWrapper, {
        scale: 1,
        y: 0,
        opacity: 1,
        duration: 0.3,
        ease: 'power2.out'
      })
      // Header and Eyebrow badge settle
      .to(header, {
        opacity: 1,
        y: 0,
        duration: 0.25,
        ease: 'power2.out'
      }, '-=0.15')
      // Panel A (Core 3 Dataset Metrics) enters with crisp elevation
      .to(panelA, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.1')
      // Breathing hold for user to inspect Panel A
      .to({}, { duration: 0.2 })
      // STAGE 2: Panel A gently moves up to make way for Strategic Objectives
      .to(panelA, {
        opacity: 0.35,
        scale: 0.96,
        y: -15,
        duration: 0.25,
        ease: 'power2.inOut'
      })
      // Panel B (The Two Planning Objectives side-by-side comparison) emerges into focus
      .to(panelB, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.4,
        ease: 'power2.out'
      }, '-=0.1')
      // Sustained plateau for reading the objectives and methodology
      .to({}, { duration: 0.4 })
      // STAGE 3: Smooth exit handoff as footer approaches
      .to(glassWrapper, {
        opacity: 0.85,
        scale: 0.98,
        duration: 0.2,
        ease: 'power1.in'
      })

      return () => {
        tl.kill()
      }
    })

    // 2. Tablets, Laptops & Mobile (or screens under 820px height):
    // Natural continuous flow with individual scroll-triggered reveals (avoids vertical clipping)
    mm.add('all', () => {
      // Check if matched the large screen above; if not, apply the flowing reveal
      if (window.innerWidth >= 1024 && window.innerHeight >= 820) return

      gsap.set(glassWrapper, { opacity: 1, scale: 1, y: 0 })
      gsap.set([header, panelA, panelB], { opacity: 0, y: 35 })

      const items = [
        { el: header, trigger: header, start: 'top 85%' },
        { el: panelA, trigger: panelA, start: 'top 80%' },
        { el: panelB, trigger: panelB, start: 'top 75%' }
      ]

      const triggers: ScrollTrigger[] = []

      items.forEach((item) => {
        const trg = ScrollTrigger.create({
          trigger: item.trigger,
          start: item.start,
          onEnter: () => {
            gsap.to(item.el, {
              opacity: 1,
              y: 0,
              duration: 0.75,
              ease: 'power2.out'
            })
          },
          onLeaveBack: () => {
            gsap.to(item.el, {
              opacity: 0,
              y: 35,
              duration: 0.5,
              ease: 'power2.in'
            })
          }
        })
        triggers.push(trg)
      })

      return () => {
        triggers.forEach((t) => t.kill())
      }
    })

    return () => {
      mm.revert()
    }
  }, [prefersReducedMotion])

  return (
    <section
      ref={sectionRef}
      id="insights"
      aria-label="Insights from the Landscape"
      className="relative w-full bg-[#071913] text-white select-none overflow-hidden"
    >
      {/* Pinned Viewport Container for desktop; normal flow for smaller displays */}
      <div
        ref={pinContainerRef}
        className="relative w-full min-h-screen flex flex-col justify-center items-center py-16 sm:py-20 lg:py-24 overflow-hidden"
      >
        {/* =========================================================================
            1. FULL-WIDTH AERIAL BACKGROUND VIDEO
            Aerial urban canopy & roads; continues playing naturally in the background
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

          {/* Deep forest-green vignette to guarantee pristine glass contrast */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(8, 26, 20, 0.88) 0%, rgba(10, 31, 24, 0.72) 30%, rgba(8, 28, 21, 0.82) 75%, rgba(6, 20, 15, 0.95) 100%)'
            }}
            aria-hidden="true"
          />

          {/* Soft radial emerald highlight behind the dashboard */}
          <div
            className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[520px] pointer-events-none blur-[140px] opacity-25 bg-[#7BEC78]"
            aria-hidden="true"
          />
        </div>

        {/* =========================================================================
            2. MAIN GLASSMORPHISM DASHBOARD WRAPPER
            Scales in with depth from 0.93 -> 1.0, inspired by Keyvo motion language
            ========================================================================= */}
        <div
          ref={glassWrapperRef}
          className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col gap-6 sm:gap-8 will-change-transform"
        >
          {/* =====================================================================
              SECTION HEADER
              ===================================================================== */}
          <div
            ref={headerRef}
            className={`text-center max-w-3xl mx-auto flex flex-col items-center will-change-transform ${
              prefersReducedMotion ? 'opacity-100 transform-none' : ''
            }`}
          >
            {/* Eyebrow badge with subtle lime accent */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#103D30]/85 border border-[#B7F34A]/30 text-[#B7F34A] text-xs font-semibold tracking-widest uppercase mb-3 shadow-[0_0_15px_rgba(183,243,74,0.15)]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B7F34A] animate-pulse" />
              Decision-Support Intelligence
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] font-bold tracking-tight text-white mb-2 leading-[1.1]">
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
            ref={panelARef}
            className={`grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 will-change-transform ${
              prefersReducedMotion ? 'opacity-100 transform-none' : ''
            }`}
          >
            {/* Metric 1: Geographic Extent */}
            <div className="insights-card insights-metric-card relative overflow-hidden rounded-2xl bg-[#0A1F18]/70 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Study Extent</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">131.8</span>
                  <span className="text-base sm:text-lg font-semibold text-[#B7F34A]">km²</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  South-Central Delhi geometric study extent bounded between 28.53°N–28.64°N and 77.16°E–77.27°E.
                </p>
              </div>
            </div>

            {/* Metric 2: Mapped Green Anchors */}
            <div className="insights-card insights-metric-card relative overflow-hidden rounded-2xl bg-[#0A1F18]/70 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Green Anchors</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                  <Trees className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">12</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#B7F34A] uppercase tracking-wide">Anchors (1,752.7 ha)</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  OpenStreetMap polygons enclosing major regional parks (Central Ridge, Lodhi Garden, Sunder Nursery, Deer Park).
                </p>
              </div>
            </div>

            {/* Metric 3: Candidate Corridors */}
            <div className="insights-card insights-metric-card relative overflow-hidden rounded-2xl bg-[#0A1F18]/70 backdrop-blur-md border border-white/15 p-5 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.35)] flex flex-col justify-between group">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs uppercase tracking-wider text-white/60 font-medium">Candidate Network</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-[#B7F34A] flex items-center justify-center">
                  <Route className="w-4 h-4" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white font-headline">14</span>
                  <span className="text-xs sm:text-sm font-semibold text-[#B7F34A] uppercase tracking-wide">Routes (46.95 km)</span>
                </div>
                <p className="text-xs text-white/70 leading-relaxed">
                  Real walkable street routes calculated via Dijkstra shortest-path along Delhi's 77k-node OSM urban road graph.
                </p>
              </div>
            </div>
          </div>

          {/* =====================================================================
              PANEL B: TWO PLANNING OBJECTIVES (Explanatory Decision Logic)
              ===================================================================== */}
          <div
            ref={panelBRef}
            className={`relative overflow-hidden rounded-3xl bg-[#0A1F18]/75 backdrop-blur-lg border border-white/15 p-5 sm:p-7 lg:p-8 shadow-[0_12px_40px_rgba(0,0,0,0.4)] will-change-transform ${
              prefersReducedMotion ? 'opacity-100 transform-none' : ''
            }`}
          >
            {/* Header */}
            <div className="pb-4 border-b border-white/10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#B7F34A] mb-1">
                  <GitCompare className="w-4 h-4" />
                  Strategic Planning Parameters
                </div>
                <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-white">
                  Understanding the Two Planning Objectives
                </h3>
              </div>
              {onExploreMap && (
                <button
                  onClick={onExploreMap}
                  className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#B7F34A] text-[#0D261E] text-xs font-bold uppercase tracking-wider hover:bg-[#9fe232] transition-colors cursor-pointer"
                >
                  Explore in Map →
                </button>
              )}
            </div>

            {/* Side-by-Side Explanatory Cards Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-5">
              {/* Objective 1: Connectivity-First */}
              <div className="insights-card insights-connectivity-card relative rounded-2xl bg-gradient-to-b from-emerald-950/40 to-[#0A1F18]/85 border border-emerald-500/30 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                      <TrendingUp className="w-3.5 h-3.5 text-[#B7F34A]" />
                      Connectivity-First
                    </div>
                    <span className="text-xs text-emerald-400/70 font-mono">Topological Priority</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                    Linking Fragmented Urban Green Spaces
                  </h4>
                  <p className="text-xs text-white/75 leading-relaxed mb-4">
                    Urban green spaces across Delhi are fragmented by dense vehicular road networks. Connecting these isolated islands creates a continuous network rather than isolated parks.
                  </p>

                  {/* Explanatory Points */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20">
                      <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                        <Network className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                        Why it matters
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Large ecological anchors like the Central Ridge, Lodhi Garden, and Sunder Nursery function as isolated islands when cut off by multi-lane roads. Increasing network connectivity helps create continuous vegetative stepping stones.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20">
                      <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                        <Layers className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                        How the metric works
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Uses the distance-weighted Integral Index of Connectivity (<code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-[11px]">IIC_dist</code>). It scores potential corridor additions based on the joint areas of connected anchors and the shortest street distance, applying a 1 km distance-decay penalty.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-emerald-500/20">
                      <div className="flex items-center gap-2 font-semibold text-emerald-300 mb-1">
                        <Target className="w-3.5 h-3.5 text-[#B7F34A] shrink-0" />
                        Planning impact
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Guides municipal capital toward routes that bridge the most critical gaps in the urban matrix, prioritizing routes that tie major disjointed anchors into unified green networks.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Objective 2: Heat-Priority-First */}
              <div className="insights-card insights-heat-card relative rounded-2xl bg-gradient-to-b from-amber-950/30 to-[#0A1F18]/85 border border-amber-500/30 p-5 sm:p-6 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-xs font-semibold uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5 text-amber-400" />
                      Heat-Priority-First
                    </div>
                    <span className="text-xs text-amber-400/70 font-mono">Thermal Vulnerability</span>
                  </div>

                  <h4 className="text-base sm:text-lg font-bold text-white mb-2">
                    Targeting High-Vulnerability Transit Spines
                  </h4>
                  <p className="text-xs text-white/75 leading-relaxed mb-4">
                    Concrete arterials, unshaded junctions, and dense transit corridors experience acute thermal exposure. This objective prioritizes tree canopies where pedestrian heat stress is highest.
                  </p>

                  {/* Explanatory Points */}
                  <div className="space-y-2.5 text-xs">
                    <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
                      <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                        <ThermometerSun className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Why it matters
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Delhi's heavily built, high-traffic commercial and transit corridors absorb and trap solar radiation with minimal shade. Prioritizing green corridors along concrete corridors brings canopy cover to areas of high pedestrian exposure.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
                      <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                        <Layers className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        How the metric works
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Calculates the spatial overlap between a candidate corridor's 50-meter right-of-way buffer and a 143-cell empirical heat-priority grid. Higher weights are assigned to cells near dense transit hubs and unshaded concrete corridors.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-black/30 border border-amber-500/20">
                      <div className="flex items-center gap-2 font-semibold text-amber-300 mb-1">
                        <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        Planning impact
                      </div>
                      <p className="text-white/70 leading-relaxed text-[11px] sm:text-[11.5px]">
                        Flags street segments that deserve further site investigation for shaded sidewalk canopies and urban forestry, directing resources to where vegetative buffers can provide the greatest social and environmental relief.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Scientific Disclaimer & Transparency Callout */}
            <div className="mt-5 p-3.5 sm:p-4 rounded-xl bg-black/40 border border-white/10 text-xs text-white/70 flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5 text-white/80 font-bold text-[11px]">i</div>
              <p className="leading-relaxed text-[11px] sm:text-xs">
                <strong className="text-white">Methodological Transparency Note:</strong> The heat-priority layer is an empirical spatial vulnerability proxy grid reflecting proximity to dense concrete corridors versus cool vegetative sinks. It does not represent satellite-measured land-surface temperature (LST) observations or proven microclimate cooling drops. Similarly, <code className="text-emerald-300 bg-emerald-950/60 px-1 py-0.5 rounded text-[11px]">IIC_dist</code> models network topological connectivity between mapped green-anchor centroids along street alignments, not direct field-verified biodiversity or species mobility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InsightsSection
