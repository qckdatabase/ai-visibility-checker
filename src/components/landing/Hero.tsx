import VisibilityChecker from "./VisibilityChecker";

interface HeroProps {
  onCheck: (data: { keyword: string; store: string; consent: boolean }) => void;
  loading: boolean;
}

const Hero = ({ onCheck, loading }: HeroProps) => {
  return (
    <section className="relative px-6 pt-20 pb-24 md:pt-28 md:pb-32 flex flex-col items-center overflow-hidden">
      {/* Aura backdrop */}
      <div
        aria-hidden
        className="absolute inset-x-0 -top-24 h-[700px] bg-aura pointer-events-none"
      />
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        }}
      />

      <div className="relative z-10 max-w-5xl w-full text-center space-y-7">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border hairline text-[11px] font-mono uppercase tracking-widest text-muted-foreground animate-fade-in"
        >
          <span className="size-1.5 rounded-full prism-dot" />
          Live AI Index Monitoring
        </div>

        <h1
          className="max-w-4xl mx-auto text-5xl sm:text-6xl md:text-7xl font-medium tracking-tight leading-[0.95] text-balance animate-fade-in-up"
          style={{ animationDelay: "80ms" }}
        >
          Is your store
          <br />
          visible in <span className="font-serif-italic">ChatGPT?</span>
        </h1>

        <p
          className="max-w-[58ch] mx-auto text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed animate-fade-in-up"
          style={{ animationDelay: "160ms" }}
        >
          Discover if AI is recommending your competitors over you.
          Test your product visibility across the models your customers actually use.
        </p>

        <div className="pt-6">
          <VisibilityChecker onSubmit={onCheck} loading={loading} />
        </div>

        <div
          className="flex flex-col items-center gap-4 animate-fade-in"
          style={{ animationDelay: "420ms" }}
        >
          <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground">
            Auditing across
          </p>
          <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-3 opacity-60">
            {["GPT-4o", "Claude 3.5 Sonnet", "Gemini 2.0 Flash", "Perplexity Sonar", "Llama 3.1"].map(
              (m) => (
                <span
                  key={m}
                  className="font-mono text-xs font-semibold tracking-tight text-muted-foreground"
                >
                  {m}
                </span>
              ),
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
