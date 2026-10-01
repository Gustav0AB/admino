import { describe, expect, it } from "vitest";
import { daysUntil, formatSpanishDate, parseCellText, randomPhrase, todayIso } from "@features/athlete-tracker/parseWorkout";
import { buildPlanHtml, buildRepeatedCells, calcTotalWeeks, getWeeksForRange, weeksToNextEvent } from "@features/athlete-dashboard/calendar/PlanCalendar/calendarUtils";
import { buildAppData, formatMXN, getAccountBalance, getAvailableAños, getAvailableMeses, getBillingCycleStatus, getBillingPeriodCharges, getBillingPeriodLabel, getCreditCycleInfo, getCreditHistory, getCurrentCreditBalance, getFilteredExpenses, getIntervalDaysInMonth, getIntervalMonthDay, getMSIPendingForCard, isCardPayment } from "@features/expenses/helpers";

const expense = (patch: Record<string, unknown> = {}) => ({
  id: "e1", mes: "Enero", año: 2026, gastos: "Comida", monto: 100,
  metodoPago: "efectivo", frecuencia: "mes", fecha: 10, estado: "pagado", selected: true, ...patch,
}) as never;

describe("workout parser", () => {
  it("parses exercises, running intervals and notes", () => {
    expect(parseCellText("Fuerza\nSentadilla 4x8\nTrote 2x4 40min\nNota: hidratarse")).toEqual({
      title: "Fuerza", exercises: ["Sentadilla 4x8"],
      trote: { raw: "Trote 2x4 40min", workMin: 2, restMin: 4, totalMin: 40 }, nota: "hidratarse",
    });
    expect(parseCellText(" ").exercises).toEqual([]);
    expect(parseCellText("Cardio\ntrote raro").trote?.totalMin).toBe(0);
  });

  it("formats dates", () => expect(formatSpanishDate("2026-03-05")).toBe("5 de marzo"));
  it("provides date and phrase helpers", () => {
    expect(todayIso()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(daysUntil("2099-01-01")).toBeGreaterThan(0);
    expect(MOTIVATIONAL_PHRASE_CHECK()).toBeTruthy();
  });
});

function MOTIVATIONAL_PHRASE_CHECK() { return randomPhrase(); }

describe("calendar", () => {
  it("builds complete Monday-Sunday weeks and calculates duration", () => {
    const weeks = getWeeksForRange("2026-06-03", "2026-06-14");
    expect(weeks).toHaveLength(2);
    expect(weeks[0]?.days[0]).toBe("2026-06-01");
    expect(calcTotalWeeks("2026-06-01", "2026-06-15")).toBe(2);
    expect(weeksToNextEvent([{ date: "2026-06-15", id: "x", name: "Race", type: "competition" }], new Date("2026-06-01T00:00:00"))).toBe(2);
    expect(weeksToNextEvent([])).toBeNull();
  });

  it("renders plan HTML with cells and events", () => {
    const weeks = getWeeksForRange("2026-06-01", "2026-06-07");
    const html = buildPlanHtml({ id: "p", name: "Plan", startDate: "2026-06-01", endDate: "2026-06-07", cells: { "2026-06-01": "Fuerza\n5x5" } }, weeks, [{ id: "e", name: "Carrera", date: "2026-06-01", type: "competition" }]);
    expect(html).toContain("Plan");
    expect(html).toContain("Carrera");
    expect(html).toContain("Fuerza<br/>5x5");
  });

  it("skips rest days while repeating a pattern", () => {
    expect(buildRepeatedCells(["Fuerza", null, "Cardio"], "2026-06-01", "2026-06-06")).toEqual({
      "2026-06-01": "Fuerza",
      "2026-06-03": "Cardio",
      "2026-06-04": "Fuerza",
      "2026-06-06": "Cardio",
    });
  });
});

describe("finance helpers", () => {
  it("filters expenses and computes balances", () => {
    const expenses = [expense(), expense({ id: "e2", fecha: 20, category: "transporte", monto: 25, estado: "no pagado" })];
    expect(getFilteredExpenses(expenses, "Enero", "mes", 15)).toHaveLength(1);
    expect(getFilteredExpenses(expenses, "Enero", "mes", 30, 2026, "transporte")).toHaveLength(1);
    expect(getAccountBalance({ id: "a", initialBalance: 100 } as never, [expense({ accountId: "a", monto: 20 })], [{ accountId: "a", monto: 50, estado: "recibido" }] as never)).toBe(130);
  });

  it("computes credit history, cycles and billing periods", () => {
    const entries = [expense({ id: "charge", mes: "Enero", metodoPago: "credito", monto: 300 }), expense({ id: "payment", mes: "Febrero", gastos: " tarjeta de credito ", monto: 100 })];
    expect(getCreditHistory(entries, 50, "Enero").map((e) => e.balance)).toEqual([350, 250]);
    expect(getBillingPeriodCharges([expense({ creditCardId: "c", metodoPago: "credito", mes: "Enero", fecha: 20 }), expense({ creditCardId: "c", metodoPago: "credito", mes: "Febrero", fecha: 2 })], "c", "Febrero", 15, 2026)).toHaveLength(2);
    expect(getMSIPendingForCard([{ creditCardId: "c", status: "active", monthlyAmount: 10, totalMonths: 6, paidMonths: 2 }] as never, "c")).toEqual({ count: 1, monthlyTotal: 10, totalPending: 40 });
  });

  it("handles recurring intervals and invalid values", () => {
    expect(getIntervalDaysInMonth("2026-01-01", 7, 2026, 0)).toEqual([1, 8, 15, 22, 29]);
    expect(getIntervalDaysInMonth("2026-01-01", 0, 2026, 0)).toEqual([]);
    expect(getIntervalMonthDay("2026-01-15", 2, 2026, 2)).toBe(15);
    expect(getIntervalMonthDay("2026-01-15", 2, 2026, 1)).toBeNull();
  });

  it("covers card periods, summaries and serialization", () => {
    const expenses = [expense({ mes: "Enero", fecha: 20, metodoPago: "credito", creditCardId: "c", monto: 25 }), expense({ mes: "Febrero", fecha: 2, gastos: "tarjeta de credito", creditCardId: "c", monto: 10 })];
    expect(isCardPayment({ gastos: " Tarjeta de Credito " })).toBe(true);
    expect(getCurrentCreditBalance([], 20)).toBe(20);
    expect(getBillingPeriodCharges(expenses, "c", "Febrero", 0, 2026)).toHaveLength(0);
    expect(getBillingPeriodCharges(expenses, "c", "No existe", 15, 2026)).toEqual([]);
    expect(getBillingPeriodLabel("Febrero", 15)).toBe("Ene 16 – Feb 15");
    expect(getBillingPeriodLabel("Febrero", 0)).toBe("Febrero");
    expect(formatMXN(1234.5)).toContain("1,234.50");
    expect(getAvailableMeses(expenses)).toEqual(["Enero", "Febrero"]);
    expect(getAvailableAños(expenses)).toEqual([2026]);
    expect(getBillingCycleStatus("No existe", 15)).toBe("no_en_curso");
    expect(getCreditCycleInfo(expenses, 50, 15, 20, "c", "Enero", 2026).totalPayments).toBe(10);
    expect(buildAppData([], 0, "Enero", 15, 20, [{ id: "c" }] as never, [{ id: "r" }] as never, {} as never, ["Enero-2026"])).toMatchObject({ creditCards: [{ id: "c" }], activatedMonths: ["Enero-2026"] });
  });
});
