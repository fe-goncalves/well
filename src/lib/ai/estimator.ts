import type { FoodEstimateResult } from "@/domain";

/**
 * Contrato do provedor de IA.
 * Fase 1: implementar Gemini; Groq como fallback opcional.
 */
export interface CalorieEstimator {
  estimateFromText(input: {
    text: string;
    locale?: string;
  }): Promise<FoodEstimateResult>;
}

export class NotConfiguredEstimator implements CalorieEstimator {
  async estimateFromText(): Promise<FoodEstimateResult> {
    throw new Error(
      "Provedor de IA ainda não configurado. Defina GEMINI_API_KEY na Fase 1.",
    );
  }
}

export const calorieEstimator: CalorieEstimator = new NotConfiguredEstimator();
