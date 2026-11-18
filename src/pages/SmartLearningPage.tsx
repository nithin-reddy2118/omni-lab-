import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BookOpen,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ClipboardList,
  Code2,
  Film,
  FlaskConical,
  HelpCircle,
  History,
  Loader2,
  RotateCcw,
  Send,
  ShieldAlert,
  Sliders,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { buildDeterministicSmartLesson } from '../engine/smartLessonEngine';
import { getSafetyBadgeMeta } from '../engine/safetyEngine';
import type { SafetyEvaluation } from '../types/science';
import type {
  EducationLevel,
  EnvironmentCapabilities,
  LearningStyle,
  SmartLanguage,
  SmartLessonPackage,
  SmartSubject,
  VideoDurationPreset,
} from '../types/smartLearning';
import { ConceptVideoPlayer } from '../components/smart/ConceptVideoPlayer';
import { ProcedureFirstExperimentView } from '../components/smart/ProcedureFirstExperimentView';

const CURATED_TOPICS: { label: string; query: string; subject: SmartSubject | 'auto' }[] = [
  { label: 'Pythagoras Theorem', query: 'Pythagoras theorem proof a^2 + b^2 = c^2', subject: 'mathematics' },
  { label: 'Binary Search', query: 'Binary Search algorithm on sorted array', subject: 'computer-science' },
  { label: "Ohm's Law", query: "Ohm's law V = IR circuit simulation", subject: 'physics' },
  { label: "Newton's 2nd Law", query: "Newton's second law F = ma", subject: 'physics' },
  { label: 'Boiling at Altitude', query: 'Why does water boil at a lower temperature on mountains?', subject: 'chemistry' },
  { label: 'Electrolysis of Water', query: 'Electrolysis of water 2H2O -> 2H2 + O2', subject: 'chemistry' },
  { label: 'Photosynthesis', query: 'Photosynthesis light saturation reaction in leaves', subject: 'biology' },
  { label: 'Merge Sort', query: 'Merge Sort divide and conquer algorithm', subject: 'computer-science' },
  { label: 'CPU Fetch-Decode-Execute', query: 'How does a CPU execute instructions fetch decode execute', subject: 'computer-science' },
  { label: 'Faraday EM Induction', query: 'Faraday electromagnetic induction moving magnet in coil', subject: 'physics' },
];

const SUBJECT_OPTIONS: { value: SmartSubject | 'auto'; label: string }[] = [
  { value: 'auto', label: 'Auto-Detect Subject' },
  { value: 'mathematics', label: 'Mathematics' },
  { value: 'physics', label: 'Physics' },
  { value: 'chemistry', label: 'Chemistry' },
  { value: 'biology', label: 'Biology' },
  { value: 'computer-science', label: 'Computer Science & Algorithms' },
  { value: 'engineering', label: 'Engineering' },
  { value: 'astronomy', label: 'Astronomy & Space' },
  { value: 'environmental', label: 'Environmental Science' },
];

const PIPELINE_STEPS = [
  '1. Ask & Classify Topic',
  '2. Verify Safety & Science',
  '3. Build Animated Canvas Scenes',
  '4. Prepare Quiz & Lab Guide',
];

export function SmartLearningPage() {
  const {
    language,
    smartLessonHistory,
    saveSmartLesson,
    toggleSaveSmartLesson,
    deleteSmartLesson,
    recordSmartQuizAttempt,
    recordSafetyCheck,
    smartLearningPrefillQuery,
    setSmartLearningPrefillQuery,
    reopenSmartLessonId,
    setReopenSmartLessonId,
    navigate,
    setWorkbenchHandoff,
  } = useLab();

  const [query, setQuery] = useState('Pythagoras theorem proof a^2 + b^2 = c^2');
  const [subject, setSubject] = useState<SmartSubject | 'auto'>('auto');
  const [educationLevel, setEducationLevel] = useState<EducationLevel>('classes-8-10');
  const [learningStyle, setLearningStyle] = useState<LearningStyle>('visual');
  const [durationPreset, setDurationPreset] = useState<VideoDurationPreset>('standard');
  const [lessonLang, setLessonLang] = useState<SmartLanguage>(
    language === 'kn' ? 'kn' : language === 'hi' ? 'hi' : 'en'
  );

  const [capabilities, setCapabilities] = useState<EnvironmentCapabilities | null>(null);
  const [lesson, setLesson] = useState<SmartLessonPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [pipelineStepIdx, setPipelineStepIdx] = useState(0);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [blockedSafety, setBlockedSafety] = useState<SafetyEvaluation | null>(null);

  const [detailTab, setDetailTab] = useState<'overview' | 'examples' | 'procedure' | 'quiz'>('overview');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Interactive Animation Sliders
  const [paramA, setParamA] = useState(3);
  const [paramB, setParamB] = useState(4);
  const [forceN, setForceN] = useState(20);
  const [massKg, setMassKg] = useState(5);
  const [voltageV, setVoltageV] = useState(12);
  const [resistanceOhm, setResistanceOhm] = useState(4);

  const inFlightRef = useRef(false);
  const playerTopRef = useRef<HTMLDivElement | null>(null);
  const quizRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/smart-learning/capabilities')
      .then((r) => r.json())
      .then((d: EnvironmentCapabilities) => setCapabilities(d))
      .catch(() => setCapabilities(null));
  }, []);

  useEffect(() => {
    if (!loading) {
      setPipelineStepIdx(0);
      return;
    }
    const timer = window.setInterval(() => {
      setPipelineStepIdx((prev) => Math.min(PIPELINE_STEPS.length - 1, prev + 1));
    }, 1400);
    return () => window.clearInterval(timer);
  }, [loading]);

  const syncInteractiveDefaults = (pkg: SmartLessonPackage) => {
    const d = pkg.interactiveDefaults;
    if (d.a !== undefined) setParamA(d.a);
    if (d.b !== undefined) setParamB(d.b);
    if (d.forceN !== undefined) setForceN(d.forceN);
    if (d.massKg !== undefined) setMassKg(d.massKg);
    if (d.voltageV !== undefined) setVoltageV(d.voltageV);
    if (d.resistanceOhm !== undefined) setResistanceOhm(d.resistanceOhm);
  };

  const runGenerate = useCallback(
    async (
      targetQuery: string,
      opts?: {
        lang?: SmartLanguage;
        subj?: SmartSubject | 'auto';
        lvl?: EducationLevel;
        style?: LearningStyle;
        dur?: VideoDurationPreset;
      }
    ) => {
      const clean = targetQuery.trim();
      if (!clean || inFlightRef.current) return;
      inFlightRef.current = true;

      const useLang = opts?.lang ?? lessonLang;
      const useSubj = opts?.subj ?? subject;
      const useLvl = opts?.lvl ?? educationLevel;
      const useStyle = opts?.style ?? learningStyle;
      const useDur = opts?.dur ?? durationPreset;

      setQuery(clean);
      setLessonLang(useLang);
      setLoading(true);
      setAiNotice(null);
      setBlockedSafety(null);
      setQuizAnswers({});
      setQuizSubmitted(false);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 18000);

      try {
        const res = await fetch('/api/smart-learning/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicQuery: clean,
            language: useLang,
            educationLevel: useLvl,
            learningStyle: useStyle,
            durationPreset: useDur,
            preferredSubject: useSubj,
          }),
          signal: controller.signal,
        });
        const data = await res.json();
        if (data.capabilities) setCapabilities(data.capabilities);
        if (data.safety) recordSafetyCheck(clean, data.safety.level);

        if (data.blockedBySafety) {
          setBlockedSafety(data.safety);
          setLesson(null);
          return;
        }

        if (!res.ok || !data.lesson) {
          throw new Error(data.error || 'Could not generate AI-enriched lesson.');
        }

        const pkg = data.lesson as SmartLessonPackage;
        setLesson(pkg);
        syncInteractiveDefaults(pkg);
        saveSmartLesson(pkg);
        if (data.aiWarning) setAiNotice(data.aiWarning);
      } catch (err) {
        const fallback = buildDeterministicSmartLesson({
          topicQuery: clean,
          language: useLang,
          educationLevel: useLvl,
          learningStyle: useStyle,
          durationPreset: useDur,
          preferredSubject: useSubj,
        });
        setLesson(fallback);
        syncInteractiveDefaults(fallback);
        saveSmartLesson(fallback);
        setAiNotice(
          err instanceof DOMException && err.name === 'AbortError'
            ? 'AI response timed out after 18s; loaded instant verified deterministic STEM lesson.'
            : 'Using verified deterministic STEM lesson engine.'
        );
      } finally {
        window.clearTimeout(timeoutId);
        inFlightRef.current = false;
        setLoading(false);
      }
    },
    [durationPreset, educationLevel, learningStyle, lessonLang, recordSafetyCheck, saveSmartLesson, subject]
  );

  // Consume deep-link handoff or reopen stored lesson
  useEffect(() => {
    if (reopenSmartLessonId) {
      const found = smartLessonHistory.find(
        (h) => h.id === reopenSmartLessonId || h.lesson.id === reopenSmartLessonId
      );
      setReopenSmartLessonId(null);
      if (found) {
        setLesson(found.lesson);
        setQuery(found.lesson.topicQuery);
        setLessonLang(found.lesson.language);
        syncInteractiveDefaults(found.lesson);
        setQuizAnswers({});
        setQuizSubmitted(false);
        return;
      }
    }

    if (smartLearningPrefillQuery) {
      const nextQ = smartLearningPrefillQuery;
      setSmartLearningPrefillQuery(null);
      setQuery(nextQ);
      void runGenerate(nextQ);
      return;
    }

    if (!lesson && !loading) {
      void runGenerate(query);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reopenSmartLessonId, smartLearningPrefillQuery]);

  const historyEntry = useMemo(
    () =>
      lesson
        ? smartLessonHistory.find((h) => h.id === lesson.id || h.lesson.id === lesson.id)
        : undefined,
    [lesson, smartLessonHistory]
  );

  const interactiveParams = useMemo(() => {
    if (!lesson) return undefined;
    switch (lesson.interactiveDefaults.kind) {
      case 'pythagoras':
        return { a: paramA, b: paramB };
      case 'newtons-law':
        return { forceN, massKg };
      case 'ohms-law':
        return { voltageV, resistanceOhm };
      default:
        return undefined;
    }
  }, [lesson, paramA, paramB, forceN, massKg, voltageV, resistanceOhm]);

  const quizScore = useMemo(() => {
    if (!lesson) return 0;
    return lesson.quiz.reduce(
      (sum, q) => sum + (quizAnswers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
  }, [lesson, quizAnswers]);

  const handleSubmitQuiz = () => {
    if (!lesson) return;
    setQuizSubmitted(true);
    recordSmartQuizAttempt({
      id: `quiz-${Date.now()}`,
      lessonId: lesson.id,
      topicTitle: lesson.topicTitle,
      subject: lesson.subject,
      language: lesson.language,
      score: quizScore,
      total: lesson.quiz.length,
      completedAt: new Date().toISOString(),
    });
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Studio Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Film className="w-4 h-4" />
            Universal Smart Learning &amp; Animated Concept Video Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Smart Video Studio
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-3xl">
            Ask any theorem, physical law, chemistry reaction, biology mechanism, or algorithm. Follow our 7-stage learning loop: Ask → Understand → Watch Canvas Animation + Gemini TTS → Explore Sliders → Run Procedure-First Lab → Observe → Quiz &amp; Export Real H.264 MP4.
          </p>
        </div>

        {capabilities && (
          <div className="rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs space-y-0.5 shadow-xs">
            <div className="font-semibold text-slate-900">Media Pipeline Capabilities</div>
            <div className="font-mono text-[11px] text-slate-600">
              Canvas 2D + FFmpeg {capabilities.ffmpegInstalled ? 'Ready' : 'Unavailable'} · TTS{' '}
              {capabilities.geminiConfigured ? 'Gemini Ready' : 'Offline Subtitles'}
            </div>
          </div>
        )}
      </div>

      {/* Topic Generator Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void runGenerate(query);
        }}
        className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm"
      >
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            aria-label="Enter any STEM concept, theorem, reaction, or algorithm"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Pythagoras theorem, Ohm's law, Binary Search, Electrolysis of water..."
            className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:border-blue-600 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-5 py-3 rounded-xl bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Generating Video Lesson...' : 'Generate Concept Video'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
          <div>
            <label className="text-slate-600 font-medium block mb-1">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value as SmartSubject | 'auto')}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
            >
              {SUBJECT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Education Level</label>
            <select
              value={educationLevel}
              onChange={(e) => setEducationLevel(e.target.value as EducationLevel)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
            >
              <option value="classes-5-7">Classes 5–7</option>
              <option value="classes-8-10">Classes 8–10</option>
              <option value="classes-11-12">Classes 11–12</option>
              <option value="undergraduate">Undergraduate</option>
              <option value="engineering">Engineering</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Learning Style</label>
            <select
              value={learningStyle}
              onChange={(e) => setLearningStyle(e.target.value as LearningStyle)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
            >
              <option value="visual">Visual Animation</option>
              <option value="simple">Simple &amp; Intuitive</option>
              <option value="detailed">Detailed Derivation</option>
              <option value="practical">Practical Lab Focus</option>
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Video Duration</label>
            <select
              value={durationPreset}
              onChange={(e) => setDurationPreset(e.target.value as VideoDurationPreset)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
            >
              <option value="short">Short (~15s)</option>
              <option value="standard">Standard (~25s)</option>
              <option value="detailed">Detailed (~35s)</option>
            </select>
          </div>

          <div>
            <label className="text-slate-600 font-medium block mb-1">Narration &amp; Subtitles</label>
            <select
              value={lessonLang}
              onChange={(e) => setLessonLang(e.target.value as SmartLanguage)}
              className="w-full px-2.5 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
            >
              <option value="en">English (en)</option>
              <option value="kn">ಕನ್ನಡ (kn)</option>
              <option value="hi">हिन्दी (hi)</option>
            </select>
          </div>
        </div>

        {/* 10 Curated Instant STEM Topics */}
        <div className="space-y-1.5 pt-1">
          <div className="text-xs text-slate-500">Curated STEM Video Presets:</div>
          <div className="flex flex-wrap gap-1.5">
            {CURATED_TOPICS.map((t) => (
              <button
                key={t.label}
                type="button"
                onClick={() => {
                  setSubject(t.subject);
                  void runGenerate(t.query, { subj: t.subject });
                }}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-blue-700 hover:border-blue-400"
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {loading && (
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-2 text-xs">
            <div className="font-semibold text-blue-800">{PIPELINE_STEPS[pipelineStepIdx]}</div>
            <div className="grid sm:grid-cols-4 gap-2">
              {PIPELINE_STEPS.map((st, idx) => (
                <div
                  key={st}
                  className={`px-2.5 py-1.5 rounded border ${
                    idx <= pipelineStepIdx
                      ? 'border-blue-300 bg-white text-slate-900 font-medium'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {blockedSafety && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <ShieldAlert className="w-5 h-5" />
            {blockedSafety.title}
          </div>
          <p className="text-sm text-slate-900">{blockedSafety.summary}</p>
          <p className="text-xs text-emerald-800 font-medium">
            Safe Virtual Alternative: {blockedSafety.safeVirtualAlternative}
          </p>
        </div>
      )}

      {lesson && !loading && (
        <div ref={playerTopRef} className="space-y-6">
          {aiNotice && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-xs text-amber-900 flex items-center justify-between gap-3">
              <span>{aiNotice}</span>
              <button
                type="button"
                onClick={() => runGenerate(lesson.topicQuery)}
                className="font-semibold underline flex items-center gap-1 shrink-0"
              >
                <RotateCcw className="w-3 h-3" /> Retry AI Enrichment
              </button>
            </div>
          )}

          {/* Lesson Title + Bookmark + Safety + Validation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 flex flex-wrap items-center justify-between gap-4 shadow-sm">
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold text-blue-700 uppercase">{lesson.subject}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-600">{lesson.learningMode.replace('-', ' ')}</span>
                <span className="text-slate-400">·</span>
                <span className="font-mono text-slate-500">
                  {lesson.sourceMode === 'ai-grounded' ? 'AI Grounded + Verified' : 'Deterministic Engine'}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                {lesson.topicTitle}
              </h2>
              <p className="text-xs text-slate-600">{lesson.validationNote}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                  getSafetyBadgeMeta(lesson.safetyClassification).bgClass
                } ${getSafetyBadgeMeta(lesson.safetyClassification).borderClass} ${
                  getSafetyBadgeMeta(lesson.safetyClassification).colorClass
                }`}
              >
                {getSafetyBadgeMeta(lesson.safetyClassification).label}
              </span>
              <button
                type="button"
                onClick={() => toggleSaveSmartLesson(lesson.id)}
                className={`px-3.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                  historyEntry?.saved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400'
                }`}
              >
                {historyEntry?.saved ? (
                  <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                ) : (
                  <Bookmark className="w-4 h-4" />
                )}
                {historyEntry?.saved ? 'Saved in My Learning' : 'Bookmark Lesson'}
              </button>
              {lesson.experimentPrep?.virtualLabExperimentId && (
                <button
                  type="button"
                  onClick={() => {
                    setWorkbenchHandoff({
                      department: lesson.experimentPrep!.virtualLabDepartment,
                      experimentId: lesson.experimentPrep!.virtualLabExperimentId ?? undefined,
                      equipmentIds: lesson.experimentPrep!.virtualLabEquipmentIds,
                      chemicalIds: lesson.experimentPrep!.virtualLabChemicalIds,
                      enterRoomDirectly: true,
                    });
                    navigate('virtual-lab', {
                      experimentId: lesson.experimentPrep!.virtualLabExperimentId ?? undefined,
                    });
                  }}
                  className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Launch Virtual Lab
                </button>
              )}
            </div>
          </div>

          {/* Interactive Parameters Feeding ConceptVideoPlayer */}
          {lesson.interactiveDefaults.kind !== 'none' &&
            ['pythagoras', 'newtons-law', 'ohms-law'].includes(lesson.interactiveDefaults.kind) && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 space-y-2.5">
                <div className="text-xs font-bold text-blue-800 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" />
                  Interactive Visual Simulation Controls (Updates Canvas &amp; MP4 Export)
                </div>

                {lesson.interactiveDefaults.kind === 'pythagoras' && (
                  <div className="grid sm:grid-cols-3 gap-4 items-center text-xs">
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Side a</span>
                        <strong className="text-blue-700">{paramA}</strong>
                      </div>
                      <input type="range" min={1} max={12} step={1} value={paramA} onChange={(e) => setParamA(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Side b</span>
                        <strong className="text-blue-700">{paramB}</strong>
                      </div>
                      <input type="range" min={1} max={12} step={1} value={paramB} onChange={(e) => setParamB(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                      a² + b² = {paramA * paramA + paramB * paramB} · c ={' '}
                      <strong className="text-emerald-700">
                        {Math.sqrt(paramA * paramA + paramB * paramB).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}

                {lesson.interactiveDefaults.kind === 'newtons-law' && (
                  <div className="grid sm:grid-cols-3 gap-4 items-center text-xs">
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Applied Force F</span>
                        <strong className="text-blue-700">{forceN} N</strong>
                      </div>
                      <input type="range" min={2} max={100} step={2} value={forceN} onChange={(e) => setForceN(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Mass m</span>
                        <strong className="text-blue-700">{massKg} kg</strong>
                      </div>
                      <input type="range" min={1} max={25} step={1} value={massKg} onChange={(e) => setMassKg(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                      a = F / m ={' '}
                      <strong className="text-emerald-700">{(forceN / massKg).toFixed(2)} m/s²</strong>
                    </div>
                  </div>
                )}

                {lesson.interactiveDefaults.kind === 'ohms-law' && (
                  <div className="grid sm:grid-cols-3 gap-4 items-center text-xs">
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Supply Voltage V</span>
                        <strong className="text-blue-700">{voltageV} V</strong>
                      </div>
                      <input type="range" min={1} max={24} step={1} value={voltageV} onChange={(e) => setVoltageV(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div>
                      <div className="flex justify-between font-mono">
                        <span>Resistance R</span>
                        <strong className="text-blue-700">{resistanceOhm} Ω</strong>
                      </div>
                      <input type="range" min={1} max={50} step={1} value={resistanceOhm} onChange={(e) => setResistanceOhm(Number(e.target.value))} className="w-full accent-blue-700" />
                    </div>
                    <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                      I = V / R ={' '}
                      <strong className="text-emerald-700">{(voltageV / resistanceOhm).toFixed(2)} A</strong>
                    </div>
                  </div>
                )}
              </div>
            )}

          {/* Theater Canvas Video + TTS + Real FFmpeg MP4 Export */}
          <ConceptVideoPlayer
            lesson={lesson}
            capabilities={capabilities}
            interactiveParams={interactiveParams}
            onLanguageSwitch={(lang) => void runGenerate(lesson.topicQuery, { lang })}
            onMp4Generated={(mp4Url, durationSec) =>
              saveSmartLesson(lesson, {
                renderedMp4Url: mp4Url,
                renderedVideoDurationSec: durationSec,
              })
            }
          />

          {/* 4 Detailed Content Tabs */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm">
            <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
              {[
                { id: 'overview' as const, label: '15-Section Overview & Formulas', icon: BookOpen },
                { id: 'examples' as const, label: 'Step-by-Step, Worked Examples & Mistakes', icon: Sparkles },
                { id: 'procedure' as const, label: 'Procedure-First Virtual Lab / Pseudocode', icon: ClipboardList },
                { id: 'quiz' as const, label: `5-Question Quiz (${lesson.quiz.length})`, icon: HelpCircle },
              ].map((t) => {
                const Icon = t.icon;
                const active = detailTab === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailTab(t.id)}
                    className={`px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 ${
                      active
                        ? 'bg-blue-700 text-white'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {t.label}
                  </button>
                );
              })}
            </div>

            {detailTab === 'overview' && (
              <div className="space-y-4 text-sm">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="text-xs font-bold text-blue-700 uppercase">Introduction &amp; Definition</div>
                    <p className="text-slate-800">{lesson.topicIntroduction}</p>
                    <p className="text-xs text-slate-700">{lesson.meaningAndDefinition}</p>
                  </div>
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                    <div className="text-xs font-bold text-emerald-700 uppercase">Why It Matters &amp; Core Principle</div>
                    <p className="text-slate-800">{lesson.whyConceptMatters}</p>
                    <p className="text-xs font-medium text-blue-800">{lesson.scientificOrMathPrinciple}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-900 uppercase">Formulas &amp; Important Terms</div>
                    <div className="space-y-1.5">
                      {lesson.formulasAndEquations.map((f, i) => (
                        <div key={i} className="font-mono text-xs bg-blue-50 border border-blue-200 rounded px-3 py-1.5 text-blue-900">
                          {f}
                        </div>
                      ))}
                    </div>
                    <ul className="space-y-1 text-xs text-slate-700 pt-2">
                      {lesson.importantTerms.map((t, i) => (
                        <li key={i}>
                          <strong>{t.term}:</strong> {t.definition}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                    <div className="text-xs font-bold text-slate-900 uppercase">Real-Life Applications &amp; Next Exploration</div>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-slate-700">
                      {lesson.realLifeApplications.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                    <div className="text-xs font-bold text-slate-900 uppercase pt-2">Visual &amp; Narration Plan</div>
                    <p className="text-xs text-slate-600">{lesson.visualDemonstrationPlan}</p>
                    <ul className="list-disc pl-4 space-y-1 text-xs text-blue-700">
                      {lesson.furtherExploration.map((fe, i) => (
                        <li key={i}>{fe}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'examples' && (
              <div className="space-y-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase">Step-by-Step Breakdown</div>
                  <ol className="list-decimal pl-5 space-y-1.5 text-sm text-slate-800">
                    {lesson.stepByStepExplanation.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-900 uppercase">Worked Numerical Examples</div>
                    {lesson.workedExamples.map((ex, idx) => (
                      <div key={idx} className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-1.5 text-xs">
                        <div className="font-bold text-slate-900 text-sm">{ex.title}</div>
                        <div className="text-slate-700"><strong>Given:</strong> {ex.given}</div>
                        <ol className="list-decimal pl-4 space-y-0.5 text-slate-700 font-mono">
                          {ex.steps.map((st, sIdx) => (
                            <li key={sIdx}>{st}</li>
                          ))}
                        </ol>
                        <div className="font-mono font-bold text-emerald-700 pt-1">
                          Answer: {ex.finalAnswer}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 space-y-2 text-xs">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                      <AlertTriangle className="w-4 h-4 text-amber-700" />
                      Common Student Mistakes to Avoid
                    </div>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-700">
                      {lesson.commonMistakes.map((m, i) => (
                        <li key={i}>{m}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {detailTab === 'procedure' && (
              <div className="space-y-5">
                {lesson.experimentPrep ? (
                  <ProcedureFirstExperimentView
                    prep={lesson.experimentPrep}
                    onJumpToDemo={() => playerTopRef.current?.scrollIntoView({ behavior: 'smooth' })}
                    onJumpToQuiz={() => {
                      setDetailTab('quiz');
                      quizRef.current?.scrollIntoView({ behavior: 'smooth' });
                    }}
                  />
                ) : null}

                {lesson.complexityInfo && (
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4">
                    <div className="text-xs font-bold text-blue-700 uppercase flex items-center gap-1.5">
                      <Code2 className="w-4 h-4" />
                      Algorithm Complexity &amp; Pseudocode
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="text-slate-500">Best Time</div>
                        <div className="font-bold text-slate-900 mt-0.5">{lesson.complexityInfo.timeBest}</div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="text-slate-500">Average Time</div>
                        <div className="font-bold text-slate-900 mt-0.5">{lesson.complexityInfo.timeAverage}</div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="text-slate-500">Worst Time</div>
                        <div className="font-bold text-slate-900 mt-0.5">{lesson.complexityInfo.timeWorst}</div>
                      </div>
                      <div className="rounded-lg bg-white border border-slate-200 p-3">
                        <div className="text-slate-500">Space</div>
                        <div className="font-bold text-slate-900 mt-0.5">{lesson.complexityInfo.space}</div>
                      </div>
                    </div>
                    <pre className="p-3.5 rounded-lg bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                      {lesson.complexityInfo.pseudocode.join('\n')}
                    </pre>
                  </div>
                )}

                {!lesson.experimentPrep && !lesson.complexityInfo && (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-600">
                    This conceptual topic uses animated diagrams rather than wet-lab apparatus. Explore the 15-Section Overview or Interactive Video above.
                  </div>
                )}
              </div>
            )}

            {detailTab === 'quiz' && (
              <div ref={quizRef} className="space-y-4">
                {lesson.quiz.map((q, idx) => {
                  const chosen = quizAnswers[q.id];
                  return (
                    <div key={q.id} className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                      <div className="text-sm font-semibold text-slate-900">
                        Q{idx + 1}. {q.question}
                      </div>
                      <div className="grid sm:grid-cols-2 gap-2">
                        {q.options.map((opt, optIdx) => {
                          const selected = chosen === optIdx;
                          const isRight = optIdx === q.correctIndex;
                          let cls = 'border-slate-200 bg-white text-slate-800 hover:border-blue-400';
                          if (quizSubmitted) {
                            if (isRight) cls = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                            else if (selected) cls = 'border-rose-400 bg-rose-50 text-rose-900';
                          } else if (selected) {
                            cls = 'border-blue-600 bg-blue-50 text-blue-900 font-semibold';
                          }
                          return (
                            <button
                              key={optIdx}
                              type="button"
                              disabled={quizSubmitted}
                              onClick={() => setQuizAnswers((prev) => ({ ...prev, [q.id]: optIdx }))}
                              className={`text-left px-3.5 py-2.5 rounded-lg border text-xs transition-colors ${cls}`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                      {quizSubmitted && (
                        <div className="text-xs text-slate-700 pt-1">
                          <strong>Explanation:</strong> {q.explanation}
                        </div>
                      )}
                    </div>
                  );
                })}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  {quizSubmitted ? (
                    <div className="text-sm font-semibold text-emerald-800 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      Quiz Score: {quizScore} / {lesson.quiz.length} saved to My Learning
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500">
                      Select an answer for all {lesson.quiz.length} questions to check mastery.
                    </div>
                  )}

                  {quizSubmitted ? (
                    <button
                      type="button"
                      onClick={() => {
                        setQuizAnswers({});
                        setQuizSubmitted(false);
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800"
                    >
                      Retake Quiz
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={Object.keys(quizAnswers).length < lesson.quiz.length}
                      onClick={handleSubmitQuiz}
                      className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40"
                    >
                      Submit &amp; Save Score
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Recent Smart Lesson History Strip */}
      {smartLessonHistory.length > 0 && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <History className="w-4 h-4 text-blue-700" />
              Recent Smart Video Lessons ({smartLessonHistory.length})
            </h3>
            <button
              type="button"
              onClick={() => navigate('my-learning')}
              className="text-xs font-semibold text-blue-700 hover:underline"
            >
              Manage All in My Learning →
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {smartLessonHistory.slice(0, 6).map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-start justify-between gap-2 text-xs"
              >
                <button
                  type="button"
                  onClick={() => {
                    setLesson(item.lesson);
                    setQuery(item.lesson.topicQuery);
                    setLessonLang(item.lesson.language);
                    syncInteractiveDefaults(item.lesson);
                    setQuizAnswers({});
                    setQuizSubmitted(false);
                    playerTopRef.current?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="text-left min-w-0 flex-1 space-y-0.5"
                >
                  <div className="font-semibold text-slate-900 truncate">{item.lesson.topicTitle}</div>
                  <div className="text-[11px] text-slate-500">
                    {item.lesson.subject} · {item.lesson.language.toUpperCase()}
                    {item.bestQuizScore !== undefined ? ` · Quiz ${item.bestQuizScore}/5` : ''}
                    {item.renderedMp4Url ? ' · MP4 Ready' : ''}
                  </div>
                </button>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    aria-label="Toggle bookmark"
                    onClick={() => toggleSaveSmartLesson(item.id)}
                    className="p-1.5 rounded text-slate-500 hover:text-emerald-700"
                  >
                    {item.saved ? (
                      <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <Bookmark className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    type="button"
                    aria-label="Delete lesson"
                    onClick={() => deleteSmartLesson(item.id)}
                    className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
