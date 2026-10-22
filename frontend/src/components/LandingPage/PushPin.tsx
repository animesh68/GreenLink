import React from 'react'

interface PushPinProps {
  color?: 'red' | 'brass' | 'forest'
  className?: string
}

export const PushPin: React.FC<PushPinProps> = ({ color = 'red', className = '' }) => {
  const colors = {
    red: {
      cap: '#D32F2F',
      highlight: '#FF6659',
      shadow: '#9A0007',
      ring: '#B71C1C'
    },
    brass: {
      cap: '#C28B39',
      highlight: '#E8CF9B',
      shadow: '#8C5D1E',
      ring: '#9E6C24'
    },
    forest: {
      cap: '#1D4332',
      highlight: '#3D7A5E',
      shadow: '#0D2419',
      ring: '#153627'
    }
  }[color]

  return (
    <div className={`relative inline-block select-none pointer-events-none ${className}`}>
      {/* Drop shadow on the paper behind the pin */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 w-4 h-2.5 rounded-full bg-black/25 blur-[1.5px]"
        aria-hidden="true"
      />

      <svg
        width="22"
        height="28"
        viewBox="0 0 22 28"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10 filter drop-shadow-[0_2px_3px_rgba(0,0,0,0.25)]"
        role="presentation"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={`pinCapGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={colors.highlight} />
            <stop offset="45%" stopColor={colors.cap} />
            <stop offset="100%" stopColor={colors.shadow} />
          </linearGradient>
          <linearGradient id={`pinNeckGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor={colors.shadow} />
            <stop offset="50%" stopColor={colors.highlight} />
            <stop offset="100%" stopColor={colors.shadow} />
          </linearGradient>
          <linearGradient id="needleGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#8A8A8A" />
            <stop offset="50%" stopColor="#E0E0E0" />
            <stop offset="100%" stopColor="#606060" />
          </linearGradient>
        </defs>

        {/* Pin Needle Tip piercing paper */}
        <polygon points="10,18 12,18 11.2,27 10.8,27" fill="url(#needleGrad)" />

        {/* Lower Flange Ring */}
        <ellipse cx="11" cy="18" rx="6.5" ry="2.2" fill={colors.ring} stroke="#00000030" strokeWidth="0.5" />

        {/* Tapered Stem / Grip Waist */}
        <path
          d="M 6.5,8 C 6.5,12 8,17 11,17 C 14,17 15.5,12 15.5,8 Z"
          fill={`url(#pinNeckGrad-${color})`}
        />

        {/* Top Spherical Head */}
        <ellipse
          cx="11"
          cy="7"
          rx="7.5"
          ry="5.5"
          fill={`url(#pinCapGrad-${color})`}
          stroke="#00000030"
          strokeWidth="0.5"
        />

        {/* Glassy Specular Highlight */}
        <ellipse cx="9" cy="5.2" rx="2.5" ry="1.2" fill="#FFFFFF" opacity="0.65" />
      </svg>
    </div>
  )
}
