import { useEffect, useMemo, useState } from "react";
import { LogOut, Menu } from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { navItems } from "../navItems";
import { routes } from "../routes";

const ROLE_LABELS = {
  SYSTEM_ADMIN: "Administrador del sistema",
  OWNER: "Propietario",
  ADMIN: "Administrador",
  MEMBER: "Miembro",
} as const;

export function Sidebar() {
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(true);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const visibleItems = useMemo(
    () => navItems.filter((item) => user && item.roles.includes(user.role)),
    [user]
  );
  const activeGroup = visibleItems.find((item) => item.children?.some((child) => child.to === pathname));
  const activeGroupLabel = activeGroup?.label;

  useEffect(() => {
    if (activeGroupLabel) setOpenGroup(activeGroupLabel);
  }, [activeGroupLabel]);

  function signOut() {
    logout();
    navigate(routes.login, { replace: true });
  }

  function toggleGroup(label: string) {
    if (!isOpen) setIsOpen(true);
    setOpenGroup((current) => current === label ? null : label);
  }

  return (
    <aside className={`app-sidebar ${!isOpen ? "collapsed" : ""}`}>
      <div className="app-brand">
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span className="app-brand-mark">A</span>
          <span className="app-brand-name">Admino</span>
        </div>
        <button
          type="button"
          className="app-sidebar-toggle"
          onClick={() => setIsOpen((current) => !current)}
          aria-label={isOpen ? "Contraer menú" : "Expandir menú"}
          title={isOpen ? "Contraer menú" : "Expandir menú"}
        >
          <Menu />
        </button>
      </div>

      <div className="app-user">
        <div className="app-user-name">{user?.name}</div>
        <div className="app-user-role">{user ? ROLE_LABELS[user.role] : ""}</div>
      </div>

      <nav className="app-nav">
        {visibleItems.map((item) => item.children ? (
          <div key={item.label} className="app-nav-group">
            <button
              type="button"
              className={`app-nav-item app-nav-group-button ${activeGroupLabel === item.label ? "app-nav-item-active" : ""}`}
              onClick={() => toggleGroup(item.label)}
              title={item.label}
            >
              <span className="app-nav-icon">{item.icon}</span>
              <span className="app-nav-label">{item.label}</span>
              <span className={`app-nav-caret ${openGroup === item.label ? "open" : ""}`} aria-hidden="true" />
            </button>
            {openGroup === item.label && (
              <div className="app-nav-children">
                {item.children.map((child) => (
                  <NavLink
                    key={child.to}
                    to={child.to}
                    end
                    className={({ isActive }) => `app-nav-item app-nav-subitem ${isActive ? "app-nav-item-active" : ""}`}
                  >
                    {child.label}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ) : (
          <NavLink
            key={item.to}
            to={item.to ?? routes.dashboard}
            className={({ isActive }) => `app-nav-item ${isActive ? "app-nav-item-active" : ""}`}
            title={item.label}
          >
            <span className="app-nav-icon">{item.icon}</span>
            <span className="app-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <button type="button" className="app-logout" onClick={signOut} title="Cerrar sesión">
        <span className="app-nav-icon"><LogOut /></span>
        <span className="app-nav-label">Cerrar sesión</span>
      </button>
    </aside>
  );
}
