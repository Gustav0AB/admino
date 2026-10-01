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
    <div className="page feature-page">
      <header className="feature-header">
        <h1 className="page-title">Miembros</h1>
        <Button
          size="sm"
          onClick={() =>
            tab === "staff"
              ? openStaffCreate.current()
              : openAtletaCreate.current()
          }
        >
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
          <StaffContent
            onReady={(fn) => {
              openStaffCreate.current = fn;
            }}
          />
        ) : (
          <AtletasContent
            onReady={(fn) => {
              openAtletaCreate.current = fn;
            }}
          />
        )}
      </div>
    </div>
  );
}
