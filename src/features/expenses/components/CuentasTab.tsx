import { useState } from "react";
import { AccountsTab } from "./AccountsTab";
import { CreditCardsTab } from "./CreditCardsTab";
import { LoansTab } from "./LoansTab";
import { SavingsTab } from "./SavingsTab";

const SUB_TABS = [
  { key: "cuentas", label: "Cuentas" },
  { key: "tarjetas", label: "Tarjetas" },
  { key: "prestamos", label: "Préstamos" },
  { key: "ahorro", label: "Ahorro" },
] as const;

type SubTab = (typeof SUB_TABS)[number]["key"];

export function CuentasTab() {
  const [active, setActive] = useState<SubTab>("cuentas");

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="tabs">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            className={`tab ${active === tab.key ? "tab-active" : ""}`}
            onClick={() => setActive(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {active === "cuentas" && <AccountsTab />}
      {active === "tarjetas" && <CreditCardsTab />}
      {active === "prestamos" && <LoansTab />}
      {active === "ahorro" && <SavingsTab />}
    </div>
  );
}
