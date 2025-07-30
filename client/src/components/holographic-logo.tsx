export function SimpleRadarLogo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <div className={`${className} relative`}>
      <svg
        viewBox="0 0 32 32"
        className="w-full h-full"
        fill="none"
      >
        <defs>
          <linearGradient id="clay-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(25, 95%, 53%)" />
            <stop offset="100%" stopColor="hsl(27, 96%, 61%)" />
          </linearGradient>
        </defs>
        
        {/* Main radar circle */}
        <circle
          cx="16"
          cy="16"
          r="12"
          fill="none"
          stroke="url(#clay-gradient)"
          strokeWidth="2"
        />
        
        {/* Inner radar rings */}
        <circle
          cx="16"
          cy="16"
          r="8"
          fill="none"
          stroke="url(#clay-gradient)"
          strokeWidth="1.5"
          opacity="0.6"
        />
        <circle
          cx="16"
          cy="16"
          r="4"
          fill="none"
          stroke="url(#clay-gradient)"
          strokeWidth="1"
          opacity="0.4"
        />
        
        {/* Cross lines */}
        <line
          x1="16"
          y1="6"
          x2="16"
          y2="26"
          stroke="url(#clay-gradient)"
          strokeWidth="1"
          opacity="0.7"
        />
        <line
          x1="6"
          y1="16"
          x2="26"
          y2="16"
          stroke="url(#clay-gradient)"
          strokeWidth="1"
          opacity="0.7"
        />
        
        {/* Trust indicators */}
        <circle cx="20" cy="12" r="1.5" fill="hsl(142, 76%, 36%)" opacity="0.8" />
        <circle cx="12" cy="20" r="1.5" fill="hsl(25, 95%, 53%)" opacity="0.8" />
        <circle cx="22" cy="22" r="1" fill="hsl(217, 91%, 60%)" opacity="0.7" />
      </svg>
    </div>
  );
}

