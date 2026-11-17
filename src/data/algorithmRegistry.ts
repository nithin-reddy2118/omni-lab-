import type { AlgorithmDefinition } from '../types/algorithm';

export const ALGORITHM_REGISTRY: AlgorithmDefinition[] = [
  {
    id: 'linear-regression',
    name: 'Linear Regression (Gradient Descent)',
    category: 'Supervised Regression',
    executionTier: 'executable',
    visualizationKind: 'regression-line',
    isMachineLearning: true,
    mlTask: 'regression',
    problemSolved:
      'Models a continuous numeric target y as an optimal straight-line (or hyperplane) relationship with one or more input features x.',
    whyUseful:
      'Forms the mathematical foundation of predictive analytics, trend estimation, calibration curves, and gradient-based optimization.',
    howItWorks:
      'Starts with initial slope m and intercept b, computes predictions ŷ = mx + b, measures Mean Squared Error (MSE), and iteratively updates m and b in the negative gradient direction until convergence.',
    mathematicalFoundation:
      'Minimizes convex quadratic loss L(m, b) = (1/n) Σ (yᵢ - (mxᵢ + b))² using partial derivatives ∂L/∂m and ∂L/∂b.',
    formula: 'ŷ = m·x + b   |   MSE = (1/n) Σ (yᵢ - ŷᵢ)²   |   m ← m - α·∂L/∂m',
    inputSpec: 'Paired numeric dataset [(x₁, y₁), ...], learning rate α, iterations.',
    outputSpec: 'Fitted slope m, intercept b, predictions ŷ, residual errors, MSE, R².',
    workedExample:
      'For points (1,2), (2,4), (3,5), (4,8), gradient descent converges toward m ≈ 1.9, b ≈ 0.0, reducing MSE from >12 to ~0.15.',
    timeComplexity: { best: 'O(n · k)', average: 'O(n · k)', worst: 'O(n · k)' },
    spaceComplexity: 'O(n)',
    advantages: [
      'Interpretable parameters (every unit increase in x shifts ŷ by m).',
      'Convex cost surface guarantees a unique global minimum.',
      'Fast training and inference with O(1) prediction cost.',
    ],
    limitations: [
      'Cannot capture non-linear curves without feature engineering.',
      'Sensitive to extreme outliers due to squared error penalty.',
    ],
    realWorldApplications: [
      'Calibration of physical laboratory sensors and thermal expansion curves',
      'Demand forecasting and housing price estimation',
      'Baseline trend estimation in environmental telemetry',
    ],
    mlConcepts: {
      trainingVsTesting: 'Split data so R² and MSE measure out-of-sample generalization rather than memorization.',
      lossFunction: 'Mean Squared Error (MSE) penalizes large prediction residuals quadratically.',
      optimization: 'Batch Gradient Descent steps parameters m and b opposite the gradient vector.',
      hyperparameters: 'Learning rate α and iteration count control convergence speed vs oscillation.',
      overfittingRisk: 'Low on a single linear feature; rises when adding high-degree polynomial terms.',
    },
    pseudocode: `initialize m = 0, b = 0
for iter = 1 to iterations:
  dm = (-2/n) * sum(x[i] * (y[i] - (m*x[i] + b)))
  db = (-2/n) * sum(y[i] - (m*x[i] + b))
  m = m - alpha * dm
  b = b - alpha * db
return m, b`,
    pythonReference: `m, b = 0.0, 0.0
for _ in range(iterations):
    preds = [m * x + b for x in X]
    dm = (-2 / len(X)) * sum(x * (y - yp) for x, y, yp in zip(X, Y, preds))
    db = (-2 / len(X)) * sum((y - yp) for y, yp in zip(Y, preds))
    m -= alpha * dm
    b -= alpha * db`,
    defaultParams: { learningRate: 0.05, iterations: 16 },
    parameters: [
      { key: 'learningRate', label: 'Learning Rate (α)', symbol: 'α', min: 0.01, max: 0.14, step: 0.01, defaultValue: 0.05 },
      { key: 'iterations', label: 'Gradient Steps', symbol: 'k', min: 6, max: 30, step: 2, defaultValue: 16 },
    ],
    defaultInputSample: '1:2.1, 2:3.9, 3:6.2, 4:7.8, 5:10.3',
    videoResources: [
      {
        title: 'Gradient Descent, how neural networks learn (StatQuest / Linear Regression)',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest Educational Series',
        url: 'https://www.youtube.com/watch?v=sDv4f4s2SB8',
        verifiedNote: 'Conceptual explanation of OLS and Gradient Descent step updates.',
      },
    ],
    testExpectation: 'Fits (1,2),(2,4),(3,6) with slope near 2.0 and R² > 0.95.',
  },
  {
    id: 'gradient-descent',
    name: 'Gradient Descent Optimization',
    category: 'Neural Networks & Optimization',
    executionTier: 'executable',
    visualizationKind: 'cost-descent',
    isMachineLearning: true,
    problemSolved:
      'Finds the parameter value x* that minimizes a differentiable cost function f(x) iteratively without closed-form inversion.',
    whyUseful:
      'Powers almost all modern machine learning and deep learning training loops when closed-form solutions are intractable.',
    howItWorks:
      'Evaluates the derivative (slope) f′(x) at the current position and moves by −α·f′(x). If α is balanced, x settles calmly at the minimum; if α is too large, it oscillates.',
    mathematicalFoundation: 'First-order Taylor step: xₜ₊₁ = xₜ − α · f′(xₜ) on f(x) = (x − 3)² + 1.5.',
    formula: 'xₜ₊₁ = xₜ − α · ∇f(xₜ)',
    inputSpec: 'Starting guess x₀, learning rate α, objective curve f(x).',
    outputSpec: 'Converged parameter x*, final loss f(x*), descent trajectory.',
    workedExample: 'Starting at x₀ = -2.0 on f(x) = (x - 3)² + 1.5 with α = 0.2 moves x to 0.0 → 1.2 → 1.92 → ... → 3.0.',
    timeComplexity: { best: 'O(k)', average: 'O(k)', worst: 'O(k)' },
    spaceComplexity: 'O(k)',
    advantages: ['Scales to millions of parameters.', 'Simple update rule requiring only first-order derivatives.'],
    limitations: ['Too large α causes divergence; too small α crawls.', 'Non-convex surfaces can trap in local minima.'],
    realWorldApplications: ['Training neural networks', 'Fitting logistic & linear models', 'Inverse kinematics & physics calibration'],
    mlConcepts: {
      trainingVsTesting: 'Gradient descent minimizes training loss; validation checks stop before overfitting.',
      lossFunction: 'Differentiable objective f(x) measures parameter error.',
      optimization: 'Learning rate α scales gradient step magnitude.',
      hyperparameters: 'Learning rate α and initial x₀.',
      overfittingRisk: 'Excess iterations on noisy targets can overfit; monitor validation curve.',
    },
    pseudocode: `x = x0
for step = 1 to maxSteps:
  grad = derivative(f, x)
  x = x - alpha * grad`,
    pythonReference: `x = -2.0
for _ in range(steps):
    grad = 2 * (x - 3)
    x = x - alpha * grad`,
    defaultParams: { startX: -2, learningRate: 0.22, iterations: 12 },
    parameters: [
      { key: 'startX', label: 'Start Value (x₀)', symbol: 'x₀', min: -3, max: 8, step: 0.5, defaultValue: -2 },
      { key: 'learningRate', label: 'Learning Rate (α)', symbol: 'α', min: 0.05, max: 0.95, step: 0.05, defaultValue: 0.22 },
      { key: 'iterations', label: 'Steps', symbol: 'k', min: 5, max: 20, step: 1, defaultValue: 12 },
    ],
    defaultInputSample: 'f(x) = (x - 3)^2 + 1.5',
    videoResources: [
      {
        title: 'Gradient descent, how neural networks learn',
        creator: '3Blue1Brown (Grant Sanderson)',
        source: '3Blue1Brown',
        url: 'https://www.3blue1brown.com/lessons/gradient-descent',
        verifiedNote: 'Official 3Blue1Brown interactive lesson page.',
      },
    ],
    testExpectation: 'With α = 0.22 starting at -2.0, x approaches 3.0 and f(x) approaches 1.5.',
  },
  {
    id: 'logistic-regression',
    name: 'Logistic Regression (Binary Classifier)',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-boundary',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Predicts calibrated class probabilities P(y = 1 | x) and separates classes with a linear decision boundary.',
    whyUseful: 'Produces interpretable probabilistic predictions for medical screening, spam filtering, and risk scoring.',
    howItWorks:
      'Computes a weighted linear score z = w₁x₁ + w₂x₂ + b, maps z into (0,1) via sigmoid σ(z) = 1/(1 + e⁻ᶻ), and adjusts weights by minimizing Binary Cross-Entropy.',
    mathematicalFoundation: 'σ(z) = 1 / (1 + e⁻ᶻ); Loss = −(1/n) Σ [y log(ŷ) + (1−y) log(1−ŷ)].',
    formula: 'P(y=1|x) = 1 / (1 + e^(-(w₁x₁ + w₂x₂ + b)))',
    inputSpec: '2D labeled samples (x₁, x₂, y ∈ {0, 1}), learning rate α.',
    outputSpec: 'Linear separator weights w₁, w₂, b, probabilities, classification accuracy.',
    workedExample: 'Iteratively rotates the decision line to separate lower-left Class 0 samples from upper-right Class 1 samples.',
    timeComplexity: { best: 'O(n · k)', average: 'O(n · k)', worst: 'O(n · k)' },
    spaceComplexity: 'O(n)',
    advantages: ['Outputs genuine probability confidence scores.', 'Resistant to overfitting with L2 regularization.'],
    limitations: ['Assumes classes are linearly separable in feature space.'],
    realWorldApplications: ['Disease diagnosis risk scoring', 'Credit risk screening', 'Binary sensor fault detection'],
    mlConcepts: {
      trainingVsTesting: 'Evaluated using held-out Accuracy, Precision, Recall, and Confusion Matrix.',
      lossFunction: 'Binary Cross-Entropy (Log Loss) sharply penalizes confident wrong predictions.',
      optimization: 'Gradient descent on smooth convex log-loss.',
      hyperparameters: 'Learning rate α and training epochs.',
      overfittingRisk: 'Low in low dimensions; increases if many correlated features exist without regularization.',
    },
    pseudocode: `initialize w1, w2, b = 0
for epoch in 1..epochs:
  z = w1*x1 + w2*x2 + b
  p = 1 / (1 + exp(-z))
  update w1, w2, b from error (p - y)`,
    pythonReference: `z = w1*x1 + w2*x2 + b
p = 1 / (1 + math.exp(-z))
w1 -= lr * (p - y) * x1`,
    defaultParams: { learningRate: 0.4, iterations: 14 },
    parameters: [
      { key: 'learningRate', label: 'Learning Rate (α)', symbol: 'α', min: 0.1, max: 1.0, step: 0.1, defaultValue: 0.4 },
      { key: 'iterations', label: 'Epochs', symbol: 'k', min: 6, max: 24, step: 2, defaultValue: 14 },
    ],
    defaultInputSample: '2D binary cluster separation',
    videoResources: [
      {
        title: 'StatQuest: Logistic Regression',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=yIYKR4sgzI8',
        verifiedNote: 'Covers sigmoid probability mapping and maximum likelihood.',
      },
    ],
    testExpectation: 'Separates linearly separable 2D clusters with >= 90% accuracy.',
  },
  {
    id: 'decision-tree',
    name: 'Decision Tree Classifier (Gini Split)',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-tree',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Partitions feature space into transparent yes/no threshold rules to classify items cleanly.',
    whyUseful: 'Human-readable white-box rules with zero feature scaling required.',
    howItWorks:
      'Evaluates every feature threshold split, picks the split minimizing weighted Gini impurity G = 1 − Σ pᵢ², and recurses up to maxDepth.',
    mathematicalFoundation: 'Gini(S) = 1 − Σ (cᵢ / |S|)²; Information Gain = G(parent) − Σ (|Sⱼ|/|S|)G(Sⱼ).',
    formula: 'Gini = 1 - Σ pₖ²',
    inputSpec: 'Multi-feature labeled dataset + maximum tree depth.',
    outputSpec: 'Hierarchical split tree + leaf class labels + test accuracy.',
    workedExample: 'Splits botanical petal measurements first at petal_length ≤ 2.45 cm to isolate Iris-setosa immediately.',
    timeComplexity: { best: 'O(n · d · log n)', average: 'O(n · d · log n)', worst: 'O(n² · d)' },
    spaceComplexity: 'O(nodes)',
    advantages: ['Handles non-linear boundaries naturally.', 'No normalization needed; interpretable rules.'],
    limitations: ['Deep trees easily memorize noise (high variance).', 'Sensitive to small dataset perturbations.'],
    realWorldApplications: ['Medical triage protocols', 'Credit underwriting rules', 'Base learners inside Random Forests'],
    mlConcepts: {
      trainingVsTesting: 'Check validation accuracy vs tree depth to spot overfitting.',
      lossFunction: 'Gini Impurity measures mixed-class disorder in each split.',
      optimization: 'Greedy top-down recursive partitioning (CART algorithm).',
      hyperparameters: 'Maximum tree depth and minimum samples per leaf.',
      overfittingRisk: 'High if depth is unrestricted; pruning/depth limit prevents memorization.',
    },
    pseudocode: `function buildTree(data, depth):
  if pure(data) or depth == maxDepth: return Leaf(majorityClass(data))
  (feat, thresh) = bestGiniSplit(data)
  left = buildTree(filter(data, x[feat] <= thresh), depth + 1)
  right = buildTree(filter(data, x[feat] > thresh), depth + 1)
  return Node(feat, thresh, left, right)`,
    pythonReference: `def gini(groups, classes):
    n = sum(len(g) for g in groups)
    return sum((1 - sum((g.count(c)/len(g))**2 for c in classes)) * (len(g)/n) for g in groups if len(g))`,
    defaultParams: { maxDepth: 2 },
    parameters: [
      { key: 'maxDepth', label: 'Max Tree Depth', symbol: 'd', min: 1, max: 3, step: 1, defaultValue: 2 },
    ],
    defaultInputSample: 'Petal & Sepal classification sample',
    videoResources: [
      {
        title: 'Decision and Classification Trees, Clearly Explained',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=_L39rN6gz7Y',
        verifiedNote: 'Walks through Gini impurity step-by-step.',
      },
    ],
    testExpectation: 'Root split cleanly lowers Gini impurity below child threshold.',
  },
  {
    id: 'knn',
    name: 'K-Nearest Neighbors (KNN)',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-boundary',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Classifies a new query point by inspecting the K closest labeled examples in feature space.',
    whyUseful: 'Non-parametric instance-based learning requiring zero parametric training assumptions.',
    howItWorks:
      'Measures Euclidean distances from the query point to all stored points, ranks the K nearest neighbors, and predicts the majority class.',
    mathematicalFoundation: 'd(p, q) = √((p₁ − q₁)² + (p₂ − q₂)²)',
    formula: 'ŷ = mode({ yᵢ : xᵢ ∈ Nₖ(x_query) })',
    inputSpec: 'Labeled points, query coordinates (q₁, q₂), neighbor count K.',
    outputSpec: 'Predicted class label, K nearest neighbor distances, accuracy.',
    workedExample: 'With K=3 around query (4.8, 3.6), checks the 3 shortest Euclidean distances and votes on the majority label.',
    timeComplexity: { best: 'O(1) train / O(n·d) query', average: 'O(n·d)', worst: 'O(n·d)' },
    spaceComplexity: 'O(n · d)',
    advantages: ['Zero training step.', 'Naturally learns complex non-linear class boundaries.'],
    limitations: ['Slow inference on large datasets.', 'Requires feature scaling so large-unit features do not dominate distance.'],
    realWorldApplications: ['Recommender similarity matching', 'Anomaly/outlier detection', 'Handwriting digit recognition'],
    mlConcepts: {
      trainingVsTesting: 'Lazy learner stores training samples and evaluates distances at test time.',
      lossFunction: 'Distance metric (Euclidean / Manhattan) defines neighborhood geometry.',
      optimization: 'Selection of K balances local detail vs smooth voting.',
      hyperparameters: 'Number of neighbors K.',
      overfittingRisk: 'K=1 overfits individual noisy points; very large K underfits.',
    },
    pseudocode: `distances = [euclidean(query, pt) for pt in train]
nearestK = smallestK(distances, K)
return majorityVote(nearestK)`,
    pythonReference: `dists = sorted((math.hypot(qx-x, qy-y), y_cls) for (x, y, y_cls) in data)
pred = Counter(cls for _, cls in dists[:k]).most_common(1)[0][0]`,
    defaultParams: { k: 3, queryX1: 4.8, queryX2: 3.6 },
    parameters: [
      { key: 'k', label: 'Neighbors (K)', symbol: 'K', min: 1, max: 7, step: 2, defaultValue: 3 },
      { key: 'queryX1', label: 'Query X₁', symbol: 'x₁', min: 1, max: 8, step: 0.2, defaultValue: 4.8 },
      { key: 'queryX2', label: 'Query X₂', symbol: 'x₂', min: 1, max: 8, step: 0.2, defaultValue: 3.6 },
    ],
    defaultInputSample: '2D labeled classes + query point',
    videoResources: [
      {
        title: 'K-Nearest Neighbors, Clearly Explained',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=HVXime0nQeI',
        verifiedNote: 'Explains Euclidean neighborhood voting and choosing K.',
      },
    ],
    testExpectation: 'Selects exact K smallest distances and outputs majority vote.',
  },
  {
    id: 'k-means',
    name: 'K-Means Clustering',
    category: 'Unsupervised & Dimensionality',
    executionTier: 'executable',
    visualizationKind: 'clustering',
    isMachineLearning: true,
    mlTask: 'clustering',
    problemSolved: 'Discovers K natural groups inside unlabeled data by minimizing within-cluster squared distance.',
    whyUseful: 'Reveals hidden structure, customer segments, or molecular conformations when labels are unavailable.',
    howItWorks:
      'Alternates between (1) assigning each point to its nearest centroid and (2) moving each centroid to the arithmetic mean of its assigned points until stable.',
    mathematicalFoundation: 'Minimizes Within-Cluster Sum of Squares (Inertia): J = Σₖ Σₓ∈Cₖ ||x − μₖ||².',
    formula: 'μₖ = (1 / |Cₖ|) Σ xᵢ   |   J = Σ ||xᵢ − μ(xᵢ)||²',
    inputSpec: 'Unlabeled 2D points + cluster count K.',
    outputSpec: 'Final cluster centroids μ₁..μₖ, point cluster IDs, final inertia J.',
    workedExample: 'Starts with K=3 scattered centroids; within 4–5 Lloyd iterations each centroid locks onto the center of a natural point cloud.',
    timeComplexity: { best: 'O(n · K · i)', average: 'O(n · K · i)', worst: 'O(n · K · i)' },
    spaceComplexity: 'O(n + K)',
    advantages: ['Simple, intuitive, and scales cleanly to large datasets.'],
    limitations: ['Must choose K beforehand.', 'Assumes roughly spherical, equal-sized clusters; sensitive to initialization.'],
    realWorldApplications: ['Image color quantization', 'Customer & ecosystem segmentation', 'Astronomical star-cluster grouping'],
    mlConcepts: {
      trainingVsTesting: 'Unsupervised: no ground-truth target label y; evaluated by inertia or elbow plot.',
      lossFunction: 'Within-cluster Inertia (Sum of Squared Errors to nearest centroid).',
      optimization: 'Lloyd’s alternating expectation–maximization steps.',
      hyperparameters: 'Number of clusters K.',
      overfittingRisk: 'Choosing K ≈ n drops inertia to 0 without discovering general clusters.',
    },
    pseudocode: `initialize K centroids
repeat until convergence:
  assign each point to nearest centroid
  recompute each centroid as cluster mean`,
    pythonReference: `clusters = [min(range(K), key=lambda k: dist(p, centroids[k])) for p in points]
centroids = [mean(p for p, c in zip(points, clusters) if c == k) for k in range(K)]`,
    defaultParams: { k: 3, iterations: 6 },
    parameters: [
      { key: 'k', label: 'Clusters (K)', symbol: 'K', min: 2, max: 4, step: 1, defaultValue: 3 },
      { key: 'iterations', label: 'Max Iterations', symbol: 'i', min: 2, max: 8, step: 1, defaultValue: 6 },
    ],
    defaultInputSample: 'Unlabeled 2D spatial clusters',
    videoResources: [
      {
        title: 'StatQuest: K-means clustering',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=4b5d3muPQmA',
        verifiedNote: 'Demonstrates centroid assignment and mean update visually.',
      },
    ],
    testExpectation: 'Inertia decreases monotonically across centroid update iterations.',
  },
  {
    id: 'neural-network',
    name: 'Neural Network (Forward & Backprop)',
    category: 'Neural Networks & Optimization',
    executionTier: 'executable',
    visualizationKind: 'neural-network',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Learns non-linear mappings (such as XOR) by composing weighted linear layers with smooth non-linear activations.',
    whyUseful: 'Multi-layer perceptrons can approximate arbitrary continuous functions when a single linear hyperplane fails.',
    howItWorks:
      'Runs forward propagation through a 2-2-1 sigmoid network, measures squared error vs target y, propagates error gradients δ backward via the chain rule, and updates weights.',
    mathematicalFoundation:
      'h = σ(W₁x + b₁), ŷ = σ(W₂h + b₂), δ_out = (ŷ − y)·ŷ(1−ŷ), W ← W − α·δ·aᵀ.',
    formula: 'a⁽ˡ⁾ = σ(W⁽ˡ⁾ a⁽ˡ⁻¹⁾ + b⁽ˡ⁾)   |   ΔW = −α · ∂L/∂W',
    inputSpec: '2-input XOR pattern, learning rate α, hidden layer (2 neurons).',
    outputSpec: 'Updated network weights, per-neuron activations, MSE loss decay curve.',
    workedExample: 'Demonstrates real weight matrix updates step-by-step on non-linearly separable XOR inputs (0,1)→1.',
    timeComplexity: { best: 'O(E · n · W)', average: 'O(E · n · W)', worst: 'O(E · n · W)' },
    spaceComplexity: 'O(W + activations)',
    advantages: ['Solves non-linear problems like XOR automatically.', 'Universal function approximator.'],
    limitations: ['Less interpretable than single regression or trees.', 'Requires careful learning rate and non-zero weight initialization.'],
    realWorldApplications: ['Speech & image recognition', 'Protein folding & scientific surrogate models', 'Autonomous sensor fusion'],
    mlConcepts: {
      trainingVsTesting: 'Monitor validation loss to detect memorization early.',
      lossFunction: 'Mean Squared Error on network output neuron ŷ.',
      optimization: 'Backpropagation using reverse-mode chain rule + gradient descent.',
      hyperparameters: 'Learning rate α, hidden neuron count, epochs.',
      overfittingRisk: 'High capacity requires sufficient training samples or regularization.',
    },
    pseudocode: `// 1. Forward pass
h = sigmoid(W_ih * x + b_h)
y_hat = sigmoid(W_ho * h + b_o)
// 2. Loss & Backpropagation
err_o = (y_hat - y) * y_hat * (1 - y_hat)
err_h = (W_ho^T * err_o) * h * (1 - h)
// 3. Weight update
W_ho -= lr * err_o * h^T`,
    pythonReference: `h = sigmoid(np.dot(x, W_ih) + b_h)
y_hat = sigmoid(np.dot(h, W_ho) + b_o)
d_o = (y_hat - y) * y_hat * (1 - y_hat)`,
    defaultParams: { learningRate: 1.5, epochs: 8 },
    parameters: [
      { key: 'learningRate', label: 'Learning Rate (α)', symbol: 'α', min: 0.4, max: 3.0, step: 0.2, defaultValue: 1.5 },
      { key: 'epochs', label: 'Visible Update Cycles', symbol: 'E', min: 4, max: 14, step: 2, defaultValue: 8 },
    ],
    defaultInputSample: 'XOR truth table [(0,0)->0, (0,1)->1, (1,0)->1, (1,1)->0]',
    videoResources: [
      {
        title: 'What is backpropagation really doing?',
        creator: '3Blue1Brown (Grant Sanderson)',
        source: '3Blue1Brown',
        url: 'https://www.3blue1brown.com/lessons/backpropagation',
        verifiedNote: 'Visualizes weight updates and chain-rule gradients.',
      },
    ],
    testExpectation: 'Actual loss on XOR dataset drops across forward/backprop cycles.',
  },
  {
    id: 'perceptron',
    name: 'Perceptron (Rosenblatt Single Neuron)',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-boundary',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Learns a linear binary step classifier ŷ ∈ {0, 1} through mistake-driven weight corrections.',
    whyUseful: 'The historical ancestor of neural networks, illustrating clearly how a single neuron shifts a hyperplane on misclassification.',
    howItWorks: 'Predicts 1 if w·x + b ≥ 0 else 0; whenever ŷ ≠ y, nudges w ← w + α(y − ŷ)x and b ← b + α(y − ŷ).',
    mathematicalFoundation: 'ŷ = step(w₁x₁ + w₂x₂ + b); Δw = α(y − ŷ)x.',
    formula: 'w ← w + α (y − ŷ) x',
    inputSpec: 'Linearly separable labeled 2D points.',
    outputSpec: 'Separating line weights w₁, w₂, b and accuracy.',
    workedExample: 'Misclassified points pull the separating line directly toward themselves until zero mistakes remain.',
    timeComplexity: { best: 'O(n)', average: 'O(n · k)', worst: 'O(n · k)' },
    spaceComplexity: 'O(1)',
    advantages: ['Simple online mistake-driven update.', 'Guaranteed convergence on linearly separable data.'],
    limitations: ['Never converges on non-linearly separable data like XOR.'],
    realWorldApplications: ['Hardware logic gates', 'Fast online binary streaming filters'],
    pseudocode: `for each (x, y) in dataset:
  y_hat = 1 if (w·x + b >= 0) else 0
  w = w + lr * (y - y_hat) * x
  b = b + lr * (y - y_hat)`,
    pythonReference: `y_hat = 1 if (w1*x1 + w2*x2 + b) >= 0 else 0
err = y - y_hat
w1 += lr * err * x1`,
    defaultParams: { learningRate: 0.25, iterations: 12 },
    parameters: [
      { key: 'learningRate', label: 'Learning Rate (α)', symbol: 'α', min: 0.1, max: 0.8, step: 0.05, defaultValue: 0.25 },
    ],
    defaultInputSample: 'Linearly separable OR / AND logic points',
    videoResources: [
      {
        title: 'But what is a neural network? (Perceptron chapter)',
        creator: '3Blue1Brown',
        source: '3Blue1Brown',
        url: 'https://www.3blue1brown.com/lessons/neural-networks',
        verifiedNote: 'Official 3Blue1Brown lesson.',
      },
    ],
    testExpectation: 'Achieves 100% accuracy on linearly separable points.',
  },
  {
    id: 'svm',
    name: 'Support Vector Machine (Max-Margin Linear)',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-boundary',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Finds the separating hyperplane that maximizes the geometric margin between two classes.',
    whyUseful: 'Maximizing the margin leaves maximum safety buffer for unseen test points.',
    howItWorks: 'Optimizes hinge loss max(0, 1 − yᵢ(w·xᵢ + b)) plus L2 margin regularizer λ||w||² via sub-gradient descent.',
    mathematicalFoundation: 'L = λ||w||² + (1/n) Σ max(0, 1 − yᵢ(w·xᵢ + b)), with yᵢ ∈ {−1, +1}.',
    formula: 'Margin = 2 / ||w||   |   Hinge = max(0, 1 − y(w·x + b))',
    inputSpec: 'Binary labeled 2D points, margin regularization λ.',
    outputSpec: 'Max-margin weights (w₁, w₂, b), hinge loss, accuracy.',
    workedExample: 'Only margin-violating support vectors contribute non-zero hinge gradients.',
    timeComplexity: { best: 'O(n · k)', average: 'O(n · k)', worst: 'O(n · k)' },
    spaceComplexity: 'O(d)',
    advantages: ['Strong generalization in high dimensions.', 'Margin buffer resists small measurement noise.'],
    limitations: ['Slower to calibrate on huge datasets; kernel trick needed for curved boundaries.'],
    realWorldApplications: ['Bioinformatics gene classification', 'Text categorization', 'Optical character recognition'],
    pseudocode: `for epoch in 1..epochs:
  for (x, y) in data (y in {-1, +1}):
    if y * (w·x + b) < 1:
      w = w - lr * (2*lambda*w - y*x)
    else:
      w = w - lr * (2*lambda*w)`,
    pythonReference: `if y * (w1*x1 + w2*x2 + b) < 1:
    w1 -= lr * (2*lam*w1 - y*x1)`,
    defaultParams: { learningRate: 0.05, lambda: 0.02 },
    parameters: [
      { key: 'learningRate', label: 'Step Size (α)', symbol: 'α', min: 0.01, max: 0.12, step: 0.01, defaultValue: 0.05 },
      { key: 'lambda', label: 'Margin Penalty (λ)', symbol: 'λ', min: 0.005, max: 0.1, step: 0.005, defaultValue: 0.02 },
    ],
    defaultInputSample: '2D linearly separable points',
    videoResources: [
      {
        title: 'Support Vector Machines Part 1: Main Ideas',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=efR1C6CvhmE',
        verifiedNote: 'Explains maximum margin classifiers.',
      },
    ],
    testExpectation: 'Converges with hinge loss decreasing and >= 90% accuracy.',
  },
  {
    id: 'naive-bayes',
    name: 'Gaussian Naive Bayes Classifier',
    category: 'Supervised Classification',
    executionTier: 'executable',
    visualizationKind: 'decision-boundary',
    isMachineLearning: true,
    mlTask: 'classification',
    problemSolved: 'Applies Bayes’ Theorem with feature independence to compute fast posterior class probabilities.',
    whyUseful: 'Fast probabilistic baseline requiring just per-class means and variances.',
    howItWorks:
      'Estimates class prior P(Cₖ), mean μₖ, and variance σₖ² for each feature, then evaluates Gaussian likelihood P(x|Cₖ) to classify points.',
    mathematicalFoundation: 'P(Cₖ | x) ∝ P(Cₖ) Π N(xⱼ | μₖⱼ, σₖⱼ²).',
    formula: 'P(Cₖ|x) = P(Cₖ)·Π P(xⱼ|Cₖ) / P(x)',
    inputSpec: '2D labeled training points.',
    outputSpec: 'Class priors, Gaussian parameters (μ, σ), posterior predictions.',
    workedExample: 'Computes Gaussian bell curves per class and assigns each test point to the higher posterior probability.',
    timeComplexity: { best: 'O(n · d)', average: 'O(n · d)', worst: 'O(n · d)' },
    spaceComplexity: 'O(K · d)',
    advantages: ['Single-pass O(n·d) training.', 'Works reliably even on small datasets.'],
    limitations: ['Assumes conditional independence among features.'],
    realWorldApplications: ['Spam filtering', 'Document topic classification', 'Real-time medical screening baselines'],
    pseudocode: `compute mean[c, j], var[c, j], prior[c] for each class c
for query x:
  score[c] = log(prior[c]) + sum(logGaussianPdf(x[j], mean[c,j], var[c,j]))
return argmax(score)`,
    pythonReference: `log_p = math.log(prior) - 0.5*math.log(2*math.pi*var) - ((x-mean)**2)/(2*var)`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: '2D Gaussian class clouds',
    videoResources: [
      {
        title: 'Naive Bayes, Clearly Explained',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=O2L2Uv9pdDA',
        verifiedNote: 'Covers Bayes rule and feature likelihood multiplication.',
      },
    ],
    testExpectation: 'Classifies Gaussian clouds cleanly with posterior probabilities.',
  },
  {
    id: 'pca',
    name: 'Principal Component Analysis (PCA)',
    category: 'Unsupervised & Dimensionality',
    executionTier: 'executable',
    visualizationKind: 'clustering',
    isMachineLearning: true,
    problemSolved: 'Finds orthogonal axes (Principal Components) along which the data exhibits maximum variance.',
    whyUseful: 'Compresses high-dimensional measurements into clean 2D visualizable coordinates with minimal information loss.',
    howItWorks: 'Centers data at zero mean, builds the 2×2 covariance matrix Σ, and runs power iteration on Σv = λv to extract Principal Component 1.',
    mathematicalFoundation: 'Σ = (1/n) XᵀX; eigenvector v₁ maximizes variance v₁ᵀΣv₁ subject to ||v₁|| = 1.',
    formula: 'Σ v₁ = λ₁ v₁   |   Variance Retained = λ₁ / (λ₁ + λ₂)',
    inputSpec: '2D correlated scatter points.',
    outputSpec: 'Principal eigenvector (dx, dy) & variance explained percentage.',
    workedExample: 'Rotates an axis directly along a tilted diagonal point cloud, retaining >88% variance in 1 axis.',
    timeComplexity: { best: 'O(n · d² + d³)', average: 'O(n · d² + d³)', worst: 'O(n · d² + d³)' },
    spaceComplexity: 'O(d²)',
    advantages: ['Eliminates correlated redundant features.', 'Deterministic eigen-decomposition.'],
    limitations: ['Captures only linear correlations.', 'PC axes are linear mixtures, harder to interpret directly.'],
    realWorldApplications: ['Gene expression dimensionality reduction', 'Sensor noise filtering', '2D visualization of multi-feature datasets'],
    pseudocode: `X_centered = X - mean(X)
Cov = (1/n) * X_centered^T * X_centered
v = randomUnitVector()
repeat powerIterations: v = normalize(Cov * v)`,
    pythonReference: `cov = np.cov(X_centered.T)
eigvals, eigvecs = np.linalg.eig(cov)`,
    defaultParams: { iterations: 6 },
    parameters: [
      { key: 'iterations', label: 'Power Iterations', symbol: 'k', min: 2, max: 10, step: 1, defaultValue: 6 },
    ],
    defaultInputSample: '2D correlated point cloud',
    videoResources: [
      {
        title: 'StatQuest: Principal Component Analysis (PCA)',
        creator: 'StatQuest with Josh Starmer',
        source: 'StatQuest',
        url: 'https://www.youtube.com/watch?v=FgakZw6K1QQ',
        verifiedNote: 'Step-by-step SVD/eigenvector visual walkthrough.',
      },
    ],
    testExpectation: 'Power iteration aligns principal vector along dominant covariance direction.',
  },
  {
    id: 'linear-search',
    name: 'Linear Search',
    category: 'Searching & Sorting',
    executionTier: 'executable',
    visualizationKind: 'array-search',
    isMachineLearning: false,
    problemSolved: 'Locates a target value inside an unsorted or sorted list by checking items sequentially from index 0.',
    whyUseful: 'Works on any list order without sorting overhead and serves as the baseline for Binary Search comparisons.',
    howItWorks: 'Steps index i = 0, 1, ..., n − 1, compares arr[i] == target, and stops as soon as a match is found or the end is reached.',
    mathematicalFoundation: 'Expected comparisons ≈ (n + 1)/2 on hits, exactly n on misses.',
    formula: 'T(n) = O(n) comparisons',
    inputSpec: 'Comma-separated array of numbers + target number.',
    outputSpec: 'Matched index (or -1 if absent) and exact comparison count.',
    workedExample: 'Finding 42 in [12, 27, 9, 42, 55, 68] inspects 4 elements (indices 0, 1, 2, 3) before matching.',
    timeComplexity: { best: 'O(1)', average: 'O(n)', worst: 'O(n)' },
    spaceComplexity: 'O(1)',
    advantages: ['Requires no pre-sorting.', 'Optimal O(1) extra memory.'],
    limitations: ['Scales linearly; slow on millions of records.'],
    realWorldApplications: ['Scanning small unsorted sensor buffers', 'Validating single items in linked lists'],
    pseudocode: `for i = 0 to n - 1:
  if arr[i] == target:
    return i
return -1`,
    pythonReference: `for i, val in enumerate(arr):
    if val == target:
        return i
return -1`,
    defaultParams: { target: 42 },
    parameters: [
      { key: 'target', label: 'Search Target', symbol: 'T', min: 1, max: 99, step: 1, defaultValue: 42 },
    ],
    defaultInputSample: '12, 27, 9, 42, 55, 68, 74, 81',
    videoResources: [
      {
        title: 'CS50 Algorithms: Linear & Binary Search',
        creator: 'David J. Malan (Harvard CS50)',
        source: 'CS50 Harvard',
        url: 'https://cs50.harvard.edu/x/',
        verifiedNote: 'Harvard CS50 official algorithms curriculum.',
      },
    ],
    testExpectation: 'Returns exact index 3 when searching 42 in [12,27,9,42,55,68,74,81].',
  },
  {
    id: 'binary-search',
    name: 'Binary Search',
    category: 'Searching & Sorting',
    executionTier: 'executable',
    visualizationKind: 'array-search',
    isMachineLearning: false,
    problemSolved: 'Locates a target value in a sorted array in logarithmic time by halving the search interval each step.',
    whyUseful: 'Finds 1 item among 1,000,000,000 sorted entries in at most 30 comparisons.',
    howItWorks: 'Maintains bounds [low, high], inspects midpoint mid = floor((low + high)/2), and discards the half that cannot contain target.',
    mathematicalFoundation: 'Search interval size halves each step: n / 2ᵏ ≤ 1 ⇒ k = ⌈log₂ n⌉.',
    formula: 'mid = ⌊(low + high) / 2⌋   |   T(n) = O(log₂ n)',
    inputSpec: 'Array (auto-sorted if unsorted) + target integer.',
    outputSpec: 'Matched index in sorted array + eliminated search boundaries per step.',
    workedExample: 'On [5, 12, 19, 27, 42, 55, 68, 74, 88], searches target 42 in just 1–3 steps.',
    timeComplexity: { best: 'O(1)', average: 'O(log n)', worst: 'O(log n)' },
    spaceComplexity: 'O(1)',
    advantages: ['Exponentially faster than linear search on sorted collections.'],
    limitations: ['Requires array to be sorted and random-accessible by index.'],
    realWorldApplications: ['Database B-tree index lookups', 'Dictionary / autocomplete prefix range queries', 'Root-finding bisection in physics'],
    pseudocode: `low = 0, high = n - 1
while low <= high:
  mid = floor((low + high) / 2)
  if arr[mid] == target: return mid
  if arr[mid] < target: low = mid + 1
  else: high = mid - 1
return -1`,
    pythonReference: `low, high = 0, len(arr) - 1
while low <= high:
    mid = (low + high) // 2
    if arr[mid] == target: return mid`,
    defaultParams: { target: 42 },
    parameters: [
      { key: 'target', label: 'Search Target', symbol: 'T', min: 1, max: 99, step: 1, defaultValue: 42 },
    ],
    defaultInputSample: '5, 12, 19, 27, 42, 55, 68, 74, 88',
    videoResources: [
      {
        title: 'Algorithms: Binary Search',
        creator: 'Khan Academy Computing',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/computing/computer-science/algorithms/binary-search',
        verifiedNote: 'Official Khan Academy interactive CS unit.',
      },
    ],
    testExpectation: 'Finds target 42 at sorted index 4 in at most 4 comparisons.',
  },
  {
    id: 'bubble-sort',
    name: 'Bubble Sort',
    category: 'Searching & Sorting',
    executionTier: 'executable',
    visualizationKind: 'array-bars',
    isMachineLearning: false,
    problemSolved: 'Sorts an array in ascending order by repeatedly swapping adjacent out-of-order pairs.',
    whyUseful: 'Crystal-clear introductory sorting algorithm illustrating loop invariants and early-exit optimization.',
    howItWorks: 'Passes left-to-right comparing arr[j] and arr[j+1]; the largest unsorted element "bubbles" to the right boundary after every pass.',
    mathematicalFoundation: 'Total worst-case adjacent swaps = n(n − 1)/2 (array inversion count).',
    formula: 'Comparisons ≤ n(n − 1) / 2   |   T(n) = O(n²)',
    inputSpec: 'Comma-separated array of integers.',
    outputSpec: 'Sorted array + total comparisons and swaps.',
    workedExample: 'Sorting [38, 14, 52, 9, 27, 41] records every pairwise comparison and swap until [9, 14, 27, 38, 41, 52].',
    timeComplexity: { best: 'O(n) with early swap flag', average: 'O(n²)', worst: 'O(n²)' },
    spaceComplexity: 'O(1)',
    advantages: ['In-place O(1) memory.', 'Stable sort preserving equal-element order.'],
    limitations: ['Quadratic O(n²) comparisons make it slow on large inputs.'],
    realWorldApplications: ['Pedagogical comparison-sort baseline', 'Nearly sorted tiny arrays'],
    pseudocode: `for i = 0 to n - 2:
  swapped = false
  for j = 0 to n - i - 2:
    if arr[j] > arr[j + 1]:
      swap(arr[j], arr[j + 1])
      swapped = true
  if not swapped: break`,
    pythonReference: `for i in range(n - 1):
    for j in range(n - i - 1):
        if arr[j] > arr[j + 1]:
            arr[j], arr[j + 1] = arr[j + 1], arr[j]`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: '38, 14, 52, 9, 27, 41, 18',
    videoResources: [
      {
        title: 'Algorithms: Sorting & Asymptotic Complexity',
        creator: 'MIT OpenCourseWare 6.006',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        verifiedNote: 'Official MIT OCW algorithms course.',
      },
    ],
    testExpectation: 'Produces non-decreasing sorted sequence matching Array.sort.',
  },
  {
    id: 'merge-sort',
    name: 'Merge Sort (Divide & Conquer)',
    category: 'Searching & Sorting',
    executionTier: 'executable',
    visualizationKind: 'array-bars',
    isMachineLearning: false,
    problemSolved: 'Sorts an array deterministically in O(n log n) time regardless of initial element ordering.',
    whyUseful: 'Guarantees O(n log n) worst-case speed and stability—ideal for large datasets and linked structures.',
    howItWorks: 'Recursively splits the array in half until size 1, then merges sorted halves by repeatedly taking the smaller front element.',
    mathematicalFoundation: 'Recurrence T(n) = 2T(n/2) + Θ(n) resolves via Master Theorem to Θ(n log n).',
    formula: 'T(n) = 2T(n/2) + Θ(n) = Θ(n log₂ n)',
    inputSpec: 'Comma-separated array of numbers.',
    outputSpec: 'Sorted array + merge steps & total comparisons.',
    workedExample: 'Divides [44, 15, 62, 8, 31, 25, 50] into halves and merges sub-arrays upward.',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n log n)' },
    spaceComplexity: 'O(n)',
    advantages: ['Guaranteed O(n log n) worst-case runtime.', 'Stable ordering.'],
    limitations: ['Requires O(n) auxiliary merge buffer memory.'],
    realWorldApplications: ['External disk sorting', 'Python Timsort & Java Object.sort foundations', 'Database join merge pipelines'],
    pseudocode: `function mergeSort(A, l, r):
  if l >= r: return
  mid = (l + r) / 2
  mergeSort(A, l, mid)
  mergeSort(A, mid + 1, r)
  mergeSortedHalves(A, l, mid, r)`,
    pythonReference: `def merge_sort(a):
    if len(a) <= 1: return a
    m = len(a) // 2
    return merge(merge_sort(a[:m]), merge_sort(a[m:]))`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: '44, 15, 62, 8, 31, 25, 50',
    videoResources: [
      {
        title: 'Merge Sort — Khan Academy Algorithms',
        creator: 'Khan Academy Computing',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/computing/computer-science/algorithms/merge-sort',
        verifiedNote: 'Official Khan Academy lesson.',
      },
    ],
    testExpectation: 'Deterministic O(n log n) ascending sort output.',
  },
  {
    id: 'quick-sort',
    name: 'Quick Sort (Lomuto Partition)',
    category: 'Searching & Sorting',
    executionTier: 'executable',
    visualizationKind: 'array-bars',
    isMachineLearning: false,
    problemSolved: 'Sorts an array in-place by partitioning elements around a chosen pivot.',
    whyUseful: 'Fast in-place cache-friendly sorting algorithm powering standard libraries.',
    howItWorks: 'Selects the last element as pivot, moves smaller elements to the left partition, places pivot in its final position, and recurses on left & right.',
    mathematicalFoundation: 'Average recurrence T(n) = O(n log n) with balanced pivots.',
    formula: 'E[T(n)] = O(n log n)   |   Space = O(log n)',
    inputSpec: 'Comma-separated array of numbers.',
    outputSpec: 'Sorted array + pivot placements + comparisons & swaps.',
    workedExample: 'Uses pivot values to anchor sorted positions cleanly in place.',
    timeComplexity: { best: 'O(n log n)', average: 'O(n log n)', worst: 'O(n²)' },
    spaceComplexity: 'O(log n)',
    advantages: ['In-place memory footprint.', 'Low inner-loop constant factor.'],
    limitations: ['Not stable.', 'Already-sorted arrays trigger O(n²) unless pivot is randomized.'],
    realWorldApplications: ['C++ std::sort / introsort', 'Numerical simulation particle sorting'],
    pseudocode: `function quickSort(A, lo, hi):
  if lo < hi:
    p = partition(A, lo, hi)
    quickSort(A, lo, p - 1)
    quickSort(A, p + 1, hi)`,
    pythonReference: `def partition(a, lo, hi):
    pivot, i = a[hi], lo
    for j in range(lo, hi):
        if a[j] <= pivot:
            a[i], a[j] = a[j], a[i]; i += 1
    a[i], a[hi] = a[hi], a[i]
    return i`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: '35, 12, 48, 7, 29, 19, 24',
    videoResources: [
      {
        title: 'Quicksort — Khan Academy Algorithms',
        creator: 'Khan Academy Computing',
        source: 'Khan Academy',
        url: 'https://www.khanacademy.org/computing/computer-science/algorithms/quick-sort',
        verifiedNote: 'Interactive partitioning visual explanation.',
      },
    ],
    testExpectation: 'Produces exact ascending sorted order.',
  },
  {
    id: 'bfs',
    name: 'Breadth-First Search (BFS)',
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'graph-path',
    isMachineLearning: false,
    problemSolved: 'Explores graph nodes layer by layer to find the shortest path by edge count from source to goal.',
    whyUseful: 'Guarantees minimum hop count in unweighted networks, social graphs, and puzzle state spaces.',
    howItWorks: 'Maintains a FIFO queue starting at node A; pops front node, marks unvisited neighbors into queue, and records parent pointers to reconstruct shortest hops to F.',
    mathematicalFoundation: 'Distance(v) equals minimum number of unweighted edges from source s.',
    formula: 'Queue FIFO · d(v) = d(u) + 1',
    inputSpec: 'Built-in 6-node connected weighted/unweighted graph (A → F).',
    outputSpec: 'Level-by-level visit order + shortest unweighted path A → ... → F.',
    workedExample: 'Finds 2-hop path A → C → F before exploring deeper branches.',
    timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
    spaceComplexity: 'O(V)',
    advantages: ['Optimal shortest unweighted path.', 'Complete on finite graphs.'],
    limitations: ['Uses O(V) queue memory on wide branching trees.'],
    realWorldApplications: ['GPS hop routing', 'Web crawling', 'Network broadcast & peer discovery'],
    pseudocode: `queue = [start]; visited = {start}
while queue not empty:
  u = queue.popFront()
  for v in neighbors(u):
    if v not in visited:
      visited.add(v); parent[v] = u; queue.push(v)`,
    pythonReference: `q = deque([start])
while q:
    u = q.popleft()`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: 'Graph nodes A..F (start A -> goal F)',
    videoResources: [
      {
        title: 'MIT 6.006: Breadth-First Search (BFS)',
        creator: 'MIT OpenCourseWare',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        verifiedNote: 'Official MIT graph traversal lecture.',
      },
    ],
    testExpectation: 'Finds minimum-hop path A → C → F (2 edges).',
  },
  {
    id: 'dfs',
    name: 'Depth-First Search (DFS)',
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'graph-path',
    isMachineLearning: false,
    problemSolved: 'Explores as far down each branch as possible using a LIFO stack before backtracking.',
    whyUseful: 'Detects graph cycles, computes topological sorting, and solves maze/connected-component discovery.',
    howItWorks: 'Pushes source onto a stack, pops node u, marks visited, pushes unvisited neighbors, and traces path when target is reached.',
    mathematicalFoundation: 'Maintains parent discovery stack of depth ≤ |V|.',
    formula: 'Stack LIFO · Time = O(V + E)',
    inputSpec: 'Graph A..F from start A to goal F.',
    outputSpec: 'Depth-first traversal order + discovered path.',
    workedExample: 'Follows branch A → B → D before backtracking or reaching F.',
    timeComplexity: { best: 'O(V + E)', average: 'O(V + E)', worst: 'O(V + E)' },
    spaceComplexity: 'O(V)',
    advantages: ['Small stack memory on sparse/deep graphs.', 'Forms basis of topological sort & Tarjan SCC.'],
    limitations: ['Does not guarantee shortest path length.'],
    realWorldApplications: ['Dependency build resolution', 'Cycle detection in circuits', 'Maze solving'],
    pseudocode: `stack = [start]
while stack not empty:
  u = stack.pop()
  if u not in visited:
    visited.add(u)
    push unvisited neighbors of u`,
    pythonReference: `stack = [start]
while stack:
    u = stack.pop()`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: 'Graph nodes A..F',
    videoResources: [
      {
        title: 'MIT 6.006: Depth-First Search (DFS)',
        creator: 'MIT OpenCourseWare',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        verifiedNote: 'Official MIT OCW lecture.',
      },
    ],
    testExpectation: 'Visits connected nodes depth-first and locates F.',
  },
  {
    id: 'dijkstra',
    name: "Dijkstra's Shortest Path",
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'graph-path',
    isMachineLearning: false,
    problemSolved: 'Finds the minimum total edge-weight path from source to destination in a non-negative weighted graph.',
    whyUseful: 'Optimal weighted routing across maps, packets, and supply chains where edges have unequal travel times.',
    howItWorks:
      'Initializes dist[start] = 0 and others = ∞; repeatedly selects unvisited node u with minimum dist[u] and relaxes edges d[u] + w(u,v) < d[v].',
    mathematicalFoundation: 'Greedy edge relaxation invariant: settled node distance d[u] is permanently optimal.',
    formula: 'd[v] = min(d[v], d[u] + w(u, v))   (w ≥ 0)',
    inputSpec: 'Weighted graph A..F with positive edge weights.',
    outputSpec: 'Optimal weighted shortest path A → B → D → E → F (cost 8) vs heavier 2-hop path A → C → F (cost 13).',
    workedExample: 'Prefers multi-hop low-cost route A→B(2)→D(3)→E(1)→F(2) = 8 over direct heavy route A→C(4)→F(9) = 13.',
    timeComplexity: { best: 'O((V + E) log V)', average: 'O((V + E) log V)', worst: 'O(V²)' },
    spaceComplexity: 'O(V)',
    advantages: ['Provably optimal shortest weighted path when weights ≥ 0.'],
    limitations: ['Fails with negative edge weights (requires Bellman-Ford).'],
    realWorldApplications: ['Road navigation & transit routing', 'OSPF internet packet routing', 'Robotics waypoint planning'],
    pseudocode: `dist[start] = 0; others = INF
while unvisited nodes remain:
  u = unvisited node with smallest dist[u]
  for each neighbor v of u:
    if dist[u] + w(u,v) < dist[v]:
      dist[v] = dist[u] + w(u,v); parent[v] = u`,
    pythonReference: `while pq:
    d, u = heapq.heappop(pq)
    for v, w in adj[u]:
        if d + w < dist[v]:
            dist[v] = d + w; heapq.heappush(pq, (dist[v], v))`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: 'Weighted graph A..F (shows multi-hop optimal path cost 8)',
    videoResources: [
      {
        title: "MIT 6.006: Dijkstra's Algorithm",
        creator: 'MIT OpenCourseWare',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        verifiedNote: 'Official MIT OCW weighted shortest paths.',
      },
    ],
    testExpectation: 'Finds lowest total weight 8 along A -> B -> D -> E -> F.',
  },
  {
    id: 'a-star',
    name: 'A* Heuristic Shortest Path',
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'graph-path',
    isMachineLearning: false,
    problemSolved: 'Accelerates Dijkstra’s weighted shortest-path search by adding an admissible geometric distance heuristic h(n) toward the goal.',
    whyUseful: 'Explores dramatically fewer nodes than uniform Dijkstra while still guaranteeing the optimal path.',
    howItWorks: 'Ranks frontier nodes by f(n) = g(n) + h(n), where g(n) is actual cost from start and h(n) is straight-line Euclidean distance to goal F.',
    mathematicalFoundation: 'f(n) = g(n) + h(n); optimality guaranteed when h(n) ≤ actual remaining distance.',
    formula: 'f(n) = g(n) + h(n)',
    inputSpec: 'Spatial weighted graph A..F with goal F.',
    outputSpec: 'Optimal path + f-score guided node expansions.',
    workedExample: 'Avoids exploring backward away from goal F thanks to admissible Euclidean h(n).',
    timeComplexity: { best: 'O(b^d)', average: 'O(E log V)', worst: 'O(V²)' },
    spaceComplexity: 'O(V)',
    advantages: ['Faster than Dijkstra with strong admissible heuristics.', 'Guarantees shortest path.'],
    limitations: ['Memory grows with open/closed frontier sets.'],
    realWorldApplications: ['Autonomous vehicle & Mars rover pathfinding', 'Game AI navigation', 'Protein folding search'],
    pseudocode: `f[start] = h(start, goal)
while openSet not empty:
  u = node in openSet with lowest f[u]
  if u == goal: return reconstructPath(u)
  relax neighbors updating g[v] and f[v] = g[v] + h(v, goal)`,
    pythonReference: `f_score = g[v] + math.hypot(goal.x - v.x, goal.y - v.y)`,
    defaultParams: {},
    parameters: [],
    defaultInputSample: 'Spatial graph A..F with Euclidean heuristic h(n)',
    videoResources: [
      {
        title: 'Stanford CS221: A* Search',
        creator: 'Stanford CS221',
        source: 'Stanford University',
        url: 'https://stanford-cs221.github.io/',
        verifiedNote: 'Official Stanford AI curriculum reference.',
      },
    ],
    testExpectation: 'Matches optimal weighted cost 8 with goal-directed priority scores.',
  },
  {
    id: 'dp-knapsack',
    name: 'Dynamic Programming (0/1 Knapsack)',
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'dp-table',
    isMachineLearning: false,
    problemSolved: 'Selects the highest-value subset of indivisible items fitting within a capacity budget by tabulating subproblem solutions.',
    whyUseful: 'Replaces exponential O(2ⁿ) brute force with exact O(n · W) table filling.',
    howItWorks:
      'Fills DP table dp[i][w] row by row: either skip item i (dp[i-1][w]) or include it (val[i] + dp[i-1][w - weight[i]]) when weight[i] ≤ w.',
    mathematicalFoundation: 'dp[i][w] = max(dp[i−1][w], vᵢ + dp[i−1][w − wᵢ])',
    formula: 'dp[i][w] = max(dp[i−1][w], vᵢ + dp[i−1][w − wᵢ])',
    inputSpec: '4 items with (weight, value) + capacity W.',
    outputSpec: 'Complete DP matrix + optimal maximum value dp[n][W].',
    workedExample: 'On items (2,3), (3,4), (4,5), (5,6) and capacity W=5, fills table systematically to exact optimum 7.',
    timeComplexity: { best: 'O(n · W)', average: 'O(n · W)', worst: 'O(n · W)' },
    spaceComplexity: 'O(n · W)',
    advantages: ['Exact global optimum.', 'Reuses overlapping subproblems cleanly.'],
    limitations: ['Pseudo-polynomial: table grows large if capacity W is huge.'],
    realWorldApplications: ['Resource & energy payload allocation', 'Sequence alignment in bioinformatics', 'Portfolio capital budgeting'],
    pseudocode: `for i = 1 to n:
  for w = 0 to W:
    if weight[i] <= w:
      dp[i][w] = max(dp[i-1][w], value[i] + dp[i-1][w - weight[i]])
    else:
      dp[i][w] = dp[i-1][w]`,
    pythonReference: `for i in range(1, n + 1):
    for w in range(W + 1):
        dp[i][w] = max(dp[i-1][w], val[i-1] + dp[i-1][w-wt[i-1]]) if wt[i-1] <= w else dp[i-1][w]`,
    defaultParams: { capacity: 6 },
    parameters: [
      { key: 'capacity', label: 'Knapsack Capacity (W)', symbol: 'W', min: 4, max: 8, step: 1, defaultValue: 6 },
    ],
    defaultInputSample: 'Items: (w=2,v=3), (w=3,v=4), (w=4,v=5), (w=5,v=6)',
    videoResources: [
      {
        title: 'MIT 6.006: Dynamic Programming I',
        creator: 'MIT OpenCourseWare',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-spring-2020/',
        verifiedNote: 'Official MIT OCW memoization & tabulation.',
      },
    ],
    testExpectation: 'At W=5, exact optimum value equals 7 (items weight 2+3).',
  },
  {
    id: 'genetic-algorithm',
    name: 'Genetic Algorithm (Function Optimization)',
    category: 'Graphs, DP & Evolutionary',
    executionTier: 'executable',
    visualizationKind: 'population-ga',
    isMachineLearning: false,
    problemSolved: 'Evolves candidate solutions across generations using fitness selection, crossover, and deterministic mutation.',
    whyUseful: 'Searches rugged, non-differentiable fitness landscapes where gradients do not exist.',
    howItWorks:
      'Evaluates fitness f(x) = x · sin(x) + 12 across a population on [0, 10], selects top parents, performs midpoint crossover + small perturbation, and tracks peak fitness.',
    mathematicalFoundation: 'Fitness f(x) guides stochastic/deterministic tournament selection toward peak x ≈ 7.98.',
    formula: 'f(x) = x·sin(x) + 12   |   NextGen = Mutate(Crossover(Select(Pop)))',
    inputSpec: 'Population size 8, generations, objective f(x).',
    outputSpec: 'Per-generation population scatter + best fitness trajectory.',
    workedExample: 'Over 6 generations, mean population converges rapidly onto global peak near x ≈ 7.98.',
    timeComplexity: { best: 'O(G · P)', average: 'O(G · P)', worst: 'O(G · P)' },
    spaceComplexity: 'O(P)',
    advantages: ['Does not require derivatives or continuity.', 'Explores multiple candidate basins simultaneously.'],
    limitations: ['Heuristic—does not guarantee exact optimum.', 'Sensitive to mutation rate.'],
    realWorldApplications: ['Antenna & airfoil shape design', 'Hyperparameter & timetable scheduling'],
    pseudocode: `initialize population P
for gen in 1..G:
  score fitness(ind) for ind in P
  parents = topHalf(P)
  P = crossoverAndMutate(parents)`,
    pythonReference: `scored = sorted(((fitness(x), x) for x in pop), reverse=True)`,
    defaultParams: { generations: 6 },
    parameters: [
      { key: 'generations', label: 'Generations (G)', symbol: 'G', min: 3, max: 10, step: 1, defaultValue: 6 },
    ],
    defaultInputSample: 'f(x) = x * sin(x) + 12 on [0, 10]',
    videoResources: [
      {
        title: 'MIT OpenCourseWare: Search & Genetic Algorithms',
        creator: 'MIT OpenCourseWare',
        source: 'MIT OCW',
        url: 'https://ocw.mit.edu/courses/6-034-artificial-intelligence-fall-2010/',
        verifiedNote: 'Official MIT AI course lecture series.',
      },
    ],
    testExpectation: 'Best population fitness increases or converges near global peak f(7.98) ≈ 19.9.',
  },
];

export function getAlgorithmById(id: string): AlgorithmDefinition | undefined {
  return ALGORITHM_REGISTRY.find((a) => a.id === id);
}

export function matchBuiltInAlgorithm(query: string): AlgorithmDefinition | undefined {
  const q = query.trim().toLowerCase();
  if (!q) return undefined;
  const rules: [RegExp, string][] = [
    [/linear\s*regression|ordinary\s*least\s*squares|\bols\b/, 'linear-regression'],
    [/gradient\s*descent/, 'gradient-descent'],
    [/logistic\s*regression|sigmoid\s*classif/, 'logistic-regression'],
    [/decision\s*tree|random\s*forest|gini\s*split|cart\b/, 'decision-tree'],
    [/k[-\s]*nearest|knn\b|nearest\s*neighbor/, 'knn'],
    [/k[-\s]*means|cluster/, 'k-means'],
    [/neural\s*net|backprop|mlp\b/, 'neural-network'],
    [/perceptron/, 'perceptron'],
    [/svm\b|support\s*vector/, 'svm'],
    [/naive\s*bayes|bayes/, 'naive-bayes'],
    [/pca\b|principal\s*component/, 'pca'],
    [/binary\s*search/, 'binary-search'],
    [/linear\s*search|sequential\s*search/, 'linear-search'],
    [/bubble\s*sort/, 'bubble-sort'],
    [/merge\s*sort/, 'merge-sort'],
    [/quick\s*sort|quicksort/, 'quick-sort'],
    [/dijkstra|shortest\s*weighted\s*path/, 'dijkstra'],
    [/a\s*\*|a-star|heuristic\s*search/, 'a-star'],
    [/breadth[-\s]*first|\bbfs\b/, 'bfs'],
    [/depth[-\s]*first|\bdfs\b/, 'dfs'],
    [/knapsack|dynamic\s*program|\bdp\b/, 'dp-knapsack'],
    [/genetic\s*alg|evolutionary/, 'genetic-algorithm'],
  ];
  for (const [pattern, id] of rules) {
    if (pattern.test(q)) {
      return getAlgorithmById(id);
    }
  }
  return ALGORITHM_REGISTRY.find(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      q.includes(a.id.replace('-', ' '))
  );
}
