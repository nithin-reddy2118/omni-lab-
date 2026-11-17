import React, { useState } from 'react';
import {
  Play,
  SlidersHorizontal,
  BarChart3,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
} from 'recharts';
import type { LoadedDataset, MlEvaluationResult } from '../../types/algorithm';
import { runRealMlExperiment, type MlRunRequest } from '../../engine/mlEngine';

interface Props {
  dataset: LoadedDataset;
  selectedFeatures: string[];
  selectedTarget: string;
}

const ML_MODELS: { id: MlRunRequest['algorithmId']; label: string; kind: 'regression' | 'classification' | 'clustering' }[] = [
  { id: 'linear-regression', label: 'Linear Regression (Gradient Descent)', kind: 'regression' },
  { id: 'logistic-regression', label: 'Logistic Regression (Binary Sigmoid)', kind: 'classification' },
  { id: 'decision-tree', label: 'Decision Tree (Gini / Variance Split)', kind: 'classification' },
  { id: 'knn', label: 'K-Nearest Neighbors (KNN)', kind: 'classification' },
  { id: 'neural-network', label: 'Neural Network (MLP 2-Layer Backprop)', kind: 'classification' },
  { id: 'k-means', label: 'K-Means Clustering (Unsupervised)', kind: 'clustering' },
];

export function MlPlaygroundPanel({ dataset, selectedFeatures, selectedTarget }: Props) {
  const targetIsNumeric = dataset.numericColumns.includes(selectedTarget);
  const [modelId, setModelId] = useState<MlRunRequest['algorithmId']>(
    targetIsNumeric ? 'linear-regression' : 'decision-tree'
  );
  const [testRatio, setTestRatio] = useState(0.25);
  const [learningRate, setLearningRate] = useState(0.08);
  const [iterations, setIterations] = useState(40);
  const [kValue, setKValue] = useState(3);
  const [maxDepth, setMaxDepth] = useState(3);
  const [result, setResult] = useState<MlEvaluationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRun = () => {
    setError(null);
    try {
      const evalRes = runRealMlExperiment({
        dataset,
        featureCols: selectedFeatures,
        targetCol: selectedTarget,
        algorithmId: modelId,
        testRatio,
        learningRate,
        iterations,
        kValue,
        maxDepth,
      });
      setResult(evalRes);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : 'Training failed.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Control Panel */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <SlidersHorizontal className="w-4 h-4" />
              <span>Machine Learning Training Playground</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-slate-900">
              Train, Split & Evaluate Real Models on "{dataset.name}"
            </h2>
            <p className="text-xs text-slate-600 mt-0.5 font-mono">
              Features: [{selectedFeatures.join(', ')}] · Target: {selectedTarget} · Rows: {dataset.rows.length}
            </p>
          </div>

          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Train & Evaluate Model</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Algorithm Model</label>
            <select
              value={modelId}
              onChange={(e) => setModelId(e.target.value as MlRunRequest['algorithmId'])}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm text-slate-900"
            >
              {ML_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              Test Split Ratio: {Math.round(testRatio * 100)}% Test / {Math.round((1 - testRatio) * 100)}% Train
            </label>
            <input
              type="range"
              min="0.15"
              max="0.45"
              step="0.05"
              value={testRatio}
              onChange={(e) => setTestRatio(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              Learning Rate (α): {learningRate}
            </label>
            <input
              type="range"
              min="0.01"
              max="0.3"
              step="0.01"
              value={learningRate}
              onChange={(e) => setLearningRate(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              Training Iterations / Epochs: {iterations}
            </label>
            <input
              type="range"
              min="10"
              max="120"
              step="10"
              value={iterations}
              onChange={(e) => setIterations(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              K (for KNN / K-Means): {kValue}
            </label>
            <input
              type="range"
              min="2"
              max="9"
              step="1"
              value={kValue}
              onChange={(e) => setKValue(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 tabular-nums">
              Max Tree Depth (Decision Tree): {maxDepth}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={maxDepth}
              onChange={(e) => setMaxDepth(Number(e.target.value))}
              className="w-full accent-blue-700"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
          <div>
            <strong>Cannot run selected model on this configuration:</strong> {error}
          </div>
        </div>
      )}

      {!result && !error && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          Click <strong className="text-slate-900">Train & Evaluate Model</strong> to perform a real standardized train/test split and calculate genuine evaluation metrics.
        </div>
      )}

      {result && (
        <div className="space-y-6">
          {/* Genuine Metric Strip */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 px-4 py-3 text-xs text-emerald-900 flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Trained {result.algorithmName} on {result.trainCount} training samples · Evaluated on {result.testCount} held-out test samples
            </span>
            <span className="font-mono tabular-nums">Measured Runtime: {result.runtimeMs} ms</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {result.task === 'classification' && (
              <>
                <MetricCard label="Test Accuracy" value={`${((result.accuracy ?? 0) * 100).toFixed(1)}%`} />
                <MetricCard label="Macro Precision" value={`${((result.precision ?? 0) * 100).toFixed(1)}%`} />
                <MetricCard label="Macro Recall" value={`${((result.recall ?? 0) * 100).toFixed(1)}%`} />
                <MetricCard label="Macro F1 Score" value={`${((result.f1Score ?? 0) * 100).toFixed(1)}%`} />
              </>
            )}
            {result.task === 'regression' && (
              <>
                <MetricCard label="Test MSE" value={String(result.mse ?? 0)} />
                <MetricCard label="Test MAE" value={String(result.mae ?? 0)} />
                <MetricCard label="Test R² Score" value={String(result.rSquared ?? 0)} />
                <MetricCard label="Test Samples" value={String(result.testCount)} />
              </>
            )}
            {result.task === 'clustering' && (
              <>
                <MetricCard label="Clusters (K)" value={String(result.clusterSizes?.length ?? kValue)} />
                <MetricCard label="Total Inertia" value={String(result.inertia ?? 0)} />
                <MetricCard label="Samples Clustered" value={String(result.trainCount)} />
                <MetricCard label="Runtime" value={`${result.runtimeMs} ms`} />
              </>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Training Progress Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-blue-700" />
                <span>{result.epochs[0]?.metricLabel ?? 'Training Progress'}</span>
              </h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={result.epochs}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="iteration" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="metricValue" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Confusion Matrix OR Actual vs Predicted Scatter */}
            {result.confusionMatrix && result.classLabels && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 overflow-x-auto">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Held-Out Test Confusion Matrix
                </h3>
                <table className="w-full text-xs font-mono tabular-nums border-collapse">
                  <thead>
                    <tr>
                      <th className="p-2 border border-slate-200 bg-slate-50 text-left text-slate-600">
                        Actual \ Pred
                      </th>
                      {result.classLabels.map((lbl) => (
                        <th key={lbl} className="p-2 border border-slate-200 bg-slate-50 text-center text-slate-800">
                          {lbl}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {result.confusionMatrix.map((row, rIdx) => (
                      <tr key={rIdx}>
                        <td className="p-2 border border-slate-200 bg-slate-50 font-semibold text-slate-800">
                          {result.classLabels![rIdx]}
                        </td>
                        {row.map((cnt, cIdx) => (
                          <td
                            key={cIdx}
                            className={`p-2 border border-slate-200 text-center font-bold ${
                              rIdx === cIdx && cnt > 0
                                ? 'bg-emerald-50 text-emerald-900'
                                : cnt > 0
                                ? 'bg-rose-50 text-rose-900'
                                : 'bg-white text-slate-400'
                            }`}
                          >
                            {cnt}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.actualVsPredicted && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">
                  Actual vs Predicted Values (Test Split)
                </h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                      <XAxis dataKey="actual" name="Actual" tick={{ fontSize: 11, fill: '#475569' }} />
                      <YAxis dataKey="predicted" name="Predicted" tick={{ fontSize: 11, fill: '#475569' }} />
                      <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                      <Scatter data={result.actualVsPredicted} fill="#0D9488" />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {result.clusterSizes && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-sm font-bold text-slate-900 mb-3">Cluster Assignments</h3>
                <div className="space-y-2">
                  {result.clusterSizes.map((c) => (
                    <div key={c.cluster} className="flex items-center justify-between text-xs font-mono border-b border-slate-100 pb-2">
                      <span className="font-semibold text-slate-800">{c.cluster}</span>
                      <span className="text-blue-700 font-bold tabular-nums">{c.count} points</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Feature Importance & Step Log */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {result.featureImportance && (
              <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3">
                <h3 className="text-sm font-bold text-slate-900">Normalized Feature Influence</h3>
                {result.featureImportance.map((fi) => (
                  <div key={fi.feature} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono text-slate-700 tabular-nums">
                      <span>{fi.feature}</span>
                      <span>{(fi.score * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full"
                        style={{ width: `${Math.min(100, Math.round(fi.score * 100))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2">
              <h3 className="text-sm font-bold text-slate-900">Sample Test Predictions</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono tabular-nums text-left">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="px-2.5 py-1.5">Actual</th>
                      <th className="px-2.5 py-1.5">Predicted</th>
                      <th className="px-2.5 py-1.5">Features</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {result.predictionsSample.slice(0, 6).map((p, idx) => (
                      <tr key={idx}>
                        <td className="px-2.5 py-1.5 font-semibold text-slate-800">{String(p.actual)}</td>
                        <td className="px-2.5 py-1.5 text-blue-700 font-semibold">{String(p.predicted)}</td>
                        <td className="px-2.5 py-1.5 text-slate-500">{p.featuresSummary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
      <div className="text-xs font-medium text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold text-slate-900 font-mono tabular-nums">{value}</div>
    </div>
  );
}
