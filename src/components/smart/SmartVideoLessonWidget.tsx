import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  ClipboardList,
  Film,
  FlaskConical,
  HelpCircle,
  Loader2,
  Maximize2,
  RotateCcw,
  ShieldAlert,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { buildDeterministicSmartLesson } from '../../engine/smartLessonEngine';
import { getSafetyBadgeMeta } from '../../engine/safetyEngine';
import type { SafetyEvaluation } from '../../types/science';
import type {
  EnvironmentCapabilities,
  SmartLanguage,
  SmartLessonPackage,
  SmartSubject,
} from '../../types/smartLearning';
import { ConceptVideoPlayer } from './ConceptVideoPlayer';
import { ProcedureFirstExperimentView } from './ProcedureFirstExperimentView';

interface SmartVideoLessonWidgetProps {
  topicQuery: string;
  preferredSubject?: SmartSubject | 'auto';
  title?: string;
  subtitle?: string;
  autoGenerate?: boolean;
  compact?: boolean;
  relatedExperimentId?: string;
}

export function SmartVideoLessonWidget({
  topicQuery,
  preferredSubject = 'auto',
  title,
  subtitle,
  autoGenerate = false,
  compact = false,
}: SmartVideoLessonWidgetProps) {
  const {
    language,
    smartLessonHistory,
    saveSmartLesson,
    toggleSaveSmartLesson,
    recordSmartQuizAttempt,
    recordSafetyCheck,
    setReopenSmartLessonId,
    setSmartLearningPrefillQuery,
    navigate,
  } = useLab();

  const defaultLang: SmartLanguage = language === 'kn' ? 'kn' : 'en';

  const [capabilities, setCapabilities] = useState<EnvironmentCapabilities | null>(null);
  const [lesson, setLesson] = useState<SmartLessonPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [offlineNote, setOfflineNote] = useState<string | null>(null);
  const [blockedSafety, setBlockedSafety] = useState<SafetyEvaluation | null>(null);

  const [activeTab, setActiveTab] = useState<'video' | 'summary' | 'procedure' | 'quiz'>('video');
  const [quizAnswers, setQuizAnswers] = useState<Record<string, number>>({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);

  // Interactive Canvas Parameter State
  const [paramA, setParamA] = useState(3);
  const [paramB, setParamB] = useState(4);
  const [forceN, setForceN] = useState(20);
  const [massKg, setMassKg] = useState(5);
  const [voltageV, setVoltageV] = useState(12);
  const [resistanceOhm, setResistanceOhm] = useState(4);

  const lastQueryRef = useRef<string>('');
  const quizSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetch('/api/smart-learning/capabilities')
      .then((r) => r.json())
      .then((d: EnvironmentCapabilities) => setCapabilities(d))
      .catch(() =>
        setCapabilities({
          geminiConfigured: false,
          ffmpegInstalled: false,
          ffprobeInstalled: false,
          manimInstalled: false,
          pythonInstalled: false,
          ttsModel: 'gemini-3.8-flash-lite-tts',
          browserAnimationEngine: 'HTML5 Canvas 2D + Deterministic STEM Engine',
        })
      );
  }, []);

  const syncInteractiveDefaults = (pkg: SmartLessonPackage) => {
    const d = pkg.interactiveDefaults;
    if (d.a !== undefined) setParamA(d.a);
    if (d.b !== undefined) setParamB(d.b);
    if (d.forceN !== undefined) setForceN(d.forceN);
    if (d.massKg !== undefined) setMassKg(d.massKg);
    if (d.voltageV !== undefined) setVoltageV(d.voltageV);
    if (d.resistanceOhm !== undefined) setResistanceOhm(d.resistanceOhm);
  };

  const generateLesson = useCallback(
    async (queryToRun: string, lang: SmartLanguage = defaultLang) => {
      const clean = queryToRun.trim();
      if (!clean) return;
      setLoading(true);
      setError(null);
      setOfflineNote(null);
      setBlockedSafety(null);
      setQuizAnswers({});
      setQuizSubmitted(false);
      lastQueryRef.current = `${clean}::${lang}`;

      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 18000);

      try {
        const res = await fetch('/api/smart-learning/lesson', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topicQuery: clean,
            language: lang,
            educationLevel: 'classes-8-10',
            learningStyle: 'visual',
            durationPreset: compact ? 'short' : 'standard',
            preferredSubject,
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
          throw new Error(data.error || 'Smart Lesson endpoint returned an error.');
        }

        const pkg = data.lesson as SmartLessonPackage;
        setLesson(pkg);
        syncInteractiveDefaults(pkg);
        saveSmartLesson(pkg);
        if (data.aiWarning) {
          setOfflineNote(data.aiWarning);
        }
      } catch (err) {
        const fallback = buildDeterministicSmartLesson({
          topicQuery: clean,
          language: lang,
          educationLevel: 'classes-8-10',
          learningStyle: 'visual',
          durationPreset: compact ? 'short' : 'standard',
          preferredSubject,
        });
        setLesson(fallback);
        syncInteractiveDefaults(fallback);
        saveSmartLesson(fallback);
        const msg =
          err instanceof DOMException && err.name === 'AbortError'
            ? 'AI enrichment timed out; showing verified deterministic Canvas visual lesson.'
            : 'Using instant offline deterministic visual lesson engine.';
        setOfflineNote(msg);
      } finally {
        window.clearTimeout(timeoutId);
        setLoading(false);
      }
    },
    [compact, defaultLang, preferredSubject, recordSafetyCheck, saveSmartLesson]
  );

  useEffect(() => {
    const clean = topicQuery.trim();
    if (!autoGenerate || !clean) return;
    const key = `${clean}::${defaultLang}`;
    if (lastQueryRef.current !== key) {
      void generateLesson(clean, defaultLang);
    }
  }, [autoGenerate, topicQuery, defaultLang, generateLesson]);

  const historyEntry = useMemo(
    () =>
      lesson
        ? smartLessonHistory.find(
            (h) => h.id === lesson.id || h.lesson.id === lesson.id
          )
        : undefined,
    [lesson, smartLessonHistory]
  );

  const isSaved = Boolean(historyEntry?.saved);

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

  const handleOpenInStudio = () => {
    if (lesson) {
      saveSmartLesson(lesson);
      setReopenSmartLessonId(lesson.id);
    } else if (topicQuery.trim()) {
      setSmartLearningPrefillQuery(topicQuery.trim());
    }
    navigate('smart-learning');
  };

  const handleSubmitQuiz = () => {
    if (!lesson) return;
    let score = 0;
    lesson.quiz.forEach((q) => {
      if (quizAnswers[q.id] === q.correctIndex) score += 1;
    });
    setQuizSubmitted(true);
    recordSmartQuizAttempt({
      id: `quiz-${Date.now()}`,
      lessonId: lesson.id,
      topicTitle: lesson.topicTitle,
      subject: lesson.subject,
      language: lesson.language,
      score,
      total: lesson.quiz.length,
      completedAt: new Date().toISOString(),
    });
  };

  const quizScore = useMemo(() => {
    if (!lesson) return 0;
    return lesson.quiz.reduce(
      (sum, q) => sum + (quizAnswers[q.id] === q.correctIndex ? 1 : 0),
      0
    );
  }, [lesson, quizAnswers]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
      {/* Header Bar */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Film className="w-4 h-4" />
            {title || 'Smart Concept Video & Interactive Visual Lesson'}
          </div>
          <p className="text-xs text-slate-600 mt-0.5">
            {subtitle ||
              'Real HTML5 Canvas step-by-step animation, Gemini TTS narration, Procedure-First guide, 5-question quiz & FFmpeg H.264 MP4 download.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!lesson && !loading && (
            <button
              type="button"
              disabled={!topicQuery.trim()}
              onClick={() => generateLesson(topicQuery, defaultLang)}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center gap-1.5 min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Generate Animated Concept Video
            </button>
          )}

          {lesson && (
            <>
              <button
                type="button"
                onClick={() => toggleSaveSmartLesson(lesson.id)}
                className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 min-h-[36px] ${
                  isSaved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400'
                }`}
              >
                {isSaved ? (
                  <BookmarkCheck className="w-3.5 h-3.5 text-emerald-700" />
                ) : (
                  <Bookmark className="w-3.5 h-3.5" />
                )}
                {isSaved ? 'Bookmarked' : 'Bookmark Lesson'}
              </button>
              <button
                type="button"
                onClick={() => generateLesson(topicQuery, lesson.language)}
                disabled={loading}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:border-blue-400 flex items-center gap-1.5 min-h-[36px]"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Regenerate
              </button>
            </>
          )}

          <button
            type="button"
            onClick={handleOpenInStudio}
            className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 min-h-[36px]"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            Open Full Smart Video Studio
          </button>
        </div>
      </div>

      {loading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 flex items-center gap-3 text-xs text-blue-900">
          <Loader2 className="w-5 h-5 animate-spin text-blue-700 shrink-0" />
          <div>
            <div className="font-semibold">
              Building interactive Canvas scenes, formulas, subtitles &amp; quiz for &ldquo;{topicQuery}&rdquo;...
            </div>
            <div className="text-blue-700 mt-0.5">
              Checking Safety Guardian rules and validating physics/math equations.
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-900 flex items-center justify-between gap-2">
          <span className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
            {error}
          </span>
          <button
            type="button"
            onClick={() => generateLesson(topicQuery, defaultLang)}
            className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {blockedSafety && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-2 text-xs">
          <div className="font-bold text-rose-800 flex items-center gap-1.5">
            <ShieldAlert className="w-4 h-4" />
            {blockedSafety.title}
          </div>
          <p className="text-slate-900">{blockedSafety.summary}</p>
          <p className="text-emerald-800 font-medium">
            <strong>Safe Virtual Alternative:</strong> {blockedSafety.safeVirtualAlternative}
          </p>
        </div>
      )}

      {lesson && !loading && (
        <div className="space-y-4">
          {offlineNote && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs text-amber-900 flex items-center justify-between gap-2">
              <span>{offlineNote}</span>
              <button
                type="button"
                onClick={() => generateLesson(topicQuery, lesson.language)}
                className="underline font-semibold shrink-0"
              >
                Retry AI Enhancement
              </button>
            </div>
          )}

          {/* Topic Metadata & Navigation Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-900">{lesson.topicTitle}</span>
              <span className="text-slate-400">·</span>
              <span className="text-blue-700 font-semibold uppercase">{lesson.subject}</span>
              <span
                className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                  getSafetyBadgeMeta(lesson.safetyClassification).bgClass
                } ${getSafetyBadgeMeta(lesson.safetyClassification).borderClass} ${
                  getSafetyBadgeMeta(lesson.safetyClassification).colorClass
                }`}
              >
                {lesson.safetyClassification}
              </span>
              <span className="text-[11px] font-mono text-slate-500">
                {lesson.sourceMode === 'ai-grounded' ? 'AI + Deterministic Verified' : 'Deterministic Engine'}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 text-xs">
              <button
                type="button"
                onClick={() => setActiveTab('video')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
                  activeTab === 'video'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Film className="w-3.5 h-3.5" /> Video &amp; Narration
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
                  activeTab === 'summary'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <ClipboardList className="w-3.5 h-3.5" /> Formulas &amp; Steps
              </button>
              {lesson.experimentPrep && (
                <button
                  type="button"
                  onClick={() => setActiveTab('procedure')}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
                    activeTab === 'procedure'
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  <FlaskConical className="w-3.5 h-3.5" /> Procedure-First Lab
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('quiz')}
                className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 ${
                  activeTab === 'quiz'
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5" /> 5-Question Quiz
              </button>
            </div>
          </div>

          {/* TAB 1: Interactive Video Player + Live Parameter Sliders */}
          {activeTab === 'video' && (
            <div className="space-y-3">
              {lesson.interactiveDefaults.kind !== 'none' &&
                ['pythagoras', 'newtons-law', 'ohms-law'].includes(lesson.interactiveDefaults.kind) && (
                  <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-3.5 space-y-2">
                    <div className="text-xs font-semibold text-blue-800 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5" />
                      Live Simulation Parameters (Updates Canvas Animation &amp; Math in Real Time)
                    </div>

                    {lesson.interactiveDefaults.kind === 'pythagoras' && (
                      <div className="grid sm:grid-cols-3 gap-3 items-center text-xs">
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Base a</span>
                            <strong className="text-blue-700">{paramA} units</strong>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={paramA}
                            onChange={(e) => setParamA(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Height b</span>
                            <strong className="text-blue-700">{paramB} units</strong>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={12}
                            step={1}
                            value={paramB}
                            onChange={(e) => setParamB(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                          c = √({paramA}² + {paramB}²) ={' '}
                          <strong className="text-emerald-700">
                            {Math.sqrt(paramA * paramA + paramB * paramB).toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    )}

                    {lesson.interactiveDefaults.kind === 'newtons-law' && (
                      <div className="grid sm:grid-cols-3 gap-3 items-center text-xs">
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Force F</span>
                            <strong className="text-blue-700">{forceN} N</strong>
                          </div>
                          <input
                            type="range"
                            min={2}
                            max={100}
                            step={2}
                            value={forceN}
                            onChange={(e) => setForceN(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Mass m</span>
                            <strong className="text-blue-700">{massKg} kg</strong>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={25}
                            step={1}
                            value={massKg}
                            onChange={(e) => setMassKg(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                          a = {forceN} / {massKg} ={' '}
                          <strong className="text-emerald-700">
                            {(forceN / massKg).toFixed(2)} m/s²
                          </strong>
                        </div>
                      </div>
                    )}

                    {lesson.interactiveDefaults.kind === 'ohms-law' && (
                      <div className="grid sm:grid-cols-3 gap-3 items-center text-xs">
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Voltage V</span>
                            <strong className="text-blue-700">{voltageV} V</strong>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={24}
                            step={1}
                            value={voltageV}
                            onChange={(e) => setVoltageV(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div>
                          <div className="flex justify-between font-mono">
                            <span>Resistance R</span>
                            <strong className="text-blue-700">{resistanceOhm} Ω</strong>
                          </div>
                          <input
                            type="range"
                            min={1}
                            max={50}
                            step={1}
                            value={resistanceOhm}
                            onChange={(e) => setResistanceOhm(Number(e.target.value))}
                            className="w-full accent-blue-700"
                          />
                        </div>
                        <div className="rounded-lg bg-white border border-blue-200 px-3 py-2 font-mono text-slate-900">
                          I = {voltageV} / {resistanceOhm} ={' '}
                          <strong className="text-emerald-700">
                            {(voltageV / resistanceOhm).toFixed(2)} A
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>
                )}

              <ConceptVideoPlayer
                lesson={lesson}
                capabilities={capabilities}
                interactiveParams={interactiveParams}
                onLanguageSwitch={(lang) => generateLesson(lesson.topicQuery, lang)}
                onMp4Generated={(mp4Url, durationSec) =>
                  saveSmartLesson(lesson, {
                    renderedMp4Url: mp4Url,
                    renderedVideoDurationSec: durationSec,
                  })
                }
              />
            </div>
          )}

          {/* TAB 2: Formulas, Steps & Examples */}
          {activeTab === 'summary' && (
            <div className="space-y-4 text-xs sm:text-sm">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
                <div className="text-xs font-bold text-blue-700 uppercase">Core Concept &amp; Principle</div>
                <p className="text-slate-800">{lesson.meaningAndDefinition}</p>
                <p className="text-xs text-slate-600">
                  <strong>Why it matters:</strong> {lesson.whyConceptMatters}
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase">Formulas &amp; Equations</div>
                  {lesson.formulasAndEquations.map((f, i) => (
                    <div key={i} className="font-mono text-xs bg-blue-50 border border-blue-200 rounded px-2.5 py-1.5 text-blue-900">
                      {f}
                    </div>
                  ))}
                  <div className="text-xs font-bold text-slate-900 uppercase pt-2">Key Terms</div>
                  <ul className="space-y-1 text-xs text-slate-700">
                    {lesson.importantTerms.map((t, i) => (
                      <li key={i}>
                        <strong>{t.term}:</strong> {t.definition}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-slate-200 p-4 space-y-2">
                  <div className="text-xs font-bold text-slate-900 uppercase">Step-by-Step Explanation</div>
                  <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-700">
                    {lesson.stepByStepExplanation.map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                  <div className="text-xs font-bold text-slate-900 uppercase pt-2">Common Mistakes</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-amber-800">
                    {lesson.commonMistakes.map((m, i) => (
                      <li key={i}>{m}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Procedure-First Practical Workflow */}
          {activeTab === 'procedure' && lesson.experimentPrep && (
            <ProcedureFirstExperimentView
              prep={lesson.experimentPrep}
              onJumpToDemo={() => setActiveTab('video')}
              onJumpToQuiz={() => {
                setActiveTab('quiz');
                quizSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          )}

          {/* TAB 4: 5-Question Quiz */}
          {activeTab === 'quiz' && (
            <div ref={quizSectionRef} className="space-y-4">
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
                            className={`text-left px-3 py-2 rounded-lg border text-xs transition-colors ${cls}`}
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
                    Score: {quizScore} / {lesson.quiz.length} saved to My Learning
                  </div>
                ) : (
                  <div className="text-xs text-slate-500">
                    Answer all {lesson.quiz.length} questions to check mastery.
                  </div>
                )}

                <div className="flex gap-2">
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
                      Check Answers &amp; Record Score
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
