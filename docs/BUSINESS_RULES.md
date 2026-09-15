# Regras de negócio (v3 — contrato MVP)

Fonte: conversas com o product owner. Itens sem marcação estão **fechados** para o MVP.

---

## 1. Público e escala

| Regra | Decisão |
|-------|---------|
| Usuários iniciais | Só o dono; eventualmente a namorada |
| Restrições | Nenhuma |
| Escala | Já nasce pensando em milhares (auth, RLS, export/delete) |
| Conta | Login obrigatório |

---

## 2. Entidades do dia

### 2.1 Alimentação (com IA)

- 1 caixa de texto por registro; ao enviar → **1 chamada de IA**.
- Editar → nova chamada + recalcula. Apagar ok. Esquecer o dia ok.
- Usuário informa porção no texto; IA não inventa o que não foi dito.
- IA devolve **kcal + macros** (proteína, carbo, gordura) desde o dia 1.
- Disclaimer permanente: estimativa, não consulta.
- Correção manual dos números permitida.
- **[DEPOIS]** panorama IA com contexto do dia inteiro.

### 2.2 Passos e exercícios (sem IA)

- Lançamento manual: passos, categoria, treino, descrição, kcal gastas.

### 2.3 Diário pessoal

- Texto do dia + **foto no MVP** (storage Supabase).
- **[DEPOIS]** IA analisando o diário.

### 2.4 Dados corporais

- Altura, peso, idade (+ sexo biológico para TMB), histórico de peso.

---

## 3. Gasto, TMB e saldo

### 3.1 TMB

**TMB por fórmula (Mifflin–St Jeor) + ajuste manual. Sem IA.**

```
gasto_do_dia = TMB_ajustada + exercícios_lançados
ingestao     = soma das alimentações
saldo        = gasto_do_dia − ingestao
```

- Calcular TMB na criação/atualização do perfil (peso, altura, idade, sexo).
- Disclaimer: estimativa de gasto em repouso (±~10%).
- Usuário pode sobrescrever TMB ou escolher fator de atividade (sedentário → muito ativo) para base do dia.
- Fator de atividade = base **sem** treinos explícitos; lançamentos de treino/passos **somam** por cima (UI deixa isso claro).

### 3.2 Saldo

```
saldo_do_dia = gasto_do_dia − ingestao_estimada
```

- Positivo → déficit · Negativo → superávit  
- Agrega semana, mês e goals.

---

## 4. Objetivos (goals) — lista fechada do MVP

Todos **confirmados**:

| Tipo | Significado |
|------|-------------|
| `weight_target` | Atingir peso X até data Y |
| `calorie_deficit` | Somar saldo ≥ N kcal no período |
| `calorie_surplus` | Somar superávit ≥ N kcal no período (saldo acumulado ≤ −N, conforme convenção da UI) |
| `logging_habit` | Registrar alimentação em N dias no período |

Criação e progresso **sem IA**. Sinalizações: dentro / perto / fora + tom leve.

---

## 5. IA — limites

- Estima kcal + macros de **um** registro de comida.
- Não sugere marcas, dietas, nem discurso restritivo.
- Tom neutro ↔ divertido; só apoia o registro e perguntas pontuais.

---

## 6. Gamificação — programa MVP (fechado)

Filosofia: recompensar **cuidado, registro e consistência**. Nunca recompensar fome, restrição ou “comer menos”.

### 6.1 Moedas e progressão

| Elemento | Regra |
|----------|--------|
| **XP** | Pontos cumulativos; sobem o **nível** |
| **Nível** | `level = floor(sqrt(xp / 50)) + 1` (curva suave) |
| **Streak** | Dias consecutivos “válidos” (ver 6.3), estilo LinkedIn Games |
| **Freeze** | Protege 1 dia perdido sem aumentar o streak |
| **Badges** | Conquistas one-shot ou marcos |

### 6.2 O que **ganha** XP

| Evento | XP | Notas |
|--------|-----|--------|
| `food_log` | +10 | Cada alimentação nova |
| `food_edit_correct` | +5 | Corrigiu número da IA (honestidade) |
| `activity_log` | +10 | Cada lançamento de gasto |
| `journal_log` | +15 | Diário do dia (1× por dia) |
| `journal_photo` | +5 | Bônus se anexou foto (1× por dia) |
| `day_complete` | +25 | Dia com ≥1 comida **e** (diário **ou** atividade) — “dia cuidado” |
| `weight_log` | +10 | Atualizou peso (máx. 1×/dia) |
| `goal_checkin` | +5 | Abriu e viu progresso do goal (máx. 1×/dia) |
| `goal_reached` | +100 | Completou um goal |
| `streak_milestone` | +50 / +100 / +200 | Aos 7 / 30 / 100 dias |
| `badge_bonus` | variável | XP do catálogo do badge |

### 6.3 O que **nunca** ganha XP / badge

- Ficar abaixo da meta calórica / “cumprir déficit do dia”
- Pular refeição / jejum
- Perder peso rápido
- Comparação com outros usuários (sem ranking social no MVP)
- Qualquer métrica de restrição ou culpa

### 6.4 Streak estilo LinkedIn Games

**Dia válido (conta / mantém streak):** no dia civil (timezone do usuário), pelo menos **uma** destas ações:

- ≥1 registro de **alimentação**, ou  
- ≥1 texto de **diário**, ou  
- ≥1 lançamento de **gasto** (passos/treino)

**Regras (espelho LinkedIn):**

1. Jogar (= registrar o dia válido) todo dia mantém/aumenta o streak em +1.
2. Perdeu um dia **sem freeze** → streak zera.
3. **Streak freeze:** segura o número por 1 dia perdido; **não** incrementa o streak.
4. Ganha **1 freeze** a cada **5 dias válidos seguidos**.
5. Estoque máximo: **2 freezes**.
6. Freezes **não expiram**; aplicação **automática** no primeiro dia perdido.
7. Depois de usar freeze, precisa de nova sequência de 5 para ganhar outro (se estiver abaixo do máximo).
8. UI mostra: streak atual, freezes disponíveis, aviso quando um freeze for consumido.

### 6.5 Badges iniciais

| ID | Nome | Critério |
|----|------|----------|
| `first_plate` | Primeiro prato | 1ª alimentação |
| `first_move` | Primeiro movimento | 1ª atividade |
| `first_page` | Primeira página | 1º diário |
| `honest_fork` | Garfo honesto | 1ª correção da IA |
| `streak_7` | Semana viva | Streak 7 |
| `streak_30` | Mês firme | Streak 30 |
| `streak_100` | Centena | Streak 100 |
| `goal_maker` | Mirante | Criou o 1º goal |
| `goal_finisher` | Chegada | Completou 1 goal |
| `photo_day` | Dia revelado | 1 diário com foto |
| `week_logger` | Presente na semana | 5 dias com comida na mesma semana |
| `balance_aware` | Olhou o saldo | Visitou resumo semanal 4 semanas seguidas |

### 6.6 Modos de pressão (usuário escolhe)

Configuração no perfil: **Modo de ritmo**.

| Modo | Streak | XP / nível | Metas | Tom da UI |
|------|--------|------------|-------|-----------|
| **Leve** | Visível (incentivo); freezes nos bastidores | Ocultos (toasts inclusive); XP ainda acumula | Só neutras | Mais calmo |
| **Padrão** | Visível + freezes | Visíveis + toasts | Dentro / perto / fora gentil | Neutro-divertido |
| **Firme** | Igual Padrão | Igual Padrão | Mais explícito + lembrete ~20h | Mais direto, sem culpa |

Regras fixas em **todos** os modos:

- Sem ranking público no MVP  
- Sem XP por déficit  
- Sem discurso de dieta

---

## 7. Tom e conteúdo

Neutro ↔ divertido. Sem culpa, marcas ou dietas. Disclaimer de estimativa sempre visível onde houver número de comida/TMB.

---

## 8. Privacidade

Login, RLS, exportar e apagar conta/dados — desenhar desde já.

---

## 9. MVP (alvo atual)

Auth · perfil + TMB fórmula · alimentação 1-a-1 com IA (kcal+macros) · atividade manual · diário texto+foto · saldo dia/semana/mês · 4 tipos de goal · sinalizações · gamificação (§6 após ok) · modos de ritmo · disclaimers.

---

## Checklist MVP (fechado)

- [x] TMB por fórmula + ajuste manual / fator de atividade
- [x] Passos/treinos somam além da base
- [x] Tipos de goal (4)
- [x] Macros no dia 1
- [x] Foto no diário no MVP
- [x] Programa de XP/badges v1
- [x] Streak + freeze estilo LinkedIn
- [x] Dia válido = comida **ou** diário **ou** gasto
- [x] Modo Leve: XP **some** na UI; streak **permanece** visível
