import { useMemo, useState } from "react";
import { Search, Plus, MoreHorizontal, Mail } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { users, type UserRow } from "@/lib/adminMockData";

const PLANS = ["All plans", "Free", "Pro", "Enterprise"];
const STATUSES = ["All", "active", "trial", "suspended"];

const planTone: Record<UserRow["plan"], string> = {
  Free: "bg-surface-muted text-foreground",
  Pro: "bg-prism-1/10 text-prism-1 border-prism-1/20",
  Enterprise: "bg-prism-2/10 text-prism-2 border-prism-2/20",
};

const statusTone: Record<UserRow["status"], string> = {
  active: "bg-prism-5/10 text-prism-5 border-prism-5/20",
  trial: "bg-prism-4/10 text-prism-4 border-prism-4/20",
  suspended: "bg-prism-3/10 text-prism-3 border-prism-3/20",
};

const numberFmt = new Intl.NumberFormat("en-US");

const AdminUsers = () => {
  const [q, setQ] = useState("");
  const [plan, setPlan] = useState("All plans");
  const [status, setStatus] = useState("All");

  const filtered = useMemo(
    () =>
      users.filter((u) => {
        if (plan !== "All plans" && u.plan !== plan) return false;
        if (status !== "All" && u.status !== status) return false;
        if (q && !`${u.name} ${u.email}`.toLowerCase().includes(q.toLowerCase()))
          return false;
        return true;
      }),
    [q, plan, status],
  );

  return (
    <AdminShell
      eyebrow="Management"
      title="Users"
      actions={
        <Button variant="primary" size="sm">
          <Plus className="size-3.5" />
          Invite user
        </Button>
      }
    >
      <section className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Stat label="Total users" value={numberFmt.format(8421)} accent="prism-1" />
        <Stat label="Active" value={numberFmt.format(7129)} accent="prism-5" />
        <Stat label="On trial" value={numberFmt.format(914)} accent="prism-4" />
        <Stat label="Suspended" value={numberFmt.format(78)} accent="prism-3" />
      </section>

      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name or email…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-0 p-0"
          />
        </div>
        <SelectPill label="Plan" value={plan} options={PLANS} onChange={setPlan} />
        <SelectPill label="Status" value={status} options={STATUSES} onChange={setStatus} />
      </section>

      <section className="rounded-3xl bg-surface border hairline overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                <th className="text-left py-3.5 px-5 font-normal">User</th>
                <th className="text-left py-3.5 px-5 font-normal">Plan</th>
                <th className="text-right py-3.5 px-5 font-normal">Stores</th>
                <th className="text-right py-3.5 px-5 font-normal">Queries</th>
                <th className="text-left py-3.5 px-5 font-normal">Status</th>
                <th className="text-left py-3.5 px-5 font-normal">Joined</th>
                <th className="px-5" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  className="border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-3">
                      <div className="size-9 rounded-full bg-foreground text-background flex items-center justify-center text-[11px] font-mono font-semibold shrink-0">
                        {u.name.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={cn(
                        "inline-flex px-2 py-0.5 rounded-full text-[11px] font-medium border hairline",
                        planTone[u.plan],
                      )}
                    >
                      {u.plan}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-right font-mono tabular-nums">{u.stores}</td>
                  <td className="py-3.5 px-5 text-right font-mono tabular-nums">
                    {numberFmt.format(u.queries)}
                  </td>
                  <td className="py-3.5 px-5">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border hairline capitalize",
                        statusTone[u.status],
                      )}
                    >
                      <span className="size-1.5 rounded-full bg-current" />
                      {u.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-5 text-muted-foreground text-xs">{u.joined}</td>
                  <td className="py-3.5 px-5 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button
                        className="size-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        aria-label="Email"
                      >
                        <Mail className="size-3.5" />
                      </button>
                      <button
                        className="size-8 rounded-full hover:bg-surface-muted text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center"
                        aria-label="More"
                      >
                        <MoreHorizontal className="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                    No users match your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
};

const Stat = ({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "prism-1" | "prism-3" | "prism-4" | "prism-5";
}) => (
  <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
    <div
      aria-hidden
      className="absolute top-0 right-0 size-24 rounded-full blur-3xl opacity-20 pointer-events-none"
      style={{ background: `hsl(var(--${accent}))` }}
    />
    <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p className="text-2xl font-semibold tabular-nums tracking-tight mt-1.5">
      {value}
    </p>
  </div>
);

const SelectPill = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) => (
  <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border hairline bg-surface hover:bg-surface-muted/50 transition-colors cursor-pointer">
    <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </span>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 cursor-pointer capitalize"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
);

export default AdminUsers;
