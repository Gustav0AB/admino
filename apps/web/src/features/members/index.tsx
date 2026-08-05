import { useRef, useState } from "react";
import { Button } from "@/shared/ui";
import { StaffContent } from "@/features/org-members";
import { AtletasContent } from "@/features/client-settings/EndUsersScreen";

type Tab = "staff" | "atletas";

const tabs: { key: Tab; label: string }[] = [
  { key: "staff", label: "Equipo" },
  { key: "atletas", label: "Atletas" },
];

export function MembersScreen() {
  const [tab, setTab] = useState<Tab>("staff");
  const openStaffCreate = useRef<() => void>(() => {});
  const openAtletaCreate = useRef<() => void>(() => {});

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 bg-gray-50 p-6">
      <header className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Miembros</h1>
        <Button size="sm" onClick={() => (tab === "staff" ? openStaffCreate.current() : openAtletaCreate.current())}>
          {tab === "staff" ? "Agregar usuario" : "Agregar miembro"}
        </Button>
      </header>

      <div className="tabs">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`tab ${tab === item.key ? "tab-active" : ""}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="tab-content">
        {tab === "staff" ? (
          <StaffContent onReady={(fn) => { openStaffCreate.current = fn; }} />
        ) : (
          <AtletasContent onReady={(fn) => { openAtletaCreate.current = fn; }} />
        )}
      </div>
    </div>
  );
}
