import { useState } from "react";
import SiteNav from "@/components/landing/SiteNav";
import Hero from "@/components/landing/Hero";
import Methodology from "@/components/landing/Methodology";
import FeatureGrid from "@/components/landing/FeatureGrid";
import ResultsSidebar, { type AiRanking } from "@/components/landing/ResultsSidebar";

const Index = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [store, setStore] = useState("");
  const [results, setResults] = useState<AiRanking[]>([]);

  const handleCheck = async ({ keyword: k, store: s }: { keyword: string; store: string }) => {
    setKeyword(k);
    setStore(s);
    setResults([]);
    setLoading(true);
    setOpen(true);

    try {
      const res = await fetch("/api/visibility", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: k, store: s }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: "Request failed" }));
        throw new Error(err.message || `HTTP ${res.status}`);
      }

      const data = await res.json();
      setResults(data.results);
    } catch (err) {
      console.error("Visibility check failed:", err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero onCheck={handleCheck} loading={loading} />
        <Methodology />
        <FeatureGrid />
      </main>

      <ResultsSidebar
        open={open}
        loading={loading}
        keyword={keyword}
        store={store}
        results={results}
        onClose={() => setOpen(false)}
      />
    </div>
  );
};

export default Index;
