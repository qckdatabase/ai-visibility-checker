import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Store,
  Tag,
  Settings,
  LogOut,
  Menu,
  X,
} from "lucide-react";
import styles from "./admin-sidebar.module.css";

const NAV: Array<{
  section: string;
  items: Array<{ to: string; label: string; icon: typeof LayoutDashboard }>;
}> = [
  {
    section: "Monitoring",
    items: [
      { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
      { to: "/admin/queries", label: "Queries", icon: Search },
      { to: "/admin/keywords", label: "Keywords", icon: Tag },
    ],
  },
  {
    section: "Catalog",
    items: [{ to: "/admin/stores", label: "Stores", icon: Store }],
  },
  {
    section: "Platform",
    items: [{ to: "/admin/settings", label: "Settings", icon: Settings }],
  },
];

const AdminSidebar = () => {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <header className={styles.mobileBar}>
        <button
          className={styles.menuButton}
          onClick={() => setOpen(true)}
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <div className={styles.mobileBrand}>
          <span className={styles.brandWrap}>
            <span className={styles.logoMark}>
              <img src="/qck-light-logo.png" alt="QCK" />
            </span>
          </span>
          <span className={styles.tag}>Admin</span>
        </div>
      </header>

      {open && (
        <div
          className={styles.backdrop}
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside className={`${styles.sidebar} ${open ? styles.open : ""}`}>
        <div className={styles.header}>
          <div className={styles.brand}>
            <div className={styles.brandWrap}>
              <span className={styles.logoMark}>
                <img src="/qck-light-logo.png" alt="QCK" />
              </span>
            </div>
            <span className={styles.tag}>Admin</span>
            <button
              className={styles.closeButton}
              onClick={() => setOpen(false)}
              aria-label="Close menu"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <div className={styles.navLabel}>Manage</div>
        <nav className={styles.nav}>
          {NAV.map((group) =>
            group.items.map((item) => {
              const Icon = item.icon;
              const isActive =
                location.pathname === item.to ||
                (item.to === "/admin/dashboard" &&
                  location.pathname === "/admin");
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={`${styles.navItem} ${
                    isActive ? styles.active : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <Icon size={18} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })
          )}
        </nav>

        <div className={styles.footer}>
          <div className={styles.userPill} title="admin@qck.co">
            <span className={styles.userDot} aria-hidden />
            <span className={styles.userEmail}>admin@qck.co</span>
          </div>
          <Link to="/admin" className={styles.logout}>
            <LogOut size={18} />
            <span>Logout</span>
          </Link>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;