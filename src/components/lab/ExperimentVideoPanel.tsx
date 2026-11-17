import React, { useCallback, useEffect, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Film,
  HelpCircle,
  Loader2,
  RefreshCw,
  RotateCcw,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { matchLocalScienceTopic } from '../../engine/localFallback';
import type { ExperimentDefinition, ScienceVideoItem } from '../../types/science';
import { ScientificIllustrationFallback } from '../explorer/ScientificIllustrationFallback';
import { SmartVideoLessonWidget } from '../smart/SmartVideoLessonWidget';

interface ExperimentVideoPanelProps {
  experiment: ExperimentDefinition;
}

const OBSERVATION_GUIDES: Record<
  string,
  {
    whatToObserve: string[];
    howItRelates: string;
    thinkingQuestions: string[];
  }
> = {
  'boiling-point': {
    whatToObserve: [
      'Notice when tiny vapor bubbles begin forming at the heated base and rising all the way through the liquid.',
      'Observe how reducing surrounding air pressure lowers the threshold needed for vapor bubbles to expand.',
    ],
    howItRelates:
      'In the Virtual Lab workbench and Dual-Station Altitude Demo, lowering external pressure kPa directly reduces T_b along the IAPWS-IF97 saturation curve.',
    thinkingQuestions: [
      'Why does turning up the heater boil water sooner without raising the boiling temperature?',
      'Why do mountaineers use pressure cookers at high altitudes?',
    ],
  },
  'pendulum-period': {
    whatToObserve: [
      'Watch how the speed of the bob is fastest at the lowest equilibrium point and zero at the turning points.',
      'Compare how changing string length changes the swing time while bob mass does not.',
    ],
    howItRelates:
      'Our deterministic pendulum model computes T = 2π√(L/g) and lets you test Earth, Moon, and Mars gravity.',
    thinkingQuestions: [
      'Why must pendulum length quadruple to double the time period?',
      'What happens if the swing angle becomes much larger than 15°?',
    ],
  },
  'voltage-current': {
    whatToObserve: [
      'Track how current through a constant ohmic resistor rises proportionally as voltage increases.',
      'Notice the safety limits of low-voltage DC power compared to mains electricity.',
    ],
    howItRelates:
      'Our Electronics bench lets you connect a 0–24 V DC source, resistor, ammeter, and voltmeter to compute I = V / R.',
    thinkingQuestions: [
      'Why is an ammeter wired in series while a voltmeter is wired in parallel?',
      'Which everyday devices are non-ohmic (where V/I is not constant)?',
    ],
  },
  'photosynthesis-rate': {
    whatToObserve: [
      'Observe oxygen bubble output or gas exchange rate rising with illumination before leveling off.',
      'Notice saturation when CO₂ or enzyme capacity becomes the limiting factor.',
    ],
    howItRelates:
      'Our Biology Lab chamber simulates Michaelis–Menten saturation P = P_max · I / (K + I).',
    thinkingQuestions: [
      'Why does adding even brighter light eventually stop increasing photosynthesis?',
      'How do temperature and CO₂ interact with light intensity?',
    ],
  },
};

export function ExperimentVideoPanel({ experiment }: ExperimentVideoPanelProps) {
  const { toggleSaveVideo, isVideoSaved } = useLab();
  const [videos, setVideos] = useState<ScienceVideoItem[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [playbackFailed, setPlaybackFailed] = useState(false);

  const match = matchLocalScienceTopic(`${experiment.title} ${experiment.principle}`);

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    setPlaybackFailed(false);
    try {
      const res = await fetch('/api/videos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: experiment.title,
          keywords: match.videoKeywords,
          subject: experiment.subject,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not load educational videos right now.');
        return;
      }
      setVideos(Array.isArray(data.videos) ? data.videos : []);
      setSelectedIdx(0);
    } catch {
      setError('Network error while searching trusted educational video repositories.');
    } finally {
      setLoading(false);
    }
  }, [experiment.title, experiment.subject, match.videoKeywords.join(',')]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const activeVideo = videos[selectedIdx] ?? null;
  const guide = OBSERVATION_GUIDES[experiment.id] ?? {
    whatToObserve: [
      `Observe how changing ${experiment.independentVariable} affects ${experiment.dependentVariable}.`,
      'Check which quantities are held fixed as controlled variables.',
    ],
    howItRelates: `Compare this real-world phenomenon with the calculated curve from ${experiment.formula} inside the Virtual Lab.`,
    thinkingQuestions: [
      `What happens in the extreme limits of ${experiment.validityRange}?`,
      'Which real-world assumption in this demonstration differs from the idealized formula?',
    ],
  };

  return (
    <div className="space-y-6">
      <SmartVideoLessonWidget
        topicQuery={experiment.title}
        title={`Interactive Animated Concept Video, Procedure-First Lab & Quiz: ${experiment.shortTitle}`}
        autoGenerate={false}
        compact
        relatedExperimentId={experiment.id}
      />

      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Film className="w-4 h-4" />
            Connected Science Video Explorer · Wikimedia Commons &amp; NASA
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Video &amp; Visual Concept Guide for {experiment.shortTitle}
          </h3>
        </div>
        <button
          type="button"
          onClick={fetchVideos}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 min-h-[38px]"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${loading ? 'animate-spin' : ''}`} />
          Refresh Videos
        </button>
      </div>

      {loading && (
        <div className="py-10 flex items-center justify-center gap-2 text-sm text-blue-700">
          <Loader2 className="w-5 h-5 animate-spin" />
          Searching trusted open educational video libraries...
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 flex items-center justify-between gap-3 text-xs text-rose-900">
          <span>{error}</span>
          <button
            type="button"
            onClick={fetchVideos}
            className="px-3 py-1.5 rounded bg-rose-700 text-white font-semibold flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Retry
          </button>
        </div>
      )}

      {!loading && (
        <div className="grid lg:grid-cols-12 gap-6">
          {/* Left: Playable Video or Verified Animation Fallback */}
          <div className="lg:col-span-6 space-y-3">
            {activeVideo && !playbackFailed ? (
              <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
                <div className="aspect-video w-full bg-slate-900">
                  <video
                    key={activeVideo.playableUrl}
                    controls
                    playsInline
                    preload="metadata"
                    poster={activeVideo.thumbnailUrl}
                    src={activeVideo.playableUrl}
                    onError={() => setPlaybackFailed(true)}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4 space-y-2 bg-white">
                  <div className="text-xs font-semibold text-blue-700">
                    {activeVideo.provider} · {activeVideo.creator}
                  </div>
                  <div className="text-sm font-semibold text-slate-900">{activeVideo.title}</div>
                  <p className="text-xs text-slate-600">{activeVideo.description}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href={activeVideo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-800 hover:bg-slate-50 inline-flex items-center gap-1.5"
                    >
                      Open Source Page <ExternalLink className="w-3 h-3 text-blue-700" />
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleSaveVideo(activeVideo)}
                      className={`px-3 py-1.5 rounded-lg border text-xs inline-flex items-center gap-1.5 ${
                        isVideoSaved(activeVideo.id)
                          ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
                          : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {isVideoSaved(activeVideo.id) ? (
                        <BookmarkCheck className="w-3.5 h-3.5" />
                      ) : (
                        <Bookmark className="w-3.5 h-3.5" />
                      )}
                      {isVideoSaved(activeVideo.id) ? 'Saved' : 'Save Video'}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <ScientificIllustrationFallback
                  type={match.visualFallbackType}
                  conceptTitle={experiment.shortTitle}
                />
                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  {playbackFailed && activeVideo ? (
                    <>
                      Direct browser playback was blocked by the remote media host.{' '}
                      <a
                        href={activeVideo.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline"
                      >
                        Open original video ({activeVideo.provider}) ↗
                      </a>
                    </>
                  ) : (
                    'No exact open-license video matched this specific simulation query, so our interactive conceptual diagram is shown instead.'
                  )}
                </div>
              </div>
            )}

            {videos.length > 1 && (
              <div className="grid grid-cols-2 gap-2">
                {videos.map((v, i) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(i);
                      setPlaybackFailed(false);
                    }}
                    className={`rounded-lg border p-2 text-left flex items-center gap-2 ${
                      i === selectedIdx
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-12 h-9 rounded object-cover shrink-0 bg-slate-900"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-900 truncate">{v.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{v.provider}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right: Pedagogical Observation & Experiment Link */}
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-slate-50 p-5 space-y-4 text-xs sm:text-sm">
            <div>
              <div className="text-xs font-semibold text-blue-700">What to Observe</div>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-700">
                {guide.whatToObserve.map((o, i) => (
                  <li key={i}>{o}</li>
                ))}
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-blue-700">Scientific Principle</div>
              <p className="text-slate-900 font-medium mt-1">{experiment.principle}</p>
              <p className="text-xs font-mono text-emerald-700 font-semibold mt-1">{experiment.formula}</p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-blue-700">
                How It Relates to Your Virtual Experiment
              </div>
              <p className="text-slate-700 mt-1">{guide.howItRelates}</p>
            </div>

            <div className="pt-3 border-t border-slate-200">
              <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5" />
                Critical Thinking Questions
              </div>
              <ul className="list-disc pl-4 mt-1.5 space-y-1 text-slate-700">
                {guide.thinkingQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
