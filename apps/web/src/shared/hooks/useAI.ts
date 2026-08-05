import { useState } from "react";
import { httpClient } from "@/shared/api/client";
import { ENV } from "@/shared/config/env";

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
      if (ENV.USE_MOCK) {
        return getMockAnalysisResult(notes);
      }

      const data = await httpClient<APIResponse<AnalysisResult>>("/ai/analyze", { method: "POST", body: { notes } });

      if (!data.success) {
        throw new Error(data.error || "No se pudieron analizar las notas");
      }

      return data.data || null;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
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
  };
}

function getMockAnalysisResult(notes: string): AnalysisResult {
  return {
    categories: {
      gastos: [
        { item: "Limpieza", monto: 600, frecuencia: "Quincena", fecha: "15 y 30" },
        { item: "Spotify", monto: 239, frecuencia: "Mes", fecha: "7" },
      ],
      tareas: [{ tarea: "Pagar tarjeta", fechaVencimiento: "2026-11-30", prioridad: "alta" }],
      recordatorios: [],
      deseos: [{ deseo: "iPhone 16", estimadoCosto: 15000 }],
    },
    summary: `Análisis demo de ${notes.length} caracteres.`,
    suggestions: ["Cambiar VITE_API_MODE=LIVE para usar Gemini real."],
  };
}
