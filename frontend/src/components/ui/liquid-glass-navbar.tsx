import React, { useEffect, useRef, useState, useCallback } from 'react'

export interface LiquidNavItem {
  label: string
  href?: string
  onClick?: () => void
  ariaLabel?: string
}

export interface LiquidNavbarProps {
  items: LiquidNavItem[]
  activeIndex?: number
  defaultActive?: number
  onItemClick?: (index: number, item: LiquidNavItem) => void
  tone?: 'dark' | 'light'
  className?: string
}

// Minimal Vertex Shader for full-screen quad over the navbar canvas
const VERTEX_SHADER_SOURCE = `
  attribute vec2 a_position;
  varying vec2 v_uv;
  void main() {
    v_uv = (a_position + 1.0) * 0.5;
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`

// Fragment Shader: Subtle Forest-Green Liquid Caustics & Edge Refraction with Organic Fluidity
const FRAGMENT_SHADER_SOURCE = `
  precision mediump float;
  varying vec2 v_uv;
  uniform vec2 u_resolution;
  uniform vec2 u_pill; // x: center x (0..1), y: width (0..1)
  uniform float u_time;
  uniform float u_hover; // 1.0 if hovered, 0.0 otherwise

  void main() {
    vec2 st = gl_FragCoord.xy / u_resolution;
    
    // Subtle organic undulating wave across the liquid glass
    float wave = sin(st.x * 8.0 + u_time * 0.8) * cos(st.y * 6.0 + u_time * 0.5) * 0.02;
    
    // Distance from the active indicator pill center
    float pillDist = abs(st.x - u_pill.x) / max(u_pill.y * 0.55, 0.08);
    float inPill = smoothstep(1.0, 0.0, pillDist);
    
    // Edge highlight (specular reflection at the top rim of glass)
    float topRim = smoothstep(0.92, 1.0, st.y);
    float bottomRim = smoothstep(0.08, 0.0, st.y);
    
    // Forest-green & lime refractive color blending (#123D32 & #B7F34A)
    vec3 forestDark = vec3(0.07, 0.24, 0.19);
    vec3 forestTint = vec3(0.12, 0.35, 0.26);
    vec3 limeGlow   = vec3(0.72, 0.95, 0.29);
    
    // Caustic blend
    vec3 col = mix(forestDark, forestTint, st.y + wave);
    col = mix(col, limeGlow, inPill * 0.28 + topRim * 0.35);
    
    // Keep it translucent glass - subtle alpha so the golden-hour park panorama shines through
    float alpha = 0.14 + inPill * 0.16 + topRim * 0.18 + bottomRim * 0.08;
    
    gl_FragColor = vec4(col, alpha);
  }
`

export const LiquidNavbar: React.FC<LiquidNavbarProps> = ({
  items,
  activeIndex: controlledIndex,
  defaultActive = 0,
  onItemClick,
  tone = 'dark',
  className = ''
}) => {
  const [internalActive, setInternalActive] = useState(defaultActive)
  const activeIndex = controlledIndex !== undefined ? controlledIndex : internalActive
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [webglSupported, setWebglSupported] = useState(true)

  // Fluid pill position and dimension state
  const [pillStyle, setPillStyle] = useState<{ left: number; width: number; opacity: number }>({
    left: 0,
    width: 0,
    opacity: 0
  })

  // Measure and update the fluid indicator pill position
  const updatePill = useCallback(() => {
    const targetIdx = hoverIndex !== null ? hoverIndex : activeIndex
    const container = containerRef.current
    const targetEl = itemRefs.current[targetIdx]

    if (container && targetEl) {
      const containerRect = container.getBoundingClientRect()
      const targetRect = targetEl.getBoundingClientRect()
      setPillStyle({
        left: targetRect.left - containerRect.left,
        width: targetRect.width,
        opacity: 1
      })
    }
  }, [activeIndex, hoverIndex])

  useEffect(() => {
    updatePill()
    const handleResize = () => updatePill()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updatePill])

  // WebGL Shaders & Canvas Setup with graceful fallback
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Check for prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      setWebglSupported(false)
      return
    }

    let gl: WebGLRenderingContext | null = null
    try {
      gl =
        (canvas.getContext('webgl', { alpha: true, antialias: true }) as WebGLRenderingContext) ||
        (canvas.getContext('experimental-webgl', {
          alpha: true,
          antialias: true
        }) as WebGLRenderingContext)
    } catch {
      setWebglSupported(false)
      return
    }

    if (!gl) {
      setWebglSupported(false)
      return
    }

    // Compile Shader helper
    const createShader = (type: number, source: string): WebGLShader | null => {
      const shader = gl!.createShader(type)
      if (!shader) return null
      gl!.shaderSource(shader, source)
      gl!.compileShader(shader)
      if (!gl!.getShaderParameter(shader, gl!.COMPILE_STATUS)) {
        gl!.deleteShader(shader)
        return null
      }
      return shader
    }

    const vertShader = createShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE)
    const fragShader = createShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE)
    if (!vertShader || !fragShader) {
      setWebglSupported(false)
      return
    }

    const program = gl.createProgram()
    if (!program) {
      setWebglSupported(false)
      return
    }
    gl.attachShader(program, vertShader)
    gl.attachShader(program, fragShader)
    gl.linkProgram(program)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      setWebglSupported(false)
      return
    }
    gl.useProgram(program)

    // Full-screen quad geometry
    const positionBuffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW
    )

    const posLocation = gl.getAttribLocation(program, 'a_position')
    gl.enableVertexAttribArray(posLocation)
    gl.vertexAttribPointer(posLocation, 2, gl.FLOAT, false, 0, 0)

    const resLocation = gl.getUniformLocation(program, 'u_resolution')
    const pillLocation = gl.getUniformLocation(program, 'u_pill')
    const timeLocation = gl.getUniformLocation(program, 'u_time')
    const hoverLocation = gl.getUniformLocation(program, 'u_hover')

    let animationFrameId: number
    let startTime = performance.now()

    const render = () => {
      if (!gl || !canvas) return

      const width = canvas.clientWidth
      const height = canvas.clientHeight
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height
        gl.viewport(0, 0, width, height)
      }

      const elapsed = (performance.now() - startTime) / 1000

      // Compute normalized pill coordinates for the shader
      const normalizedPillX =
        width > 0 ? (pillStyle.left + pillStyle.width * 0.5) / width : 0.5
      const normalizedPillW = width > 0 ? pillStyle.width / width : 0.25

      gl.uniform2f(resLocation, width, height)
      gl.uniform2f(pillLocation, normalizedPillX, normalizedPillW)
      gl.uniform1f(timeLocation, elapsed)
      gl.uniform1f(hoverLocation, hoverIndex !== null ? 1.0 : 0.0)

      gl.drawArrays(gl.TRIANGLES, 0, 6)
      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      cancelAnimationFrame(animationFrameId)
      if (gl) {
        const loseContext = gl.getExtension('WEBGL_lose_context')
        if (loseContext) loseContext.loseContext()
      }
    }
  }, [pillStyle, hoverIndex])

  const handleClick = (index: number, item: LiquidNavItem) => {
    if (controlledIndex === undefined) {
      setInternalActive(index)
    }
    if (item.onClick) {
      item.onClick()
    }
    if (onItemClick) {
      onItemClick(index, item)
    }
  }

  return (
    <nav
      ref={containerRef}
      role="navigation"
      aria-label="Liquid Glass Navigation"
      onMouseLeave={() => setHoverIndex(null)}
      className={`relative inline-flex items-center p-1 sm:p-1.5 rounded-full backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 ${
        tone === 'dark'
          ? 'bg-[#123D32]/25 border border-white/20 shadow-[0_8px_32px_rgba(0,0,0,0.38),inset_0_1px_1px_rgba(255,255,255,0.22)]'
          : 'bg-white/20 border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.15),inset_0_1px_1px_rgba(255,255,255,0.5)]'
      } ${className}`}
      style={{
        WebkitBackdropFilter: 'blur(16px) saturate(150%)'
      }}
    >
      {/* WebGL Caustic Refraction Layer */}
      {webglSupported && (
        <canvas
          ref={canvasRef}
          aria-hidden="true"
          className="absolute inset-0 w-full h-full rounded-full pointer-events-none opacity-60 z-0"
        />
      )}

      {/* Fluid Liquid Active Indicator Pill */}
      <div
        aria-hidden="true"
        className="absolute top-1 sm:top-1.5 bottom-1 sm:bottom-1.5 rounded-full pointer-events-none z-10 transition-all duration-300 ease-[cubic-bezier(0.25,1,0.5,1)]"
        style={{
          left: `${pillStyle.left}px`,
          width: `${pillStyle.width}px`,
          opacity: pillStyle.opacity,
          background:
            'radial-gradient(ellipse 90% 90% at 50% 50%, rgba(183, 243, 74, 0.16) 0%, rgba(56, 118, 83, 0.32) 100%)',
          border: '1px solid rgba(183, 243, 74, 0.45)',
          boxShadow:
            '0 0 16px rgba(183, 243, 74, 0.22), inset 0 1px 1px rgba(255, 255, 255, 0.35)'
        }}
      >
        {/* Delicate liquid droplet indicator dot */}
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-[2px] bg-[#B7F34A] rounded-full shadow-[0_0_8px_rgba(183,243,74,0.9)]" />
      </div>

      {/* Navigation Items (Native clickable links/buttons above visual effects) */}
      <div className="relative z-20 flex items-center gap-0.5 sm:gap-1">
        {items.map((item, idx) => {
          const isActive = idx === activeIndex
          const isHovered = idx === hoverIndex

          return (
            <button
              key={item.label}
              ref={(el) => {
                itemRefs.current[idx] = el
              }}
              onClick={() => handleClick(idx, item)}
              onMouseEnter={() => setHoverIndex(idx)}
              aria-label={item.ariaLabel || item.label}
              aria-current={isActive ? 'page' : undefined}
              className={`relative px-2.5 sm:px-4 lg:px-5 py-1 sm:py-2 rounded-full text-[10px] sm:text-xs lg:text-[13px] font-bold tracking-wider sm:tracking-widest uppercase transition-colors duration-200 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A] ${
                isActive
                  ? 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]'
                  : isHovered
                  ? 'text-[#B7F34A] drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default LiquidNavbar
