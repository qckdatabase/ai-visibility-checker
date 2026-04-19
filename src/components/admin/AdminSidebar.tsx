import { Link, NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, Search, BarChart3, ArrowUpRight, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/admin/dashboard", label: "Overview", icon: LayoutDashboard },
  { to: "/admin/queries", label: "Queries", icon: Search },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/settings", label: "Settings", icon: Settings },
];

const AdminSidebar = () => {
  const location = useLocation();
  return (
    <aside className="hidden lg:flex w-60 shrink-0 flex-col border-r hairline bg-surface">
      <div className="p-5 border-b hairline">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="size-8 bg-foreground rounded-full flex items-center justify-center">
            <div className="size-3 bg-spectral rounded-full" />
          </div>
          <div className="leading-tight">
            <p className="text-sm font-semibold tracking-tight">QCK</p>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Console
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const active =
            location.pathname === item.to ||
            (item.to === "/admin/dashboard" && location.pathname === "/admin");
          return (
            <NavLink
              key={item.to}
              to={item.to}
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
      </nav>

      <div className="p-3 border-t hairline space-y-1">
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
  );
};

export default AdminSidebar;
