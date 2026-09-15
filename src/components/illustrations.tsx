/** Ilustrações geométricas WELL — blocos coloridos, estilo suíço amigável. */

export function IlluDayBalance({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 160 120"
      className={className}
      aria-hidden
      role="img"
    >
      <rect width="160" height="120" rx="24" fill="#001219" />
      <circle cx="38" cy="40" r="22" fill="#0A9396" />
      <circle cx="38" cy="40" r="10" fill="#94D2BD" />
      <rect x="70" y="24" width="66" height="14" rx="7" fill="#EE9B00" />
      <rect x="70" y="46" width="50" height="10" rx="5" fill="#E9D8A6" />
      <rect x="20" y="74" width="36" height="28" rx="10" fill="#94D2BD" />
      <rect x="64" y="74" width="36" height="28" rx="10" fill="#005F73" />
      <rect x="108" y="74" width="32" height="28" rx="10" fill="#CA6702" />
    </svg>
  );
}

export function IlluJourney({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 200 100" className={className} aria-hidden>
      <rect width="200" height="100" rx="20" fill="#005F73" />
      <path
        d="M18 70 C50 20, 80 90, 110 40 S160 20, 186 55"
        fill="none"
        stroke="#94D2BD"
        strokeWidth="6"
        strokeLinecap="round"
      />
      <circle cx="28" cy="62" r="10" fill="#EE9B00" />
      <circle cx="110" cy="40" r="10" fill="#E9D8A6" />
      <circle cx="176" cy="52" r="12" fill="#0A9396" />
      <rect x="148" y="16" width="36" height="22" rx="8" fill="#001219" />
      <rect x="156" y="22" width="20" height="6" rx="3" fill="#94D2BD" />
    </svg>
  );
}

export function IlluWins({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={className} aria-hidden>
      <rect width="160" height="100" rx="20" fill="#E9D8A6" />
      <rect x="58" y="28" width="44" height="34" rx="8" fill="#EE9B00" />
      <rect x="68" y="62" width="24" height="10" fill="#CA6702" />
      <rect x="58" y="72" width="44" height="12" rx="4" fill="#001219" />
      <circle cx="30" cy="36" r="14" fill="#0A9396" />
      <circle cx="130" cy="40" r="16" fill="#94D2BD" />
      <rect x="22" y="58" width="16" height="6" rx="3" fill="#005F73" />
      <rect x="122" y="64" width="16" height="6" rx="3" fill="#005F73" />
    </svg>
  );
}

export function IlluEmpty({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 80" className={className} aria-hidden>
      <rect width="120" height="80" rx="16" fill="#94D2BD" />
      <circle cx="40" cy="36" r="12" fill="#FFFFFF" opacity="0.85" />
      <rect x="58" y="28" width="40" height="8" rx="4" fill="#005F73" />
      <rect x="58" y="42" width="28" height="6" rx="3" fill="#0A9396" />
      <rect x="24" y="56" width="72" height="10" rx="5" fill="#E9D8A6" />
    </svg>
  );
}
