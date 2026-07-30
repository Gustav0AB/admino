import { useRef, useState } from "react";
import { FeatureShell } from "@/shared/components/shell/FeatureShell";
import { StaffContent } from "@/features/org-members";
import { AtletasContent } from "@/features/client-settings/EndUsersScreen";

type Tab = "staff" | "atletas";

export function MembersScreen() {
  const [tab, setTab] = useState<Tab>("staff");
  const openStaffCreate = useRef<() => void>(() => {});
  const openAtletaCreate = useRef<() => void>(() => {});

  return (
    <FeatureShell
      title="Miembros"
      tabs={[
        { key: "staff", label: "Staff" },
        { key: "atletas", label: "Atletas" },
      ]}
      activeTab={tab}
      onTabChange={(key) => setTab(key as Tab)}
      saveActions={[{
        label: tab === "staff" ? "Agregar usuario" : "Agregar miembro",
        type: "primary",
        onClick: () => (tab === "staff" ? openStaffCreate.current() : openAtletaCreate.current()),
      }]}
    >
      {tab === "staff" ? (
        <StaffContent onReady={(fn) => { openStaffCreate.current = fn; }} />
      ) : (
        <AtletasContent onReady={(fn) => { openAtletaCreate.current = fn; }} />
      )}
    </FeatureShell>
  );
}
