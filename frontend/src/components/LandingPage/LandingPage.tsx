import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import heroBgImage from '../../assets/Golden-Hour Delhi Park Panorama.png'
import { LiquidNavbar, type LiquidNavItem } from './LiquidNavbar'
import { AboutSection } from './AboutSection'
import { InsightsSection } from './InsightsSection'
import { HalftoneWordmarkFooter } from '../ui/halftone-wordmark-footer'

interface LandingPageProps {
  onExploreMap?: () => void
}

interface CampaignSlide {
  id: number
  tagline: string
  subheadline: string
}

const CAMPAIGN_SLIDES: CampaignSlide[] = [
  {
    id: 1,
    tagline: 'Connecting Delhi’s green spaces for a cooler, healthier and more liveable tomorrow.',
    subheadline: 'South-Central Delhi Ecological Network'
  },
  {
    id: 2,
    tagline: 'Bridging 12 major ecological anchors across 14 optimized street corridors.',
    subheadline: 'Multi-Modal Green Corridors'
  },
  {
    id: 3,
    tagline: 'Mitigating severe urban heat island exposure through contiguous tree canopies.',
    subheadline: 'Thermal Vulnerability Mitigation'
  },
  {
    id: 4,
    tagline: 'Empowering urban planners with transparent, multi-objective spatial optimization.',
    subheadline: 'Decision Support & Climate Resilience'
  }
]

export const LandingPage: React.FC<LandingPageProps> = ({ onExploreMap }) => {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [activeNavIndex, setActiveNavIndex] = useState(0)

  const handleNavigate = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault()
      if (onExploreMap) {
        onExploreMap()
      } else {
        window.location.hash = '#workstation'
      }
    },
    [onExploreMap]
  )

  // Dedicated campaign navigation items in exact order: HOME, ABOUT, INSIGHTS, CONTACT, MAP
  const navItems = useMemo<LiquidNavItem[]>(
    () => [
      {
        label: 'HOME',
        onClick: () => {
          const el = document.getElementById('hero')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          } else {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }
          setActiveNavIndex(0)
        }
      },
      {
        label: 'ABOUT',
        onClick: () => {
          const el = document.getElementById('about')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
          setActiveNavIndex(1)
        }
      },
      {
        label: 'INSIGHTS',
        onClick: () => {
          const el = document.getElementById('insights')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
          setActiveNavIndex(2)
        }
      },
      {
        label: 'CONTACT',
        onClick: () => {
          const el = document.getElementById('contact')
          if (el) {
            el.scrollIntoView({ behavior: 'smooth' })
          }
          setActiveNavIndex(3)
        }
      },
      {
        label: 'MAP',
        onClick: () => {
          setActiveNavIndex(4)
          handleNavigate()
        }
      }
    ],
    [handleNavigate]
  )

  // Sync active navigation tab with user scroll position using viewport bounds
  useEffect(() => {
    const handleScroll = () => {
      const vh = window.innerHeight

      const contactEl = document.getElementById('contact')
      const insightsEl = document.getElementById('insights')
      const aboutEl = document.getElementById('about')

      if (contactEl) {
        const rect = contactEl.getBoundingClientRect()
        if (rect.top <= vh * 0.6) {
          setActiveNavIndex(3)
          return
        }
      }
      if (insightsEl) {
        const rect = insightsEl.getBoundingClientRect()
        if (rect.top <= vh * 0.45 && rect.bottom >= vh * 0.3) {
          setActiveNavIndex(2)
          return
        }
      }
      if (aboutEl) {
        const rect = aboutEl.getBoundingClientRect()
        if (rect.top <= vh * 0.45 && rect.bottom >= vh * 0.3) {
          setActiveNavIndex(1)
          return
        }
      }
      setActiveNavIndex(0)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === 0 ? CAMPAIGN_SLIDES.length - 1 : prev - 1))
  }, [])

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev === CAMPAIGN_SLIDES.length - 1 ? 0 : prev + 1))
  }, [])

  // Keyboard navigation for slides
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') prevSlide()
      if (e.key === 'ArrowRight') nextSlide()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [prevSlide, nextSlide])

  return (
    <main
      className="relative w-full min-h-screen overflow-x-hidden text-white font-editorial-sans select-none bg-[#0D261E]"
      role="main"
      aria-label="GreenLink Delhi Campaign"
    >
      {/* =========================================================================
          HERO SECTION (Full Viewport)
          ========================================================================= */}
      <section
        id="hero"
        aria-label="Campaign Hero"
        className="relative w-full h-screen min-h-[660px] overflow-hidden flex flex-col justify-between"
      >
      {/* =========================================================================
          1. FULL-VIEWPORT HERO BACKGROUND (Golden-Hour Delhi Park Panorama)
          ========================================================================= */}
      <div
        className="absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-1000 ease-out scale-100"
        style={{
          backgroundImage: `url("${heroBgImage}")`,
          backgroundPosition: 'center 42%'
        }}
        aria-hidden="true"
      />

      {/* Layer 1: Top dark gradient for crystal-clear navigation contrast */}
      <div
        className="absolute inset-x-0 top-0 h-44 bg-gradient-to-b from-[#0A1F18]/85 via-[#0A1F18]/40 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />

      {/* Layer 2: Central dark forest-green radial vignette to lift white/lime typography */}
      <div
        className="absolute inset-0 pointer-events-none z-10"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 50% 50%, rgba(18, 61, 50, 0.45) 0%, rgba(13, 38, 30, 0.65) 60%, rgba(8, 24, 18, 0.88) 100%)'
        }}
        aria-hidden="true"
      />

      {/* Layer 3: Bottom gradient for footer pagination and media card contrast */}
      <div
        className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-[#081812]/90 via-[#081812]/40 to-transparent pointer-events-none z-10"
        aria-hidden="true"
      />


      {/* =========================================================================
          2. TOP NAVIGATION OVERLAY (Transparent Liquid-Glass Navbar)
          ========================================================================= */}
      <header className="relative z-30 w-full max-w-7xl mx-auto px-3 sm:px-8 lg:px-12 pt-5 sm:pt-8 pb-3 sm:pb-4 flex items-center justify-between gap-2 sm:gap-6">
        {/* Left: Reserved space for custom team logo (I will provide that logo later. No temporary logo inserted.) */}
        <div
          className="hidden md:block md:w-36 lg:w-44 h-10 shrink-0"
          aria-label="Reserved team logo space"
        />

        {/* Center: Liquid-Glass Navbar (HOME, ABOUT, INSIGHTS, MAP in exact order) */}
        <div className="flex-1 flex justify-start sm:justify-center min-w-0">
          <LiquidNavbar
            tone="dark"
            items={navItems}
            activeIndex={activeNavIndex}
            onItemClick={(idx) => setActiveNavIndex(idx)}
            className="max-w-full"
          />
        </div>

        {/* Right: Outlined Translucent EXPLORE MAP → CTA Button */}
        <div className="shrink-0 flex items-center">
          <a
            href="#workstation"
            onClick={handleNavigate}
            id="nav-explore-map-btn"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full border border-[#B7F34A]/80 text-[#B7F34A] bg-[#123D32]/25 hover:bg-[#B7F34A] hover:text-[#0D261E] text-[11px] sm:text-xs font-bold uppercase tracking-wider backdrop-blur-md transition-all duration-300 shadow-[0_2px_14px_rgba(183,243,74,0.22)] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
          >
            <span className="hidden sm:inline">EXPLORE MAP</span>
            <span className="sm:hidden">MAP</span>
            <span className="text-xs sm:text-sm font-bold leading-none transform group-hover:translate-x-0.5 transition-transform">
              →
            </span>
          </a>
        </div>
      </header>

      {/* =========================================================================
          3. MAIN HERO COMPOSITION (Centered Dramatic Display Typography)
          ========================================================================= */}
      <div className="relative z-20 my-auto flex flex-col items-center justify-center text-center px-4 max-w-5xl mx-auto w-full animate-hero-entrance">
        {/* Main Headline Lockup with Tasteful Original Sprout Motif */}
        <div className="relative inline-block mb-1 sm:mb-2 select-none">
          {/* Sprout SVG gracefully emerging between 'N' and 'L' */}
          <div
            className="absolute -top-10 sm:-top-16 md:-top-20 lg:-top-24 left-[53.2%] -translate-x-1/2 w-14 sm:w-20 md:w-24 lg:w-28 h-auto pointer-events-none drop-shadow-[0_4px_16px_rgba(0,0,0,0.65)] z-20"
            aria-hidden="true"
          >
            <svg
              viewBox="0 0 100 120"
              className="w-full h-full"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              {/* Delicate Stem */}
              <path
                d="M48 118 C 48 90, 50 64, 52 46"
                stroke="#68CF44"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
              {/* Left Leaf */}
              <path
                d="M50 72 C 30 68, 10 46, 16 16 C 38 18, 48 40, 50 72 Z"
                fill="url(#sprout-leaf-l)"
                stroke="#8BE28A"
                strokeWidth="1.5"
              />
              {/* Left Leaf Midrib */}
              <path
                d="M50 72 C 38 50, 26 34, 16 16"
                stroke="#C6F85E"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              {/* Right Leaf */}
              <path
                d="M51 54 C 70 44, 90 32, 94 6 C 72 6, 56 24, 51 54 Z"
                fill="url(#sprout-leaf-r)"
                stroke="#B7F34A"
                strokeWidth="1.5"
              />
              {/* Right Leaf Midrib */}
              <path
                d="M51 54 C 64 36, 78 20, 94 6"
                stroke="#E2FF78"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <defs>
                <linearGradient id="sprout-leaf-l" x1="16" y1="16" x2="50" y2="72" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#9EE846" />
                  <stop offset="1" stopColor="#35843A" />
                </linearGradient>
                <linearGradient id="sprout-leaf-r" x1="94" y1="6" x2="51" y2="54" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#C8FA5E" />
                  <stop offset="1" stopColor="#45A04A" />
                </linearGradient>
              </defs>
            </svg>
          </div>

          {/* Big Typography: GREEN in white, LINK in vivid lime green */}
          <h1
            className="font-headline font-black text-6xl sm:text-7xl md:text-8xl lg:text-[7.8rem] xl:text-[9.2rem] tracking-tight leading-[0.88] m-0"
            aria-label="GreenLink Delhi"
          >
            <span
              className="text-white"
              style={{
                textShadow:
                  '0 4px 18px rgba(0,0,0,0.8), 0 12px 40px rgba(0,0,0,0.7), 0 1px 2px rgba(0,0,0,0.9)'
              }}
            >
              GREEN
            </span>
            <span
              className="text-transparent bg-clip-text bg-gradient-to-br from-[#B7F34A] via-[#8BE28A] to-[#387653]"
              style={{
                filter: 'drop-shadow(0 12px 36px rgba(0,0,0,0.8))'
              }}
            >
              LINK
            </span>
          </h1>
        </div>

        {/* Small Uppercase D E L H I with Thin Horizontal Rules */}
        <div className="flex items-center justify-center gap-4 sm:gap-6 my-2 sm:my-3 w-full max-w-md">
          <div className="h-[1.5px] flex-1 bg-gradient-to-r from-transparent via-white/50 to-white/80" />
          <span
            className="text-white font-headline font-bold tracking-[0.5em] text-xs sm:text-sm md:text-base uppercase pl-[0.5em] select-none"
            style={{
              textShadow: '0 2px 10px rgba(0,0,0,0.8)'
            }}
          >
            DELHI
          </span>
          <div className="h-[1.5px] flex-1 bg-gradient-to-l from-transparent via-white/50 to-white/80" />
        </div>

        {/* Supporting Tagline (Controlled by Active Slide) */}
        <p
          className="text-white/95 text-sm sm:text-base md:text-lg lg:text-xl font-normal max-w-2xl mx-auto leading-relaxed mt-2 sm:mt-3 mb-6 sm:mb-8 px-4 transition-opacity duration-300"
          style={{
            textShadow: '0 2px 12px rgba(0,0,0,0.85), 0 1px 3px rgba(0,0,0,0.9)'
          }}
        >
          {CAMPAIGN_SLIDES[currentSlide].tagline}
        </p>

        {/* Primary CTA Button */}
        <div>
          <a
            href="#workstation"
            onClick={handleNavigate}
            id="hero-primary-cta"
            className="group inline-flex items-center gap-3 px-8 sm:px-10 py-3.5 sm:py-4 rounded-full bg-[#469A4C] hover:bg-[#3B8940] text-white font-bold text-xs sm:text-sm uppercase tracking-wider shadow-[0_8px_25px_rgba(40,110,60,0.6),0_2px_8px_rgba(0,0,0,0.4)] border border-[#8BE28A]/40 transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A] focus-visible:ring-offset-2 focus-visible:ring-offset-[#123D32]"
          >
            <span>EXPLORE THE MAP</span>
            <span className="text-base font-bold transform group-hover:translate-x-1 transition-transform">
              →
            </span>
          </a>
        </div>
      </div>

      {/* =========================================================================
          4. FLANK NAVIGATION CONTROLS (Active Slide Switching)
          ========================================================================= */}
      {/* Left flank button */}
      <button
        onClick={prevSlide}
        aria-label="Previous campaign slide"
        className="hidden sm:flex absolute left-5 sm:left-8 lg:left-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-white/20 bg-black/40 hover:bg-black/60 hover:border-[#B7F34A] text-white/80 hover:text-white backdrop-blur-md items-center justify-center transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer group z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
      >
        <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-0.5" />
      </button>

      {/* Right flank button */}
      <button
        onClick={nextSlide}
        aria-label="Next campaign slide"
        className="hidden sm:flex absolute right-5 sm:right-8 lg:right-12 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full border border-[#B7F34A]/40 bg-black/40 hover:bg-black/60 hover:border-[#B7F34A] text-[#B7F34A] hover:text-white backdrop-blur-md items-center justify-center transition-all duration-200 shadow-[0_4px_16px_rgba(0,0,0,0.5)] cursor-pointer group z-20 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A]"
      >
        <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
      </button>

      {/* =========================================================================
          5. BOTTOM PAGINATION INDICATORS (4 Campaign Pills)
          ========================================================================= */}
      <nav
        aria-label="Campaign Slide Indicators"
        className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-20"
      >
        {CAMPAIGN_SLIDES.map((slide, idx) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(idx)}
            aria-label={`Go to slide ${idx + 1}: ${slide.subheadline}`}
            aria-current={idx === currentSlide ? 'true' : 'false'}
            className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#B7F34A] ${
              idx === currentSlide
                ? 'w-7 sm:w-8 bg-[#B7F34A] shadow-[0_0_10px_rgba(183,243,74,0.7)]'
                : 'w-4 sm:w-5 bg-white/35 hover:bg-white/60'
            }`}
          />
        ))}
      </nav>
    </section>

    {/* =========================================================================
        ABOUT SECTION (Immediately below Hero, with countryside background video)
        ========================================================================= */}
    <AboutSection />

    {/* =========================================================================
        INSIGHTS SECTION (Immediately below About, with aerial living city video)
        ========================================================================= */}
    <InsightsSection onExploreMap={handleNavigate} />

    {/* =========================================================================
        FOOTER SECTION (Interactive Halftone Wordmark Footer)
        ========================================================================= */}
    <HalftoneWordmarkFooter
      id="contact"
      wordmark="GREENLINK"
      backgroundColor="#0B2119"
      dotColor="#E8F0E3"
      accentColor="#8BE35A"
    />
  </main>
)
}

export default LandingPage
