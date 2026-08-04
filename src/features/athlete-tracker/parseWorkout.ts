export type TroteData = {
  raw: string;
  workMin: number | undefined;
  restMin: number | undefined;
  totalMin: number;
};

export type ParsedWorkout = {
  title: string;
  exercises: string[];
  trote: TroteData | null;
  nota: string | null;
};

export function parseCellText(text: string): ParsedWorkout {
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { title: "", exercises: [], trote: null, nota: null };

  const title = lines[0] ?? "";
  const rest = lines.slice(1);

  const exercises: string[] = [];
  let trote: TroteData | null = null;
  let nota: string | null = null;

  for (const line of rest) {
    const lower = line.toLowerCase();
    if (lower.startsWith("trote")) {
      // "trote 2x4 40min" or "trote 40min"
      const match = line.match(/trote\s+(?:(\d+)x(\d+)\s+)?(\d+)min/i);
      if (match) {
        trote = {
          raw: line,
          workMin: match[1] ? parseInt(match[1]) : undefined,
          restMin: match[2] ? parseInt(match[2]) : undefined,
          totalMin: parseInt(match[3] ?? "0"),
        };
      } else {
        trote = { raw: line, workMin: undefined, restMin: undefined, totalMin: 0 };
      }
    } else if (lower.startsWith("nota")) {
      nota = line.replace(/^nota[:\s]*/i, "").trim() || null;
    } else {
      exercises.push(line);
    }
  }

  return { title, exercises, trote, nota };
}

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function formatSpanishDate(isoOrDate: string | Date): string {
  const d = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  return `${d.getDate()} de ${months[d.getMonth()] ?? ""}`;
}

export function daysUntil(isoDate: string): number {
  const target = new Date(isoDate);
  target.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export const MOTIVATIONAL_PHRASES = [
  "El dolor de hoy es la fuerza de mañana.",
  "No pares cuando estés cansado, para cuando hayas terminado.",
  "Cada rep te acerca más a tu meta.",
  "La constancia construye campeones.",
  "Tu único límite eres tú.",
  "Entrena duro, sé humilde, mejora siempre.",
  "El esfuerzo de hoy es el resultado de mañana.",
  "Más allá del dolor está el progreso.",
  "Los campeones entrenan, los demás solo se ejercitan.",
  "Un día más, un paso más adelante.",
];

export function randomPhrase(): string {
  return MOTIVATIONAL_PHRASES[Math.floor(Math.random() * MOTIVATIONAL_PHRASES.length)] ?? MOTIVATIONAL_PHRASES[0] ?? "";
}
