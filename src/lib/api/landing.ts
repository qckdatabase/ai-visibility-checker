import { useQuery } from "@tanstack/react-query";

interface TopStore {
  category: string;
  keyword: string;
  brand: string;
  url: string;
  rank: number;
}

async function fetchTopStores(): Promise<TopStore[]> {
  const res = await fetch("/api/landing/top-stores");
  if (!res.ok) return [];
  return res.json() as Promise<TopStore[]>;
}

export function useTopStoresWidget() {
  return useQuery({
    queryKey: ["landing", "top-stores"],
    queryFn: fetchTopStores,
    staleTime: 5 * 60 * 1000,
  });
}
