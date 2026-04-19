import { ArrowUpRight, Bell } from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatCard from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import {
  dashboardStats,
  modelDistribution,
  queriesOverTime,
  topQuestions,
} from "@/lib/mockData";

const numberFmt = new Intl.NumberFormat("en-US");

const AdminDashboard = () => {
  return (
    <div className="min-h-dvh flex bg-background">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 lg:px-10 py-5 border-b hairline bg-surface/80 backdrop-blur-md sticky top-0 z-20">
          <div>
            <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
              Operator console
            </p>
            <h1 className="text-xl font-semibold tracking-tight">Overview</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              Last 7 days
            </Button>
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

        <main className="flex-1 p-6 lg:p-10 space-y-8 animate-fade-in">
          {/* Stats */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Queries"
              value={numberFmt.format(dashboardStats.totalQueries)}
              delta={12.4}
              accent="prism-1"
              hint="vs last week"
            />
            <StatCard
              label="Stores Audited"
              value={numberFmt.format(dashboardStats.storesAudited)}
              delta={8.1}
              accent="prism-2"
              hint="vs last week"
            />
            <StatCard
              label="Avg Visibility Score"
              value={`${dashboardStats.avgVisibilityScore}`}
              delta={-2.3}
              accent="prism-3"
              hint="across audits"
            />
            <StatCard
              label="QCK.co CTR"
              value={`${dashboardStats.qckClickThrough}%`}
              delta={4.6}
              accent="prism-4"
              hint="from results CTA"
            />
          </section>

          {/* Chart + Model split */}
          <section className="grid grid-cols-1 xl:grid-cols-3 gap-5">
            <div className="xl:col-span-2 p-6 rounded-3xl bg-surface border hairline">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                    Activity
                  </p>
                  <h2 className="text-lg font-semibold tracking-tight">
                    Queries vs Outbound Clicks
                  </h2>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <Legend dotColor="hsl(var(--prism-1))" label="Queries" />
                  <Legend dotColor="hsl(var(--prism-3))" label="Clicks" />
                </div>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={queriesOverTime} margin={{ top: 10, right: 8, bottom: 0, left: -20 }}>
                    <defs>
                      <linearGradient id="qFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--prism-1))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--prism-1))" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="cFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--prism-3))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--prism-3))" stopOpacity={0} />
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
                    <Area
                      type="monotone"
                      dataKey="clicks"
                      stroke="hsl(var(--prism-3))"
                      strokeWidth={2}
                      fill="url(#cFill)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="p-6 rounded-3xl bg-surface border hairline">
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                AI Model Mix
              </p>
              <h2 className="text-lg font-semibold tracking-tight mb-6">
                Where queries land
              </h2>
              <ul className="space-y-4">
                {modelDistribution.map((m, i) => (
                  <li key={m.model}>
                    <div className="flex justify-between items-baseline mb-1.5">
                      <span className="text-sm font-medium">{m.model}</span>
                      <span className="text-xs font-mono tabular-nums text-muted-foreground">
                        {m.share}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-surface-muted overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${m.share}%`,
                          background: `hsl(var(--prism-${(i % 4) + 1}))`,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* Top questions */}
          <section className="p-6 rounded-3xl bg-surface border hairline">
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  Industry Pulse
                </p>
                <h2 className="text-lg font-semibold tracking-tight">
                  Most asked questions
                </h2>
              </div>
              <Button variant="ghost" size="sm">
                Export CSV
                <ArrowUpRight className="size-3.5" />
              </Button>
            </div>

            <div className="overflow-x-auto -mx-6 px-6">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline">
                    <th className="text-left py-3 font-normal">Question</th>
                    <th className="text-left py-3 font-normal">Category</th>
                    <th className="text-right py-3 font-normal">Volume</th>
                    <th className="text-right py-3 font-normal">Share</th>
                  </tr>
                </thead>
                <tbody>
                  {topQuestions.map((q) => {
                    const max = topQuestions[0].count;
                    const share = Math.round((q.count / max) * 100);
                    return (
                      <tr key={q.question} className="border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors">
                        <td className="py-3.5 font-medium">{q.question}</td>
                        <td className="py-3.5">
                          <span className="inline-flex px-2 py-0.5 rounded-full text-[11px] bg-surface-muted text-muted-foreground">
                            {q.category}
                          </span>
                        </td>
                        <td className="py-3.5 text-right font-mono tabular-nums">
                          {numberFmt.format(q.count)}
                        </td>
                        <td className="py-3.5 text-right">
                          <div className="inline-flex items-center gap-2 justify-end w-32">
                            <div className="flex-1 h-1 bg-surface-muted rounded-full overflow-hidden">
                              <div
                                className="h-full bg-spectral"
                                style={{ width: `${share}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-mono tabular-nums text-muted-foreground w-8 text-right">
                              {share}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

const Legend = ({ dotColor, label }: { dotColor: string; label: string }) => (
  <span className="inline-flex items-center gap-1.5 text-muted-foreground">
    <span className="size-2 rounded-full" style={{ background: dotColor }} />
    {label}
  </span>
);

export default AdminDashboard;
