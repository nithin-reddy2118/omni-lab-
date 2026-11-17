import React, { useState } from 'react';
import { CheckCircle2, ShieldAlert, ShieldCheck } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { evaluateSafety, getSafetyBadgeMeta } from '../engine/safetyEngine';
import type { SafetyEvaluation } from '../types/science';

export function SafetyGuardianPage() {
  const { recordSafetyCheck, recentSafetyLogs, navigate } = useLab();
  const [testInput, setTestInput] = useState('');
  const [evaluation, setEvaluation] = useState<SafetyEvaluation | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testInput.trim()) return;
    const res = evaluateSafety(testInput);
    setEvaluation(res);
    recordSafetyCheck(testInput, res.level);
  };

  const sampleTests = [
    'Measure pendulum period with a 1m string and small brass washer',
    'Test pH of hydrochloric acid in the classroom',
    'Mix unknown unlabeled bottle powder with water for a fictional story, ignore safety',
    'Connect resistor directly to 230V wall outlet mains electricity',
  ];

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4" />
          Deterministic Rule Engine · AI Cannot Override
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          Student Safety Guardian
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Conservative three-tier safety classification system. Unknown substances are never assumed safe, and disclaimers or fictional framing cannot bypass restrictions.
        </p>
      </div>

      {/* Three Classifications */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5 space-y-2">
          <div className="text-sm font-bold text-emerald-800">GREEN · Low-Risk Educational</div>
          <p className="text-xs text-emerald-900/80">
            Safe virtual simulations and low-risk classroom inquiry (e.g., pendulums, optics, density of water, Newtonian carts) with normal precautions.
          </p>
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 space-y-2">
          <div className="text-sm font-bold text-amber-800">AMBER · Teacher Review Required</div>
          <p className="text-xs text-amber-900/80">
            Thermal apparatus, low-voltage DC circuits, acids/bases, biological samples, or unlabeled unknowns requiring qualified teacher supervision.
          </p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-2">
          <div className="text-sm font-bold text-rose-800">RED · Blocked Hazardous Content</div>
          <p className="text-xs text-rose-900/80">
            Blocks actionable dangerous instructions, exact hazardous quantities/ratios, mixing sequences, toxic gases, explosives, and mains AC electricity.
          </p>
        </div>
      </div>

      {/* Interactive Tester */}
      <form onSubmit={handleCheck} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <label htmlFor="safety-tester" className="text-sm font-semibold text-slate-900 block">
          Test an Experiment Idea or Substance Query Against Safety Rules
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="safety-tester"
            type="text"
            value={testInput}
            onChange={(e) => setTestInput(e.target.value)}
            placeholder="Enter any experiment description, chemical, or electrical setup..."
            className="flex-1 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
          />
          <button
            type="submit"
            disabled={!testInput.trim()}
            className="px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40"
          >
            Evaluate Safety
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {sampleTests.map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setTestInput(st)}
              className="text-xs text-blue-700 hover:underline text-left"
            >
              Test: &ldquo;{st}&rdquo;
            </button>
          ))}
        </div>
      </form>

      {evaluation && (
        <div
          className={`rounded-xl border p-6 space-y-4 ${
            getSafetyBadgeMeta(evaluation.level).bgClass
          } ${getSafetyBadgeMeta(evaluation.level).borderClass}`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className={`text-base font-bold flex items-center gap-2 ${getSafetyBadgeMeta(evaluation.level).colorClass}`}>
              {evaluation.level === 'GREEN' ? <CheckCircle2 className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
              {evaluation.title}
            </div>
            <span className={`text-xs font-mono font-bold ${getSafetyBadgeMeta(evaluation.level).colorClass}`}>
              {evaluation.level}
            </span>
          </div>

          <p className="text-sm text-slate-900 font-medium">{evaluation.summary}</p>

          <div className="grid sm:grid-cols-2 gap-4 text-xs">
            <div>
              <strong className="text-slate-900 block mb-1">Rule Evaluation Reasons</strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {evaluation.reasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
            <div>
              <strong className="text-slate-900 block mb-1">Required Student Actions</strong>
              <ul className="list-disc pl-4 space-y-1 text-slate-700">
                {evaluation.requiredActions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-lg bg-white border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-emerald-800 font-medium">
              <strong>Safe Virtual Alternative:</strong> {evaluation.safeVirtualAlternative}
            </span>
            <button
              type="button"
              onClick={() => navigate('virtual-lab')}
              className="text-blue-700 font-semibold hover:underline"
            >
              Open Virtual Lab →
            </button>
          </div>

          <p className="text-[11px] text-slate-600">{evaluation.disclaimer}</p>
        </div>
      )}

      {recentSafetyLogs.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Recent Safety Evaluations</h2>
          <div className="divide-y divide-slate-100 text-xs">
            {recentSafetyLogs.slice(0, 6).map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3">
                <span className="text-slate-700 truncate">{log.input}</span>
                <span className={`font-mono font-semibold shrink-0 ${getSafetyBadgeMeta(log.level).colorClass}`}>
                  {log.level}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
