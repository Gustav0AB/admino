import { useEffect, useMemo, useState } from "react";
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

  useEffect(() => {
    const activeGroup = visibleItems.find((item) => item.children?.some((child) => child.to === pathname));
    if (activeGroup) setOpenGroup(activeGroup.label);
  }, [pathname, visibleItems]);

  function signOut() {
    logout();
    navigate(routes.login, { replace: true });
  }

  return (
    <aside className={`app-sidebar ${!isOpen ? "collapsed" : ""}`}>
      <div className="app-brand" style={{ justifyContent: "space-between" }}>
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
          <MenuIcon />
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
              className={`app-nav-item app-nav-group-button ${openGroup === item.label ? "app-nav-item-active" : ""}`}
              onClick={() => setOpenGroup((current) => current === item.label ? null : item.label)}
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
        <span className="app-nav-icon"><LogoutIcon /></span>
        <span className="app-nav-label">Cerrar sesión</span>
      </button>
    </aside>
  );
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M10 5H5v14h5M14 8l4 4-4 4M8 12h10" />
    </svg>
  );
}
