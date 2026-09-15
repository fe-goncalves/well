/**
 * Clients Supabase entram na Fase 1 (auth + persistência).
 * Mantemos o ponto de extensão para não espalhar imports depois.
 */
export const SUPABASE_CONFIGURED = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
