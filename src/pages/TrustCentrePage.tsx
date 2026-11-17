import React, { useMemo, useState } from 'react';
import { CheckCircle2, ExternalLink, Play, ShieldCheck, XCircle } from 'lucide-react';
import { EXPERIMENTS } from '../engine/experiments';
import { runModelRegistrySelfTests, type ModelSelfTestResult } from '../engine/modelRegistry';
import { Accordion } from '../components/ui/Accordion';
import { useLab } from '../context/LabContext';

export function TrustCentrePage() {
  const { navigate } = useLab();
  const [query, setQuery] = useState('');
  const [selfTestResults, setSelfTestResults] = useState<ModelSelfTestResult[] | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXPERIMENTS;
    return EXPERIMENTS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.formula.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Verified Formulas · Explicit Ranges &amp; Limitations
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Scientific Trust Centre
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Inspect every formula, calculation method, physical unit, assumption, validity range, limitation, and verified reference powering our Virtual Lab.
          </p>
        </div>

        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter models (e.g. Arrhenius, pH, Ohm)..."
          className="px-4 py-2.5 rounded-lg bg-white border border-slate-200 text-sm text-slate-900 w-full sm:w-72"
        />
      </div>

      {/* Deterministic Model Registry Self-Test Runner */}
      <div className="rounded-xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Deterministic Scientific Model Self-Tests
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Execute live verification checks across all 10 mathematical models and core physical invariants (e.g. Boiling Point at 101.325 kPa = 100 °C, 1 m Pendulum ≈ 2.006 s, Ohm’s Law 5 V / 10 Ω = 0.5 A).
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelfTestResults(runModelRegistrySelfTests())}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[38px]"
          >
            <Play className="w-3.5 h-3.5" />
            Run Deterministic Model Self-Tests
          </button>
        </div>

        {selfTestResults && (
          <div className="grid sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100 text-xs">
            {selfTestResults.map((res) => (
              <div
                key={res.modelId}
                className={`rounded-lg border p-3 flex items-start gap-2.5 ${
                  res.passed
                    ? 'border-emerald-200 bg-emerald-50'
                    : 'border-rose-200 bg-rose-50'
                }`}
              >
                {res.passed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                )}
                <div className="min-w-0">
                  <div className="font-semibold text-slate-900">{res.name}</div>
                  <div className="text-slate-600 font-mono text-[11px] mt-0.5">{res.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filtered.map((exp) => (
          <Accordion
            key={exp.id}
            title={`#${exp.number} · ${exp.title}`}
            subtitle={`${exp.subject} · ${exp.formula} · Validity: ${exp.validityRange}`}
          >
            <div className="space-y-4 pt-2">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-900">Formula &amp; Calculation Method</div>
                  <div className="font-mono text-xs text-blue-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                    {exp.formula}
                  </div>
                  <p className="text-xs text-slate-600">{exp.formulaDescription}</p>
                  <div className="text-xs text-slate-800">
                    <strong>Units:</strong> {exp.unitsSummary}
                  </div>
                  <div className="text-xs text-slate-800">
                    <strong>Validity Range:</strong> {exp.validityRange}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-1">Assumptions</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      {exp.assumptions.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-slate-900 mb-1">Limitations</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                      {exp.limitations.map((l, i) => (
                        <li key={i}>{l}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-4">
                  {exp.references.map((ref) => (
                    <a
                      key={ref.url}
                      href={ref.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      {ref.title} ({ref.source}) <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => navigate('virtual-lab', { experimentId: exp.id })}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Open Simulation →
                </button>
              </div>
            </div>
          </Accordion>
        ))}
      </div>
    </div>
  );
}
