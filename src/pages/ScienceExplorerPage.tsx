import React, { useRef, useState } from 'react';
import {
  Compass,
  ExternalLink,
  FlaskConical,
  HelpCircle,
  Loader2,
  Mountain,
  PlusCircle,
  RotateCcw,
  Send,
  ShieldAlert,
  Sigma,
  Sparkles,
} from 'lucide-react';
import { ScienceVideoStage } from '../components/explorer/ScienceVideoStage';
import { ScientificIllustrationFallback } from '../components/explorer/ScientificIllustrationFallback';
import { SmartVideoLessonWidget } from '../components/smart/SmartVideoLessonWidget';
import { AudioNarrationBar } from '../components/ui/AudioNarrationBar';
import { useLab } from '../context/LabContext';
import { getSafetyBadgeMeta } from '../engine/safetyEngine';
import type {
  ExplorerResponse,
  LabDepartmentId,
  SafetyEvaluation,
  ScienceVideoItem,
  VisualFallbackType,
} from '../types/science';

interface ExplorerFallbackData {
  matchedExperimentId: string | null;
  department: LabDepartmentId;
  visualFallbackType: VisualFallbackType;
  reason: string;
  videos: ScienceVideoItem[];
}

const SUBJECTS = [
  'Auto-detect',
  'Physics',
  'Chemistry',
  'Biology',
  'Mathematics',
  'Astronomy',
  'Earth Science',
  'Environmental Science',
  'Engineering',
  'Space Science',
  'Agriculture',
  'Technology',
  'Robotics',
];

const EXAMPLE_QUESTIONS = [
  'Why does water boil at a lower temperature on mountains?',
  'How does photosynthesis happen?',
  'How does electricity flow through a circuit?',
  'How does a pendulum move?',
  'How does a rainbow form?',
  'How does a rocket launch?',
  'How does a microscope work?',
  'How do magnets attract objects?',
  'How does a spacecraft heat shield work?',
];

export function ScienceExplorerPage() {
  const {
    language,
    navigate,
    recordSafetyCheck,
    aiConfigured,
    setCreatorPrefillPrompt,
    setWorkbenchHandoff,
  } = useLab();
  const [question, setQuestion] = useState('');
  const [lastAskedQuestion, setLastAskedQuestion] = useState('');
  const [subject, setSubject] = useState('Auto-detect');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedSafety, setBlockedSafety] = useState<SafetyEvaluation | null>(null);
  const [result, setResult] = useState<ExplorerResponse | null>(null);
  const [fallbackData, setFallbackData] = useState<ExplorerFallbackData | null>(null);
  const [videos, setVideos] = useState<ScienceVideoItem[]>([]);
  const [seenVideoIds, setSeenVideoIds] = useState<string[]>([]);
  const [searchingAnother, setSearchingAnother] = useState(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const inFlightRef = useRef(false);

  const runExplorerQuery = async (targetQuestion: string) => {
    const clean = targetQuestion.trim();
    if (!clean || inFlightRef.current) return;
    inFlightRef.current = true;
    setQuestion(clean);
    setLastAskedQuestion(clean);
    setLoading(true);
    setError(null);
    setBlockedSafety(null);
    setVideoError(null);
    setResult(null);
    setFallbackData(null);
    setVideos([]);
    setSeenVideoIds([]);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch('/api/ai/explorer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: clean, subject, language }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The AI explanation service is temporarily busy. Please try again in a moment.');
        if (data.fallback) {
          setFallbackData(data.fallback);
        }
        return;
      }
      if (data.safety) {
        recordSafetyCheck(clean, data.safety.level);
      }
      if (data.blockedBySafety) {
        setBlockedSafety(data.safety);
        return;
      }
      const nextVideos: ScienceVideoItem[] = Array.isArray(data.videos) ? data.videos : [];
      setResult(data.result);
      setVideos(nextVideos);
      setSeenVideoIds(nextVideos.map((v) => v.id));
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setError(
        aborted
          ? 'The AI request took longer than expected and timed out. Your question has been kept below—click Retry or open the related Virtual Lab.'
          : 'Could not reach the Science Explorer service. Your question is preserved—please retry.'
      );
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    await runExplorerQuery(question);
  };

  const handleFindAnotherVideo = async () => {
    if (!result) return;
    setSearchingAnother(true);
    setVideoError(null);
    try {
      const res = await fetch('/api/videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: lastAskedQuestion || question,
          keywords: result.videoSearchKeywords,
          subject: result.subject,
          excludeIds: seenVideoIds,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setVideoError(data.error || 'Could not search for another educational video.');
        return;
      }
      const fresh: ScienceVideoItem[] = Array.isArray(data.videos) ? data.videos : [];
      if (fresh.length === 0) {
        setVideoError(
          'No additional distinct open-license demonstration videos matched this query. You can review the current videos or use the interactive scientific animation.'
        );
        return;
      }
      setVideos(fresh);
      setSeenVideoIds((prev) => Array.from(new Set([...prev, ...fresh.map((v) => v.id)])));
    } catch {
      setVideoError('Network error while searching for additional educational videos.');
    } finally {
      setSearchingAnother(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <Compass className="w-4 h-4" />
          AI Science Video Explorer · 12 STEM Disciplines
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          Universal Science Explorer
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Ask a science question to explore verified educational demonstration videos (or interactive scientific models) alongside Classes 6–10 explanations, formulas, and Virtual Lab links.
        </p>
      </div>

      {aiConfigured === false && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900">
          AI responses require <code className="font-mono">GEMINI_API_KEY</code> in Settings &gt; Secrets. Offline deterministic Virtual Lab experiments remain fully usable.
        </div>
      )}

      {/* Subject Filter Strip */}
      <div className="flex flex-wrap gap-2">
        {SUBJECTS.map((subj) => (
          <button
            key={subj}
            type="button"
            onClick={() => setSubject(subj)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors min-h-[36px] ${
              subject === subj
                ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {subj}
          </button>
        ))}
      </div>

      {/* Question Form */}
      <form onSubmit={handleAsk} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <label htmlFor="explorer-input" className="text-sm font-semibold text-slate-900 block">
          Ask Anything About How Nature or Technology Works
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="explorer-input"
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="e.g. Why does water boil at a lower temperature on mountains?"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? 'Finding Video & Explaining...' : 'Explore Science'}
          </button>
        </div>

        <div className="space-y-1.5 pt-1">
          <span className="text-xs text-slate-500 block">Try asking (click to populate or explore):</span>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUESTIONS.map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => runExplorerQuery(q)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-blue-700 font-medium hover:border-blue-400 text-left min-h-[34px]"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </form>

      {loading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 flex items-center gap-4">
          <Loader2 className="w-6 h-6 text-blue-700 animate-spin shrink-0" />
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Analyzing scientific question &amp; searching trusted educational video libraries...
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Checking Safety Guardian rules, generating Classes 6–10 breakdown, and querying Wikimedia Commons &amp; NASA open media.
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="space-y-4">
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rose-800">
            <div className="space-y-0.5">
              <div className="font-semibold">AI Service Notice</div>
              <p className="text-xs text-rose-900">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => runExplorerQuery(lastAskedQuestion || question)}
              className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry Question
            </button>
          </div>

          {fallbackData && (
            <div className="rounded-xl border border-blue-200 bg-white p-5 space-y-4 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    Deterministic Lab &amp; Visual Fallback (Available Offline / Without AI)
                  </div>
                  <p className="text-sm text-slate-800 mt-1">{fallbackData.reason}</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {fallbackData.matchedExperimentId === 'boiling-point' && (
                    <button
                      type="button"
                      onClick={() => {
                        setWorkbenchHandoff({ autoOpenBoilingDemo: true });
                        navigate('virtual-lab', { experimentId: 'boiling-point' });
                      }}
                      className="px-3.5 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold flex items-center gap-1.5 min-h-[38px]"
                    >
                      <Mountain className="w-4 h-4" />
                      Open Sea Level vs Altitude Boiling Demo
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setWorkbenchHandoff({
                        department: fallbackData.department,
                        experimentId: fallbackData.matchedExperimentId || undefined,
                        enterRoomDirectly: true,
                      });
                      navigate('virtual-lab', {
                        experimentId: fallbackData.matchedExperimentId || undefined,
                      });
                    }}
                    className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                  >
                    <FlaskConical className="w-4 h-4" />
                    {fallbackData.matchedExperimentId
                      ? 'Open Matched Virtual Lab Simulation'
                      : `Enter ${fallbackData.department} Lab Room`}
                  </button>
                </div>
              </div>

              {fallbackData.videos && fallbackData.videos.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  {fallbackData.videos.slice(0, 2).map((vid) => (
                    <div
                      key={vid.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 overflow-hidden"
                    >
                      <div className="aspect-video bg-slate-900">
                        <video
                          controls
                          playsInline
                          preload="metadata"
                          poster={vid.thumbnailUrl}
                          src={vid.playableUrl}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="p-3 space-y-1 text-xs">
                        <div className="text-blue-700 font-semibold">
                          {vid.provider} · {vid.creator}
                        </div>
                        <div className="text-slate-900 font-semibold">{vid.title}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <ScientificIllustrationFallback
                  type={fallbackData.visualFallbackType}
                  conceptTitle={lastAskedQuestion || question}
                />
              )}

              <SmartVideoLessonWidget
                topicQuery={lastAskedQuestion || question}
                title="Instant Animated Concept Video & Quiz (Works Offline)"
                autoGenerate={false}
                compact
              />
            </div>
          )}
        </div>
      )}

      {blockedSafety && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-3">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <ShieldAlert className="w-5 h-5" />
            {blockedSafety.title}
          </div>
          <p className="text-sm text-slate-900">{blockedSafety.summary}</p>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1">
            {blockedSafety.reasons.map((r, i) => (
              <li key={i}>{r}</li>
            ))}
          </ul>
          <p className="text-xs text-emerald-800 font-medium">
            <strong>Safe Virtual Alternative:</strong> {blockedSafety.safeVirtualAlternative}
          </p>
        </div>
      )}

      {result && (
        <div className="space-y-6">
          <ScienceVideoStage
            question={lastAskedQuestion || question}
            result={result}
            videos={videos}
            onSearchAnotherVideo={handleFindAnotherVideo}
            searchingAnother={searchingAnother}
            videoError={videoError}
            onRetryVideo={handleFindAnotherVideo}
          />

          <SmartVideoLessonWidget
            topicQuery={lastAskedQuestion || question}
            title={`Animated Concept Video, Voice Narration & Quiz: ${lastAskedQuestion || question}`}
            autoGenerate
            compact
          />

          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-semibold text-blue-700">
                Identified Subject: {result.subject}
              </div>
              <div
                className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                  getSafetyBadgeMeta(result.safetyClassification).bgClass
                } ${getSafetyBadgeMeta(result.safetyClassification).borderClass} ${
                  getSafetyBadgeMeta(result.safetyClassification).colorClass
                }`}
              >
                {getSafetyBadgeMeta(result.safetyClassification).label}
              </div>
            </div>

            <p className="text-base text-slate-800 leading-relaxed">{result.conceptExplanation}</p>

            <AudioNarrationBar
              title={`${result.subject} Explanation`}
              segments={[
                { label: 'Concept', text: result.conceptExplanation },
                { label: 'Core Principles', text: result.scientificPrinciples.join('. ') },
                { label: 'Applications', text: result.realWorldApplications.join('. ') },
              ]}
            />

            {result.formulaHighlight && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3">
                <Sigma className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-semibold text-blue-700">
                    Key Formula &amp; Calculation Relationship
                  </div>
                  <div className="text-sm font-mono text-slate-900 mt-1">{result.formulaHighlight}</div>
                </div>
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
              <div>
                <h3 className="text-xs font-semibold text-slate-900 mb-2">Core Scientific Principles</h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600">
                  {result.scientificPrinciples.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-900 mb-2">Real-World Applications</h3>
                <ul className="list-disc pl-4 space-y-1 text-sm text-slate-600">
                  {result.realWorldApplications.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="font-semibold text-slate-900">Independent Variables</div>
                <div className="text-slate-600 mt-1">{result.variables.independent.join(', ')}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="font-semibold text-slate-900">Dependent Variables</div>
                <div className="text-slate-600 mt-1">{result.variables.dependent.join(', ')}</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                <div className="font-semibold text-slate-900">Controlled Variables</div>
                <div className="text-slate-600 mt-1">{result.variables.controlled.join(', ')}</div>
              </div>
            </div>

            <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div>
                <strong className="text-slate-900">Recommended Graph:</strong>{' '}
                <span className="text-slate-600">{result.graphSuggestion}</span>
              </div>
              <div>
                <strong className="text-slate-900">Uncertainty &amp; Limitations:</strong>{' '}
                <span className="text-slate-600">{result.uncertaintyAndLimitations}</span>
              </div>
            </div>

            {result.suggestedExperimentId ? (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-slate-900">
                  <strong>Validated Virtual Experiment Available:</strong> {result.suggestedExperimentReason}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWorkbenchHandoff({
                      experimentId: result.suggestedExperimentId!,
                      enterRoomDirectly: true,
                    });
                    navigate('virtual-lab', { experimentId: result.suggestedExperimentId! });
                  }}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Open Validated Simulation
                </button>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
                <div>
                  <strong className="text-slate-900">Simulation Availability:</strong>{' '}
                  {result.suggestedExperimentReason ||
                    'No pre-validated numerical simulation matches this exact topic yet; we never fabricate unvalidated models.'}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCreatorPrefillPrompt(result.suggestedCreatorPrompt || lastAskedQuestion || question);
                    navigate('creator');
                  }}
                  className="px-3.5 py-2 rounded-lg border border-blue-200 bg-white text-blue-700 font-semibold flex items-center gap-1.5 min-h-[38px]"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  Create Custom Model
                </button>
              </div>
            )}

            {result.followUpQuestions && result.followUpQuestions.length > 0 && (
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <div className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                  <HelpCircle className="w-3.5 h-3.5 text-blue-700" />
                  Explore Deeper Follow-Up Questions
                </div>
                <div className="flex flex-wrap gap-2">
                  {result.followUpQuestions.map((fq, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => runExplorerQuery(fq)}
                      className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-blue-700 font-medium hover:border-blue-400 text-left min-h-[36px]"
                    >
                      {fq}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {result.verifiableSources.length > 0 && (
              <div className="pt-2 border-t border-slate-100 space-y-1">
                <div className="text-xs font-semibold text-slate-900">Reference Sources</div>
                <div className="flex flex-wrap gap-4">
                  {result.verifiableSources.map((src, i) => (
                    <a
                      key={i}
                      href={src.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      {src.title} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
