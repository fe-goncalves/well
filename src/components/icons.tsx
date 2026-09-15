import type { ReactNode } from "react";

type IconProps = {
  className?: string;
  title?: string;
};

/** Ícones com cor própria da paleta WELL (não dependem de currentColor cinza). */

export function IconHome({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#0A9396" d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z" />
      <path fill="#94D2BD" d="M10 15h4v6h-4z" />
    </svg>
  );
}

export function IconPath({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="6" cy="7" r="2.5" fill="#EE9B00" />
      <circle cx="18" cy="17" r="2.5" fill="#0A9396" />
      <path
        d="M8 8.5c3 1 4 3 5 5s3 3.5 5 3.5"
        fill="none"
        stroke="#005F73"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function IconTrophy({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EE9B00" d="M8 4h8v3a4 4 0 0 1-8 0V4z" />
      <path fill="#CA6702" d="M10 11h4l-.5 3h-3L10 11z" />
      <rect x="9" y="14" width="6" height="2" rx="1" fill="#001219" />
      <rect x="8" y="17" width="8" height="3" rx="1.5" fill="#E9D8A6" />
      <path fill="#94D2BD" d="M6 5h2v2.2A3.5 3.5 0 0 1 6 5zm10 0h2a3.5 3.5 0 0 1-2 2.2V5z" />
    </svg>
  );
}

export function IconPerson({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="8" r="3.2" fill="#0A9396" />
      <path fill="#005F73" d="M5 19.5c1.8-3.4 4-5 7-5s5.2 1.6 7 5v.5H5v-.5z" />
      <circle cx="12" cy="8" r="1.4" fill="#94D2BD" />
    </svg>
  );
}

export function IconFlame({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#EE9B00"
        d="M12 2c1.2 2.6 1.8 4.4.8 6.2 1.8-.8 3.7.2 4.6 1.8 1.2 2.4-.4 6.2-5.4 8.2-5-2-7.2-5.8-6-8.2.8-1.6 2.6-2.6 4.4-1.8C10.4 6.4 10.8 4.6 12 2z"
      />
      <path fill="#CA6702" d="M12 10.5c.7 1.2 1 2 .4 3 .9-.3 1.8.2 2.2 1 .6 1.2-.1 3-2.6 4-2.5-1-3.6-2.8-3-4 .4-.8 1.3-1.3 2.2-1-.5-.9-.3-1.9.8-3z" />
    </svg>
  );
}

export function IconPlate({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <circle cx="12" cy="13" r="8" fill="#94D2BD" />
      <circle cx="12" cy="13" r="5.5" fill="#E9D8A6" />
      <circle cx="12" cy="13" r="2.2" fill="#0A9396" />
      <rect x="11" y="3" width="2" height="4" rx="1" fill="#005F73" />
    </svg>
  );
}

export function IconBolt({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#EE9B00" d="M13 2 4 14h7l-1 8 10-14h-7l1-6z" />
      <path fill="#CA6702" d="M12.2 8 8 14h3.2l-.4 3.5L15.5 10H12.8l-.6-2z" />
    </svg>
  );
}

export function IconBook({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#005F73" d="M5 4h11a3 3 0 0 1 3 3v12H8a3 3 0 0 0-3 3V4z" />
      <path fill="#0A9396" d="M5 4h10v15H8a3 3 0 0 0-3 3V4z" />
      <path fill="#94D2BD" d="M7 7h6v1.4H7zm0 3h6v1.4H7zm0 3h4v1.4H7z" />
    </svg>
  );
}

export function IconFlag({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#001219" d="M6 3h2v18H6z" />
      <path fill="#0A9396" d="M8 4h10l-2.2 3.2L18 10.5H8V4z" />
      <path fill="#94D2BD" d="M8 4h6.5L13 7.2 14.5 10.5H8V4z" />
    </svg>
  );
}

export function IconScale({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path fill="#001219" d="M11 3h2v16h-2z" />
      <path fill="#EE9B00" d="M4 8h7l-1.5 5H5.5L4 8zm9 0h7l-1.5 5h-4L13 8z" />
      <rect x="7" y="19" width="10" height="2.5" rx="1.2" fill="#E9D8A6" />
    </svg>
  );
}

export function IconCalendar({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <rect x="3" y="5" width="18" height="16" rx="3" fill="#005F73" />
      <rect x="3" y="5" width="18" height="5" rx="3" fill="#0A9396" />
      <rect x="3" y="8" width="18" height="2" fill="#0A9396" />
      <circle cx="8" cy="14" r="1.2" fill="#94D2BD" />
      <circle cx="12" cy="14" r="1.2" fill="#E9D8A6" />
      <circle cx="16" cy="14" r="1.2" fill="#EE9B00" />
      <rect x="7" y="3" width="2" height="4" rx="1" fill="#001219" />
      <rect x="15" y="3" width="2" height="4" rx="1" fill="#001219" />
    </svg>
  );
}

export function IconTile({
  children,
  tone = "mint",
  size = "md",
}: {
  children: ReactNode;
  tone?: "mint" | "amber" | "sand" | "teal" | "deep" | "ink";
  size?: "sm" | "md" | "lg";
}) {
  const tones: Record<string, string> = {
    mint: "bg-[var(--mint)]",
    amber: "bg-[var(--amber)]",
    sand: "bg-[var(--sand)]",
    teal: "bg-[var(--teal)]",
    deep: "bg-[var(--deep)]",
    ink: "bg-[var(--ink)]",
  };
  const sizes: Record<string, string> = {
    sm: "h-9 w-9 rounded-xl",
    md: "h-12 w-12 rounded-2xl",
    lg: "h-16 w-16 rounded-3xl",
  };
  return (
    <div
      className={`inline-flex items-center justify-center ${tones[tone]} ${sizes[size]}`}
    >
      {children}
    </div>
  );
}
