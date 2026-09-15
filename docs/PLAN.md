# Plano do produto — WELL

Pasta do projeto: `C:\Users\conta\Projects\well`  
**Marca:** WELL.

**Contrato de produto:** [`BUSINESS_RULES.md`](./BUSINESS_RULES.md)  
**UI/UX:** [`UI_UX.md`](./UI_UX.md)

## Visão

App web **mobile-first**: registrar alimentação (texto → IA), gasto (manual), diário pessoal; calcular **saldo** (gasto − ingestão); acompanhar semanas/meses e **goals** criados pelo usuário; gamificar com tom neutro-divertido. Uso interno primeiro; arquitetura já multi-usuário.

## Princípios anti-quebra

1. Domínio completo cedo (alimentação, atividade, diário, saldo, goals; gamificação reservada até regras fechadas).
2. Fatias verticais usáveis — sem meia feature.
3. IA **somente** onde combinado (estimativa de alimentação; depois diário/panorama). Goals e saldo = regras do sistema.
4. 1 envio de alimentação = 1 chamada de IA; editar = nova chamada.
5. Gamificação conforme `BUSINESS_RULES.md` §6 (streak estilo LinkedIn; modo Leve esconde XP e mantém streak).

## Módulos

| Módulo | Responsabilidade |
|--------|------------------|
| `profile` | Conta, altura/peso/idade, histórico |
| `food` | Registros de alimentação + IA |
| `activity` | Passos, treinos, gasto manual |
| `journal` | Texto do dia (+ foto) |
| `balance` | Rollup dia/semana/mês (gasto − ingestão) |
| `goals` | Objetivos sistematizados |
| `gamification` | Streak/XP/badges/modos — regras fechadas no MVP |

## Ordem de entrega (ajustada às regras)

### Fase 0 — Fundação
Scaffold, docs de regras, schema alinhado ao domínio novo.

### Fase 1 — Conta + perfil + alimentação com IA
Login, medidas básicas, CRUD de alimentação 1-a-1 com estimativa, disclaimer, totais de ingestão do dia.

### Fase 2 — Atividade + saldo
Passos/treinos manuais, saldo do dia, vistas semana/mês.

### Fase 3 — Goals + sinalizações
Criar/acompanhar objetivos numéricos; estados dentro/fora/perto da meta.

### Fase 4 — Diário (+ foto se couber)
Texto do dia; foto; sem IA de análise ainda.

### Fase 5 — Gamificação
XP, badges, streak + freeze, modos de ritmo (Leve esconde XP; streak visível).

### Depois
PWA, IA no diário, panorama do dia, automação de metas.

## Stack

Next.js + TypeScript + Tailwind · Supabase · Gemini (Groq plano B) · deploy depois (ex.: Vercel).
