import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, ArrowRight, Film, GitCompare, RotateCcw, Sparkles } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EXPERIMENTS, getDefaultParams, getExperimentById } from '../engine/experiments';

interface QuickScenario {
  label: string;
  experimentId: string;
  apply: (defaults: Record<string, number>) => Record<string, number>;
  assumptionChange: string;
}

const PRESET_SCENARIOS: QuickScenario[] = [
  {
    label: 'What if gravity were half (Moon-like ~4.90 m/s²)?',
    experimentId: 'pendulum-period',
    apply: (d) => ({ ...d, gravity: 4.91 }),
    assumptionChange: 'Gravitational field strength g reduced from 9.81 m/s² to 4.91 m/s².',
  },
  {
    label: 'What if resistance doubled (10 Ω → 20 Ω)?',
    experimentId: 'voltage-current',
    apply: (d) => ({ ...d, resistance: 20 }),
    assumptionChange: 'Ohmic conductor resistance doubled at fixed 5 V DC supply.',
  },
  {
    label: 'What if external pressure dropped to 40 kPa?',
    experimentId: 'boiling-point',
    apply: (d) => ({ ...d, pressure: 40 }),
    assumptionChange: 'External atmospheric load reduced to 40 kPa (high-altitude regime).',
  },
  {
    label: 'What if reaction temperature increased by +30 K?',
    experimentId: 'reaction-rate',
    apply: (d) => ({ ...d, temperature: 333.15 }),
    assumptionChange: 'Thermal kinetic energy increased by 30 K while activation energy Ea stays fixed.',
  },
];

export function WhatIfStudioPage() {
  const { activeExperimentId, setActiveExperimentId, recordWhatIfExploration, navigate, setSmartLearningPrefillQuery } = useLab();

  const experiment = useMemo(() => getExperimentById(activeExperimentId), [activeExperimentId]);
  const defaults = useMemo(() => getDefaultParams(experiment), [experiment]);

  const [originalParams, setOriginalParams] = useState<Record<string, number>>(defaults);
  const [hypoParams, setHypoParams] = useState<Record<string, number>>(defaults);
  const [stressTestInput, setStressTestInput] = useState<string>('');
  const [assumptionNote, setAssumptionNote] = useState(
    'Adjust any parameter below or select a What If preset to compare original vs hypothetical assumptions.'
  );
  const [showGraph, setShowGraph] = useState(false);

  useEffect(() => {
    setOriginalParams(defaults);
    setStressTestInput(String(experiment.parameters[0]?.defaultValue ?? ''));
    setHypoParams({
      ...defaults,
      [experiment.parameters[0]?.key ?? '']:
        experiment.parameters[0]
          ? Number(
              Math.min(
                experiment.parameters[0].max,
                experiment.parameters[0].defaultValue * 1.5
              ).toFixed(2)
            )
          : 0,
    });
  }, [experiment, defaults]);

  const firstParam = experiment.parameters[0];
  const stressBoundaryStatus = useMemo(() => {
    if (!firstParam || stressTestInput.trim() === '') return null;
    const num = Number(stressTestInput);
    if (!Number.isFinite(num)) {
      return { outOfRange: true, message: 'Invalid non-numeric input cannot enter physical solver.' };
    }
    if (num < firstParam.min || num > firstParam.max) {
      return {
        outOfRange: true,
        message: `Boundary Exceeded (${num} ${firstParam.unit} is outside validated domain [${firstParam.min}, ${firstParam.max}] ${firstParam.unit}): The idealized model assumptions break down here (${experiment.limitations[0] || experiment.validityRange}), so OmniLab strictly refuses to fabricate extrapolated output.`,
      };
    }
    return {
      outOfRange: false,
      message: `Within validated range [${firstParam.min}, ${firstParam.max}] ${firstParam.unit}. Safe to run inside main simulation.`,
    };
  }, [firstParam, stressTestInput, experiment]);

  const origResult = useMemo(() => experiment.calculate(originalParams), [experiment, originalParams]);
  const hypoResult = useMemo(() => experiment.calculate(hypoParams), [experiment, hypoParams]);

  const numericalDiff = Number((hypoResult.primaryValue - origResult.primaryValue).toFixed(4));

  const comparisonCurveData = useMemo(() => {
    return origResult.curvePoints.map((pt, idx) => ({
      x: pt.x,
      original: pt.y,
      hypothetical: hypoResult.curvePoints[idx]?.y ?? pt.y,
    }));
  }, [origResult.curvePoints, hypoResult.curvePoints]);

  const applyPreset = (preset: QuickScenario) => {
    setActiveExperimentId(preset.experimentId);
    const targetExp = getExperimentById(preset.experimentId);
    const d = getDefaultParams(targetExp);
    setOriginalParams(d);
    setHypoParams(preset.apply(d));
    setAssumptionNote(preset.assumptionChange);
    recordWhatIfExploration();
  };

  return (
    <div className="space-y-6 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Hypothetical Inquiry · Assumption Diff
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            What If Studio &amp; Assumption Diff
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Challenge a condition, inspect parameter shifts side-by-side, and compare original versus hypothetical curves.
          </p>
        </div>

        <select
          aria-label="Select experiment for What If comparison"
          value={experiment.id}
          onChange={(e) => {
            setActiveExperimentId(e.target.value);
            recordWhatIfExploration();
          }}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
        >
          {EXPERIMENTS.map((exp) => (
            <option key={exp.id} value={exp.id}>
              #{exp.number} · {exp.shortTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Quick Presets */}
      <div className="flex flex-wrap gap-2">
        {PRESET_SCENARIOS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => applyPreset(preset)}
            className="px-3 py-2 rounded-lg text-xs font-medium bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:border-blue-400 transition-colors"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Parameter Editors: Original vs Hypothetical */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-slate-900">Baseline / Original Parameters</h2>
            <button
              type="button"
              onClick={() => setOriginalParams(defaults)}
              className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          </div>
          {experiment.parameters.map((p) => (
            <div key={`orig-${p.key}`} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-600">{p.label} ({p.symbol})</span>
                <span className="font-mono tabular-nums text-slate-900 font-semibold">
                  {originalParams[p.key] ?? p.defaultValue} {p.unit}
                </span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={originalParams[p.key] ?? p.defaultValue}
                onChange={(e) => {
                  setOriginalParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }));
                  recordWhatIfExploration();
                }}
                className="w-full accent-blue-700"
              />
            </div>
          ))}
          <div className="pt-3 border-t border-slate-100">
            <div className="text-xs text-slate-500">Original Calculated Result</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-blue-700 mt-0.5">
              {origResult.primaryValue} {origResult.primaryUnit}
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-amber-300 bg-amber-50/40 p-5 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-amber-800">
              HYPOTHETICAL MODEL OUTCOME
            </h2>
            <span className="text-xs font-mono text-amber-700">Modified Condition</span>
          </div>
          {experiment.parameters.map((p) => (
            <div key={`hypo-${p.key}`} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-700">{p.label} ({p.symbol})</span>
                <span className="font-mono tabular-nums text-amber-800 font-semibold">
                  {hypoParams[p.key] ?? p.defaultValue} {p.unit}
                </span>
              </div>
              <input
                type="range"
                min={p.min}
                max={p.max}
                step={p.step}
                value={hypoParams[p.key] ?? p.defaultValue}
                onChange={(e) => {
                  setHypoParams((prev) => ({ ...prev, [p.key]: Number(e.target.value) }));
                  recordWhatIfExploration();
                }}
                className="w-full accent-amber-600"
              />
            </div>
          ))}
          <div className="pt-3 border-t border-amber-200/70">
            <div className="text-xs text-slate-600">Hypothetical Calculated Result</div>
            <div className="text-2xl font-mono font-bold tabular-nums text-amber-700 mt-0.5">
              {hypoResult.primaryValue} {hypoResult.primaryUnit}
            </div>
          </div>
        </div>
      </div>

      {/* Assumption Diff Table */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-blue-700" />
            <h3 className="text-base font-semibold text-slate-900">Assumption Diff Summary</h3>
          </div>
          <button
            type="button"
            onClick={() => setShowGraph((g) => !g)}
            className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800"
          >
            {showGraph ? 'Hide Comparison Graph' : 'Show Comparison Graph'}
          </button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 text-sm">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-600">Numerical Difference (Hypothetical − Original)</div>
            <div className="text-xl font-mono font-bold tabular-nums text-slate-900 mt-1">
              {numericalDiff > 0 ? `+${numericalDiff}` : numericalDiff} {origResult.primaryUnit}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-600">Changed Parameters</div>
            <div className="text-xs text-slate-900 mt-1 space-y-1 font-mono tabular-nums">
              {experiment.parameters.map((p) => {
                const o = originalParams[p.key] ?? p.defaultValue;
                const h = hypoParams[p.key] ?? p.defaultValue;
                return (
                  <div key={p.key}>
                    {p.symbol}: {o} → {h} {p.unit}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <div className="text-xs text-slate-600">Assumption &amp; Regime Note</div>
            <p className="text-xs text-slate-900 mt-1">{assumptionNote}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100 text-xs">
          <div>
            <div className="font-semibold text-slate-900 mb-1">Original Model Assumptions</div>
            <ul className="list-disc pl-4 space-y-1 text-slate-600">
              {experiment.assumptions.map((a, idx) => (
                <li key={idx}>{a}</li>
              ))}
            </ul>
          </div>
          <div>
            <div className="font-semibold text-amber-700 mb-1">Hypothetical Boundary Check</div>
            <p className="text-slate-600">
              Validity range: {experiment.validityRange}. Hypothetical outputs remain bounded to validated model limits and do not represent unverified real-world extrapolation.
            </p>
          </div>
        </div>

        {/* Out-of-Range Boundary Stress Test */}
        {firstParam && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              Out-of-Range Boundary Stress Test ({firstParam.label})
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label htmlFor="stress-input" className="text-slate-600">
                Enter extreme test value ({firstParam.unit}):
              </label>
              <input
                id="stress-input"
                type="number"
                step="any"
                value={stressTestInput}
                onChange={(e) => {
                  setStressTestInput(e.target.value);
                  recordWhatIfExploration();
                }}
                className="w-32 px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 font-mono text-slate-900"
              />
              <button
                type="button"
                onClick={() => setStressTestInput(String(firstParam.min <= 0 ? firstParam.max * 2 : 0))}
                className="px-2.5 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 font-semibold"
              >
                Test Extreme Edge ({firstParam.min <= 0 ? firstParam.max * 2 : 0})
              </button>
            </div>
            {stressBoundaryStatus && (
              <div
                className={`rounded-lg border px-3 py-2 ${
                  stressBoundaryStatus.outOfRange
                    ? 'border-rose-200 bg-rose-50 text-rose-900 font-medium'
                    : 'border-emerald-200 bg-emerald-50 text-emerald-900'
                }`}
              >
                {stressBoundaryStatus.message}
              </div>
            )}
          </div>
        )}

        {showGraph && (
          <div className="pt-4 border-t border-slate-100 h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={comparisonCurveData} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="x"
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                />
                <YAxis stroke="#64748B" tick={{ fill: '#475569', fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    color: '#0F172A',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="original"
                  name={`Original (${origResult.primaryUnit})`}
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="hypothetical"
                  name={`Hypothetical (${hypoResult.primaryUnit})`}
                  stroke="#D97706"
                  strokeWidth={2.5}
                  strokeDasharray="6 4"
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="flex flex-wrap justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              setSmartLearningPrefillQuery(experiment.title);
              navigate('smart-learning');
            }}
            className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5 hover:underline"
          >
            <Film className="w-3.5 h-3.5" />
            Watch Animated Concept Video for {experiment.shortTitle}
          </button>
          <button
            type="button"
            onClick={() => navigate('virtual-lab', { experimentId: experiment.id })}
            className="text-xs font-semibold text-blue-700 flex items-center gap-1 hover:underline"
          >
            Run full trials in Virtual Lab <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
