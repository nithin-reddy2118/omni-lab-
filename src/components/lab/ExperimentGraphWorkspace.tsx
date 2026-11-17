import React, { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ExperimentCalculationResult, ExperimentDefinition, TrialRecord } from '../../types/science';
import { Accordion } from '../ui/Accordion';

type GraphType = 'curve' | 'line' | 'scatter' | 'bar';

interface ExperimentGraphWorkspaceProps {
  experiment: ExperimentDefinition;
  currentParams: Record<string, number>;
  result: ExperimentCalculationResult;
  trials: TrialRecord[];
  baselineParams?: Record<string, number>;
}

export function ExperimentGraphWorkspace({
  experiment,
  currentParams,
  result,
  trials,
}: ExperimentGraphWorkspaceProps) {
  const [graphType, setGraphType] = useState<GraphType>('curve');
  const [showSecondaryPendulum, setShowSecondaryPendulum] = useState(false);
  const [compareTrialIds, setCompareTrialIds] = useState<string[]>([]);

  const primaryXKey = experiment.parameters[0]?.key ?? '';
  const currentX = currentParams[primaryXKey] ?? experiment.parameters[0]?.defaultValue ?? 0;

  const isSecondaryActive =
    experiment.id === 'pendulum-period' && showSecondaryPendulum && result.secondaryCurveLabel;

  const activeYAxisLabel = isSecondaryActive
    ? result.secondaryYAxisLabel || result.yAxisLabel
    : result.yAxisLabel;
  const activeYAxisUnit = isSecondaryActive
    ? result.secondaryYAxisUnit || result.yAxisUnit
    : result.yAxisUnit;

  const chartData = useMemo(() => {
    return result.curvePoints.map((pt) => ({
      x: pt.x,
      modelY: isSecondaryActive ? pt.secondaryY ?? pt.y : pt.y,
    }));
  }, [result.curvePoints, isSecondaryActive]);

  const currentY = isSecondaryActive
    ? Number((result.primaryValue * result.primaryValue).toFixed(3))
    : result.primaryValue;

  const selectedTrials = useMemo(
    () => trials.filter((t) => compareTrialIds.includes(t.id)),
    [trials, compareTrialIds]
  );

  const toggleTrialCompare = (id: string) => {
    setCompareTrialIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      {/* Graph Controls */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-600 mr-1">Chart Type:</span>
          {(
            [
              { id: 'curve', label: 'Scientific Curve' },
              { id: 'line', label: 'Line Graph' },
              { id: 'scatter', label: 'Scatter Plot' },
              { id: 'bar', label: 'Bar Chart' },
            ] as { id: GraphType; label: string }[]
          ).map((opt) => (
            <button
              key={opt.id}
              type="button"
              onClick={() => setGraphType(opt.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                graphType === opt.id
                  ? 'bg-blue-700 text-white font-semibold'
                  : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {experiment.id === 'pendulum-period' && (
          <button
            type="button"
            onClick={() => setShowSecondaryPendulum((s) => !s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors whitespace-nowrap ${
              showSecondaryPendulum
                ? 'bg-blue-50 border-blue-600 text-blue-800 font-semibold'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {showSecondaryPendulum ? 'Showing: Length vs T²' : 'Switch to: Length vs T²'}
          </button>
        )}
      </div>

      {/* Main Chart Container */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
          <div>
            <h4 className="text-base font-semibold text-slate-900">
              {experiment.shortTitle}: {result.xAxisLabel} ({result.xAxisUnit}) vs {activeYAxisLabel} ({activeYAxisUnit})
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">{result.validityNote}</p>
          </div>
          <div className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
            Active Point: ({currentX} {result.xAxisUnit}, {currentY} {activeYAxisUnit})
          </div>
        </div>

        <div className="h-[340px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            {graphType === 'bar' ? (
              <BarChart data={chartData} margin={{ top: 12, right: 24, left: 12, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="x"
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  label={{
                    value: `${result.xAxisLabel} (${result.xAxisUnit})`,
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#475569',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  label={{
                    value: `${activeYAxisLabel} (${activeYAxisUnit})`,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#475569',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                  }}
                  formatter={(value: unknown) => [`${value} ${activeYAxisUnit}`, activeYAxisLabel]}
                  labelFormatter={(label: unknown) => `${result.xAxisLabel}: ${label} ${result.xAxisUnit}`}
                />
                <Legend wrapperStyle={{ paddingTop: '12px' }} />
                <Bar dataKey="modelY" name={`${activeYAxisLabel} (${activeYAxisUnit})`} fill="#1D4ED8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : graphType === 'scatter' ? (
              <ScatterChart margin={{ top: 12, right: 24, left: 12, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  name={result.xAxisLabel}
                  unit={` ${result.xAxisUnit}`}
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  label={{
                    value: `${result.xAxisLabel} (${result.xAxisUnit})`,
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#475569',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  type="number"
                  dataKey="modelY"
                  name={activeYAxisLabel}
                  unit={` ${activeYAxisUnit}`}
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ strokeDasharray: '3 3' }}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                  }}
                />
                <Legend wrapperStyle={{ paddingTop: '12px' }} />
                <Scatter
                  name="Calculated Model Points"
                  data={chartData}
                  fill="#1D4ED8"
                />
                {selectedTrials.length > 0 && (
                  <Scatter
                    name="Selected Saved Trials"
                    data={selectedTrials.map((t) => ({
                      x: t.inputs[primaryXKey] ?? 0,
                      modelY: isSecondaryActive
                        ? Number((t.primaryOutput.value * t.primaryOutput.value).toFixed(3))
                        : t.primaryOutput.value,
                    }))}
                    fill="#D97706"
                  />
                )}
              </ScatterChart>
            ) : (
              <LineChart data={chartData} margin={{ top: 12, right: 24, left: 12, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  type="number"
                  dataKey="x"
                  domain={['auto', 'auto']}
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  label={{
                    value: `${result.xAxisLabel} (${result.xAxisUnit})`,
                    position: 'insideBottom',
                    offset: -12,
                    fill: '#475569',
                    fontSize: 12,
                  }}
                />
                <YAxis
                  stroke="#64748B"
                  tick={{ fill: '#475569', fontSize: 12 }}
                  label={{
                    value: `${activeYAxisLabel} (${activeYAxisUnit})`,
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#475569',
                    fontSize: 12,
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    color: '#0F172A',
                  }}
                  formatter={(value: unknown) => [`${value} ${activeYAxisUnit}`, activeYAxisLabel]}
                  labelFormatter={(label: unknown) => `${result.xAxisLabel}: ${label} ${result.xAxisUnit}`}
                />
                <Legend wrapperStyle={{ paddingTop: '12px' }} />
                <Line
                  type={graphType === 'curve' ? 'monotone' : 'linear'}
                  dataKey="modelY"
                  name={`Calculated ${activeYAxisLabel} (${activeYAxisUnit})`}
                  stroke="#1D4ED8"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: '#1D4ED8' }}
                  activeDot={{ r: 6, fill: '#FFFFFF', stroke: '#1D4ED8' }}
                />
                <ReferenceDot
                  x={currentX}
                  y={currentY}
                  r={6}
                  fill="#059669"
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
                {selectedTrials.map((t) => {
                  const tx = t.inputs[primaryXKey] ?? 0;
                  const ty = isSecondaryActive
                    ? Number((t.primaryOutput.value * t.primaryOutput.value).toFixed(3))
                    : t.primaryOutput.value;
                  return (
                    <ReferenceDot
                      key={t.id}
                      x={tx}
                      y={ty}
                      r={6}
                      fill="#D97706"
                      stroke="#FFFFFF"
                      strokeWidth={2}
                    />
                  );
                })}
              </LineChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* Trial Comparison Selector */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="text-sm font-semibold text-slate-900 mb-2">
          Overlay Saved Trials on Graph
        </div>
        {trials.length === 0 ? (
          <p className="text-xs text-slate-500">
            No saved trials yet for this experiment. Save trials in the Experiment or Trials tab to overlay and compare them here.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {trials.map((t) => {
              const selected = compareTrialIds.includes(t.id);
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTrialCompare(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono border transition-colors ${
                    selected
                      ? 'bg-amber-50 border-amber-500 text-amber-900 font-semibold'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {t.name}: {t.primaryOutput.value} {t.primaryOutput.unit}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Graph Interpretation Accordion */}
      <Accordion
        title="Graph Interpretation & Scientific Explanation"
        subtitle="Click to expand X-axis, Y-axis, trend, slope meaning, and conclusion"
      >
        <div className="grid sm:grid-cols-2 gap-4 pt-2">
          <div>
            <div className="text-xs font-semibold text-slate-900">What does the X-axis mean?</div>
            <p className="text-xs text-slate-600 mt-1">{experiment.graphInterpretation.xAxisMeaning}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">What does the Y-axis mean?</div>
            <p className="text-xs text-slate-600 mt-1">{experiment.graphInterpretation.yAxisMeaning}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">What relationship is visible?</div>
            <p className="text-xs text-slate-600 mt-1">{experiment.graphInterpretation.relationship}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">What trend appears?</div>
            <p className="text-xs text-slate-600 mt-1">{experiment.graphInterpretation.trend}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">What does the slope mean?</div>
            <p className="text-xs text-slate-600 mt-1">{experiment.graphInterpretation.slopeMeaning}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-slate-900">Scientific conclusion & limitations</div>
            <p className="text-xs text-slate-600 mt-1">
              {experiment.graphInterpretation.conclusion} ({experiment.graphInterpretation.limitations})
            </p>
          </div>
        </div>
      </Accordion>
    </div>
  );
}
