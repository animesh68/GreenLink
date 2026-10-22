import React from 'react'

interface DelhiIllustrationProps {
  className?: string
}

export const DelhiIllustration: React.FC<DelhiIllustrationProps> = ({ className = '' }) => {
  return (
    <div className={`relative select-none pointer-events-none w-full max-w-[720px] ${className}`}>
      <svg
        viewBox="0 0 760 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto overflow-visible"
        role="img"
        aria-label="Artistic illustration of Delhi landmarks: India Gate, Qutub Minar, and urban green canopy"
      >
        <defs>
          {/* Subtle warm gradients for architectural sandstone and terracotta */}
          <linearGradient id="indiaGateStone" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#DE8668" />
            <stop offset="50%" stopColor="#C9684A" />
            <stop offset="100%" stopColor="#AC4F33" />
          </linearGradient>

          <linearGradient id="qutubStone" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#C9684A" />
            <stop offset="35%" stopColor="#DE8668" />
            <stop offset="70%" stopColor="#BA5436" />
            <stop offset="100%" stopColor="#8E351C" />
          </linearGradient>

          <linearGradient id="domeRose" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E5B5B3" />
            <stop offset="50%" stopColor="#D8A3A1" />
            <stop offset="100%" stopColor="#B37C7A" />
          </linearGradient>

          <linearGradient id="foliageDeep" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2D664A" />
            <stop offset="100%" stopColor="#173D2B" />
          </linearGradient>

          <linearGradient id="foliageMid" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#3F825F" />
            <stop offset="100%" stopColor="#1E4B35" />
          </linearGradient>

          <linearGradient id="foliageLight" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5CA67E" />
            <stop offset="100%" stopColor="#2D664A" />
          </linearGradient>
        </defs>

        {/* ========================================================
            BACKGROUND LAYER: Distant Canopy & Mughal Dome Pavilion
            ======================================================== */}
        <g id="heritage-pavilion-backdrop">
          {/* Distant soft green grove */}
          <path
            d="M 60,390 C 80,330 140,320 180,350 C 210,310 270,315 295,355 C 320,320 370,330 390,380 Z"
            fill="#23503B"
            opacity="0.85"
          />

          {/* Mughal Dome & Drum (Humayun's Tomb / Lodhi style) */}
          <g transform="translate(130, 240)">
            {/* Lower Plinth / Podium */}
            <rect x="15" y="125" width="130" height="25" rx="3" fill="#C9684A" />
            <rect x="22" y="112" width="116" height="15" rx="2" fill="#DE8668" />

            {/* Arched alcoves on podium */}
            <path d="M 40,140 A 10,12 0 0,1 60,140 L 60,150 L 40,150 Z" fill="#7E331F" />
            <path d="M 70,140 A 10,12 0 0,1 90,140 L 90,150 L 70,150 Z" fill="#7E331F" />
            <path d="M 100,140 A 10,12 0 0,1 120,140 L 120,150 L 100,150 Z" fill="#7E331F" />

            {/* Main Octagonal Chamber / Drum */}
            <rect x="35" y="55" width="90" height="60" rx="3" fill="url(#domeRose)" stroke="#173D2B" strokeWidth="2.5" />

            {/* Central Grand Iwan Arch */}
            <path
              d="M 58,112 L 58,80 C 58,68 102,68 102,80 L 102,112 Z"
              fill="#173D2B"
            />
            {/* Inner warm arch */}
            <path
              d="M 64,112 L 64,84 C 64,74 96,74 96,84 L 96,112 Z"
              fill="#E6A446"
              opacity="0.9"
            />

            {/* Cornice trim */}
            <rect x="30" y="50" width="100" height="8" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2" />

            {/* Drum under dome */}
            <rect x="52" y="32" width="56" height="20" rx="2" fill="#FAF6EE" stroke="#173D2B" strokeWidth="2" />

            {/* Classic Bulbous Double Dome */}
            <path
              d="M 50,33 C 48,15 65,-2 80,-2 C 95,-2 112,15 110,33 Z"
              fill="url(#domeRose)"
              stroke="#173D2B"
              strokeWidth="2.5"
            />

            {/* Kalasa / Finial */}
            <line x1="80" y1="-2" x2="80" y2="-18" stroke="#173D2B" strokeWidth="2.5" strokeLinecap="round" />
            <circle cx="80" cy="-14" r="3.5" fill="#E6A446" stroke="#173D2B" strokeWidth="1.5" />
            <circle cx="80" cy="-21" r="2" fill="#E6A446" />

            {/* Flanking Chhatris (small domed kiosks) */}
            <g transform="translate(18, 22)">
              <rect x="5" y="18" width="14" height="12" fill="#FAF6EE" stroke="#173D2B" strokeWidth="1.5" />
              <path d="M 4,18 C 4,9 12,5 12,5 C 12,5 20,9 20,18 Z" fill="#E6A446" stroke="#173D2B" strokeWidth="1.5" />
              <line x1="12" y1="5" x2="12" y2="0" stroke="#173D2B" strokeWidth="1.5" />
            </g>
            <g transform="translate(108, 22)">
              <rect x="5" y="18" width="14" height="12" fill="#FAF6EE" stroke="#173D2B" strokeWidth="1.5" />
              <path d="M 4,18 C 4,9 12,5 12,5 C 12,5 20,9 20,18 Z" fill="#E6A446" stroke="#173D2B" strokeWidth="1.5" />
              <line x1="12" y1="5" x2="12" y2="0" stroke="#173D2B" strokeWidth="1.5" />
            </g>
          </g>
        </g>

        {/* ========================================================
            MIDGROUND LAYER: Qutub Minar (Rising Gracefully)
            ======================================================== */}
        <g id="qutub-minar" transform="translate(610, 40)">
          {/* Base Plinth */}
          <polygon points="-12,410 82,410 74,385 -4,385" fill="#8E351C" stroke="#173D2B" strokeWidth="2.5" />

          {/* Storey 1 (Fluted sandstone with alternating round & angular flutes) */}
          <polygon points="-2,385 72,385 66,285 4,285" fill="url(#qutubStone)" stroke="#173D2B" strokeWidth="2.5" />
          {/* Vertical fluting ridges */}
          <line x1="14" y1="385" x2="17" y2="285" stroke="#7A2C16" strokeWidth="2" opacity="0.7" />
          <line x1="28" y1="385" x2="29" y2="285" stroke="#FAF6EE" strokeWidth="2" opacity="0.6" />
          <line x1="42" y1="385" x2="41" y2="285" stroke="#7A2C16" strokeWidth="2" opacity="0.7" />
          <line x1="56" y1="385" x2="53" y2="285" stroke="#FAF6EE" strokeWidth="2" opacity="0.6" />

          {/* Balcony 1 (Intricate corbelled balcony) */}
          <rect x="-3" y="275" width="76" height="10" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2.5" />
          <path d="M -2,285 L 72,285 L 67,293 L 3,293 Z" fill="#C9684A" stroke="#173D2B" strokeWidth="1.5" />

          {/* Storey 2 (Rounded fluting) */}
          <polygon points="5,275 65,275 60,195 10,195" fill="url(#qutubStone)" stroke="#173D2B" strokeWidth="2.5" />
          <line x1="22" y1="275" x2="23" y2="195" stroke="#FAF6EE" strokeWidth="2" opacity="0.6" />
          <line x1="35" y1="275" x2="35" y2="195" stroke="#7A2C16" strokeWidth="2" opacity="0.7" />
          <line x1="48" y1="275" x2="47" y2="195" stroke="#FAF6EE" strokeWidth="2" opacity="0.6" />

          {/* Balcony 2 */}
          <rect x="4" y="186" width="62" height="9" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2.5" />

          {/* Storey 3 (Angular fluting) */}
          <polygon points="11,186 59,186 55,120 15,120" fill="url(#qutubStone)" stroke="#173D2B" strokeWidth="2.5" />
          <line x1="26" y1="186" x2="28" y2="120" stroke="#FAF6EE" strokeWidth="1.5" opacity="0.6" />
          <line x1="44" y1="186" x2="42" y2="120" stroke="#7A2C16" strokeWidth="1.5" opacity="0.7" />

          {/* Balcony 3 */}
          <rect x="10" y="112" width="50" height="8" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2.5" />

          {/* Storey 4 (White Marble & Red Sandstone band) */}
          <polygon points="16,112 54,112 51,62 19,62" fill="#FAF6EE" stroke="#173D2B" strokeWidth="2.5" />
          <rect x="17" y="80" width="36" height="8" fill="#C9684A" stroke="#173D2B" strokeWidth="1" />

          {/* Balcony 4 */}
          <rect x="14" y="56" width="42" height="7" rx="1.5" fill="#E6A446" stroke="#173D2B" strokeWidth="2" />

          {/* Storey 5 (Top Marble Storey & Cupola) */}
          <polygon points="20,56 50,56 47,20 23,20" fill="#FAF6EE" stroke="#173D2B" strokeWidth="2" />
          <path d="M 23,20 C 23,8 35,4 35,4 C 35,4 47,8 47,20 Z" fill="#C9684A" stroke="#173D2B" strokeWidth="2" />
          <line x1="35" y1="4" x2="35" y2="-8" stroke="#173D2B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="35" cy="-8" r="2.5" fill="#E6A446" stroke="#173D2B" strokeWidth="1" />
        </g>

        {/* ========================================================
            MIDGROUND CANOPY: Framing Trees
            ======================================================== */}
        <g id="mid-canopy">
          {/* Dense tree cluster left */}
          <path
            d="M 20,440 C 25,350 75,320 120,335 C 150,290 220,290 255,330 C 290,295 350,300 375,340 C 400,320 440,335 450,380 L 450,440 Z"
            fill="url(#foliageMid)"
            stroke="#173D2B"
            strokeWidth="3"
          />

          {/* Tree trunks */}
          <path d="M 95,440 L 95,370 L 105,370 L 105,440 Z" fill="#173D2B" />
          <path d="M 235,440 L 235,360 L 246,360 L 246,440 Z" fill="#173D2B" />
          <path d="M 360,440 L 360,375 L 370,375 L 370,440 Z" fill="#173D2B" />

          {/* Amaltas / Gulmohar floral accents in foliage */}
          <circle cx="130" cy="340" r="4" fill="#E6A446" />
          <circle cx="140" cy="348" r="3" fill="#E6A446" />
          <circle cx="122" cy="355" r="3.5" fill="#E6A446" />
          <circle cx="270" cy="325" r="4.5" fill="#E6A446" />
          <circle cx="282" cy="334" r="3" fill="#E6A446" />
          <circle cx="260" cy="338" r="3" fill="#E6A446" />
        </g>

        {/* ========================================================
            HERO ANCHOR: India Gate (Monumental Sandstone Arch)
            ======================================================== */}
        <g id="india-gate" transform="translate(340, 115)">
          {/* Substantial Stepped Base */}
          <rect x="-10" y="305" width="260" height="20" rx="3" fill="#8E351C" stroke="#173D2B" strokeWidth="3" />
          <rect x="6" y="292" width="228" height="15" rx="2" fill="#AC4F33" stroke="#173D2B" strokeWidth="2.5" />
          <rect x="18" y="280" width="204" height="14" rx="2" fill="#C9684A" stroke="#173D2B" strokeWidth="2.5" />

          {/* Main Pylon Blocks (Left and Right) */}
          {/* Left Pylon */}
          <rect x="25" y="115" width="58" height="165" fill="url(#indiaGateStone)" stroke="#173D2B" strokeWidth="3" />
          {/* Right Pylon */}
          <rect x="157" y="115" width="58" height="165" fill="url(#indiaGateStone)" stroke="#173D2B" strokeWidth="3" />

          {/* Left Pylon Corner Fluting/Details */}
          <line x1="33" y1="120" x2="33" y2="275" stroke="#7A2C16" strokeWidth="2" opacity="0.6" />
          <line x1="75" y1="120" x2="75" y2="275" stroke="#DE8668" strokeWidth="2" opacity="0.7" />
          {/* Right Pylon Corner Fluting/Details */}
          <line x1="165" y1="120" x2="165" y2="275" stroke="#7A2C16" strokeWidth="2" opacity="0.6" />
          <line x1="207" y1="120" x2="207" y2="275" stroke="#DE8668" strokeWidth="2" opacity="0.7" />

          {/* Deep Grand Central Archway */}
          {/* Inner Recessed Shadow Wall */}
          <path
            d="M 83,280 L 83,165 C 83,122 157,122 157,165 L 157,280 Z"
            fill="#5A2214"
            stroke="#173D2B"
            strokeWidth="3"
          />
          {/* Arch Pier Open Sky / Perspective Fill */}
          <path
            d="M 91,280 L 91,172 C 91,135 149,135 149,172 L 149,280 Z"
            fill="#7BEC78"
            opacity="0.9"
          />

          {/* Decorative Arch Ring / Voussoirs */}
          <path
            d="M 83,165 C 83,120 157,120 157,165"
            fill="none"
            stroke="#E6A446"
            strokeWidth="5"
          />
          <path
            d="M 83,165 C 83,120 157,120 157,165"
            fill="none"
            stroke="#173D2B"
            strokeWidth="2.5"
          />

          {/* Keystone / Central Arch Medallion */}
          <polygon points="116,118 124,118 126,134 114,134" fill="#E6A446" stroke="#173D2B" strokeWidth="2" />

          {/* Spandrel Medallions */}
          <circle cx="62" cy="142" r="7" fill="#E6A446" stroke="#173D2B" strokeWidth="2" />
          <circle cx="178" cy="142" r="7" fill="#E6A446" stroke="#173D2B" strokeWidth="2" />

          {/* Lower Cornice Band */}
          <rect x="18" y="105" width="204" height="12" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2.5" />

          {/* Attic Storey (Frieze) */}
          <rect x="22" y="45" width="196" height="60" rx="3" fill="url(#indiaGateStone)" stroke="#173D2B" strokeWidth="3" />

          {/* Inscribed Frieze Molding (Representing "INDIA") */}
          <rect x="55" y="65" width="130" height="20" rx="3" fill="#8E351C" stroke="#173D2B" strokeWidth="2" />
          <line x1="68" y1="75" x2="172" y2="75" stroke="#E6A446" strokeWidth="3" strokeDasharray="6 4" />

          {/* Upper Stepped Cornice Bands */}
          <rect x="15" y="35" width="210" height="12" rx="2" fill="#E6A446" stroke="#173D2B" strokeWidth="2.5" />
          <rect x="30" y="24" width="180" height="12" rx="2" fill="#C9684A" stroke="#173D2B" strokeWidth="2.5" />
          <rect x="52" y="14" width="136" height="11" rx="2" fill="#DE8668" stroke="#173D2B" strokeWidth="2" />

          {/* Top Shallow Urn / Finial Bowl (Chhatri bowl on summit) */}
          <path
            d="M 80,14 C 80,4 160,4 160,14 Z"
            fill="#E6A446"
            stroke="#173D2B"
            strokeWidth="2.5"
          />
          <line x1="120" y1="4" x2="120" y2="-6" stroke="#173D2B" strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="120" cy="-6" r="3" fill="#D8A3A1" stroke="#173D2B" strokeWidth="1.5" />
        </g>

        {/* ========================================================
            FOREGROUND LAYER: Rich Delhi Urban Tree Canopy
            ======================================================== */}
        <g id="foreground-canopy">
          {/* Canopy Mound 1 (Left foreground) */}
          <path
            d="M -20,460 C -10,380 40,340 90,360 C 120,310 190,310 230,350 C 265,315 330,320 360,365 C 380,345 420,355 435,400 L 435,460 Z"
            fill="url(#foliageDeep)"
            stroke="#173D2B"
            strokeWidth="3.5"
          />

          {/* Canopy Mound 2 (Center-Right framing India Gate) */}
          <path
            d="M 440,460 C 450,390 490,350 540,365 C 570,325 640,330 670,375 C 700,345 750,360 780,410 L 780,460 Z"
            fill="url(#foliageLight)"
            stroke="#173D2B"
            strokeWidth="3.5"
          />

          {/* Frontmost vibrant bush clusters with textured leaf arcs */}
          <path
            d="M 120,460 C 130,410 170,380 210,395 C 235,365 290,370 310,410 C 330,390 370,400 380,440 L 380,460 Z"
            fill="#23503B"
            stroke="#173D2B"
            strokeWidth="2.5"
          />

          {/* Peepal / Neem leaf texture flourishes */}
          <path
            d="M 80,390 Q 95,380 110,395"
            fill="none"
            stroke="#5CA67E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 155,360 Q 170,350 185,365"
            fill="none"
            stroke="#5CA67E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 270,360 Q 290,348 305,365"
            fill="none"
            stroke="#5CA67E"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 580,370 Q 600,355 620,375"
            fill="none"
            stroke="#7BEC78"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M 690,385 Q 710,370 730,390"
            fill="none"
            stroke="#7BEC78"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Baseline Ground Curve */}
          <path
            d="M 0,445 Q 380,440 760,445 L 760,460 L 0,460 Z"
            fill="#173D2B"
          />
        </g>
      </svg>
    </div>
  )
}
