import { useState } from "react";
import SiteNav from "@/components/landing/SiteNav";
import Hero from "@/components/landing/Hero";
import FeatureGrid from "@/components/landing/FeatureGrid";
import SiteFooter from "@/components/landing/SiteFooter";
import ResultsSidebar, { type AiRanking } from "@/components/landing/ResultsSidebar";
import { generateMockResults } from "@/lib/mockData";

const Index = () => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [store, setStore] = useState("");
  const [results, setResults] = useState<AiRanking[]>([]);

  const handleCheck = ({ keyword: k, store: s }: { keyword: string; store: string }) => {
    setKeyword(k);
    setStore(s);
    setResults([]);
    setLoading(true);
    setOpen(true);
    // Simulate AI scan
    window.setTimeout(() => {
      setResults(generateMockResults(s));
      setLoading(false);
    }, 1800);
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col">
      <SiteNav />
      <main className="flex-1">
        <Hero onCheck={handleCheck} loading={loading} />
        <FeatureGrid />
      </main>
      <SiteFooter />

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
