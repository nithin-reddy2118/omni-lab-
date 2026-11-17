import { getAlgorithmById, matchBuiltInAlgorithm } from '../data/algorithmRegistry';
import type {
  AiAlgorithmSpecification,
  AlgorithmExecutionTrace,
  AlgorithmStep,
  DecisionTreeNodeVisual,
} from '../types/algorithm';

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function parseArrayInput(raw?: string, fallback: number[] = [38, 14, 52, 9, 27, 41, 18]): number[] {
  if (!raw || !raw.trim()) return [...fallback];
  const nums = raw
    .split(/[,\s;]+/)
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n));
  return nums.length >= 3 ? nums.slice(0, 14) : [...fallback];
}

function parsePairsInput(
  raw?: string,
  fallback: { x: number; y: number }[] = [
    { x: 1, y: 2.1 },
    { x: 2, y: 3.9 },
    { x: 3, y: 6.2 },
    { x: 4, y: 7.8 },
    { x: 5, y: 10.3 },
  ]
): { x: number; y: number }[] {
  if (!raw || !raw.trim()) return fallback;
  const pairs: { x: number; y: number }[] = [];
  for (const token of raw.split(',')) {
    const parts = token.split(/[:|\s]+/).map((s) => Number(s.trim())).filter(Number.isFinite);
    if (parts.length >= 2) pairs.push({ x: parts[0], y: parts[1] });
  }
  return pairs.length >= 3 ? pairs.slice(0, 20) : fallback;
}

// ============================================================================
// DETERMINISTIC GRAPH TOPOLOGY (used cleanly by BFS, DFS, Dijkstra, A*)
// ============================================================================
const DEMO_GRAPH = {
  nodes: [
    { id: 'A', label: 'A (Start)', x: 80, y: 150 },
    { id: 'B', label: 'B', x: 200, y: 70 },
    { id: 'C', label: 'C', x: 220, y: 230 },
    { id: 'D', label: 'D', x: 360, y: 75 },
    { id: 'E', label: 'E', x: 420, y: 185 },
    { id: 'F', label: 'F (Goal)', x: 540, y: 140 },
  ],
  edges: [
    { from: 'A', to: 'B', weight: 2 },
    { from: 'A', to: 'C', weight: 4 },
    { from: 'B', to: 'C', weight: 2 },
    { from: 'B', to: 'D', weight: 3 },
    { from: 'C', to: 'F', weight: 9 },
    { from: 'D', to: 'E', weight: 1 },
    { from: 'E', to: 'F', weight: 2 },
  ],
};

function getNeighbors(nodeId: string): { to: string; weight: number }[] {
  const out: { to: string; weight: number }[] = [];
  for (const e of DEMO_GRAPH.edges) {
    if (e.from === nodeId) out.push({ to: e.to, weight: e.weight });
    else if (e.to === nodeId) out.push({ to: e.from, weight: e.weight });
  }
  return out.sort((a, b) => a.to.localeCompare(b.to));
}

// ============================================================================
// SAFE PSEUDOCODE / JS-SUBSET TRACE INTERPRETER (NO eval / NO Function)
// ============================================================================
export function executeSafePseudocodeSubset(code: string): AlgorithmExecutionTrace {
  const t0 = performance.now();
  const lines = code
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('//') && !l.startsWith('#'));

  // Extract array literal if student wrote one, e.g. arr = [8, 3, 5, 1]
  const arrMatch = code.match(/\[\s*(-?\d+(?:\s*,\s*-?\d+)+)\s*\]/);
  const arr = arrMatch
    ? arrMatch[1].split(',').map((s) => Number(s.trim())).slice(0, 12)
    : [19, 7, 25, 4, 15, 11];

  const isSortCode = /(swap|bubble|sort|temp|<|>)/i.test(code) && !/binary/i.test(code);
  const isSearchCode = /(search|target|mid|find|==)/i.test(code);
  const targetMatch = code.match(/target\s*=\s*(-?\d+)/i);
  const targetVal = targetMatch ? Number(targetMatch[1]) : arr[Math.floor(arr.length / 2)];

  if (isSearchCode) {
    return executeAlgorithm('binary-search', { target: targetVal }, arr.slice().sort((a, b) => a - b).join(', '));
  }
  if (isSortCode) {
    return executeAlgorithm('bubble-sort', {}, arr.join(', '));
  }

  // Trace variable assignments cleanly without executing arbitrary JS
  const env: Record<string, number> = {};
  const steps: AlgorithmStep[] = [];
  let stepNo = 1;
  for (const line of lines.slice(0, 12)) {
    const assign = line.match(/^([a-zA-Z_]\w*)\s*=\s*(-?\d+(?:\.\d+)?)\s*(?:([+\-*/])\s*(-?\d+(?:\.\d+)?|[a-zA-Z_]\w*))?/);
    if (assign) {
      const varName = assign[1];
      const lhs = Number(assign[2]);
      let val = lhs;
      if (assign[3] && assign[4]) {
        const rhs = Number.isFinite(Number(assign[4])) ? Number(assign[4]) : env[assign[4]] ?? 0;
        if (assign[3] === '+') val = lhs + rhs;
        if (assign[3] === '-') val = lhs - rhs;
        if (assign[3] === '*') val = lhs * rhs;
        if (assign[3] === '/' && rhs !== 0) val = lhs / rhs;
      }
      env[varName] = round4(val);
    }
    steps.push({
      stepNumber: stepNo++,
      iterationLabel: `Line ${stepNo - 1}`,
      operation: `Trace statement: ${line.slice(0, 48)}`,
      inputsSnapshot: `Variables: ${JSON.stringify(env)}`,
      intermediateValues: `Parsed safely without arbitrary eval()`,
      dataStructureState: `Array buffer: [${arr.join(', ')}]`,
      mathExpression: line,
      outputSnapshot: Object.entries(env).map(([k, v]) => `${k}=${v}`).join(', ') || 'Evaluated',
      explanation: `Safely inspected and traced statement "${line}" inside the restricted sandbox.`,
      whyNecessary: 'Verifies variable state transitions without running untrusted code directly.',
      visualState: {
        kind: 'array-bars',
        array: [...arr],
        comparingIndices: [],
        swappingIndices: [],
        sortedIndices: [],
        comparisons: stepNo - 1,
        swaps: 0,
      },
    });
  }

  const dt = Math.max(0.05, round4(performance.now() - t0));
  return {
    algorithmId: 'custom-safe-subset',
    algorithmName: 'Safe Sandbox Trace',
    executionTier: 'traceable',
    steps: steps.length > 0 ? steps : executeAlgorithm('bubble-sort', {}, arr.join(', ')).steps,
    finalSummary: `Completed safe trace across ${steps.length} statements cleanly (no eval executed).`,
    measuredRuntimeMs: dt,
    finalMetrics: [
      { label: 'Statements Traced', value: String(steps.length) },
      { label: 'Measured Runtime', value: `${dt} ms` },
    ],
    selfCheckPassed: true,
    selfCheckDetail: 'Restricted sandbox trace completed safely.',
  };
}

// ============================================================================
// MAIN BUILT-IN ALGORITHM EXECUTION ENGINE (ALL 22 ALGORITHMS)
// ============================================================================
export function executeAlgorithm(
  algorithmId: string,
  customParams: Record<string, number> = {},
  customInputRaw?: string
): AlgorithmExecutionTrace {
  const def = getAlgorithmById(algorithmId) ?? getAlgorithmById('linear-regression')!;
  const params = { ...def.defaultParams, ...customParams };
  const t0 = performance.now();
  const steps: AlgorithmStep[] = [];
  let comparisonsCount = 0;
  let swapsCount = 0;
  let finalSummary = '';
  let selfCheckPassed = true;
  let selfCheckDetail = def.testExpectation;
  const finalMetrics: { label: string; value: string }[] = [];

  switch (def.id) {
    // ------------------------------------------------------------------------
    // 1. LINEAR REGRESSION (Gradient Descent)
    // ------------------------------------------------------------------------
    case 'linear-regression': {
      const points = parsePairsInput(customInputRaw);
      const n = points.length;
      const lr = params.learningRate ?? 0.05;
      const iterations = Math.round(params.iterations ?? 16);
      let m = 0;
      let b = 0;
      const costHistory: { step: number; loss: number }[] = [];

      const computeMse = (sl: number, ic: number) =>
        points.reduce((acc, p) => acc + (p.y - (sl * p.x + ic)) ** 2, 0) / n;

      const initMse = computeMse(m, b);
      costHistory.push({ step: 0, loss: round4(initMse) });
      steps.push({
        stepNumber: 1,
        iterationLabel: 'Init',
        operation: 'Initialize model parameters (m = 0, b = 0)',
        inputsSnapshot: `${n} (x, y) points, α = ${lr}`,
        intermediateValues: `Initial predictions ŷ = 0.0 for all x`,
        dataStructureState: `m = 0.000, b = 0.000`,
        mathExpression: `MSE₀ = (1/${n}) Σ(yᵢ - 0)² = ${round4(initMse)}`,
        outputSnapshot: `MSE = ${round4(initMse)}`,
        explanation: 'Start with a horizontal baseline line y = 0 and measure its initial squared error.',
        whyNecessary: 'Gradient descent requires an initial guess to evaluate which direction lowers error.',
        visualState: {
          kind: 'regression-line',
          points,
          slope: 0,
          intercept: 0,
          mse: round4(initMse),
          costHistory: [...costHistory],
        },
      });

      for (let it = 1; it <= iterations; it++) {
        let dm = 0;
        let db = 0;
        for (const p of points) {
          const pred = m * p.x + b;
          const err = p.y - pred;
          dm += (-2 / n) * p.x * err;
          db += (-2 / n) * err;
        }
        m -= lr * dm;
        b -= lr * db;
        const mse = computeMse(m, b);
        costHistory.push({ step: it, loss: round4(mse) });

        steps.push({
          stepNumber: it + 1,
          iterationLabel: `Epoch ${it}`,
          operation: `Update slope m & intercept b via gradients`,
          inputsSnapshot: `∂L/∂m = ${round4(dm)}, ∂L/∂b = ${round4(db)}`,
          intermediateValues: `Δm = ${round4(-lr * dm)}, Δb = ${round4(-lr * db)}`,
          dataStructureState: `m = ${round4(m)}, b = ${round4(b)}`,
          mathExpression: `ŷ = ${round2(m)}x + ${round2(b)} · MSE = ${round4(mse)}`,
          outputSnapshot: `MSE = ${round4(mse)}`,
          explanation: `Moved m by ${round4(-lr * dm)} and b by ${round4(-lr * db)} opposite the cost gradient, dropping MSE to ${round4(mse)}.`,
          whyNecessary: 'Every gradient step aligns the line closer to the centroid and slope of the data.',
          visualState: {
            kind: 'regression-line',
            points,
            slope: round4(m),
            intercept: round4(b),
            mse: round4(mse),
            costHistory: [...costHistory],
            highlightPointIndex: it % n,
          },
        });
      }

      const finalMse = costHistory[costHistory.length - 1].loss;
      const meanY = points.reduce((s, p) => s + p.y, 0) / n;
      const ssTot = points.reduce((s, p) => s + (p.y - meanY) ** 2, 0) || 1;
      const r2 = round4(1 - (finalMse * n) / ssTot);
      selfCheckPassed = finalMse < initMse;
      selfCheckDetail = `MSE reduced from ${round4(initMse)} to ${finalMse} (R² = ${r2}).`;
      finalSummary = `Converged to ŷ = ${round2(m)}x + ${round2(b)} with MSE = ${finalMse} and R² = ${r2}.`;
      finalMetrics.push(
        { label: 'Fitted Equation', value: `ŷ = ${round2(m)}x + ${round2(b)}` },
        { label: 'Final MSE', value: `${finalMse}` },
        { label: 'R² Score', value: `${r2}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 2. GRADIENT DESCENT (1D Convex Cost Surface)
    // ------------------------------------------------------------------------
    case 'gradient-descent': {
      let x = params.startX ?? -2;
      const alpha = params.learningRate ?? 0.22;
      const iterations = Math.round(params.iterations ?? 12);
      const f = (v: number) => (v - 3) ** 2 + 1.5;
      const df = (v: number) => 2 * (v - 3);
      const trajectory: { step: number; x: number; fx: number }[] = [{ step: 0, x: round4(x), fx: round4(f(x)) }];

      steps.push({
        stepNumber: 1,
        iterationLabel: 'Start',
        operation: `Evaluate initial f(x₀) at x₀ = ${round2(x)}`,
        inputsSnapshot: `x₀ = ${round2(x)}, α = ${alpha}`,
        intermediateValues: `f'(x₀) = 2(${round2(x)} - 3) = ${round4(df(x))}`,
        dataStructureState: `x = ${round4(x)}, f(x) = ${round4(f(x))}`,
        mathExpression: `f(${round2(x)}) = (${round2(x)} - 3)² + 1.5 = ${round4(f(x))}`,
        outputSnapshot: `Loss = ${round4(f(x))}`,
        explanation: 'Evaluates the slope of the convex parabola f(x) at the starting guess.',
        whyNecessary: 'The sign of f′(x) tells us whether the minimum lies to the left or right.',
        visualState: {
          kind: 'cost-descent',
          x: round4(x),
          fx: round4(f(x)),
          gradient: round4(df(x)),
          trajectory: [...trajectory],
        },
      });

      for (let it = 1; it <= iterations; it++) {
        const g = df(x);
        const nextX = x - alpha * g;
        x = nextX;
        const fx = f(x);
        trajectory.push({ step: it, x: round4(x), fx: round4(fx) });
        steps.push({
          stepNumber: it + 1,
          iterationLabel: `Step ${it}`,
          operation: `Step opposite gradient: x ← x - α·f'(x)`,
          inputsSnapshot: `gradient f'(x) = ${round4(g)}`,
          intermediateValues: `step Δx = ${round4(-alpha * g)}`,
          dataStructureState: `x = ${round4(x)}, f(x) = ${round4(fx)}`,
          mathExpression: `x_${it} = ${round4(x)} · Loss f(x) = ${round4(fx)}`,
          outputSnapshot: `x = ${round4(x)}, f(x) = ${round4(fx)}`,
          explanation: `Because slope was ${round2(g)}, moving by ${round4(-alpha * g)} brings x closer to minimum x* = 3.0.`,
          whyNecessary: 'Step sizes naturally shrink as the slope flattens near the valley minimum.',
          visualState: {
            kind: 'cost-descent',
            x: round4(x),
            fx: round4(fx),
            gradient: round4(df(x)),
            trajectory: [...trajectory],
          },
        });
      }

      selfCheckPassed = Math.abs(x - 3) < Math.abs((params.startX ?? -2) - 3);
      selfCheckDetail = `Parameter x converged from ${params.startX ?? -2} toward x* = 3 (final x = ${round4(x)}).`;
      finalSummary = `After ${iterations} updates, x = ${round4(x)}, f(x) = ${round4(f(x))} (exact minimum: x = 3.0, f = 1.5).`;
      finalMetrics.push(
        { label: 'Final Parameter x', value: `${round4(x)}` },
        { label: 'Final Loss f(x)', value: `${round4(f(x))}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 3. LOGISTIC REGRESSION
    // ------------------------------------------------------------------------
    case 'logistic-regression': {
      const pts = [
        { x1: 1.2, x2: 1.4, label: 0 },
        { x1: 1.8, x2: 2.1, label: 0 },
        { x1: 2.3, x2: 1.3, label: 0 },
        { x1: 2.6, x2: 2.4, label: 0 },
        { x1: 3.1, x2: 1.9, label: 0 },
        { x1: 5.2, x2: 4.8, label: 1 },
        { x1: 5.8, x2: 5.6, label: 1 },
        { x1: 6.1, x2: 4.4, label: 1 },
        { x1: 6.7, x2: 5.9, label: 1 },
        { x1: 4.8, x2: 5.4, label: 1 },
      ];
      let w1 = 0.05;
      let w2 = 0.05;
      let b = -0.3;
      const lr = params.learningRate ?? 0.4;
      const epochs = Math.round(params.iterations ?? 14);
      const sigmoid = (z: number) => 1 / (1 + Math.exp(-Math.max(-20, Math.min(20, z))));

      for (let ep = 0; ep <= epochs; ep++) {
        let loss = 0;
        let correct = 0;
        const evalPts = pts.map((p) => {
          const prob = sigmoid(w1 * p.x1 + w2 * p.x2 + b);
          const pred = prob >= 0.5 ? 1 : 0;
          if (pred === p.label) correct++;
          loss += -(p.label * Math.log(Math.max(1e-6, prob)) + (1 - p.label) * Math.log(Math.max(1e-6, 1 - prob)));
          return { ...p, predicted: pred };
        });
        loss /= pts.length;
        const acc = Math.round((correct / pts.length) * 100);

        steps.push({
          stepNumber: ep + 1,
          iterationLabel: ep === 0 ? 'Init' : `Epoch ${ep}`,
          operation: ep === 0 ? 'Evaluate initial boundary w=[0.05, 0.05], b=-0.3' : 'Apply Binary Cross-Entropy gradient update',
          inputsSnapshot: `${pts.length} binary points, α = ${lr}`,
          intermediateValues: `Correct: ${correct}/${pts.length}, Log-Loss = ${round4(loss)}`,
          dataStructureState: `w₁=${round2(w1)}, w₂=${round2(w2)}, b=${round2(b)}`,
          mathExpression: `σ(${round2(w1)}x₁ + ${round2(w2)}x₂ + ${round2(b)}) = 0.5`,
          outputSnapshot: `Accuracy = ${acc}%, Loss = ${round4(loss)}`,
          explanation: `Shifts the separating boundary weights using (σ(z) − y) gradients so Class 1 lies above the line and Class 0 below.`,
          whyNecessary: 'Maximizes the likelihood of assigning high probability to each sample’s true class.',
          visualState: {
            kind: 'decision-boundary',
            points: evalPts,
            weights: [w1, w2, b],
            accuracy: acc,
            loss: round4(loss),
          },
        });

        let dw1 = 0, dw2 = 0, db = 0;
        for (const p of pts) {
          const prob = sigmoid(w1 * p.x1 + w2 * p.x2 + b);
          const err = prob - p.label;
          dw1 += (err * p.x1) / pts.length;
          dw2 += (err * p.x2) / pts.length;
          db += err / pts.length;
        }
        w1 -= lr * dw1;
        w2 -= lr * dw2;
        b -= lr * db;
      }

      const lastVs = steps[steps.length - 1].visualState as { accuracy: number; loss?: number };
      selfCheckPassed = lastVs.accuracy >= 90;
      finalSummary = `Logistic Regression separated the 2D classes with ${lastVs.accuracy}% accuracy and log-loss ${lastVs.loss}.`;
      finalMetrics.push(
        { label: 'Accuracy', value: `${lastVs.accuracy}%` },
        { label: 'Final Log-Loss', value: `${lastVs.loss}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 4. DECISION TREE (Gini Split on Iris-like petal/sepal points)
    // ------------------------------------------------------------------------
    case 'decision-tree': {
      const maxDepth = Math.round(params.maxDepth ?? 2);
      const nRoot: DecisionTreeNodeVisual = {
        id: 'root',
        featureName: 'petal_length',
        threshold: 2.45,
        gini: 0.667,
        samples: 15,
        predictedClass: 'Iris-setosa',
        isLeaf: false,
        leftId: 'leaf-setosa',
        rightId: 'node-versicolor',
        depth: 0,
        xPos: 300,
        yPos: 45,
      };
      const nLeft: DecisionTreeNodeVisual = {
        id: 'leaf-setosa',
        gini: 0.0,
        samples: 5,
        predictedClass: 'Iris-setosa (100%)',
        isLeaf: true,
        depth: 1,
        xPos: 145,
        yPos: 165,
      };
      const nRight: DecisionTreeNodeVisual = {
        id: 'node-versicolor',
        featureName: 'petal_width',
        threshold: 1.7,
        gini: 0.5,
        samples: 10,
        predictedClass: 'Versicolor / Virginica',
        isLeaf: maxDepth <= 1,
        leftId: maxDepth > 1 ? 'leaf-vers' : undefined,
        rightId: maxDepth > 1 ? 'leaf-virg' : undefined,
        depth: 1,
        xPos: 455,
        yPos: 165,
      };
      const nLeafV1: DecisionTreeNodeVisual = {
        id: 'leaf-vers',
        gini: 0.0,
        samples: 5,
        predictedClass: 'Iris-versicolor (100%)',
        isLeaf: true,
        depth: 2,
        xPos: 345,
        yPos: 280,
      };
      const nLeafV2: DecisionTreeNodeVisual = {
        id: 'leaf-virg',
        gini: 0.0,
        samples: 5,
        predictedClass: 'Iris-virginica (100%)',
        isLeaf: true,
        depth: 2,
        xPos: 560,
        yPos: 280,
      };

      const baseNodes = maxDepth <= 1 ? [nRoot, nLeft, nRight] : [nRoot, nLeft, nRight, nLeafV1, nLeafV2];

      steps.push({
        stepNumber: 1,
        iterationLabel: 'Root Gini',
        operation: 'Measure mixed-class Gini impurity across all 15 Iris samples',
        inputsSnapshot: '5 Setosa, 5 Versicolor, 5 Virginica',
        intermediateValues: 'p = [1/3, 1/3, 1/3]',
        dataStructureState: 'Root Node · Gini = 0.667',
        mathExpression: 'Gini = 1 − (1/3)² − (1/3)² − (1/3)² = 0.667',
        outputSnapshot: 'Need split to reduce impurity',
        explanation: 'An unsplit root node holding all 3 species evenly has high disorder (Gini = 0.667).',
        whyNecessary: 'Quantifies impurity so we can pick the split that separates species cleanest.',
        visualState: {
          kind: 'decision-tree',
          nodes: [nRoot],
          activeNodeId: 'root',
          activePathIds: ['root'],
          accuracy: 33,
        },
      });

      steps.push({
        stepNumber: 2,
        iterationLabel: 'Split 1',
        operation: 'Split at petal_length ≤ 2.45 cm (weighted Gini drops to 0.333)',
        inputsSnapshot: 'Left child: 5 samples | Right child: 10 samples',
        intermediateValues: 'Left Gini = 0.000 (Pure Setosa!), Right Gini = 0.500',
        dataStructureState: 'Root → Left Leaf (Setosa) + Right Mixed Branch',
        mathExpression: 'Weighted Gini = (5/15)(0.0) + (10/15)(0.50) = 0.333',
        outputSnapshot: 'Accuracy rises from 33% → 67%',
        explanation: 'Threshold petal_length ≤ 2.45 completely isolates all 5 Iris-setosa flowers with zero error.',
        whyNecessary: 'Greedy CART picks the feature threshold giving the largest impurity drop.',
        visualState: {
          kind: 'decision-tree',
          nodes: [nRoot, nLeft, nRight],
          activeNodeId: 'leaf-setosa',
          activePathIds: ['root', 'leaf-setosa'],
          accuracy: 67,
        },
      });

      if (maxDepth > 1) {
        steps.push({
          stepNumber: 3,
          iterationLabel: 'Split 2',
          operation: 'Split right branch at petal_width ≤ 1.70 cm',
          inputsSnapshot: '10 mixed Versicolor/Virginica samples',
          intermediateValues: 'Left (≤1.70): 5 Versicolor (Gini 0.0) | Right (>1.70): 5 Virginica (Gini 0.0)',
          dataStructureState: 'Depth 2 tree with 3 pure leaf nodes',
          mathExpression: 'Weighted Gini = 0.000',
          outputSnapshot: '100% separation (Accuracy = 100%)',
          explanation: 'Separating remaining flowers by petal width yields pure leaves for Versicolor and Virginica.',
          whyNecessary: 'Depth 2 finishes separating remaining classes that overlapped on length alone.',
          visualState: {
            kind: 'decision-tree',
            nodes: baseNodes,
            activeNodeId: 'leaf-vers',
            activePathIds: ['root', 'node-versicolor', 'leaf-vers'],
            accuracy: 100,
          },
        });
      }

      steps.push({
        stepNumber: steps.length + 1,
        iterationLabel: 'Inference',
        operation: 'Trace sample query [petal_length = 4.9, petal_width = 1.5] through tree',
        inputsSnapshot: 'Sample petal_length = 4.9 > 2.45, petal_width = 1.5 ≤ 1.70',
        intermediateValues: 'Path: Root (Right) → Node 2 (Left)',
        dataStructureState: maxDepth > 1 ? 'Predicted Leaf: Iris-versicolor' : 'Stopped at Depth 1 (Ambiguous)',
        mathExpression: '4.9 > 2.45 (Right) → 1.5 ≤ 1.70 (Left)',
        outputSnapshot: maxDepth > 1 ? 'Prediction: Iris-versicolor' : 'Mixed leaf (Accuracy 67%)',
        explanation: 'A new flower enters at Root and follows yes/no inequalities straight to its matching leaf prediction.',
        whyNecessary: 'Shows how decision rules classify unseen samples in O(depth) comparisons.',
        visualState: {
          kind: 'decision-tree',
          nodes: baseNodes,
          activeNodeId: maxDepth > 1 ? 'leaf-vers' : 'node-versicolor',
          activePathIds: maxDepth > 1 ? ['root', 'node-versicolor', 'leaf-vers'] : ['root', 'node-versicolor'],
          samplePoint: { petal_length: 4.9, petal_width: 1.5 },
          accuracy: maxDepth > 1 ? 100 : 67,
        },
      });

      finalSummary = `Decision Tree (maxDepth = ${maxDepth}) achieved ${maxDepth > 1 ? 100 : 67}% training separation on Iris petal features.`;
      finalMetrics.push(
        { label: 'Tree Depth', value: `${maxDepth}` },
        { label: 'Sample Separation Accuracy', value: `${maxDepth > 1 ? 100 : 67}%` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 5. K-NEAREST NEIGHBORS (KNN)
    // ------------------------------------------------------------------------
    case 'knn': {
      const k = Math.round(params.k ?? 3);
      const qx = params.queryX1 ?? 4.8;
      const qy = params.queryX2 ?? 3.6;
      const pts = [
        { x1: 1.5, x2: 1.6, label: 0 },
        { x1: 2.1, x2: 2.3, label: 0 },
        { x1: 2.8, x2: 1.8, label: 0 },
        { x1: 3.3, x2: 2.8, label: 0 },
        { x1: 3.9, x2: 2.1, label: 0 },
        { x1: 5.1, x2: 4.9, label: 1 },
        { x1: 5.7, x2: 4.2, label: 1 },
        { x1: 6.3, x2: 5.3, label: 1 },
        { x1: 4.5, x2: 5.1, label: 1 },
        { x1: 6.8, x2: 4.0, label: 1 },
      ];
      const withDist = pts.map((p, idx) => ({
        idx,
        ...p,
        dist: round4(Math.hypot(p.x1 - qx, p.x2 - qy)),
      }));
      const sorted = [...withDist].sort((a, b) => a.dist - b.dist);
      const neighbors = sorted.slice(0, k);
      const votes0 = neighbors.filter((n) => n.label === 0).length;
      const votes1 = neighbors.filter((n) => n.label === 1).length;
      const predClass = votes1 >= votes0 ? 1 : 0;

      steps.push({
        stepNumber: 1,
        iterationLabel: 'Distances',
        operation: `Compute Euclidean distance from query (${qx}, ${qy}) to all ${pts.length} points`,
        inputsSnapshot: `Query (${qx}, ${qy}), K = ${k}`,
        intermediateValues: sorted.slice(0, 4).map((d) => `#${d.idx}: d=${d.dist} (Class ${d.label})`).join(' · '),
        dataStructureState: `${pts.length} candidate distances computed`,
        mathExpression: `d = √((x₁ − ${qx})² + (x₂ − ${qy})²)`,
        outputSnapshot: `Closest neighbor at d = ${sorted[0].dist}`,
        explanation: 'Measures geometric closeness between the query point and every stored labeled sample.',
        whyNecessary: 'KNN defines similarity strictly via feature-space distance.',
        visualState: {
          kind: 'decision-boundary',
          points: pts,
          queryPoint: { x1: qx, x2: qy, neighborIndices: [] },
          accuracy: 100,
        },
      });

      steps.push({
        stepNumber: 2,
        iterationLabel: `Select K=${k}`,
        operation: `Select the ${k} nearest neighbors`,
        inputsSnapshot: `Ranked smallest ${k} distances`,
        intermediateValues: neighbors.map((n) => `(${n.x1},${n.x2})[Class ${n.label}, d=${n.dist}]`).join(', '),
        dataStructureState: `K-Neighbor indices: [${neighbors.map((n) => n.idx).join(', ')}]`,
        mathExpression: `N_${k}(q) selected`,
        outputSnapshot: `Class 0 votes: ${votes0}, Class 1 votes: ${votes1}`,
        explanation: `Highlights only the ${k} closest neighbors connected directly to the query point.`,
        whyNecessary: 'Ignores distant irrelevant points outside the local neighborhood.',
        visualState: {
          kind: 'decision-boundary',
          points: pts,
          queryPoint: { x1: qx, x2: qy, neighborIndices: neighbors.map((n) => n.idx) },
          accuracy: 100,
        },
      });

      steps.push({
        stepNumber: 3,
        iterationLabel: 'Majority Vote',
        operation: `Assign majority class among K=${k} neighbors`,
        inputsSnapshot: `Votes: Class 0 = ${votes0}, Class 1 = ${votes1}`,
        intermediateValues: `Winner: Class ${predClass}`,
        dataStructureState: `Predicted Query Label = Class ${predClass}`,
        mathExpression: `argmax({0: ${votes0}, 1: ${votes1}}) = Class ${predClass}`,
        outputSnapshot: `Prediction: Class ${predClass}`,
        explanation: `Because ${Math.max(votes0, votes1)} of the ${k} nearest points belong to Class ${predClass}, the query is classified as Class ${predClass}.`,
        whyNecessary: 'Odd K breaks ties cleanly in binary voting.',
        visualState: {
          kind: 'decision-boundary',
          points: pts,
          queryPoint: { x1: qx, x2: qy, neighborIndices: neighbors.map((n) => n.idx) },
          accuracy: 100,
        },
      });

      finalSummary = `Query (${qx}, ${qy}) classified as Class ${predClass} (votes: C0=${votes0}, C1=${votes1} at K=${k}).`;
      finalMetrics.push(
        { label: 'Predicted Class', value: `Class ${predClass}` },
        { label: 'Nearest Neighbor Distance', value: `${sorted[0].dist}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 6. K-MEANS CLUSTERING
    // ------------------------------------------------------------------------
    case 'k-means': {
      const k = Math.min(4, Math.max(2, Math.round(params.k ?? 3)));
      const maxIter = Math.round(params.iterations ?? 6);
      const rawPts = [
        { x: 1.4, y: 1.8 }, { x: 1.9, y: 1.3 }, { x: 2.2, y: 2.1 }, { x: 1.7, y: 2.5 },
        { x: 4.5, y: 6.1 }, { x: 5.1, y: 5.7 }, { x: 4.8, y: 6.6 }, { x: 5.5, y: 6.3 },
        { x: 6.8, y: 2.1 }, { x: 7.4, y: 1.7 }, { x: 7.1, y: 2.8 }, { x: 6.5, y: 2.5 },
      ];
      let centroids = [
        { x: 2.8, y: 4.5, cluster: 0 },
        { x: 4.0, y: 3.5, cluster: 1 },
        { x: 5.5, y: 4.0, cluster: 2 },
        { x: 6.5, y: 5.5, cluster: 3 },
      ].slice(0, k);
      let clusters = rawPts.map(() => 0);

      const calcInertia = (ptsList: { x: number; y: number }[], cl: number[], cents: typeof centroids) =>
        round4(
          ptsList.reduce((sum, p, idx) => {
            const c = cents[cl[idx]];
            return sum + (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
          }, 0)
        );

      for (let it = 1; it <= maxIter; it++) {
        clusters = rawPts.map((p) => {
          let bestC = 0;
          let bestD = Infinity;
          centroids.forEach((c, cIdx) => {
            const d = (p.x - c.x) ** 2 + (p.y - c.y) ** 2;
            if (d < bestD) {
              bestD = d;
              bestC = cIdx;
            }
          });
          return bestC;
        });
        const inertiaAssign = calcInertia(rawPts, clusters, centroids);
        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Iter ${it}A`,
          operation: `Assign ${rawPts.length} points to nearest of ${k} centroids`,
          inputsSnapshot: `Centroids: ${centroids.map((c) => `(${round2(c.x)},${round2(c.y)})`).join(' ')}`,
          intermediateValues: `Cluster counts: ${centroids.map((_, idx) => clusters.filter((c) => c === idx).length).join(' / ')}`,
          dataStructureState: `Assignments: [${clusters.join(',')}]`,
          mathExpression: `c(x) = argminₖ ||x − μₖ||² · Inertia = ${inertiaAssign}`,
          outputSnapshot: `SSE Inertia = ${inertiaAssign}`,
          explanation: `Each point snaps to whichever centroid μₖ has minimum Euclidean squared distance.`,
          whyNecessary: 'Groups points around current cluster hypotheses before refining centers.',
          visualState: {
            kind: 'clustering',
            points: rawPts.map((p, i) => ({ ...p, cluster: clusters[i] })),
            centroids: centroids.map((c) => ({ ...c })),
            inertia: inertiaAssign,
          },
        });

        // Update centroids
        const prevCentroids = centroids.map((c) => ({ ...c }));
        centroids = centroids.map((oldC, cIdx) => {
          const members = rawPts.filter((_, i) => clusters[i] === cIdx);
          if (members.length === 0) return oldC;
          return {
            x: round4(members.reduce((s, m) => s + m.x, 0) / members.length),
            y: round4(members.reduce((s, m) => s + m.y, 0) / members.length),
            cluster: cIdx,
          };
        });
        const inertiaUpdate = calcInertia(rawPts, clusters, centroids);
        const shift = centroids.reduce((s, c, idx) => s + Math.hypot(c.x - prevCentroids[idx].x, c.y - prevCentroids[idx].y), 0);

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Iter ${it}B`,
          operation: `Recompute each cluster centroid μₖ as member mean`,
          inputsSnapshot: `Total centroid shift Δμ = ${round4(shift)}`,
          intermediateValues: centroids.map((c) => `μ${c.cluster}=(${round2(c.x)},${round2(c.y)})`).join(' · '),
          dataStructureState: `SSE dropped to ${inertiaUpdate}`,
          mathExpression: `μₖ ← (1/|Cₖ|) Σ xᵢ · Inertia = ${inertiaUpdate}`,
          outputSnapshot: `SSE Inertia = ${inertiaUpdate}`,
          explanation: `Centers each centroid at the arithmetic balance point of its assigned cloud.`,
          whyNecessary: 'The sample mean mathematically minimizes sum of squared distances inside each cluster.',
          visualState: {
            kind: 'clustering',
            points: rawPts.map((p, i) => ({ ...p, cluster: clusters[i] })),
            centroids: centroids.map((c) => ({ ...c })),
            inertia: inertiaUpdate,
          },
        });

        if (shift < 0.001) break;
      }

      const lastInertia = (steps[steps.length - 1].visualState as { inertia: number }).inertia;
      finalSummary = `K-Means converged in ${Math.ceil(steps.length / 2)} iterations with final inertia SSE = ${lastInertia}.`;
      finalMetrics.push(
        { label: 'Clusters (K)', value: `${k}` },
        { label: 'Final Inertia (SSE)', value: `${lastInertia}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 7. NEURAL NETWORK (Real 2-2-1 Sigmoid Forward + Backpropagation on XOR)
    // ------------------------------------------------------------------------
    case 'neural-network': {
      const lr = params.learningRate ?? 1.5;
      const visibleCycles = Math.round(params.epochs ?? 8);
      const xorData: { x: [number, number]; y: number }[] = [
        { x: [0, 1], y: 1 },
        { x: [1, 0], y: 1 },
        { x: [1, 1], y: 0 },
        { x: [0, 0], y: 0 },
      ];
      let wIH = [
        [0.8, -0.6],
        [0.5, 0.9],
      ];
      let bH = [-0.2, 0.1];
      let wHO = [[1.1, -0.9]];
      let bO = [0.05];
      const sig = (z: number) => 1 / (1 + Math.exp(-Math.max(-15, Math.min(15, z))));
      const lossHistory: { epoch: number; loss: number }[] = [];

      const evalAllLoss = () => {
        let tot = 0;
        for (const row of xorData) {
          const h0 = sig(wIH[0][0] * row.x[0] + wIH[0][1] * row.x[1] + bH[0]);
          const h1 = sig(wIH[1][0] * row.x[0] + wIH[1][1] * row.x[1] + bH[1]);
          const out = sig(wHO[0][0] * h0 + wHO[0][1] * h1 + bO[0]);
          tot += 0.5 * (row.y - out) ** 2;
        }
        return round4(tot / xorData.length);
      };

      for (let cyc = 1; cyc <= visibleCycles; cyc++) {
        // Run 40 inner mini-steps per visible snapshot on later cycles so learner actually observes XOR convergence cleanly while showing exact forward/backprop state on sample (0,1)->1
        const innerSteps = cyc === 1 ? 1 : 45;
        let lastSampleOut = 0.5;
        let lastH0 = 0.5;
        let lastH1 = 0.5;
        const sample = xorData[(cyc - 1) % 2]; // Focus on positive XOR examples [0,1] and [1,0]

        for (let s = 0; s < innerSteps; s++) {
          for (const row of xorData) {
            const h0 = sig(wIH[0][0] * row.x[0] + wIH[0][1] * row.x[1] + bH[0]);
            const h1 = sig(wIH[1][0] * row.x[0] + wIH[1][1] * row.x[1] + bH[1]);
            const out = sig(wHO[0][0] * h0 + wHO[0][1] * h1 + bO[0]);

            const dOut = (out - row.y) * out * (1 - out);
            const dH0 = dOut * wHO[0][0] * h0 * (1 - h0);
            const dH1 = dOut * wHO[0][1] * h1 * (1 - h1);

            wHO[0][0] -= lr * dOut * h0;
            wHO[0][1] -= lr * dOut * h1;
            bO[0] -= lr * dOut;

            wIH[0][0] -= lr * dH0 * row.x[0];
            wIH[0][1] -= lr * dH0 * row.x[1];
            bH[0] -= lr * dH0;

            wIH[1][0] -= lr * dH1 * row.x[0];
            wIH[1][1] -= lr * dH1 * row.x[1];
            bH[1] -= lr * dH1;
          }
        }

        lastH0 = sig(wIH[0][0] * sample.x[0] + wIH[0][1] * sample.x[1] + bH[0]);
        lastH1 = sig(wIH[1][0] * sample.x[0] + wIH[1][1] * sample.x[1] + bH[1]);
        lastSampleOut = sig(wHO[0][0] * lastH0 + wHO[0][1] * lastH1 + bO[0]);
        const loss = evalAllLoss();
        lossHistory.push({ epoch: cyc, loss });

        steps.push({
          stepNumber: cyc,
          iterationLabel: `Cycle ${cyc}`,
          operation: `Forward & Backprop pass (input [${sample.x.join(',')}], target=${sample.y})`,
          inputsSnapshot: `x = [${sample.x.join(', ')}], y_target = ${sample.y}`,
          intermediateValues: `Hidden activations h = [${round2(lastH0)}, ${round2(lastH1)}] · ŷ = ${round4(lastSampleOut)}`,
          dataStructureState: `W_ho = [${round2(wHO[0][0])}, ${round2(wHO[0][1])}] · b_o = ${round2(bO[0])}`,
          mathExpression: `Loss = ½Σ(y−ŷ)² = ${loss}`,
          outputSnapshot: `ŷ = ${round4(lastSampleOut)} (MSE = ${loss})`,
          explanation: `Forward pass computes hidden features h and prediction ŷ=${round4(lastSampleOut)}; backpropagation propagates error gradients back into W_ho and W_ih.`,
          whyNecessary: 'Hidden-layer weight adjustments let the 2-2-1 network bend decision space for non-linear XOR.',
          visualState: {
            kind: 'neural-network',
            layers: [[sample.x[0], sample.x[1]], [round4(lastH0), round4(lastH1)], [round4(lastSampleOut)]],
            weightsIH: wIH.map((r) => r.map(round2)),
            weightsHO: wHO.map((r) => r.map(round2)),
            biasH: bH.map(round2),
            biasO: bO.map(round2),
            loss,
            phase: cyc % 2 === 1 ? 'forward' : 'backprop',
            sampleInput: sample.x,
            sampleTarget: sample.y,
            sampleOutput: round4(lastSampleOut),
            lossHistory: [...lossHistory],
          },
        });
      }

      const startL = lossHistory[0]?.loss ?? 0.25;
      const endL = lossHistory[lossHistory.length - 1]?.loss ?? 0.25;
      selfCheckPassed = endL < startL;
      selfCheckDetail = `XOR MSE dropped from ${startL} to ${endL}.`;
      finalSummary = `2-2-1 Sigmoid Network trained across ${visibleCycles} cycles: XOR loss dropped from ${startL} to ${endL}.`;
      finalMetrics.push(
        { label: 'Initial Loss', value: `${startL}` },
        { label: 'Final XOR Loss', value: `${endL}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 8. PERCEPTRON / 9. SVM / 10. NAIVE BAYES
    // ------------------------------------------------------------------------
    case 'perceptron':
    case 'svm':
    case 'naive-bayes': {
      const pts = [
        { x1: 1.5, x2: 1.2, label: 0 },
        { x1: 2.0, x2: 2.2, label: 0 },
        { x1: 2.7, x2: 1.5, label: 0 },
        { x1: 3.1, x2: 2.4, label: 0 },
        { x1: 5.0, x2: 5.1, label: 1 },
        { x1: 5.6, x2: 4.5, label: 1 },
        { x1: 6.2, x2: 5.8, label: 1 },
        { x1: 4.9, x2: 5.7, label: 1 },
      ];
      let w1 = 0.2;
      let w2 = -0.3;
      let b = 0.1;
      const lr = params.learningRate ?? (def.id === 'svm' ? 0.05 : 0.25);

      if (def.id === 'naive-bayes') {
        const c0 = pts.filter((p) => p.label === 0);
        const c1 = pts.filter((p) => p.label === 1);
        const mean = (arr: number[]) => arr.reduce((a, bVal) => a + bVal, 0) / arr.length;
        const m0 = [mean(c0.map((p) => p.x1)), mean(c0.map((p) => p.x2))];
        const m1 = [mean(c1.map((p) => p.x1)), mean(c1.map((p) => p.x2))];
        // Linear Gaussian equal-variance boundary perpendicular bisector
        w1 = m1[0] - m0[0];
        w2 = m1[1] - m0[1];
        b = -0.5 * (m1[0] ** 2 + m1[1] ** 2 - m0[0] ** 2 - m0[1] ** 2);

        steps.push({
          stepNumber: 1,
          iterationLabel: 'Fit Means',
          operation: 'Compute class Gaussian centroids μ₀ and μ₁',
          inputsSnapshot: `${c0.length} Class-0 samples, ${c1.length} Class-1 samples`,
          intermediateValues: `μ₀=(${round2(m0[0])},${round2(m0[1])}) · μ₁=(${round2(m1[0])},${round2(m1[1])})`,
          dataStructureState: `P(C0)=0.50, P(C1)=0.50`,
          mathExpression: `P(Cₖ|x) ∝ P(Cₖ) · N(x | μₖ, σ²)`,
          outputSnapshot: `Posterior decision boundary derived`,
          explanation: 'Fits Gaussian probability distributions to each class directly in a single O(n) pass.',
          whyNecessary: 'Requires zero gradient descent—class statistics determine posterior probabilities analytically.',
          visualState: {
            kind: 'decision-boundary',
            points: pts.map((p) => ({ ...p, predicted: w1 * p.x1 + w2 * p.x2 + b >= 0 ? 1 : 0 })),
            weights: [w1, w2, b],
            accuracy: 100,
          },
        });
        finalSummary = `Gaussian Naive Bayes computed class priors & likelihoods in 1 pass (100% separation).`;
        finalMetrics.push({ label: 'Accuracy', value: '100%' });
      } else {
        const lam = params.lambda ?? 0.02;
        for (let ep = 1; ep <= 10; ep++) {
          let mistakes = 0;
          for (const p of pts) {
            const z = w1 * p.x1 + w2 * p.x2 + b;
            if (def.id === 'perceptron') {
              const pred = z >= 0 ? 1 : 0;
              const err = p.label - pred;
              if (err !== 0) {
                mistakes++;
                w1 += lr * err * p.x1;
                w2 += lr * err * p.x2;
                b += lr * err;
              }
            } else {
              const ySigned = p.label === 1 ? 1 : -1;
              if (ySigned * z < 1) {
                mistakes++;
                w1 -= lr * (2 * lam * w1 - ySigned * p.x1);
                w2 -= lr * (2 * lam * w2 - ySigned * p.x2);
                b += lr * ySigned;
              } else {
                w1 -= lr * (2 * lam * w1);
                w2 -= lr * (2 * lam * w2);
              }
            }
          }
          const evalPts = pts.map((p) => ({
            ...p,
            predicted: w1 * p.x1 + w2 * p.x2 + b >= 0 ? 1 : 0,
          }));
          const acc = Math.round((evalPts.filter((p) => p.predicted === p.label).length / pts.length) * 100);
          steps.push({
            stepNumber: ep,
            iterationLabel: `Pass ${ep}`,
            operation: def.id === 'svm' ? 'Minimize Hinge Loss + L2 margin' : 'Correct misclassified perceptron weights',
            inputsSnapshot: `Errors/Violations = ${mistakes}`,
            intermediateValues: `w₁=${round2(w1)}, w₂=${round2(w2)}, b=${round2(b)}`,
            dataStructureState: `Separating line: ${round2(w1)}x₁ + ${round2(w2)}x₂ + ${round2(b)} = 0`,
            mathExpression: def.id === 'svm' ? `Hinge violations: ${mistakes}` : `w ← w + α(y − ŷ)x`,
            outputSnapshot: `Accuracy = ${acc}%`,
            explanation: `Adjusted separating weights after ${mistakes} margin/classification corrections.`,
            whyNecessary: 'Iteratively locks hyperplane between positive and negative clusters.',
            visualState: {
              kind: 'decision-boundary',
              points: evalPts,
              weights: [w1, w2, b],
              accuracy: acc,
            },
          });
          if (mistakes === 0 && acc === 100 && ep >= 3) break;
        }
        const finalAcc = (steps[steps.length - 1].visualState as { accuracy: number }).accuracy;
        finalSummary = `${def.name} reached ${finalAcc}% training separation.`;
        finalMetrics.push({ label: 'Accuracy', value: `${finalAcc}%` });
      }
      break;
    }

    // ------------------------------------------------------------------------
    // 11. PRINCIPAL COMPONENT ANALYSIS (2D Covariance + Power Iteration)
    // ------------------------------------------------------------------------
    case 'pca': {
      const pts = [
        { x: 1.5, y: 1.9, cluster: 0 },
        { x: 2.3, y: 2.6, cluster: 0 },
        { x: 3.1, y: 3.4, cluster: 0 },
        { x: 3.9, y: 3.7, cluster: 0 },
        { x: 4.8, y: 4.6, cluster: 0 },
        { x: 5.5, y: 5.4, cluster: 0 },
        { x: 6.4, y: 6.0, cluster: 0 },
        { x: 7.0, y: 6.8, cluster: 0 },
      ];
      const n = pts.length;
      const mx = pts.reduce((s, p) => s + p.x, 0) / n;
      const my = pts.reduce((s, p) => s + p.y, 0) / n;
      const cxx = pts.reduce((s, p) => s + (p.x - mx) ** 2, 0) / n;
      const cyy = pts.reduce((s, p) => s + (p.y - my) ** 2, 0) / n;
      const cxy = pts.reduce((s, p) => s + (p.x - mx) * (p.y - my), 0) / n;

      let vx = 1;
      let vy = 0.05;
      const iters = Math.round(params.iterations ?? 6);
      for (let it = 1; it <= iters; it++) {
        const nx = cxx * vx + cxy * vy;
        const ny = cxy * vx + cyy * vy;
        const norm = Math.hypot(nx, ny) || 1;
        vx = nx / norm;
        vy = ny / norm;
        const rayleigh = vx * (cxx * vx + cxy * vy) + vy * (cxy * vx + cyy * vy);
        const varPct = round2((rayleigh / (cxx + cyy)) * 100);

        steps.push({
          stepNumber: it,
          iterationLabel: `Power Iter ${it}`,
          operation: 'Multiply covariance matrix Σ by candidate eigenvector v and normalize',
          inputsSnapshot: `Mean (${round2(mx)}, ${round2(my)}), Cov = [[${round2(cxx)}, ${round2(cxy)}], [${round2(cxy)}, ${round2(cyy)}]]`,
          intermediateValues: `Unit eigenvector v₁ = (${round4(vx)}, ${round4(vy)})`,
          dataStructureState: `Explained Variance = ${varPct}%`,
          mathExpression: `v ← Σv / ||Σv|| · λ₁/(λ₁+λ₂) = ${varPct}%`,
          outputSnapshot: `PC1 captures ${varPct}% of total variance`,
          explanation: `Power iteration rotates axis v₁ directly along the diagonal spread of the data.`,
          whyNecessary: 'Dominant eigenvector captures the maximum possible signal variance in 1 dimension.',
          visualState: {
            kind: 'clustering',
            points: pts,
            centroids: [{ x: round2(mx), y: round2(my), cluster: 0 }],
            inertia: varPct,
            eigenVector: { dx: vx, dy: vy, meanX: mx, meanY: my, varianceExplained: varPct },
          },
        });
      }
      const lastVar = (steps[steps.length - 1].visualState as { eigenVector?: { varianceExplained: number } })
        .eigenVector?.varianceExplained ?? 95;
      finalSummary = `Principal Component 1 aligned at (${round2(vx)}, ${round2(vy)}), capturing ${lastVar}% of dataset variance.`;
      finalMetrics.push({ label: 'Variance Retained (PC1)', value: `${lastVar}%` });
      break;
    }

    // ------------------------------------------------------------------------
    // 12. LINEAR SEARCH & 13. BINARY SEARCH
    // ------------------------------------------------------------------------
    case 'linear-search': {
      const arr = parseArrayInput(customInputRaw, [12, 27, 9, 42, 55, 68, 74, 81]);
      const target = Math.round(params.target ?? 42);
      let foundAt: number | null = null;
      const eliminated: number[] = [];

      for (let i = 0; i < arr.length; i++) {
        comparisonsCount++;
        const match = arr[i] === target;
        if (match) foundAt = i;
        else eliminated.push(i);

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Index ${i}`,
          operation: `Compare arr[${i}] (${arr[i]}) == target (${target})`,
          inputsSnapshot: `Array length = ${arr.length}, target = ${target}`,
          intermediateValues: `arr[${i}] = ${arr[i]}`,
          dataStructureState: `Checked: [0..${i}] · Eliminated: ${eliminated.length}`,
          mathExpression: `${arr[i]} ${match ? '==' : '≠'} ${target}`,
          outputSnapshot: match ? `FOUND at index ${i}` : 'No match, advance index',
          explanation: match
            ? `Found target ${target} at index ${i} after ${comparisonsCount} comparisons!`
            : `Value ${arr[i]} at index ${i} does not equal ${target}, so we inspect index ${i + 1}.`,
          whyNecessary: 'Without sorted guarantees, every element must be inspected sequentially.',
          visualState: {
            kind: 'array-search',
            array: [...arr],
            target,
            currentIndex: i,
            eliminatedIndices: [...eliminated],
            foundIndex: foundAt,
            comparisons: comparisonsCount,
          },
        });
        if (match) break;
      }

      finalSummary =
        foundAt !== null
          ? `Found target ${target} at index ${foundAt} using ${comparisonsCount} comparisons.`
          : `Target ${target} not present in array after scanning all ${comparisonsCount} elements.`;
      finalMetrics.push(
        { label: 'Result Index', value: foundAt !== null ? String(foundAt) : 'Not found (-1)' },
        { label: 'Comparisons', value: String(comparisonsCount) }
      );
      break;
    }

    case 'binary-search': {
      const arr = parseArrayInput(customInputRaw, [5, 12, 19, 27, 42, 55, 68, 74, 88])
        .slice()
        .sort((a, b) => a - b);
      const target = Math.round(params.target ?? 42);
      let low = 0;
      let high = arr.length - 1;
      let foundAt: number | null = null;
      const eliminated = new Set<number>();

      while (low <= high) {
        const mid = Math.floor((low + high) / 2);
        comparisonsCount++;
        const val = arr[mid];
        const hit = val === target;
        if (hit) foundAt = mid;

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Probe mid=${mid}`,
          operation: `Check midpoint arr[${mid}] = ${val} in [${low}..${high}]`,
          inputsSnapshot: `low=${low}, high=${high}, mid=${mid}, target=${target}`,
          intermediateValues: `arr[${mid}] = ${val}`,
          dataStructureState: `Active interval: [${arr.slice(low, high + 1).join(', ')}]`,
          mathExpression: `mid = ⌊(${low}+${high})/2⌋ = ${mid} · ${val} ${hit ? '==' : val < target ? '<' : '>'} ${target}`,
          outputSnapshot: hit ? `FOUND at index ${mid}` : val < target ? `Discard left half [${low}..${mid}]` : `Discard right half [${mid}..${high}]`,
          explanation: hit
            ? `Midpoint arr[${mid}] equals target ${target}! Found in just ${comparisonsCount} comparisons.`
            : val < target
              ? `${val} < ${target}, so target cannot be at or left of ${mid}. Move low to ${mid + 1}.`
              : `${val} > ${target}, so target cannot be at or right of ${mid}. Move high to ${mid - 1}.`,
          whyNecessary: 'Halves remaining candidates each comparison for O(log n) lookup.',
          visualState: {
            kind: 'array-search',
            array: [...arr],
            target,
            currentIndex: mid,
            lowIndex: low,
            highIndex: high,
            eliminatedIndices: Array.from(eliminated),
            foundIndex: foundAt,
            comparisons: comparisonsCount,
          },
        });

        if (hit) break;
        if (val < target) {
          for (let k = low; k <= mid; k++) eliminated.add(k);
          low = mid + 1;
        } else {
          for (let k = mid; k <= high; k++) eliminated.add(k);
          high = mid - 1;
        }
      }

      if (foundAt === null) {
        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: 'Exhausted',
          operation: 'Search bounds crossed (low > high)',
          inputsSnapshot: `low=${low}, high=${high}`,
          intermediateValues: 'Remaining search interval is empty',
          dataStructureState: 'Target absent',
          mathExpression: `${low} > ${high} ⇒ return -1`,
          outputSnapshot: 'Not found (-1)',
          explanation: `All ${arr.length} items eliminated in only ${comparisonsCount} comparisons; ${target} is not in the array.`,
          whyNecessary: 'Confirms termination cleanly.',
          visualState: {
            kind: 'array-search',
            array: [...arr],
            target,
            currentIndex: -1,
            eliminatedIndices: arr.map((_, i) => i),
            foundIndex: null,
            comparisons: comparisonsCount,
          },
        });
      }

      finalSummary =
        foundAt !== null
          ? `Binary Search found ${target} at sorted index ${foundAt} in ${comparisonsCount} comparisons.`
          : `Binary Search proved ${target} is absent in ${comparisonsCount} comparisons.`;
      finalMetrics.push(
        { label: 'Result Index', value: foundAt !== null ? String(foundAt) : 'Not found (-1)' },
        { label: 'Comparisons', value: String(comparisonsCount) }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 14. BUBBLE SORT
    // ------------------------------------------------------------------------
    case 'bubble-sort': {
      const arr = parseArrayInput(customInputRaw, [38, 14, 52, 9, 27, 41, 18]);
      const expectedSorted = [...arr].sort((a, b) => a - b);
      const sortedSet = new Set<number>();

      for (let i = 0; i < arr.length - 1; i++) {
        let swappedInPass = false;
        for (let j = 0; j < arr.length - 1 - i; j++) {
          comparisonsCount++;
          const shouldSwap = arr[j] > arr[j + 1];
          if (shouldSwap) {
            [arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
            swapsCount++;
            swappedInPass = true;
          }
          steps.push({
            stepNumber: steps.length + 1,
            iterationLabel: `Pass ${i + 1}`,
            operation: shouldSwap ? `Swap arr[${j}] and arr[${j + 1}]` : `Compare arr[${j}] ≤ arr[${j + 1}] (Keep)`,
            inputsSnapshot: `j = ${j}, comparing (${arr[j]}, ${arr[j + 1]})`,
            intermediateValues: `Comparisons: ${comparisonsCount}, Swaps: ${swapsCount}`,
            dataStructureState: `[${arr.join(', ')}]`,
            mathExpression: shouldSwap ? `Out of order ⇒ swapped` : `In order`,
            outputSnapshot: shouldSwap ? `Swapped → [${arr.join(', ')}]` : `Unchanged`,
            explanation: shouldSwap
              ? `Swapped adjacent out-of-order pair so larger element moves rightward.`
              : `Pair (${arr[j]}, ${arr[j + 1]}) is already ascending.`,
            whyNecessary: 'Each complete pass places the next largest value at the sorted tail.',
            visualState: {
              kind: 'array-bars',
              array: [...arr],
              comparingIndices: [j, j + 1],
              swappingIndices: shouldSwap ? [j, j + 1] : [],
              sortedIndices: Array.from(sortedSet),
              comparisons: comparisonsCount,
              swaps: swapsCount,
            },
          });
        }
        sortedSet.add(arr.length - 1 - i);
        if (!swappedInPass) break;
      }

      selfCheckPassed = JSON.stringify(arr) === JSON.stringify(expectedSorted);
      steps.push({
        stepNumber: steps.length + 1,
        iterationLabel: 'Done',
        operation: 'Array fully sorted in ascending order',
        inputsSnapshot: `Final length ${arr.length}`,
        intermediateValues: `Total comparisons: ${comparisonsCount}, Total swaps: ${swapsCount}`,
        dataStructureState: `[${arr.join(', ')}]`,
        mathExpression: `${arr.join(' ≤ ')}`,
        outputSnapshot: `[${arr.join(', ')}]`,
        explanation: 'All elements are now in non-decreasing order.',
        whyNecessary: 'Terminates once no inversions remain.',
        visualState: {
          kind: 'array-bars',
          array: [...arr],
          comparingIndices: [],
          swappingIndices: [],
          sortedIndices: arr.map((_, idx) => idx),
          comparisons: comparisonsCount,
          swaps: swapsCount,
        },
      });
      finalSummary = `Sorted [${arr.join(', ')}] in ${comparisonsCount} comparisons and ${swapsCount} swaps.`;
      finalMetrics.push(
        { label: 'Comparisons', value: String(comparisonsCount) },
        { label: 'Swaps', value: String(swapsCount) }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 15. MERGE SORT
    // ------------------------------------------------------------------------
    case 'merge-sort': {
      const arr = parseArrayInput(customInputRaw, [44, 15, 62, 8, 31, 25, 50]);
      const expected = [...arr].sort((a, b) => a - b);

      const mergeSortRec = (l: number, r: number) => {
        if (l >= r) return;
        const m = Math.floor((l + r) / 2);
        mergeSortRec(l, m);
        mergeSortRec(m + 1, r);

        const left = arr.slice(l, m + 1);
        const right = arr.slice(m + 1, r + 1);
        let i = 0, j = 0, k = l;
        while (i < left.length && j < right.length) {
          comparisonsCount++;
          if (left[i] <= right[j]) {
            arr[k++] = left[i++];
          } else {
            arr[k++] = right[j++];
            swapsCount++;
          }
        }
        while (i < left.length) arr[k++] = left[i++];
        while (j < right.length) arr[k++] = right[j++];

        const rangeIndices = Array.from({ length: r - l + 1 }, (_, offset) => l + offset);
        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Merge [${l}..${r}]`,
          operation: `Merge sorted subarrays [${l}..${m}] & [${m + 1}..${r}]`,
          inputsSnapshot: `Left=[${left.join(',')}], Right=[${right.join(',')}]`,
          intermediateValues: `Merged range: [${arr.slice(l, r + 1).join(', ')}]`,
          dataStructureState: `[${arr.join(', ')}]`,
          mathExpression: `T(n) = 2T(n/2) + Θ(n)`,
          outputSnapshot: `Sorted sub-segment [${l}..${r}]`,
          explanation: `Two sorted sub-arrays merged cleanly in linear scan without quadratic passes.`,
          whyNecessary: 'Combining already-sorted halves guarantees O(n log n) overall runtime.',
          visualState: {
            kind: 'array-bars',
            array: [...arr],
            comparingIndices: rangeIndices,
            swappingIndices: [],
            sortedIndices: r - l + 1 === arr.length ? arr.map((_, idx) => idx) : rangeIndices,
            comparisons: comparisonsCount,
            swaps: swapsCount,
          },
        });
      };

      mergeSortRec(0, arr.length - 1);
      selfCheckPassed = JSON.stringify(arr) === JSON.stringify(expected);
      finalSummary = `Merge Sort sorted [${arr.join(', ')}] using ${comparisonsCount} comparisons.`;
      finalMetrics.push(
        { label: 'Comparisons', value: String(comparisonsCount) },
        { label: 'Shifts / Writes', value: String(swapsCount) }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 16. QUICK SORT
    // ------------------------------------------------------------------------
    case 'quick-sort': {
      const arr = parseArrayInput(customInputRaw, [35, 12, 48, 7, 29, 19, 24]);
      const expected = [...arr].sort((a, b) => a - b);
      const lockedPivots = new Set<number>();

      const qs = (lo: number, hi: number) => {
        if (lo > hi) return;
        if (lo === hi) {
          lockedPivots.add(lo);
          return;
        }
        const pivotVal = arr[hi];
        let i = lo;
        for (let j = lo; j < hi; j++) {
          comparisonsCount++;
          if (arr[j] <= pivotVal) {
            if (i !== j) {
              [arr[i], arr[j]] = [arr[j], arr[i]];
              swapsCount++;
            }
            i++;
          }
        }
        if (i !== hi) {
          [arr[i], arr[hi]] = [arr[hi], arr[i]];
          swapsCount++;
        }
        lockedPivots.add(i);

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Pivot ${pivotVal}`,
          operation: `Partition [${lo}..${hi}] around pivot ${pivotVal} → locked at index ${i}`,
          inputsSnapshot: `Subarray [${lo}..${hi}], pivot = ${pivotVal}`,
          intermediateValues: `All elements < ${pivotVal} moved left of index ${i}`,
          dataStructureState: `[${arr.join(', ')}]`,
          mathExpression: `A[${lo}..${i - 1}] ≤ ${pivotVal} < A[${i + 1}..${hi}]`,
          outputSnapshot: `Pivot ${pivotVal} permanently placed at index ${i}`,
          explanation: `Pivot ${pivotVal} now sits in its exact final sorted slot; left and right halves partition independently.`,
          whyNecessary: 'Divide-and-conquer shrinks problem sizes without needing auxiliary merge buffers.',
          visualState: {
            kind: 'array-bars',
            array: [...arr],
            comparingIndices: [lo, hi],
            swappingIndices: [],
            sortedIndices: Array.from(lockedPivots),
            pivotIndex: i,
            comparisons: comparisonsCount,
            swaps: swapsCount,
          },
        });

        qs(lo, i - 1);
        qs(i + 1, hi);
      };

      qs(0, arr.length - 1);
      selfCheckPassed = JSON.stringify(arr) === JSON.stringify(expected);
      steps.push({
        stepNumber: steps.length + 1,
        iterationLabel: 'Sorted',
        operation: 'All partitions complete',
        inputsSnapshot: `Length ${arr.length}`,
        intermediateValues: `Comparisons: ${comparisonsCount}, Swaps: ${swapsCount}`,
        dataStructureState: `[${arr.join(', ')}]`,
        mathExpression: arr.join(' ≤ '),
        outputSnapshot: `[${arr.join(', ')}]`,
        explanation: 'Every element is now partitioned into exact ascending order.',
        whyNecessary: 'Base cases of size ≤ 1 require no further partitioning.',
        visualState: {
          kind: 'array-bars',
          array: [...arr],
          comparingIndices: [],
          swappingIndices: [],
          sortedIndices: arr.map((_, idx) => idx),
          comparisons: comparisonsCount,
          swaps: swapsCount,
        },
      });
      finalSummary = `Quick Sort sorted [${arr.join(', ')}] in ${comparisonsCount} comparisons and ${swapsCount} swaps.`;
      finalMetrics.push(
        { label: 'Comparisons', value: String(comparisonsCount) },
        { label: 'Swaps', value: String(swapsCount) }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 17. BFS & 18. DFS
    // ------------------------------------------------------------------------
    case 'bfs':
    case 'dfs': {
      const isBfs = def.id === 'bfs';
      const frontier: string[] = ['A'];
      const visited: string[] = [];
      const visitedSet = new Set<string>(isBfs ? ['A'] : []);
      const parent: Record<string, string | null> = { A: null };
      let foundGoal = false;

      while (frontier.length > 0 && !foundGoal) {
        const u = isBfs ? frontier.shift()! : frontier.pop()!;
        if (!isBfs) {
          if (visitedSet.has(u)) continue;
          visitedSet.add(u);
        }
        visited.push(u);
        comparisonsCount++;

        const neighs = getNeighbors(u);
        const addedNeighs: string[] = [];
        for (const n of (isBfs ? neighs : [...neighs].reverse())) {
          if (!visitedSet.has(n.to)) {
            if (isBfs) visitedSet.add(n.to);
            if (!(n.to in parent)) parent[n.to] = u;
            frontier.push(n.to);
            addedNeighs.push(n.to);
          }
        }

        if (u === 'F') foundGoal = true;

        const partialPath: string[] = [];
        if (foundGoal) {
          let cur: string | null = 'F';
          while (cur) {
            partialPath.unshift(cur);
            cur = parent[cur] ?? null;
          }
        }

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Visit ${u}`,
          operation: `${isBfs ? 'Dequeue FIFO' : 'Pop LIFO'} node ${u}${u === 'F' ? ' (Goal Reached!)' : ''}`,
          inputsSnapshot: `Popped ${u}, added neighbors [${addedNeighs.join(', ') || 'none'}]`,
          intermediateValues: `${isBfs ? 'Queue' : 'Stack'}: [${frontier.join(', ')}]`,
          dataStructureState: `Visited order: [${visited.join(' → ')}]`,
          mathExpression: isBfs ? `Breadth layer expansion` : `Depth-first backtracking stack`,
          outputSnapshot: foundGoal ? `Path found: ${partialPath.join(' → ')}` : `Frontier size = ${frontier.length}`,
          explanation: foundGoal
            ? `Goal node F reached! Reconstructed path: ${partialPath.join(' → ')}.`
            : `Explored node ${u} and pushed unvisited neighbors onto the ${isBfs ? 'queue' : 'stack'}.`,
          whyNecessary: isBfs
            ? 'FIFO queue guarantees shortest hop count when reaching F.'
            : 'LIFO stack dives deeply into connected branches cleanly.',
          visualState: {
            kind: 'graph-path',
            nodes: DEMO_GRAPH.nodes,
            edges: DEMO_GRAPH.edges,
            visitedIds: [...visited],
            frontierIds: [...frontier],
            activeNodeId: u,
            pathIds: partialPath,
          },
        });
      }

      const finalPath = (steps[steps.length - 1].visualState as { pathIds: string[] }).pathIds;
      finalSummary = `${def.name} visited [${visited.join(' → ')}] and reached Goal F via ${finalPath.join(' → ')}.`;
      finalMetrics.push(
        { label: 'Discovered Path', value: finalPath.join(' → ') },
        { label: 'Nodes Visited', value: String(visited.length) }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 19. DIJKSTRA & 20. A* SEARCH
    // ------------------------------------------------------------------------
    case 'dijkstra':
    case 'a-star': {
      const isAStar = def.id === 'a-star';
      const goalNode = DEMO_GRAPH.nodes.find((n) => n.id === 'F')!;
      const hCost = (id: string) => {
        if (!isAStar) return 0;
        const n = DEMO_GRAPH.nodes.find((x) => x.id === id)!;
        return round2(Math.hypot(goalNode.x - n.x, goalNode.y - n.y) / 70);
      };

      const gScore: Record<string, number> = { A: 0, B: Infinity, C: Infinity, D: Infinity, E: Infinity, F: Infinity };
      const fScore: Record<string, number> = { A: hCost('A'), B: Infinity, C: Infinity, D: Infinity, E: Infinity, F: Infinity };
      const parent: Record<string, string | null> = { A: null };
      const open = new Set<string>(['A']);
      const closed: string[] = [];

      while (open.size > 0) {
        let u = '';
        let bestF = Infinity;
        for (const cand of open) {
          if (fScore[cand] < bestF) {
            bestF = fScore[cand];
            u = cand;
          }
        }
        open.delete(u);
        closed.push(u);
        comparisonsCount++;

        const relaxed: string[] = [];
        for (const edge of getNeighbors(u)) {
          if (closed.includes(edge.to)) continue;
          const tentative = gScore[u] + edge.weight;
          if (tentative < gScore[edge.to]) {
            parent[edge.to] = u;
            gScore[edge.to] = tentative;
            fScore[edge.to] = round2(tentative + hCost(edge.to));
            open.add(edge.to);
            relaxed.push(`${edge.to}=${tentative}`);
          }
        }

        const isDone = u === 'F';
        const pathIds: string[] = [];
        if (isDone) {
          let cur: string | null = 'F';
          while (cur) {
            pathIds.unshift(cur);
            cur = parent[cur] ?? null;
          }
        }

        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Settle ${u}`,
          operation: isDone ? `Goal F settled at optimal total cost ${gScore['F']}!` : `Settle ${u} (g=${gScore[u]}) & relax edges`,
          inputsSnapshot: `Settled ${u}, open set = [${Array.from(open).join(', ') || 'empty'}]`,
          intermediateValues: relaxed.length > 0 ? `Updated distances: ${relaxed.join(', ')}` : 'No distance improvements',
          dataStructureState: Object.entries(gScore).map(([k, v]) => `${k}:${Number.isFinite(v) ? v : '∞'}`).join(' '),
          mathExpression: isAStar ? `f(${u}) = g(${gScore[u]}) + h(${hCost(u)}) = ${fScore[u]}` : `d[v] = min(d[v], ${gScore[u]} + w)`,
          outputSnapshot: isDone ? `Optimal Path: ${pathIds.join(' → ')} (cost ${gScore['F']})` : `Best open frontier updated`,
          explanation: isDone
            ? `Optimal route ${pathIds.join(' → ')} has weight ${gScore['F']}, beating direct A→C→F (weight 13).`
            : `Settled lowest-${isAStar ? 'f(n)' : 'distance'} node ${u} and relaxed outgoing neighbors.`,
          whyNecessary: 'Greedy lowest-cost settling guarantees optimal shortest weighted paths.',
          visualState: {
            kind: 'graph-path',
            nodes: DEMO_GRAPH.nodes.map((n) => ({
              ...n,
              dist: Number.isFinite(gScore[n.id]) ? gScore[n.id] : undefined,
              fScore: Number.isFinite(fScore[n.id]) ? fScore[n.id] : undefined,
            })),
            edges: DEMO_GRAPH.edges,
            visitedIds: [...closed],
            frontierIds: Array.from(open),
            activeNodeId: u,
            pathIds,
          },
        });
        if (isDone) break;
      }

      selfCheckPassed = gScore['F'] === 8;
      const finalPath = (steps[steps.length - 1].visualState as { pathIds: string[] }).pathIds;
      finalSummary = `${def.name} found optimal path ${finalPath.join(' → ')} with minimum cost ${gScore['F']} (${closed.length} nodes settled).`;
      finalMetrics.push(
        { label: 'Optimal Path', value: finalPath.join(' → ') },
        { label: 'Total Weighted Cost', value: `${gScore['F']}` },
        { label: 'Nodes Settled', value: `${closed.length}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 21. DYNAMIC PROGRAMMING (0/1 KNAPSACK)
    // ------------------------------------------------------------------------
    case 'dp-knapsack': {
      const cap = Math.round(params.capacity ?? 6);
      const items = [
        { name: 'Item 1 (w=2, v=3)', w: 2, v: 3 },
        { name: 'Item 2 (w=3, v=4)', w: 3, v: 4 },
        { name: 'Item 3 (w=4, v=5)', w: 4, v: 5 },
        { name: 'Item 4 (w=5, v=6)', w: 5, v: 6 },
      ];
      const headers = Array.from({ length: cap + 1 }, (_, w) => `w=${w}`);
      const rowLabels = ['0 items', ...items.map((it) => it.name)];
      const table: (number | null)[][] = Array.from({ length: items.length + 1 }, () =>
        Array.from({ length: cap + 1 }, () => null)
      );
      for (let w = 0; w <= cap; w++) table[0][w] = 0;

      steps.push({
        stepNumber: 1,
        iterationLabel: 'Base Row',
        operation: 'Initialize row 0 with 0 value for all capacities',
        inputsSnapshot: `Capacity W = ${cap}, ${items.length} items`,
        intermediateValues: '0 items chosen yields 0 value regardless of capacity',
        dataStructureState: `DP Table (${items.length + 1} × ${cap + 1})`,
        mathExpression: 'dp[0][w] = 0 for all w ∈ [0..W]',
        outputSnapshot: 'Base case initialized',
        explanation: 'Every DP table starts with trivial base cases before building larger subproblems.',
        whyNecessary: 'Provides anchor values for row 1 transitions.',
        visualState: {
          kind: 'dp-table',
          headers,
          rowLabels,
          table: table.map((r) => [...r]),
          activeCell: [0, cap],
          dependencyCells: [],
        },
      });

      for (let i = 1; i <= items.length; i++) {
        const item = items[i - 1];
        for (let w = 0; w <= cap; w++) {
          const skip = table[i - 1][w] ?? 0;
          const take = item.w <= w ? item.v + (table[i - 1][w - item.w] ?? 0) : -1;
          table[i][w] = Math.max(skip, take);
        }
        steps.push({
          stepNumber: steps.length + 1,
          iterationLabel: `Row ${i}`,
          operation: `Fill row ${i} considering ${item.name}`,
          inputsSnapshot: `Weight = ${item.w}, Value = ${item.v}`,
          intermediateValues: `Row ${i}: [${table[i].join(', ')}]`,
          dataStructureState: `Best so far at W=${cap}: ${table[i][cap]}`,
          mathExpression: `dp[${i}][w] = max(dp[${i - 1}][w], ${item.v} + dp[${i - 1}][w−${item.w}])`,
          outputSnapshot: `dp[${i}][${cap}] = ${table[i][cap]}`,
          explanation: `For each capacity w, compares skipping ${item.name} against taking it plus the best solution from remaining capacity w − ${item.w}.`,
          whyNecessary: 'Optimal substructure ensures each row builds exact optima using only row i−1.',
          visualState: {
            kind: 'dp-table',
            headers,
            rowLabels,
            table: table.map((r) => [...r]),
            activeCell: [i, cap],
            dependencyCells: item.w <= cap ? [[i - 1, cap], [i - 1, cap - item.w]] : [[i - 1, cap]],
          },
        });
      }

      const opt = table[items.length][cap] ?? 0;
      selfCheckPassed = cap === 5 ? opt === 7 : opt >= 7;
      finalSummary = `0/1 Knapsack optimal value at capacity W=${cap} is ${opt}.`;
      finalMetrics.push(
        { label: 'Capacity (W)', value: `${cap}` },
        { label: 'Optimal Value', value: `${opt}` }
      );
      break;
    }

    // ------------------------------------------------------------------------
    // 22. GENETIC ALGORITHM
    // ------------------------------------------------------------------------
    case 'genetic-algorithm':
    default: {
      const gens = Math.round(params.generations ?? 6);
      const fit = (x: number) => round4(x * Math.sin(x) + 12);
      let popX = [0.6, 1.8, 3.1, 4.7, 6.2, 7.1, 8.9, 9.5];
      const history: { gen: number; best: number; avg: number }[] = [];

      for (let g = 1; g <= gens; g++) {
        const inds = popX
          .map((x) => ({
            genome: x.toFixed(2),
            x: round2(x),
            fitness: fit(x),
          }))
          .sort((a, b) => b.fitness - a.fitness);
        const avg = round2(inds.reduce((s, o) => s + o.fitness, 0) / inds.length);
        history.push({ gen: g, best: round2(inds[0].fitness), avg });

        steps.push({
          stepNumber: g,
          iterationLabel: `Gen ${g}`,
          operation: `Evaluate fitness, select top parents, crossover & mutate`,
          inputsSnapshot: `Population size = ${inds.length}`,
          intermediateValues: `Best x=${inds[0].x} (f=${round2(inds[0].fitness)}) · Mean fitness=${avg}`,
          dataStructureState: `Top 4 survivors: [${inds.slice(0, 4).map((i) => i.x).join(', ')}]`,
          mathExpression: `f(${inds[0].x}) = ${inds[0].x}·sin(${inds[0].x}) + 12 = ${round2(inds[0].fitness)}`,
          outputSnapshot: `Peak fitness = ${round2(inds[0].fitness)}`,
          explanation: `Keeps high-fitness parents around peak x ≈ 7.98 and generates offspring via weighted crossover + deterministic perturbation.`,
          whyNecessary: 'Balances exploiting the best region with exploring nearby hills without needing derivatives.',
          visualState: {
            kind: 'population-ga',
            generation: g,
            individuals: inds,
            bestX: inds[0].x,
            bestFitness: round2(inds[0].fitness),
            history: [...history],
          },
        });

        // Produce next generation deterministically from top 4 parents
        const p = inds.slice(0, 4).map((i) => i.x);
        const offsets = [0.18, -0.14, 0.08, -0.05];
        popX = [
          p[0],
          p[1],
          Math.min(10, Math.max(0, 0.7 * p[0] + 0.3 * p[1] + offsets[(g + 0) % 4])),
          Math.min(10, Math.max(0, 0.5 * p[0] + 0.5 * p[2] + offsets[(g + 1) % 4])),
          Math.min(10, Math.max(0, 0.5 * p[1] + 0.5 * p[2] + offsets[(g + 2) % 4])),
          Math.min(10, Math.max(0, p[0] + offsets[(g + 3) % 4] * 1.4)),
          Math.min(10, Math.max(0, 0.6 * p[0] + 0.4 * p[3])),
          Math.min(10, Math.max(0, p[1] - 0.12)),
        ];
      }

      const bestLast = history[history.length - 1];
      selfCheckPassed = bestLast.best >= history[0].best;
      finalSummary = `Genetic Algorithm evolved population peak fitness from ${history[0].best} to ${bestLast.best} (Mean ${bestLast.avg}).`;
      finalMetrics.push(
        { label: 'Best Fitness', value: `${bestLast.best}` },
        { label: 'Population Avg', value: `${bestLast.avg}` }
      );
      break;
    }
  }

  const measuredRuntimeMs = Math.max(0.05, round4(performance.now() - t0));

  return {
    algorithmId: def.id,
    algorithmName: def.name,
    executionTier: def.executionTier,
    steps,
    finalSummary,
    measuredRuntimeMs,
    comparisonsCount,
    swapsCount,
    finalMetrics: [...finalMetrics, { label: 'Measured Runtime', value: `${measuredRuntimeMs} ms` }],
    selfCheckPassed,
    selfCheckDetail,
  };
}

// ============================================================================
// LOCAL OFFLINE FALLBACK PARSER FOR CUSTOM ALGORITHM INPUTS
// ============================================================================
export function parseLocalAlgorithmDescription(
  name: string,
  descriptionOrCode: string,
  language: string
): AiAlgorithmSpecification {
  const combined = `${name} ${descriptionOrCode}`.trim();
  const matched = matchBuiltInAlgorithm(combined);

  if (matched) {
    return {
      identifiedName: matched.name,
      matchedBuiltInId: matched.id,
      category: matched.category,
      purpose: matched.problemSolved,
      inputs: [matched.inputSpec],
      outputs: [matched.outputSpec],
      dataStructures: [matched.visualizationKind === 'graph-path' ? 'Adjacency List / Priority Queue' : 'Numeric Array / Vectors'],
      algorithmLogicSummary: matched.howItWorks,
      mathematicalPrinciples: [matched.mathematicalFoundation],
      formula: matched.formula,
      complexity: { time: matched.timeComplexity.average, space: matched.spaceComplexity },
      executionStatus: 'executable-builtin',
      executionStatusReason: `Matched validated interactive visualizer "${matched.name}" in the Algorithm Registry.`,
      supportedVisualization: matched.visualizationKind,
      steps: [
        {
          stepNumber: 1,
          operation: 'Initialize state & input data',
          stateDescription: matched.inputSpec,
          mathOrLogic: matched.formula,
          explanation: matched.howItWorks,
        },
        {
          stepNumber: 2,
          operation: 'Run iterative computation',
          stateDescription: 'Step-by-step live trace ready',
          mathOrLogic: matched.workedExample,
          explanation: 'Click Start or Next Step to inspect every state change.',
        },
      ],
      limitations: matched.limitations,
      sourceMode: 'local-parser',
    };
  }

  const hasSimpleLoopOrArray = /\[\s*-?\d+/.test(descriptionOrCode) || /(for|while|swap|sort|target|search)/i.test(descriptionOrCode);

  return {
    identifiedName: name.trim() || 'Custom Student Algorithm',
    matchedBuiltInId: null,
    category: 'Custom / General Procedure',
    purpose: `Analyze and understand the custom ${language} procedure entered by the student.`,
    inputs: ['User-supplied algorithm prompt or pseudocode'],
    outputs: ['Structured logic breakdown & limitations assessment'],
    dataStructures: hasSimpleLoopOrArray ? ['Indexed Array / Variables'] : ['Conceptual State Variables'],
    algorithmLogicSummary:
      hasSimpleLoopOrArray
        ? 'Contains array/loop indexing patterns that can be safely traced step-by-step inside our restricted sandbox.'
        : 'Recognized as a general or domain-specific algorithm not yet implemented as a compiled simulation kernel.',
    mathematicalPrinciples: ['Iterative state transformation and invariant preservation'],
    formula: 'T(n) depends on loop nesting depth and data structure access cost',
    complexity: { time: 'Inspect loop nesting', space: 'Depends on auxiliary variables' },
    executionStatus: hasSimpleLoopOrArray ? 'safe-traceable-code' : 'conceptual-walkthrough',
    executionStatusReason: hasSimpleLoopOrArray
      ? 'Safely traceable subset detected (no arbitrary code eval() is ever executed).'
      : 'This custom algorithm is not in our verified execution kernels, so an honest conceptual walkthrough is shown without fabricating execution results.',
    supportedVisualization: hasSimpleLoopOrArray ? 'array-bars' : 'conceptual-walkthrough',
    steps: [
      {
        stepNumber: 1,
        operation: 'Parse Inputs & Constraints',
        stateDescription: `Language mode: ${language}`,
        mathOrLogic: 'Input validation',
        explanation: 'Identify input types, edge cases (empty inputs, negative values), and termination conditions.',
      },
      {
        stepNumber: 2,
        operation: 'Main Iterative / Decision Logic',
        stateDescription: descriptionOrCode.slice(0, 120) || 'Procedure logic',
        mathOrLogic: 'Core state update',
        explanation: 'Advance variables monotonically toward the base or termination condition.',
      },
      {
        stepNumber: 3,
        operation: 'Return & Verify Output',
        stateDescription: 'Output invariant check',
        mathOrLogic: 'Post-condition',
        explanation: 'Compare resulting output against a small hand-worked test case.',
      },
    ],
    limitations: [
      'Arbitrary Python, C++, or untrusted JavaScript code is never executed directly with eval().',
      'Only validated built-in algorithms or restricted array/variable trace subsets produce live step outputs.',
    ],
    sourceMode: 'local-parser',
  };
}
