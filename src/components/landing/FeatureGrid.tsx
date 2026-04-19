import { Sparkles, Target, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    color: "prism-1",
    title: "Latent Semantic Audit",
    body: "Understand the semantic clusters LLMs use to categorize your brand and products.",
  },
  {
    icon: Target,
    color: "prism-2",
    title: "Citation Tracking",
    body: "See which sources, reviews and competitors AI is citing instead of you.",
  },
  {
    icon: BarChart3,
    color: "prism-3",
    title: "AI SEO Roadmap",
    body: "Receive prioritized, technical changes that make your store findable to GPT.",
  },
];

const FeatureGrid = () => (
  <section id="features" className="px-6 md:px-10 py-24 bg-surface-muted border-y hairline">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mb-14">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Why QCK
        </p>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance">
          Built for the new search shelf — <span className="font-serif-italic">conversational</span>.
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <article
              key={f.title}
              className="p-7 bg-surface border hairline rounded-3xl glass-edge hover:shadow-floating transition-shadow"
            >
              <div
                className="size-11 rounded-2xl flex items-center justify-center mb-5"
                style={{
                  background: `hsl(var(--${f.color}) / 0.12)`,
                  color: `hsl(var(--${f.color}))`,
                }}
              >
                <Icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
            </article>
          );
        })}
      </div>
    </div>
  </section>
);

export default FeatureGrid;
