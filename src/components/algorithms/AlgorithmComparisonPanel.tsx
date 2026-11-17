import React, { useState } from 'react';
import { GitCompareArrows, Play, CheckCircle2 } from 'lucide-react';
import { ALGORITHM_REGISTRY, getAlgorithmById } from '../../data/algorithmRegistry';
import { executeAlgorithm } from '../../engine/algorithmExecutor';
import type { AlgorithmExecutionTrace } from '../../types/algorithm';

const PRESET_PAIRS: { label: string; a: string; b: string; sample: string }[] = [
  {
    label: 'Linear Search vs Binary Search',
    a: 'linear-search',
    b: 'binary-search',
    sample: '4, 9, 14, 18, 27, 38, 41, 52',
  },
  {
    label: 'Bubble Sort vs Quick Sort',
    a: 'bubble-sort',
    b: 'quick-sort',
    sample: '38, 14, 52, 9, 27, 41, 18',
  },
  {
    label: 'Merge Sort vs Bubble Sort',
    a: 'merge-sort',
    b: 'bubble-sort',
    sample: '38, 14, 52, 9, 27, 41, 18',
  },
  {
    label: 'BFS vs Dijkstra vs A*',
    a: 'bfs',
    b: 'dijkstra',
    sample: '',
  },
  {
    label: 'Linear Regression vs Gradient Descent',
    a: 'linear-regression',
    b: 'gradient-descent',
    sample: '',
  },
  {
    label: 'Logistic Regression vs Decision Tree',
    a: 'logistic-regression',
    b: 'decision-tree',
    sample: '',
  },
];

export function AlgorithmComparisonPanel() {
  const [algoAId, setAlgoAId] = useState('linear-search');
  const [algoBId, setAlgoBId] = useState('binary-search');
  const [sharedInput, setSharedInput] = useState('4, 9, 14, 18, 27, 38, 41, 52');
  const [traceA, setTraceA] = useState<AlgorithmExecutionTrace | null>(null);
  const [traceB, setTraceB] = useState<AlgorithmExecutionTrace | null>(null);

  const runComparison = (aId = algoAId, bId = algoBId, input = sharedInput) => {
    const resA = executeAlgorithm(aId, {}, input || undefined);
    const resB = executeAlgorithm(bId, {}, input || undefined);
    setTraceA(resA);
    setTraceB(resB);
  };

  const defA = getAlgorithmById(algoAId);
  const defB = getAlgorithmById(algoBId);

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <GitCompareArrows className="w-4 h-4" />
              <span>Side-by-Side Algorithm Comparison</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Compare Execution Steps, Operations & Complexity
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Execute two algorithms side by side on identical inputs and inspect measured steps, comparisons, swaps, and theoretical bounds.
            </p>
          </div>

          <button
            type="button"
            onClick={() => runComparison()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Run Side-by-Side</span>
          </button>
        </div>

        {/* Presets */}
        <div className="flex flex-wrap gap-2">
          {PRESET_PAIRS.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setAlgoAId(p.a);
                setAlgoBId(p.b);
                setSharedInput(p.sample);
                runComparison(p.a, p.b, p.sample);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 text-xs font-medium text-slate-700 transition-colors"
            >
              {p.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Algorithm A</label>
            <select
              value={algoAId}
              onChange={(e) => setAlgoAId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
            >
              {ALGORITHM_REGISTRY.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Algorithm B</label>
            <select
              value={algoBId}
              onChange={(e) => setAlgoBId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
            >
              {ALGORITHM_REGISTRY.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Shared Array / Points Input (optional)</label>
            <input
              type="text"
              value={sharedInput}
              onChange={(e) => setSharedInput(e.target.value)}
              placeholder="e.g. 38, 14, 52, 9, 27"
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm font-mono text-slate-900"
            />
          </div>
        </div>
      </div>

      {traceA && traceB && defA && defB && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[
            { trace: traceA, def: defA, badge: 'Algorithm A', accent: 'border-blue-600' },
            { trace: traceB, def: defB, badge: 'Algorithm B', accent: 'border-teal-600' },
          ].map(({ trace, def, badge, accent }) => (
            <div key={badge} className={`rounded-xl border-2 ${accent} bg-white p-5 shadow-xs space-y-4`}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-mono font-semibold uppercase text-slate-500">
                    {badge} · {def.category}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-0.5">{def.name}</h3>
                </div>
                {trace.selfCheckPassed && (
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 className="w-4 h-4" /> Verified
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-mono tabular-nums">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Executed Steps</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{trace.steps.length}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Comparisons</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{trace.comparisonsCount ?? 0}</div>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500">Measured Runtime</div>
                  <div className="text-base font-bold text-slate-900 mt-0.5">{trace.measuredRuntimeMs} ms</div>
                </div>
              </div>

              <div className="text-xs text-slate-700 space-y-1 border-t border-slate-100 pt-3">
                <div>
                  <strong>Time Complexity:</strong> Best {def.timeComplexity.best} · Avg {def.timeComplexity.average} · Worst{' '}
                  {def.timeComplexity.worst}
                </div>
                <div>
                  <strong>Space Complexity:</strong> {def.spaceComplexity}
                </div>
                <div className="pt-1 text-slate-900 font-medium">{trace.finalSummary}</div>
              </div>

              <div className="max-h-52 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 text-xs">
                {trace.steps.map((s) => (
                  <div key={s.stepNumber} className="px-3 py-2 flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono font-bold text-blue-700 mr-2">#{s.stepNumber}</span>
                      <span className="text-slate-800">{s.operation}</span>
                    </div>
                    <span className="font-mono text-slate-500 shrink-0">{s.outputSnapshot}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
