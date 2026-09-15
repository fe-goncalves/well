"use client";

import Image from "next/image";

/** Loader mínimo — só para espera real (ex.: fetch inicial). */
export function BrandLoader({
  label = "Carregando…",
  fullScreen = true,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-3">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <span className="brand-loader-ring absolute inset-0 rounded-full" aria-hidden />
        <Image
          src="/brand/W.svg"
          alt=""
          width={48}
          height={38}
          className="relative z-10 h-8 w-auto"
          priority
        />
      </div>
      <p className="text-sm font-semibold text-white/75">{label}</p>
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <div
      className="flex min-h-dvh flex-1 items-center justify-center bg-[#0A9396]"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {inner}
    </div>
  );
}
