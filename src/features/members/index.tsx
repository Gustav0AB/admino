import { useRef, useState } from "react";
import { Button } from "@generic/components";
import { StaffContent } from "@/features/org-members";
import { AtletasContent } from "@/features/client-settings/EndUsersScreen";

type Tab = "staff" | "atletas";

const tabs: { key: Tab; label: string }[] = [
  { key: "staff", label: "Staff" },
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

      <div className="flex gap-2 border-b border-gray-200">
        {tabs.map((item) => (
          <button
            key={item.key}
            className={`border-b-2 px-3 py-2 text-sm font-medium ${tab === item.key ? "border-primary text-primary" : "border-transparent text-gray-500"}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        {tab === "staff" ? (
          <StaffContent onReady={(fn) => { openStaffCreate.current = fn; }} />
        ) : (
          <AtletasContent onReady={(fn) => { openAtletaCreate.current = fn; }} />
        )}
      </div>
    </div>
  );
}
