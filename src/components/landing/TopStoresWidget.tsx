import { ExternalLink } from "lucide-react";
import { useTopStoresWidget } from "@/lib/api/landing";

const CATEGORY_COLORS: Record<string, string> = {
  Beauty: "prism-1",
  Apparel: "prism-2",
  Home: "prism-3",
  Wellness: "prism-4",
  Office: "prism-5",
  Food: "prism-1",
  Pets: "prism-2",
  Sports: "prism-3",
  Kids: "prism-4",
  Electronics: "prism-5",
  Other: "prism-1",
};

export default function TopStoresWidget() {
  const { data: stores, isLoading } = useTopStoresWidget();

  if (isLoading) {
    return (
      <section className="py-24 px-6 bg-surface border-t hairline">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-64 rounded-xl bg-surface-muted animate-pulse mb-12" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-48 rounded-3xl bg-surface-muted animate-pulse" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (!stores || stores.length === 0) return null;

  const byCategory = stores.reduce<Record<string, typeof stores>>((acc, row) => {
    (acc[row.category] ??= []).push(row);
    return acc;
  }, {});

  return (
    <section className="py-24 px-6 bg-surface border-t hairline">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-2">
            Real data
          </p>
          <h2 className="text-3xl font-medium tracking-tight">
            Top stores by category
          </h2>
          <p className="text-muted-foreground mt-2 max-w-xl">
            Derived from actual visibility checks run by store owners across industries.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(byCategory).map(([category, rows]) => {
            const accent = CATEGORY_COLORS[category] ?? "prism-1";
            return (
              <div
                key={category}
                className="rounded-3xl bg-background border hairline overflow-hidden"
              >
                <div
                  className="px-5 py-4 border-b hairline flex items-center justify-between"
                  style={{ borderColor: `hsl(var(--${accent}) / 0.15)` }}
                >
                  <span className="text-sm font-medium">{category}</span>
                  <span
                    className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full"
                    style={{
                      background: `hsl(var(--${accent}) / 0.12)`,
                      color: `hsl(var(--${accent}))`,
                    }}
                  >
                    {rows.length} {rows.length === 1 ? "keyword" : "keywords"}
                  </span>
                </div>
                <ul className="divide-y divide-border">
                  {rows.slice(0, 5).map((row, i) => (
                    <li key={i} className="px-5 py-3.5 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{row.brand}</p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {row.keyword}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {row.url && (
                          <a
                            href={row.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-muted-foreground/50 hover:text-foreground transition-colors"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                        <span className="text-[11px] font-mono text-muted-foreground">
                          #{row.rank}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
