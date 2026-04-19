import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminShell from "@/components/admin/AdminShell";
import StatCard from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import {
  categoryBreakdown,
  funnel,
  modelPerformance,
  visibilityTrend,
} from "@/lib/adminMockData";

const numberFmt = new Intl.NumberFormat("en-US");
const PRISM_COLORS = [
  "hsl(var(--prism-1))",
  "hsl(var(--prism-2))",
  "hsl(var(--prism-3))",
  "hsl(var(--prism-4))",
  "hsl(var(--prism-5))",
  "hsl(var(--muted-foreground))",
];

const tooltipStyle = {
  background: "hsl(var(--surface))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 12,
  fontSize: 12,
};

const AdminAnalytics = () => {
  const funnelMax = funnel[0].value;

  return (
    <AdminShell
      eyebrow="Insights"
      title="Analytics"
      actions={
        <>
          <Button variant="outline" size="sm">Last 30 days</Button>
          <Button variant="primary" size="sm">Generate report</Button>
        </>
      }
    >
      {/* Headline stats */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Visibility Score" value="47" delta={6.2} accent="prism-1" hint="this week" />
        <StatCard label="Avg Citation Rank" value="4.6" delta={-3.4} accent="prism-2" hint="lower is better" />
        <StatCard label="Click → qck.co" value={numberFmt.format(3514)} delta={9.8} accent="prism-3" hint="conversions" />
        <StatCard label="Coverage" value="68%" delta={2.1} accent="prism-4" hint="of indexed queries" />
      </section>

      {/* Visibility trend + Category mix */}
      <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 p-6 rounded-3xl bg-surface border hairline">
          <div className="mb-6">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Trajectory
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Visibility Score · 8 weeks
            </h2>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={visibilityTrend} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} domain={[20, 60]} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="hsl(var(--prism-2))"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: "hsl(var(--prism-2))" }}
                  activeDot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="p-6 rounded-3xl bg-surface border hairline">
          <div className="mb-4">
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Mix
            </p>
            <h2 className="text-lg font-semibold tracking-tight">Category split</h2>
          </div>
          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryBreakdown}
                  dataKey="value"
                  nameKey="category"
                  innerRadius={42}
                  outerRadius={70}
                  strokeWidth={0}
                >
                  {categoryBreakdown.map((_, i) => (
                    <Cell key={i} fill={PRISM_COLORS[i % PRISM_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="mt-4 space-y-2">
            {categoryBreakdown.map((c, i) => (
              <li key={c.category} className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-muted-foreground">
                  <span
                    className="size-2 rounded-full"
                    style={{ background: PRISM_COLORS[i % PRISM_COLORS.length] }}
                  />
                  {c.category}
                </span>
                <span className="font-mono tabular-nums">{c.value}%</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Model performance */}
      <section className="p-6 rounded-3xl bg-surface border hairline">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Performance
            </p>
            <h2 className="text-lg font-semibold tracking-tight">
              Queries by model
            </h2>
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={modelPerformance} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
              <CartesianGrid strokeDasharray="3 6" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="model" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "hsl(var(--surface-muted))" }} />
              <Bar dataKey="queries" radius={[8, 8, 0, 0]}>
                {modelPerformance.map((_, i) => (
                  <Cell key={i} fill={PRISM_COLORS[i % PRISM_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {modelPerformance.map((m, i) => (
            <div key={m.model} className="p-4 rounded-2xl border hairline bg-surface-muted/40">
              <div className="flex items-center gap-2 mb-2">
                <span
                  className="size-2 rounded-full"
                  style={{ background: PRISM_COLORS[i % PRISM_COLORS.length] }}
                />
                <span className="text-sm font-semibold">{m.model}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <Metric label="Vol" value={numberFmt.format(m.queries)} />
                <Metric label="Rank" value={m.avgRank.toFixed(1)} />
                <Metric label="CTR" value={`${m.ctr}%`} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Funnel */}
      <section className="p-6 rounded-3xl bg-surface border hairline">
        <div className="mb-6">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
            Conversion
          </p>
          <h2 className="text-lg font-semibold tracking-tight">
            Query → Click funnel
          </h2>
        </div>
        <div className="space-y-3">
          {funnel.map((s, i) => {
            const pct = Math.round((s.value / funnelMax) * 100);
            return (
              <div key={s.stage}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <span className="text-sm font-medium">{s.stage}</span>
                  <span className="text-xs text-muted-foreground">
                    <span className="font-mono tabular-nums text-foreground">
                      {numberFmt.format(s.value)}
                    </span>{" "}
                    · {pct}%
                  </span>
                </div>
                <div className="h-3 rounded-full bg-surface-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      background: PRISM_COLORS[i % PRISM_COLORS.length],
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </AdminShell>
  );
};

const Metric = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
      {label}
    </p>
    <p className="font-mono tabular-nums font-semibold">{value}</p>
  </div>
);

export default AdminAnalytics;
