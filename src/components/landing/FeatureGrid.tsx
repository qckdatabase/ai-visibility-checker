import { Sparkles, Target, BarChart3 } from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    color: "prism-1",
    title: "AEO + GEO Framework",
    body: "Move beyond traditional SEO. We optimize for answer engines and generative AI so your brand gets cited, not just ranked.",
  },
  {
    icon: Target,
    color: "prism-2",
    title: "Brand in AI Answers",
    body: "See exactly where AI models mention your brand — or your competitors — and what it takes to own that citation spot.",
  },
  {
    icon: BarChart3,
    color: "prism-3",
    title: "Actionable Roadmap",
    body: "Walk away with a prioritized list of content, schema, and authority-building steps that move the needle on AI visibility.",
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
          The agency behind the checker — <span className="font-serif-italic">built for AI-first search</span>.
        </h2>
        <p className="text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
          QCK is a full-service SEO and AEO/GEO agency. The AI Visibility Checker is a free tool
          built on the same methodology we use with 100+ brands.{" "}
          <a
            href="https://qck.co"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground transition-colors"
          >
            Visit qck.co
          </a>{" "}
          to learn more about our agency services.
        </p>
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
