import React from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi } from "@/lib/api/admin";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { ArrowUpRight } from "lucide-react";
import { cn } from "@/lib/utils";

const numberFmt = new Intl.NumberFormat("en-US");

const Legend = ({ dotColor, label }: { dotColor: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
    <span className="size-2 rounded-full" style={{ background: dotColor }} />
    {label}
  </span>
);

const AdminDashboard: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery(
    ["admin-dashboard"],
    () => adminApi.dashboard(),
    { staleTime: 60 * 1000 },
  );

  if (isLoading) {
    return (
      <AdminShell eyebrow="Operator console" title="Overview">
        <div className="flex items-center justify-center py-32 text-sm text-muted-foreground">
          Loading…
        </div>
      </AdminShell>
    );
  }

  if (isError) {
    return (
      <AdminShell eyebrow="Operator console" title="Overview">
        <div className="flex items-center justify-center py-32 text-sm text-red-600">
          Error: {(error as any)?.message ?? "Failed to load dashboard"}
        </div>
      </AdminShell>
    );
  }

  const stats = data!;
  const cachePct = Math.round((stats.cacheHitRate ?? 0) * 100);

  return (
    <AdminShell
      eyebrow="Operator console"
      title="Overview"
      actions={<Button variant="outline" size="sm">Last 7 days</Button>}
    >
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Queries"
          value={numberFmt.format(stats.totalQueries)}
          delta={null}
          accent="prism-1"
          hint="all time"
        />
        <StatCard
          label="Unique Keywords"
          value={numberFmt.format(stats.uniqueKeywords)}
          delta={null}
          accent="prism-2"
          hint="tracked"
        />
        <StatCard
          label="Unique Stores"
          value={numberFmt.format(stats.uniqueStores)}
          delta={null}
          accent="prism-3"
          hint="audited"
        />
        <StatCard
          label="Cache Hit Rate"
          value={`${cachePct}%`}
          delta={null}
          accent="prism-4"
          hint="responses"
        />
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 p-6 rounded-3xl bg-surface border hairline">
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Activity
              </p>
              <h2 className="text-lg font-semibold tracking-tight">
                Queries over time
              </h2>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <Legend dotColor="hsl(var(--prism-1))" label="Queries" />
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={stats.queriesOverTime}
                margin={{ top: 10, right: 8, bottom: 0, left: -20 }}
              >
                <defs>
                  <linearGradient id="qFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--prism-1))" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="hsl(var(--prism-1))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="day"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--surface))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 12,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stroke="hsl(var(--prism-1))"
                  strokeWidth={2}
                  fill="url(#qFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface border hairline">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Categories
          </p>
          <h2 className="text-lg font-semibold tracking-tight mb-6">
            Top categories
          </h2>
          <ul className="space-y-4">
            {stats.topCategories.slice(0, 6).map((c, i) => (
              <li key={c.category}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-sm font-medium truncate mr-2">{c.category}</span>
                  <span className="text-xs font-mono tabular-nums text-muted-foreground shrink-0">
                    {c.count}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.round((c.count / (stats.topCategories[0]?.count ?? 1)) * 100)}%`,
                      background: `hsl(var(--prism-${(i % 4) + 1}))`,
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="p-6 rounded-3xl bg-surface border hairline">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Keywords
              </p>
              <h2 className="text-lg font-semibold tracking-tight">Top keywords</h2>
            </div>
          </div>
          <ul className="space-y-3">
            {stats.topKeywords.slice(0, 8).map((kw, i) => (
              <li
                key={kw.keyword}
                className="flex items-center justify-between py-2 border-b hairline last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium">{kw.keyword}</span>
                </div>
                <span className="text-xs font-mono tabular-nums text-muted-foreground">
                  {numberFmt.format(kw.count)}
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div className="p-6 rounded-3xl bg-surface border hairline">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                Stores
              </p>
              <h2 className="text-lg font-semibold tracking-tight">Top stores</h2>
            </div>
          </div>
          <ul className="space-y-3">
            {stats.topStores.slice(0, 8).map((s, i) => (
              <li
                key={s.store}
                className="flex items-center justify-between py-2 border-b hairline last:border-0"
              >
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-mono text-muted-foreground w-4">{i + 1}</span>
                  <span className="text-sm font-medium truncate mr-2">{s.store}</span>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  {s.avgRank != null && (
                    <span className="text-xs font-mono tabular-nums text-muted-foreground">
                      #{s.avgRank}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {numberFmt.format(s.queryCount)} queries
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </AdminShell>
  );
};

export default AdminDashboard;
