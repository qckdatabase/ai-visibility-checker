import { ReactNode, useState } from "react";
import { Menu, X, Bell } from "lucide-react";
import AdminSidebar from "./AdminSidebar";

interface AdminShellProps {
  eyebrow: string;
  title: string;
  actions?: ReactNode;
  children: ReactNode;
}

const AdminShell = ({ eyebrow, title, actions, children }: AdminShellProps) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-dvh flex bg-background">
      <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        <header className="flex items-center justify-between px-4 md:px-6 lg:px-10 py-4 md:py-5 border-b hairline bg-surface/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden size-9 rounded-full border hairline bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Open menu"
            >
              <Menu className="size-4" />
            </button>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                {eyebrow}
              </p>
              <h1 className="text-lg md:text-xl font-semibold tracking-tight">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {actions}
            <button
              className="size-9 rounded-full border hairline bg-surface flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Notifications"
            >
              <Bell className="size-4" />
            </button>
            <div className="size-9 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-mono font-semibold">
              QA
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 lg:p-10 space-y-8 animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminShell;
