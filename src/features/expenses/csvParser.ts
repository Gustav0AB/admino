import { randomUUID } from "expo-crypto";
import type { Expense, Estado, Frecuencia, MetodoPago } from "./types";
import { MESES_LIST } from "./helpers";

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      fields.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  fields.push(current.trim());
  return fields;
}

export function toMes(raw: string): string {
  const s = raw.trim().toLowerCase();
  const monthMap: Record<string, string> = {
    enero: "Enero", january: "Enero", jan: "Enero", "1": "Enero", "01": "Enero",
    febrero: "Febrero", february: "Febrero", feb: "Febrero", "2": "Febrero", "02": "Febrero",
    marzo: "Marzo", march: "Marzo", mar: "Marzo", "3": "Marzo", "03": "Marzo",
    abril: "Abril", april: "Abril", apr: "Abril", "4": "Abril", "04": "Abril",
    mayo: "Mayo", may: "Mayo", "5": "Mayo", "05": "Mayo",
    junio: "Junio", june: "Junio", jun: "Junio", "6": "Junio", "06": "Junio",
    julio: "Julio", july: "Julio", jul: "Julio", "7": "Julio", "07": "Julio",
    agosto: "Agosto", august: "Agosto", aug: "Agosto", "8": "Agosto", "08": "Agosto",
    septiembre: "Septiembre", september: "Septiembre", sep: "Septiembre", sept: "Septiembre", "9": "Septiembre", "09": "Septiembre",
    octubre: "Octubre", october: "Octubre", oct: "Octubre", "10": "Octubre",
    noviembre: "Noviembre", november: "Noviembre", nov: "Noviembre", "11": "Noviembre",
    diciembre: "Diciembre", december: "Diciembre", dec: "Diciembre", "12": "Diciembre",
  };
  return monthMap[s] ?? MESES_LIST[new Date().getMonth()];
}

export function toMetodoPago(raw: string): MetodoPago {
  const s = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  return s === "credito" ? "credito" : "efectivo";
}

export function toFrecuencia(raw: string): Frecuencia {
  const s = raw.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (s === "quincenal") return "quincenal";
  if (s === "unico" || s === "único") return "unico";
  return "mes";
}

export function toEstado(raw: string): Estado {
  const s = raw.trim().toLowerCase();
  if (s === "pagado") return "pagado";
  if (s === "guardado") return "guardado";
  if (s === "no guardado") return "no guardado";
  return "no pagado";
}

export function toFecha(raw: string): 0 | 15 | 30 {
  const n = parseInt(raw, 10);
  if (n === 15) return 15;
  if (n === 30) return 30;
  return 0;
}

export function parseCsv(csv: string): Expense[] {
  const lines = csv.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const results: Expense[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const [mesRaw = "", gastosRaw = "", , montoRaw = "", metodoPagoRaw = "", frecuenciaRaw = "", fechaRaw = "", fechaMaximaRaw = "", estadoRaw = ""] = cols;

    results.push({
      id: randomUUID(),
      mes: toMes(mesRaw),
      gastos: gastosRaw,
      monto: parseFloat(montoRaw.replace(/[^0-9.]/g, "")) || 0,
      metodoPago: toMetodoPago(metodoPagoRaw),
      frecuencia: toFrecuencia(frecuenciaRaw),
      fecha: toFecha(fechaRaw),
      fechaMaxima: fechaMaximaRaw,
      estado: toEstado(estadoRaw),
      selected: false,
    });
  }

  return results;
}

export function sheetsUrlToCsvUrl(shareUrl: string): string | null {
  const idMatch = shareUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  const gidMatch = shareUrl.match(/[?&#]gid=(\d+)/);

  if (!idMatch) return null;

  const id = idMatch[1];
  const gid = gidMatch ? gidMatch[1] : "0";
  return `https://docs.google.com/spreadsheets/d/${id}/export?format=csv&gid=${gid}`;
}
