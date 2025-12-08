'use client';

type CornerVariant = 'gold' | 'purple' | 'silver';

interface OrnateCornerProps {
  variant?: CornerVariant;
  className?: string;
}

const colors: Record<CornerVariant, string> = {
  gold: '#F59E0B',
  purple: '#8B5CF6',
  silver: '#A1A1AA',
};

function CornerSVG({ color, className }: { color: string; className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="corner-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d="M2 22 L2 8 Q2 2 8 2 L22 2"
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        filter="url(#corner-glow)"
        strokeLinecap="round"
      />
      <circle cx="2" cy="22" r="2" fill={color} filter="url(#corner-glow)" />
    </svg>
  );
}

export function OrnateCorners({ variant = 'gold', className = '' }: OrnateCornerProps) {
  const color = colors[variant];

  return (
    <div className={`pointer-events-none ${className}`}>
      {/* Top Left */}
      <CornerSVG
        color={color}
        className="absolute top-2 left-2 opacity-60"
      />
      {/* Top Right */}
      <CornerSVG
        color={color}
        className="absolute top-2 right-2 opacity-60 -scale-x-100"
      />
      {/* Bottom Left */}
      <CornerSVG
        color={color}
        className="absolute bottom-2 left-2 opacity-60 -scale-y-100"
      />
      {/* Bottom Right */}
      <CornerSVG
        color={color}
        className="absolute bottom-2 right-2 opacity-60 -scale-x-100 -scale-y-100"
      />
    </div>
  );
}
