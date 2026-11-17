import React, { useEffect, useRef, useState } from 'react';
import {
  Bookmark,
  BookmarkCheck,
  ExternalLink,
  Eye,
  EyeOff,
  Film,
  FlaskConical,
  Info,
  Pause,
  Play,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import type { ExplorerResponse, ScienceVideoItem } from '../../types/science';
import { ScientificIllustrationFallback } from './ScientificIllustrationFallback';

interface ScienceVideoStageProps {
  question: string;
  result: ExplorerResponse;
  videos: ScienceVideoItem[];
  onSearchAnotherVideo: () => void;
  searchingAnother: boolean;
  videoError: string | null;
  onRetryVideo: () => void;
}

function formatDuration(seconds?: number): string | null {
  if (!seconds || seconds <= 0) return null;
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function ScienceVideoStage({
  question,
  result,
  videos,
  onSearchAnotherVideo,
  searchingAnother,
  videoError,
  onRetryVideo,
}: ScienceVideoStageProps) {
  const { navigate, toggleSaveVideo, isVideoSaved, setCreatorPrefillPrompt } = useLab();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackFailed, setPlaybackFailed] = useState(false);
  const [showExplanation, setShowExplanation] = useState(true);
  const [fallbackAnimPlaying, setFallbackAnimPlaying] = useState(true);

  useEffect(() => {
    setSelectedIdx(0);
    setPlaybackFailed(false);
    setIsPlaying(false);
  }, [videos]);

  const activeVideo = videos[selectedIdx] ?? null;
  const saved = activeVideo ? isVideoSaved(activeVideo.id) : false;
  const usingFallback = !activeVideo || playbackFailed;

  const handlePlayPause = () => {
    if (usingFallback) {
      setFallbackAnimPlaying((p) => !p);
      return;
    }
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play().catch(() => setPlaybackFailed(true));
    } else {
      el.pause();
    }
  };

  const handleOpenLab = () => {
    if (result.suggestedExperimentId) {
      navigate('virtual-lab', { experimentId: result.suggestedExperimentId });
      return;
    }
    setCreatorPrefillPrompt(result.suggestedCreatorPrompt || question);
    navigate('creator');
  };

  const breakdown = result.videoBreakdown;

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5 shadow-xs">
      {/* Header Row */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Film className="w-4 h-4" />
            AI Science Video Explorer · Trusted Open Educational Demonstrations
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Visual Demonstration &amp; Concept Breakdown
          </h2>
        </div>

        <button
          type="button"
          onClick={() => setShowExplanation((s) => !s)}
          className="px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 min-h-[40px]"
        >
          {showExplanation ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showExplanation ? 'Hide Explanation' : 'Show Explanation'}
        </button>
      </div>

      {/* Main Split Layout: Video Stage + Side-by-Side Explanation */}
      <div className={`grid gap-6 ${showExplanation ? 'lg:grid-cols-12' : 'grid-cols-1'}`}>
        {/* Left: Video Player / Fallback Illustration & Controls */}
        <div className={`${showExplanation ? 'lg:col-span-6' : 'col-span-1'} space-y-4`}>
          {!usingFallback && activeVideo ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 overflow-hidden">
              <div className="aspect-video w-full bg-slate-900 relative">
                <video
                  ref={videoRef}
                  key={activeVideo.playableUrl}
                  controls
                  playsInline
                  preload="metadata"
                  poster={activeVideo.thumbnailUrl}
                  src={activeVideo.playableUrl}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                  onEnded={() => setIsPlaying(false)}
                  onError={() => setPlaybackFailed(true)}
                  className="w-full h-full object-contain"
                />
              </div>

              <div className="p-4 space-y-2 bg-white">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-blue-700">
                  <span className="font-semibold">
                    {activeVideo.provider} · {activeVideo.creator}
                  </span>
                  {formatDuration(activeVideo.durationSeconds) && (
                    <span className="font-mono tabular-nums text-slate-500">
                      Duration: {formatDuration(activeVideo.durationSeconds)}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-slate-900">{activeVideo.title}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{activeVideo.description}</p>
                <div className="text-[11px] text-slate-500">License: {activeVideo.license}</div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <ScientificIllustrationFallback
                type={result.visualFallbackType}
                conceptTitle={breakdown.conceptDemonstrated}
                externalPlaying={fallbackAnimPlaying}
                onTogglePlay={() => setFallbackAnimPlaying((p) => !p)}
              />
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
                {playbackFailed && activeVideo ? (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span>
                      The external video stream could not be played directly inside the browser. Displaying our clearly labelled scientific animation instead.
                    </span>
                    <a
                      href={activeVideo.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-700 font-semibold hover:underline inline-flex items-center gap-1"
                    >
                      Open Original Video <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ) : (
                  <span>
                    No exact open-license demonstration video matched this query from Wikimedia Commons or NASA, so a verified interactive scientific model is shown instead (we never show unrelated filler videos).
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Action Controls Bar */}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handlePlayPause}
              className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5 min-h-[40px]"
            >
              {(usingFallback ? fallbackAnimPlaying : isPlaying) ? (
                <Pause className="w-3.5 h-3.5" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              {usingFallback
                ? fallbackAnimPlaying
                  ? 'Pause Model'
                  : 'Play Model'
                : isPlaying
                  ? 'Pause'
                  : 'Play'}
            </button>

            {activeVideo && (
              <a
                href={activeVideo.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 min-h-[40px]"
              >
                <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                Open Original Video
              </a>
            )}

            <button
              type="button"
              onClick={onSearchAnotherVideo}
              disabled={searchingAnother}
              className="px-3.5 py-2 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50 flex items-center gap-1.5 min-h-[40px]"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-blue-700 ${searchingAnother ? 'animate-spin' : ''}`} />
              {searchingAnother ? 'Searching...' : 'Find Another Relevant Video'}
            </button>

            {activeVideo && (
              <button
                type="button"
                onClick={() => toggleSaveVideo(activeVideo)}
                className={`px-3.5 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 min-h-[40px] ${
                  saved
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold'
                    : 'border-slate-300 bg-white text-slate-800 hover:bg-slate-50'
                }`}
              >
                {saved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                {saved ? 'Saved to My Learning' : 'Save Video'}
              </button>
            )}
          </div>

          {videoError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-900">
              <span>{videoError}</span>
              <button
                type="button"
                onClick={onRetryVideo}
                className="px-3 py-1.5 rounded-lg bg-rose-700 text-white font-semibold"
              >
                Retry
              </button>
            </div>
          )}

          {/* Thumbnail Selector when multiple relevant videos found */}
          {videos.length > 1 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">
                More Verified Videos ({videos.length})
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                {videos.map((v, idx) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => {
                      setSelectedIdx(idx);
                      setPlaybackFailed(false);
                      setIsPlaying(false);
                    }}
                    className={`rounded-lg border p-2 text-left flex items-center gap-2 transition-colors ${
                      idx === selectedIdx
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="w-14 h-10 object-cover rounded shrink-0 bg-slate-900"
                    />
                    <div className="min-w-0">
                      <div className="text-[11px] font-semibold text-slate-900 truncate">{v.title}</div>
                      <div className="text-[10px] text-slate-500 truncate">{v.provider}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Try This Yourself in the Virtual Lab */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">
                  Try this yourself in the Virtual Lab.
                </div>
                <p className="text-xs text-slate-700 mt-0.5">
                  {result.suggestedExperimentId
                    ? result.suggestedExperimentReason
                    : 'Use the AI Experiment Creator to build a deterministic interactive model for this phenomenon.'}
                </p>
              </div>
              <button
                type="button"
                onClick={handleOpenLab}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 shrink-0 min-h-[40px]"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                {result.suggestedExperimentId ? 'Start Related Experiment' : 'Design in Experiment Creator'}
              </button>
            </div>
            <div className="text-[11px] text-slate-600 flex items-start gap-1.5 pt-1 border-t border-emerald-200/70">
              <Info className="w-3.5 h-3.5 text-emerald-700 shrink-0 mt-0.5" />
              <span>
                Visual demonstrations show real phenomena qualitatively; numerical measurements come strictly from deterministic Virtual Lab models.
              </span>
            </div>
          </div>
        </div>

        {/* Right: AI Classes 6–10 Phenomenon Explanation */}
        {showExplanation && (
          <div className="lg:col-span-6 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs sm:text-sm">
              <div>
                <div className="text-xs font-semibold text-blue-700">What Is Happening?</div>
                <p className="text-slate-900 mt-1 leading-relaxed">{breakdown.whatIsHappening}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-blue-700">Scientific Concept Demonstrated</div>
                <p className="text-slate-900 mt-1 font-medium">{breakdown.conceptDemonstrated}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-blue-700">What Should You Observe?</div>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                  {breakdown.whatToObserve.map((item, i) => (
                    <li key={i}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-blue-700">Why Does It Happen?</div>
                <p className="text-slate-700 mt-1 leading-relaxed">{breakdown.whyItHappens}</p>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-blue-700">Scientific Laws &amp; Principles</div>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                  {breakdown.scientificLaws.map((law, i) => (
                    <li key={i}>{law}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-blue-700">Real-World Applications</div>
                <ul className="list-disc pl-4 mt-1 space-y-1 text-slate-700">
                  {breakdown.realWorldApplications.map((app, i) => (
                    <li key={i}>{app}</li>
                  ))}
                </ul>
              </div>

              <div className="pt-2 border-t border-slate-200">
                <div className="text-xs font-semibold text-amber-700">Limitations of the Demonstration</div>
                <p className="text-slate-700 mt-1 leading-relaxed">{breakdown.demonstrationLimitations}</p>
              </div>

              <div className="rounded-lg border border-emerald-200 bg-white p-3 flex items-start gap-2 text-xs">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-slate-900">Classroom Demo vs. Safe Student Activity</div>
                  <p className="text-slate-600 mt-0.5">{breakdown.classroomSafetyDistinction}</p>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 flex items-start gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                <span>
                  This explanation covers the scientific phenomenon shown in the matched educational resource and does not claim frame-by-frame inspection of the video file.
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
