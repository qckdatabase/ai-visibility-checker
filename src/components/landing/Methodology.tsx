const STEPS = [
  {
    n: "01",
    color: "prism-1",
    title: "Audit & Intent Mapping",
    body: "We map how your audience asks — across voice, AI-chat, and generative prompts — then align your content to match the questions that drive purchases.",
  },
  {
    n: "02",
    color: "prism-2",
    title: "Query the AI models",
    body: "Each keyword runs across GPT-4o, Claude 3.5 Sonnet, Gemini 2.0 Flash, Perplexity Sonar, and Llama 3.1 — the assistants your buyers use to discover products.",
  },
  {
    n: "03",
    color: "prism-3",
    title: "Extract & rank brands",
    body: "We parse every brand each model recommends, your position in the list, and the sources or reasoning it cites — so you know exactly where you stand.",
  },
  {
    n: "04",
    color: "prism-4",
    title: "Score & prioritize",
    body: "Mentions are weighted by rank position and frequency across models, normalized into a 0–100 visibility score with a clear action roadmap.",
  },
];

const Methodology = () => (
  <section id="methodology" className="px-6 md:px-10 py-24 border-t hairline">
    <div className="max-w-6xl mx-auto">
      <div className="mb-14">
        <p className="text-[10px] font-mono uppercase tracking-[0.25em] text-muted-foreground mb-4">
          Methodology
        </p>
        <h2 className="text-4xl md:text-5xl font-medium tracking-tight leading-[1.05] md:whitespace-nowrap">
          How a QCK scan <span className="font-serif-italic">actually</span> works.
        </h2>
        <p className="text-base text-muted-foreground mt-5 max-w-xl leading-relaxed">
          Built on the same AEO/GEO framework QCK uses with agency clients —
          four steps that map your brand into the AI purchase consideration flow.
        </p>
      </div>

      <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="p-7 bg-surface border hairline rounded-3xl glass-edge hover:shadow-floating transition-shadow"
          >
            <div className="text-[11px] font-mono tracking-widest mb-5 text-qck-cyan">
              {s.n}
            </div>
            <h3 className="text-lg font-semibold mb-2">{s.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
          </li>
        ))}
      </ol>

      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mt-10">
        Scans run on-demand · model recommendations shift as training data updates
      </p>
    </div>
  </section>
);

export default Methodology;
