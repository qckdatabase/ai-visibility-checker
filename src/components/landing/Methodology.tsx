const STEPS = [
  {
    n: "01",
    color: "prism-1",
    title: "Generate the questions",
    body: "We seed real shopper prompts in your category — pulled from search trends and review language, not made-up phrases.",
  },
  {
    n: "02",
    color: "prism-2",
    title: "Ask the models",
    body: "Each prompt runs against GPT-4o, Claude 3.5, Gemini 1.5 Pro, and Perplexity Sonar — the assistants your buyers actually use.",
  },
  {
    n: "03",
    color: "prism-3",
    title: "Parse the answers",
    body: "We extract every brand each model recommends, where you appear in the list, and which sources it cited to get there.",
  },
  {
    n: "04",
    color: "prism-4",
    title: "Score visibility",
    body: "Mentions are weighted by rank and frequency across models, then normalized into a single 0–100 visibility score.",
  },
];

const Methodology = () => (
  <section id="methodology" className="px-6 md:px-10 py-24 border-t hairline">
    <div className="max-w-6xl mx-auto">
      <div className="max-w-2xl mb-14">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Methodology
        </p>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] text-balance">
          What <span className="font-serif-italic">actually</span> happens when you run a scan.
        </h2>
        <p className="text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
          No black box. Every visibility score is built from the same four steps,
          run against the assistants your customers ask first.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="p-7 bg-surface border hairline rounded-3xl glass-edge hover:shadow-floating transition-shadow"
          >
            <div
              className="text-[11px] font-mono tracking-widest mb-5"
              style={{ color: `hsl(var(--${s.color}))` }}
            >
              {s.n}
            </div>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>

      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-10">
        Scans refresh weekly · model recommendations shift as their training updates
      </p>
    </div>
  </section>
);

export default Methodology;
