import React from 'react';

interface FFLogoProps {
  className?: string;
  size?: number;
}

export const FFLogo: React.FC<FFLogoProps> = ({ className = 'w-10 h-10', size }) => {
  const inlineStyle = size ? { width: `${size}px`, height: `${size}px` } : undefined;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 drop-shadow-md ${className}`}
      style={inlineStyle}
    >
      <svg
        viewBox="0 0 200 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full object-contain filter drop-shadow-[0_4px_8px_rgba(245,158,11,0.25)]"
      >
        <defs>
          {/* Gold Metallic Outer Border Gradient */}
          <linearGradient id="goldBorderGrad" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FDE047" />
            <stop offset="25%" stopColor="#EAB308" />
            <stop offset="50%" stopColor="#CA8A04" />
            <stop offset="75%" stopColor="#FACC15" />
            <stop offset="100%" stopColor="#A16207" />
          </linearGradient>

          {/* Gold Inner Bevel Gradient */}
          <linearGradient id="goldInnerGrad" x1="0" y1="0" x2="200" y2="240" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FEF08A" />
            <stop offset="50%" stopColor="#EAB308" />
            <stop offset="100%" stopColor="#854D0E" />
          </linearGradient>

          {/* Shield Dark Body Radial Gradient */}
          <radialGradient id="shieldDarkGrad" cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#1E293B" />
            <stop offset="60%" stopColor="#0F172A" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* Boot Gradient */}
          <linearGradient id="bootWhiteGrad" x1="40" y1="90" x2="150" y2="150" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="70%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#94A3B8" />
          </linearGradient>

          {/* Soccer Ball Pattern */}
          <radialGradient id="ballShine" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="60%" stopColor="#E2E8F0" />
            <stop offset="100%" stopColor="#64748B" />
          </radialGradient>
        </defs>

        {/* Shield Outer Gold Border */}
        <path
          d="M100 232 C65 210 20 180 20 100 V30 C20 26 40 20 100 12 C160 20 180 26 180 30 V100 C180 180 135 210 100 232 Z"
          fill="url(#goldBorderGrad)"
          stroke="#78350F"
          strokeWidth="2"
        />

        {/* Shield Inner Dark Fill with Bevel */}
        <path
          d="M100 220 C70 200 32 172 32 100 V37 C48 30 75 24 100 21 C125 24 152 30 168 37 V100 C168 172 130 200 100 220 Z"
          fill="url(#shieldDarkGrad)"
          stroke="url(#goldInnerGrad)"
          strokeWidth="3.5"
        />

        {/* "FRIDAY" Heading */}
        <text
          x="100"
          y="56"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="17"
          letterSpacing="1.5"
        >
          FRIDAY
        </text>

        {/* "FOOTBALL" Heading */}
        <text
          x="100"
          y="75"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="18"
          letterSpacing="2"
        >
          FOOTBALL
        </text>

        {/* Background Soccer Ball */}
        <g transform="translate(105, 78)">
          {/* Ball Circle */}
          <circle cx="28" cy="28" r="26" fill="url(#ballShine)" stroke="#0F172A" strokeWidth="2.5" />
          
          {/* Ball Hexagon / Pentagon Patches */}
          <path
            d="M28 15 L38 21 L35 32 L21 32 L18 21 Z"
            fill="#0F172A"
          />
          <line x1="28" y1="15" x2="28" y2="4" stroke="#0F172A" strokeWidth="2" />
          <line x1="38" y1="21" x2="48" y2="15" stroke="#0F172A" strokeWidth="2" />
          <line x1="35" y1="32" x2="44" y2="42" stroke="#0F172A" strokeWidth="2" />
          <line x1="21" y1="32" x2="12" y2="42" stroke="#0F172A" strokeWidth="2" />
          <line x1="18" y1="21" x2="8" y2="15" stroke="#0F172A" strokeWidth="2" />
          {/* Perimeter curved patches */}
          <path d="M48 15 Q54 28 44 42" stroke="#0F172A" strokeWidth="2" fill="none" />
          <path d="M12 42 Q28 54 44 42" stroke="#0F172A" strokeWidth="2" fill="none" />
          <path d="M8 15 Q2 28 12 42" stroke="#0F172A" strokeWidth="2" fill="none" />
          <path d="M8 15 Q18 4 28 4" stroke="#0F172A" strokeWidth="2" fill="none" />
          <path d="M28 4 Q38 4 48 15" stroke="#0F172A" strokeWidth="2" fill="none" />
        </g>

        {/* Football Boot / Cleat (Foreground) */}
        <g transform="translate(42, 92) rotate(-8)">
          {/* Boot Shadow */}
          <ellipse cx="44" cy="50" rx="38" ry="8" fill="#000000" opacity="0.6" />

          {/* Sole / Cleats */}
          <path
            d="M10 38 Q30 46 78 36 L80 40 Q30 50 8 40 Z"
            fill="#D97706"
            stroke="#78350F"
            strokeWidth="1.5"
          />
          {/* Cleat Studs */}
          <rect x="14" y="40" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="24" y="43" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="62" y="38" width="4" height="3" fill="#D97706" rx="1" />
          <rect x="72" y="36" width="4" height="3" fill="#D97706" rx="1" />

          {/* Main Shoe Body */}
          <path
            d="M8 38 C6 28 12 18 24 16 C30 15 36 20 45 22 C60 25 76 28 82 35 C83 37 81 38 78 37 C60 36 28 45 8 38 Z"
            fill="url(#bootWhiteGrad)"
            stroke="#0F172A"
            strokeWidth="2.5"
          />

          {/* Heel / Collar Dark Section */}
          <path
            d="M8 38 C6 28 12 18 24 16 C26 22 24 30 18 36 Z"
            fill="#0F172A"
          />

          {/* Tongue & Laces */}
          <path d="M26 18 Q36 21 44 24" stroke="#0F172A" strokeWidth="2" fill="none" />
          {/* Lacing Crosses */}
          <line x1="28" y1="18" x2="31" y2="24" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="33" y1="19" x2="36" y2="25" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="38" y1="21" x2="41" y2="27" stroke="#0F172A" strokeWidth="1.5" />
          <line x1="43" y1="23" x2="46" y2="29" stroke="#0F172A" strokeWidth="1.5" />

          {/* Toe Cap Accent */}
          <path d="M70 32 Q78 33 82 35" stroke="#CBD5E1" strokeWidth="1.5" fill="none" />
        </g>

        {/* "EST. 2021" Text */}
        <text
          x="100"
          y="178"
          textAnchor="middle"
          fill="#FFFFFF"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="900"
          fontSize="15"
          letterSpacing="2.5"
        >
          EST. 2021
        </text>

        {/* Golden Star at the bottom */}
        <polygon
          points="100,188 103,197 112,197 105,203 107,212 100,206 93,212 95,203 88,197 97,197"
          fill="#FACC15"
          stroke="#CA8A04"
          strokeWidth="1"
        />
      </svg>
    </div>
  );
};
