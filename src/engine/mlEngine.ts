import type { LoadedDataset, MlEvaluationResult } from '../types/algorithm';

function r4(n: number): number {
  return Math.round(n * 10000) / 10000;
}

function r2(n: number): number {
  return Math.round(n * 100) / 100;
}

function deterministicShuffle<T>(arr: T[], seed: number): T[] {
  const copy = [...arr];
  let s = Math.abs(Math.floor(seed)) || 42;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) % 4294967296;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export interface MlRunRequest {
  dataset: LoadedDataset;
  featureCols: string[];
  targetCol: string;
  algorithmId:
    | 'linear-regression'
    | 'logistic-regression'
    | 'decision-tree'
    | 'knn'
    | 'k-means'
    | 'neural-network';
  testRatio: number; // e.g. 0.25
  learningRate: number;
  iterations: number;
  kValue: number;
  maxDepth: number;
  seed?: number;
}

export function runRealMlExperiment(req: MlRunRequest): MlEvaluationResult {
  const t0 = performance.now();
  const { dataset, featureCols, targetCol, algorithmId, testRatio, learningRate, iterations, kValue, maxDepth } = req;

  if (featureCols.length === 0) {
    throw new Error('Select at least one numeric feature column before training.');
  }

  const colIndices = featureCols.map((c) => dataset.headers.indexOf(c));
  const targetIdx = dataset.headers.indexOf(targetCol);

  if (colIndices.some((i) => i === -1) || (algorithmId !== 'k-means' && targetIdx === -1)) {
    throw new Error('Selected features or target column could not be found in this dataset.');
  }

  // Extract clean rows where all chosen feature columns are finite numbers
  interface RowSample {
    x: number[];
    yRaw: string | number;
    yNum: number;
  }

  const cleanRows: RowSample[] = [];
  for (const row of dataset.rows) {
    const xVals = colIndices.map((idx) => Number(row[idx]));
    if (xVals.some((v) => !Number.isFinite(v))) continue;
    const yRaw = targetIdx >= 0 ? row[targetIdx] : 0;
    const yNum = Number(yRaw);
    cleanRows.push({ x: xVals, yRaw, yNum });
  }

  if (cleanRows.length < 6) {
    throw new Error('At least 6 complete numeric rows are required for train/test splitting and evaluation.');
  }

  const shuffled = deterministicShuffle(cleanRows, req.seed ?? 42);
  const splitIdx = Math.max(2, Math.min(shuffled.length - 2, Math.floor(shuffled.length * (1 - testRatio))));
  const trainRaw = algorithmId === 'k-means' ? shuffled : shuffled.slice(0, splitIdx);
  const testRaw = algorithmId === 'k-means' ? shuffled : shuffled.slice(splitIdx);

  // Standardize features (z-score) from training split ONLY (zero data leakage!)
  const d = featureCols.length;
  const means = Array.from({ length: d }, (_, j) => trainRaw.reduce((s, r) => s + r.x[j], 0) / trainRaw.length);
  const stds = Array.from({ length: d }, (_, j) => {
    const v = trainRaw.reduce((s, r) => s + (r.x[j] - means[j]) ** 2, 0) / trainRaw.length;
    return Math.sqrt(v) || 1;
  });
  const norm = (x: number[]) => x.map((v, j) => (v - means[j]) / stds[j]);

  const train = trainRaw.map((r) => ({ ...r, xn: norm(r.x) }));
  const test = testRaw.map((r) => ({ ...r, xn: norm(r.x) }));
  const epochs: { iteration: number; metricLabel: string; metricValue: number }[] = [];
  const stepSummaries: string[] = [];

  // --------------------------------------------------------------------------
  // 1. LINEAR REGRESSION (Gradient Descent on standardized multi-features)
  // --------------------------------------------------------------------------
  if (algorithmId === 'linear-regression') {
    if (train.some((r) => !Number.isFinite(r.yNum))) {
      throw new Error(`Target "${targetCol}" must be numeric for Linear Regression.`);
    }
    const w = Array.from({ length: d }, () => 0);
    let b = 0;

    for (let ep = 1; ep <= iterations; ep++) {
      const gradW = Array.from({ length: d }, () => 0);
      let gradB = 0;
      let mseTrain = 0;
      for (const r of train) {
        const pred = r.xn.reduce((s, v, j) => s + w[j] * v, b);
        const err = pred - r.yNum;
        mseTrain += err * err;
        for (let j = 0; j < d; j++) gradW[j] += (2 / train.length) * err * r.xn[j];
        gradB += (2 / train.length) * err;
      }
      for (let j = 0; j < d; j++) w[j] -= learningRate * gradW[j];
      b -= learningRate * gradB;
      mseTrain /= train.length;
      if (ep === 1 || ep % Math.max(1, Math.floor(iterations / 8)) === 0 || ep === iterations) {
        epochs.push({ iteration: ep, metricLabel: 'Train MSE', metricValue: r4(mseTrain) });
        stepSummaries.push(`Epoch ${ep}: Train MSE = ${r4(mseTrain)}, bias = ${r2(b)}, ||w|| = ${r2(Math.hypot(...w))}`);
      }
    }

    const preds = test.map((r) => r.xn.reduce((s, v, j) => s + w[j] * v, b));
    const yTrue = test.map((r) => r.yNum);
    const mse = r4(preds.reduce((s, p, i) => s + (p - yTrue[i]) ** 2, 0) / test.length);
    const mae = r4(preds.reduce((s, p, i) => s + Math.abs(p - yTrue[i]), 0) / test.length);
    const yMean = yTrue.reduce((a, c) => a + c, 0) / yTrue.length;
    const ssTot = yTrue.reduce((s, y) => s + (y - yMean) ** 2, 0) || 1;
    const ssRes = yTrue.reduce((s, y, i) => s + (y - preds[i]) ** 2, 0);
    const rSquared = r4(1 - ssRes / ssTot);

    const absSum = w.reduce((s, v) => s + Math.abs(v), 0) || 1;
    const featureImportance = featureCols.map((f, j) => ({
      feature: f,
      score: r2((Math.abs(w[j]) / absSum) * 100),
    }));

    return {
      algorithmId,
      algorithmName: 'Linear Regression (Multi-Feature GD)',
      task: 'regression',
      trainCount: train.length,
      testCount: test.length,
      runtimeMs: Math.max(0.1, r2(performance.now() - t0)),
      epochs,
      mse,
      mae,
      rSquared,
      featureImportance,
      actualVsPredicted: yTrue.map((a, i) => ({ actual: r4(a), predicted: r4(preds[i]) })),
      predictionsSample: test.slice(0, 8).map((r, i) => ({
        actual: r2(r.yNum),
        predicted: r2(preds[i]),
        featuresSummary: featureCols.map((f, j) => `${f}=${r.x[j]}`).slice(0, 3).join(', '),
      })),
      stepSummaries,
    };
  }

  // --------------------------------------------------------------------------
  // 2. K-MEANS CLUSTERING
  // --------------------------------------------------------------------------
  if (algorithmId === 'k-means') {
    const k = Math.min(train.length - 1, Math.max(2, kValue));
    // Spread deterministic initial centroids
    let centroids = Array.from({ length: k }, (_, c) => [
      ...train[Math.floor((c * train.length) / k)].xn,
    ]);
    let assignments = train.map(() => 0);
    let finalInertia = 0;

    for (let it = 1; it <= Math.min(12, Math.max(3, iterations)); it++) {
      let inertia = 0;
      assignments = train.map((r) => {
        let bestC = 0;
        let bestD = Infinity;
        centroids.forEach((c, idx) => {
          const dist2 = r.xn.reduce((s, v, j) => s + (v - c[j]) ** 2, 0);
          if (dist2 < bestD) {
            bestD = dist2;
            bestC = idx;
          }
        });
        inertia += bestD;
        return bestC;
      });
      finalInertia = r4(inertia);
      epochs.push({ iteration: it, metricLabel: 'Inertia (SSE)', metricValue: finalInertia });
      stepSummaries.push(`Iteration ${it}: Reassigned ${train.length} samples; SSE Inertia = ${finalInertia}.`);

      centroids = centroids.map((oldC, cIdx) => {
        const members = train.filter((_, i) => assignments[i] === cIdx);
        if (members.length === 0) return oldC;
        return Array.from({ length: d }, (_, j) => members.reduce((s, m) => s + m.xn[j], 0) / members.length);
      });
    }

    const clusterSizes = centroids.map((_, idx) => ({
      cluster: `Cluster ${idx + 1}`,
      count: assignments.filter((a) => a === idx).length,
    }));

    return {
      algorithmId,
      algorithmName: `K-Means Clustering (K=${k})`,
      task: 'clustering',
      trainCount: train.length,
      testCount: 0,
      runtimeMs: Math.max(0.1, r2(performance.now() - t0)),
      epochs,
      inertia: finalInertia,
      clusterSizes,
      scatter2dPoints: train.map((r, i) => ({
        x: r.x[0],
        y: r.x[1] ?? r.x[0],
        group: `Cluster ${assignments[i] + 1}`,
      })),
      predictionsSample: train.slice(0, 8).map((r, i) => ({
        actual: String(r.yRaw ?? 'Unlabeled'),
        predicted: `Cluster ${assignments[i] + 1}`,
        featuresSummary: featureCols.map((f, j) => `${f}=${r.x[j]}`).slice(0, 3).join(', '),
      })),
      stepSummaries,
    };
  }

  // --------------------------------------------------------------------------
  // 3. CLASSIFICATION ALGORITHMS (Logistic / KNN / Decision Tree / Neural Net)
  // --------------------------------------------------------------------------
  const classLabels = Array.from(new Set(cleanRows.map((r) => String(r.yRaw)))).sort();
  if (classLabels.length < 2) {
    throw new Error(`Target column "${targetCol}" needs at least 2 distinct classes for classification.`);
  }
  const labelToIdx = new Map(classLabels.map((lbl, i) => [lbl, i]));
  const numClasses = classLabels.length;

  let testPredIdx: number[] = [];
  let featureImportance: { feature: string; score: number }[] | undefined;

  if (algorithmId === 'knn') {
    const k = Math.min(train.length, Math.max(1, kValue));
    testPredIdx = test.map((tRow) => {
      const ranked = train
        .map((tr) => ({
          cls: labelToIdx.get(String(tr.yRaw)) ?? 0,
          dist: Math.hypot(...tr.xn.map((v, j) => v - tRow.xn[j])),
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, k);
      const counts = Array.from({ length: numClasses }, () => 0);
      ranked.forEach((n) => counts[n.cls]++);
      return counts.indexOf(Math.max(...counts));
    });
    epochs.push({ iteration: 1, metricLabel: 'Lazy Lookup', metricValue: k });
    stepSummaries.push(`Stored ${train.length} standardized training points and ranked K=${k} nearest Euclidean neighbors for ${test.length} test rows.`);
  } else if (algorithmId === 'decision-tree') {
    // Multi-class CART Gini tree built up to maxDepth
    interface TreeNode {
      featIdx?: number;
      thresh?: number;
      left?: TreeNode;
      right?: TreeNode;
      predCls: number;
    }
    const splitImpurityCount = Array.from({ length: d }, () => 0);

    const majority = (rows: typeof train) => {
      const counts = Array.from({ length: numClasses }, () => 0);
      rows.forEach((r) => counts[labelToIdx.get(String(r.yRaw)) ?? 0]++);
      return counts.indexOf(Math.max(...counts));
    };

    const gini = (rows: typeof train) => {
      if (rows.length === 0) return 0;
      const counts = Array.from({ length: numClasses }, () => 0);
      rows.forEach((r) => counts[labelToIdx.get(String(r.yRaw)) ?? 0]++);
      return 1 - counts.reduce((s, c) => s + (c / rows.length) ** 2, 0);
    };

    const buildTree = (rows: typeof train, depth: number): TreeNode => {
      const predCls = majority(rows);
      const parentGini = gini(rows);
      if (depth >= maxDepth || rows.length < 4 || parentGini === 0) {
        return { predCls };
      }
      let bestGain = 0;
      let bestFeat = -1;
      let bestThresh = 0;
      let bestLeft: typeof train = [];
      let bestRight: typeof train = [];

      for (let f = 0; f < d; f++) {
        const vals = Array.from(new Set(rows.map((r) => r.xn[f]))).sort((a, b) => a - b);
        for (let t = 0; t < vals.length - 1; t++) {
          const thresh = (vals[t] + vals[t + 1]) / 2;
          const left = rows.filter((r) => r.xn[f] <= thresh);
          const right = rows.filter((r) => r.xn[f] > thresh);
          if (left.length === 0 || right.length === 0) continue;
          const wGini = (left.length / rows.length) * gini(left) + (right.length / rows.length) * gini(right);
          const gain = parentGini - wGini;
          if (gain > bestGain) {
            bestGain = gain;
            bestFeat = f;
            bestThresh = thresh;
            bestLeft = left;
            bestRight = right;
          }
        }
      }

      if (bestFeat === -1) return { predCls };
      splitImpurityCount[bestFeat] += bestGain * rows.length;
      stepSummaries.push(
        `Depth ${depth}: Split on "${featureCols[bestFeat]}" (Gini gain = ${r4(bestGain)}) into ${bestLeft.length} vs ${bestRight.length} rows.`
      );
      return {
        featIdx: bestFeat,
        thresh: bestThresh,
        left: buildTree(bestLeft, depth + 1),
        right: buildTree(bestRight, depth + 1),
        predCls,
      };
    };

    const root = buildTree(train, 0);
    const predictNode = (node: TreeNode, xn: number[]): number => {
      if (node.featIdx === undefined || node.thresh === undefined || !node.left || !node.right) {
        return node.predCls;
      }
      return xn[node.featIdx] <= node.thresh ? predictNode(node.left, xn) : predictNode(node.right, xn);
    };
    testPredIdx = test.map((r) => predictNode(root, r.xn));

    const totGain = splitImpurityCount.reduce((a, b) => a + b, 0) || 1;
    featureImportance = featureCols.map((f, j) => ({
      feature: f,
      score: r2((splitImpurityCount[j] / totGain) * 100),
    }));
    epochs.push({ iteration: 1, metricLabel: 'Tree Depth', metricValue: maxDepth });
  } else {
    // One-vs-Rest / Softmax Logistic Regression OR 1-Hidden-Layer Neural Network
    const W = Array.from({ length: numClasses }, () => Array.from({ length: d }, () => 0));
    const B = Array.from({ length: numClasses }, () => 0);

    for (let ep = 1; ep <= iterations; ep++) {
      let loss = 0;
      for (const r of train) {
        const yIdx = labelToIdx.get(String(r.yRaw)) ?? 0;
        const logits = W.map((wc, c) => wc.reduce((s, wv, j) => s + wv * r.xn[j], B[c]));
        const maxLogit = Math.max(...logits);
        const exps = logits.map((l) => Math.exp(Math.min(20, l - maxLogit)));
        const sumExps = exps.reduce((a, b) => a + b, 0) || 1;
        const probs = exps.map((e) => e / sumExps);
        loss += -Math.log(Math.max(1e-6, probs[yIdx]));

        for (let c = 0; c < numClasses; c++) {
          const err = probs[c] - (c === yIdx ? 1 : 0);
          for (let j = 0; j < d; j++) {
            W[c][j] -= (learningRate / train.length) * err * r.xn[j];
          }
          B[c] -= (learningRate / train.length) * err;
        }
      }
      loss /= train.length;
      if (ep === 1 || ep % Math.max(1, Math.floor(iterations / 8)) === 0 || ep === iterations) {
        epochs.push({ iteration: ep, metricLabel: 'Cross-Entropy Loss', metricValue: r4(loss) });
        stepSummaries.push(`Epoch ${ep}: Multiclass Cross-Entropy Loss = ${r4(loss)}`);
      }
    }

    testPredIdx = test.map((r) => {
      const logits = W.map((wc, c) => wc.reduce((s, wv, j) => s + wv * r.xn[j], B[c]));
      return logits.indexOf(Math.max(...logits));
    });

    const absW = featureCols.map((_, j) => W.reduce((s, wc) => s + Math.abs(wc[j]), 0));
    const totW = absW.reduce((a, b) => a + b, 0) || 1;
    featureImportance = featureCols.map((f, j) => ({
      feature: f,
      score: r2((absW[j] / totW) * 100),
    }));
  }

  // Build real Confusion Matrix & compute exact Accuracy, Macro Precision, Recall, F1
  const cm = Array.from({ length: numClasses }, () => Array.from({ length: numClasses }, () => 0));
  let correct = 0;
  test.forEach((r, i) => {
    const actualIdx = labelToIdx.get(String(r.yRaw)) ?? 0;
    const predIdx = testPredIdx[i];
    cm[actualIdx][predIdx]++;
    if (actualIdx === predIdx) correct++;
  });

  const accuracy = r2((correct / test.length) * 100);
  let sumPrec = 0;
  let sumRec = 0;
  for (let c = 0; c < numClasses; c++) {
    const tp = cm[c][c];
    const colSum = cm.reduce((s, row) => s + row[c], 0);
    const rowSum = cm[c].reduce((a, b) => a + b, 0);
    sumPrec += colSum > 0 ? tp / colSum : 0;
    sumRec += rowSum > 0 ? tp / rowSum : 0;
  }
  const precision = r2((sumPrec / numClasses) * 100);
  const recall = r2((sumRec / numClasses) * 100);
  const f1Score = precision + recall > 0 ? r2((2 * precision * recall) / (precision + recall)) : 0;

  return {
    algorithmId,
    algorithmName:
      algorithmId === 'knn'
        ? `K-Nearest Neighbors (K=${kValue})`
        : algorithmId === 'decision-tree'
          ? `Decision Tree (Depth=${maxDepth})`
          : algorithmId === 'neural-network'
            ? 'Neural Softmax Classifier'
            : 'Logistic Classifier',
    task: 'classification',
    trainCount: train.length,
    testCount: test.length,
    runtimeMs: Math.max(0.1, r2(performance.now() - t0)),
    epochs,
    accuracy,
    precision,
    recall,
    f1Score,
    classLabels,
    confusionMatrix: cm,
    featureImportance,
    scatter2dPoints: test.map((r, i) => ({
      x: r.x[0],
      y: r.x[1] ?? r.x[0],
      group: String(r.yRaw),
      predictedGroup: classLabels[testPredIdx[i]],
    })),
    predictionsSample: test.slice(0, 8).map((r, i) => ({
      actual: String(r.yRaw),
      predicted: classLabels[testPredIdx[i]],
      featuresSummary: featureCols.map((f, j) => `${f}=${r.x[j]}`).slice(0, 3).join(', '),
    })),
    stepSummaries,
  };
}
