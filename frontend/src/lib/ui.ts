export function initials(name?: string): string {
  if (!name) return "?";
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
}

const palette = ["#7c3aed", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#a855f7", "#3b82f6"];
export function colorFor(seed?: string): string {
  if (!seed) return palette[0];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return palette[h % palette.length];
}

export function scoreColor(score: number): { bg: string; text: string; border: string } {
  if (score >= 75) return { bg: "rgba(16,185,129,0.15)", text: "#10b981", border: "rgba(16,185,129,0.4)" };
  if (score >= 50) return { bg: "rgba(245,158,11,0.15)", text: "#f59e0b", border: "rgba(245,158,11,0.4)" };
  return { bg: "rgba(239,68,68,0.15)", text: "#ef4444", border: "rgba(239,68,68,0.4)" };
}

export function fmtDate(iso?: string): string {
  if (!iso) return "—";
  try { return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }); } catch { return "—"; }
}

export function fmtBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}
