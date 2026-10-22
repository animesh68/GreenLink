import React from 'react'
import { DelhiIllustration } from './DelhiIllustration'
import { FieldNotesSection } from './FieldNotesSection'
import { WorkstationApp } from '../Workstation/WorkstationApp'
import { MoveRight, ArrowDown } from 'lucide-react'

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#F6F2E8] text-[#173D2B] selection:bg-[#173D2B] selection:text-[#7BEC78] flex flex-col font-editorial-sans antialiased">
      {/* =========================================================================
          1. HERO SECTION (Vivid Hero Green #7BEC78, Editorial Poster Composition)
          ========================================================================= */}
      <section className="relative bg-[#7BEC78] min-h-[92vh] lg:min-h-screen flex flex-col justify-between overflow-hidden border-b border-[#173D2B]/20">
        {/* Compact Translucent Editorial Header Bar */}
        <header className="relative z-20 w-full bg-white/20 backdrop-blur-md border-b border-[#173D2B]/12">
          <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-3 sm:py-3.5 flex items-center justify-end">
            <nav
              aria-label="Page Navigation"
              className="flex items-center gap-5 sm:gap-8 text-xs sm:text-sm font-semibold text-[#173D2B]"
            >
              <a
                href="#field-notes"
                className="hover:text-black transition-colors underline-offset-4 hover:underline"
              >
                The Idea
              </a>
              <a
                href="#capabilities"
                className="hover:text-black transition-colors underline-offset-4 hover:underline"
              >
                Capabilities
              </a>
              <a
                href="#workstation"
                id="header-goto-workstation-btn"
                className="px-4 py-1.5 sm:py-2 rounded-full border border-[#173D2B] bg-[#173D2B] text-[#F6F2E8] hover:bg-[#0E271C] transition-all cursor-pointer font-medium flex items-center gap-1.5 shadow-xs"
              >
                <span>Go to workstation</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </nav>
          </div>
        </header>

        {/* Hero Body Composition (Moved Upward, Balanced Spacing) */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 pt-6 sm:pt-10 lg:pt-12 pb-0 flex-1 flex flex-col justify-between">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start lg:items-center flex-1">
            {/* Left Typographic Anchor (Higher vertical placement) */}
            <div className="lg:col-span-7 xl:col-span-7 pt-2 sm:pt-4 pb-4 lg:pb-8 z-10">
              {/* Expressive Wordmark Lockup: English Dominant + Hindi Aligned to the Right */}
              <div className="flex flex-wrap sm:flex-nowrap items-baseline gap-3 sm:gap-4 md:gap-5 mb-4 select-none">
                <h1 className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-[6.8rem] xl:text-[7.8rem] font-normal tracking-tight text-[#173D2B] leading-[0.88] m-0 shrink-0">
                  Green Link
                </h1>
                {/* Devanagari lettering aligned directly to the right without awkward overlap */}
                <span
                  className="font-hindi text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-[5.25rem] font-bold text-[#E6A446] select-none inline-block align-baseline whitespace-nowrap self-baseline -translate-y-1 sm:-translate-y-2 lg:-translate-y-3"
                  style={{
                    textShadow: '0 1px 0 #173D2B, 0 2px 4px rgba(23,61,43,0.18)'
                  }}
                  aria-label="Delhi in Devanagari script"
                >
                  दिल्ली
                </span>
              </div>

              {/* Tagline */}
              <p className="font-editorial-sans text-lg sm:text-xl md:text-2xl text-[#173D2B] font-semibold tracking-tight mb-4">
                Connecting green spaces. Reimagining the city.
              </p>

              {/* Description */}
              <p className="font-editorial-sans text-sm sm:text-base md:text-lg text-[#173D2B]/85 max-w-lg leading-relaxed font-normal mb-8">
                An intelligent urban planning platform exploring how Delhi's fragmented green spaces
                can be connected through thoughtful, budget-aware corridor planning.
              </p>

              {/* Call to Actions (Smooth Anchors directly into Page Flow) */}
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-1">
                <a
                  href="#workstation"
                  id="hero-primary-cta"
                  className="group px-7 py-3.5 rounded-full bg-[#173D2B] text-[#F6F2E8] hover:bg-[#0E271C] transition-all font-semibold text-sm sm:text-base flex items-center gap-2.5 shadow-sm hover:shadow-md cursor-pointer"
                >
                  <span>Explore GreenLink</span>
                  <MoveRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </a>

                <a
                  href="#field-notes"
                  id="hero-secondary-cta"
                  className="text-[#173D2B] hover:text-black font-semibold text-sm sm:text-base underline underline-offset-8 decoration-[#173D2B]/35 hover:decoration-[#173D2B] transition-all py-2"
                >
                  Discover the idea ↓
                </a>
              </div>
            </div>

            {/* Right Counterbalance: Delhi Landmark Illustration (Substantially Enlarged, Lower-Right Anchored) */}
            <div className="lg:col-span-5 xl:col-span-5 flex justify-end items-end w-full -mb-1 pointer-events-none self-end">
              <div className="w-full max-w-[620px] lg:max-w-none transform sm:scale-110 lg:scale-130 xl:scale-140 origin-bottom-right">
                <DelhiIllustration className="w-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Baseline Divider */}
        <div className="w-full h-1 bg-[#173D2B]" />
      </section>

      {/* =========================================================================
          2. PROJECT STORY: PINNED FIELD NOTES (Tactile Cartographer's Working Wall)
          ========================================================================= */}
      <FieldNotesSection />

      {/* =========================================================================
          3. GIS WORKSTATION (The Real, Functional Application Embedded in the Page)
          ========================================================================= */}
      <section className="relative w-full bg-[#F7F6F0]">
        <WorkstationApp
          id="workstation"
          onBackToLanding={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' })
          }}
        />
      </section>

      {/* =========================================================================
          4. COMPACT CIVIC FOOTER (Only genuinely useful details)
          ========================================================================= */}
      <footer className="w-full border-t border-[#173D2B]/15 bg-[#F6F2E8] py-8 px-6 sm:px-10 lg:px-16 text-xs text-[#173D2B]/75 select-none">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <span className="font-bold text-sm text-[#173D2B]">GreenLink Delhi</span>
            <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-[#173D2B]/10 text-[#173D2B]">
              Civic GIS Platform
            </span>
            <span className="text-[11px] text-[#173D2B]/60 hidden md:inline">
              • South-Central Delhi Decision Support
            </span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              className="hover:text-black transition-colors"
            >
              Top ↑
            </a>
            <a href="#field-notes" className="hover:text-black transition-colors">
              The Idea
            </a>
            <a href="#capabilities" className="hover:text-black transition-colors">
              Capabilities
            </a>
            <a href="#workstation" className="hover:text-black transition-colors font-bold underline underline-offset-4">
              Workstation
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default LandingPage
