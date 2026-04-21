import React from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminApi } from "@/lib/api/admin";
import { useQuery } from "@tanstack/react-query";
import { ArrowUp, ArrowDown } from "lucide-react";

type KeywordRow = {
  keyword: string;
  category: string;
  queryCount: number;
  lastSeen: string;
};
type TrendingRow = {
  keyword: string;
  category: string;
  delta: number;
};
type CategoryBreakdownRow = {
  category: string;
  count: number;
};
type KeywordsResponse = {
  topKeywords: KeywordRow[];
  categoryBreakdown: CategoryBreakdownRow[];
  trendingKeywords: TrendingRow[];
};

function timeAgo(isoDate: string): string {
  if (!isoDate) return "";
  const date = new Date(isoDate);
  const diff = Date.now() - date.getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo}mo ago`;
  const y = Math.floor(mo / 12);
  return `${y}y ago`;
}

const StatCard: React.FC<{ title: string; value: React.ReactNode }> = ({ title, value }) => {
  return (
    <div className="p-5 rounded-3xl bg-surface border hairline relative overflow-hidden">
      <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
        {title}
      </p>
      <div className="mt-1.5 text-2xl font-semibold tabular-nums tracking-tight">
        {value}
      </div>
    </div>
  );
};

function hashStringToIndex(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h) % 5;
}

const AdminKeywords: React.FC = () => {
  const { data, isLoading, isError, error } = useQuery<KeywordsResponse, Error>({
    queryKey: ["admin-keywords"],
    queryFn: () => adminApi.keywords({}),
    staleTime: 5 * 60 * 1000,
  });

  const topKeywords = data?.topKeywords ?? [];
  const sortedKeywords = [...topKeywords].sort((a, b) => b.queryCount - a.queryCount);
  const categoryBreakdown = data?.categoryBreakdown ?? [];
  const trendingKeywords = data?.trendingKeywords ?? [];

  const hasNonZeroDelta = trendingKeywords.some((t) => t.delta !== 0);
  const trendingList = hasNonZeroDelta
    ? trendingKeywords.filter((t) => t.delta !== 0)
    : trendingKeywords;

  const maxCount = categoryBreakdown.reduce((m, c) => Math.max(m, c.count ?? 0), 0);

  return (
    <AdminShell eyebrow="Keyword Intelligence" title="Keywords">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <StatCard
          title="Top Keyword Count"
          value={(sortedKeywords[0]?.queryCount ?? 0).toLocaleString()}
        />
        <StatCard
          title="Total Categories"
          value={(categoryBreakdown.length ?? 0).toLocaleString()}
        />
      </div>

      <section className="bg-surface border hairline rounded-3xl p-6 mb-5">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Top Keywords</h3>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : isError ? (
          <div className="py-8 text-sm text-red-600 text-center">
            Error: {error?.message ?? "Failed to load keywords"}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                  <th className="text-left py-3 px-4 font-normal">Keyword</th>
                  <th className="text-left py-3 px-4 font-normal">Category</th>
                  <th className="text-right py-3 px-4 font-normal">Query Count</th>
                  <th className="text-left py-3 px-4 font-normal">Last Seen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sortedKeywords.map((kw, idx) => {
                  const colorClass = `prism-${((idx) % 5) + 1}`;
                  return (
                    <tr key={`${kw.keyword}-${idx}`} className="hover:bg-surface-muted/40 transition-colors">
                      <td className="py-3.5 px-4 text-sm font-medium">{kw.keyword}</td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-[11px] text-white bg-[hsl(var(--${colorClass}))]`}
                        >
                          {kw.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right text-sm font-mono tabular-nums">
                        {kw.queryCount.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-xs text-muted-foreground">
                        {timeAgo(kw.lastSeen)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="bg-surface border hairline rounded-3xl p-6 mb-5">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Trending Keywords</h3>
        {isLoading ? (
          <div className="py-8 text-sm text-muted-foreground text-center">Loading…</div>
        ) : isError ? (
          <div className="py-8 text-sm text-red-600 text-center">
            Error: {error?.message ?? "Failed to load trending"}
          </div>
        ) : trendingKeywords.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground text-center">
            Trending data requires at least 2 weeks of data
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {trendingList.map((t, idx) => {
              const idxColor = `prism-${(hashStringToIndex(t.keyword) % 5) + 1}`;
              const isUp = t.delta > 0;
              const deltaColor = isUp ? "text-prism-5" : "text-prism-3";
              return (
                <li
                  key={`${t.keyword}-${idx}`}
                  className="flex items-center justify-between py-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium">{t.keyword}</span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-full text-[11px] text-white bg-[hsl(var(--${idxColor}))]`}
                    >
                      {t.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {isUp ? (
                      <ArrowUp className="h-3.5 w-3.5 text-prism-5" />
                    ) : (
                      <ArrowDown className="h-3.5 w-3.5 text-prism-3" />
                    )}
                    <span className={`text-sm font-mono tabular-nums ${deltaColor}`}>
                      {Math.abs(t.delta)}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="bg-surface border hairline rounded-3xl p-6">
        <h3 className="text-lg font-semibold tracking-tight mb-4">Category Breakdown</h3>
        {categoryBreakdown.length === 0 ? (
          <div className="py-8 text-sm text-muted-foreground text-center">
            No category data available.
          </div>
        ) : (
          <div className="space-y-3">
            {categoryBreakdown.map((row, idx) => {
              const width = maxCount > 0 ? Math.round((row.count / maxCount) * 100) : 0;
              const barColor = `prism-${((idx) % 5) + 1}`;
              return (
                <div key={row.category} className="flex items-center gap-3">
                  <span className="w-32 text-sm text-muted-foreground truncate">
                    {row.category}
                  </span>
                  <div className="flex-1 h-4 bg-surface-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${width}%`,
                        background: `hsl(var(--${barColor}))`,
                      }}
                    />
                  </div>
                  <span className="w-12 text-sm text-muted-foreground text-right font-mono tabular-nums">
                    {row.count}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </AdminShell>
  );
};

export default AdminKeywords;
