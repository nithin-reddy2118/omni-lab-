import React, { useMemo, useRef, useState } from 'react';
import { Bookmark, ExternalLink, Globe2, Loader2, RotateCcw, Sparkles } from 'lucide-react';
import { DISCOVERY_CATEGORIES, WORLD_DISCOVERIES } from '../data/discoveries';
import { useLab } from '../context/LabContext';
import type { DiscoveryItem } from '../types/science';
import { Modal } from '../components/ui/Modal';

interface DiscoveryExplanation {
  plainSummary: string;
  analogy: string;
  howItConnectsToSchoolScience: string;
  openQuestions: string;
}

export function WorldDiscoveriesPage() {
  const { savedDiscoveryIds, toggleSaveDiscovery, language } = useLab();
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [explainingItem, setExplainingItem] = useState<DiscoveryItem | null>(null);
  const [level, setLevel] = useState('Middle & High School (Ages 12–17)');
  const [loadingExplain, setLoadingExplain] = useState(false);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<DiscoveryExplanation | null>(null);
  const inFlightRef = useRef(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return WORLD_DISCOVERIES.filter((d) => {
      const catOk = category === 'All' || d.category === category;
      const qOk =
        !q ||
        d.title.toLowerCase().includes(q) ||
        d.summary.toLowerCase().includes(q) ||
        d.institution.toLowerCase().includes(q);
      return catOk && qOk;
    });
  }, [category, search]);

  const handleOpenExplain = async (item: DiscoveryItem, selectedLevel = level) => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    setExplainingItem(item);
    setLoadingExplain(true);
    setExplainError(null);
    setExplanation(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch('/api/ai/explain-discovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ discovery: item, level: selectedLevel, language }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setExplainError(data.error || 'AI explanation is temporarily busy. Please try again.');
        return;
      }
      setExplanation(data.explanation);
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setExplainError(
        aborted
          ? 'The AI explanation timed out. Click Retry to try again.'
          : 'Network error contacting AI explanation service. Please retry.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRef.current = false;
      setLoadingExplain(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Globe2 className="w-4 h-4" />
            Verified Scientific Milestones · Real Sources &amp; Dates
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            World Discoveries
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Browse verified discoveries, peer-reviewed research, and validated engineering prototypes from real scientific institutions.
          </p>
        </div>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search discoveries or institutions..."
          className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 w-full sm:w-72"
        />
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2">
        {DISCOVERY_CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              category === cat
                ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
          No discoveries match your filter.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {filtered.map((d) => {
            const isSaved = savedDiscoveryIds.includes(d.id);
            return (
              <article
                key={d.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm"
              >
                <div className="space-y-2.5">
                  <div className="text-xs text-slate-500">
                    {d.category} · <span className="text-emerald-700 font-medium">{d.status}</span> · {d.date}
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-900">{d.title}</h2>
                  <div className="text-xs text-blue-700 font-medium">{d.institution}</div>
                  <p className="text-sm text-slate-600 leading-relaxed">{d.summary}</p>
                  <p className="text-xs text-slate-800">
                    <strong>Why it matters:</strong> {d.whyItMatters}
                  </p>
                  <div className="text-xs text-slate-600">
                    <strong>Concepts:</strong> {d.concepts.join(' · ')}
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <a
                    href={d.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline inline-flex items-center gap-1 font-medium"
                  >
                    {d.sourceName} <ExternalLink className="w-3 h-3" />
                  </a>

                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => toggleSaveDiscovery(d.id)}
                      className={`inline-flex items-center gap-1 font-medium ${
                        isSaved ? 'text-amber-700' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                      {isSaved ? 'Saved' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenExplain(d)}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 inline-flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      AI Explain This Discovery
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* AI Explain Discovery Modal */}
      <Modal
        open={Boolean(explainingItem)}
        onClose={() => setExplainingItem(null)}
        title={explainingItem ? `Explain: ${explainingItem.title}` : 'Explain Discovery'}
        maxWidthClass="max-w-2xl"
      >
        {explainingItem && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <span className="text-slate-600">Reading Level:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Young Explorer (Ages 9–12)',
                  'Middle & High School (Ages 12–17)',
                  'University Prep',
                ].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => {
                      setLevel(lvl);
                      handleOpenExplain(explainingItem, lvl);
                    }}
                    className={`px-2.5 py-1 rounded border ${
                      level === lvl
                        ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-600'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </div>

            {loadingExplain && (
              <div className="py-8 flex items-center justify-center gap-2 text-sm text-blue-700">
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating clear explanation grounded in verified record...
              </div>
            )}

            {explainError && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-800">
                <span>{explainError}</span>
                <button
                  type="button"
                  onClick={() => handleOpenExplain(explainingItem, level)}
                  className="px-3 py-1.5 rounded bg-rose-700 text-white font-semibold flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </button>
              </div>
            )}

            {explanation && (
              <div className="space-y-3 text-sm">
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <div className="text-xs font-semibold text-blue-700 mb-1">Plain Explanation</div>
                  <p className="text-slate-900 leading-relaxed">{explanation.plainSummary}</p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-4 border border-emerald-200">
                  <div className="text-xs font-semibold text-emerald-800 mb-1">Everyday Analogy</div>
                  <p className="text-slate-700">{explanation.analogy}</p>
                </div>
                <div className="rounded-lg bg-slate-50 p-4 border border-slate-200">
                  <div className="text-xs font-semibold text-slate-900 mb-1">How It Connects to School Science</div>
                  <p className="text-slate-700">{explanation.howItConnectsToSchoolScience}</p>
                </div>
                <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                  <div className="text-xs font-semibold text-amber-800 mb-1">What Remains Unknown / Open Challenges</div>
                  <p className="text-slate-700">{explanation.openQuestions}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}
