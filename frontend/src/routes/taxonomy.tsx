import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Search, BookOpen, ChevronRight, LayoutGrid, X } from "lucide-react";
import { api } from "@/utils/api";
import { Card, Label, Button, Chip, Skeleton } from "@/components/sh/primitives";
import { toast } from "sonner";

export const Route = createFileRoute("/taxonomy")({
  head: () => ({
    meta: [
      { title: "Skill Taxonomy — Smart Hire" },
      { name: "description", content: "Browse and search canonical technical skills across industry categories." },
      { property: "og:title", content: "Skill Taxonomy — Smart Hire" },
    ],
  }),
  component: TaxonomyPage,
});

function TaxonomyPage() {
  const [q, setQ] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<any | null>(null);

  const fetchTaxonomy = async (query = "") => {
    setLoading(true);
    try {
      const url = query ? `/api/v1/skills/taxonomy?q=${encodeURIComponent(query)}` : '/api/v1/skills/taxonomy';
      const res = await api.get(url);
      setData(res);
    } catch (e: any) {
      toast.error(e.message || "Failed to load skill taxonomy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaxonomy(q);
  }, [q]);

  const categories = data?.categories || [];
  const totalSkills = data?.total || 0;

  return (
    <div className="px-10 py-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-[22px] font-bold text-text-primary">Skill Taxonomy</h1>
          <p className="mt-1 text-[13px] text-text-secondary">Browse and search thousands of normalised technical skills</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-border-default bg-[rgba(124,58,237,0.12)] px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-primary">
          <LayoutGrid className="h-3.5 w-3.5" /> Skill Taxonomy · {totalSkills.toLocaleString()} skills
        </div>
      </div>

      <p className="mt-3 text-[13px] text-text-secondary">Browse or search {totalSkills.toLocaleString()} canonical skills across {categories.length} industry categories.</p>

      <div className="mt-8 flex justify-center">
        <div className="relative w-full max-w-[600px]">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search skills e.g. python, kubernetes, figma…"
            className="h-10 w-full rounded-[10px] border border-border-subtle bg-card pl-11 pr-4 text-[14px] text-text-primary outline-none placeholder:text-text-muted focus:border-primary focus:shadow-glow-purple"
          />
        </div>
      </div>

      {loading ? (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-[80px]" />)}
        </div>
      ) : categories.length === 0 ? (
        <Card className="mt-8 p-10 text-center">
          <div className="text-[13px] text-text-muted">No categories match "{q}"</div>
        </Card>
      ) : (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((c: any) => {
            const subCount = c.subcategories?.length || 0;
            const skillCount = c.subcategories?.reduce((acc: number, sub: any) => acc + (sub.skill_count || 0), 0) || 0;
            return (
              <Card
                key={c.name}
                hover
                className="p-5 cursor-pointer flex flex-col justify-between"
                onClick={() => setSelectedCategory(c)}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgba(124,58,237,0.15)] text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-text-primary">{c.name}</h3>
                    <p className="mt-1 text-[12px] text-text-secondary">{subCount} subcategories</p>
                  </div>
                </div>
                <div className="mt-4 border-t border-border-subtle pt-3 flex justify-between items-center">
                  <span className="text-[12px] text-text-muted">{skillCount} skills</span>
                  <span className="text-[12px] font-semibold text-primary inline-flex items-center gap-1">Browse <ChevronRight className="h-3 w-3" /></span>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Category drawer / modal */}
      {selectedCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 animate-fade-in" onClick={() => setSelectedCategory(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            className="h-full w-full max-w-[600px] bg-card border-l border-border-default shadow-card flex flex-col animate-slide-in-right"
          >
            <div className="flex items-center justify-between border-b border-border-subtle p-6">
              <div>
                <h2 className="text-[18px] font-bold text-text-primary">{selectedCategory.name}</h2>
                <p className="text-[12px] text-text-secondary">{selectedCategory.subcategories?.length || 0} subcategories</p>
              </div>
              <button
                onClick={() => setSelectedCategory(null)}
                className="rounded-full p-2 text-text-muted hover:bg-elevated hover:text-text-primary cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {selectedCategory.subcategories?.map((sub: any) => {
                // If there are skills to display (e.g. from query q search), or we can dynamically load them or display a list
                const hasSkills = Array.isArray(sub.skills) && sub.skills.length > 0;
                return (
                  <div key={sub.name} className="border-b border-border-subtle last:border-0 pb-6 last:pb-0">
                    <h4 className="text-[14px] font-bold text-text-primary mb-2">{sub.name} · <span className="text-[12px] font-normal text-text-secondary">{sub.skill_count} skills</span></h4>
                    {hasSkills ? (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {sub.skills.map((s: string) => <Chip key={s} variant="purple">{s}</Chip>)}
                      </div>
                    ) : (
                      <p className="text-[12px] text-text-muted italic">No filtered skills displayed in categories browse mode. Search above to view individual skills.</p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
