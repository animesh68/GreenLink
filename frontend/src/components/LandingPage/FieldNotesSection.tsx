import React from 'react'
import { PushPin } from './PushPin'
import { ScrollReveal } from '../common/ScrollReveal/ScrollReveal'
import { Compass, GitFork, Activity, Trees } from 'lucide-react'

export const FieldNotesSection: React.FC = () => {
  return (
    <section
      id="field-notes"
      className="relative w-full bg-[#EFECE4] py-14 sm:py-20 px-4 sm:px-8 lg:px-14 border-t border-[#DCD6C8] overflow-hidden"
    >
      {/* Background Cartographic Working Wall Elements */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.035] bg-[radial-gradient(#173D2B_1px,transparent_1px)] [background-size:24px_24px]"
        aria-hidden="true"
      />

      {/* Section Header: Compact line length and responsive font sizing */}
      <div className="max-w-6xl mx-auto mb-10 sm:mb-14">
        <div className="flex items-center gap-3 mb-3 select-none">
          <span className="font-mono text-xs uppercase font-bold tracking-widest text-[#173D2B] bg-[#E6A446]/30 border border-[#E6A446]/50 px-2.5 py-0.5 rounded">
            FIELD NOTES // 01
          </span>
          <span className="h-px bg-[#173D2B]/20 flex-1 max-w-[120px]" />
          <span className="font-mono text-[11px] font-semibold tracking-wider uppercase text-[#173D2B]/60">
            Cartographer's Working Wall • South-Central Delhi
          </span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl md:text-[2.25rem] lg:text-[2.5rem] text-[#173D2B] font-normal leading-tight max-w-2xl m-0">
          <ScrollReveal
            mode="scrub"
            splitBy="words"
            effect="fade"
            baseOpacity={0.12}
            stagger={0.02}
            duration={0.7}
          >
            Observations, working hypotheses, and spatial parameters.
          </ScrollReveal>
        </h2>
        <p className="font-editorial-sans text-xs sm:text-sm text-[#173D2B]/75 mt-2 max-w-xl">
          Pinned notes from ongoing geospatial modeling across Delhi's fragmented canopy corridors.
        </p>
      </div>

      {/* Pinned Working Notes Grid (3 Distinct Intentional Pastel Notes) */}
      <div className="max-w-6xl mx-auto space-y-10 sm:space-y-14">
        {/* ROW 1: Note 01 (Pastel Pink) + Note 02 (Pastel Blue) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* NOTE 01: The Problem (Pastel Pink Paper: #F7E5E7) */}
          <article
            className="lg:col-span-7 relative bg-[#F7E5E7] border border-[#E8CCD0] rounded-sm p-6 sm:p-9 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(180,60,80,0.08)] transition-transform duration-300 hover:rotate-0 lg:-rotate-[0.75deg]"
            aria-labelledby="note-01-heading"
          >
            {/* Top Pushpin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <PushPin color="red" />
            </div>

            {/* Note Metadata Header */}
            <div className="flex items-center justify-between border-b border-[#ECC8CD] pb-3 mb-5 select-none">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#782424] bg-[#ECC8CD] px-2 py-0.5 rounded">
                  NOTE // DEL-01
                </span>
                <span className="font-mono text-[11px] text-[#173D2B]/65">
                  Spatial Fragmentation
                </span>
              </div>
              <span className="font-mono text-[10px] text-[#173D2B]/50 hidden sm:inline">
                28°35'N, 77°13'E • NCT
              </span>
            </div>

            {/* Note Heading with ScrollReveal */}
            <h3
              id="note-01-heading"
              className="font-display text-2xl sm:text-3xl md:text-4xl text-[#173D2B] font-normal leading-tight mb-5"
            >
              <ScrollReveal
                mode="scrub"
                splitBy="words"
                effect="fade"
                baseOpacity={0.12}
                stagger={0.025}
                duration={0.7}
                smoothing={0}
              >
                Delhi has green spaces. The challenge is connecting them.
              </ScrollReveal>
            </h3>

            {/* Note Body */}
            <div className="space-y-3.5 text-[#173D2B]/85 text-sm sm:text-base leading-relaxed font-editorial-sans">
              <p>
                On satellite NDVI surveys, Delhi appears remarkably green—anchored by the ancient
                thorn scrub of the Central Ridge, the riparian corridors of the Yamuna, the
                expansive colonial avenues of Lutyens' Delhi, and protected southern forest
                tracts like Sanjay Van and Hauz Khas.
              </p>
              <p>
                Yet on the ground, these spaces exist as isolated islands. High-speed eight-lane
                arterial ring roads, high-density residential colonies, and concrete expanses
                sever their ecological contiguity.
              </p>
              <p>
                Urban corridor planning must balance ecological connectivity, municipal capital
                constraints, actual street rights-of-way, and competing urban priorities—moving
                beyond symbolic tree-planting drives toward evidence-conscious network planning.
              </p>
            </div>

            {/* Field Note Annotation Tag */}
            <div className="mt-6 pt-4 border-t border-[#ECC8CD] flex items-center justify-between text-xs font-mono text-[#173D2B]/60 select-none">
              <span className="italic">Observed: Canopy breaks exceed 800m across key corridors</span>
              <span>REF: NCT-URBAN-ENV-24</span>
            </div>
          </article>

          {/* NOTE 02: The Idea (Pastel Blue Paper: #E3EEF5) */}
          <article
            className="lg:col-span-5 relative bg-[#E3EEF5] border border-[#CADCE9] rounded-sm p-6 sm:p-8 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(30,90,140,0.08)] transition-transform duration-300 hover:rotate-0 lg:rotate-[1deg]"
            aria-labelledby="note-02-heading"
          >
            {/* Top Pushpin */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-20">
              <PushPin color="brass" />
            </div>

            {/* Note Metadata Header */}
            <div className="flex items-center justify-between border-b border-[#CADCE9] pb-3 mb-5 select-none">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#184E6E] bg-[#CADCE9] px-2 py-0.5 rounded">
                  NOTE // DEL-02
                </span>
                <span className="font-mono text-[11px] text-[#173D2B]/65">
                  Infrastructure Paradigm
                </span>
              </div>
            </div>

            {/* Note Heading with ScrollReveal */}
            <h3
              id="note-02-heading"
              className="font-display text-2xl sm:text-3xl text-[#173D2B] font-normal leading-tight mb-4"
            >
              <ScrollReveal
                mode="scrub"
                splitBy="words"
                effect="fade"
                baseOpacity={0.12}
                stagger={0.025}
                duration={0.7}
                smoothing={0}
              >
                Treat green corridors as infrastructure.
              </ScrollReveal>
            </h3>

            {/* Note Body */}
            <div className="space-y-3 text-[#173D2B]/85 text-sm sm:text-base leading-relaxed font-editorial-sans">
              <p>
                Tree canopies and continuous pedestrian green pathways are civic infrastructure, no
                less critical than stormwater drainage, electrical conduits, or metro alignments.
              </p>
              <p>
                GreenLink combines mapped municipal green spaces, screened street connections,
                realistic afforestation cost models, and budget-constrained mathematical
                optimization to systematically compare alternative municipal investment
                strategies.
              </p>
            </div>

            {/* Visual Sketch / Annotation */}
            <div className="mt-6 p-4 rounded bg-[#D6E5F0] border border-[#BFD4E4] flex items-center gap-3 select-none">
              <Trees className="w-5 h-5 text-[#184E6E] shrink-0" />
              <div className="text-xs font-mono text-[#173D2B]/85 leading-snug">
                <strong>Hypothesis:</strong> Prioritizing multi-tier street rights-of-way yields 3.2×
                greater connectivity gain per ₹1 Cr invested.
              </div>
            </div>
          </article>
        </div>

        {/* ROW 2: Note 03 — How It Works (Pastel Yellow Paper: #F5EBCB) */}
        <article
          id="capabilities"
          className="relative bg-[#F5EBCB] border border-[#E2D4A8] rounded-sm p-6 sm:p-10 shadow-[0_2px_4px_rgba(0,0,0,0.03),0_12px_24px_-4px_rgba(150,110,20,0.08)] transition-transform duration-300 hover:rotate-0 lg:-rotate-[0.3deg]"
          aria-labelledby="note-03-heading"
        >
          {/* Top Pushpins (Two for wide sheet) */}
          <div className="absolute -top-3 left-12 z-20">
            <PushPin color="forest" />
          </div>
          <div className="absolute -top-3 right-12 z-20">
            <PushPin color="forest" />
          </div>

          {/* Note Metadata Header */}
          <div className="flex flex-wrap items-center justify-between border-b border-[#E2D4A8] pb-3 mb-6 gap-2 select-none">
            <div className="flex items-center gap-2">
              <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#634B12] bg-[#E5D7AB] px-2 py-0.5 rounded">
                NOTE // DEL-03
              </span>
              <span className="font-mono text-[11px] text-[#173D2B]/65">
                Decision-Support Methodology
              </span>
            </div>
            <span className="font-mono text-[10px] text-[#173D2B]/55">
              ILP OPTIMIZATION • GRAPH THEORY (IIC)
            </span>
          </div>

          {/* Note Heading */}
          <div className="max-w-2xl mb-8">
            <h3
              id="note-03-heading"
              className="font-display text-2xl sm:text-3xl md:text-4xl text-[#173D2B] font-normal leading-tight mb-2"
            >
              <ScrollReveal
                mode="scrub"
                splitBy="words"
                effect="fade"
                baseOpacity={0.12}
                stagger={0.025}
                duration={0.7}
                smoothing={0}
              >
                Three stages of spatial decision support.
              </ScrollReveal>
            </h3>
            <p className="font-editorial-sans text-xs sm:text-sm text-[#173D2B]/75">
              How the platform navigates from raw geospatial boundaries to capital-constrained corridor selection.
            </p>
          </div>

          {/* 3 Clear Stages with Subtle Connectors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 relative">
            {/* Stage 1 */}
            <div className="p-5 rounded bg-[#FCF9F0] border border-[#E2D4A8] flex flex-col justify-between space-y-4 shadow-2xs">
              <div>
                <span className="font-mono text-xs font-bold text-[#E6A446] uppercase tracking-wider block mb-2">
                  Stage 01
                </span>
                <h4 className="font-display text-xl text-[#173D2B] font-normal mb-2.5">
                  Explore urban green spaces
                </h4>
                <p className="text-xs sm:text-sm text-[#173D2B]/80 leading-relaxed font-editorial-sans">
                  Cataloging Delhi's spatial anchors—from Sanjay Van and Hauz Khas to the Aravalli
                  biodiversity ridges—analyzing canopy density, patch acreage, and geographic
                  isolation across the urban matrix.
                </p>
              </div>
              <div className="pt-3 border-t border-[#173D2B]/10 font-mono text-[11px] text-[#173D2B]/60 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-[#285943]" />
                <span>Spatial baseline & acreage</span>
              </div>
            </div>

            {/* Stage 2 */}
            <div className="p-5 rounded bg-[#FCF9F0] border border-[#E2D4A8] flex flex-col justify-between space-y-4 shadow-2xs">
              <div>
                <span className="font-mono text-xs font-bold text-[#E6A446] uppercase tracking-wider block mb-2">
                  Stage 02
                </span>
                <h4 className="font-display text-xl text-[#173D2B] font-normal mb-2.5">
                  Evaluate potential green connections
                </h4>
                <p className="text-xs sm:text-sm text-[#173D2B]/80 leading-relaxed font-editorial-sans">
                  Tracing existing public road alignments and municipal rights-of-way that link
                  isolated parks, evaluating street width, transit permeability, and local thermal
                  heat vulnerability.
                </p>
              </div>
              <div className="pt-3 border-t border-[#173D2B]/10 font-mono text-[11px] text-[#173D2B]/60 flex items-center gap-1.5">
                <GitFork className="w-3.5 h-3.5 text-[#285943]" />
                <span>Street right-of-way screening</span>
              </div>
            </div>

            {/* Stage 3 */}
            <div className="p-5 rounded bg-[#FCF9F0] border border-[#E2D4A8] flex flex-col justify-between space-y-4 shadow-2xs">
              <div>
                <span className="font-mono text-xs font-bold text-[#E6A446] uppercase tracking-wider block mb-2">
                  Stage 03
                </span>
                <h4 className="font-display text-xl text-[#173D2B] font-normal mb-2.5">
                  Compare budget-aware planning strategies
                </h4>
                <p className="text-xs sm:text-sm text-[#173D2B]/80 leading-relaxed font-editorial-sans">
                  Applying algorithmic graph connectivity and integer linear programming to
                  evaluate realistic budget caps (e.g. ₹2.5 Cr to ₹10 Cr), contrasting ecological
                  connectivity-first against urban heat mitigation priorities.
                </p>
              </div>
              <div className="pt-3 border-t border-[#173D2B]/10 font-mono text-[11px] text-[#173D2B]/60 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-[#285943]" />
                <span>Integer Linear Programming</span>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

export default FieldNotesSection
