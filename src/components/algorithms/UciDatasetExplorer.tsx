import React, { useState } from 'react';
import {
  Database,
  ExternalLink,
  Search,
  Upload,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Table2,
} from 'lucide-react';
import {
  UCI_CATEGORIES,
  UCI_DATTS_CATALOG_FALLBACK_HELPER,
} from './uciCatalogBridge';
import type { LoadedDataset, UciCategory, UciDatasetMeta } from '../../types/algorithm';
import { UCI_DATASETS_CATALOG, metaToLoadedDataset, parseCsvTextToDataset } from '../../data/uciDatasets';

void UCI_DATTS_CATALOG_FALLBACK_HELPER;

interface Props {
  activeDataset: LoadedDataset;
  selectedFeatures: string[];
  selectedTarget: string;
  onSelectDataset: (ds: LoadedDataset) => void;
  onChangeFeatures: (cols: string[]) => void;
  onChangeTarget: (col: string) => void;
  onOpenMlPlayground: () => void;
}

export function UciDatasetExplorer({
  activeDataset,
  selectedFeatures,
  selectedTarget,
  onSelectDataset,
  onChangeFeatures,
  onChangeTarget,
  onOpenMlPlayground,
}: Props) {
  const [category, setCategory] = useState<UciCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [catalogResults, setCatalogResults] = useState<UciDatasetMeta[]>(UCI_DATASETS_CATALOG);
  const [liveRemoteHits, setLiveRemoteHits] = useState<{ id?: number; name: string; task?: string; url: string }[]>([]);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [searching, setSearching] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const runSearch = async (q: string, cat: UciCategory) => {
    setSearching(true);
    setErrorMessage(null);
    try {
      const res = await fetch(
        `/api/uci/search?q=${encodeURIComponent(q)}&category=${encodeURIComponent(cat)}`
      );
      if (res.ok) {
        const data = await res.json();
        setCatalogResults(data.catalog || UCI_DATASETS_CATALOG);
        setLiveRemoteHits(data.liveUciMatches || []);
      } else {
        throw new Error('Search request unavailable');
      }
    } catch {
      const filtered = UCI_DATASETS_CATALOG.filter((d) => {
        const matchCat = cat === 'All' || d.category === cat || d.tasks.some((t) => t.toLowerCase() === cat.toLowerCase());
        const matchQ =
          !q.trim() ||
          d.name.toLowerCase().includes(q.toLowerCase()) ||
          d.subjectArea.toLowerCase().includes(q.toLowerCase());
        return matchCat && matchQ;
      });
      setCatalogResults(filtered);
    } finally {
      setSearching(false);
    }
  };

  const handleCategoryClick = (cat: UciCategory) => {
    setCategory(cat);
    void runSearch(searchQuery, cat);
  };

  const handleLoadUciDataset = async (meta: UciDatasetMeta) => {
    setLoadingId(meta.id);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const res = await fetch(`/api/uci/dataset/${meta.id}`);
      if (!res.ok) throw new Error('Server fetch failed');
      const payload = await res.json();
      const loaded: LoadedDataset = payload.dataset;
      onSelectDataset(loaded);
      const defaults = loaded.numericColumns.filter((c) => c !== loaded.suggestedTarget).slice(0, 4);
      onChangeFeatures(defaults.length ? defaults : loaded.numericColumns.slice(0, 2));
      onChangeTarget(loaded.suggestedTarget);
      setStatusMessage(
        loaded.source === 'uci-live'
          ? `Loaded live data (${loaded.rows.length} rows) from UCI ML Repository.`
          : loaded.note
      );
    } catch {
      const fallback = metaToLoadedDataset(meta, 'verified-sample');
      onSelectDataset(fallback);
      const defaults = fallback.numericColumns.filter((c) => c !== fallback.suggestedTarget).slice(0, 4);
      onChangeFeatures(defaults);
      onChangeTarget(fallback.suggestedTarget);
      setStatusMessage(fallback.note);
    } finally {
      setLoadingId(null);
    }
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setErrorMessage(null);
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = parseCsvTextToDataset(String(reader.result || ''), file.name);
        onSelectDataset(parsed);
        const defaults = parsed.numericColumns.filter((c) => c !== parsed.suggestedTarget).slice(0, 4);
        onChangeFeatures(defaults);
        onChangeTarget(parsed.suggestedTarget);
        setStatusMessage(parsed.note);
      } catch (err) {
        setErrorMessage(err instanceof Error ? err.message : 'Unable to parse CSV file.');
      }
    };
    reader.readAsText(file);
  };

  const toggleFeature = (col: string) => {
    if (col === selectedTarget) return;
    if (selectedFeatures.includes(col)) {
      if (selectedFeatures.length > 1) {
        onChangeFeatures(selectedFeatures.filter((c) => c !== col));
      }
    } else {
      onChangeFeatures([...selectedFeatures, col]);
    }
  };

  return (
    <div className="space-y-6">
      {/* Search + Upload Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <Database className="w-4 h-4" />
              <span>UCI Machine Learning Repository & Custom CSV</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Browse Real Scientific & Machine Learning Datasets
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Search verified datasets from{' '}
              <a
                href="https://archive.ics.uci.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-700 underline hover:text-blue-900"
              >
                archive.ics.uci.edu
              </a>{' '}
              with attribution and license details, or upload your own CSV file.
            </p>
          </div>

          <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-800 cursor-pointer transition-colors">
            <Upload className="w-4 h-4 text-blue-700" />
            <span>Upload Local CSV</span>
            <input type="file" accept=".csv,.txt" onChange={handleCsvUpload} className="hidden" />
          </label>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            void runSearch(searchQuery, category);
          }}
          className="flex flex-wrap gap-2"
        >
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search Iris, Wine Quality, Airfoil, Breast Cancer, Seeds..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={searching}
            className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors disabled:opacity-60"
          >
            {searching ? 'Searching UCI...' : 'Search Datasets'}
          </button>
        </form>

        {/* Category filter tabs */}
        <div className="flex flex-wrap gap-1.5">
          {UCI_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => handleCategoryClick(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                category === cat
                  ? 'bg-blue-700 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {statusMessage && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 flex items-start gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>{statusMessage}</span>
        </div>
      )}
      {errorMessage && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Dataset Catalog Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {catalogResults.map((ds) => {
          const isActive = activeDataset.id === `uci-${ds.id}`;
          return (
            <div
              key={ds.id}
              className={`rounded-xl border p-4 bg-white flex flex-col justify-between transition-all ${
                isActive ? 'border-blue-600 ring-2 ring-blue-600/15' : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[11px] font-mono font-semibold text-blue-700">
                    UCI #{ds.id} · {ds.category}
                  </span>
                  <a
                    href={ds.officialUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-slate-500 hover:text-blue-700 inline-flex items-center gap-1"
                  >
                    <span>UCI Page</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <h3 className="mt-1.5 text-sm font-bold text-slate-900">{ds.name}</h3>
                <p className="mt-1 text-xs text-slate-600 line-clamp-3">{ds.description}</p>
                <div className="mt-3 text-[11px] font-mono text-slate-500 tabular-nums space-y-0.5">
                  <div>
                    Instances: {ds.instances.toLocaleString()} · Features: {ds.features} ({ds.featureTypes})
                  </div>
                  <div>Target: {ds.targetName} · {ds.license}</div>
                </div>
              </div>

              <button
                type="button"
                disabled={loadingId === ds.id}
                onClick={() => void handleLoadUciDataset(ds)}
                className={`mt-4 w-full py-2 px-3 rounded-lg text-xs font-semibold transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-900 hover:bg-blue-700 text-white'
                }`}
              >
                {loadingId === ds.id
                  ? 'Fetching from UCI...'
                  : isActive
                  ? 'Loaded in Workspace'
                  : 'Load Dataset & Inspect'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Live UCI Remote Directory Matches if any */}
      {liveRemoteHits.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Additional Live Results from UCI Repository Directory
          </h3>
          <div className="flex flex-wrap gap-2">
            {liveRemoteHits.map((h, i) => (
              <a
                key={i}
                href={h.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-xs text-slate-800"
              >
                <span>{h.name}</span>
                {h.task && <span className="text-slate-500">· {h.task}</span>}
                <ExternalLink className="w-3 h-3 text-blue-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Active Dataset Inspector & Feature/Target Selection */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
              <Table2 className="w-4 h-4 text-blue-700" />
              <span>ACTIVE WORKSPACE DATASET</span>
              <span>·</span>
              <span className="font-semibold text-slate-800">
                {activeDataset.source === 'uci-live'
                  ? 'Live UCI Fetch'
                  : activeDataset.source === 'user-csv'
                  ? 'Uploaded CSV'
                  : 'Verified UCI Sample'}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-1">{activeDataset.name}</h3>
            <p className="text-xs text-slate-600 mt-0.5">{activeDataset.note}</p>
          </div>

          <button
            type="button"
            onClick={onOpenMlPlayground}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
          >
            <span>Train & Test in ML Playground</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Column Type + Feature & Target Chooser */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Input Features ({selectedFeatures.length} selected)
            </h4>
            <div className="flex flex-wrap gap-2">
              {activeDataset.numericColumns.map((col) => {
                const isTarget = col === selectedTarget;
                const checked = selectedFeatures.includes(col) && !isTarget;
                return (
                  <button
                    key={col}
                    type="button"
                    disabled={isTarget}
                    onClick={() => toggleFeature(col)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-mono transition-colors ${
                      isTarget
                        ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                        : checked
                        ? 'bg-blue-50 border-blue-600 text-blue-900 font-semibold'
                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    {checked ? '✓ ' : ''}
                    {col}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Target Output Column
            </h4>
            <select
              value={selectedTarget}
              onChange={(e) => {
                const next = e.target.value;
                onChangeTarget(next);
                if (selectedFeatures.includes(next)) {
                  const rest = selectedFeatures.filter((c) => c !== next);
                  if (rest.length > 0) onChangeFeatures(rest);
                }
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900"
            >
              {activeDataset.headers.map((col) => (
                <option key={col} value={col}>
                  {col} ({activeDataset.numericColumns.includes(col) ? 'Numeric' : 'Categorical'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Data Preview Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-xs font-mono tabular-nums text-left">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-700">
              <tr>
                <th className="px-3 py-2 text-slate-400">#</th>
                {activeDataset.headers.map((h) => (
                  <th key={h} className="px-3 py-2 whitespace-nowrap font-semibold">
                    {h}
                    {h === selectedTarget ? ' (Target)' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeDataset.rows.slice(0, 10).map((row, rIdx) => (
                <tr key={rIdx} className="hover:bg-slate-50">
                  <td className="px-3 py-1.5 text-slate-400">{rIdx + 1}</td>
                  {row.map((val, cIdx) => (
                    <td key={cIdx} className="px-3 py-1.5 text-slate-800 whitespace-nowrap">
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="text-xs text-slate-500 tabular-nums">
          Showing first {Math.min(10, activeDataset.rows.length)} of {activeDataset.rows.length} loaded rows.
        </div>
      </div>
    </div>
  );
}
