import React from 'react';

/**
 * BrandLogo - Custom strategic vector brand icon for Barricade (Quoridor).
 * Features a tactical squircle shield with opposing Red & Blue pawns
 * blocked by a central glowing golden barricade beam.
 */
export default function BrandLogo({ size = 28, className = '' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 transition-transform duration-200 group-hover:scale-105 ${className}`}
      aria-label="Barricade Logo"
    >
      <defs>
        {/* Shield plate gradient */}
        <linearGradient id="shieldBg" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e222b" />
          <stop offset="50%" stopColor="#14171d" />
          <stop offset="100%" stopColor="#0d0f12" />
        </linearGradient>

        {/* Shield border gradient */}
        <linearGradient id="shieldBorder" x1="0" y1="0" x2="36" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#475569" />
          <stop offset="50%" stopColor="#334155" />
          <stop offset="100%" stopColor="#1e293b" />
        </linearGradient>

        {/* Golden barricade beam gradient */}
        <linearGradient id="barricadeGold" x1="0" y1="18" x2="36" y2="18" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="25%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#fef08a" />
          <stop offset="75%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>

        {/* Blue pawn gradient & glow */}
        <radialGradient id="bluePawn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#93c5fd" />
          <stop offset="60%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </radialGradient>

        {/* Red pawn gradient & glow */}
        <radialGradient id="redPawn" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fca5a5" />
          <stop offset="60%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#b91c1c" />
        </radialGradient>

        {/* Barricade beam glow */}
        <filter id="barricadeGlow" x="-20%" y="-40%" width="140%" height="180%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Tactical squircle shield plate */}
      <rect
        x="1.5"
        y="1.5"
        width="33"
        height="33"
        rx="9"
        fill="url(#shieldBg)"
        stroke="url(#shieldBorder)"
        strokeWidth="1.5"
      />

      {/* Subtle strategic grid accent lines */}
      <line x1="7" y1="18" x2="29" y2="18" stroke="#334155" strokeWidth="0.5" strokeDasharray="1.5 2" opacity="0.4" />
      <line x1="18" y1="7" x2="18" y2="29" stroke="#334155" strokeWidth="0.5" strokeDasharray="1.5 2" opacity="0.4" />

      {/* Opposing Blue Pawn (Top) */}
      <g>
        <circle cx="18" cy="9.5" r="4.2" fill="#3b82f6" opacity="0.25" />
        <circle cx="18" cy="9.5" r="3.2" fill="url(#bluePawn)" />
        <circle cx="17.2" cy="8.6" r="1" fill="#ffffff" opacity="0.8" />
      </g>

      {/* Central Golden Glowing Barricade Beam */}
      <g filter="url(#barricadeGlow)">
        <rect
          x="6.5"
          y="15.5"
          width="23"
          height="5"
          rx="2.5"
          fill="url(#barricadeGold)"
          stroke="#78350f"
          strokeWidth="0.6"
        />
        {/* Core highlight stripe */}
        <line
          x1="9"
          y1="18"
          x2="27"
          y2="18"
          stroke="#ffffff"
          strokeWidth="0.8"
          strokeLinecap="round"
          opacity="0.85"
        />
      </g>

      {/* Opposing Red Pawn (Bottom) */}
      <g>
        <circle cx="18" cy="26.5" r="4.2" fill="#ef4444" opacity="0.25" />
        <circle cx="18" cy="26.5" r="3.2" fill="url(#redPawn)" />
        <circle cx="17.2" cy="25.6" r="1" fill="#ffffff" opacity="0.8" />
      </g>
    </svg>
  );
}
