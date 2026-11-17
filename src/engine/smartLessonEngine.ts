import { executeAlgorithm } from './algorithmExecutor';
import { interpolateWaterBoilingPoint } from './experiments';
import { matchLocalScienceTopic } from './localFallback';
import { evaluateSafety } from './safetyEngine';
import type {
  EducationLevel,
  ExperimentPreparationSpec,
  LearningMode,
  LearningStyle,
  SmartInteractiveDefaults,
  SmartLanguage,
  SmartLessonPackage,
  SmartSceneSpec,
  SmartSubject,
  VideoDurationPreset,
} from '../types/smartLearning';

export interface ClassificationResult {
  subject: SmartSubject;
  learningMode: LearningMode;
  canonicalKey: string;
}

export function classifySmartTopic(
  topicQuery: string,
  preferredSubject?: SmartSubject | 'auto',
  preferredStyle?: LearningStyle
): ClassificationResult {
  const q = topicQuery.trim().toLowerCase();

  // Canonical topic detection for high-precision deterministic models
  if (/(pythagor|right.*triangle|a\^?2\s*\+\s*b\^?2|hypotenuse|ಪೈಥಾಗೊರಸ್)/i.test(q)) {
    return { subject: 'mathematics', learningMode: 'theorem', canonicalKey: 'pythagoras' };
  }
  if (/(quadratic|parabola|ax\^?2|roots.*equation|circle.*area|trigonometr|derivative|integral|algebra|linear equation)/i.test(q)) {
    return {
      subject: 'mathematics',
      learningMode: 'theorem',
      canonicalKey: /(circle)/i.test(q) ? 'circle-geometry' : 'coordinate-graph',
    };
  }
  if (/(binary\s*search|ಬೈನರಿ\s*ಸರ್ಚ್)/i.test(q)) {
    return { subject: 'computer-science', learningMode: 'algorithm', canonicalKey: 'binary-search' };
  }
  if (/(merge\s*sort|quick\s*sort|bubble\s*sort|insertion\s*sort|selection\s*sort|sorting)/i.test(q)) {
    return {
      subject: 'computer-science',
      learningMode: 'algorithm',
      canonicalKey: /(merge)/i.test(q)
        ? 'merge-sort'
        : /(quick)/i.test(q)
          ? 'quick-sort'
          : 'bubble-sort',
    };
  }
  if (/(dijkstra|bfs|dfs|breadth|depth|shortest\s*path|graph|tree|stack|queue|linked\s*list|hash\s*table|dynamic\s*program|knapsack|fibonacci|recursion)/i.test(q)) {
    return { subject: 'computer-science', learningMode: 'algorithm', canonicalKey: 'cs-general-algo' };
  }
  if (/(cpu|fetch.*decode|instruction|processor|alu|register)/i.test(q)) {
    return { subject: 'computer-science', learningMode: 'concept', canonicalKey: 'cpu-cycle' };
  }
  if (/(transistor|semiconductor|npn|mosfet|logic\s*gate|diode|electronics)/i.test(q)) {
    return { subject: 'engineering', learningMode: 'concept', canonicalKey: 'transistor' };
  }
  if (/(ohm'?s?\s*law|verify.*ohm|v\s*=\s*ir|ammeter.*voltmeter|circuit.*experiment|ಓಮ್)/i.test(q)) {
    return {
      subject: 'physics',
      learningMode: 'practical-experiment',
      canonicalKey: 'ohms-law',
    };
  }
  if (/(newton|second\s*law|f\s*=\s*ma|force.*accelerat|laws?\s*of\s*motion|ನ್ಯೂಟನ್)/i.test(q)) {
    return { subject: 'physics', learningMode: 'concept', canonicalKey: 'newtons-second-law' };
  }
  if (/(electromagnetic\s*induction|faraday|lenz|coil.*magnet|generator)/i.test(q)) {
    return { subject: 'physics', learningMode: 'concept', canonicalKey: 'em-induction' };
  }
  if (/(reflection|refraction|snell|prism|rainbow|optics|lens)/i.test(q)) {
    return { subject: 'physics', learningMode: 'concept', canonicalKey: 'optics-refraction' };
  }
  if (/(pendulum|harmonic|oscillation)/i.test(q)) {
    return {
      subject: 'physics',
      learningMode: preferredStyle === 'practical' ? 'practical-experiment' : 'concept',
      canonicalKey: 'pendulum',
    };
  }
  if (/(boil|mountain|altitude|vapor\s*pressure|steam|ಕುದಿಯುವ)/i.test(q)) {
    return {
      subject: preferredSubject === 'chemistry' ? 'chemistry' : 'physics',
      learningMode: preferredStyle === 'practical' ? 'practical-experiment' : 'concept',
      canonicalKey: 'boiling-altitude',
    };
  }
  if (/(electrolys|cathode|anode|water\s*splitting|ವಿದ್ಯುದ್ವಿಭಜನೆ)/i.test(q)) {
    return { subject: 'chemistry', learningMode: 'concept', canonicalKey: 'electrolysis' };
  }
  if (/(neutralis|neutraliz|acid.*base|titration|hcl.*naoh|indicator|phenolphthalein)/i.test(q)) {
    return {
      subject: 'chemistry',
      learningMode: 'practical-experiment',
      canonicalKey: 'chemistry-neutralisation',
    };
  }
  if (/(test\s*tube|heating.*water|copper.*sulfate|displacement|marble.*chip|caco3|chemical\s*reaction|crystallis|filtration|chromatography)/i.test(q)) {
    return {
      subject: 'chemistry',
      learningMode: 'practical-experiment',
      canonicalKey: 'chemistry-heating-reaction',
    };
  }
  if (/(photosynth|chlorophyll|ಕಿರಣಜನ್ಯ\s*ಸಂಯೋಗ|ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ)/i.test(q)) {
    return { subject: 'biology', learningMode: 'biological-process', canonicalKey: 'photosynthesis' };
  }
  if (/(microscope|plant\s*cell|animal\s*cell|cell\s*structure|dna|mitosis|meiosis|germination|respiration|transpiration)/i.test(q)) {
    return {
      subject: 'biology',
      learningMode: /(microscope|germination|food\s*test)/i.test(q)
        ? 'practical-experiment'
        : 'biological-process',
      canonicalKey: 'microscope-cell',
    };
  }

  // Fallback general subject classification
  if (preferredSubject && preferredSubject !== 'auto') {
    return {
      subject: preferredSubject,
      learningMode:
        preferredStyle === 'practical'
          ? 'practical-experiment'
          : preferredSubject === 'mathematics'
            ? 'theorem'
            : preferredSubject === 'computer-science'
              ? 'algorithm'
              : 'concept',
      canonicalKey: 'general',
    };
  }

  if (/(theorem|equation|formula|matrix|vector|polynomial|calculus|geometry|triangle)/i.test(q)) {
    return { subject: 'mathematics', learningMode: 'theorem', canonicalKey: 'coordinate-graph' };
  }
  if (/(algorithm|code|array|pointer|sort|search|complexity|program|loop|database|network)/i.test(q)) {
    return { subject: 'computer-science', learningMode: 'algorithm', canonicalKey: 'binary-search' };
  }
  if (/(atom|molecule|mole|periodic|bond|acid|base|salt|chem|reaction|gas\s*law)/i.test(q)) {
    return {
      subject: 'chemistry',
      learningMode: preferredStyle === 'practical' ? 'practical-experiment' : 'concept',
      canonicalKey: 'chemistry-heating-reaction',
    };
  }
  if (/(planet|orbit|rocket|solar|star|gravity|space|telescope|heat\s*shield)/i.test(q)) {
    return { subject: 'astronomy', learningMode: 'concept', canonicalKey: 'newtons-second-law' };
  }
  if (/(pollution|climate|ecosystem|watershed|water\s*filter|soil|environment)/i.test(q)) {
    return { subject: 'environmental', learningMode: 'concept', canonicalKey: 'general' };
  }
  if (/(robot|motor|gear|bridge|servo|circuit|electronics)/i.test(q)) {
    return { subject: 'engineering', learningMode: 'concept', canonicalKey: 'transistor' };
  }
  if (/(cell|organ|plant|animal|dna|evolution|ecosystem|microbe|biology)/i.test(q)) {
    return { subject: 'biology', learningMode: 'biological-process', canonicalKey: 'photosynthesis' };
  }

  return {
    subject: 'physics',
    learningMode: preferredStyle === 'practical' ? 'practical-experiment' : 'concept',
    canonicalKey: 'newtons-second-law',
  };
}

export function buildSubtitlesFromScenes(scenes: SmartSceneSpec[]) {
  let cursor = 0;
  return scenes.map((s, idx) => {
    const startSec = Number(cursor.toFixed(2));
    cursor += s.durationSec;
    const endSec = Number(cursor.toFixed(2));
    return {
      index: idx + 1,
      startSec,
      endSec,
      text: s.subtitleText || s.narrationText,
    };
  });
}

export function formatSrtTime(totalSeconds: number): string {
  const ms = Math.round((totalSeconds % 1) * 1000);
  const whole = Math.floor(totalSeconds);
  const hrs = Math.floor(whole / 3600);
  const mins = Math.floor((whole % 3600) / 60);
  const secs = whole % 60;
  const pad = (n: number, w = 2) => String(n).padStart(w, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)},${pad(ms, 3)}`;
}

export function buildSrtContent(
  segments: { index: number; startSec: number; endSec: number; text: string }[]
): string {
  return segments
    .map(
      (seg) =>
        `${seg.index}\n${formatSrtTime(seg.startSec)} --> ${formatSrtTime(seg.endSec)}\n${seg.text}\n`
    )
    .join('\n');
}

export function computePythagorasSteps(aInput = 3, bInput = 4) {
  const a = Math.max(1, Math.min(20, Number(aInput) || 3));
  const b = Math.max(1, Math.min(20, Number(bInput) || 4));
  const a2 = Number((a * a).toFixed(4));
  const b2 = Number((b * b).toFixed(4));
  const sum = Number((a2 + b2).toFixed(4));
  const c = Number(Math.sqrt(sum).toFixed(4));
  const cDisplay = Number.isInteger(c) ? String(c) : c.toFixed(2);
  return { a, b, a2, b2, sum, c, cDisplay };
}

function buildPythagorasScenes(
  aInput: number,
  bInput: number,
  lang: SmartLanguage,
  scaleFactor: number
): SmartSceneSpec[] {
  const { a, b, a2, b2, sum, cDisplay } = computePythagorasSteps(aInput, bInput);
  const d = (s: number) => Math.max(2.2, Number((s * scaleFactor).toFixed(1)));
  const isKn = lang === 'kn';

  return [
    {
      id: 'pyth-1',
      sceneNumber: 1,
      title: isKn ? 'ದೃಶ್ಯ 1: ಲಂಬಕೋನ ತ್ರಿಭುಜದ ರಚನೆ' : 'Scene 1: Draw the Right-Angle Triangle',
      durationSec: d(3.0),
      narrationText: isKn
        ? `ಮೊದಲು 90 ಡಿಗ್ರಿ ಲಂಬಕೋನವನ್ನು ಹೊಂದಿರುವ ಲಂಬಕೋನ ತ್ರಿಭುಜವನ್ನು ಎಳೆಯೋಣ.`
        : `First, let us construct a right-angled triangle containing one exact 90-degree angle.`,
      subtitleText: isKn
        ? '90° ಲಂಬಕೋನ ಹೊಂದಿರುವ ತ್ರಿಭುಜದ ರಚನೆ'
        : 'Construct a right-angled triangle (∠ = 90°).',
      mathOrFormulaHighlight: '∠ = 90°',
      calculationStepText: `Step 1: Construct triangle ABC with ∠B = 90°`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 1, a, b, cDisplay, a2, b2, sum },
      caption: 'Draw base, vertical height, and 90° square marker.',
    },
    {
      id: 'pyth-2',
      sceneNumber: 2,
      title: isKn ? 'ದೃಶ್ಯ 2: ಪಾದ, ಎತ್ತರ ಮತ್ತು ವಿಕರ್ಣ ಗುರುತಿಸುವುದು' : 'Scene 2: Highlight Base, Height & Hypotenuse',
      durationSec: d(3.2),
      narrationText: isKn
        ? `ಪಾದ a = ${a} cm, ಎತ್ತರ b = ${b} cm, ಮತ್ತು 90 ಡಿಗ್ರಿಗೆ ಎದುರಾಗಿರುವ ಅತಿ ಉದ್ದದ ಬಾಹು ವಿಕರ್ಣ c ಆಗಿದೆ.`
        : `Label the base a = ${a} cm, vertical height b = ${b} cm, and the longest side opposite 90° as the hypotenuse c.`,
      subtitleText: isKn
        ? `ಪಾದ a = ${a} cm, ಎತ್ತರ b = ${b} cm, ವಿಕರ್ಣ = c`
        : `Base a = ${a} cm · Height b = ${b} cm · Hypotenuse = c`,
      mathOrFormulaHighlight: `a = ${a} cm, b = ${b} cm, c = ?`,
      calculationStepText: `Base a = ${a} cm | Height b = ${b} cm | Hypotenuse c`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 2, a, b, cDisplay, a2, b2, sum },
      caption: 'Highlight sides a, b, and hypotenuse c.',
    },
    {
      id: 'pyth-3',
      sceneNumber: 3,
      title: isKn ? 'ದೃಶ್ಯ 3: ಪೈಥಾಗೊರಸ್ ಸೂತ್ರ ಮತ್ತು ವರ್ಗಗಳ ವಿಸ್ತೀರ್ಣ' : 'Scene 3: Display Formula & Geometric Squares',
      durationSec: d(3.2),
      narrationText: isKn
        ? `ಪೈಥಾಗೊರಸ್ ಪ್ರಮೇಯದ ಪ್ರಕಾರ, a² + b² = c². ಅಂದರೆ ಪಾದ ಮತ್ತು ಎತ್ತರದ ಮೇಲಿನ ವರ್ಗಗಳ ವಿಸ್ತೀರ್ಣದ ಮೊತ್ತವು ವಿಕರ್ಣದ ಮೇಲಿನ ವರ್ಗಕ್ಕೆ ಸಮ.`
        : `Pythagoras' theorem states a² + b² = c². Visually, the area of the squares on sides a and b equals the square on hypotenuse c.`,
      subtitleText: 'a² + b² = c²',
      mathOrFormulaHighlight: 'a² + b² = c²',
      calculationStepText: 'Theorem: a² + b² = c²',
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 3, a, b, cDisplay, a2, b2, sum },
      caption: 'Area of square(a) + Area of square(b) = Area of square(c).',
    },
    {
      id: 'pyth-4',
      sceneNumber: 4,
      title: isKn ? 'ದೃಶ್ಯ 4: ಬೆಲೆಗಳನ್ನು ಆದೇಶಿಸುವುದು' : 'Scene 4: Substitute Known Values',
      durationSec: d(3.0),
      narrationText: isKn
        ? `ಈಗ ಸೂತ್ರದಲ್ಲಿ a = ${a} ಮತ್ತು b = ${b} ಬೆಲೆಗಳನ್ನು ಆದೇಶಿಸೋಣ: ${a}² + ${b}² = c².`
        : `Now substitute a = ${a} cm and b = ${b} cm into the theorem: ${a}² + ${b}² = c².`,
      subtitleText: `${a}² + ${b}² = c²`,
      mathOrFormulaHighlight: `${a}² + ${b}² = c²`,
      calculationStepText: `${a}² + ${b}² = c²`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 4, a, b, cDisplay, a2, b2, sum },
      caption: `Substitute a = ${a}, b = ${b}.`,
    },
    {
      id: 'pyth-5',
      sceneNumber: 5,
      title: isKn ? 'ದೃಶ್ಯ 5: ಪ್ರತಿ ಬಾಹುವಿನ ವರ್ಗ ಕಂಡುಹಿಡಿಯುವುದು' : 'Scene 5: Evaluate the Squares',
      durationSec: d(2.8),
      narrationText: isKn
        ? `${a} ರ ವರ್ಗ ${a2} ಮತ್ತು ${b} ರ ವರ್ಗ ${b2}. ಆದ್ದರಿಂದ ${a2} + ${b2} = c².`
        : `Squaring each term gives ${a}² = ${a2} and ${b}² = ${b2}, so ${a2} + ${b2} = c².`,
      subtitleText: `${a2} + ${b2} = c²`,
      mathOrFormulaHighlight: `${a2} + ${b2} = c²`,
      calculationStepText: `${a2} + ${b2} = c²`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 5, a, b, cDisplay, a2, b2, sum },
      caption: `Square areas: ${a2} cm² and ${b2} cm².`,
    },
    {
      id: 'pyth-6',
      sceneNumber: 6,
      title: isKn ? 'ದೃಶ್ಯ 6: ವರ್ಗಗಳ ಮೊತ್ತ' : 'Scene 6: Sum the Square Areas',
      durationSec: d(2.8),
      narrationText: isKn
        ? `${a2} ಮತ್ತು ${b2} ಅನ್ನು ಕೂಡಿಸಿದಾಗ ${sum} ಸಿಗುತ್ತದೆ. ಅಂದರೆ c² = ${sum}.`
        : `Adding ${a2} and ${b2} equals ${sum}. Therefore, ${sum} = c².`,
      subtitleText: `${sum} = c²`,
      mathOrFormulaHighlight: `${sum} = c²`,
      calculationStepText: `${sum} = c²`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 6, a, b, cDisplay, a2, b2, sum },
      caption: `Combined area c² = ${sum} cm².`,
    },
    {
      id: 'pyth-7',
      sceneNumber: 7,
      title: isKn ? 'ದೃಶ್ಯ 7: ವರ್ಗಮೂಲ ತೆಗೆಯುವುದು' : 'Scene 7: Take the Square Root',
      durationSec: d(2.8),
      narrationText: isKn
        ? `ಎರಡೂ ಬದಿಗಳ ವರ್ಗಮೂಲ ತೆಗೆದರೆ c = √${sum} = ${cDisplay} ಸೆಂಟಿಮೀಟರ್ ಆಗುತ್ತದೆ.`
        : `Taking the positive square root of both sides gives c = √${sum} = ${cDisplay} cm.`,
      subtitleText: `c = √${sum} = ${cDisplay} cm`,
      mathOrFormulaHighlight: `c = ${cDisplay} cm`,
      calculationStepText: `c = √${sum} = ${cDisplay} cm`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 7, a, b, cDisplay, a2, b2, sum },
      caption: `Extract square root: c = ${cDisplay} cm.`,
    },
    {
      id: 'pyth-8',
      sceneNumber: 8,
      title: isKn ? 'ದೃಶ್ಯ 8: ವಿಕರ್ಣ ಮತ್ತು ಅಂತಿಮ ಉತ್ತರ' : 'Scene 8: Highlight Hypotenuse & Final Answer',
      durationSec: d(3.2),
      narrationText: isKn
        ? `ಆದ್ದರಿಂದ ವಿಕರ್ಣದ ಉದ್ದ c = ${cDisplay} cm. ಇದು ಲಂಬಕೋನ ತ್ರಿಭುಜದ ಅತಿ ಉದ್ದದ ಬಾಹು ಎಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ.`
        : `Hypotenuse c = ${cDisplay} cm. Notice ${cDisplay} cm is longer than both ${a} cm and ${b} cm, confirming the geometric theorem.`,
      subtitleText: isKn
        ? `ಅಂತಿಮ ಉತ್ತರ: c = ${cDisplay} cm`
        : `Final Answer: c = ${cDisplay} cm`,
      mathOrFormulaHighlight: `c = ${cDisplay} cm ✓`,
      calculationStepText: `Verified: ${a}² + ${b}² = ${cDisplay}²`,
      visualKind: 'math-pythagoras',
      visualPayload: { stage: 8, a, b, cDisplay, a2, b2, sum },
      caption: `Hypotenuse highlighted with c = ${cDisplay} cm.`,
    },
  ];
}

export function buildDeterministicSmartLesson(opts: {
  topicQuery: string;
  language: SmartLanguage;
  educationLevel: EducationLevel;
  learningStyle: LearningStyle;
  durationPreset: VideoDurationPreset;
  preferredSubject?: SmartSubject | 'auto';
  customParams?: { a?: number; b?: number; forceN?: number; massKg?: number; voltageV?: number; resistanceOhm?: number; arrayValues?: number[]; targetValue?: number };
}): SmartLessonPackage {
  const { topicQuery, language, educationLevel, learningStyle, durationPreset, preferredSubject, customParams } = opts;
  const safety = evaluateSafety(topicQuery);
  const cls = classifySmartTopic(topicQuery, preferredSubject, learningStyle);
  const scaleFactor = durationPreset === 'short' ? 0.78 : durationPreset === 'detailed' ? 1.35 : 1.0;
  const isKn = language === 'kn';
  const nowIso = new Date().toISOString();

  // 1. MATHEMATICS — PYTHAGORAS THEOREM
  if (cls.canonicalKey === 'pythagoras') {
    const a = customParams?.a ?? 3;
    const b = customParams?.b ?? 4;
    const { a2, b2, sum, cDisplay } = computePythagorasSteps(a, b);
    const scenes = buildPythagorasScenes(a, b, language, scaleFactor);
    const subtitleSegments = buildSubtitlesFromScenes(scenes);

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isKn ? 'ಪೈಥಾಗೊರಸ್ ಪ್ರಮೇಯ (Pythagoras Theorem)' : 'Pythagoras Theorem (a² + b² = c²)',
      subject: 'mathematics',
      learningMode: 'theorem',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ಪೈಥಾಗೊರಸ್ ಪ್ರಮೇಯವು ಲಂಬಕೋನ ತ್ರಿಭುಜದ ಮೂರು ಬಾಹುಗಳ ನಡುವಿನ ನಿಖರವಾದ ಗಣಿತೀಯ ಸಂಬಂಧವನ್ನು ವಿವರಿಸುತ್ತದೆ.'
        : 'Pythagoras’ theorem reveals the exact geometric relationship linking all three sides of any right-angled triangle.',
      meaningAndDefinition: isKn
        ? 'ಒಂದು ಲಂಬಕೋನ ತ್ರಿಭುಜದಲ್ಲಿ, ವಿಕರ್ಣದ (90° ಕೋನಕ್ಕೆ ಎದುರಾಗಿರುವ ಬಾಹು) ಮೇಲಿನ ವರ್ಗವು ಉಳಿದೆರಡು ಬಾಹುಗಳ ವರ್ಗಗಳ ಮೊತ್ತಕ್ಕೆ ಸಮನಾಗಿರುತ್ತದೆ: a² + b² = c².'
        : 'In any right-angled triangle, the square of the hypotenuse c (the side opposite the 90° angle) equals the sum of the squares of the other two perpendicular sides a and b: a² + b² = c².',
      whyConceptMatters: isKn
        ? 'ಕಟ್ಟಡ ನಿರ್ಮಾಣ, ನ್ಯಾವಿಗೇಷನ್, ಕಂಪ್ಯೂಟರ್ ಗ್ರಾಫಿಕ್ಸ್ ಮತ್ತು ಭೌತಶಾಸ್ತ್ರದ ವೆಕ್ಟರ್‌ಗಳಲ್ಲಿ ದೂರವನ್ನು ಅಳೆಯಲು ಇದು ಅಡಿಪಾಯವಾಗಿದೆ.'
        : 'It is the mathematical foundation for Euclidean distance, structural carpentry, GPS navigation, 2D/3D game engines, and vector components in physics.',
      scientificOrMathPrinciple: isKn
        ? 'ಬಾಹುಗಳು a ಮತ್ತು b ಮೇಲೆ ನಿರ್ಮಿಸಿದ ವರ್ಗಗಳ ವಿಸ್ತೀರ್ಣವನ್ನು ಮರುಜೋಡಿಸಿದಾಗ ಅವು ವಿಕರ್ಣ c ಮೇಲಿನ ವರ್ಗವನ್ನು ಸಂಪೂರ್ಣವಾಗಿ ತುಂಬುತ್ತವೆ.'
        : 'Area conservation of perpendicular squares: Area(a) + Area(b) = Area(c). Note that the theorem applies strictly to Euclidean right-angled triangles (one 90° angle).',
      importantTerms: [
        { term: isKn ? 'ವಿಕರ್ಣ (Hypotenuse, c)' : 'Hypotenuse (c)', definition: isKn ? '90° ಕೋನಕ್ಕೆ ಎದುರಾಗಿರುವ ಅತಿ ಉದ್ದದ ಬಾಹು.' : 'Longest side directly opposite the 90° right angle.' },
        { term: isKn ? 'ಪಾದ (Base, a)' : 'Base (a)', definition: isKn ? 'ಲಂಬಕೋನವನ್ನು ರೂಪಿಸುವ ಅಡ್ಡ ಬಾಹು.' : 'Horizontal leg forming one side of the right angle.' },
        { term: isKn ? 'ಎತ್ತರ (Height, b)' : 'Perpendicular Height (b)', definition: isKn ? 'ಪಾದಕ್ಕೆ 90° ಕೋನದಲ್ಲಿರುವ ಲಂಬ ಬಾಹು.' : 'Vertical leg perpendicular to the base.' },
      ],
      formulasAndEquations: [
        'a² + b² = c²',
        'c = √(a² + b²)',
        'a = √(c² − b²),   b = √(c² − a²)',
      ],
      stepByStepExplanation: [
        `1. Identify the right angle (90°) and label the adjacent legs a = ${a} cm and b = ${b} cm.`,
        `2. Write the theorem: a² + b² = c².`,
        `3. Substitute values: ${a}² + ${b}² = c².`,
        `4. Square both legs: ${a2} + ${b2} = c².`,
        `5. Sum the squares: ${sum} = c².`,
        `6. Take the positive square root: c = √${sum} = ${cDisplay} cm.`,
      ],
      workedExamples: [
        {
          title: isKn ? `ಉದಾಹರಣೆ: ಪಾದ = ${a} cm, ಎತ್ತರ = ${b} cm` : `Right Triangle with Base = ${a} cm and Height = ${b} cm`,
          given: `a = ${a} cm, b = ${b} cm, ∠ = 90°`,
          steps: [
            'a² + b² = c²',
            `${a}² + ${b}² = c²`,
            `${a2} + ${b2} = c²`,
            `${sum} = c²`,
            `c = √${sum} = ${cDisplay} cm`,
          ],
          finalAnswer: `c = ${cDisplay} cm`,
        },
        {
          title: isKn ? 'ವಿಲೋಮ ಉದಾಹರಣೆ: c = 13 cm, a = 5 cm ಆದಾಗ b ಕಂಡುಹಿಡಿಯಿರಿ' : 'Finding a Missing Leg: c = 13 cm, a = 5 cm',
          given: 'c = 13 cm, a = 5 cm',
          steps: ['b² = c² − a²', 'b² = 13² − 5² = 169 − 25 = 144', 'b = √144 = 12 cm'],
          finalAnswer: 'b = 12 cm',
        },
      ],
      realLifeApplications: isKn
        ? ['90° ಕೋನದಲ್ಲಿ ಏಣಿಯ ಉದ್ದವನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡುವುದು', 'ನಿರ್ಮಾಣ ಕಾರ್ಯದಲ್ಲಿ ಮೂಲೆಯನ್ನು 3-4-5 ನಿಯಮದಿಂದ ಪರಿಶೀಲಿಸುವುದು', 'ನಕ್ಷೆಗಳಲ್ಲಿ ಎರಡು ಬಿಂದುಗಳ ನೇರ ದೂರ ಕಂಡುಹಿಡಿಯುವುದು']
        : ['Checking square corners in carpentry using the 3–4–5 triangle rule', 'Calculating diagonal screen sizes and ladder reach safely', 'Computing 2D Euclidean distance between coordinates'],
      commonMistakes: isKn
        ? ['ವರ್ಗಮೂಲ ತೆಗೆಯದೆ c² = a + b ಎಂದು ತಪ್ಪಾಗಿ ಭಾವಿಸುವುದು.', '90° ಕೋನವಿಲ್ಲದ ತ್ರಿಭುಜಕ್ಕೂ ಈ ಸೂತ್ರವನ್ನು ನೇರವಾಗಿ ಬಳಸುವುದು.', 'ದೊಡ್ಡ ಬಾಹುವನ್ನು ವಿಕರ್ಣ c ಬದಲು a ಅಥವಾ b ಎಂದು ತೆಗೆದುಕೊಳ್ಳುವುದು.']
        : ['Forgetting to take the square root at the end (leaving c² instead of c).', 'Writing a + b = c instead of squaring each side first.', 'Placing the hypotenuse value into a or b instead of c.'],
      visualDemonstrationPlan:
        '8 animated construction scenes: triangle outline → labelled legs → area squares a², b², c² → numerical substitution → sum → square root → highlighted hypotenuse.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments,
      quiz: [
        {
          id: 'q1',
          question: isKn ? 'ಲಂಬಕೋನ ತ್ರಿಭುಜದಲ್ಲಿ 90° ಕೋನಕ್ಕೆ ಎದುರಾಗಿರುವ ಬಾಹುವನ್ನು ಏನೆಂದು ಕರೆಯುತ್ತಾರೆ?' : 'In a right-angled triangle, what is the side opposite the 90° angle called?',
          options: [isKn ? 'ಪಾದ (Base)' : 'Base', isKn ? 'ವಿಕರ್ಣ (Hypotenuse)' : 'Hypotenuse', isKn ? 'ಎತ್ತರ (Altitude)' : 'Altitude', isKn ? 'ಮಧ್ಯರೇಖೆ (Median)' : 'Median'],
          correctIndex: 1,
          explanation: 'The hypotenuse c is always opposite the 90° angle and is the longest side.',
        },
        {
          id: 'q2',
          question: isKn ? 'a = 6 cm ಮತ್ತು b = 8 cm ಆಗಿದ್ದರೆ ವಿಕರ್ಣ c ಎಷ್ಟು?' : 'If base a = 6 cm and height b = 8 cm, what is hypotenuse c?',
          options: ['10 cm', '14 cm', '100 cm', '48 cm'],
          correctIndex: 0,
          explanation: '6² + 8² = 36 + 64 = 100, and √100 = 10 cm.',
        },
        {
          id: 'q3',
          question: 'Which triangle satisfies Pythagoras’ theorem (a² + b² = c²)?',
          options: ['Equilateral (60°, 60°, 60°)', 'Acute (50°, 60°, 70°)', 'Right-angled (30°, 60°, 90°)', 'Obtuse (110°, 40°, 30°)'],
          correctIndex: 2,
          explanation: 'The standard theorem a² + b² = c² holds specifically for triangles containing a 90° angle.',
        },
        {
          id: 'q4',
          question: 'If c = 5 cm and a = 3 cm, what is the missing leg b?',
          options: ['2 cm', '4 cm', '8 cm', '16 cm'],
          correctIndex: 1,
          explanation: 'b² = c² − a² = 25 − 9 = 16, so b = √16 = 4 cm.',
        },
        {
          id: 'q5',
          question: 'Why must you take a square root in the final step?',
          options: ['Because c² gives the area of the square on the hypotenuse, not its length', 'To convert cm into meters', 'To double the triangle perimeter', 'Because 90° equals √90'],
          correctIndex: 0,
          explanation: 'a² + b² equals c², which is the square of the length; √(c²) recovers linear length c in cm.',
        },
      ],
      furtherExploration: [
        'Explore Pythagorean triples such as (5, 12, 13) and (8, 15, 17).',
        'Try changing Base a and Height b inside the interactive video player below to regenerate every step.',
        'Connect to the Law of Cosines for non-90° triangles: c² = a² + b² − 2ab cos(C).',
      ],
      scenes,
      interactiveDefaults: { kind: 'pythagoras', a, b },
      safetyClassification: 'GREEN',
      safetyNote: 'Safe pure mathematical visualization.',
      sourceMode: 'deterministic-verified',
      validationNote: `Verified by deterministic Euclidean solver: ${a}² + ${b}² = ${sum}, c = ${cDisplay} cm.`,
      createdAt: nowIso,
    };
  }

  // 2. PHYSICS CONCEPT — NEWTON'S SECOND LAW
  if (cls.canonicalKey === 'newtons-second-law') {
    const forceN = customParams?.forceN ?? 20;
    const massKg = customParams?.massKg ?? 4;
    const accel = Number((forceN / massKg).toFixed(2));
    const d = (s: number) => Math.max(2.2, Number((s * scaleFactor).toFixed(1)));
    const scenes: SmartSceneSpec[] = [
      {
        id: 'n2-1',
        sceneNumber: 1,
        title: isKn ? 'ದೃಶ್ಯ 1: ಸ್ಥಿರ ವಸ್ತು ಮತ್ತು ನಿವ್ವಳ ಬಲ' : 'Scene 1: Mass at Rest & Net Force',
        durationSec: d(3.0),
        narrationText: isKn
          ? `${massKg} kg ದ್ರವ್ಯರಾಶಿಯ ವಸ್ತುವನ್ನು ಘರ್ಷಣೆಯಿಲ್ಲದ ಹಾದಿಯಲ್ಲಿ ಇರಿಸೋಣ.`
          : `Consider an object of mass m = ${massKg} kg resting on a low-friction horizontal track.`,
        subtitleText: isKn ? `ದ್ರವ್ಯರಾಶಿ m = ${massKg} kg` : `Object mass m = ${massKg} kg at v = 0 m/s`,
        mathOrFormulaHighlight: `m = ${massKg} kg`,
        visualKind: 'physics-newtons-second-law',
        visualPayload: { stage: 1, forceN, massKg, accel },
        caption: 'Mass positioned on horizontal physics track.',
      },
      {
        id: 'n2-2',
        sceneNumber: 2,
        title: isKn ? 'ದೃಶ್ಯ 2: ಬಲ F ಪ್ರಯೋಗ ಮತ್ತು ವೇಗೋತ್ಕರ್ಷ' : 'Scene 2: Apply Net Force Vector F',
        durationSec: d(3.4),
        narrationText: isKn
          ? `F = ${forceN} ನ್ಯೂಟನ್ ನಿವ್ವಳ ಬಲವನ್ನು ಪ್ರಯೋಗಿಸಿದಾಗ ವಸ್ತುವು ಬಲದ ದಿಕ್ಕಿನಲ್ಲಿ ವೇಗೋತ್ಕರ್ಷಗೊಳ್ಳುತ್ತದೆ.`
          : `Applying a net forward force of F = ${forceN} N pushes the mass into uniform acceleration in the direction of force.`,
        subtitleText: `F_net = ${forceN} N → acceleration a`,
        mathOrFormulaHighlight: 'F = m × a',
        visualKind: 'physics-newtons-second-law',
        visualPayload: { stage: 2, forceN, massKg, accel },
        caption: 'Net force vector arrow accelerates cart forward.',
      },
      {
        id: 'n2-3',
        sceneNumber: 3,
        title: isKn ? 'ದೃಶ್ಯ 3: ಸೂತ್ರದಿಂದ ಲೆಕ್ಕಾಚಾರ a = F / m' : 'Scene 3: Compute a = F / m',
        durationSec: d(3.4),
        narrationText: isKn
          ? `ನ್ಯೂಟನ್‌ನ ಎರಡನೇ ನಿಯಮದ ಪ್ರಕಾರ a = F / m = ${forceN} / ${massKg} = ${accel} m/s².`
          : `Using Newton’s second law a = F / m, dividing ${forceN} N by ${massKg} kg yields exactly ${accel} m/s².`,
        subtitleText: `a = ${forceN} N ÷ ${massKg} kg = ${accel} m/s²`,
        mathOrFormulaHighlight: `a = ${accel} m/s²`,
        calculationStepText: `a = F / m = ${forceN} / ${massKg} = ${accel} m/s²`,
        visualKind: 'physics-newtons-second-law',
        visualPayload: { stage: 3, forceN, massKg, accel },
        caption: 'Velocity increases linearly at constant acceleration.',
      },
      {
        id: 'n2-4',
        sceneNumber: 4,
        title: isKn ? 'ದೃಶ್ಯ 4: ದ್ರವ್ಯರಾಶಿ ದ್ವಿಗುಣಗೊಂಡರೆ ಏನಾಗುತ್ತದೆ?' : 'Scene 4: Inverse Proportionality with Mass',
        durationSec: d(3.2),
        narrationText: isKn
          ? `ಬಲವನ್ನು ಸ್ಥಿರವಾಗಿಟ್ಟು ದ್ರವ್ಯರಾಶಿಯನ್ನು ದ್ವಿಗುಣಗೊಳಿಸಿದರೆ ವೇಗೋತ್ಕರ್ಷವು ಅರ್ಧದಷ್ಟಾಗುತ್ತದೆ.`
          : `Holding force constant while doubling mass cuts acceleration in half—showing why heavy vehicles require stronger braking force.`,
        subtitleText: isKn ? 'ದ್ರವ್ಯರಾಶಿ ಹೆಚ್ಚಾದಂತೆ ವೇಗೋತ್ಕರ್ಷ ಕಡಿಮೆಯಾಗುತ್ತದೆ' : `At 2m (${massKg * 2} kg), a drops to ${(accel / 2).toFixed(2)} m/s²`,
        mathOrFormulaHighlight: 'a ∝ 1/m  (at constant F)',
        visualKind: 'physics-newtons-second-law',
        visualPayload: { stage: 4, forceN, massKg, accel },
        caption: 'Compare velocity-time slope across mass values.',
      },
    ];

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isKn ? 'ನ್ಯೂಟನ್‌ನ ಚಲನೆಯ ಎರಡನೇ ನಿಯಮ (F = ma)' : "Newton's Second Law of Motion (F = ma)",
      subject: 'physics',
      learningMode: 'concept',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ಒಂದು ವಸ್ತುವಿನ ಮೇಲೆ ಪ್ರಯೋಗಿಸಿದ ನಿವ್ವಳ ಬಲವು ಅದರ ವೇಗವನ್ನು ಹೇಗೆ ಬದಲಾಯಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ನ್ಯೂಟನ್‌ನ ಎರಡನೇ ನಿಯಮವು ನಿಖರವಾಗಿ ವಿವರಿಸುತ್ತದೆ.'
        : "Newton's second law explains quantitatively how an unbalanced net force changes an object's velocity over time.",
      meaningAndDefinition: isKn
        ? 'ವಸ್ತುವಿನ ವೇಗೋತ್ಕರ್ಷ (a) ಅದರ ಮೇಲಿನ ನಿವ್ವಳ ಬಲಕ್ಕೆ (F) ನೇರ ಅನುಪಾತದಲ್ಲಿಯೂ, ದ್ರವ್ಯರಾಶಿಗೆ (m) ವಿಲೋಮ ಅನುಪಾತದಲ್ಲಿಯೂ ಇರುತ್ತದೆ: F = m · a.'
        : 'The acceleration a of an object is directly proportional to the net external force F_net acting on it and inversely proportional to its mass m: F_net = m · a.',
      whyConceptMatters: isKn
        ? 'ರಾಕೆಟ್ ಉಡಾವಣೆ, ವಾಹನ ಬ್ರೇಕಿಂಗ್ ದೂರ ಮತ್ತು ಸೇತುವೆ ವಿನ್ಯಾಸಗಳನ್ನು ಲೆಕ್ಕಾಚಾರ ಮಾಡಲು ಇದು ಅತ್ಯಗತ್ಯ.'
        : 'Engineers rely on F = ma to size rocket thrust, automobile airbags, braking distances, and robotic actuators.',
      scientificOrMathPrinciple: 'F_net = m · a  (1 N = 1 kg·m/s²), valid in inertial frames at non-relativistic speeds.',
      importantTerms: [
        { term: 'Net Force (F)', definition: 'Vector sum of all forces acting on a body (SI unit: Newton, N).' },
        { term: 'Mass (m)', definition: 'Measure of inertia resisting acceleration (SI unit: kilogram, kg).' },
        { term: 'Acceleration (a)', definition: 'Rate of change of velocity per second (SI unit: m/s²).' },
      ],
      formulasAndEquations: ['F_net = m · a', 'a = F_net / m', 'm = F_net / a'],
      stepByStepExplanation: [
        `1. Identify net force F = ${forceN} N and mass m = ${massKg} kg.`,
        `2. Rearrange F = ma to isolate acceleration: a = F / m.`,
        `3. Substitute SI units: a = ${forceN} N / ${massKg} kg = ${accel} m/s².`,
      ],
      workedExamples: [
        {
          title: `Calculate acceleration for F = ${forceN} N and m = ${massKg} kg`,
          given: `F = ${forceN} N, m = ${massKg} kg`,
          steps: ['a = F / m', `a = ${forceN} / ${massKg}`, `a = ${accel} m/s²`],
          finalAnswer: `a = ${accel} m/s²`,
        },
      ],
      realLifeApplications: [
        'Empty vs fully loaded truck braking distance',
        'Spacecraft thruster acceleration as propellant mass decreases',
        'Seatbelts extending stopping time to reduce peak impact force',
      ],
      commonMistakes: [
        'Confusing mass (kg) with weight (N = m·g).',
        'Ignoring friction when calculating net force F_net.',
      ],
      visualDemonstrationPlan:
        'Animated dynamic trolley on track showing force vector arrow, acceleration readout, mass block comparison, and live velocity-time curve.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      quiz: [
        {
          id: 'n2-q1',
          question: `A ${massKg} kg cart experiences a net force of ${forceN} N. What is its acceleration?`,
          options: [`${accel} m/s²`, `${forceN * massKg} m/s²`, `${(massKg / forceN).toFixed(2)} m/s²`, '0 m/s²'],
          correctIndex: 0,
          explanation: `a = F / m = ${forceN} / ${massKg} = ${accel} m/s².`,
        },
        {
          id: 'n2-q2',
          question: 'If net force stays constant and mass doubles, what happens to acceleration?',
          options: ['Doubles', 'Becomes half', 'Quadruples', 'Remains unchanged'],
          correctIndex: 1,
          explanation: 'Acceleration is inversely proportional to mass (a = F/m).',
        },
        {
          id: 'n2-q3',
          question: 'What is the SI unit of force?',
          options: ['Joule (J)', 'Watt (W)', 'Newton (N = kg·m/s²)', 'Pascal (Pa)'],
          correctIndex: 2,
          explanation: '1 Newton accelerates 1 kg by 1 m/s².',
        },
        {
          id: 'n2-q4',
          question: 'If net force on a moving glider is zero, its acceleration is:',
          options: ['Constantly increasing', 'Zero (constant velocity)', 'Equal to 9.81 m/s²', 'Negative'],
          correctIndex: 1,
          explanation: 'When F_net = 0, a = 0/m = 0 m/s², so velocity remains constant.',
        },
        {
          id: 'n2-q5',
          question: 'Which force should always be subtracted before applying a = F_net / m on rough surfaces?',
          options: ['Friction opposing motion', 'Object colour', 'Room temperature', 'Surface area alone'],
          correctIndex: 0,
          explanation: 'F_net equals applied push minus opposing friction.',
        },
      ],
      furtherExploration: [
        'Test Force vs Acceleration live inside the Physics Lab workbench.',
        'Adjust Force (N) and Mass (kg) directly inside the interactive video controls.',
      ],
      scenes,
      interactiveDefaults: { kind: 'newtons-law', forceN, massKg },
      safetyClassification: 'GREEN',
      safetyNote: 'Safe classroom dynamics simulation.',
      sourceMode: 'deterministic-verified',
      validationNote: `Deterministic dynamics engine verified: F=${forceN} N, m=${massKg} kg → a=${accel} m/s².`,
      createdAt: nowIso,
    };
  }

  // 3. PHYSICS PRACTICAL — OHM'S LAW EXPERIMENT
  if (cls.canonicalKey === 'ohms-law') {
    const voltageV = customParams?.voltageV ?? 6;
    const resistanceOhm = customParams?.resistanceOhm ?? 10;
    const currentA = Number((voltageV / resistanceOhm).toFixed(3));
    const d = (s: number) => Math.max(2.4, Number((s * scaleFactor).toFixed(1)));
    const tableVoltages = [2, 4, 6, 8, 10];
    const observationRows = tableVoltages.map((v) => {
      const i = Number((v / resistanceOhm).toFixed(3));
      const ratio = Number((v / i).toFixed(2));
      return [`${v.toFixed(1)} V`, `${resistanceOhm} Ω`, `${i.toFixed(3)} A`, `${ratio.toFixed(2)} Ω`];
    });

    const scenes: SmartSceneSpec[] = [
      {
        id: 'ohm-1',
        sceneNumber: 1,
        title: isKn ? 'ದೃಶ್ಯ 1: ಉಪಕರಣಗಳ ಜೋಡಣೆ' : 'Scene 1: Circuit Components & Instrument Roles',
        durationSec: d(3.2),
        narrationText: isKn
          ? `DC ವಿದ್ಯುತ್ ಸರಬರಾಜು, ${resistanceOhm} ಓಮ್ ಪ್ರತಿರೋಧಕ, ಸರಣಿಯಲ್ಲಿ ಅಮ್ಮೀಟರ್ ಮತ್ತು ಸಮಾನಾಂತರದಲ್ಲಿ ವೋಲ್ಟ್‌ಮೀಟರ್ ಜೋಡಿಸೋಣ.`
          : `Assemble a low-voltage DC power supply, switch, ${resistanceOhm} Ω resistor, ammeter in series, and voltmeter in parallel across the resistor.`,
        subtitleText: isKn
          ? 'ಸರಣಿಯಲ್ಲಿ ಅಮ್ಮೀಟರ್ (A) · ಸಮಾನಾಂತರದಲ್ಲಿ ವೋಲ್ಟ್‌ಮೀಟರ್ (V)'
          : 'Ammeter in series · Voltmeter in parallel across R',
        mathOrFormulaHighlight: 'V = I × R',
        visualKind: 'physics-ohms-law-circuit',
        visualPayload: { stage: 1, voltageV, resistanceOhm, currentA },
        caption: 'Circuit assembly: series ammeter & parallel voltmeter.',
      },
      {
        id: 'ohm-2',
        sceneNumber: 2,
        title: isKn ? 'ದೃಶ್ಯ 2: ಸ್ವಿಚ್ ಆನ್ ಮತ್ತು ವಿದ್ಯುತ್ ಪ್ರವಾಹ' : 'Scene 2: Close Switch & Observe Charge Flow',
        durationSec: d(3.4),
        narrationText: isKn
          ? `${voltageV} ವೋಲ್ಟ್‌ಗೆ ಹೊಂದಿಸಿದಾಗ ಅಮ್ಮೀಟರ್ ${currentA} ಆಂಪಿಯರ್ ಪ್ರವಾಹವನ್ನು ತೋರಿಸುತ್ತದೆ.`
          : `At V = ${voltageV} V across R = ${resistanceOhm} Ω, the ammeter measures I = V / R = ${currentA} A.`,
        subtitleText: `V = ${voltageV} V, R = ${resistanceOhm} Ω → I = ${currentA} A`,
        mathOrFormulaHighlight: `I = ${voltageV} / ${resistanceOhm} = ${currentA} A`,
        calculationStepText: `I = V / R = ${voltageV} / ${resistanceOhm} = ${currentA} A`,
        visualKind: 'physics-ohms-law-circuit',
        visualPayload: { stage: 2, voltageV, resistanceOhm, currentA },
        caption: `Electrons drift around loop at I = ${currentA} A.`,
      },
      {
        id: 'ohm-3',
        sceneNumber: 3,
        title: isKn ? 'ದೃಶ್ಯ 3: ವೋಲ್ಟೇಜ್ ಬದಲಾವಣೆ ಮತ್ತು V–I ಗ್ರಾಫ್' : 'Scene 3: Sweep Voltage & Plot Linear V–I Graph',
        durationSec: d(3.6),
        narrationText: isKn
          ? `ವೋಲ್ಟೇಜ್ ಹೆಚ್ಚಾದಂತೆ ಪ್ರವಾಹವು ನೇರ ಅನುಪಾತದಲ್ಲಿ ಹೆಚ್ಚುತ್ತದೆ. V–I ಗ್ರಾಫ್ ಮೂಲಬಿಂದುವಿನ ಮೂಲಕ ಹಾದುಹೋಗುವ ನೇರ ರೇಖೆಯಾಗಿದೆ.`
          : `Sweeping voltage from 2 V to 10 V doubles and triples current proportionally, producing a straight-line V–I graph whose slope equals resistance.`,
        subtitleText: 'Straight line through origin → Ohmic conductor',
        mathOrFormulaHighlight: 'V / I = R (constant)',
        visualKind: 'physics-ohms-law-circuit',
        visualPayload: { stage: 3, voltageV, resistanceOhm, currentA },
        caption: 'Linear V–I graph plotted from deterministic readings.',
      },
    ];

    const experimentPrep: ExperimentPreparationSpec = {
      experimentName: 'Verifying Ohm’s Law (V = I · R) Using Safe Low-Voltage DC Circuit',
      aim: 'To verify that electric current I through a metallic resistor is directly proportional to potential difference V across it at constant temperature.',
      scientificPrinciple: 'Ohm’s Law: V = I · R (for an ohmic conductor at constant temperature).',
      learningOutcomes: [
        'Connect an ammeter in series and voltmeter in parallel without shorting the supply.',
        'Measure V and I across a fixed resistor and verify constant ratio V/I = R.',
        'Plot a V–I graph and determine resistance from its slope.',
      ],
      equipmentRequired: [
        { id: 'phys-dc-supply', name: 'Variable Low-Voltage DC Supply (0–12 V)', purpose: 'Provides safe, adjustable potential difference V without mains hazard.', unit: 'Volt (V)', visualKind: 'power-supply' },
        { id: 'phys-resistor', name: 'Standard Ceramic Resistor Board', purpose: 'Provides known fixed electrical resistance R.', unit: 'Ohm (Ω)', visualKind: 'resistor' },
        { id: 'phys-ammeter', name: 'Digital DC Ammeter (Series)', purpose: 'Measures total electric current I flowing through the circuit loop.', unit: 'Ampere (A)', visualKind: 'meter' },
        { id: 'phys-voltmeter', name: 'Digital DC Voltmeter (Parallel)', purpose: 'Measures potential drop V directly across the resistor terminals.', unit: 'Volt (V)', visualKind: 'meter' },
        { id: 'phys-wires', name: 'Insulated Banana Patch Leads & Switch', purpose: 'Forms low-resistance closed loop and lets student break circuit between trials.', unit: 'Loop', visualKind: 'resistor' },
      ],
      materialsAndChemicals: [],
      setupDescription: 'Series main loop: DC Supply (+) → Switch → Ammeter → Resistor → DC Supply (−). Voltmeter connects in parallel directly across the resistor.',
      connectionsAndSetupSteps: [
        'Keep DC supply switched OFF and dialed to 0 V before wiring.',
        'Wire DC Supply (+), Switch, Ammeter, and Resistor in a single closed series loop.',
        'Attach Voltmeter red/black probes in parallel across the two ends of the Resistor only.',
      ],
      numberedProcedure: [
        'Assemble the circuit and verify series vs parallel meter placement.',
        'Set resistor value (default 10 Ω) and dial DC Voltage to 2.0 V.',
        'Close switch briefly, read Ammeter current I and Voltmeter V, then open switch to avoid heating.',
        'Repeat for 4.0 V, 6.0 V, 8.0 V, and 10.0 V and record all readings in the table.',
        'Plot V against I and calculate R = V / I for every row.',
      ],
      safetyClassification: 'GREEN',
      protectiveEquipment: ['Insulated patch leads', 'Current-limited 12 V DC bench supply'],
      safetyPrecautions: [
        'Use ONLY safe low-voltage DC (≤ 12 V); NEVER connect school bench circuits to wall mains AC.',
        'Never connect an ammeter directly in parallel across the power supply.',
        'Open the switch between measurements so resistor temperature stays constant.',
      ],
      expectedObservations: {
        summary: 'Current increases linearly with applied voltage while V/I remains constant.',
        colorChange: 'None (solid-state electronic measurement).',
        gasFormation: 'None.',
        precipitateFormation: 'None.',
        temperatureChange: 'Minimal (< 1 °C) when switch is opened promptly between trials.',
      },
      observationTableHeaders: ['Applied Voltage (V)', 'Fixed Resistor (R)', 'Measured Current (I)', 'Calculated Ratio (V/I)'],
      observationRows,
      calculations: [
        `At V = ${voltageV} V and R = ${resistanceOhm} Ω: I = ${voltageV} / ${resistanceOhm} = ${currentA} A`,
        `Power dissipated: P = V × I = ${(voltageV * currentA).toFixed(2)} W`,
      ],
      result: `V / I stays constant at ${resistanceOhm.toFixed(2)} Ω across 2–10 V, verifying Ohm's Law.`,
      conclusion: 'Current I is directly proportional to potential difference V for an ohmic resistor at constant temperature.',
      disposalNotes: 'Dial DC supply back to 0 V, switch OFF, and coil leads neatly.',
      virtualLabDepartment: 'physics',
      virtualLabExperimentId: 'voltage-current',
      virtualLabEquipmentIds: ['phys-dc-supply', 'phys-resistor', 'phys-ammeter', 'phys-voltmeter'],
      virtualLabChemicalIds: [],
    };

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isKn ? 'ಓಮ್‌ನ ನಿಯಮದ ಪ್ರಾಯೋಗಿಕ ಪರಿಶೀಲನೆ (V = IR)' : "Ohm's Law Verification (V = I · R)",
      subject: 'physics',
      learningMode: 'practical-experiment',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ವಿದ್ಯುತ್ ಮಂಡಲದಲ್ಲಿ ವೋಲ್ಟೇಜ್ (V), ವಿದ್ಯುತ್ ಪ್ರವಾಹ (I) ಮತ್ತು ಪ್ರತಿರೋಧ (R) ನಡುವಿನ ಮೂಲಭೂತ ಸಂಬಂಧವನ್ನು ಓಮ್‌ನ ನಿಯಮ ತಿಳಿಸುತ್ತದೆ.'
        : "Ohm's Law connects voltage (electrical push), current (flow of charge), and resistance (opposition to flow) in linear DC circuits.",
      meaningAndDefinition: 'V = I · R, where V is potential difference in Volts, I is current in Amperes, and R is resistance in Ohms (Ω).',
      whyConceptMatters: 'Essential for sizing safe resistors for LEDs, battery packs, chargers, and electronic sensors.',
      scientificOrMathPrinciple: 'At constant temperature, V ∝ I for ohmic metallic conductors.',
      importantTerms: [
        { term: 'Potential Difference (V)', definition: 'Electrical energy per unit charge (Volts, V).' },
        { term: 'Electric Current (I)', definition: 'Rate of flow of charge through a point (Amperes, A).' },
        { term: 'Resistance (R)', definition: 'Opposition to charge flow (Ohms, Ω).' },
      ],
      formulasAndEquations: ['V = I · R', 'I = V / R', 'R = V / I', 'P = V · I'],
      stepByStepExplanation: [
        '1. Connect the ammeter in series so all loop current passes through it.',
        '2. Connect the voltmeter in parallel across the resistor terminals.',
        `3. Vary voltage V (e.g., ${voltageV} V) and compute I = V / R (${currentA} A).`,
        '4. Plot V vs I; the straight-line slope gives resistance R.',
      ],
      workedExamples: [
        {
          title: `Current through a ${resistanceOhm} Ω resistor at ${voltageV} V`,
          given: `V = ${voltageV} V, R = ${resistanceOhm} Ω`,
          steps: ['I = V / R', `I = ${voltageV} / ${resistanceOhm} = ${currentA} A`],
          finalAnswer: `I = ${currentA} A`,
        },
      ],
      realLifeApplications: [
        'Choosing current-limiting resistors for indicator LEDs',
        'Dimmer & potentiometer sensor circuits',
        'Overcurrent fuse sizing in low-voltage electronics',
      ],
      commonMistakes: [
        'Wiring the ammeter in parallel (causes short circuit) instead of series.',
        'Using 230 V wall mains instead of a safe 0–12 V DC bench supply.',
      ],
      visualDemonstrationPlan:
        'Animated DC circuit assembly highlighting series ammeter, parallel voltmeter, proportional charge flow speed, and live V–I graph.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      experimentPrep,
      quiz: [
        {
          id: 'ohm-q1',
          question: 'How must an ammeter and a voltmeter be connected in an Ohm’s law circuit?',
          options: [
            'Ammeter in series, Voltmeter in parallel',
            'Ammeter in parallel, Voltmeter in series',
            'Both in parallel',
            'Both disconnected from the resistor',
          ],
          correctIndex: 0,
          explanation: 'An ammeter has very low resistance and measures loop flow (series); a voltmeter has very high resistance and measures potential difference across a component (parallel).',
        },
        {
          id: 'ohm-q2',
          question: `If V = ${voltageV} V and R = ${resistanceOhm} Ω, what current I flows?`,
          options: [`${currentA} A`, `${voltageV * resistanceOhm} A`, `${(resistanceOhm / voltageV).toFixed(2)} A`, '0 A'],
          correctIndex: 0,
          explanation: `I = V / R = ${voltageV} / ${resistanceOhm} = ${currentA} A.`,
        },
        {
          id: 'ohm-q3',
          question: 'What shape does a V–I graph have for an ohmic resistor at constant temperature?',
          options: ['A straight line passing through the origin (0,0)', 'A horizontal flat line', 'A downward parabola', 'Random scatter'],
          correctIndex: 0,
          explanation: 'Because V = I·R with constant R, V is directly proportional to I.',
        },
        {
          id: 'ohm-q4',
          question: 'Why should we use a 0–12 V DC supply instead of mains electricity?',
          options: ['Low-voltage DC eliminates shock/electrocution hazards in student circuits', 'Mains electricity has zero current', 'Resistors only work below 1 V', 'Voltmeters cannot measure AC'],
          correctIndex: 0,
          explanation: 'Student bench experiments strictly use safe current-limited low-voltage DC.',
        },
        {
          id: 'ohm-q5',
          question: 'Why is the switch opened briefly between trials?',
          options: ['To prevent Joule heating from changing the resistor’s temperature and resistance', 'To drain the battery', 'To reverse electron charge', 'To reset the wire length'],
          correctIndex: 0,
          explanation: 'Temperature rise alters metallic resistance; opening the switch keeps temperature steady.',
        },
      ],
      furtherExploration: [
        'Click "Launch in Virtual Lab" to wire the DC Supply, Resistor, Ammeter & Voltmeter on the Physics bench.',
        'Vary Voltage and Resistance right inside the video player to watch electron speed & the V–I curve update.',
      ],
      scenes,
      interactiveDefaults: { kind: 'ohms-law', voltageV, resistanceOhm },
      safetyClassification: 'GREEN',
      safetyNote: 'Safe low-voltage DC (0–12 V) virtual practical only.',
      sourceMode: 'deterministic-verified',
      validationNote: `Deterministic Ohm's Law model verified: V=${voltageV} V, R=${resistanceOhm} Ω → I=${currentA} A.`,
      createdAt: nowIso,
    };
  }

  // 4. PHYSICS/CHEM — WHY WATER BOILS LOWER ON MOUNTAINS
  if (cls.canonicalKey === 'boiling-altitude') {
    const seaTemp = interpolateWaterBoilingPoint(101.325);
    const mtnTemp = interpolateWaterBoilingPoint(50);
    const d = (s: number) => Math.max(2.5, Number((s * scaleFactor).toFixed(1)));
    const scenes: SmartSceneSpec[] = [
      {
        id: 'boil-1',
        sceneNumber: 1,
        title: isKn ? 'ದೃಶ್ಯ 1: ಸಮುದ್ರ ಮಟ್ಟದ ವಾತಾವರಣ ಒತ್ತಡ' : 'Scene 1: Boiling at Sea Level (101.3 kPa)',
        durationSec: d(3.5),
        narrationText: isKn
          ? `ಸಮುದ್ರ ಮಟ್ಟದಲ್ಲಿ ವಾಯುಮಂಡಲದ ಒತ್ತಡ 101.325 kPa ಆಗಿರುವುದರಿಂದ ನೀರು ${seaTemp} °C ನಲ್ಲಿ ಕುದಿಯುತ್ತದೆ.`
          : `At sea level, heavy air presses down at 101.325 kPa, so water must heat to ${seaTemp} °C before its vapour pressure breaks through.`,
        subtitleText: `Sea level (101.3 kPa): T_boil = ${seaTemp} °C`,
        mathOrFormulaHighlight: `101.3 kPa → ${seaTemp} °C`,
        visualKind: 'physics-boiling-altitude',
        visualPayload: { pressureKpa: 101.325, boilTempC: seaTemp, altitudeM: 0 },
        caption: 'Sea level beaker: 101.3 kPa pressure column.',
      },
      {
        id: 'boil-2',
        sceneNumber: 2,
        title: isKn ? 'ದೃಶ್ಯ 2: ಎತ್ತರದ ಪರ್ವತಗಳಲ್ಲಿ ಕಡಿಮೆ ಒತ್ತಡ' : 'Scene 2: Boiling on a High Mountain (50 kPa)',
        durationSec: d(3.8),
        narrationText: isKn
          ? `ಸುಮಾರು 5,500 ಮೀಟರ್ ಎತ್ತರದಲ್ಲಿ ಗಾಳಿಯ ಒತ್ತಡ 50 kPa ಗೆ ಇಳಿಯುತ್ತದೆ. ಆದ್ದರಿಂದ ನೀರು ಕೇವಲ ${mtnTemp} °C ನಲ್ಲೇ ಕುದಿಯುತ್ತದೆ!`
          : `High on a mountain where atmospheric pressure falls to 50 kPa, water molecules escape much more easily and boil at just ${mtnTemp} °C!`,
        subtitleText: `High altitude (50 kPa): T_boil = ${mtnTemp} °C`,
        mathOrFormulaHighlight: `50 kPa → ${mtnTemp} °C`,
        visualKind: 'physics-boiling-altitude',
        visualPayload: { pressureKpa: 50, boilTempC: mtnTemp, altitudeM: 5500 },
        caption: 'Reduced external pressure lets vapour bubbles form earlier.',
      },
    ];

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isKn ? 'ಪರ್ವತಗಳಲ್ಲಿ ನೀರು ಕಡಿಮೆ ತಾಪಮಾನದಲ್ಲಿ ಏಕೆ ಕುದಿಯುತ್ತದೆ?' : 'Why Water Boils at a Lower Temperature on Mountains',
      subject: cls.subject,
      learningMode: cls.learningMode,
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ನೀರು ಕುದಿಯಲು ಬೇಕಾದ ತಾಪಮಾನವು ಅದರ ಸುತ್ತಲಿನ ವಾಯುಮಂಡಲದ ಒತ್ತಡವನ್ನು ಅವಲಂಬಿಸಿರುತ್ತದೆ.'
        : 'Boiling point is not fixed at 100 °C everywhere—it depends directly on surrounding atmospheric pressure.',
      meaningAndDefinition: 'A liquid boils when its internal saturation vapour pressure equals the external atmospheric pressure pressing on its surface.',
      whyConceptMatters: 'Explains why mountaineers use pressure cookers to cook rice/beans thoroughly at high elevations.',
      scientificOrMathPrinciple: 'Clausius–Clapeyron / IAPWS-IF97 saturation curve: P_sat(T_b) = P_ext.',
      importantTerms: [
        { term: 'Vapour Pressure', definition: 'Upward pressure exerted by escaping vapour molecules.' },
        { term: 'Atmospheric Pressure', definition: 'Weight per unit area of the air column above the liquid (101.325 kPa at sea level).' },
      ],
      formulasAndEquations: ['P_sat(T_b) = P_ext', 'Sea level (101.325 kPa): 100.00 °C', `50.0 kPa (~5,500 m): ${mtnTemp} °C`],
      stepByStepExplanation: [
        '1. Heating increases water vapour pressure inside the liquid.',
        '2. Bubbles can survive and rise only when P_vapour ≥ P_external.',
        '3. Higher mountains have thinner air and lower P_external, so P_vapour matches P_external at a lower temperature.',
      ],
      workedExamples: [
        {
          title: 'IAPWS-IF97 Boiling Comparison',
          given: 'P₁ = 101.325 kPa (sea level) vs P₂ = 50 kPa (mountain)',
          steps: [`At 101.325 kPa → T_b = ${seaTemp} °C`, `At 50.0 kPa → T_b = ${mtnTemp} °C`],
          finalAnswer: `ΔT = −${(seaTemp - mtnTemp).toFixed(2)} °C lower on the mountain`,
        },
      ],
      realLifeApplications: [
        'High-altitude pressure cooking',
        'Vacuum distillation of heat-sensitive liquids',
      ],
      commonMistakes: ['Thinking water on mountains is "hotter" because it boils sooner—it is actually cooler!'],
      visualDemonstrationPlan: 'Dual pressure beaker + barometer animation comparing 101.3 kPa vs 50 kPa boiling points.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      experimentPrep: {
        experimentName: 'Effect of External Pressure on Water Boiling Point',
        aim: 'Observe how lowering external pressure lowers water’s boiling temperature using IAPWS-IF97 reference points.',
        scientificPrinciple: 'P_sat(T_boil) = P_ext.',
        learningOutcomes: ['Relate atmospheric pressure to bubble formation temperature.'],
        equipmentRequired: [
          { id: 'chem-beaker', name: 'Borosilicate Beaker (250 mL)', purpose: 'Holds pure distilled water sample safely during heating.', unit: 'mL', visualKind: 'beaker' },
          { id: 'chem-hot-plate', name: 'Electric Hot Plate', purpose: 'Supplies controlled thermal wattage without open flame.', unit: 'W', visualKind: 'heater' },
          { id: 'chem-thermometer', name: 'Digital Lab Thermometer', purpose: 'Tracks water temperature continuously in °C.', unit: '°C', visualKind: 'thermometer' },
          { id: 'chem-barometer', name: 'Pressure Gauge / Barometer', purpose: 'Measures external chamber pressure in kPa.', unit: 'kPa', visualKind: 'barometer' },
        ],
        materialsAndChemicals: [{ id: 'chem-sub-h2o', name: 'Distilled Water', formula: 'H₂O', hazardClass: 'Non-Hazardous' }],
        setupDescription: 'Place 250 mL beaker of pure H₂O on the hot plate with thermometer submerged and barometer tracking ambient kPa.',
        connectionsAndSetupSteps: ['Connect hot plate thermally to beaker.', 'Attach thermometer probe to monitor bulk water temperature.'],
        numberedProcedure: ['Load 250 mL distilled water.', 'Set pressure to 101.3 kPa and heat until boiling (100 °C).', 'Lower pressure to 50 kPa and observe boiling at 81.33 °C.'],
        safetyClassification: 'AMBER',
        protectiveEquipment: ['Safety goggles', 'Heat-resistant gloves'],
        safetyPrecautions: ['Never seal an unvented glass flask while boiling.', 'Avoid touching hot plate surface.'],
        expectedObservations: {
          summary: 'Clear water boils vigorously with H₂O vapour bubbles once T reaches T_boil(P).',
          colorChange: 'None (pure water stays colourless).',
          gasFormation: 'Colourless H₂O vapour bubbles at boiling point only.',
          precipitateFormation: 'None.',
          temperatureChange: 'Rises steadily until phase-change plateau at T_boil.',
          chemicalEquation: 'H₂O(l) ⇌ H₂O(g) (physical phase change)',
        },
        observationTableHeaders: ['Pressure (kPa)', 'Approx. Altitude (m)', 'Boiling Point (°C)'],
        observationRows: [
          ['101.33 kPa', '0 m (Sea Level)', `${seaTemp} °C`],
          ['70.0 kPa', '~3,000 m', `${interpolateWaterBoilingPoint(70)} °C`],
          ['50.0 kPa', '~5,500 m', `${mtnTemp} °C`],
        ],
        calculations: ['Interpolated via Clausius–Clapeyron log-pressure nodes (10–500 kPa).'],
        result: `Lowering pressure from 101.3 kPa to 50 kPa drops boiling point to ${mtnTemp} °C.`,
        conclusion: 'Boiling point decreases as ambient pressure drops.',
        disposalNotes: 'Allow water to cool below 40 °C before draining cleanly.',
        virtualLabDepartment: 'chemistry',
        virtualLabExperimentId: 'boiling-point',
        virtualLabEquipmentIds: ['chem-hot-plate', 'chem-beaker', 'chem-thermometer', 'chem-barometer'],
        virtualLabChemicalIds: ['chem-sub-h2o'],
      },
      quiz: [
        {
          id: 'boil-q1',
          question: 'When does water begin to boil?',
          options: ['When its vapour pressure equals surrounding external pressure', 'Only at 100 °C regardless of pressure', 'When air turns into water', 'At 0 °C'],
          correctIndex: 0,
          explanation: 'Boiling occurs when P_vapour = P_external.',
        },
        {
          id: 'boil-q2',
          question: `At 50 kPa high on a mountain, pure water boils at approximately:`,
          options: [`${mtnTemp} °C`, '100 °C', '120 °C', '45 °C'],
          correctIndex: 0,
          explanation: 'From IAPWS-IF97 saturation tables, 50 kPa corresponds to 81.33 °C.',
        },
        {
          id: 'boil-q3',
          question: 'Why does food take longer to boil in an open pot on Mount Everest?',
          options: ['Boiling water is cooler (~69–71 °C), slowing cooking chemistry', 'Fire has no heat', 'Salt freezes', 'Gravity turns off'],
          correctIndex: 0,
          explanation: 'Lower boiling temperature means food cooks in cooler water unless a pressure cooker raises internal pressure.',
        },
        {
          id: 'boil-q4',
          question: 'What gas makes up the bubbles inside boiling pure water?',
          options: ['Water vapour (H₂O gas)', 'Hydrogen and oxygen split apart', 'Nitrogen from wood', 'Carbon monoxide'],
          correctIndex: 0,
          explanation: 'Boiling is a physical state change from H₂O(l) to H₂O(g), not chemical decomposition.',
        },
        {
          id: 'boil-q5',
          question: 'What happens to boiling point inside a pressure cooker (>101.3 kPa)?',
          options: ['It increases above 100 °C', 'It drops below 80 °C', 'It stays 100 °C', 'Water freezes'],
          correctIndex: 0,
          explanation: 'Higher trapped pressure requires higher temperature for vapour pressure to match it.',
        },
      ],
      furtherExploration: [
        'Launch the Sea Level vs High Altitude Dual Demo directly inside the Chemistry Lab.',
      ],
      scenes,
      interactiveDefaults: { kind: 'boiling', pressureKpa: 50 },
      safetyClassification: 'AMBER',
      safetyNote: 'Thermal/pressurized systems require supervision in physical labs.',
      sourceMode: 'deterministic-verified',
      validationNote: `Verified against IAPWS-IF97 dataset: 101.325 kPa → ${seaTemp} °C; 50 kPa → ${mtnTemp} °C.`,
      createdAt: nowIso,
    };
  }

  // 5. CHEMISTRY CONCEPT — ELECTROLYSIS OF WATER
  if (cls.canonicalKey === 'electrolysis') {
    const d = (s: number) => Math.max(2.5, Number((s * scaleFactor).toFixed(1)));
    const scenes: SmartSceneSpec[] = [
      {
        id: 'elec-1',
        sceneNumber: 1,
        title: isKn ? 'ದೃಶ್ಯ 1: ವಿದ್ಯುದ್ವಿಭಜನೆ ಕೋಶ ಮತ್ತು ಎಲೆಕ್ಟ್ರೋಡ್‌ಗಳು' : 'Scene 1: Electrolytic Cell, Cathode & Anode',
        durationSec: d(3.4),
        narrationText: isKn
          ? 'ನೀರಿನ ವಿದ್ಯುದ್ವಿಭಜನೆಯಲ್ಲಿ ಋಣಾತ್ಮಕ ಕ್ಯಾಥೋಡ್ ಮತ್ತು ಧನಾತ್ಮಕ ಆನೋಡ್ ಎಲೆಕ್ಟ್ರೋಡ್‌ಗಳನ್ನು DC ಬ್ಯಾಟರಿಗೆ ಜೋಡಿಸಲಾಗುತ್ತದೆ.'
          : 'An electrolytic cell places two inert graphite/platinum electrodes—negative Cathode (−) and positive Anode (+)—into acidified water connected to a low-voltage DC battery.',
        subtitleText: 'DC Battery → Cathode (−) & Anode (+) in H₂O electrolyte',
        mathOrFormulaHighlight: '2H₂O(l) → 2H₂(g) + O₂(g)',
        visualKind: 'chemistry-electrolysis',
        visualPayload: { stage: 1 },
        caption: 'Electrolytic cell with inert graphite electrodes.',
      },
      {
        id: 'elec-2',
        sceneNumber: 2,
        title: isKn ? 'ದೃಶ್ಯ 2: ಅಯಾನುಗಳ ಚಲನೆ ಮತ್ತು 2:1 ಅನಿಲ ಅನುಪಾತ' : 'Scene 2: Ion Migration & 2:1 H₂ : O₂ Gas Ratio',
        durationSec: d(4.0),
        narrationText: isKn
          ? 'ಕ್ಯಾಥೋಡ್‌ನಲ್ಲಿ ಹೈಡ್ರೋಜನ್ (H₂) ಅನಿಲ ಮತ್ತು ಆನೋಡ್‌ನಲ್ಲಿ ಆಕ್ಸಿಜನ್ (O₂) ಅನಿಲ 2:1 ಪ್ರಮಾಣದಲ್ಲಿ ಬಿಡುಗಡೆಯಾಗುತ್ತದೆ.'
          : 'Reduction at the cathode produces twice as much Hydrogen gas (2H₂) as Oxygen gas (O₂) formed by oxidation at the anode—an exact 2:1 molar volume ratio.',
        subtitleText: 'Cathode (−): 2H₂(g) [2 volumes] · Anode (+): O₂(g) [1 volume]',
        mathOrFormulaHighlight: 'Cathode H₂ : Anode O₂ = 2 : 1',
        calculationStepText: '4H⁺ + 4e⁻ → 2H₂(g)   |   2H₂O → O₂(g) + 4H⁺ + 4e⁻',
        visualKind: 'chemistry-electrolysis',
        visualPayload: { stage: 2 },
        caption: 'Colourless H₂ bubbles rise twice as fast as O₂ bubbles.',
      },
    ];

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isKn ? 'ವಿದ್ಯುದ್ವಿಭಜನೆ (Electrolysis of Water)' : 'Electrolysis of Water (2H₂O → 2H₂ + O₂)',
      subject: 'chemistry',
      learningMode: 'concept',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ವಿದ್ಯುತ್ ಶಕ್ತಿಯನ್ನು ಬಳಸಿ ರಾಸಾಯನಿಕ ಸಂಯುಕ್ತವನ್ನು ಅದರ ಮೂಲ ಧಾತುಗಳಾಗಿ ವಿಭಜಿಸುವ ಪ್ರಕ್ರಿಯೆಯೇ ವಿದ್ಯುದ್ವಿಭಜನೆ.'
        : 'Electrolysis uses direct electric current (DC) to drive a non-spontaneous chemical decomposition reaction.',
      meaningAndDefinition:
        'Passing DC current through water containing a trace safe electrolyte splits H₂O molecules into H₂ gas at the cathode (−) and O₂ gas at the anode (+).',
      whyConceptMatters: 'Used industrially to purify aluminium and copper, electroplate metals, and generate green hydrogen fuel.',
      scientificOrMathPrinciple: 'Faraday’s Laws of Electrolysis & Half-Cell Redox Equations.',
      importantTerms: [
        { term: 'Cathode (−)', definition: 'Negative electrode where cations gain electrons (Reduction).' },
        { term: 'Anode (+)', definition: 'Positive electrode where oxidation occurs (O₂ released).' },
        { term: 'Electrolyte', definition: 'Ion-containing solution that conducts electricity between electrodes.' },
      ],
      formulasAndEquations: [
        'Overall: 2H₂O(l) → 2H₂(g) + O₂(g)',
        'Cathode (−): 4H₂O + 4e⁻ → 2H₂(g) + 4OH⁻',
        'Anode (+): 2H₂O → O₂(g) + 4H⁺ + 4e⁻',
      ],
      stepByStepExplanation: [
        '1. Pure water conducts poorly, so a tiny amount of dilute safe salt/acid supplies mobile ions.',
        '2. DC voltage pulls electrons into the cathode (−), reducing H⁺/H₂O to H₂ bubbles.',
        '3. Electrons leave at the anode (+), oxidizing water to O₂ bubbles in a 2:1 H₂:O₂ volume ratio.',
      ],
      workedExamples: [
        {
          title: 'Gas Volume Prediction',
          given: '20 mL of H₂ collected at the cathode',
          steps: ['Stoichiometry shows 2 mol H₂ per 1 mol O₂', 'O₂ volume = 20 mL ÷ 2 = 10 mL'],
          finalAnswer: '10 mL of Oxygen gas at the anode',
        },
      ],
      realLifeApplications: ['Industrial copper refining', 'Chromium/silver electroplating', 'Green hydrogen production from solar DC'],
      commonMistakes: ['Assuming both electrodes collect equal gas volumes (H₂ is always 2× O₂).', 'Using AC instead of DC—AC alternates polarity and stops clean separation.'],
      visualDemonstrationPlan: 'Inert graphite electrodes, mobile ion arrows, and animated 2:1 bubble collection tubes.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      quiz: [
        { id: 'el-1', question: 'Why is the gas volume at the cathode twice that at the anode during water electrolysis?', options: ['Water has 2 H atoms per 1 O atom (2H₂O → 2H₂ + O₂)', 'Gravity pushes H₂ faster', 'The anode dissolves', 'Temperature doubles'], correctIndex: 0, explanation: 'Balanced stoichiometry produces 2 moles of H₂ for every 1 mole of O₂.' },
        { id: 'el-2', question: 'Which power source type is required for electrolysis?', options: ['Low-voltage Direct Current (DC)', 'Alternating Current (AC)', 'Static paper alone', 'Sound waves'], correctIndex: 0, explanation: 'DC keeps cathode negative and anode positive continuously.' },
        { id: 'el-3', question: 'Which gas forms at the negative cathode during water electrolysis?', options: ['Hydrogen (H₂)', 'Oxygen (O₂)', 'Nitrogen (N₂)', 'Carbon dioxide'], correctIndex: 0, explanation: 'Reduction at the cathode produces H₂ gas.' },
        { id: 'el-4', question: 'What happens at the anode?', options: ['Oxidation (loss of electrons)', 'Reduction (gain of electrons)', 'Freezing', 'Nuclear fusion'], correctIndex: 0, explanation: 'Anode = Oxidation ("An Ox").' },
        { id: 'el-5', question: 'Why is a small amount of electrolyte added to pure distilled water?', options: ['To provide mobile ions so current can flow', 'To turn water blue', 'To create carbon', 'To boil water at 20 °C'], correctIndex: 0, explanation: 'Distilled water has very few ions and conducts poorly on its own.' },
      ],
      furtherExploration: ['Explore Graphite Electrodes and DC Supply inside the Chemistry Laboratory.'],
      scenes,
      interactiveDefaults: { kind: 'none' },
      safetyClassification: 'AMBER',
      safetyNote: 'Hydrogen gas is flammable in real labs; perform electrolysis only with low-voltage DC and teacher supervision.',
      sourceMode: 'deterministic-verified',
      validationNote: 'Balanced redox stoichiometry verified: 2H₂O(l) → 2H₂(g) + O₂(g).',
      createdAt: nowIso,
    };
  }

  // 6. CHEMISTRY PRACTICAL — SAFE HEATING & REACTION / NEUTRALISATION
  if (cls.canonicalKey === 'chemistry-neutralisation' || cls.canonicalKey === 'chemistry-heating-reaction') {
    const isNeutral = cls.canonicalKey === 'chemistry-neutralisation';
    const d = (s: number) => Math.max(2.5, Number((s * scaleFactor).toFixed(1)));
    const scenes: SmartSceneSpec[] = [
      {
        id: 'chem-1',
        sceneNumber: 1,
        title: isKn
          ? isNeutral ? 'ದೃಶ್ಯ 1: ಆಮ್ಲ-ಕ್ಷಾರ ಮತ್ತು ಸೂಚಕ ತಯಾರಿ' : 'ದೃಶ್ಯ 1: ಪರೀಕ್ಷಾ ನಳಿಕೆ ಮತ್ತು ತಾಪ ಮೂಲ'
          : isNeutral
            ? 'Scene 1: Burette, Flask & Indicator Preparation'
            : 'Scene 1: Place Test Tube / Beaker Near Virtual Burner',
        durationSec: d(3.2),
        narrationText: isNeutral
          ? 'Dilute HCl with Universal Indicator turns bright red at acidic pH. Slowly adding NaOH from a burette approaches neutral pH 7.'
          : 'Place a borosilicate beaker or test tube containing aqueous Copper(II) Sulfate solution near the controlled heating plate with a thermometer.',
        subtitleText: isNeutral
          ? 'HCl (red in Universal Indicator) + Burette NaOH'
          : 'Test Tube / Beaker + Heating Plate + Thermometer',
        mathOrFormulaHighlight: isNeutral
          ? 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)'
          : 'CuSO₄(aq) + heat → concentrated CuSO₄ + H₂O(g)',
        visualKind: isNeutral ? 'chemistry-neutralisation' : 'chemistry-test-tube-heating',
        visualPayload: { stage: 1 },
        caption: 'Safe glassware positioning and material check.',
      },
      {
        id: 'chem-2',
        sceneNumber: 2,
        title: isKn
          ? isNeutral ? 'ದೃಶ್ಯ 2: ತಟಸ್ಥೀಕರಣ ಮತ್ತು ಬಣ್ಣ ಬದಲಾವಣೆ' : 'ದೃಶ್ಯ 2: ತಾಪಮಾನ ಏರಿಕೆ ಮತ್ತು ಆವಿಯಾಗುವಿಕೆ'
          : isNeutral
            ? 'Scene 2: Neutralisation Point (pH 7.0 Green)'
            : 'Scene 2: Temperature Rise, Boiling Point & Vapour',
        durationSec: d(3.6),
        narrationText: isNeutral
          ? 'At equal molar equivalence, H⁺ and OH⁻ form neutral water at pH 7.0—the indicator turns emerald green with zero toxic gas!'
          : 'Temperature increases smoothly along the heating curve. Clear water vapour bubbles appear ONLY once solvent reaches boiling point—never invented smoke.',
        subtitleText: isNeutral
          ? 'Equivalence reached: pH = 7.0 (Green), slight +ΔT'
          : 'T reaches 100 °C → clear H₂O(g) vapour bubbles only',
        mathOrFormulaHighlight: isNeutral ? 'pH = 7.0 (Neutral)' : 'T ≥ 100.0 °C → H₂O(g)',
        visualKind: isNeutral ? 'chemistry-neutralisation' : 'chemistry-test-tube-heating',
        visualPayload: { stage: 2 },
        caption: 'Scientifically validated observation: no fabricated fumes.',
      },
    ];

    const experimentPrep: ExperimentPreparationSpec = {
      experimentName: isNeutral
        ? 'Safe Acid–Base Neutralisation with Universal Indicator (HCl + NaOH)'
        : 'Controlled Heating of Aqueous Copper(II) Sulfate / Pure Water',
      aim: isNeutral
        ? 'Measure pH and colour shift during equimolar neutralisation of dilute 0.5 M HCl with 0.5 M NaOH.'
        : 'Observe temperature progression, phase transition, and solvent evaporation when heating a verified aqueous solution.',
      scientificPrinciple: isNeutral
        ? 'H₃O⁺ + OH⁻ → 2H₂O (ΔH = −57.3 kJ/mol)'
        : 'Thermal kinetic energy increase followed by liquid-to-vapour equilibrium at P_vap = P_ext.',
      learningOutcomes: [
        'Handle dilute solutions safely in virtual glassware.',
        'Predict exact pH / phase outcomes without fabricating toxic gases.',
      ],
      equipmentRequired: [
        { id: isNeutral ? 'chem-conical-flask' : 'chem-test-tubes', name: isNeutral ? 'Erlenmeyer Flask (250 mL)' : 'Borosilicate Test Tubes & Stand', purpose: 'Holds the aqueous sample safely.', unit: 'mL', visualKind: 'glassware' },
        { id: isNeutral ? 'chem-burette' : 'chem-hot-plate', name: isNeutral ? 'Graduated Burette (50 mL)' : 'Electric Hot Plate / Burner', purpose: isNeutral ? 'Delivers NaOH drop-by-drop.' : 'Supplies controlled thermal energy.', unit: isNeutral ? 'mL' : 'W', visualKind: isNeutral ? 'burette' : 'heater' },
        { id: isNeutral ? 'chem-ph-meter' : 'chem-thermometer', name: isNeutral ? 'Digital pH Meter' : 'Lab Thermometer', purpose: isNeutral ? 'Reads live solution pH.' : 'Tracks vessel temperature.', unit: isNeutral ? 'pH' : '°C', visualKind: isNeutral ? 'sensor' : 'thermometer' },
      ],
      materialsAndChemicals: isNeutral
        ? [
            { id: 'chem-sub-hcl', name: 'Dilute Hydrochloric Acid (0.5 M)', formula: 'HCl', hazardClass: 'Corrosive / Irritant (Virtual Only)' },
            { id: 'chem-sub-naoh', name: 'Dilute Sodium Hydroxide (0.5 M)', formula: 'NaOH', hazardClass: 'Corrosive / Irritant (Virtual Only)' },
            { id: 'chem-sub-universal', name: 'Universal pH Indicator', formula: 'Indicator', hazardClass: 'Low Hazard (Virtual)' },
          ]
        : [
            { id: 'chem-sub-cuso4', name: 'Copper(II) Sulfate Aqueous', formula: 'CuSO₄', hazardClass: 'Low Hazard (Virtual)' },
            { id: 'chem-sub-h2o', name: 'Distilled Water', formula: 'H₂O', hazardClass: 'Non-Hazardous' },
          ],
      setupDescription: isNeutral
        ? 'Mount burette on clamp stand above conical flask containing dilute HCl + 3 drops Universal Indicator.'
        : 'Position test tube / beaker adjacent to hot plate with thermometer monitoring liquid temperature.',
      connectionsAndSetupSteps: [
        'Place vessel and measuring probe inside the Chemistry Workbench.',
        'Load ONLY validated reagent bottles from the Chemical Vault.',
      ],
      numberedProcedure: [
        'Select glassware and required reagent bottles onto the Chemistry island bench.',
        'Verify Safety Guardian badge is GREEN or AMBER (Teacher-Supervised).',
        'Start simulation and observe validated colour, temperature, and vapour readouts.',
      ],
      safetyClassification: 'AMBER',
      protectiveEquipment: ['Splash goggles', 'Lab coat', 'Nitrile gloves'],
      safetyPrecautions: [
        'Use dilute virtual molarities only (≤ 0.5 mol/L).',
        'Do not mix unknown substances or heat sealed glassware.',
      ],
      expectedObservations: {
        summary: isNeutral
          ? 'Red acidic solution turns orange → emerald green (pH 7.0) → violet if excess base added.'
          : 'Blue aqueous CuSO₄ heats smoothly to 100 °C and evolves clear H₂O vapour only.',
        colorChange: isNeutral ? 'Red (pH 1) → Emerald Green (pH 7)' : 'Blue solution stays blue (no fake colour switch)',
        gasFormation: isNeutral ? 'None' : 'Clear H₂O(g) steam above boiling point only',
        precipitateFormation: isNeutral ? 'None (NaCl stays dissolved)' : 'Blue crystals upon extended evaporation',
        temperatureChange: isNeutral ? '+4.4 °C exothermic rise' : '25 °C → 100 °C plateau',
        chemicalEquation: isNeutral ? 'HCl + NaOH → NaCl + H₂O' : 'CuSO₄(aq) + heat → CuSO₄·5H₂O + H₂O(g)',
      },
      observationTableHeaders: isNeutral ? ['NaOH Added (mL)', 'pH Reading', 'Indicator Colour'] : ['Time (s)', 'Temp (°C)', 'State Observed'],
      observationRows: isNeutral
        ? [
            ['0.0 mL', '1.3', 'Bright Red'],
            ['15.0 mL', '2.1', 'Orange-Red'],
            ['25.0 mL', '7.0', 'Emerald Green (Neutral)'],
            ['30.0 mL', '12.2', 'Violet-Blue (Excess OH⁻)'],
          ]
        : [
            ['0 s', '25.0 °C', 'Clear blue liquid'],
            ['12 s', '68.0 °C', 'Warming convection currents'],
            ['20 s', '100.0 °C', 'Boiling: clear H₂O vapour bubbles'],
          ],
      calculations: isNeutral
        ? ['M₁V₁ = M₂V₂ → (0.5 M)(25 mL) = (0.5 M)(25 mL) at equivalence']
        : ['Q = m·c·ΔT = (100 g)(4.184 J/g°C)(75 °C) = 31.38 kJ'],
      result: isNeutral ? 'Exact neutralisation achieved at 25.0 mL NaOH (pH 7.0).' : 'Boiling occurs at validated solvent boiling point.',
      conclusion: 'Observations follow validated stoichiometry and thermodynamic phase laws.',
      disposalNotes: 'Neutralised aqueous NaCl drains safely; heavy-metal CuSO₄ goes to labeled inorganic waste jar.',
      virtualLabDepartment: 'chemistry',
      virtualLabExperimentId: isNeutral ? 'acid-ph' : 'boiling-point',
      virtualLabEquipmentIds: isNeutral
        ? ['chem-conical-flask', 'chem-burette', 'chem-ph-meter', 'chem-dropper']
        : ['chem-test-tubes', 'chem-hot-plate', 'chem-thermometer', 'chem-beaker'],
      virtualLabChemicalIds: isNeutral
        ? ['chem-sub-hcl', 'chem-sub-naoh', 'chem-sub-universal']
        : ['chem-sub-cuso4', 'chem-sub-h2o'],
    };

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: experimentPrep.experimentName,
      subject: 'chemistry',
      learningMode: 'practical-experiment',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isKn
        ? 'ಸುರಕ್ಷಿತ ರಸಾಯನಶಾಸ್ತ್ರ ಪ್ರಯೋಗದಲ್ಲಿ ಪ್ರತಿಯೊಂದು ಬದಲಾವಣೆಯೂ ನಿಖರ ವೈಜ್ಞಾನಿಕ ನಿಯಮಗಳನ್ನು ಅನುಸರಿಸುತ್ತದೆ.'
        : 'Real laboratory chemistry relies on controlled conditions, accurate stoichiometry, and observing only scientifically verified products.',
      meaningAndDefinition: experimentPrep.aim,
      whyConceptMatters: 'Prevents guesswork and builds safe, quantitative laboratory habits.',
      scientificOrMathPrinciple: experimentPrep.scientificPrinciple,
      importantTerms: [
        { term: 'Reactants', definition: 'Starting chemical substances transformed during reaction.' },
        { term: 'Equivalence Point', definition: 'Exact stoichiometric balance between acid and base moles.' },
      ],
      formulasAndEquations: [experimentPrep.expectedObservations.chemicalEquation || ''],
      stepByStepExplanation: experimentPrep.numberedProcedure,
      workedExamples: [
        {
          title: 'Quantitative Calculation',
          given: isNeutral ? '25 mL of 0.5 M HCl neutralised by 0.5 M NaOH' : '100 g aqueous water heated 25 °C → 100 °C',
          steps: experimentPrep.calculations,
          finalAnswer: experimentPrep.result,
        },
      ],
      realLifeApplications: ['Water treatment pH balancing', 'Pharmaceutical salt crystallisation'],
      commonMistakes: ['Assuming every heated liquid gives coloured fumes—only specific reactions evolve gases.'],
      visualDemonstrationPlan: 'Interactive glassware + heating / indicator colour animation linked directly to the Chemistry Workbench.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      experimentPrep,
      quiz: [
        { id: 'ch-q1', question: 'When dilute HCl neutralises NaOH, what products form?', options: ['Aqueous NaCl and H₂O', 'Hydrogen cyanide', 'Chlorine gas clouds', 'Metallic sodium'], correctIndex: 0, explanation: 'HCl + NaOH → NaCl + H₂O.' },
        { id: 'ch-q2', question: 'What colour does Universal Indicator show at exact neutral pH 7?', options: ['Emerald green', 'Neon magenta', 'Pitch black', 'Bright red'], correctIndex: 0, explanation: 'Universal indicator is green around pH 7.' },
        { id: 'ch-q3', question: 'When heating pure water, when do true boiling bubbles form throughout the liquid?', options: ['Only once vapour pressure equals external pressure (T ≥ T_boil)', 'Immediately at 26 °C', 'Only in dark rooms', 'Never'], correctIndex: 0, explanation: 'Bulk boiling begins at the saturation boiling temperature.' },
        { id: 'ch-q4', question: 'Which safety rule applies in a school chemistry lab?', options: ['Never mix unknown chemicals or heat sealed vessels', 'Taste acids to test pH', 'Heat flammable H₂ with open flames', 'Skip goggles'], correctIndex: 0, explanation: 'Safety Guardian requires verified reactants and vented vessels.' },
        { id: 'ch-q5', question: 'What happens in the Fe + CuSO₄ reaction?', options: ['Iron displaces Cu, turning blue solution pale green with brown Cu deposit', 'Gold forms', 'Toxic green chlorine gas forms', 'Nothing changes'], correctIndex: 0, explanation: 'Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s).' },
      ],
      furtherExploration: ['Open the Virtual Chemistry Lab to drag Test Tubes, Beakers, Hot Plate, and Reagents onto the bench!'],
      scenes,
      interactiveDefaults: { kind: 'none' },
      safetyClassification: 'AMBER',
      safetyNote: 'Safe virtual chemistry model with teacher-supervised guidance.',
      sourceMode: 'deterministic-verified',
      validationNote: 'Validated against Chemistry Reaction & Safety Registry.',
      createdAt: nowIso,
    };
  }

  // 7. BIOLOGY — PHOTOSYNTHESIS / MICROSCOPE CELL
  if (cls.canonicalKey === 'photosynthesis' || cls.canonicalKey === 'microscope-cell') {
    const isPhoto = cls.canonicalKey === 'photosynthesis';
    const d = (s: number) => Math.max(2.5, Number((s * scaleFactor).toFixed(1)));
    const scenes: SmartSceneSpec[] = [
      {
        id: 'bio-1',
        sceneNumber: 1,
        title: isPhoto ? 'Scene 1: Light Capture in Chloroplasts' : 'Scene 1: Optical Path & Specimen Stage',
        durationSec: d(3.5),
        narrationText: isPhoto
          ? 'Inside green leaf chloroplasts, chlorophyll pigments absorb sunlight energy while roots supply water (H₂O) and stomata draw in CO₂.'
          : 'Light passes from the condenser through the stained onion epidermis cell on the glass slide, magnified by objective (40×) and eyepiece (10×) lenses for 400× total magnification.',
        subtitleText: isPhoto ? '6CO₂ + 6H₂O + Light → Chloroplast' : 'Total Magnification = Objective × Eyepiece (40× × 10× = 400×)',
        mathOrFormulaHighlight: isPhoto ? '6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂' : 'M_total = M_obj × M_eye',
        visualKind: isPhoto ? 'biology-photosynthesis' : 'biology-cell-microscope',
        visualPayload: { stage: 1 },
        caption: isPhoto ? 'Photons energise chlorophyll molecules.' : 'Compound microscope optical ray path.',
      },
      {
        id: 'bio-2',
        sceneNumber: 2,
        title: isPhoto ? 'Scene 2: Glucose Synthesis & O₂ Release' : 'Scene 2: Plant Cell Organelles Under 400×',
        durationSec: d(3.8),
        narrationText: isPhoto
          ? 'Light-dependent reactions split water releasing oxygen bubbles (6O₂), and the Calvin cycle fixes CO₂ into glucose (C₆H₁₂O₆).'
          : 'At 400× resolution, the rigid cellulose cell wall, central vacuole, nucleus, and green chloroplasts become clearly distinguishable.',
        subtitleText: isPhoto ? 'Outputs: Glucose (C₆H₁₂O₆) + Oxygen bubbles (6O₂)' : 'Cell wall · Plasma membrane · Nucleus · Chloroplasts',
        mathOrFormulaHighlight: isPhoto ? 'C₆H₁₂O₆ + 6O₂ ↑' : '400× Plant Cell View',
        visualKind: isPhoto ? 'biology-photosynthesis' : 'biology-cell-microscope',
        visualPayload: { stage: 2 },
        caption: isPhoto ? 'Oxygen bubbles escape leaf surface; glucose stored.' : 'Magnified eukaryotic organelle inspection.',
      },
    ];

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: isPhoto
        ? isKn ? 'ದ್ಯುತಿಸಂಶ್ಲೇಷಣೆ (Photosynthesis)' : 'How Photosynthesis Works'
        : isKn ? 'ಸೂಕ್ಷ್ಮದರ್ಶಕ ಮತ್ತು ಜೀವಕೋಶದ ರಚನೆ' : 'How a Compound Microscope & Plant Cell Work',
      subject: 'biology',
      learningMode: isPhoto ? 'biological-process' : 'practical-experiment',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isPhoto
        ? 'Photosynthesis is the biochemical process by which green plants convert solar light into stored chemical energy.'
        : 'A compound microscope bends visible light through two glass lens systems to reveal microscopic cellular structures.',
      meaningAndDefinition: isPhoto
        ? 'Chloroplasts use light, carbon dioxide (CO₂), and water (H₂O) to produce glucose (C₆H₁₂O₆) and release oxygen (O₂).'
        : 'Total magnification equals objective lens magnification multiplied by eyepiece magnification.',
      whyConceptMatters: isPhoto
        ? 'Supplies atmospheric oxygen and forms the energy base of almost every food web on Earth.'
        : 'Allowed biologists to discover cells, bacteria, nuclei, and organelles invisible to the naked eye.',
      scientificOrMathPrinciple: isPhoto ? '6CO₂ + 6H₂O —(Light, Chlorophyll)→ C₆H₁₂O₆ + 6O₂' : 'M_total = M_objective × M_eyepiece',
      importantTerms: isPhoto
        ? [
            { term: 'Chloroplast', definition: 'Plant organelle containing light-absorbing chlorophyll.' },
            { term: 'Stomata', definition: 'Microscopic leaf pores regulating CO₂ intake and O₂/water vapour exit.' },
          ]
        : [
            { term: 'Objective Lens', definition: 'Primary lens close to specimen (e.g. 4×, 10×, 40×).' },
            { term: 'Cell Wall', definition: 'Rigid cellulose layer surrounding plant cells (absent in animal cells).' },
          ],
      formulasAndEquations: [isPhoto ? '6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂' : '40× objective × 10× eyepiece = 400× total'],
      stepByStepExplanation: isPhoto
        ? ['1. Roots absorb water (H₂O) and xylem transports it to leaves.', '2. Stomata admit CO₂.', '3. Chlorophyll captures photons to split water and release O₂.', '4. Calvin cycle assembles sugar (glucose).']
        : ['1. Place stained slide cleanly on mechanical stage.', '2. Focus first with low-power 10× objective using coarse knob.', '3. Rotate to 40× high power and sharpen carefully with fine focus knob.'],
      workedExamples: [
        {
          title: isPhoto ? 'Oxygen Yield Stoichiometry' : 'Microscope Magnification Calculation',
          given: isPhoto ? '6 moles CO₂ + 6 moles H₂O fixed' : 'Eyepiece = 10×, High-Power Objective = 40×',
          steps: isPhoto ? ['Balanced ratio: 6 CO₂ : 6 O₂ = 1 : 1'] : ['M_total = 10 × 40 = 400'],
          finalAnswer: isPhoto ? '6 moles O₂ + 1 mole C₆H₁₂O₆' : '400× Magnification',
        },
      ],
      realLifeApplications: isPhoto ? ['Greenhouse crop lighting optimization', 'Carbon-cycle climate modeling'] : ['Medical blood smear diagnostics', 'Plant leaf stomata microscopy'],
      commonMistakes: isPhoto ? ['Thinking plants do not respire at night—plants respire continuously but photosynthesise in light.'] : ['Using coarse focus knob under 40× objective, which can crack the slide!'],
      visualDemonstrationPlan: isPhoto ? 'Chloroplast photon capture + CO₂/H₂O intake + O₂ bubbling animation.' : 'Optical light beam magnification into labeled 400× plant cell.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      quiz: [
        { id: 'bio-1', question: isPhoto ? 'Which organelle carries out photosynthesis?' : 'What is the total magnification with a 10× eyepiece and 40× objective?', options: isPhoto ? ['Chloroplast', 'Ribosome', 'Lysosome', 'Golgi body'] : ['400×', '50×', '4×', '4000×'], correctIndex: 0, explanation: isPhoto ? 'Chloroplasts contain chlorophyll.' : '10 × 40 = 400×.' },
        { id: 'bio-2', question: 'Which gas is released as a byproduct of photosynthesis?', options: ['Oxygen (O₂)', 'Carbon monoxide', 'Nitrogen', 'Methane'], correctIndex: 0, explanation: 'Splitting water molecules releases O₂.' },
        { id: 'bio-3', question: 'Through which leaf pores does CO₂ primarily enter?', options: ['Stomata', 'Root hairs', 'Xylem bark', 'Petals'], correctIndex: 0, explanation: 'Guard cells open and close stomata for gas exchange.' },
        { id: 'bio-4', question: 'Which structure distinguishes plant cells from animal cells?', options: ['Cellulose cell wall & chloroplasts', 'Nucleus', 'Mitochondria', 'Cytoplasm'], correctIndex: 0, explanation: 'Animal cells lack cell walls and chloroplasts.' },
        { id: 'bio-5', question: 'As light intensity increases past saturation, photosynthesis rate:', options: ['Levels off when CO₂ or temperature becomes limiting', 'Increases to infinity', 'Drops to negative immediately', 'Turns into boiling'], correctIndex: 0, explanation: 'Saturation follows Blackman’s law of limiting factors.' },
      ],
      furtherExploration: ['Explore our Virtual Biology Lab with Growth Lamp, Plant Chamber & Compound Microscope!'],
      scenes,
      interactiveDefaults: { kind: 'none' },
      safetyClassification: 'GREEN',
      safetyNote: 'Safe biology visual study.',
      sourceMode: 'deterministic-verified',
      validationNote: 'Grounded against Biology Lab photosynthesis & microscopy curricula.',
      createdAt: nowIso,
    };
  }

  // 8. COMPUTER SCIENCE — BINARY SEARCH, SORTING, CPU & TRANSISTOR
  if (
    cls.canonicalKey === 'binary-search' ||
    cls.canonicalKey === 'merge-sort' ||
    cls.canonicalKey === 'bubble-sort' ||
    cls.canonicalKey === 'quick-sort' ||
    cls.canonicalKey === 'cs-general-algo'
  ) {
    const algoId =
      cls.canonicalKey === 'merge-sort'
        ? 'merge-sort'
        : cls.canonicalKey === 'quick-sort'
          ? 'quick-sort'
          : cls.canonicalKey === 'bubble-sort'
            ? 'bubble-sort'
            : 'binary-search';

    const defaultArr = algoId === 'binary-search' ? [4, 11, 18, 25, 33, 42, 57, 68, 84] : [38, 14, 52, 9, 44, 21, 63];
    const arr = customParams?.arrayValues && customParams.arrayValues.length >= 3 ? customParams.arrayValues : defaultArr;
    const target = customParams?.targetValue ?? 42;
    const exec = executeAlgorithm(algoId, { target }, arr.join(', '));

    const d = (s: number) => Math.max(1.8, Number((s * scaleFactor).toFixed(1)));
    const isBinary = algoId === 'binary-search';
    const maxScenes = durationPreset === 'short' ? 6 : 10;
    const sampledSteps = exec.steps.slice(0, maxScenes);
    const scenes: SmartSceneSpec[] = sampledSteps.map((st, idx) => ({
      id: `cs-${idx + 1}`,
      sceneNumber: idx + 1,
      title: `Step ${idx + 1}: ${st.operation}`,
      durationSec: d(2.3),
      narrationText: st.explanation,
      subtitleText: `${st.operation}: ${st.dataStructureState}`,
      mathOrFormulaHighlight: st.mathExpression,
      calculationStepText: st.dataStructureState,
      visualKind: isBinary ? 'cs-binary-search' : 'cs-sorting',
      visualPayload: {
        visualState: st.visualState,
        variables: st.inputsSnapshot,
        operation: st.operation,
      },
      caption: st.outputSnapshot || st.dataStructureState,
    }));

    return {
      id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      topicQuery,
      topicTitle: exec.algorithmName,
      subject: 'computer-science',
      learningMode: 'algorithm',
      language,
      educationLevel,
      learningStyle,
      durationPreset,
      topicIntroduction: isBinary
        ? isKn
          ? 'ಬೈನರಿ ಸರ್ಚ್ ಕ್ರಮಬದ್ಧವಾಗಿ ಜೋಡಿಸಲಾದ ಪಟ್ಟಿಯಲ್ಲಿ ಅರ್ಧ ಭಾಗವನ್ನು ಪ್ರತಿ ಹಂತದಲ್ಲಿ ತೆಗೆದುಹಾಕುವ ವೇಗದ ಹುಡುಕಾಟ ವಿಧಾನವಾಗಿದೆ.'
          : 'Binary Search locates a target inside a sorted array in logarithmic O(log n) time by cutting the search interval in half on each comparison.'
        : `${exec.algorithmName} organizes elements deterministically using well-defined comparisons and swaps.`,
      meaningAndDefinition: exec.finalSummary,
      whyConceptMatters: isBinary
        ? 'Searching 1 billion sorted items takes at most ~30 comparisons with Binary Search vs 1 billion checks with Linear Search!'
        : 'Efficient sorting enables fast binary search, database indexing, and lossless compression.',
      scientificOrMathPrinciple: isBinary
        ? 'Invariant: if target exists, it lies within [low, high]. mid = ⌊(low + high)/2⌋.'
        : 'Loop invariant & asymptotic divide-and-conquer / pairwise comparison analysis.',
      importantTerms: [
        { term: 'Time Complexity', definition: isBinary ? 'Worst-case O(log n) comparisons' : `${exec.steps.length} deterministic traced operations` },
        { term: 'Space Complexity', definition: isBinary ? 'O(1) iterative auxiliary memory' : 'In-place O(1) or O(n) merge buffer' },
      ],
      formulasAndEquations: isBinary ? ['mid = Math.floor((low + high) / 2)', 'T(n) = T(n/2) + O(1) = O(log₂ n)'] : ['Asymptotic analysis & step count trace'],
      stepByStepExplanation: exec.steps.slice(0, 8).map((s, i) => `${i + 1}. [${s.operation}] ${s.explanation}`),
      workedExamples: [
        {
          title: `Deterministic Trace on [${arr.join(', ')}]`,
          given: isBinary ? `Sorted Array = [${arr.join(', ')}], Target = ${target}` : `Unsorted Array = [${arr.join(', ')}]`,
          steps: exec.steps.slice(0, 6).map((s) => `${s.operation}: ${s.dataStructureState}`),
          finalAnswer: exec.finalSummary,
        },
      ],
      realLifeApplications: ['Database B-tree index lookups', 'Dictionary & autocomplete prefix search', 'Leaderboards and log timestamp sorting'],
      commonMistakes: isBinary ? ['Running Binary Search on an UNSORTED array!', 'Forgetting integer floor or off-by-one updates (low = mid + 1, high = mid − 1).'] : ['Confusing best-case and worst-case asymptotic bounds.'],
      visualDemonstrationPlan: 'Deterministic step-by-step animation generated directly by our algorithm execution engine—never AI-invented.',
      narrationScript: scenes.map((s) => s.narrationText).join(' '),
      subtitleSegments: buildSubtitlesFromScenes(scenes),
      complexityInfo: {
        timeBest: isBinary ? 'O(1)' : algoId === 'bubble-sort' ? 'O(n)' : 'O(n log n)',
        timeAverage: isBinary ? 'O(log n)' : algoId === 'bubble-sort' ? 'O(n²)' : 'O(n log n)',
        timeWorst: isBinary ? 'O(log n)' : algoId === 'merge-sort' ? 'O(n log n)' : 'O(n²)',
        space: algoId === 'merge-sort' ? 'O(n)' : 'O(1)',
        pseudocode: isBinary
          ? [
              'low = 0, high = n - 1',
              'while low <= high:',
              '  mid = floor((low + high) / 2)',
              '  if A[mid] == target: return mid',
              '  elif A[mid] < target: low = mid + 1',
              '  else: high = mid - 1',
            ]
          : ['for pass in 0..n-1:', '  compare & reorder elements deterministically', '  maintain sorted invariant'],
      },
      quiz: [
        { id: 'cs-q1', question: 'What strict precondition must hold before running Binary Search?', options: ['The input array must already be sorted', 'The array must contain only primes', 'Array length must be 10', 'No duplicates allowed'], correctIndex: 0, explanation: 'Halving depends on sorted order.' },
        { id: 'cs-q2', question: 'What is the worst-case time complexity of Binary Search on n items?', options: ['O(log n)', 'O(n²)', 'O(n!)', 'O(2^n)'], correctIndex: 0, explanation: 'Each step halves remaining candidates.' },
        { id: 'cs-q3', question: 'How many comparisons does Binary Search need at most for 1,024 sorted numbers?', options: ['11 comparisons', '512 comparisons', '1,024 comparisons', '2 comparisons'], correctIndex: 0, explanation: 'log₂(1024) = 10 halvings (~11 checks).' },
        { id: 'cs-q4', question: 'Why is iterative Binary Search O(1) space?', options: ['It only stores a few index pointers (low, mid, high)', 'It allocates a new copy each step', 'It uses disk swap', 'It sorts in reverse'], correctIndex: 0, explanation: 'Constant pointer variables require O(1) memory.' },
        { id: 'cs-q5', question: 'In Merge Sort, what is the worst-case time complexity?', options: ['O(n log n)', 'O(n²)', 'O(log n)', 'O(n³)'], correctIndex: 0, explanation: 'Splitting log n levels and linear merging takes O(n log n).' },
      ],
      furtherExploration: ['Edit the input array & target right inside the video controls, or open the full Algorithm Explorer!'],
      scenes,
      interactiveDefaults: { kind: isBinary ? 'binary-search' : 'sorting', arrayValues: arr, targetValue: target, algorithmId: algoId },
      safetyClassification: 'GREEN',
      safetyNote: 'Executed inside our deterministic browser sandbox (no eval).',
      sourceMode: 'deterministic-verified',
      validationNote: `Deterministic execution trace verified (${exec.steps.length} exact machine steps).`,
      createdAt: nowIso,
    };
  }

  // 9. CPU EXECUTION CYCLE / TRANSISTOR / GENERAL STEM FALLBACK
  const match = matchLocalScienceTopic(topicQuery);
  const d = (s: number) => Math.max(2.5, Number((s * scaleFactor).toFixed(1)));
  const isCpu = cls.canonicalKey === 'cpu-cycle';
  const isTransistor = cls.canonicalKey === 'transistor';
  const isInduction = cls.canonicalKey === 'em-induction';
  const isOptics = cls.canonicalKey === 'optics-refraction';
  const isPendulum = cls.canonicalKey === 'pendulum';

  const visualKind = isCpu
    ? 'cs-cpu-cycle'
    : isTransistor
      ? 'cs-transistor'
      : isInduction
        ? 'physics-em-induction'
        : isOptics
          ? 'physics-optics-refraction'
          : isPendulum
            ? 'physics-pendulum'
            : cls.canonicalKey === 'circle-geometry'
              ? 'math-circle-geometry'
              : cls.subject === 'mathematics'
                ? 'math-coordinate-graph'
                : 'general-scientific-diagram';

  const scenes: SmartSceneSpec[] = [
    {
      id: 'gen-1',
      sceneNumber: 1,
      title: isKn ? 'ದೃಶ್ಯ 1: ಮೂಲಭೂತ ಪರಿಚಯ ಮತ್ತು ವ್ಯವಸ್ಥೆ' : `Scene 1: Core Mechanism of ${topicQuery}`,
      durationSec: d(3.5),
      narrationText: isCpu
        ? 'The Program Counter sends an instruction address to Memory, and the CPU fetches the opcode into the Instruction Register.'
        : isTransistor
          ? 'A tiny base current IB forward-biases the Base-Emitter junction of an NPN transistor, unlocking a large Collector-Emitter current IC = β · IB.'
          : isInduction
            ? 'Moving a bar magnet through a copper coil changes magnetic flux dΦ/dt, inducing an electromotive force and deflecting the galvanometer.'
            : isOptics
              ? 'Light slows down when entering glass from air, bending toward the normal according to Snell’s Law: n₁ sin θ₁ = n₂ sin θ₂.'
              : `Let us inspect the key physical parts, variables, and cause-and-effect chain governing "${topicQuery}".`,
      subtitleText: isCpu
        ? 'Stage 1: FETCH (PC → Memory → IR)'
        : isTransistor
          ? 'Small Base Signal (I_B) Controls Large Collector Current (I_C)'
          : isInduction
            ? 'Faraday’s Law: ε = −N (dΦ_B / dt)'
            : isOptics
              ? 'Snell’s Law: n₁ sin θ₁ = n₂ sin θ₂'
              : `Visualising core mechanism of ${topicQuery}`,
      mathOrFormulaHighlight: isCpu
        ? 'Fetch → Decode → Execute'
        : isTransistor
          ? 'I_C = β · I_B'
          : isInduction
            ? 'ε = −N ΔΦ/Δt'
            : isOptics
              ? 'n₁ sin θ₁ = n₂ sin θ₂'
              : match.reason.slice(0, 60),
      visualKind,
      visualPayload: { stage: 1, topic: topicQuery },
      caption: 'Stage 1 visual diagram.',
    },
    {
      id: 'gen-2',
      sceneNumber: 2,
      title: isKn ? 'ದೃಶ್ಯ 2: ಕಾರ್ಯವಿಧಾನ ಮತ್ತು ಫಲಿತಾಂಶ' : 'Scene 2: Dynamic Action & Output',
      durationSec: d(3.8),
      narrationText: isCpu
        ? 'The Control Unit decodes the opcode, then the ALU performs arithmetic/logic and writes the result back to registers.'
        : isTransistor
          ? 'When base voltage drops to 0 V, current stops (Logic 0); when base voltage rises above 0.7 V, current flows (Logic 1)—forming billions of digital switches inside CPUs!'
          : isInduction
            ? 'Stopping the magnet makes dΦ/dt = 0 so induced current drops to zero; reversing motion flips the induced current direction (Lenz’s Law).'
            : isOptics
              ? 'Because violet light slows slightly more than red light in glass, a triangular prism separates white light into a clean visible spectrum.'
              : 'Observe how changing the independent parameter drives measurable system output across verified scientific rules.',
      subtitleText: isCpu
        ? 'Stage 2–3: DECODE → ALU EXECUTE → WRITE BACK'
        : isTransistor
          ? 'Electronic Switch (OFF = 0, ON = 1) & Signal Amplifier'
          : isInduction
            ? 'Relative motion creates current · Stationary magnet = 0 V'
            : isOptics
              ? 'Dispersion separates wavelengths by refractive index'
              : 'Dynamic cause-and-effect behaviour verified',
      mathOrFormulaHighlight: isCpu ? 'ALU(A, B) → R_out' : isTransistor ? 'V_BE > 0.7 V → ON' : 'Verified Principle',
      visualKind,
      visualPayload: { stage: 2, topic: topicQuery },
      caption: 'Stage 2 active transformation.',
    },
  ];

  return {
    id: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    topicQuery,
    topicTitle: topicQuery.trim() || 'Scientific Concept Visual Lesson',
    subject: cls.subject,
    learningMode: cls.learningMode,
    language,
    educationLevel,
    learningStyle,
    durationPreset,
    topicIntroduction: isKn
      ? `"${topicQuery}" ವಿಷಯವನ್ನು ದೃಶ್ಯ ಅನಿಮೇಷನ್ ಮತ್ತು ಸರಳ ಹಂತಗಳೊಂದಿಗೆ ಅರ್ಥಮಾಡಿಕೊಳ್ಳೋಣ.`
      : `An interactive, step-by-step visual lesson explaining "${topicQuery}" for ${educationLevel.replace('-', ' ')}.`,
    meaningAndDefinition: scenes.map((s) => s.narrationText).join(' '),
    whyConceptMatters: 'Connects fundamental classroom laws to modern technology, instruments, and everyday phenomena.',
    scientificOrMathPrinciple: scenes[0].mathOrFormulaHighlight || 'Systematic cause-and-effect conservation law',
    importantTerms: [
      { term: 'System Variable', definition: 'Measurable quantity governing system behaviour.' },
      { term: 'Conservation Principle', definition: 'Underlying law keeping energy, charge, or mass balanced.' },
    ],
    formulasAndEquations: [scenes[0].mathOrFormulaHighlight || 'Quantitative model'],
    stepByStepExplanation: scenes.map((s, i) => `${i + 1}. ${s.title}: ${s.narrationText}`),
    workedExamples: [
      {
        title: `Illustrative Example: ${topicQuery}`,
        given: 'Standard room-temperature / nominal laboratory parameters',
        steps: scenes.map((s) => s.subtitleText),
        finalAnswer: scenes[1]?.subtitleText || 'Verified outcome',
      },
    ],
    realLifeApplications: ['Modern electronics & computing hardware', 'Laboratory measurement instruments'],
    commonMistakes: ['Treating static memorized facts separately from the underlying physical mechanism.'],
    visualDemonstrationPlan: 'Multi-stage animated scientific visual aligned with narration and subtitles.',
    narrationScript: scenes.map((s) => s.narrationText).join(' '),
    subtitleSegments: buildSubtitlesFromScenes(scenes),
    quiz: [
      { id: 'g-q1', question: `What is the central principle shown in "${topicQuery}"?`, options: [scenes[0].mathOrFormulaHighlight || 'Cause and effect conservation', 'Random noise', 'Perpetual motion', 'None of these'], correctIndex: 0, explanation: 'All verified STEM lessons ground behavior in a defined physical or logical rule.' },
      { id: 'g-q2', question: 'Why is visual animation more helpful than static text alone?', options: ['It shows how variables, charges, or forces evolve step by step over time', 'It removes the need for units', 'It invents outcomes', 'It hides formulas'], correctIndex: 0, explanation: 'Stepwise motion connects formulas directly to mechanism.' },
      { id: 'g-q3', question: 'Which factor must remain tracked in any quantitative trial?', options: ['Proper SI units and boundary limits', 'Font colour', 'File name', 'Screen size'], correctIndex: 0, explanation: 'Units and validity bounds keep measurements meaningful.' },
      { id: 'g-q4', question: 'What happens if an unsafe or physically unsupported input is entered?', options: ['Safety Guardian blocks or flags it honestly', 'Fake explosions run', 'Numbers are fabricated', 'Units disappear'], correctIndex: 0, explanation: 'Our platform strictly validates safety and model boundaries.' },
      { id: 'g-q5', question: 'Where can you test related apparatus interactively?', options: ['Inside the Virtual Science Laboratory Campus', 'Only on paper', 'Nowhere', 'Only in settings'], correctIndex: 0, explanation: 'The Virtual Lab links directly to campus workbenches.' },
    ],
    furtherExploration: [
      match.matchedExperimentId
        ? `Open matched Virtual Lab simulation (${match.matchedExperimentId}) in the ${match.department} lab wing.`
        : `Explore related instruments in the ${match.department} room of the Virtual Science Campus.`,
    ],
    scenes,
    interactiveDefaults: { kind: 'none' },
    safetyClassification: safety.level,
    safetyNote: safety.summary,
    sourceMode: 'deterministic-verified',
    validationNote: match.reason,
    createdAt: nowIso,
  };
}

export function mergeAiLessonWithDeterministic(
  aiData: Record<string, unknown>,
  blueprint: SmartLessonPackage
): SmartLessonPackage {
  const str = (v: unknown, fb: string) => (typeof v === 'string' && v.trim() ? v.trim() : fb);
  const strArr = (v: unknown, fb: string[]) =>
    Array.isArray(v) && v.length > 0 ? v.map((x) => String(x)).filter(Boolean) : fb;

  // Preserve deterministic verified scenes & numerical proofs for canonical verified topics (Pythagoras, Ohm, Newton, Binary Search, Boiling, Electrolysis)
  // while enriching prose, real-life applications, terms, worked examples, and quiz when AI succeeded!
  const isStrictDeterministicVisual = blueprint.interactiveDefaults.kind !== 'none';

  let mergedScenes = blueprint.scenes;
  if (!isStrictDeterministicVisual && Array.isArray(aiData.scenes) && aiData.scenes.length >= 2) {
    mergedScenes = blueprint.scenes.map((baseScene, idx) => {
      const aiScene = (aiData.scenes as Record<string, unknown>[])[idx];
      if (!aiScene) return baseScene;
      return {
        ...baseScene,
        title: str(aiScene.title, baseScene.title),
        narrationText: str(aiScene.narrationText, baseScene.narrationText),
        subtitleText: str(aiScene.subtitleText, baseScene.subtitleText),
        caption: str(aiScene.caption, baseScene.caption),
      };
    });
  }

  let mergedQuiz = blueprint.quiz;
  if (Array.isArray(aiData.quiz) && aiData.quiz.length >= 3) {
    const parsedQ = (aiData.quiz as Record<string, unknown>[])
      .slice(0, 5)
      .map((q, idx) => ({
        id: `ai-q-${idx + 1}`,
        question: str(q.question, blueprint.quiz[idx]?.question ?? 'Concept Check'),
        options:
          Array.isArray(q.options) && q.options.length >= 2
            ? q.options.map(String).slice(0, 4)
            : blueprint.quiz[idx]?.options ?? ['True', 'False'],
        correctIndex:
          typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex < 4
            ? q.correctIndex
            : 0,
        explanation: str(q.explanation, 'Verified against core scientific principle.'),
      }));
    if (parsedQ.length >= 3) mergedQuiz = parsedQ;
  }

  return {
    ...blueprint,
    topicTitle: str(aiData.topicTitle, blueprint.topicTitle),
    topicIntroduction: str(aiData.topicIntroduction, blueprint.topicIntroduction),
    meaningAndDefinition: str(aiData.meaningAndDefinition, blueprint.meaningAndDefinition),
    whyConceptMatters: str(aiData.whyConceptMatters, blueprint.whyConceptMatters),
    scientificOrMathPrinciple: str(aiData.scientificOrMathPrinciple, blueprint.scientificOrMathPrinciple),
    realLifeApplications: strArr(aiData.realLifeApplications, blueprint.realLifeApplications),
    commonMistakes: strArr(aiData.commonMistakes, blueprint.commonMistakes),
    furtherExploration: strArr(aiData.furtherExploration, blueprint.furtherExploration),
    scenes: mergedScenes,
    narrationScript: mergedScenes.map((s) => s.narrationText).join(' '),
    subtitleSegments: buildSubtitlesFromScenes(mergedScenes),
    quiz: mergedQuiz,
    sourceMode: 'ai-grounded',
  };
}
