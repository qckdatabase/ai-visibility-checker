export function normalize(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/^www\./, "")
    .replace(/\/$/, "");
}

export function cacheKey(keyword: string, store: string): string {
  return `${normalize(keyword)}|${normalize(store)}`;
}
