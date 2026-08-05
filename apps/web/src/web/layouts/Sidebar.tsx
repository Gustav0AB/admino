import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/shared/hooks/useAuth";
import { navItems } from "../navItems";
import { routes } from "../routes";

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
          <span>Admino</span>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((current) => !current)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "var(--color-primary)",
            padding: "0.25rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        >
          <span aria-hidden>{isOpen ? "<" : ">"}</span>
        </button>
      </div>

      <div className="app-user">
        <div className="app-user-name">{user?.name}</div>
        <div className="app-user-role">{user?.role}</div>
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
              <span className="app-nav-caret">{openGroup === item.label ? "⌃" : "⌄"}</span>
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

      <button type="button" className="app-logout" onClick={signOut} title="Logout">
        <span className="app-nav-icon">L</span>
        <span className="app-nav-label">Logout</span>
      </button>
    </aside>
  );
}
