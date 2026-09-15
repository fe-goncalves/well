import type { FoodEstimateResult, MealSlot, Confidence } from "@/domain";

const MEAL_SLOT_HELP = `Categorias válidas de mealSlot:
- breakfast = café da manhã
- lunch = almoço
- afternoon_snack = lanche da tarde
- dinner = jantar
- supper = ceia`;

function buildSystem(preferredSlot?: MealSlot) {
  return `Você estima calorias e macros do que o usuário comeu.
Regras de ITENS:
- Preparação composta = 1 item. Nunca desmonte.
  Exemplos de 1 item: "café com leite", "pão com ovo", "mingau de aveia com banana".
- Se o usuário listar VÁRIOS alimentos/pratos distintos no mesmo texto, separe em itens (um por alimento/prato).
  Ex.: "café com leite, 2 ovos mexidos e 1 banana" → 3 itens:
    1) café com leite
    2) 2 ovos mexidos
    3) 1 banana
- Se o usuário pedir um total único / "tudo junto" / "só o total da refeição", retorne 1 item agregado.
- Use APENAS o que o usuário escreveu. Não invente alimentos ou porções.
- Se a porção estiver vaga, estime com confidence "low" e seja conservador.
- Responda SOMENTE JSON válido, sem markdown.
${MEAL_SLOT_HELP}
${preferredSlot ? `O usuário já escolheu a categoria: ${preferredSlot}. Use esse mealSlot em TODOS os itens.` : ""}
Formato:
{
  "items": [
    {
      "label": "nome curto do item",
      "mealSlot": "breakfast|lunch|afternoon_snack|dinner|supper",
      "calories": number,
      "protein": number,
      "carbs": number,
      "fat": number,
      "confidence": "low|medium|high"
    }
  ],
  "notes": "opcional, uma frase curta"
}`;
}

/** Modelos rápidos/baratos primeiro — 503/404 em um pula para o próximo. */
const FALLBACK_MODELS = [
  "gemini-flash-lite-latest",
  "gemini-3.1-flash-lite-preview",
  "gemini-3.5-flash",
  "gemini-3.5-flash-lite",
  "gemini-flash-latest",
  "gemini-3.6-flash",
] as const;

function normalizeSlot(value: unknown, fallback: MealSlot = "lunch"): MealSlot {
  const allowed: MealSlot[] = [
    "breakfast",
    "lunch",
    "afternoon_snack",
    "dinner",
    "supper",
  ];
  if (value === "snack") return "afternoon_snack";
  if (value === "other") return fallback;
  return allowed.includes(value as MealSlot) ? (value as MealSlot) : fallback;
}

function normalizeConfidence(value: unknown): Confidence {
  const allowed: Confidence[] = ["low", "medium", "high"];
  return allowed.includes(value as Confidence)
    ? (value as Confidence)
    : "medium";
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseEstimate(
  raw: string,
  preferredSlot?: MealSlot,
): FoodEstimateResult {
  const parsed = JSON.parse(raw) as {
    items?: Array<Record<string, unknown>>;
    notes?: string;
  };
  const fallback = preferredSlot ?? "lunch";

  const items = (parsed.items ?? []).map((item) => ({
    label: String(item.label ?? "Item"),
    mealSlot: preferredSlot ?? normalizeSlot(item.mealSlot, fallback),
    calories: Math.max(0, Math.round(Number(item.calories) || 0)),
    protein: Math.max(0, Number(item.protein) || 0),
    carbs: Math.max(0, Number(item.carbs) || 0),
    fat: Math.max(0, Number(item.fat) || 0),
    confidence: normalizeConfidence(item.confidence),
  }));

  if (items.length === 0) {
    throw new Error("A IA não retornou itens. Detalhe a porção e tente de novo.");
  }

  return { items, notes: parsed.notes ? String(parsed.notes) : undefined };
}

async function callModel(
  apiKey: string,
  model: string,
  text: string,
  preferredSlot?: MealSlot,
): Promise<
  | { ok: true; result: FoodEstimateResult }
  | { ok: false; retryable: boolean; detail: string }
> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `${buildSystem(preferredSlot)}\n\nTexto do usuário:\n${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    const retryable =
      res.status === 503 || res.status === 429 || res.status >= 500;
    return {
      ok: false,
      retryable,
      detail: `${model} → ${res.status}: ${body.slice(0, 120)}`,
    };
  }

  const data = (await res.json()) as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!raw) {
    return { ok: false, retryable: true, detail: `${model} → resposta vazia` };
  }

  try {
    return { ok: true, result: parseEstimate(raw, preferredSlot) };
  } catch (err) {
    return {
      ok: false,
      retryable: true,
      detail: `${model} → JSON inválido (${err instanceof Error ? err.message : "erro"})`,
    };
  }
}

function modelQueue(): string[] {
  const preferred = process.env.GEMINI_MODEL?.trim();
  const queue = preferred
    ? [preferred, ...FALLBACK_MODELS]
    : [...FALLBACK_MODELS];
  return [...new Set(queue)];
}

export async function estimateFoodWithGemini(
  text: string,
  preferredSlot?: MealSlot,
): Promise<FoodEstimateResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY não configurada");
  }

  const models = modelQueue();

  for (const model of models) {
    for (let attempt = 0; attempt < 2; attempt++) {
      const outcome = await callModel(apiKey, model, text, preferredSlot);
      if (outcome.ok) return outcome.result;
      if (!outcome.retryable) break;
      if (attempt === 0) await sleep(400);
    }
  }

  throw new Error(
    "A IA está sobrecarregada agora. Espere alguns segundos e tente de novo.",
  );
}
