import React from 'react';
import type { AlgorithmVisualState } from '../../types/algorithm';

interface Props {
  visualState: AlgorithmVisualState;
  stepNumber: number;
  totalSteps: number;
  iterationLabel: string;
}

export function AlgorithmVisualizerCanvas({
  visualState,
  stepNumber,
  totalSteps,
  iterationLabel,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
      <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
          <span className="inline-block w-2 h-2 rounded-full bg-blue-600" />
          <span>Interactive State Canvas</span>
          <span className="text-slate-400">·</span>
          <span className="text-blue-700 font-mono">{iterationLabel}</span>
        </div>
        <div className="text-xs font-mono text-slate-500 tabular-nums">
          Step {stepNumber} / {totalSteps}
        </div>
      </div>

      <div className="p-4 bg-[#FAFBFD]">
        {visualState.kind === 'regression-line' && <RegressionVisual state={visualState} />}
        {visualState.kind === 'cost-descent' && <CostDescentVisual state={visualState} />}
        {visualState.kind === 'decision-boundary' && <DecisionBoundaryVisual state={visualState} />}
        {visualState.kind === 'decision-tree' && <DecisionTreeVisual state={visualState} />}
        {visualState.kind === 'clustering' && <ClusteringVisual state={visualState} />}
        {visualState.kind === 'neural-network' && <NeuralNetworkVisual state={visualState} />}
        {visualState.kind === 'array-bars' && <ArrayBarsVisual state={visualState} />}
        {visualState.kind === 'array-search' && <ArraySearchVisual state={visualState} />}
        {visualState.kind === 'graph-path' && <GraphPathVisual state={visualState} />}
        {visualState.kind === 'dp-table' && <DpTableVisual state={visualState} />}
        {visualState.kind === 'population-ga' && <PopulationGaVisual state={visualState} />}
      </div>
    </div>
  );
}

// 1. Regression Line + Residuals + Cost Curve
function RegressionVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'regression-line' }>;
}) {
  const W = 540;
  const H = 260;
  const pad = 42;
  const xs = state.points.map((p) => p.x);
  const ys = state.points.map((p) => p.y);
  const minX = Math.min(0, ...xs);
  const maxX = Math.max(6, ...xs) * 1.05;
  const minY = Math.min(0, ...ys);
  const maxY = Math.max(12, ...ys) * 1.1;

  const mapX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
  const mapY = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);

  const x1 = minX;
  const x2 = maxX;
  const y1 = state.slope * x1 + state.intercept;
  const y2 = state.slope * x2 + state.intercept;

  const maxCost = Math.max(1, ...state.costHistory.map((c) => c.loss));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
      <div className="lg:col-span-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
          {/* Grid */}
          {[0.25, 0.5, 0.75].map((t) => (
            <line
              key={t}
              x1={pad}
              x2={W - pad}
              y1={pad + t * (H - 2 * pad)}
              y2={pad + t * (H - 2 * pad)}
              stroke="#E2E8F0"
              strokeDasharray="3 3"
            />
          ))}
          <line x1={pad} x2={W - pad} y1={H - pad} y2={H - pad} stroke="#94A3B8" strokeWidth="1.5" />
          <line x1={pad} x2={pad} y1={pad} y2={H - pad} stroke="#94A3B8" strokeWidth="1.5" />

          {/* Residual dashed lines */}
          {state.points.map((p, idx) => {
            const predY = state.slope * p.x + state.intercept;
            return (
              <line
                key={`res-${idx}`}
                x1={mapX(p.x)}
                x2={mapX(p.x)}
                y1={mapY(p.y)}
                y2={mapY(predY)}
                stroke="#F59E0B"
                strokeWidth="1.75"
                strokeDasharray="4 3"
              />
            );
          })}

          {/* Fitted line */}
          <line
            x1={mapX(x1)}
            y1={mapY(y1)}
            x2={mapX(x2)}
            y2={mapY(y2)}
            stroke="#1D4ED8"
            strokeWidth="2.8"
          />

          {/* Data points */}
          {state.points.map((p, idx) => (
            <g key={`pt-${idx}`}>
              <circle
                cx={mapX(p.x)}
                cy={mapY(p.y)}
                r={state.highlightPointIndex === idx ? 7 : 5.5}
                fill="#0D9488"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
              <text
                x={mapX(p.x) + 7}
                y={mapY(p.y) - 6}
                className="text-[10px] font-mono fill-slate-600"
              >
                ({p.x},{p.y})
              </text>
            </g>
          ))}

          <text x={pad} y={24} className="text-[12px] font-mono font-semibold fill-slate-800">
            ŷ = {state.slope.toFixed(3)}x + {state.intercept.toFixed(3)}   ·   MSE = {state.mse.toFixed(4)}
          </text>
        </svg>
      </div>

      {/* Cost decay spark chart */}
      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">Loss Convergence (MSE)</div>
        <svg viewBox="0 0 220 140" className="w-full h-auto">
          <line x1="25" y1="115" x2="205" y2="115" stroke="#CBD5E1" />
          <line x1="25" y1="15" x2="25" y2="115" stroke="#CBD5E1" />
          {state.costHistory.length > 1 && (
            <polyline
              fill="none"
              stroke="#1D4ED8"
              strokeWidth="2.2"
              points={state.costHistory
                .map((pt, i) => {
                  const cx = 28 + (i / Math.max(1, state.costHistory.length - 1)) * 172;
                  const cy = 112 - (pt.loss / maxCost) * 90;
                  return `${cx},${cy}`;
                })
                .join(' ')}
            />
          )}
          {state.costHistory.map((pt, i) => {
            const cx = 28 + (i / Math.max(1, state.costHistory.length - 1)) * 172;
            const cy = 112 - (pt.loss / maxCost) * 90;
            return <circle key={i} cx={cx} cy={cy} r="2.8" fill="#1D4ED8" />;
          })}
        </svg>
        <div className="mt-2 flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
          <span>Start MSE: {state.costHistory[0]?.loss.toFixed(2)}</span>
          <span className="text-emerald-700 font-semibold">Now: {state.mse.toFixed(3)}</span>
        </div>
      </div>
    </div>
  );
}

// 2. Cost Descent Parabola
function CostDescentVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'cost-descent' }>;
}) {
  const W = 600;
  const H = 250;
  const pad = 40;
  const minX = -3.5;
  const maxX = 9.5;
  const mapX = (x: number) => pad + ((x - minX) / (maxX - minX)) * (W - 2 * pad);
  const f = (x: number) => (x - 3) ** 2 + 1.5;
  const maxY = 44;
  const mapY = (y: number) => H - pad - (Math.min(y, maxY) / maxY) * (H - 2 * pad);

  const curvePts: string[] = [];
  for (let x = minX; x <= maxX; x += 0.2) {
    curvePts.push(`${mapX(x)},${mapY(f(x))}`);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#94A3B8" strokeWidth="1.5" />
      <line x1={mapX(3)} y1={pad} x2={mapX(3)} y2={H - pad} stroke="#CBD5E1" strokeDasharray="4 4" />
      <polyline fill="none" stroke="#94A3B8" strokeWidth="2.2" points={curvePts.join(' ')} />

      {/* Trajectory path */}
      {state.trajectory.length > 1 && (
        <polyline
          fill="none"
          stroke="#0D9488"
          strokeWidth="2"
          strokeDasharray="4 3"
          points={state.trajectory.map((t) => `${mapX(t.x)},${mapY(t.fx)}`).join(' ')}
        />
      )}

      {state.trajectory.map((t, i) => (
        <circle
          key={i}
          cx={mapX(t.x)}
          cy={mapY(t.fx)}
          r={i === state.trajectory.length - 1 ? 7 : 4}
          fill={i === state.trajectory.length - 1 ? '#1D4ED8' : '#0D9488'}
          stroke="#FFFFFF"
          strokeWidth="1.8"
        />
      ))}

      <text x={pad} y={24} className="text-[12px] font-mono font-semibold fill-slate-800">
        x = {state.x.toFixed(4)}   ·   f(x) = {state.fx.toFixed(4)}   ·   gradient f′(x) = {state.gradient.toFixed(4)}
      </text>
      <text x={mapX(3) + 6} y={H - pad - 8} className="text-[11px] font-mono fill-emerald-700 font-semibold">
        Global Minimum (x* = 3.0)
      </text>
    </svg>
  );
}

// 3. Decision Boundary (Logistic, Perceptron, SVM, KNN, Naive Bayes)
function DecisionBoundaryVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'decision-boundary' }>;
}) {
  const W = 580;
  const H = 260;
  const pad = 38;
  const xs1 = state.points.map((p) => p.x1);
  const xs2 = state.points.map((p) => p.x2);
  const min1 = Math.min(0, ...xs1) - 0.5;
  const max1 = Math.max(6, ...xs1) + 0.5;
  const min2 = Math.min(0, ...xs2) - 0.5;
  const max2 = Math.max(6, ...xs2) + 0.5;

  const mapX = (v: number) => pad + ((v - min1) / (max1 - min1 || 1)) * (W - 2 * pad);
  const mapY = (v: number) => H - pad - ((v - min2) / (max2 - min2 || 1)) * (H - 2 * pad);

  let boundaryLine: { x1: number; y1: number; x2: number; y2: number } | null = null;
  if (state.weights) {
    const [w1, w2, b] = state.weights;
    if (Math.abs(w2) > 0.001) {
      const yAtMin = (-w1 * min1 - b) / w2;
      const yAtMax = (-w1 * max1 - b) / w2;
      boundaryLine = { x1: min1, y1: yAtMin, x2: max1, y2: yAtMax };
    }
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#94A3B8" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#94A3B8" />

      {boundaryLine && (
        <line
          x1={mapX(boundaryLine.x1)}
          y1={mapY(boundaryLine.y1)}
          x2={mapX(boundaryLine.x2)}
          y2={mapY(boundaryLine.y2)}
          stroke="#1D4ED8"
          strokeWidth="2.5"
        />
      )}

      {/* KNN neighbor lines */}
      {state.queryPoint &&
        state.queryPoint.neighborIndices?.map((idx) => {
          const pt = state.points[idx];
          if (!pt) return null;
          return (
            <line
              key={`nb-${idx}`}
              x1={mapX(state.queryPoint!.x1)}
              y1={mapY(state.queryPoint!.x2)}
              x2={mapX(pt.x1)}
              y2={mapY(pt.x2)}
              stroke="#0D9488"
              strokeWidth="1.8"
              strokeDasharray="4 3"
            />
          );
        })}

      {state.points.map((p, idx) => {
        const isNeighbor = state.queryPoint?.neighborIndices?.includes(idx);
        return (
          <circle
            key={idx}
            cx={mapX(p.x1)}
            cy={mapY(p.x2)}
            r={isNeighbor ? 7.5 : 5.5}
            fill={p.label === 1 ? '#2563EB' : '#EA580C'}
            stroke={isNeighbor ? '#0F172A' : '#FFFFFF'}
            strokeWidth={isNeighbor ? 2.5 : 1.5}
          />
        );
      })}

      {state.queryPoint && (
        <g>
          <polygon
            points={`${mapX(state.queryPoint.x1)},${mapY(state.queryPoint.x2) - 8} ${mapX(state.queryPoint.x1) + 8},${mapY(state.queryPoint.x2)} ${mapX(state.queryPoint.x1)},${mapY(state.queryPoint.x2) + 8} ${mapX(state.queryPoint.x1) - 8},${mapY(state.queryPoint.x2)}`}
            fill="#0D9488"
            stroke="#0F172A"
            strokeWidth="2"
          />
          <text
            x={mapX(state.queryPoint.x1) + 11}
            y={mapY(state.queryPoint.x2) + 4}
            className="text-[11px] font-mono font-semibold fill-slate-900"
          >
            Query ({state.queryPoint.x1}, {state.queryPoint.x2})
          </text>
        </g>
      )}

      <text x={pad} y={24} className="text-[12px] font-mono font-semibold fill-slate-800">
        Classification Accuracy: {(state.accuracy * 100).toFixed(1)}%
        {state.loss !== undefined ? `   ·   Loss: ${state.loss.toFixed(4)}` : ''}
      </text>
      <circle cx={W - 145} cy={20} r="5" fill="#2563EB" />
      <text x={W - 135} y={24} className="text-[11px] fill-slate-600">Class 1</text>
      <circle cx={W - 75} cy={20} r="5" fill="#EA580C" />
      <text x={W - 65} y={24} className="text-[11px] fill-slate-600">Class 0</text>
    </svg>
  );
}

// 4. Decision Tree Hierarchical SVG
function DecisionTreeVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'decision-tree' }>;
}) {
  const W = 600;
  const H = 260;
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
      {/* Edges */}
      {state.nodes.map((node) =>
        [node.leftId, node.rightId].map((childId, branchIdx) => {
          if (!childId) return null;
          const child = nodeMap.get(childId);
          if (!child) return null;
          const onPath =
            state.activePathIds.includes(node.id) && state.activePathIds.includes(child.id);
          return (
            <g key={`${node.id}-${child.id}`}>
              <line
                x1={node.xPos}
                y1={node.yPos + 18}
                x2={child.xPos}
                y2={child.yPos - 18}
                stroke={onPath ? '#1D4ED8' : '#CBD5E1'}
                strokeWidth={onPath ? 2.6 : 1.5}
              />
              <text
                x={(node.xPos + child.xPos) / 2 + (branchIdx === 0 ? -22 : 8)}
                y={(node.yPos + child.yPos) / 2}
                className="text-[10px] font-mono fill-slate-500"
              >
                {branchIdx === 0 ? 'True (≤)' : 'False (>)'}
              </text>
            </g>
          );
        })
      )}

      {/* Nodes */}
      {state.nodes.map((node) => {
        const isActive = state.activeNodeId === node.id;
        const onPath = state.activePathIds.includes(node.id);
        return (
          <g key={node.id}>
            <rect
              x={node.xPos - 72}
              y={node.yPos - 22}
              width="144"
              height="44"
              rx="8"
              fill={node.isLeaf ? '#ECFDF5' : isActive ? '#EFF6FF' : '#FFFFFF'}
              stroke={isActive ? '#1D4ED8' : onPath ? '#3B82F6' : '#CBD5E1'}
              strokeWidth={isActive ? 2.5 : 1.5}
            />
            <text
              x={node.xPos}
              y={node.yPos - 4}
              textAnchor="middle"
              className="text-[11px] font-mono font-semibold fill-slate-900"
            >
              {node.isLeaf
                ? `Leaf: ${node.predictedClass}`
                : `${node.featureName} ≤ ${node.threshold}`}
            </text>
            <text
              x={node.xPos}
              y={node.yPos + 13}
              textAnchor="middle"
              className="text-[10px] font-mono fill-slate-500"
            >
              Gini={node.gini.toFixed(2)} · n={node.samples}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// 5. Clustering / PCA
function ClusteringVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'clustering' }>;
}) {
  const W = 580;
  const H = 250;
  const pad = 38;
  const palette = ['#2563EB', '#0D9488', '#D97706', '#7C3AED'];
  const xs = state.points.map((p) => p.x);
  const ys = state.points.map((p) => p.y);
  const minX = Math.min(0, ...xs) - 0.5;
  const maxX = Math.max(8, ...xs) + 0.5;
  const minY = Math.min(0, ...ys) - 0.5;
  const maxY = Math.max(8, ...ys) + 0.5;

  const mapX = (x: number) => pad + ((x - minX) / (maxX - minX || 1)) * (W - 2 * pad);
  const mapY = (y: number) => H - pad - ((y - minY) / (maxY - minY || 1)) * (H - 2 * pad);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#94A3B8" />
      <line x1={pad} y1={pad} x2={pad} y2={H - pad} stroke="#94A3B8" />

      {state.eigenVector && (
        <line
          x1={mapX(state.eigenVector.meanX - state.eigenVector.dx * 3.2)}
          y1={mapY(state.eigenVector.meanY - state.eigenVector.dy * 3.2)}
          x2={mapX(state.eigenVector.meanX + state.eigenVector.dx * 3.2)}
          y2={mapY(state.eigenVector.meanY + state.eigenVector.dy * 3.2)}
          stroke="#1D4ED8"
          strokeWidth="2.6"
        />
      )}

      {state.points.map((p, i) => (
        <circle
          key={i}
          cx={mapX(p.x)}
          cy={mapY(p.y)}
          r={state.activePointIndex === i ? 7 : 5}
          fill={p.cluster >= 0 ? palette[p.cluster % palette.length] : '#64748B'}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}

      {state.centroids.map((c) => (
        <g key={`cent-${c.cluster}`}>
          <rect
            x={mapX(c.x) - 7}
            y={mapY(c.y) - 7}
            width="14"
            height="14"
            rx="3"
            fill={palette[c.cluster % palette.length]}
            stroke="#0F172A"
            strokeWidth="2"
          />
          <text
            x={mapX(c.x) + 10}
            y={mapY(c.y) + 4}
            className="text-[10px] font-mono font-bold fill-slate-900"
          >
            μ{c.cluster + 1}
          </text>
        </g>
      ))}

      <text x={pad} y={24} className="text-[12px] font-mono font-semibold fill-slate-800">
        {state.eigenVector
          ? `Principal Component Variance Explained: ${(state.eigenVector.varianceExplained * 100).toFixed(1)}%`
          : `K-Means Inertia (WCSS): ${state.inertia.toFixed(3)}`}
      </text>
    </svg>
  );
}

// 6. Neural Network (2-2-1 MLP)
function NeuralNetworkVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'neural-network' }>;
}) {
  const W = 540;
  const H = 250;
  const inCoords = [
    { x: 95, y: 85, label: `x₁=${state.sampleInput[0]}`, val: state.layers[0]?.[0] ?? 0 },
    { x: 95, y: 175, label: `x₂=${state.sampleInput[1]}`, val: state.layers[0]?.[1] ?? 0 },
  ];
  const hidCoords = [
    { x: 270, y: 85, label: 'h₁', val: state.layers[1]?.[0] ?? 0.5 },
    { x: 270, y: 175, label: 'h₂', val: state.layers[1]?.[1] ?? 0.5 },
  ];
  const outCoord = { x: 445, y: 130, label: 'ŷ', val: state.sampleOutput };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
      <div className="lg:col-span-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
          {/* Input -> Hidden edges */}
          {inCoords.map((ic, i) =>
            hidCoords.map((hc, j) => {
              const w = state.weightsIH[i]?.[j] ?? 0;
              return (
                <g key={`ih-${i}-${j}`}>
                  <line
                    x1={ic.x}
                    y1={ic.y}
                    x2={hc.x}
                    y2={hc.y}
                    stroke={state.phase === 'backprop' ? '#EA580C' : w >= 0 ? '#2563EB' : '#DC2626'}
                    strokeWidth={Math.min(4, Math.max(1.2, Math.abs(w) * 1.4))}
                    strokeOpacity="0.65"
                  />
                  <text
                    x={(ic.x + hc.x) / 2}
                    y={(ic.y + hc.y) / 2 - 4}
                    className="text-[9px] font-mono fill-slate-500"
                    textAnchor="middle"
                  >
                    {w.toFixed(2)}
                  </text>
                </g>
              );
            })
          )}

          {/* Hidden -> Output edges */}
          {hidCoords.map((hc, j) => {
            const w = state.weightsHO[j]?.[0] ?? 0;
            return (
              <g key={`ho-${j}`}>
                <line
                  x1={hc.x}
                  y1={hc.y}
                  x2={outCoord.x}
                  y2={outCoord.y}
                  stroke={state.phase === 'backprop' ? '#EA580C' : w >= 0 ? '#2563EB' : '#DC2626'}
                  strokeWidth={Math.min(4, Math.max(1.2, Math.abs(w) * 1.4))}
                  strokeOpacity="0.7"
                />
                <text
                  x={(hc.x + outCoord.x) / 2}
                  y={(hc.y + outCoord.y) / 2 - 5}
                  className="text-[9px] font-mono fill-slate-500"
                  textAnchor="middle"
                >
                  {w.toFixed(2)}
                </text>
              </g>
            );
          })}

          {/* Nodes */}
          {[...inCoords, ...hidCoords, outCoord].map((n, idx) => (
            <g key={idx}>
              <circle cx={n.x} cy={n.y} r="22" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="2" />
              <text x={n.x} y={n.y - 2} textAnchor="middle" className="text-[10px] font-semibold fill-slate-600">
                {n.label}
              </text>
              <text x={n.x} y={n.y + 12} textAnchor="middle" className="text-[11px] font-mono font-bold fill-slate-900">
                {n.val.toFixed(2)}
              </text>
            </g>
          ))}

          <text x="16" y="24" className="text-[12px] font-mono font-semibold fill-slate-800">
            Phase: {state.phase.toUpperCase()} · Target={state.sampleTarget} · ŷ={state.sampleOutput.toFixed(3)} · MSE={state.loss.toFixed(4)}
          </text>
        </svg>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 p-3">
        <div className="text-xs font-semibold text-slate-700 mb-2">Training Loss Over Epochs</div>
        <svg viewBox="0 0 220 130" className="w-full h-auto">
          <line x1="20" y1="108" x2="205" y2="108" stroke="#CBD5E1" />
          <line x1="20" y1="12" x2="20" y2="108" stroke="#CBD5E1" />
          {state.lossHistory.length > 1 && (
            <polyline
              fill="none"
              stroke="#0D9488"
              strokeWidth="2.2"
              points={state.lossHistory
                .map((pt, i) => {
                  const maxL = Math.max(0.3, ...state.lossHistory.map((h) => h.loss));
                  const cx = 24 + (i / Math.max(1, state.lossHistory.length - 1)) * 175;
                  const cy = 104 - (pt.loss / maxL) * 86;
                  return `${cx},${cy}`;
                })
                .join(' ')}
            />
          )}
        </svg>
        <div className="text-[11px] font-mono text-slate-600">
          Current Loss: <span className="font-semibold text-blue-700">{state.loss.toFixed(4)}</span>
        </div>
      </div>
    </div>
  );
}

// 7. Sorting Array Bars
function ArrayBarsVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'array-bars' }>;
}) {
  const maxVal = Math.max(1, ...state.array.map((v) => Math.abs(v)));
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex items-center justify-between text-xs font-mono text-slate-600 mb-4 tabular-nums">
        <span>
          Comparisons: <strong className="text-slate-900">{state.comparisons}</strong> · Swaps/Writes:{' '}
          <strong className="text-slate-900">{state.swaps}</strong>
        </span>
        <span className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500 inline-block" /> Comparing
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-500 inline-block" /> Swap
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600 inline-block" /> Sorted
          </span>
        </span>
      </div>
      <div className="h-44 flex items-end justify-center gap-2 pt-4 px-2">
        {state.array.map((val, idx) => {
          const isSwap = state.swappingIndices.includes(idx);
          const isComp = state.comparingIndices.includes(idx);
          const isPivot = state.pivotIndex === idx;
          const isSorted = state.sortedIndices.includes(idx);

          let barColor = 'bg-blue-600';
          if (isSwap) barColor = 'bg-rose-500';
          else if (isPivot) barColor = 'bg-violet-600';
          else if (isComp) barColor = 'bg-amber-500';
          else if (isSorted) barColor = 'bg-emerald-600';

          const heightPct = Math.max(16, Math.round((Math.abs(val) / maxVal) * 100));
          return (
            <div key={idx} className="flex-1 max-w-14 flex flex-col items-center gap-1">
              <span className="text-xs font-mono font-semibold text-slate-800 tabular-nums">{val}</span>
              <div
                className={`w-full rounded-t-md transition-all duration-200 ${barColor}`}
                style={{ height: `${heightPct}%` }}
              />
              <span className="text-[10px] font-mono text-slate-400">[{idx}]</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 8. Linear / Binary Search Array Tiles
function ArraySearchVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'array-search' }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-600 mb-4 tabular-nums">
        <span>
          Searching for target = <strong className="text-blue-700">{state.target}</strong> · Comparisons:{' '}
          <strong className="text-slate-900">{state.comparisons}</strong>
        </span>
        {state.lowIndex !== undefined && state.highIndex !== undefined && (
          <span>
            Active Window: [{state.lowIndex} .. {state.highIndex}]
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 justify-center py-4">
        {state.array.map((val, idx) => {
          const isFound = state.foundIndex === idx;
          const isCurrent = state.currentIndex === idx;
          const isEliminated = state.eliminatedIndices.includes(idx);

          let boxClass = 'bg-slate-50 border-slate-300 text-slate-900';
          if (isFound) boxClass = 'bg-emerald-50 border-emerald-600 text-emerald-900 ring-2 ring-emerald-500/30';
          else if (isCurrent) boxClass = 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-500/30';
          else if (isEliminated) boxClass = 'bg-slate-100 border-slate-200 text-slate-400 opacity-55';

          return (
            <div key={idx} className="flex flex-col items-center gap-1">
              <div
                className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-mono font-bold text-sm tabular-nums transition-all ${boxClass}`}
              >
                {val}
              </div>
              <span className="text-[10px] font-mono text-slate-500">
                i={idx}
                {state.lowIndex === idx ? ' (L)' : ''}
                {state.highIndex === idx ? ' (H)' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 9. Graph Path Traversal (BFS, DFS, Dijkstra, A*)
function GraphPathVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'graph-path' }>;
}) {
  const nodeMap = new Map(state.nodes.map((n) => [n.id, n]));
  return (
    <svg viewBox="0 0 620 280" className="w-full h-auto bg-white rounded-lg border border-slate-200">
      {state.edges.map((e, i) => {
        const a = nodeMap.get(e.from);
        const b = nodeMap.get(e.to);
        if (!a || !b) return null;
        const onPath = state.pathIds.includes(e.from) && state.pathIds.includes(e.to);
        return (
          <g key={i}>
            <line
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={onPath ? '#1D4ED8' : '#CBD5E1'}
              strokeWidth={onPath ? 3.2 : 1.8}
            />
            <rect
              x={(a.x + b.x) / 2 - 10}
              y={(a.y + b.y) / 2 - 9}
              width="20"
              height="16"
              rx="4"
              fill="#FFFFFF"
              stroke="#E2E8F0"
            />
            <text
              x={(a.x + b.x) / 2}
              y={(a.y + b.y) / 2 + 3}
              textAnchor="middle"
              className="text-[10px] font-mono font-semibold fill-slate-700"
            >
              {e.weight}
            </text>
          </g>
        );
      })}

      {state.nodes.map((n) => {
        const isActive = state.activeNodeId === n.id;
        const inPath = state.pathIds.includes(n.id);
        const visited = state.visitedIds.includes(n.id);
        const frontier = state.frontierIds.includes(n.id);

        let fill = '#FFFFFF';
        let stroke = '#94A3B8';
        if (isActive) {
          fill = '#DBEAFE';
          stroke = '#1D4ED8';
        } else if (inPath) {
          fill = '#D1FAE5';
          stroke = '#059669';
        } else if (visited) {
          fill = '#F1F5F9';
          stroke = '#475569';
        } else if (frontier) {
          fill = '#FEF3C7';
          stroke = '#D97706';
        }

        return (
          <g key={n.id}>
            <circle cx={n.x} cy={n.y} r="22" fill={fill} stroke={stroke} strokeWidth={isActive ? 3 : 2} />
            <text x={n.x} y={n.y + 4} textAnchor="middle" className="text-[12px] font-mono font-bold fill-slate-900">
              {n.id}
            </text>
            {n.dist !== undefined && (
              <text x={n.x} y={n.y + 34} textAnchor="middle" className="text-[10px] font-mono fill-slate-600">
                d={n.dist === 999 ? '∞' : n.dist}
                {n.fScore !== undefined ? ` f=${n.fScore}` : ''}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// 10. Dynamic Programming Table
function DpTableVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'dp-table' }>;
}) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs font-mono tabular-nums">
        <thead>
          <tr>
            <th className="p-2 border border-slate-200 bg-slate-50 text-left text-slate-600">Item \ Cap</th>
            {state.headers.map((h, i) => (
              <th key={i} className="p-2 border border-slate-200 bg-slate-50 text-center text-slate-700 font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {state.table.map((row, rIdx) => (
            <tr key={rIdx}>
              <td className="p-2 border border-slate-200 bg-slate-50 font-semibold text-slate-700 whitespace-nowrap">
                {state.rowLabels[rIdx]}
              </td>
              {row.map((cell, cIdx) => {
                const isActive =
                  state.activeCell && state.activeCell[0] === rIdx && state.activeCell[1] === cIdx;
                const isDep = state.dependencyCells.some(([dr, dc]) => dr === rIdx && dc === cIdx);
                return (
                  <td
                    key={cIdx}
                    className={`p-2 border border-slate-200 text-center font-semibold ${
                      isActive
                        ? 'bg-blue-100 text-blue-900 ring-2 ring-inset ring-blue-600'
                        : isDep
                        ? 'bg-amber-50 text-amber-900'
                        : 'bg-white text-slate-800'
                    }`}
                  >
                    {cell === null ? '·' : cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// 11. Genetic Algorithm Population
function PopulationGaVisual({
  state,
}: {
  state: Extract<AlgorithmVisualState, { kind: 'population-ga' }>;
}) {
  const W = 580;
  const H = 240;
  const pad = 40;
  const mapX = (x: number) => pad + (x / 10) * (W - 2 * pad);
  const mapY = (fit: number) => H - pad - ((Math.max(0, fit) / 22) * (H - 2 * pad));

  const curve: string[] = [];
  for (let x = 0; x <= 10; x += 0.2) {
    curve.push(`${mapX(x)},${mapY(x * Math.sin(x) + 12)}`);
  }

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto bg-white rounded-lg border border-slate-200">
      <line x1={pad} y1={H - pad} x2={W - pad} y2={H - pad} stroke="#94A3B8" />
      <polyline fill="none" stroke="#94A3B8" strokeWidth="2" points={curve.join(' ')} />
      {state.individuals.map((ind, idx) => (
        <circle
          key={idx}
          cx={mapX(ind.x)}
          cy={mapY(ind.fitness)}
          r={idx === 0 ? 7 : 5}
          fill={idx === 0 ? '#059669' : '#2563EB'}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
      ))}
      <text x={pad} y={24} className="text-[12px] font-mono font-semibold fill-slate-800">
        Generation {state.generation} · Best x = {state.bestX} · Peak Fitness = {state.bestFitness}
      </text>
    </svg>
  );
}
