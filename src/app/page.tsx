import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/hoje");

  return (
    <div className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#0A9396]">
      {/* Atmosphere */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden
        style={{
          background: `
            radial-gradient(ellipse 80% 55% at 50% -10%, #94d2bd55 0%, transparent 55%),
            radial-gradient(ellipse 70% 50% at 100% 80%, #ee9b0033 0%, transparent 50%),
            radial-gradient(ellipse 60% 45% at 0% 100%, #005f7388 0%, transparent 45%)
          `,
        }}
      />
      <div
        className="lp-float pointer-events-none absolute -right-16 top-24 h-72 w-72 opacity-[0.18] sm:h-96 sm:w-96"
        aria-hidden
      >
        <Image
          src="/brand/W.svg"
          alt=""
          width={400}
          height={314}
          className="h-full w-full"
          priority
        />
      </div>
      <div
        className="lp-float-delayed pointer-events-none absolute -left-20 bottom-10 h-56 w-56 opacity-[0.12] sm:h-72 sm:w-72"
        aria-hidden
      >
        <Image
          src="/brand/W.svg"
          alt=""
          width={300}
          height={235}
          className="h-full w-full rotate-12"
        />
      </div>

      <main className="relative z-10 mx-auto flex w-full max-w-lg flex-1 flex-col justify-center px-5 py-12 sm:max-w-xl">
        <div className="lp-rise flex flex-col items-center text-center">
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={220}
            height={92}
            priority
            className="h-14 w-auto sm:h-16"
          />
          <h1 className="mt-8 max-w-[18ch] font-sans text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Seu caderno de hábitos, no bolso.
          </h1>
          <p className="mt-4 max-w-[32ch] text-base font-semibold text-white/80">
            Alimentação com IA, movimento, diário e metas — estimativas, não
            dietas.
          </p>

          <div className="lp-cta mt-10 flex w-full max-w-sm flex-col gap-3">
            <Link
              href="/signup"
              className="rounded-2xl bg-[var(--ink)] px-5 py-3.5 text-center text-sm font-bold text-white transition hover:bg-black"
            >
              Criar conta
            </Link>
            <Link
              href="/login"
              className="rounded-2xl bg-white/15 px-5 py-3.5 text-center text-sm font-bold text-white backdrop-blur-sm transition hover:bg-white/25"
            >
              Entrar
            </Link>
          </div>
        </div>

        <p className="lp-fade mt-16 text-center text-[11px] font-medium text-white/50">
          Use no navegador ou instale como app (PWA).
        </p>
      </main>
    </div>
  );
}
