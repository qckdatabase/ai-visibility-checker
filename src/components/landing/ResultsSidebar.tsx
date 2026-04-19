import { useEffect } from "react";
import { X, ExternalLink, ArrowUpRight, AlertTriangle, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface AiRanking {
  rank: number;
  brand: string;
  reason: string;
  isUser?: boolean;
}

interface ResultsSidebarProps {
  open: boolean;
  loading: boolean;
  keyword: string;
  store: string;
  results: AiRanking[];
  onClose: () => void;
}

const ResultsSidebar = ({ open, loading, keyword, store, results, onClose }: ResultsSidebarProps) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <button
        aria-label="Close results"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/15 backdrop-blur-md animate-fade-in"
      />

      {/* Panel */}
      <aside
        role="dialog"
        aria-modal="true"
        className="absolute right-0 top-0 h-full w-full sm:w-[480px] md:w-[560px] bg-surface/95 backdrop-blur-xl border-l hairline shadow-floating flex flex-col animate-slide-in-right"
      >
        {/* Header */}
        <div className="px-6 py-5 border-b hairline flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="size-8 rounded-full bg-foreground flex items-center justify-center">
              <Sparkles className="size-4 text-background" />
            </div>
            <div>
              <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
                AI Visibility Report
              </p>
              <p className="text-sm font-semibold leading-tight">ChatGPT · GPT-4o</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="size-9 rounded-full hover:bg-surface-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Close"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Query echo */}
        <div className="px-6 py-4 border-b hairline shrink-0 bg-surface-muted/50">
          <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-1">
            Query
          </p>
          <p className="text-sm font-medium leading-snug">"{keyword}"</p>
          <p className="text-xs text-muted-foreground mt-1">Checking visibility for {store}</p>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <LoadingState />
          ) : (
            <ResultsList results={results} store={store} />
          )}
        </div>

        {/* Marketing CTA banner */}
        {!loading && (
          <div className="shrink-0 p-5 border-t hairline animate-fade-in-up">
            <div className="relative overflow-hidden rounded-3xl p-6 bg-foreground text-background">
              <div
                aria-hidden
                className="absolute -inset-px bg-spectral opacity-30 blur-2xl"
              />
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-background/10 border border-background/20 text-[10px] font-mono uppercase tracking-widest mb-3">
                  <Sparkles className="size-3" />
                  Free · $2K value
                </div>
                <h3 className="text-xl font-medium tracking-tight leading-tight mb-2 text-balance">
                  Claim your free SEO &amp; CRO audit{" "}
                  <span className="font-serif-italic opacity-90">— and start ranking inside AI answers.</span>
                </h3>
                <p className="text-sm opacity-70 mb-5">
                  QCK&apos;s team will personally audit {store || "your store"} and send a 90-day growth
                  plan to climb the AI recommendations list. No commitment, no signup.
                </p>
                <Button variant="spectral" size="lg" asChild className="w-full">
                  <a href="https://qck.co/pages/site-audit" target="_blank" rel="noreferrer">
                    Get my free audit
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
                <p className="text-[11px] font-mono uppercase tracking-widest opacity-50 mt-3 text-center">
                  Trusted by 100+ Shopify brands
                </p>
              </div>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

const LoadingState = () => (
  <div className="px-6 py-10 space-y-5">
    <div className="flex items-center gap-3 text-sm text-muted-foreground">
      <Loader2 className="size-4 animate-spin text-foreground" />
      Querying GPT-4o, Claude & Gemini…
    </div>
    {[0, 1, 2, 3, 4, 5].map((i) => (
      <div
        key={i}
        className="flex items-center gap-4 animate-pulse-soft"
        style={{ animationDelay: `${i * 120}ms` }}
      >
        <div className="size-8 rounded-full bg-surface-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-3.5 w-1/2 rounded-full bg-surface-muted" />
          <div className="h-2.5 w-3/4 rounded-full bg-surface-muted" />
        </div>
      </div>
    ))}
  </div>
);

const ResultsList = ({ results, store }: { results: AiRanking[]; store: string }) => {
  const userInList = results.some((r) => r.isUser);
  return (
    <div className="px-6 py-5">
      <div className="mb-5 flex items-center justify-between">
        <p className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">
          Top 10 AI Recommendations
        </p>
        <span className="text-[10px] font-mono text-muted-foreground">
          Updated · just now
        </span>
      </div>

      <ol className="space-y-2">
        {results.map((r) => (
          <li
            key={r.rank}
            className={cn(
              "group flex items-start gap-4 p-4 rounded-2xl border hairline bg-surface transition-all",
              r.isUser
                ? "border-prism-3/40 bg-prism-3/5 shadow-glass"
                : "hover:bg-surface-muted/60",
            )}
          >
            <div
              className={cn(
                "size-8 rounded-full flex items-center justify-center font-mono text-xs font-semibold shrink-0",
                r.rank <= 3
                  ? "bg-foreground text-background"
                  : "bg-surface-muted text-foreground",
              )}
            >
              {String(r.rank).padStart(2, "0")}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate">{r.brand}</p>
                {r.isUser && (
                  <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase tracking-widest bg-rule-warning text-white">
                    You
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                {r.reason}
              </p>
            </div>
            <ExternalLink className="size-3.5 text-muted-foreground/40 mt-1.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
          </li>
        ))}
      </ol>

      {!userInList && (
        <div className="mt-5 p-4 rounded-2xl border border-dashed border-prism-3/40 bg-prism-3/5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="size-4 text-prism-3 mt-0.5" />
            <div>
              <p className="text-sm font-semibold">{store} did not appear</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                ChatGPT did not recommend your store in its top 10 answers for this query.
                That's lost revenue — every day.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResultsSidebar;
