import React from 'react';

const NB_TEAL = '#00FFFF';
const NB_PINK = '#FF00FF';
const NB_WHITE = '#F5F5F5';

interface LogoMarkProps {
  size?: number;
  className?: string;
}

/**
 * Custom recreation of the Nunya Bunya mark based on the provided reference image.
 * Uses Tailwind's neon palette so colors stay consistent across the app.
 */
export const LogoMark: React.FC<LogoMarkProps> = ({ size = 56, className = '' }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 120 120"
    role="img"
    aria-label="Nunya Bunya logo"
    className={className}
  >
    <g fill="none" fillRule="evenodd">
      {/* Left leaf */}
      <path
        d="M46 54C30 46 16 23 23 12c9-14 34-11 45 9 6 11 2 24-10 30-4 2-8 2-12 3Z"
        fill={NB_TEAL}
      />
      <path
        d="M50 28c-6 1-13 5-16 9 6-3 11-4 16-3 2 1 4 2 5 4 3-2 4-6 3-10-2 0-4 0-6 0Z"
        fill="#041b1f"
        opacity={0.35}
      />

      {/* Lower leaf */}
      <path
        d="M42 64C28 66 14 72 12 82c-2 12 18 22 38 12 10-5 12-12 11-18-1-8-8-14-19-12Z"
        fill={NB_TEAL}
      />
      <path
        d="M32 80c4-3 9-4 14-4"
        stroke="#013a3f"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Pink leaf */}
      <path
        d="M72 18c12-8 36-6 40 10 3 11-5 22-20 34-7-5-14-11-20-18-9-11-6-20 0-26Z"
        fill={NB_PINK}
      />
      <path
        d="M98 32c-6 1-12 4-15 7"
        stroke="#630063"
        strokeWidth={3}
        strokeLinecap="round"
        opacity={0.5}
      />

      {/* Lightning motif */}
      <path
        d="M88 56 114 40 102 70 118 66 76 112l12-30-18 4z"
        fill={NB_WHITE}
      />

      {/* Trunk */}
      <path
        d="M54 58h12l12 40H58z"
        fill={NB_TEAL}
      />
      <path
        d="M66 58c3 8 2 18-2 30"
        stroke="#013a3f"
        strokeWidth={4}
        strokeLinecap="round"
        opacity={0.4}
      />

      {/* Anchor */}
      <path
        d="M32 108c20-8 40-8 60 0-20 6-40 6-60 0Z"
        fill={NB_WHITE}
      />
      <circle cx="60" cy="92" r="4" fill={NB_PINK} />
    </g>
  </svg>
);


