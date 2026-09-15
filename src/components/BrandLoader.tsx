"use client";

import Image from "next/image";

export function BrandLoader({
  label = "Carregando…",
  fullScreen = true,
}: {
  label?: string;
  fullScreen?: boolean;
}) {
  const inner = (
    <div className="flex flex-col items-center gap-4">
      <div className="brand-loader-orbit relative flex h-20 w-20 items-center justify-center">
        <span className="brand-loader-ring absolute inset-0 rounded-full" aria-hidden />
        <Image
          src="/brand/W.svg"
          alt=""
          width={56}
          height={44}
          className="brand-loader-w relative z-10 h-10 w-auto"
          priority
        />
      </div>
      <p className="text-sm font-semibold text-white/75">{label}</p>
    </div>
  );

  if (!fullScreen) return inner;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-[#0A9396]/92 backdrop-blur-sm"
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      {inner}
    </div>
  );
}
