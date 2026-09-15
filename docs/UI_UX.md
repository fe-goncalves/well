# Plano de UI/UX (v2 — contrato visual MVP)

Alinha com [`BUSINESS_RULES.md`](./BUSINESS_RULES.md).  
**Marca:** WELL · Logo: a caminho (wordmark/ícone entram quando você entregar o arquivo).

---

## 1. Princípios

1. **Celular primeiro, espetacular; desktop útil**
2. **Uma ação por vez** — Comer · Mover · Diário
3. **Números com humanidade** + disclaimer de estimativa
4. **Gamificação a serviço do hábito** — no modo Leve some o **XP** na UI; o **streak permanece** como incentivo
5. **Home = o dia de hoje** (não dashboard)
6. **Claro > escuro**, **sólidos > degradês**, **bastante variação de cor** da paleta WELL
7. Sem estética “dieta roxa”, glow, icon rows, culpa

---

## 2. Marca e tipografia

| Item | Decisão |
|------|---------|
| Nome | **WELL** |
| Display | Fraunces |
| UI | Manrope |
| Auth / onboarding | Logo WELL em escala hero |
| App logado | Logo discreta no header; herói = o dia |

---

## 3. Paleta WELL

Fonte: [Coolors](https://coolors.co/palette/001219-005f73-0a9396-94d2bd-e9d8a6-ee9b00-ca6702-bb3e03-ae2012-9b2226) + branco.

| Token | Hex | Uso |
|-------|-----|-----|
| `ink` | `#001219` | Texto principal, blocos de ênfase |
| `deep` | `#005F73` | Headers secundários, links, nav ativa |
| `teal` | `#0A9396` | CTA primária, sucesso calmo |
| `mint` | `#94D2BD` | Fundos de destaque, chips positivos, “no azul” |
| `sand` | `#E9D8A6` | Fundos suaves, diário, superfícies secundárias |
| `white` | `#FFFFFF` | Superfície principal do app |
| `amber` | `#EE9B00` | Streak, freezes, atenção amigável |
| `orange` | `#CA6702` | Hover/ênfase de amber |
| `coral` | `#BB3E03` | “Perto da meta” / aviso |
| `red` | `#AE2012` | “No vermelho do dia” / fora da meta |
| `crimson` | `#9B2226` | Erro / destrutivo (apagar) |

**Regras de uso**
- Fundo da app: `white` dominante; `sand` e `mint` em faixas/blocos sólidos.
- Evitar degradês como identidade; no máximo 1 detalhe sutil se necessário.
- Variar cor por contexto (comida / movimento / diário / saldo) — não tudo teal.
- Texto sobre `mint`/`sand`: preferir `ink` ou `deep` (contraste).
- CTAs: fundo `teal`, texto `white`.
- Não usar a escala vermelha para “falha moral” — só saldo/meta/erro técnico.

### Mapa semântico rápido

| Contexto | Cor |
|----------|-----|
| Comer | `teal` / `deep` |
| Mover | `amber` / `orange` |
| Diário | `sand` + `ink` |
| Saldo positivo (“no azul”) | `mint` + `deep` |
| Saldo negativo (“no vermelho”) | `red` suave + copy leve |
| Streak | `amber` |
| XP / nível (modos Padrão/Firme) | `orange` → `coral` |

---

## 4. Navegação (fechado)

| Aba | Função |
|-----|--------|
| **Hoje** | Saldo + registrar + timeline |
| **Jornada** | Semana/mês + goals + peso |
| **Conquistas** | Streak, badges; XP/nível conforme modo |
| **Você** | Perfil, TMB, modo de ritmo, privacidade |

---

## 5. Conteúdo do dia (fechado)

- **Diário:** 1 entrada por dia, editável (+ foto).
- **Composer:** 3 ações distintas (sheets).
- **Lembrete ~20h:** só modo Firme.

### Linguagem do saldo (banco de variações)

Rotacionar / sortear entre frases no mesmo sentido — nunca culpa.

**Saldo > 0 (gasto > ingestão)**  
- “No azul”  
- “Hoje o gasto vai na frente”  
- “Saldo positivo — energia a favor”  
- “Conta no azul por agora”

**Saldo ≈ 0**  
- “Empatado no dia”  
- “Quase no zero a zero”  
- “Dia equilibrado até aqui”

**Saldo < 0 (ingestão > gasto)**  
- “No vermelho do dia”  
- “Ingestão na frente — só um número, não um veredito”  
- “Saldo negativo por agora”  
- “Vermelho no placar de hoje”

**Meta do período (Jornada)**  
- Dentro: “Dentro do combinado”  
- Perto: “Chegando perto do objetivo”  
- Fora: “Fora do ritmo do objetivo — dá para ajustar sem drama”

---

## 6. Modos na UI (atualizado)

| Modo | Streak | XP / nível | Metas |
|------|--------|------------|-------|
| **Leve** | **Visível** (incentivo) | **Oculto** (toasts e painéis de XP/nível) | Sinais neutros |
| **Padrão** | Visível + freezes | Visível + toasts | Dentro/perto/fora gentil |
| **Firme** | Visível + freezes | Visível + toasts | Mais explícito + lembrete 20h |

XP continua existindo nos bastidores em todos os modos; no Leve só não aparece.

---

## 7. Telas, motion, desktop, a11y

Mantém o desenho da v1 (sheets, timeline, Jornada, Conquistas, rail no desktop, 3 motions, AA, reduced-motion) — ver seções históricas abaixo se precisar de detalhe de fluxo; a direção visual desta v2 **substitui** fundos em degradê e a paleta antiga.

### Hierarquia Hoje

```
[ Header: WELL · data · streak compacto ]
[ Bloco Saldo — cor sólida conforme estado ]
[ Composer — Comer | Mover | Diário ]
[ Timeline ]
[ Disclaimer estimativa ]
```

### Motion MVP
1. Count-up do saldo  
2. Toast XP (só Padrão/Firme)  
3. Sheet slide-up  

---

## 8. Checklist (fechado)

- [x] 4 abas
- [x] Diário 1×/dia editável
- [x] Linguagem do saldo + variações
- [x] Modo Leve: XP some; streak permanece
- [x] Lembrete 20h só Firme
- [x] Marca WELL
- [x] Paleta Coolors + branco; claro; sólidos
- [x] Fontes Fraunces + Manrope
- [x] Logo em `public/brand/well.svg` + `well.png`
