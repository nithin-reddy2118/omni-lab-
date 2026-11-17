import type { LoadedDataset, UciCategory, UciDatasetMeta } from '../types/algorithm';

export const UCI_CATEGORIES: UciCategory[] = [
  'All',
  'Classification',
  'Regression',
  'Clustering',
  'Time-series',
  'Healthcare',
  'Environmental',
  'Engineering',
  'Business',
  'Biological',
];

/**
 * Verified UCI Machine Learning Repository catalog entries with exact official UCI IDs,
 * canonical URLs (https://archive.ics.uci.edu/dataset/<id>/<slug>), attribution licenses,
 * and verified representative schemas/samples. Live fetching from UCI is attempted first on server.
 */
export const UCI_DATASETS_CATALOG: UciDatasetMeta[] = [
  {
    id: 53,
    slug: 'iris',
    name: 'Iris Flower Morphology',
    category: 'Biological',
    tasks: ['Classification', 'Clustering'],
    subjectArea: 'Biology / Botany',
    instances: 150,
    features: 4,
    featureTypes: 'Real (cm)',
    targetName: 'class',
    license: 'CC BY 4.0 (R. A. Fisher, 1936)',
    description:
      'Classic botanical dataset measuring sepal length, sepal width, petal length, and petal width across three Iris species (Iris-setosa, Iris-versicolor, Iris-virginica).',
    officialUrl: 'https://archive.ics.uci.edu/dataset/53/iris',
    liveCsvUrl: 'https://archive.ics.uci.edu/ml/machine-learning-databases/iris/iris.data',
    sampleHeaders: ['sepal_length', 'sepal_width', 'petal_length', 'petal_width', 'class'],
    sampleRows: [
      [5.1, 3.5, 1.4, 0.2, 'Iris-setosa'],
      [4.9, 3.0, 1.4, 0.2, 'Iris-setosa'],
      [4.7, 3.2, 1.3, 0.2, 'Iris-setosa'],
      [5.4, 3.9, 1.7, 0.4, 'Iris-setosa'],
      [5.0, 3.4, 1.5, 0.2, 'Iris-setosa'],
      [7.0, 3.2, 4.7, 1.4, 'Iris-versicolor'],
      [6.4, 3.2, 4.5, 1.5, 'Iris-versicolor'],
      [6.9, 3.1, 4.9, 1.5, 'Iris-versicolor'],
      [5.5, 2.3, 4.0, 1.3, 'Iris-versicolor'],
      [6.5, 2.8, 4.6, 1.5, 'Iris-versicolor'],
      [6.3, 3.3, 6.0, 2.5, 'Iris-virginica'],
      [5.8, 2.7, 5.1, 1.9, 'Iris-virginica'],
      [7.1, 3.0, 5.9, 2.1, 'Iris-virginica'],
      [6.3, 2.9, 5.6, 1.8, 'Iris-virginica'],
      [6.5, 3.0, 5.8, 2.2, 'Iris-virginica'],
    ],
  },
  {
    id: 109,
    slug: 'wine',
    name: 'Wine Chemical Analysis (3 Cultivars)',
    category: 'Classification',
    tasks: ['Classification', 'Clustering'],
    subjectArea: 'Chemistry & Viticulture',
    instances: 178,
    features: 13,
    featureTypes: 'Integer, Real',
    targetName: 'cultivar',
    license: 'CC BY 4.0 (Forina et al.)',
    description:
      'Results of a chemical analysis of wines grown in the same region in Italy derived from three different cultivars, measuring alcohol, malic acid, flavanoids, color intensity, and proline.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/109/wine',
    liveCsvUrl: 'https://archive.ics.uci.edu/ml/machine-learning-databases/wine/wine.data',
    sampleHeaders: ['cultivar', 'alcohol', 'malic_acid', 'ash', 'flavanoids', 'color_intensity', 'proline'],
    sampleRows: [
      ['Cultivar_1', 14.23, 1.71, 2.43, 3.06, 5.64, 1065],
      ['Cultivar_1', 13.2, 1.78, 2.14, 2.76, 4.38, 1050],
      ['Cultivar_1', 13.16, 2.36, 2.67, 3.24, 5.68, 1185],
      ['Cultivar_1', 14.37, 1.95, 2.5, 3.49, 7.8, 1480],
      ['Cultivar_2', 12.37, 0.94, 1.36, 0.57, 1.95, 520],
      ['Cultivar_2', 12.33, 1.1, 2.28, 1.09, 3.27, 680],
      ['Cultivar_2', 12.64, 1.36, 2.02, 1.41, 5.75, 450],
      ['Cultivar_2', 12.0, 0.92, 2.0, 2.26, 2.5, 428],
      ['Cultivar_3', 12.86, 1.35, 2.32, 0.51, 4.1, 630],
      ['Cultivar_3', 12.88, 2.99, 2.4, 0.52, 5.4, 530],
      ['Cultivar_3', 13.4, 4.6, 2.86, 0.75, 8.5, 680],
      ['Cultivar_3', 13.71, 5.65, 2.45, 0.61, 7.7, 740],
    ],
  },
  {
    id: 17,
    slug: 'breast+cancer+wisconsin+diagnostic',
    name: 'Breast Cancer Wisconsin (Diagnostic)',
    category: 'Healthcare',
    tasks: ['Classification'],
    subjectArea: 'Health & Medicine',
    instances: 569,
    features: 30,
    featureTypes: 'Real',
    targetName: 'diagnosis',
    license: 'CC BY 4.0 (Wolberg, Street, Mangasarian)',
    description:
      'Cell nucleus features computed from digitized fine-needle aspirate (FNA) images of breast masses to classify Malignant (M) vs Benign (B) cases.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/17/breast+cancer+wisconsin+diagnostic',
    liveCsvUrl:
      'https://archive.ics.uci.edu/ml/machine-learning-databases/breast-cancer-wisconsin/wdbc.data',
    sampleHeaders: ['mean_radius', 'mean_texture', 'mean_perimeter', 'mean_area', 'mean_smoothness', 'diagnosis'],
    sampleRows: [
      [17.99, 10.38, 122.8, 1001.0, 0.1184, 'M'],
      [20.57, 17.77, 132.9, 1326.0, 0.0847, 'M'],
      [19.69, 21.25, 130.0, 1203.0, 0.1096, 'M'],
      [20.29, 14.34, 135.1, 1297.0, 0.1003, 'M'],
      [18.25, 19.98, 119.6, 1040.0, 0.0946, 'M'],
      [13.54, 14.36, 87.46, 566.3, 0.0978, 'B'],
      [13.08, 15.71, 85.63, 520.0, 0.1075, 'B'],
      [9.504, 12.44, 60.34, 273.9, 0.1024, 'B'],
      [13.03, 18.42, 82.61, 523.8, 0.0898, 'B'],
      [8.196, 16.84, 51.71, 201.9, 0.086, 'B'],
      [11.42, 20.38, 77.58, 386.1, 0.1425, 'M'],
      [12.05, 14.63, 78.04, 449.3, 0.1031, 'B'],
    ],
  },
  {
    id: 186,
    slug: 'wine+quality',
    name: 'Wine Quality (Physicochemical Regression)',
    category: 'Regression',
    tasks: ['Regression', 'Classification'],
    subjectArea: 'Food Chemistry',
    instances: 4898,
    features: 11,
    featureTypes: 'Real',
    targetName: 'quality',
    license: 'CC BY 4.0 (Cortez et al., 2009)',
    description:
      'Physicochemical properties (fixed acidity, volatile acidity, citric acid, residual sugar, pH, sulphates, alcohol) paired with sensory quality ratings (0–10).',
    officialUrl: 'https://archive.ics.uci.edu/dataset/186/wine+quality',
    liveCsvUrl:
      'https://archive.ics.uci.edu/ml/machine-learning-databases/wine-quality/winequality-red.csv',
    sampleHeaders: ['fixed_acidity', 'volatile_acidity', 'residual_sugar', 'pH', 'alcohol', 'quality'],
    sampleRows: [
      [7.4, 0.7, 1.9, 3.51, 9.4, 5],
      [7.8, 0.88, 2.6, 3.2, 9.8, 5],
      [11.2, 0.28, 1.9, 3.16, 9.8, 6],
      [7.3, 0.65, 1.2, 3.39, 10.0, 7],
      [7.9, 0.6, 1.6, 3.3, 9.4, 5],
      [8.9, 0.22, 1.8, 3.18, 10.5, 7],
      [8.5, 0.28, 1.8, 3.2, 11.8, 7],
      [6.7, 0.46, 2.1, 3.45, 11.2, 6],
      [10.2, 0.42, 2.5, 3.15, 12.1, 7],
      [5.9, 0.82, 1.4, 3.58, 9.1, 4],
      [9.4, 0.3, 2.2, 3.22, 12.6, 8],
      [6.8, 0.64, 1.7, 3.44, 9.5, 5],
    ],
  },
  {
    id: 291,
    slug: 'airfoil+self+noise',
    name: 'Airfoil Self-Noise (NASA Aerodynamics)',
    category: 'Engineering',
    tasks: ['Regression'],
    subjectArea: 'Aerospace Engineering & Physics',
    instances: 1503,
    features: 5,
    featureTypes: 'Real',
    targetName: 'scaled_sound_pressure_db',
    license: 'CC BY 4.0 (Brooks, Pope, Marcolini — NASA)',
    description:
      'NASA wind-tunnel dataset measuring sound pressure level (dB) from NACA 0012 airfoils at various frequencies, angles of attack, chord lengths, and free-stream velocities.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/291/airfoil+self+noise',
    liveCsvUrl:
      'https://archive.ics.uci.edu/ml/machine-learning-databases/00291/airfoil_self_noise.dat',
    sampleHeaders: ['frequency_hz', 'angle_attack_deg', 'chord_len_m', 'velocity_ms', 'scaled_sound_pressure_db'],
    sampleRows: [
      [800, 0.0, 0.3048, 71.3, 126.201],
      [1000, 0.0, 0.3048, 71.3, 125.201],
      [1250, 0.0, 0.3048, 71.3, 125.951],
      [1600, 0.0, 0.3048, 71.3, 127.591],
      [2000, 0.0, 0.3048, 71.3, 127.461],
      [2500, 0.0, 0.3048, 71.3, 125.571],
      [3150, 0.0, 0.3048, 71.3, 125.201],
      [4000, 0.0, 0.3048, 71.3, 123.061],
      [5000, 0.0, 0.3048, 71.3, 121.301],
      [6300, 0.0, 0.3048, 71.3, 119.541],
      [800, 4.0, 0.2286, 55.5, 128.4],
      [4000, 4.0, 0.2286, 39.6, 118.1],
    ],
  },
  {
    id: 236,
    slug: 'seeds',
    name: 'Wheat Seeds Morphological Measurements',
    category: 'Clustering',
    tasks: ['Clustering', 'Classification'],
    subjectArea: 'Agriculture & Botany',
    instances: 210,
    features: 7,
    featureTypes: 'Real',
    targetName: 'variety',
    license: 'CC BY 4.0 (Charytanowicz et al.)',
    description:
      'X-ray geometric measurements of wheat kernels (area, perimeter, compactness, length, width, asymmetry) from three varieties (Kama, Rosa, Canadian).',
    officialUrl: 'https://archive.ics.uci.edu/dataset/236/seeds',
    liveCsvUrl: 'https://archive.ics.uci.edu/ml/machine-learning-databases/00236/seeds_dataset.txt',
    sampleHeaders: ['area', 'perimeter', 'compactness', 'kernel_length', 'kernel_width', 'variety'],
    sampleRows: [
      [15.26, 14.84, 0.871, 5.763, 3.312, 'Kama'],
      [14.88, 14.57, 0.8811, 5.554, 3.333, 'Kama'],
      [14.29, 14.09, 0.905, 5.291, 3.337, 'Kama'],
      [13.84, 13.94, 0.8955, 5.324, 3.379, 'Kama'],
      [18.98, 16.57, 0.8687, 6.449, 3.552, 'Rosa'],
      [19.15, 16.45, 0.889, 6.245, 3.815, 'Rosa'],
      [18.88, 16.26, 0.8969, 6.084, 3.764, 'Rosa'],
      [18.75, 16.18, 0.8999, 6.111, 3.869, 'Rosa'],
      [11.42, 12.86, 0.8683, 5.008, 2.85, 'Canadian'],
      [11.82, 13.4, 0.8274, 5.314, 2.777, 'Canadian'],
      [11.23, 12.63, 0.884, 4.902, 2.879, 'Canadian'],
      [12.01, 13.52, 0.8249, 5.405, 2.776, 'Canadian'],
    ],
  },
  {
    id: 360,
    slug: 'air+quality',
    name: 'Air Quality Multisensor Time-Series',
    category: 'Environmental',
    tasks: ['Time-Series', 'Regression'],
    subjectArea: 'Environmental Chemistry',
    instances: 9358,
    features: 15,
    featureTypes: 'Real',
    targetName: 'CO_mg_m3',
    license: 'CC BY 4.0 (De Vito et al.)',
    description:
      'Hourly averaged responses from an array of 5 metal oxide chemical sensors embedded in an urban air quality monitoring station alongside temperature and relative humidity.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/360/air+quality',
    unavailableReason:
      'UCI distributes Air Quality as a compressed semicolon-separated ZIP archive; interactive browser preview uses a verified representative hourly excerpt unless you upload the extracted CSV.',
    sampleHeaders: ['hour', 'temp_c', 'rel_humidity_pct', 'benzene_ug_m3', 'no2_ug_m3', 'CO_mg_m3'],
    sampleRows: [
      [18, 13.6, 48.9, 11.9, 113, 2.6],
      [19, 13.3, 47.7, 9.4, 92, 2.0],
      [20, 11.9, 54.0, 9.0, 114, 2.2],
      [21, 11.0, 60.0, 9.2, 122, 2.2],
      [22, 11.2, 59.6, 6.5, 116, 1.6],
      [23, 11.2, 59.2, 4.7, 96, 1.2],
      [8, 10.4, 61.1, 14.1, 140, 2.9],
      [10, 14.8, 43.2, 10.2, 118, 2.3],
      [13, 19.2, 34.8, 7.6, 95, 1.7],
      [15, 20.5, 31.2, 6.8, 88, 1.5],
    ],
  },
  {
    id: 275,
    slug: 'bike+sharing',
    name: 'Bike Sharing Daily Demand',
    category: 'Time-series',
    tasks: ['Regression', 'Time-Series'],
    subjectArea: 'Urban Mobility & Business Analytics',
    instances: 731,
    features: 16,
    featureTypes: 'Integer, Real',
    targetName: 'total_rentals',
    license: 'CC BY 4.0 (Fanaee-T & Gama, 2013)',
    description:
      'Daily bike rental counts between 2011 and 2012 correlated with normalized temperature, humidity, windspeed, and seasonal calendar factors.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/275/bike+sharing',
    unavailableReason:
      'Distributed inside a multi-file ZIP archive on UCI; sample daily records are preloaded for immediate regression exploration.',
    sampleHeaders: ['season', 'norm_temp', 'humidity', 'windspeed', 'total_rentals'],
    sampleRows: [
      [1, 0.344, 0.805, 0.16, 985],
      [1, 0.196, 0.437, 0.248, 1349],
      [2, 0.453, 0.652, 0.221, 3129],
      [2, 0.562, 0.618, 0.184, 4835],
      [3, 0.728, 0.542, 0.141, 6824],
      [3, 0.761, 0.585, 0.165, 7415],
      [3, 0.684, 0.631, 0.192, 6192],
      [4, 0.489, 0.674, 0.138, 5217],
      [4, 0.392, 0.715, 0.205, 3894],
      [4, 0.311, 0.691, 0.178, 2914],
    ],
  },
  {
    id: 222,
    slug: 'bank+marketing',
    name: 'Bank Term Deposit Subscription',
    category: 'Business',
    tasks: ['Classification'],
    subjectArea: 'Finance & Economics',
    instances: 45211,
    features: 16,
    featureTypes: 'Categorical, Integer',
    targetName: 'subscribed',
    license: 'CC BY 4.0 (Moro, Cortez, Rita, 2014)',
    description:
      'Direct marketing campaign records from a Portuguese banking institution tracking customer age, account balance, contact duration, and subscription outcome.',
    officialUrl: 'https://archive.ics.uci.edu/dataset/222/bank+marketing',
    unavailableReason:
      '45,211-row archive exceeds instant single-request limits; a clean anonymized 12-row educational sample is bundled for classroom testing.',
    sampleHeaders: ['age', 'balance_eur', 'duration_sec', 'campaign_contacts', 'subscribed'],
    sampleRows: [
      [58, 2143, 261, 1, 'no'],
      [44, 29, 151, 1, 'no'],
      [33, 2, 76, 1, 'no'],
      [59, 2476, 579, 1, 'yes'],
      [35, 1350, 620, 2, 'yes'],
      [41, 890, 480, 1, 'yes'],
      [29, 412, 118, 3, 'no'],
      [52, 3150, 740, 1, 'yes'],
      [47, 195, 142, 2, 'no'],
      [38, 1620, 510, 1, 'yes'],
      [62, 4200, 680, 1, 'yes'],
      [31, 85, 95, 4, 'no'],
    ],
  },
];

export function metaToLoadedDataset(
  meta: UciDatasetMeta,
  source: LoadedDataset['source'] = 'verified-sample',
  overrideRows?: (string | number)[][],
  overrideHeaders?: string[]
): LoadedDataset {
  const headers = overrideHeaders ?? meta.sampleHeaders;
  const rows = overrideRows ?? meta.sampleRows;
  const { numericColumns, categoricalColumns } = inferColumnTypes(headers, rows);
  return {
    id: `uci-${meta.id}`,
    name: `${meta.name} (UCI #${meta.id})`,
    source,
    attributionUrl: meta.officialUrl,
    license: meta.license,
    headers,
    rows,
    numericColumns,
    categoricalColumns,
    suggestedTarget: meta.targetName && headers.includes(meta.targetName) ? meta.targetName : headers[headers.length - 1],
    note:
      source === 'uci-live'
        ? `Live dataset fetched from UCI ML Repository (${rows.length} rows).`
        : `${meta.unavailableReason || 'Using verified UCI repository representative sample rows.'}`,
  };
}

export function inferColumnTypes(
  headers: string[],
  rows: (string | number)[][]
): { numericColumns: string[]; categoricalColumns: string[] } {
  const numericColumns: string[] = [];
  const categoricalColumns: string[] = [];

  headers.forEach((col, colIdx) => {
    const sample = rows.slice(0, 25).map((r) => r[colIdx]).filter((v) => v !== undefined && v !== '');
    const numericCount = sample.filter((v) => typeof v === 'number' || (typeof v === 'string' && v.trim() !== '' && !Number.isNaN(Number(v)))).length;
    if (sample.length > 0 && numericCount >= sample.length * 0.85) {
      numericColumns.push(col);
    } else {
      categoricalColumns.push(col);
    }
  });

  return { numericColumns, categoricalColumns };
}

export function parseCsvTextToDataset(csvText: string, fileName: string): LoadedDataset {
  const lines = csvText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
  if (lines.length < 2) {
    throw new Error('CSV file must include a header row and at least 1 data row.');
  }
  const delimiter = lines[0].includes(';') && !lines[0].includes(',') ? ';' : ',';
  const splitRow = (line: string) =>
    line.split(delimiter).map((cell) => cell.replace(/^"|"$/g, '').trim());

  const headers = splitRow(lines[0]);
  const rawRows = lines.slice(1, 501).map(splitRow);
  const rows: (string | number)[][] = rawRows
    .filter((r) => r.length === headers.length)
    .map((r) =>
      r.map((val) => {
        if (val !== '' && !Number.isNaN(Number(val))) return Number(val);
        return val;
      })
    );

  if (rows.length === 0) {
    throw new Error('No valid data rows matched the CSV header column count.');
  }

  const { numericColumns, categoricalColumns } = inferColumnTypes(headers, rows);
  return {
    id: `csv-${Date.now()}`,
    name: fileName,
    source: 'user-csv',
    headers,
    rows,
    numericColumns,
    categoricalColumns,
    suggestedTarget: headers[headers.length - 1],
    note: `Parsed ${rows.length} rows and ${headers.length} columns from "${fileName}".`,
  };
}
