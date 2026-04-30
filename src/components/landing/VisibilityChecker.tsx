import { useState, FormEvent } from "react";
import { ArrowRight, Loader2, Search, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";

interface VisibilityCheckerProps {
  onSubmit: (data: { keyword: string; store: string; consent: boolean }) => void;
  loading: boolean;
}

const SUGGESTIONS = [
  "Best waxing product for sensitive skin",
  "Sustainable activewear under $80",
  "Best espresso machine for beginners",
];

const VisibilityChecker = ({ onSubmit, loading }: VisibilityCheckerProps) => {
  const [keyword, setKeyword] = useState("");
  const [store, setStore] = useState("");
  const [consented, setConsented] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!keyword.trim() || !store.trim() || !consented) return;
    onSubmit({ keyword: keyword.trim(), store: store.trim(), consent: consented });
  };

  return (
    <div className="w-full max-w-6xl mx-auto animate-fade-in-up" style={{ animationDelay: "240ms" }}>
      <form
        onSubmit={handleSubmit}
        className="relative p-2 bg-surface border hairline rounded-3xl flex flex-col md:flex-row gap-2 shadow-floating"
      >
        <div className="flex-1 h-12 flex items-center gap-3 px-5 rounded-2xl hover:bg-surface-muted/60 transition-colors">
          <Search className="size-4 text-muted-foreground shrink-0" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            type="text"
            placeholder="TARGET KEYWORD"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm md:text-base placeholder:text-[11px] placeholder:font-mono placeholder:uppercase placeholder:tracking-widest placeholder:text-muted-foreground focus:ring-0 p-0"
            disabled={loading}
          />
        </div>

        <div className="hidden md:block w-px self-center h-8 bg-border" />

        <div className="flex-1 h-12 flex items-center gap-3 px-5 rounded-2xl hover:bg-surface-muted/60 transition-colors">
          <Globe className="size-4 text-muted-foreground shrink-0" />
          <input
            value={store}
            onChange={(e) => setStore(e.target.value)}
            type="text"
            placeholder="STORE NAME OR URL"
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm md:text-base placeholder:text-[11px] placeholder:font-mono placeholder:uppercase placeholder:tracking-widest placeholder:text-muted-foreground focus:ring-0 p-0"
            disabled={loading}
          />
        </div>

        <Button
          type="submit"
          variant="spectral"
          disabled={loading || !keyword.trim() || !store.trim() || !consented}
          className="h-12 px-5 md:px-6 shrink-0 group relative shadow-none"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Scanning AI…
            </>
          ) : (
            <>
              Check AI Visibility
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-muted-foreground">Try:</span>
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setKeyword(s)}
            className="px-2.5 py-1 rounded-full border hairline bg-surface hover:bg-surface-muted transition-colors text-muted-foreground hover:text-foreground"
            disabled={loading}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-8 flex items-center justify-center gap-2.5 whitespace-nowrap">
        <input
          id="consent"
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          className="size-3.5 rounded border-border text-primary accent-primary cursor-pointer shrink-0"
          disabled={loading}
        />
        <label
          htmlFor="consent"
          className="text-xs text-muted-foreground cursor-pointer"
        >
          I agree to the{" "}
          <a href="/terms" className="underline hover:text-foreground transition-colors">
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="/privacy" className="underline hover:text-foreground transition-colors">
            Privacy Policy
          </a>
          . I understand my search data may be stored to operate this service.
        </label>
      </div>
    </div>
  );
};

export default VisibilityChecker;
