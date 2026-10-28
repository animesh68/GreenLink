import React, { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import aboutVideoSrc from '../../assets/about-countryside.mp4'
import aboutPosterSrc from '../../assets/about-poster.jpg'

gsap.registerPlugin(ScrollTrigger)

export const AboutSection: React.FC = () => {
  const sectionRef = useRef<HTMLElement | null>(null)
  const pinContainerRef = useRef<HTMLDivElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const headingRef = useRef<HTMLHeadingElement | null>(null)
  const bodyRef = useRef<HTMLParagraphElement | null>(null)
  const motifRef = useRef<HTMLDivElement | null>(null)

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

  // Video autoplay policy handling (video plays freely in background)
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (prefersReducedMotion) {
      video.pause()
    } else {
      video.play().catch(() => {
        // Fallback gracefully to poster
      })
    }
  }, [prefersReducedMotion])

  // GSAP ScrollTrigger Scroll-Driven Animation & Storytelling
  useEffect(() => {
    if (prefersReducedMotion) return

    const section = sectionRef.current
    const pinContainer = pinContainerRef.current
    const heading = headingRef.current
    const body = bodyRef.current
    const motif = motifRef.current

    if (!section || !pinContainer || !heading || !body || !motif) return

    const mm = gsap.matchMedia()

    // Desktop & Tablet (viewport width >= 768px): Pinned storytelling with progressive reveals
    mm.add('(min-width: 768px)', () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: '+=80%',
          pin: pinContainer,
          pinSpacing: true,
          scrub: 0.6,
          invalidateOnRefresh: true
        }
      })

      // Initial state
      gsap.set(heading, { opacity: 0, y: 50, scale: 0.95 })
      gsap.set(body, { opacity: 0, y: 35 })
      gsap.set(motif, { opacity: 0, scale: 0.85 })

      // Choreographed scroll-driven timeline:
      // 1. Heading enters with subtle organic scale and drifts into the sky
      tl.to(heading, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.35,
        ease: 'power2.out'
      })
      // 2. Body copy enters smoothly into the upper sky
      .to(body, {
        opacity: 1,
        y: 0,
        duration: 0.35,
        ease: 'power2.out'
      }, '-=0.15')
      // 3. Leaf motif gracefully draws in
      .to(motif, {
        opacity: 0.85,
        scale: 1,
        duration: 0.25,
        ease: 'back.out(1.5)'
      }, '-=0.1')
      // 4. Content settles in view while user absorbs the scene
      .to({}, { duration: 0.4 })
      // 5. Gentle, subtle handoff ease as section transitions towards Insights
      .to([heading, body, motif], {
        opacity: 0.25,
        y: -25,
        duration: 0.3,
        ease: 'power1.in'
      })

      return () => {
        tl.kill()
      }
    })

    // Mobile (< 768px): Natural, non-pinned scroll with smooth trigger reveals
    mm.add('(max-width: 767px)', () => {
      gsap.set([heading, body, motif], { opacity: 0, y: 30 })

      const mobileTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 75%',
          end: 'top 25%',
          scrub: 0.5
        }
      })

      mobileTl
        .to(heading, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' })
        .to(body, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }, '-=0.2')
        .to(motif, { opacity: 0.8, scale: 1, duration: 0.3, ease: 'power2.out' }, '-=0.2')

      return () => {
        mobileTl.kill()
      }
    })

    return () => {
      mm.revert()
    }
  }, [prefersReducedMotion])

  return (
    <section
      ref={sectionRef}
      id="about"
      aria-label="About GreenLink"
      className="relative w-full bg-[#78BCE2] select-none overflow-hidden"
    >
      {/* Pinned Viewport Container */}
      <div
        ref={pinContainerRef}
        className="relative w-full h-screen min-h-[660px] flex flex-col justify-between overflow-hidden"
      >
        {/* =========================================================================
            1. FULL-WIDTH BACKGROUND COUNTRYSIDE VIDEO
            Grounds the countryside / truck / sheep at bottom; keeps sky open above
            Plays independently of scroll progress
            ========================================================================= */}
        <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
          {!videoError && !prefersReducedMotion ? (
            <video
              ref={videoRef}
              src={aboutVideoSrc}
              poster={aboutPosterSrc}
              autoPlay
              loop
              muted
              playsInline
              disablePictureInPicture
              disableRemotePlayback
              onError={() => setVideoError(true)}
              className="w-full h-full object-cover object-bottom"
              aria-hidden="true"
            />
          ) : (
            <img
              src={aboutPosterSrc}
              alt="Handcrafted clay-animation countryside with farmer and pickup truck"
              className="w-full h-full object-cover object-bottom"
              aria-hidden="true"
            />
          )}

          {/* Gentle sky-toned gradient overlay to enhance text contrast without darkening */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                'linear-gradient(180deg, rgba(230, 244, 252, 0.35) 0%, rgba(200, 235, 250, 0.15) 45%, rgba(0, 0, 0, 0.05) 100%)'
            }}
            aria-hidden="true"
          />
        </div>

        {/* =========================================================================
            2. ABOUT CONTENT IN THE OPEN SKY
            Comfortably placed in the upper-middle portion of the open sky
            ========================================================================= */}
        <div
          className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 pt-16 sm:pt-20 md:pt-24 lg:pt-28 pb-10 flex flex-col items-center text-center"
        >
          {/* Main Heading in Uploaded Shaun-the-Sheep Clay Font */}
          <h2
            ref={headingRef}
            className={`font-clay text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#103D30] tracking-wide leading-[1.1] mb-4 sm:mb-6 will-change-transform ${
              prefersReducedMotion ? 'opacity-100 transform-none' : ''
            }`}
            style={{
              textShadow:
                '0 2px 0 rgba(255, 255, 255, 0.9), 0 4px 14px rgba(255, 255, 255, 0.75), 0 6px 20px rgba(16, 61, 48, 0.2)'
            }}
          >
            About GreenLink
          </h2>

          {/* Supporting Copy in Clean Sans-Serif */}
          <p
            ref={bodyRef}
            className={`font-editorial-sans text-[#123D32] text-sm sm:text-base md:text-lg lg:text-[1.15rem] leading-relaxed max-w-2xl font-semibold px-2 sm:px-4 will-change-transform ${
              prefersReducedMotion ? 'opacity-100 transform-none' : ''
            }`}
            style={{
              textShadow:
                '0 1px 2px rgba(255, 255, 255, 0.95), 0 2px 8px rgba(255, 255, 255, 0.7)'
            }}
          >
            GreenLink Delhi helps planners identify where disconnected urban green
            spaces can be linked through data-driven, budget-conscious planning. By
            comparing connectivity and heat-priority objectives, we help turn
            spatial data into more informed green-infrastructure decisions.
          </p>

          {/* Small Tasteful Decorative Motif in the Sky */}
          <div
            ref={motifRef}
            className={`flex items-center justify-center gap-3 mt-4 sm:mt-6 will-change-transform ${
              prefersReducedMotion ? 'opacity-75 transform-none' : ''
            }`}
            aria-hidden="true"
          >
            <div className="w-10 sm:w-16 h-[1.5px] bg-gradient-to-r from-transparent to-[#123D32]/50" />
            <svg
              viewBox="0 0 24 24"
              className="w-4 h-4 text-[#123D32] fill-current"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14.5v-9l6 4.5-6 4.5z" opacity="0" />
              <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3 7 0 12-7 12-12 0-.34-.02-.67-.05-1-.98.3-2.02.48-3.05.51.07.16.1.33.1.49z" />
            </svg>
            <div className="w-10 sm:w-16 h-[1.5px] bg-gradient-to-l from-transparent to-[#123D32]/50" />
          </div>
        </div>

        {/* Bottom breathing space to keep lower video (farmer, dog, sheep, truck) perfectly clear */}
        <div
          className="relative z-10 w-full h-24 sm:h-36 md:h-44 pointer-events-none"
          aria-hidden="true"
        />
      </div>
    </section>
  )
}

export default AboutSection
