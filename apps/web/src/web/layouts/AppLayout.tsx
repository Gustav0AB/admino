import { Outlet } from "react-router-dom";
import { SessionGuardModal } from "@/shared/components/feedback/SessionGuardModal";
import { Sidebar } from "./Sidebar";

export function AppLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <Outlet />
        <SessionGuardModal />
      </main>
    </div>
  );
}
