import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "@config/env";

const USE_MOCK = !env.geminiApiKey;
const GEMINI_MODEL = "gemini-3.6-flash";
let client: GoogleGenerativeAI | null = null;

function getClient() {
  if (USE_MOCK) return null;
  if (!client) {
    client = new GoogleGenerativeAI(env.geminiApiKey);
  }
  return client;
}

function localDateIso(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export interface AnalysisResult {
  categories: {
    gastos: Array<{ item: string; monto: number; frecuencia: string; fecha?: string; descripcion?: string; metodoPago?: string }>;
    tareas: Array<{ tarea: string; fechaVencimiento?: string; prioridad: "alta" | "media" | "baja" }>;
    recordatorios: Array<{ recordatorio: string; fecha: string }>;
    deseos: Array<{ deseo: string; estimadoCosto?: number }>;
  };
  athletePlan?: {
    name: string;
    startDate: string;
    endDate: string;
    days: Array<{ date: string; text: string }>;
    events?: Array<{ name: string; date: string; type: "competition" | "seminar" | "vacation" }>;
  };
  summary: string;
  suggestions: string[];
}

export async function analyzeNotes(notes: string): Promise<AnalysisResult> {
  if (USE_MOCK) {
    // ponytail: mock response for development without API key
    return getMockAnalysisResult(notes);
  }

  const client = getClient();
  if (!client) throw new Error("Gemini client not initialized");
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Fecha actual: ${localDateIso()}.

Analiza las siguientes notas desorganizadas y extrae:
1. Gastos (con monto, frecuencia y fecha si aplica; usa YYYY-MM-DD cuando haya vencimiento completo)
2. Tareas pendientes (con fecha de vencimiento si aplica)
3. Recordatorios importantes (con fechas)
4. Deseos/cosas que quiere comprar (con costo estimado si aplica)
5. Si las notas describen un plan deportivo completo, crea athletePlan con fechas ISO YYYY-MM-DD y texto narrativo por día. Si hay competencias, seminarios o vacaciones dentro del plan, agrégalas en athletePlan.events. Si no hay plan deportivo claro, omite athletePlan.
6. Convierte fechas relativas como "mañana", "el viernes" o "este mes" usando la fecha actual.

Notas:
${notes}

Responde en JSON con esta estructura exacta:
{
  "categories": {
    "gastos": [{"item": "...", "monto": 0, "frecuencia": "...", "fecha": "...", "descripcion": "...", "metodoPago": "efectivo|credito"}],
    "tareas": [{"tarea": "...", "fechaVencimiento": "...", "prioridad": "alta|media|baja"}],
    "recordatorios": [{"recordatorio": "...", "fecha": "..."}],
    "deseos": [{"deseo": "...", "estimadoCosto": 0}]
  },
  "athletePlan": {"name": "...", "startDate": "YYYY-MM-DD", "endDate": "YYYY-MM-DD", "days": [{"date": "YYYY-MM-DD", "text": "..."}], "events": [{"name": "...", "date": "YYYY-MM-DD", "type": "competition|seminar|vacation"}]},
  "summary": "Resumen breve de lo encontrado",
  "suggestions": ["sugerencia 1", "sugerencia 2"]
}

Ejemplos de interpretación:
- "Plan fuerza 4 semanas desde lunes: lunes sentadilla 5x5, miércoles banca 4x6, viernes peso muerto 3x5" => athletePlan.days con cada sesión en su fecha.
- "Competencia regional el 2026-09-20" => athletePlan.events con type "competition".
- "Seminario técnica el viernes" => athletePlan.events con type "seminar" y fecha calculada desde la fecha actual.
- "Vacaciones del 10 al 14" => athletePlan.events con type "vacation".
- "Seguro auto 4200 vence 2026-09-15 crédito" => categories.gastos con fecha "2026-09-15" y metodoPago "credito".`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]) as AnalysisResult;
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to parse AI response");
  }
}

export interface StructureOptions {
  organizationMethods: string[];
  prioritizationApproach: string;
  timelineEstimate: string;
  nextSteps: string[];
}

export async function getStructuringOptions(analysisResult: AnalysisResult): Promise<StructureOptions> {
  if (USE_MOCK) {
    return getMockStructuringOptions(analysisResult);
  }

  const client = getClient();
  if (!client) throw new Error("Gemini client not initialized");
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Basado en este análisis de notas:
${JSON.stringify(analysisResult, null, 2)}

Proporciona opciones para estructurar y organizar estos datos. Responde en JSON:
{
  "organizationMethods": ["método 1", "método 2", "método 3"],
  "prioritizationApproach": "sugerencia de priorización",
  "timelineEstimate": "estimación de tiempo para completar",
  "nextSteps": ["paso 1", "paso 2", "paso 3"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]) as StructureOptions;
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to parse AI response");
  }
}

export interface SuggestionResponse {
  suggestions: Array<{ categoria: string; sugerencia: string; razon: string }>;
  budgetAnalysis?: { totalMensual: number; categoria: string; recomendacion: string }[];
  riskFactors?: string[];
}

export async function getSuggestions(analysisResult: AnalysisResult): Promise<SuggestionResponse> {
  if (USE_MOCK) {
    return getMockSuggestions(analysisResult);
  }

  const client = getClient();
  if (!client) throw new Error("Gemini client not initialized");
  const model = client.getGenerativeModel({ model: GEMINI_MODEL });

  const prompt = `Basado en este análisis financiero y de tareas:
${JSON.stringify(analysisResult, null, 2)}

Proporciona sugerencias útiles para mejorar la organización y gestión. Incluye análisis de presupuesto si hay gastos. Responde en JSON:
{
  "suggestions": [{"categoria": "...", "sugerencia": "...", "razon": "..."}],
  "budgetAnalysis": [{"totalMensual": 0, "categoria": "...", "recomendacion": "..."}],
  "riskFactors": ["factor 1", "factor 2"]
}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();

  try {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in response");
    }
    return JSON.parse(jsonMatch[0]) as SuggestionResponse;
  } catch (error) {
    console.error("Failed to parse Gemini response:", text);
    throw new Error("Failed to parse AI response");
  }
}

// Mock functions for development without API key
function getMockAnalysisResult(notes: string): AnalysisResult {
  return {
    categories: {
      gastos: [
        { item: "Limpieza", monto: 600, frecuencia: "Quincena", fecha: "15 y 30", descripcion: "Casa", metodoPago: "efectivo" },
        { item: "Pollo/Comida", monto: 1200, frecuencia: "Quincena", fecha: "15 y 30", descripcion: "Comida familiar", metodoPago: "efectivo" },
        { item: "Spotify", monto: 239, frecuencia: "Mes", fecha: "7", descripcion: "Suscripcion", metodoPago: "efectivo" },
        { item: "Seguro auto", monto: 4200, frecuencia: "Unico", fecha: "2026-09-15", descripcion: "Renovacion anual", metodoPago: "credito" },
      ],
      tareas: [
        { tarea: "Pagar tarjeta/cuenta", fechaVencimiento: "2026-11-30", prioridad: "alta" },
      ],
      recordatorios: [],
      deseos: [
        { deseo: "GTA VI", estimadoCosto: 1700 },
        { deseo: "iPhone 16", estimadoCosto: 15000 },
      ],
    },
    athletePlan: notes.toLowerCase().includes("plan") ? {
      name: "Plan demo",
      startDate: "2026-08-10",
      endDate: "2026-08-16",
      days: [
        { date: "2026-08-10", text: "Fuerza\nSentadilla 5x5" },
        { date: "2026-08-12", text: "Cardio\n30 min zona 2" },
      ],
      events: [{ name: "Competencia demo", date: "2026-08-16", type: "competition" }],
    } : undefined,
    summary: "Se encontraron 3 gastos recurrentes (limpieza, comida, Spotify), 1 pago pendiente importante y 2 deseos de compra. Los gastos mensuales rondan $2,039 + recurrentes.",
    suggestions: [
      "Crear calendario de pagos para no olvidar el 15 y 30",
      "Agrupar gastos de comida con limpieza (mismos días)",
      "Establecer presupuesto mensual de $3,000 mínimo",
      "Considerar suspender Spotify si el presupuesto es tight",
    ],
  };
}

function getMockStructuringOptions(analysis: AnalysisResult): StructureOptions {
  return {
    organizationMethods: [
      "Calendario con recordatorios automáticos para pagos",
      "Tabla de gastos por categoría con filtros",
      "Dashboard con gráficos de presupuesto mensual",
      "Aplicación móvil con notificaciones push",
    ],
    prioritizationApproach: "Ordenar por fecha de vencimiento (urgentes primero) y luego por importe",
    timelineEstimate: "2-3 horas para crear estructura inicial, 30 min/mes para mantener",
    nextSteps: [
      "Crear calendario de pagos fijos",
      "Establecer límites de presupuesto por categoría",
      "Configurar alertas para vencimientos",
      "Revisar presupuesto cada domingo",
    ],
  };
}

function getMockSuggestions(analysis: AnalysisResult): SuggestionResponse {
  const totalGastos = analysis.categories.gastos.reduce((sum, g) => sum + g.monto, 0);

  return {
    suggestions: [
      {
        categoria: "Gastos",
        sugerencia: "Agrupar Pollo y Limpieza pues comparten fechas (15 y 30)",
        razon: "Facilita administración y recordatorios",
      },
      {
        categoria: "Presupuesto",
        sugerencia: "Establecer presupuesto máximo de $3,500/mes",
        razon: "Cubre gastos recurrentes + buffer para deseos",
      },
      {
        categoria: "Deseos",
        sugerencia: "Ahorrar $500/mes para GTA VI en 3.4 meses",
        razon: "Costo de $1,700 es realista con este plan",
      },
    ],
    budgetAnalysis: [
      {
        totalMensual: totalGastos,
        categoria: "Gastos Fijos",
        recomendacion: `${totalGastos} es el mínimo mensual. Considera margen de 20% para imprevistos`,
      },
    ],
    riskFactors: [
      "Pagos concentrados en los días 15 y 30 (riesgo de quedarte sin fondos)",
      "Spotify es gasto menor pero recurrente (considera si realmente lo usas)",
      "Deseo de iPhone 16 requiere $15k (13+ meses de ahorro)",
    ],
  };
}
