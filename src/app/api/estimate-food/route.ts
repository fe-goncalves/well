import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { estimateFoodWithGemini } from "@/lib/ai/gemini";
import type { MealSlot } from "@/domain";

const SLOTS: MealSlot[] = [
  "breakfast",
  "lunch",
  "afternoon_snack",
  "dinner",
  "supper",
];

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = (await request.json()) as {
    text?: string;
    mealSlot?: string;
  };
  const text = body.text?.trim();
  if (!text) {
    return NextResponse.json({ error: "Texto vazio" }, { status: 400 });
  }

  const mealSlot = SLOTS.includes(body.mealSlot as MealSlot)
    ? (body.mealSlot as MealSlot)
    : undefined;

  try {
    const estimate = await estimateFoodWithGemini(text, mealSlot);
    return NextResponse.json(estimate);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Falha na estimativa";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
