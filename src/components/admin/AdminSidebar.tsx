import { Link, NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  Store,
  Tag,
  ArrowUpRight,
  Settings,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    items: [
      { to: "/admin/stores", label: "Stores", icon: Store },
    ],
  },
  {
    section: "Platform",
    items: [
      { to: "/admin/settings", label: "Settings", icon: Settings },
    ],
  },
];

interface AdminSidebarProps {
  open?: boolean;
  onClose?: () => void;
}

const AdminSidebar = ({ open, onClose }: AdminSidebarProps) => {
  const location = useLocation();

  const navContent = (
    <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
      {NAV.map((group) => (
        <div key={group.section}>
          <p className="px-3 mb-1.5 text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            {group.section}
          </p>
          <div className="space-y-0.5">
            {group.items.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.to ||
                (item.to === "/admin/dashboard" &&
                  location.pathname === "/admin");
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors",
                    active
                      ? "bg-surface-muted text-foreground"
                      : "text-muted-foreground hover:bg-surface-muted hover:text-foreground",
                  )}
                >
                  <Icon className="size-4" />
                  {item.label}
                </NavLink>
              );
            })}
          </div>
        </div>
      ))}
    </nav>
  );

  return (
    <>
      <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r hairline bg-surface">
        <div className="p-5 border-b hairline">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-8 bg-foreground rounded-full flex items-center justify-center">
              <div className="size-3 bg-spectral rounded-full" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">QCK</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Admin Console
              </p>
            </div>
          </Link>
        </div>

        {navContent}

        <div className="p-3 border-t hairline space-y-1">
          <div className="px-3 py-2 rounded-xl bg-surface-muted/50 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              System status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="size-1.5 rounded-full bg-prism-5 animate-pulse-soft" />
              <span className="text-xs font-medium">All systems normal</span>
            </div>
          </div>
          <a
            href="https://qck.co"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
            qck.co
          </a>
          <Link
            to="/admin"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </Link>
        </div>
      </aside>

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-64 flex flex-col border-r hairline bg-surface transform transition-transform duration-200 ease-out lg:hidden",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between p-5 border-b hairline">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="size-8 bg-foreground rounded-full flex items-center justify-center">
              <div className="size-3 bg-spectral rounded-full" />
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight">QCK</p>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Admin Console
              </p>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="size-8 rounded-full border hairline bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close menu"
          >
            <X className="size-4" />
          </button>
        </div>

        {navContent}

        <div className="p-3 border-t hairline space-y-1">
          <div className="px-3 py-2 rounded-xl bg-surface-muted/50 mb-2">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              System status
            </p>
            <div className="flex items-center gap-2 mt-1">
              <span className="size-1.5 rounded-full bg-prism-5 animate-pulse-soft" />
              <span className="text-xs font-medium">All systems normal</span>
            </div>
          </div>
          <a
            href="https://qck.co"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <ArrowUpRight className="size-4" />
            qck.co
          </a>
          <Link
            to="/admin"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2 rounded-xl text-sm text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <LogOut className="size-4" />
            Sign out
          </Link>
        </div>
      </aside>
    </>
  );
};

export default AdminSidebar;
