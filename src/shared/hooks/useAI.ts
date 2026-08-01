import { useState } from "react";

export interface AnalysisResult {
  categories: {
    gastos?: Array<{ item: string; monto: number; frecuencia: string; fecha?: string }>;
    tareas?: Array<{ tarea: string; fechaVencimiento?: string; prioridad: "alta" | "media" | "baja" }>;
    recordatorios?: Array<{ recordatorio: string; fecha: string }>;
    deseos?: Array<{ deseo: string; estimadoCosto?: number }>;
  };
  summary: string;
  suggestions: string[];
}

export interface StructureOptions {
  organizationMethods: string[];
  prioritizationApproach: string;
  timelineEstimate: string;
  nextSteps: string[];
}

export interface SuggestionResponse {
  suggestions: Array<{ categoria: string; sugerencia: string; razon: string }>;
  budgetAnalysis?: Array<{ totalMensual: number; categoria: string; recomendacion: string }>;
  riskFactors?: string[];
}

interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export function useAI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyzeNotes = async (notes: string): Promise<AnalysisResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/ai/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notes }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: APIResponse<AnalysisResult> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to analyze notes");
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getStructuringOptions = async (analysis: AnalysisResult): Promise<StructureOptions | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/ai/structure", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysis }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: APIResponse<StructureOptions> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get structuring options");
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getSuggestions = async (analysis: AnalysisResult): Promise<SuggestionResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/ai/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ analysis }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data: APIResponse<SuggestionResponse> = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to get suggestions");
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    analyzeNotes,
    getStructuringOptions,
    getSuggestions,
  };
}
