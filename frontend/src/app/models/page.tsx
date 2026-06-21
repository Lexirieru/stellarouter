"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ModelSelect } from "@/components/ModelSelect";

const GATEWAY = process.env.NEXT_PUBLIC_GATEWAY_URL || "http://localhost:3001";
const MODEL_KEY = "stellarouter:model";
const PAGE_SIZE = 12;

type Model = {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  created?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { output_modalities?: string[] };
};

const SORTS = ["Newest", "Price: low → high", "Context: high → low"];

const perM = (v?: string) => {
  const n = Number(v ?? 0) * 1e6;
  if (!Number.isFinite(n) || n < 0) return "—"; // variable pricing
  if (n === 0) return "Free";
  return `$${n.toFixed(n < 1 ? 3 : 2)}/M`;
};

const ctx = (n?: number) => {
  if (!n) return "—";
  if (n >= 1e6) return `${(n / 1e6).toFixed(n % 1e6 ? 1 : 0)}M`;
  if (n >= 1e3) return `${Math.round(n / 1e3)}K`;
  return String(n);
};

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function ModelsPage() {
  const router = useRouter();
  const [models, setModels] = useState<Model[]>([]);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState("all");
  const [sort, setSort] = useState(SORTS[0]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${GATEWAY}/models`);
        const d = await r.json();
        if (d.error) throw new Error(d.message || d.error);
        setModels(d.data || []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Modality tabs with counts.
  const tabs = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const m of models) {
      for (const mod of m.architecture?.output_modalities ?? ["text"]) {
        counts[mod] = (counts[mod] || 0) + 1;
      }
    }
    const ordered = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    return [
      { key: "all", label: "All", count: models.length },
      ...ordered.map(([key, count]) => ({ key, label: cap(key), count })),
    ];
  }, [models]);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = models.filter((m) => {
      const inTab =
        tab === "all" ||
        (m.architecture?.output_modalities ?? ["text"]).includes(tab);
      const inSearch =
        !s || m.id.toLowerCase().includes(s) || m.name?.toLowerCase().includes(s);
      return inTab && inSearch;
    });
    list = [...list].sort((a, b) => {
      if (sort === SORTS[1]) {
        return Number(a.pricing?.prompt ?? Infinity) - Number(b.pricing?.prompt ?? Infinity);
      }
      if (sort === SORTS[2]) {
        return (b.context_length ?? 0) - (a.context_length ?? 0);
      }
      return (b.created ?? 0) - (a.created ?? 0); // Newest
    });
    return list;
  }, [models, q, tab, sort]);

  // Reset to page 1 whenever the result set changes.
  useEffect(() => {
    setPage(1);
  }, [q, tab, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function useInPlayground(id: string) {
    localStorage.setItem(MODEL_KEY, id);
    router.push("/");
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-6 py-8">
      <div className="flex items-baseline justify-between gap-4">
        <h1 className="text-2xl font-semibold tracking-tight">Models</h1>
        <span className="text-sm text-zinc-500">{filtered.length} models</span>
      </div>
      <p className="mt-2 text-sm text-zinc-600">
        One API for hundreds of models — pay per call in USDC on Stellar.
      </p>

      {/* Search + sort */}
      <div className="mt-4 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search models…"
          className="flex-1 rounded-full border border-black/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-black/40"
        />
        <ModelSelect models={SORTS} value={sort} onChange={setSort} />
      </div>

      {/* Modality tabs */}
      <div className="mt-4 flex flex-wrap gap-1 border-b border-black/10 pb-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-3 py-1 text-sm transition-colors ${
              tab === t.key
                ? "bg-[var(--color-darkblue)] text-white"
                : "text-zinc-600 hover:bg-black/[.05]"
            }`}
          >
            {t.label}{" "}
            <span className={tab === t.key ? "opacity-80" : "text-zinc-400"}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {loading && <p className="mt-6 text-sm text-zinc-500">Loading models…</p>}
      {error && (
        <p className="mt-6 rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-col gap-3">
        {pageItems.map((m) => (
          <div key={m.id} className="rounded-xl border border-black/10 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-semibold">{m.name}</div>
              <code className="shrink-0 font-mono text-[11px] text-zinc-500">
                {m.id}
              </code>
            </div>
            {m.description && (
              <p className="mt-1 line-clamp-2 text-sm text-zinc-600">
                {m.description}
              </p>
            )}
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-zinc-500">
                <span>{ctx(m.context_length)} context</span>
                <span>{perM(m.pricing?.prompt)} in</span>
                <span>{perM(m.pricing?.completion)} out</span>
              </div>
              <button
                onClick={() => useInPlayground(m.id)}
                className="shrink-0 rounded-full bg-[var(--color-darkblue)] px-3 py-1 text-xs font-medium text-white transition-opacity hover:opacity-90"
              >
                Use in Playground
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {!loading && filtered.length > 0 && (
        <div className="mt-6 flex items-center justify-center gap-4 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-black/15 px-3 py-1.5 transition-colors hover:bg-black/[.04] disabled:opacity-40"
          >
            ‹ Prev
          </button>
          <span className="text-zinc-500">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-lg border border-black/15 px-3 py-1.5 transition-colors hover:bg-black/[.04] disabled:opacity-40"
          >
            Next ›
          </button>
        </div>
      )}
    </div>
  );
}
