import React, { useEffect, useRef, useState, useCallback } from 'react'

export interface HalftoneWordmarkFooterProps {
  wordmark?: string
  backgroundColor?: string
  dotColor?: string
  accentColor?: string
  id?: string
  className?: string
}

interface Dot {
  originX: number
  originY: number
  x: number
  y: number
  vx: number
  vy: number
  baseRadius: number
  disp: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  speed: number
  strength: number
}

// Color parsing helper to avoid per-frame color parsing
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const num = parseInt(clean, 16)
  if (clean.length === 3) {
    const r = ((num >> 8) & 0xf) * 17
    const g = ((num >> 4) & 0xf) * 17
    const b = (num & 0xf) * 17
    return [r, g, b]
  }
  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff]
}

export const HalftoneWordmarkFooter: React.FC<HalftoneWordmarkFooterProps> = ({
  wordmark = 'GREENLINK',
  backgroundColor = '#0B2119',
  dotColor = '#E8F0E3',
  accentColor = '#8BE35A',
  id = 'contact',
  className = ''
}) => {
  const containerRef = useRef<HTMLElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [isIntersecting, setIsIntersecting] = useState(true)

  // Simulation state
  const dotsRef = useRef<Dot[]>([])
  const ripplesRef = useRef<Ripple[]>([])
  const mouseRef = useRef<{ x: number; y: number; active: boolean }>({
    x: -1000,
    y: -1000,
    active: false
  })
  const isRunningRef = useRef(false)
  const animFrameRef = useRef<number | null>(null)
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })

  const restingRgb = useRef(hexToRgb(dotColor))
  const accentRgb = useRef(hexToRgb(accentColor))

  useEffect(() => {
    restingRgb.current = hexToRgb(dotColor)
    accentRgb.current = hexToRgb(accentColor)
  }, [dotColor, accentColor])

  // Reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  // Viewport intersection observer to avoid CPU cycles when footer is offscreen
  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        const visible = entry?.isIntersecting ?? true
        setIsIntersecting(visible)
      },
      { threshold: 0.05 }
    )

    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Generate the halftone grid by rasterizing the wordmark onto an offscreen canvas
  const buildHalftoneGrid = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (width === 0 || height === 0) return

    dimensionsRef.current = { width, height }

    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = Math.floor(width * dpr)
    canvas.height = Math.floor(height * dpr)

    const isMobile = width < 640
    const isTablet = width >= 640 && width < 1024

    // Grid spacing tailored to device resolution
    const step = isMobile ? 6 : isTablet ? 7 : 8

    // Offscreen canvas for measuring and rendering the wordmark
    const offscreen = document.createElement('canvas')
    const offCtx = offscreen.getContext('2d', { willReadFrequently: true })
    if (!offCtx) return

    offscreen.width = width
    offscreen.height = height

    // Determine font size so GREENLINK spans almost the full viewport width (~94%)
    const targetWidth = width * (isMobile ? 0.96 : 0.94)
    let fontSize = isMobile ? 120 : isTablet ? 180 : 260
    offCtx.font = `900 ${fontSize}px "Outfit", "Plus Jakarta Sans", -apple-system, sans-serif`
    let measured = offCtx.measureText(wordmark).width

    if (measured > 0) {
      fontSize = (targetWidth / measured) * fontSize
      offCtx.font = `900 ${fontSize}px "Outfit", "Plus Jakarta Sans", -apple-system, sans-serif`
    }

    offCtx.fillStyle = '#FFFFFF'
    offCtx.textBaseline = 'alphabetic'
    offCtx.textAlign = 'center'

    // Position wordmark close to bottom edge, with the bottom portion intentionally cropped
    // This reproduces the bold Halden-style editorial crop
    const baselineY = height + fontSize * (isMobile ? 0.12 : 0.15)
    offCtx.fillText(wordmark, width / 2, baselineY)

    const imgData = offCtx.getImageData(0, 0, width, height)
    const data = imgData.data

    const newDots: Dot[] = []

    // Sample the text on the grid
    for (let y = step; y < height; y += step) {
      for (let x = step; x < width; x += step) {
        const idx = (y * width + x) * 4
        const alpha = data[idx + 3] // Alpha channel

        if (alpha > 45) {
          // Normalised density for halftone dot sizing
          const density = alpha / 255
          const baseRadius = (step * 0.42) * Math.max(0.4, density)

          newDots.push({
            originX: x,
            originY: y,
            x,
            y,
            vx: 0,
            vy: 0,
            baseRadius,
            disp: 0
          })
        }
      }
    }

    dotsRef.current = newDots
  }, [wordmark])

  // Main animation / rendering step
  const tick = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = dimensionsRef.current
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    ctx.save()
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, height)

    const dots = dotsRef.current
    const ripples = ripplesRef.current
    const mouse = mouseRef.current
    const reducedMotion = prefersReducedMotion

    let maxVelocity = 0

    // Advance shockwave ripples
    for (let r = ripples.length - 1; r >= 0; r--) {
      const rip = ripples[r]
      rip.radius += rip.speed
      rip.strength *= 0.94
      if (rip.radius > rip.maxRadius || rip.strength < 0.02) {
        ripples.splice(r, 1)
      }
    }

    const [r0, g0, b0] = restingRgb.current
    const [r1, g1, b1] = accentRgb.current
    const cursorRadius = width < 640 ? 80 : 120

    // Physics update & render dots
    for (let i = 0; i < dots.length; i++) {
      const dot = dots[i]

      if (!reducedMotion) {
        // 1. Cursor radial repulsion
        if (mouse.active) {
          const dx = dot.x - mouse.x
          const dy = dot.y - mouse.y
          const dist = Math.hypot(dx, dy)

          if (dist < cursorRadius && dist > 0.001) {
            const force = (1 - dist / cursorRadius) * 18
            dot.vx += (dx / dist) * force * 0.4
            dot.vy += (dy / dist) * force * 0.4
          }
        }

        // 2. Click shockwave expansion
        for (let r = 0; r < ripples.length; r++) {
          const rip = ripples[r]
          const rdx = dot.x - rip.x
          const rdy = dot.y - rip.y
          const rdist = Math.hypot(rdx, rdy)
          const distFromWave = Math.abs(rdist - rip.radius)

          if (distFromWave < 35 && rdist > 0.001) {
            const waveForce = (1 - distFromWave / 35) * rip.strength * 16
            dot.vx += (rdx / rdist) * waveForce * 0.4
            dot.vy += (rdy / rdist) * waveForce * 0.4
          }
        }

        // 3. Spring-like recovery to origin
        const springX = (dot.originX - dot.x) * 0.09
        const springY = (dot.originY - dot.y) * 0.09

        dot.vx = (dot.vx + springX) * 0.82
        dot.vy = (dot.vy + springY) * 0.82

        dot.x += dot.vx
        dot.y += dot.vy

        dot.disp = Math.hypot(dot.x - dot.originX, dot.y - dot.originY)
        const vMagnitude = Math.abs(dot.vx) + Math.abs(dot.vy)
        if (vMagnitude > maxVelocity) maxVelocity = vMagnitude
      } else {
        dot.x = dot.originX
        dot.y = dot.originY
        dot.disp = 0
      }

      // Color interpolation: shifts toward lime/accent when displaced
      const t = Math.min(dot.disp / 22, 1)
      const cr = Math.round(r0 + (r1 - r0) * t)
      const cg = Math.round(g0 + (g1 - g0) * t)
      const cb = Math.round(b0 + (b1 - b0) * t)

      ctx.fillStyle = `rgb(${cr}, ${cg}, ${cb})`
      ctx.beginPath()
      ctx.arc(dot.x, dot.y, dot.baseRadius, 0, Math.PI * 2)
      ctx.fill()
    }

    ctx.restore()

    // Determine whether to continue animating or sleep when calm
    const hasActiveEnergy =
      !reducedMotion &&
      (mouse.active || ripples.length > 0 || maxVelocity > 0.04)

    if (hasActiveEnergy && isIntersecting) {
      animFrameRef.current = requestAnimationFrame(tick)
    } else {
      isRunningRef.current = false
      animFrameRef.current = null
    }
  }, [isIntersecting, prefersReducedMotion])

  // Wake up the animation loop
  const requestTick = useCallback(() => {
    if (!isRunningRef.current && isIntersecting) {
      isRunningRef.current = true
      animFrameRef.current = requestAnimationFrame(tick)
    }
  }, [isIntersecting, tick])

  // ResizeObserver to keep canvas and dots aligned
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    buildHalftoneGrid()
    requestTick()

    const ro = new ResizeObserver(() => {
      buildHalftoneGrid()
      requestTick()
    })

    ro.observe(container)
    return () => ro.disconnect()
  }, [buildHalftoneGrid, requestTick])

  // Run render when visibility or reduced-motion changes
  useEffect(() => {
    if (isIntersecting) {
      requestTick()
    } else if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      isRunningRef.current = false
    }
  }, [isIntersecting, requestTick])

  // Pointer event handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (prefersReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    mouseRef.current.x = e.clientX - rect.left
    mouseRef.current.y = e.clientY - rect.top
    mouseRef.current.active = true
    requestTick()
  }

  const handlePointerLeave = () => {
    mouseRef.current.active = false
    mouseRef.current.x = -1000
    mouseRef.current.y = -1000
    requestTick()
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (prefersReducedMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const clickX = e.clientX - rect.left
    const clickY = e.clientY - rect.top

    ripplesRef.current.push({
      x: clickX,
      y: clickY,
      radius: 0,
      maxRadius: Math.max(rect.width, rect.height) * 0.8,
      speed: 14,
      strength: 1.0
    })

    requestTick()
  }

  const handleBackToTop = (e: React.MouseEvent) => {
    e.preventDefault()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <footer
      ref={containerRef}
      id={id}
      aria-label="GreenLink Delhi Footer"
      style={{ backgroundColor }}
      className={`relative w-full overflow-hidden select-none text-white ${className}`}
    >
      {/* Subtle handcrafted print-grain texture overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
        }}
        aria-hidden="true"
      />

      {/* =========================================================================
          1. MINIMAL UPPER FOOTER BAR
          Sparse, elegant divider: GREENLINK DELHI | Descriptor | CONNECT WITH US | BACK TO TOP ↑
          ========================================================================= */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 pt-10 sm:pt-14 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 pb-6 border-b border-white/12">
          {/* Left: Project title & short descriptor */}
          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1.5 sm:gap-4">
            <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white font-headline">
              GREENLINK DELHI
            </span>
            <span className="text-[11px] sm:text-xs text-white/60 font-editorial-sans">
              Connecting Delhi's green spaces.
            </span>
          </div>

          {/* Right cluster: Connect with Us + Back to top */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 lg:gap-8">
            {/* Connect with Us & email */}
            <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2.5">
              <span className="text-xs sm:text-sm font-bold tracking-widest uppercase text-white/70 font-headline">
                CONNECT WITH US
              </span>
              <a
                href="mailto:animeshyt68@gmail.com"
                className="text-xs sm:text-sm font-medium text-white/80 hover:text-[#8BE35A] transition-colors font-editorial-sans"
                aria-label="Email animeshyt68@gmail.com"
              >
                animeshyt68@gmail.com
              </a>
            </div>

            {/* Minimal BACK TO TOP link */}
            <a
              href="#hero"
              onClick={handleBackToTop}
              className="text-xs sm:text-sm font-semibold tracking-wider text-white/70 hover:text-[#8BE35A] transition-colors inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto group"
              aria-label="Back to top of page"
            >
              <span>BACK TO TOP</span>
              <span className="transition-transform group-hover:-translate-y-0.5">↑</span>
            </a>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. GIANT HALFTONE WORDMARK CANVAS
          Cropped intentionally at the bottom edge for bold editorial impact
          ========================================================================= */}
      <div className="relative w-full h-[260px] sm:h-[320px] md:h-[380px] lg:h-[420px] cursor-crosshair">
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          onClick={handleClick}
          className="w-full h-full block"
          role="img"
          aria-label={`Halftone wordmark: ${wordmark}`}
        />
      </div>
    </footer>
  )
}

export default HalftoneWordmarkFooter
