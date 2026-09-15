import Image from "next/image";

const actions = [
  { label: "Comer", hint: "Texto → IA", className: "bg-[var(--teal)] text-white" },
  { label: "Mover", hint: "Gasto manual", className: "bg-[var(--amber)] text-[var(--ink)]" },
  { label: "Diário", hint: "1× ao dia", className: "bg-[var(--sand)] text-[var(--ink)]" },
] as const;

const palette = [
  "#001219",
  "#005F73",
  "#0A9396",
  "#94D2BD",
  "#E9D8A6",
  "#FFFFFF",
  "#EE9B00",
  "#CA6702",
  "#BB3E03",
  "#AE2012",
  "#9B2226",
] as const;

export default function HomePage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-1 flex-col px-4 pb-28 pt-6 sm:max-w-2xl sm:px-6 lg:max-w-5xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <Image
            src="/brand/well.svg"
            alt="WELL"
            width={132}
            height={56}
            priority
            className="h-9 w-auto sm:h-10"
          />
          <p className="mt-2 text-sm text-[var(--muted)]">Hoje · shell visual</p>
        </div>
        <div className="rounded-full bg-[var(--amber)] px-3 py-1 text-sm font-semibold text-[var(--ink)]">
          Streak 0
        </div>
      </header>

      <main className="mt-8 flex flex-1 flex-col gap-6 lg:mt-10 lg:grid lg:grid-cols-[1.15fr_0.85fr] lg:items-start lg:gap-8">
        <section className="rounded-[1.75rem] bg-[var(--mint)] px-5 py-6 text-[var(--ink)] sm:px-7 sm:py-8">
          <p className="text-sm font-medium text-[var(--deep)]">Saldo do dia</p>
          <p className="font-display mt-2 text-4xl tracking-tight sm:text-5xl">0 kcal</p>
          <p className="mt-2 text-sm font-medium text-[var(--deep)]">Empatado no dia</p>
          <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-2xl bg-white px-4 py-3">
              <dt className="text-[var(--muted)]">Ingestão</dt>
              <dd className="mt-1 text-lg font-semibold">0</dd>
            </div>
            <div className="rounded-2xl bg-white px-4 py-3">
              <dt className="text-[var(--muted)]">Gasto</dt>
              <dd className="mt-1 text-lg font-semibold">0</dd>
            </div>
          </dl>
          <p className="mt-4 text-xs leading-relaxed text-[var(--deep)]">
            Estimativa com base no que você registrar — não é consulta nutricional.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <p className="text-sm font-medium text-[var(--muted)]">Registrar</p>
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {actions.map((action) => (
              <button
                key={action.label}
                type="button"
                disabled
                className={`rounded-2xl px-2 py-4 text-center opacity-90 ${action.className}`}
              >
                <span className="block text-sm font-semibold">{action.label}</span>
                <span className="mt-1 block text-[11px] opacity-80">{action.hint}</span>
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--sand)]/40 px-4 py-4">
            <p className="text-sm font-medium">Timeline</p>
            <p className="mt-1 text-sm text-[var(--muted)]">
              Ainda vazio — a primeira ação do dia já conta no streak.
            </p>
          </div>
        </section>
      </main>

      <section className="mt-10 lg:mt-12">
        <h2 className="font-display text-2xl tracking-tight">Paleta WELL</h2>
        <p className="mt-1 text-sm text-[var(--muted)]">
          Logo em <code className="text-[var(--deep)]">public/brand/</code> (SVG + PNG).
        </p>
        <div className="mt-4 grid grid-cols-6 gap-2 sm:grid-cols-11">
          {palette.map((hex) => (
            <div key={hex} className="flex flex-col items-center gap-1">
              <div
                className="h-10 w-full rounded-lg border border-[var(--line)]"
                style={{ backgroundColor: hex }}
                title={hex}
              />
              <span className="hidden text-[9px] text-[var(--muted)] sm:block">
                {hex.replace("#", "")}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl bg-[var(--ink)] px-5 py-4">
          <Image
            src="/brand/well.svg"
            alt="WELL em fundo escuro"
            width={148}
            height={62}
            className="h-10 w-auto"
          />
          <p className="text-sm text-[var(--mint)]">Versão mint no ink — auth / onboarding</p>
        </div>
      </section>

      <nav
        aria-label="Principal"
        className="fixed inset-x-0 bottom-0 border-t border-[var(--line)] bg-white"
      >
        <div className="mx-auto grid max-w-lg grid-cols-4 gap-1 px-2 py-2 text-center text-xs font-semibold sm:max-w-2xl lg:max-w-5xl">
          <span className="rounded-xl bg-[var(--mint)] px-1 py-2 text-[var(--deep)]">Hoje</span>
          <span className="rounded-xl px-1 py-2 text-[var(--muted)]">Jornada</span>
          <span className="rounded-xl px-1 py-2 text-[var(--muted)]">Conquistas</span>
          <span className="rounded-xl px-1 py-2 text-[var(--muted)]">Você</span>
        </div>
      </nav>
    </div>
  );
}
