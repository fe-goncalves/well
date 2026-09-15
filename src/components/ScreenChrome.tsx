import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";

export function ScreenChrome({
  bg,
  heroBg = "#005F73",
  backHref,
  backLabel = "Voltar",
  eyebrow,
  title,
  subtitle,
  heroExtra,
  children,
  logoWhite = false,
}: {
  bg: string;
  heroBg?: string;
  backHref: string;
  backLabel?: string;
  eyebrow: string;
  title: string;
  subtitle?: string;
  heroExtra?: ReactNode;
  children: ReactNode;
  logoWhite?: boolean;
}) {
  return (
    <div className="min-h-full flex-1" style={{ backgroundColor: bg }}>
      <div className="mx-auto flex w-full max-w-lg flex-1 flex-col px-4 pb-10 pt-6 sm:max-w-2xl">
        <header className="flex items-center justify-between gap-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white"
          >
            ← {backLabel}
          </Link>
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={100}
            height={42}
            className={`h-7 w-auto ${logoWhite ? "brightness-0 invert" : ""}`}
          />
        </header>

        <section
          className="relative mt-6 overflow-hidden rounded-[1.75rem] px-5 py-6"
          style={{ backgroundColor: heroBg }}
        >
          <p className="text-sm font-bold uppercase tracking-wide text-white/70">
            {eyebrow}
          </p>
          <p className="mt-2 font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-2 text-sm font-semibold text-white/80">{subtitle}</p>
          ) : null}
          {heroExtra}
        </section>

        <div className="mt-5 flex flex-col gap-5">{children}</div>
      </div>
    </div>
  );
}

export function FormCard({
  title,
  emoji,
  children,
  darkHeader = false,
}: {
  title?: string;
  emoji?: string;
  children: ReactNode;
  darkHeader?: boolean;
}) {
  return (
    <section className="overflow-hidden rounded-[1.5rem] bg-[var(--sand)]">
      {title ? (
        <div
          className={`flex items-center gap-2 px-4 py-3 ${
            darkHeader ? "bg-[var(--ink)] text-white" : "bg-white/40 text-[var(--ink)]"
          }`}
        >
          <p className="flex items-center gap-2 text-sm font-bold">
            {emoji ? <span aria-hidden>{emoji}</span> : null}
            {title}
          </p>
        </div>
      ) : null}
      <div className="space-y-3 p-3">{children}</div>
    </section>
  );
}

export function FieldBlock({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-white px-4 py-3 shadow-sm">
      <p className="text-[10px] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
        {label}
      </p>
      <div className="mt-2">{children}</div>
    </div>
  );
}
