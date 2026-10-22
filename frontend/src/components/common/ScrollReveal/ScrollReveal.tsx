import React, { useEffect, useRef, useMemo } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ScrollReveal.css'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

export interface ScrollRevealProps {
  children: React.ReactNode
  mode?: 'scrub' | 'play'
  splitBy?: 'words' | 'characters'
  effect?: 'fade' | 'rise' | 'flip' | 'scale'
  baseOpacity?: number
  stagger?: number
  duration?: number
  smoothing?: number
  enableBlur?: boolean
  blurStrength?: number
  baseRotation?: number
  baseOffset?: number
  highlightColor?: string
  className?: string
  containerClassName?: string
  triggerOffset?: string // e.g. "top 85%"
  triggerEnd?: string // e.g. "bottom 60%"
}

/**
 * Extracts raw string content from React children for accessibility and splitting.
 */
function extractText(node: React.ReactNode): string {
  if (typeof node === 'string') return node
  if (typeof node === 'number') return String(node)
  if (Array.isArray(node)) return node.map(extractText).join('')
  if (React.isValidElement(node) && (node.props as any)?.children) {
    return extractText((node.props as any).children)
  }
  return ''
}

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  mode = 'scrub',
  splitBy = 'words',
  effect = 'fade',
  baseOpacity = 0.12,
  stagger = 0.025,
  duration = 0.7,
  smoothing = 0,
  enableBlur = false,
  blurStrength = 4,
  baseRotation = 0,
  baseOffset = 0,
  highlightColor,
  className = '',
  containerClassName = '',
  triggerOffset = 'top 85%',
  triggerEnd = 'bottom 45%'
}) => {
  const containerRef = useRef<HTMLSpanElement>(null)

  const rawText = useMemo(() => extractText(children), [children])

  // Split text into tokens based on splitBy
  const tokens = useMemo(() => {
    if (!rawText) return []
    if (splitBy === 'characters') {
      return rawText.split('')
    }
    // split by words preserving whitespace boundaries
    return rawText.split(/\s+/).filter(Boolean)
  }, [rawText, splitBy])

  useEffect(() => {
    const el = containerRef.current
    if (!el || typeof window === 'undefined') return

    // Respect user's motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) {
      return
    }

    const items = el.querySelectorAll<HTMLElement>(
      splitBy === 'characters' ? '.scroll-reveal-char' : '.scroll-reveal-word'
    )
    if (!items || items.length === 0) return

    const ctx = gsap.context(() => {
      // Determine initial visual properties based on effect
      const initialProps: gsap.TweenVars = {
        opacity: baseOpacity
      }

      if (enableBlur) {
        initialProps.filter = `blur(${blurStrength}px)`
      }

      if (baseRotation !== 0) {
        initialProps.rotation = baseRotation
      }

      if (baseOffset !== 0 || effect === 'rise') {
        initialProps.y = baseOffset !== 0 ? baseOffset : 14
      }

      if (effect === 'scale') {
        initialProps.scale = 0.94
      }

      if (effect === 'flip') {
        initialProps.rotationX = 35
        initialProps.transformPerspective = 400
      }

      // Target final state
      const targetProps: gsap.TweenVars = {
        opacity: 1,
        y: 0,
        scale: 1,
        rotation: 0,
        rotationX: 0,
        duration: duration,
        ease: mode === 'scrub' ? 'none' : 'power2.out'
      }

      if (enableBlur) {
        targetProps.filter = 'blur(0px)'
      }

      if (highlightColor) {
        targetProps.color = highlightColor
      }

      if (mode === 'scrub') {
        targetProps.stagger = stagger
        gsap.fromTo(items, initialProps, {
          ...targetProps,
          scrollTrigger: {
            trigger: el,
            start: triggerOffset,
            end: triggerEnd,
            scrub: smoothing === 0 ? true : smoothing,
            invalidateOnRefresh: true
          }
        })
      } else {
        // 'play' mode: triggers once when entered
        targetProps.stagger = stagger
        gsap.fromTo(items, initialProps, {
          ...targetProps,
          scrollTrigger: {
            trigger: el,
            start: triggerOffset,
            once: true
          }
        })
      }
    }, containerRef)

    return () => {
      ctx.revert()
    }
  }, [
    rawText,
    mode,
    splitBy,
    effect,
    baseOpacity,
    stagger,
    duration,
    smoothing,
    enableBlur,
    blurStrength,
    baseRotation,
    baseOffset,
    highlightColor,
    triggerOffset,
    triggerEnd
  ])

  // Fallback if no raw text extractable
  if (!rawText) {
    return <span className={className}>{children}</span>
  }

  return (
    <span
      ref={containerRef}
      className={`scroll-reveal-container ${containerClassName} ${className}`}
      aria-label={rawText}
    >
      <span aria-hidden="true">
        {splitBy === 'characters' ? (
          tokens.map((char, idx) => (
            <span key={idx} className="scroll-reveal-char">
              {char === ' ' ? '\u00A0' : char}
            </span>
          ))
        ) : (
          tokens.map((word, idx) => (
            <React.Fragment key={idx}>
              <span className="scroll-reveal-word">{word}</span>
              {idx < tokens.length - 1 && <span className="scroll-reveal-space"> </span>}
            </React.Fragment>
          ))
        )}
      </span>
    </span>
  )
}

export default ScrollReveal
