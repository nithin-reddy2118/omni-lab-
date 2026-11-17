import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FlaskConical,
  GraduationCap,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import {
  EDUCATION_DIVISIONS,
  HIGHER_EDUCATION_STAGES,
  RESEARCH_TRACK_DETAILS,
  SCHOOL_CLASS_LEVELS,
} from '../data/divisions';
import { EXPERIMENTS, getExperimentById } from '../engine/experiments';

interface TutorGuideResponse {
  welcomeHeadline: string;
  conceptExplanation: string;
  equationAndUnits: string;
  equipmentAndSetup: string[];
  safetyCheck: string;
  predictionChallenge: string;
  commonMisconceptionHint: string;
  nextInvestigationStep: string;
}

const SIXTEEN_STAGE_TITLES = [
  '1. Welcome & Learning Goal',
  '2. Concept Meaning & Everyday Phenomenon',
  '3. Scientific Principle, Equation & SI Units',
  '4. Variables & Testable Hypothesis',
  '5. Apparatus & Reagent Selection',
  '6. Equipment Placement & Working Check',
  '7. Safety Inspection & PPE Verification',
  '8. Coupled Apparatus Setup Check',
  '9. Pre-Experiment Prediction Lock',
  '10. Baseline Measurement & Control Setup',
  '11. Guided Parameter Variation (Trial Comparisons)',
  '12. Critical Transition / Equivalence Observation',
  '13. Data Table & Graph Slope Interpretation',
  '14. Misconception Check & Failure Investigation',
  '15. Assumptions, Uncertainty & Model Boundaries',
  '16. Student Control Handoff & Next Discovery',
];

export function LabTutorPage() {
  const {
    activeDivision,
    schoolClassLevel,
    setSchoolClassLevel,
    higherStage,
    setHigherStage,
    researchTrack,
    setResearchTrack,
    activeExperimentId,
    setActiveExperimentId,
    activeSubjectId,
    language,
    navigate,
    recordDiscoveredConcept,
  } = useLab();

  const [stageIdx, setStageIdx] = useState(0);
  const [question, setQuestion] = useState('');
  const [loadingAi, setLoadingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [tutorResult, setTutorResult] = useState<TutorGuideResponse | null>(null);
  const [modelUsed, setModelUsed] = useState<string | null>(null);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsNotice, setTtsNotice] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const divDef = EDUCATION_DIVISIONS[activeDivision];
  const experiment = getExperimentById(activeExperimentId) ?? EXPERIMENTS[0];
  const activeSubject =
    divDef.subjects.find((s) => s.id === activeSubjectId) ?? divDef.subjects[0];

  const levelLabel = useMemo(() => {
    if (activeDivision === 'school') {
      return SCHOOL_CLASS_LEVELS.find((l) => l.id === schoolClassLevel)?.label ?? 'Class 8';
    }
    if (activeDivision === 'higher') {
      return HIGHER_EDUCATION_STAGES.find((s) => s.id === higherStage)?.label ?? 'Classes 11–12';
    }
    return RESEARCH_TRACK_DETAILS.find((t) => t.id === researchTrack)?.label ?? 'Biotechnology';
  }, [activeDivision, schoolClassLevel, higherStage, researchTrack]);

  // Deterministic 16-stage walkthrough calibrated to current experiment & division depth
  const deterministicStageContent = useMemo(() => {
    const isTitration = experiment.id === 'acid-base-titration';
    const baseStages = [
      {
        title: SIXTEEN_STAGE_TITLES[0],
        body: `Welcome to ${experiment.title} (${levelLabel}). Today we focus on: ${experiment.learningObjective}`,
        actionHint: 'Verify your division/class level at the top so explanations and math match your grade.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[1],
        body: isTitration
          ? activeDivision === 'school'
            ? 'Acids taste sour and bases feel soapy; when you mix exact amounts of acid (HCl) and base (NaOH), they cancel each other into salt water!'
            : 'Proton transfer between hydronium (H₃O⁺) and hydroxide (OH⁻) drives aqueous acid–base neutralisation.'
          : experiment.explanation,
        actionHint: 'Connect the scientific principle to what you can visually observe in the Virtual Lab vessel.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[2],
        body: `Core equation: ${experiment.formula} · Standard units: ${experiment.unitsSummary}`,
        actionHint: 'Always convert measurements into consistent SI units before computing results.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[3],
        body: `Testable Hypothesis: ${experiment.hypothesis}`,
        actionHint: `Independent Variable: ${experiment.independentVariable} | Dependent Variable: ${experiment.dependentVariable}`,
      },
      {
        title: SIXTEEN_STAGE_TITLES[4],
        body: isTitration
          ? 'Select: Class A 50 mL Burette, 250 mL Conical Flask, Magnetic Stirrer, Digital pH Meter, plus 0.5 M HCl, 0.5 M NaOH, and Phenolphthalein indicator.'
          : `Load the recommended apparatus kit inside ${experiment.subject} Wing in Virtual Lab (or search inline in the room discovery bar).`,
        actionHint: 'Every piece of glassware must be clean and suited for the physical parameter you are varying.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[5],
        body: `Equipment Placement & Working Check: Position vessels centrally on the phenolic benchtop and verify range limits (${experiment.validityRange}) before starting.`,
        actionHint: 'Inspect each selected instrument’s calibration slider and measurement units in the inspector card.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[6],
        body: `Safety Inspection (${experiment.safetyLevel}): ${experiment.safetyNote}`,
        actionHint: 'Never heat flammable gases or mix oxidizers with concentrated acids.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[7],
        body: isTitration
          ? 'Couple the Burette above the Conical Flask and link the pH Electrode probe inside the flask.'
          : 'Connect thermal, electrical, or sensor apparatus properly—keep heating plates isolated from optical microscopes.',
        actionHint: 'Incompatible instrument pairs trigger an immediate compatibility warning.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[8],
        body: `Prediction Challenge: ${experiment.predictionPrompt}`,
        actionHint: `Hint: ${experiment.predictionExpectedHint}`,
      },
      {
        title: SIXTEEN_STAGE_TITLES[9],
        body: isTitration
          ? 'Dose 25.0 mL of 0.5 M HCl into the Conical Flask with 2 drops of Phenolphthalein. Initial pH reads ~0.30 (colourless).'
          : 'Record baseline Trial 1 metrics at default parameter values before varying controls.',
        actionHint: 'Record your control trial first so subsequent parameter shifts have a clear reference.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[10],
        body: isTitration
          ? 'Increment NaOH volume gradually (0 mL → 15 mL → 24 mL). Notice pH rises slowly at first because excess H⁺ remains.'
          : `Vary ${experiment.independentVariable} systematically across 3–5 values while keeping ${experiment.controlledVariables.join(', ')} fixed.`,
        actionHint: 'Avoid changing two parameters simultaneously so causal slopes remain unambiguous.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[11],
        body: isTitration
          ? 'At V_base = 25.0 mL (equimolar with 25.0 mL 0.5 M HCl), equivalence pH jumps cleanly through 7.00 and ΔH releases −57.3 kJ/mol (+3.4 °C)! At 25.1+ mL, Phenolphthalein turns magenta-pink.'
          : 'Observe your critical transition (e.g., vapour bubble nucleation at T_boil, enzyme saturation near Km, RC time constant τ, or Ohm’s slope V/I).',
        actionHint: 'Watch exact decimal inflection points with tabular numeric precision.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[12],
        body: `${experiment.graphInterpretation.relationship} Slope meaning: ${experiment.graphInterpretation.slopeMeaning}`,
        actionHint: experiment.graphInterpretation.conclusion,
      },
      {
        title: SIXTEEN_STAGE_TITLES[13],
        body: `Misconception & Failure Investigation: A common mistake is extrapolating linear proportionality into saturation or breakdown zones. Compare your curve against Failure Detective case studies if unexpected values appear.`,
        actionHint: 'Inspect Why did this happen? or open Science Detective whenever results diverge from your prediction.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[14],
        body: `Assumptions & Model Boundaries: ${experiment.assumptions.join(' ')} Limitations: ${experiment.limitations.join(' ')}`,
        actionHint: 'Check where real-world friction, stray light, thermal loss, or non-ideal electrolyte activity would shift measurements.',
      },
      {
        title: SIXTEEN_STAGE_TITLES[15],
        body: 'Student Control Handoff! Open the Virtual Laboratory to run multi-trial comparisons, save a Research Notebook entry, customize your Personal Lab, or explore What-If Studio.',
        actionHint: 'Record at least 3 trials to unlock multi-trial overlay comparisons.',
      },
    ];
    return baseStages[stageIdx] ?? baseStages[0];
  }, [experiment, levelLabel, activeDivision, stageIdx]);

  const askDivisionTutor = async (e?: React.FormEvent, customPrompt?: string) => {
    if (e) e.preventDefault();
    const prompt = (customPrompt ?? question).trim() || activeSubject.tutorPrompt;
    setLoadingAi(true);
    setAiError(null);
    try {
      const resp = await fetch('/api/ai/division-tutor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: activeDivision,
          levelLabel,
          subject: activeSubject.name,
          labId: activeSubject.department,
          question: prompt,
          currentStage: deterministicStageContent.title,
          language,
          workbenchSummary: `${experiment.title} (${experiment.formula})`,
        }),
      });
      const data = await resp.json();
      if (data.blockedBySafety) {
        setAiError(data.safety?.summary || 'Blocked by Safety Guardian.');
        setTutorResult(null);
        return;
      }
      if (!resp.ok) {
        if (data.fallbackGuide) {
          setTutorResult(data.fallbackGuide);
          setModelUsed('Deterministic Local Fallback');
          setAiError(data.error || 'AI service temporarily busy; showing verified local tutor guide.');
        } else {
          setAiError(data.error || 'Unable to contact AI Tutor.');
        }
        return;
      }
      setTutorResult(data.guide);
      setModelUsed(data.modelUsed || 'Gemini AI');
      recordDiscoveredConcept(`${activeSubject.name}: ${prompt.slice(0, 60)}`);
    } catch {
      setAiError('Network error while contacting AI Lab Tutor.');
    } finally {
      setLoadingAi(false);
    }
  };

  const stopStageSpeech = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setTtsPlaying(false);
  };

  const speakStage = async () => {
    if (ttsPlaying) {
      stopStageSpeech();
      return;
    }
    setTtsPlaying(true);
    setTtsNotice(null);
    const spokenText = `${deterministicStageContent.title}. ${deterministicStageContent.body}`;
    try {
      const resp = await fetch('/api/smart-learning/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: spokenText,
          language: language === 'kn' ? 'kn' : 'en',
          voiceName: 'Kore',
        }),
      });
      if (resp.ok) {
        const data = await resp.json();
        if (data.available && data.audioBase64) {
          const byteChars = atob(data.audioBase64);
          const byteNums = new Uint8Array(byteChars.length);
          for (let i = 0; i < byteChars.length; i++) byteNums[i] = byteChars.charCodeAt(i);
          const blobUrl = URL.createObjectURL(new Blob([byteNums], { type: data.mimeType || 'audio/wav' }));
          const audio = new Audio(blobUrl);
          audioRef.current = audio;
          audio.onended = () => {
            URL.revokeObjectURL(blobUrl);
            setTtsPlaying(false);
          };
          audio.onerror = () => {
            URL.revokeObjectURL(blobUrl);
            setTtsPlaying(false);
            setTtsNotice('Audio playback error; check device audio output.');
          };
          await audio.play();
          return;
        }
        setTtsNotice(data.reason || 'Server voice narration unavailable; using browser speech.');
      }
    } catch {
      setTtsNotice('Server voice service unreachable; using browser speech if supported.');
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(spokenText);
      utter.lang = language === 'kn' ? 'kn-IN' : 'en-US';
      utter.onend = () => setTtsPlaying(false);
      utter.onerror = () => setTtsPlaying(false);
      window.speechSynthesis.speak(utter);
      return;
    }
    setTtsPlaying(false);
  };

  return (
    <div className="space-y-6">
      {/* Header & Calibrated Level Picker */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4" />
              Personal AI Lab Tutor · {divDef.shortTitle}
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              16-Stage Guided Science &amp; Virtual Bench Tutor
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Walks you step-by-step from physical intuition and safety checks to exact mathematical derivations calibrated for <strong>{levelLabel}</strong>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeDivision === 'school' && (
              <select
                value={schoolClassLevel}
                onChange={(e) => setSchoolClassLevel(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {SCHOOL_CLASS_LEVELS.map((l) => (
                  <option key={l.id} value={l.id}>{l.label}</option>
                ))}
              </select>
            )}
            {activeDivision === 'higher' && (
              <select
                value={higherStage}
                onChange={(e) => setHigherStage(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {HIGHER_EDUCATION_STAGES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            )}
            {activeDivision === 'research' && (
              <select
                value={researchTrack}
                onChange={(e) => setResearchTrack(e.target.value as any)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {RESEARCH_TRACK_DETAILS.map((t) => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            )}
            <select
              value={experiment.id}
              onChange={(e) => {
                setActiveExperimentId(e.target.value);
                setStageIdx(0);
              }}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              {EXPERIMENTS.map((exp) => (
                <option key={exp.id} value={exp.id}>
                  {exp.number}. {exp.shortTitle}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 16-Stage Interactive Guided Experiment Stepper */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs font-mono font-bold text-blue-700">
            STAGE {stageIdx + 1} OF 16 · {experiment.title.toUpperCase()}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={speakStage}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                ttsPlaying
                  ? 'border-amber-400 bg-amber-50 text-amber-900'
                  : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-400'
              }`}
            >
              {ttsPlaying ? <Square className="w-3.5 h-3.5 text-amber-700" /> : <Volume2 className="w-3.5 h-3.5 text-blue-700" />}
              {ttsPlaying ? 'Stop Reading' : 'Read Aloud'}
            </button>
            <button
              type="button"
              onClick={() => navigate('virtual-lab', { experimentId: experiment.id })}
              className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Practice on Lab Bench
            </button>
          </div>
        </div>

        {ttsNotice && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-900">
            {ttsNotice}
          </div>
        )}

        {/* 16 Stage Progress Strip */}
        <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
          {SIXTEEN_STAGE_TITLES.map((title, idx) => (
            <button
              key={title}
              type="button"
              onClick={() => {
                stopStageSpeech();
                setStageIdx(idx);
              }}
              title={title}
              className={`h-8 rounded-lg font-mono text-xs font-bold transition-colors border ${
                idx === stageIdx
                  ? 'bg-blue-700 text-white border-blue-700'
                  : idx < stageIdx
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-3">
          <h2 className="text-lg font-display font-bold text-slate-900">
            {deterministicStageContent.title}
          </h2>
          <p className="text-sm text-slate-800 leading-relaxed">{deterministicStageContent.body}</p>
          <div className="rounded-lg border border-blue-200 bg-white px-3.5 py-2.5 text-xs text-blue-900 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
            <span>
              <strong>Bench Action:</strong> {deterministicStageContent.actionHint}
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button
            type="button"
            disabled={stageIdx === 0}
            onClick={() => {
              stopStageSpeech();
              setStageIdx((i) => Math.max(0, i - 1));
            }}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Stage
          </button>
          <button
            type="button"
            onClick={() => {
              stopStageSpeech();
              setStageIdx((i) => (i < 15 ? i + 1 : 0));
            }}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1"
          >
            {stageIdx < 15 ? 'Next Stage' : 'Restart 16 Stages'}
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Gemini AI Level-Adapted Q&A */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-700" />
            Ask AI Lab Tutor ({levelLabel})
          </h2>
          <span className="text-xs text-slate-500 flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            Safety Guardian Screened
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {divDef.subjects.slice(0, 5).map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setQuestion(s.tutorPrompt);
                askDivisionTutor(undefined, s.tutorPrompt);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:border-blue-400 hover:text-blue-700"
            >
              {s.name}: &ldquo;{s.tutorPrompt}&rdquo;
            </button>
          ))}
        </div>

        <form onSubmit={askDivisionTutor} className="flex flex-col sm:flex-row gap-2.5">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={`Ask about ${experiment.shortTitle}, equations, glassware safety, or experimental errors for ${levelLabel}...`}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900"
          />
          <button
            type="submit"
            disabled={loadingAi}
            className="px-5 py-3 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 disabled:opacity-50 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Send className="w-4 h-4" />
            {loadingAi ? 'Thinking...' : 'Ask AI Tutor'}
          </button>
        </form>

        {aiError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {aiError}
          </div>
        )}

        {tutorResult && (
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <h3 className="text-base font-display font-bold text-slate-900">
                {tutorResult.welcomeHeadline}
              </h3>
              {modelUsed && (
                <span className="font-mono text-[11px] text-slate-500">Model: {modelUsed}</span>
              )}
            </div>
            <p className="text-sm text-slate-800 leading-relaxed">{tutorResult.conceptExplanation}</p>

            <div className="grid md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                <div className="font-semibold text-slate-900">Formula &amp; SI Units</div>
                <div className="font-mono text-blue-800">{tutorResult.equationAndUnits}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                <div className="font-semibold text-slate-900">Safety Verification</div>
                <div className="text-emerald-800">{tutorResult.safetyCheck}</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1">
                <div className="font-semibold text-slate-900">Equipment &amp; Setup</div>
                <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                  {tutorResult.equipmentAndSetup.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-1.5">
                <div>
                  <strong className="text-slate-900">Prediction Challenge:</strong>{' '}
                  <span className="text-slate-700">{tutorResult.predictionChallenge}</span>
                </div>
                <div>
                  <strong className="text-slate-900">Common Pitfall:</strong>{' '}
                  <span className="text-slate-700">{tutorResult.commonMisconceptionHint}</span>
                </div>
                <div>
                  <strong className="text-blue-700">Next Step:</strong>{' '}
                  <span className="text-slate-800">{tutorResult.nextInvestigationStep}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
