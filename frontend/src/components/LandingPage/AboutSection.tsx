import React, { useEffect, useRef, useState } from 'react'
import aboutVideoSrc from '../../assets/about-countryside.mp4'
import aboutPosterSrc from '../../assets/about-poster.jpg'

export const AboutSection: React.FC = () => {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)
  const [videoError, setVideoError] = useState(false)
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)
  const [hasMounted, setHasMounted] = useState(false)
  const [isRevealed, setIsRevealed] = useState(false)

  useEffect(() => {
    // Check for prefers-reduced-motion
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
        // Autoplay policy fallback: video remains on poster
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

    const target = contentRef.current
    if (!target) {
      setIsRevealed(true)
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry && entry.isIntersecting) {
          setIsRevealed(true)
          observer.disconnect() // One-time organic reveal: stays visible when scrolling
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.15
      }
    )

    observer.observe(target)

    // Safety fallback: guaranteed visibility so text is never permanently hidden
    const fallbackTimer = setTimeout(() => {
      setIsRevealed(true)
    }, 2000)

    return () => {
      observer.disconnect()
      clearTimeout(fallbackTimer)
    }
  }, [prefersReducedMotion])

  const isHidden = hasMounted && !isRevealed && !prefersReducedMotion

  return (
    <section
      id="about"
      aria-label="About GreenLink"
      className="relative w-full min-h-[92vh] sm:min-h-screen flex flex-col justify-between overflow-hidden bg-[#78BCE2] select-none"
    >
      {/* =========================================================================
          1. FULL-WIDTH BACKGROUND COUNTRYSIDE VIDEO
          Positioned to ground the countryside / truck at the bottom and keep open sky above
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

        {/* Very subtle sky-toned gradient overlay to gently enhance text contrast without darkening */}
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
          Reveals with a subtle, organic scroll animation
          ========================================================================= */}
      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-4xl mx-auto px-6 sm:px-10 lg:px-12 pt-14 sm:pt-20 md:pt-24 lg:pt-28 pb-10 flex flex-col items-center text-center"
      >
        {/* Main Heading in Uploaded Shaun-the-Sheep Clay Font */}
        <h2
          className={`font-clay text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-[#103D30] tracking-wide leading-[1.1] mb-4 sm:mb-6 about-reveal-heading ${
            isHidden ? 'is-hidden' : 'is-visible'
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
          className={`font-editorial-sans text-[#123D32] text-sm sm:text-base md:text-lg lg:text-[1.15rem] leading-relaxed max-w-2xl font-semibold px-2 sm:px-4 about-reveal-body ${
            isHidden ? 'is-hidden' : 'is-visible'
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
          className={`flex items-center justify-center gap-3 mt-4 sm:mt-6 about-reveal-motif ${
            isHidden ? 'is-hidden' : 'is-visible'
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

      {/* Spacer to guarantee the lower part of the video (farmer, dog, sheep, truck) remains clear */}
      <div
        className="relative z-10 w-full h-32 sm:h-44 md:h-56 lg:h-64 pointer-events-none"
        aria-hidden="true"
      />
    </section>
  )
}

export default AboutSection
