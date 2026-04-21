import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, type QueryRow, type BrandRow } from "@/lib/api/admin";
import AdminShell from "@/components/admin/AdminShell";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Search, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
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
  return `${Math.floor(mo / 12)}y ago`;
}

const Chip = ({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "ok" | "warn";
}) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border hairline",
      tone === "ok" && "bg-prism-5/10 text-prism-5 border-prism-5/20",
      tone === "warn" && "bg-prism-3/10 text-prism-3 border-prism-3/20",
      tone === "neutral" && "bg-surface text-muted-foreground",
    )}
  >
    {children}
  </span>
);

const AdminQueries: React.FC = () => {
  const [keyword, setKeyword] = useState("");
  const [store, setStore] = useState("");
  const [category, setCategory] = useState("");
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const limit = 25;
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-queries", { keyword, store, category, page }],
    queryFn: () =>
      adminApi.queries({
        keyword: keyword || undefined,
        store: store || undefined,
        category: category || undefined,
        page,
        limit,
      }),
    staleTime: 30 * 1000,
  });

  const { data: brandData } = useQuery({
    queryKey: ["admin-query-brands", expandedId],
    queryFn: () => (expandedId ? adminApi.queryBrands(expandedId) : null),
    enabled: !!expandedId,
  });

  const rows: QueryRow[] = data?.rows ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const found = rows.filter((r) => r.userRank != null).length;
  const missing = rows.length - found;

  const uniqueStores = [...new Set(rows.map((r) => r.store))];
  const uniqueCategories = [...new Set(rows.map((r) => r.category))];

  return (
    <AdminShell eyebrow="Operations" title="Queries">
      <section className="p-3 bg-surface border hairline rounded-3xl flex flex-col lg:flex-row gap-2 items-stretch lg:items-center">
        <div className="flex-1 flex items-center gap-3 px-4 py-2.5 rounded-2xl bg-surface-muted/60">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={keyword}
            onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
            placeholder="Search by keyword or store…"
            className="flex-1 bg-transparent border-none outline-none text-sm placeholder:text-muted-foreground/60 focus:ring-0 p-0"
          />
        </div>

        <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border hairline bg-surface cursor-pointer">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Category</span>
          <select
            value={category}
            onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 cursor-pointer"
          >
            <option value="">All</option>
            {uniqueCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </label>

        <label className="flex items-center gap-2 px-4 py-2.5 rounded-2xl border hairline bg-surface cursor-pointer">
          <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Store</span>
          <select
            value={store}
            onChange={(e) => { setStore(e.target.value); setPage(1); }}
            className="bg-transparent border-none outline-none text-sm font-medium focus:ring-0 cursor-pointer"
          >
            <option value="">All</option>
            {uniqueStores.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </label>

        {(keyword || store || category) && (
          <button
            onClick={() => { setKeyword(""); setStore(""); setCategory(""); setPage(1); }}
            className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground hover:text-foreground px-2"
          >
            Clear
          </button>
        )}
      </section>

      <section className="flex flex-wrap gap-2">
        <Chip>
          <span className="font-mono tabular-nums">{total}</span> results
        </Chip>
        <Chip tone="ok">
          <span className="font-mono tabular-nums">{found}</span> found
        </Chip>
        <Chip tone="warn">
          <span className="font-mono tabular-nums">{missing}</span> missing
        </Chip>
      </section>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-sm text-muted-foreground">
          Loading…
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-sm text-red-600">
          Error: {(error as any)?.message ?? "Failed to load"}
        </div>
      ) : (
        <section className="rounded-3xl bg-surface border hairline overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground border-b hairline bg-surface-muted/40">
                  <th className="w-8" />
                  <th className="text-left py-3.5 px-5 font-normal">Query</th>
                  <th className="text-left py-3.5 px-5 font-normal">Store</th>
                  <th className="text-left py-3.5 px-5 font-normal">Category</th>
                  <th className="text-right py-3.5 px-5 font-normal">Rank</th>
                  <th className="text-left py-3.5 px-5 font-normal">Cached</th>
                  <th className="text-right py-3.5 px-5 font-normal">When</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <React.Fragment key={r.id}>
                    <tr
                      className="border-b hairline last:border-0 hover:bg-surface-muted/40 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    >
                      <td className="py-4 px-2 text-center">
                        {expandedId === r.id
                          ? <ChevronUp className="size-3.5 text-muted-foreground mx-auto" />
                          : <ChevronDown className="size-3.5 text-muted-foreground mx-auto" />}
                      </td>
                      <td className="py-4 px-5 font-medium max-w-xs">
                        <div className="flex items-center gap-2">
                          <span className={cn("size-1.5 rounded-full shrink-0", r.userRank != null ? "bg-prism-5" : "bg-prism-3")} />
                          <span className="truncate">{r.keyword}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-muted-foreground">{r.store}</td>
                      <td className="py-4 px-5 text-muted-foreground">{r.category}</td>
                      <td className="py-4 px-5 text-right font-mono tabular-nums">
                        {r.userRank != null ? `#${r.userRank}` : <span className="text-prism-3">—</span>}
                      </td>
                      <td className="py-4 px-5">
                        <span className={cn(
                          "inline-flex px-2 py-0.5 rounded-full text-[11px] font-mono",
                          r.cached
                            ? "bg-prism-5/10 text-prism-5"
                            : "bg-surface-muted text-muted-foreground",
                        )}>
                          {r.cached ? "Yes" : "No"}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-xs text-muted-foreground">
                        {timeAgo(r.createdAt)}
                      </td>
                    </tr>
                    {expandedId === r.id && (
                      <tr key={`${r.id}-brands`} className="border-b hairline bg-surface-muted/20">
                        <td colSpan={7} className="px-8 py-4">
                          {expandedId === r.id && !brandData ? (
                            <span className="text-xs text-muted-foreground">Loading brands…</span>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {(brandData?.brands ?? []).map((b: BrandRow) => (
                                <span
                                  key={b.rank}
                                  className={cn(
                                    "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border hairline",
                                    b.isUser
                                      ? "bg-prism-1/10 text-prism-1 border-prism-1/20"
                                      : "bg-surface text-muted-foreground",
                                  )}
                                >
                                  <span className="font-mono text-[10px] text-muted-foreground">#{b.rank}</span>
                                  {b.brand}
                                  {b.url && (
                                    <a href={b.url} target="_blank" rel="noreferrer" className="hover:text-foreground" onClick={(e) => e.stopPropagation()}>
                                      <ExternalLink className="size-2.5" />
                                    </a>
                                  )}
                                </span>
                              ))}
                              {(brandData?.brands ?? []).length === 0 && (
                                <span className="text-xs text-muted-foreground">No brands found</span>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                      No queries found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t hairline">
              <span className="text-xs text-muted-foreground">
                Page {page} of {totalPages} · {total} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </section>
      )}
    </AdminShell>
  );
};

export default AdminQueries;
