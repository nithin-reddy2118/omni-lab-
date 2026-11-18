import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  Loader2,
  Pause,
  Play,
  RefreshCw,
  RotateCcw,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import type { SmartLanguage } from '../../types/smartLearning';
import {
  buildProportionalSubtitles,
  isDeviceSpeechSupported,
  synthesizeAndValidateAudio,
  type ValidatedAudioAsset,
} from '../../utils/audioPlayer';

export interface NarrationSegmentInput {
  label?: string;
  text: string;
}

interface AudioNarrationBarProps {
  title: string;
  text?: string;
  segments?: NarrationSegmentInput[];
  language?: SmartLanguage;
  compact?: boolean;
  className?: string;
  showSubtitlesByDefault?: boolean;
  onAssetReady?: (asset: ValidatedAudioAsset) => void;
}

const SPEED_OPTIONS = [0.75, 1, 1.25, 1.5, 2];

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const total = Math.floor(sec);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function AudioNarrationBar({
  title,
  text = '',
  segments,
  language: overrideLanguage,
  compact = false,
  className = '',
  showSubtitlesByDefault = false,
  onAssetReady,
}: AudioNarrationBarProps) {
  const { language: globalLanguage } = useLab();
  const activeLang: SmartLanguage = overrideLanguage ?? globalLanguage;

  const effectiveSegments = useMemo<NarrationSegmentInput[]>(() => {
    if (segments && segments.length > 0) {
      return segments.filter((s) => s.text.trim().length > 0);
    }
    return text.trim() ? [{ text: text.trim() }] : [];
  }, [segments, text]);

  const combinedText = useMemo(
    () => effectiveSegments.map((s) => (s.label ? `${s.label}. ${s.text}` : s.text)).join(' '),
    [effectiveSegments]
  );

  const subtitleSlices = useMemo(
    () => buildProportionalSubtitles(effectiveSegments),
    [effectiveSegments]
  );

  const [expanded, setExpanded] = useState(!compact);
  const [status, setStatus] = useState<'idle' | 'generating' | 'ready' | 'error' | 'fallback-active'>('idle');
  const [asset, setAsset] = useState<ValidatedAudioAsset | null>(null);
  const [errorReason, setErrorReason] = useState<string | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [volume, setVolume] = useState(0.95);
  const [muted, setMuted] = useState(false);
  const [showSubtitles, setShowSubtitles] = useState(showSubtitlesByDefault);
  const [fallbackActiveIdx, setFallbackActiveIdx] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const contentKey = `${activeLang}::${combinedText}`;
  const prevKeyRef = useRef(contentKey);

  const stopDeviceSpeech = useCallback(() => {
    if (isDeviceSpeechSupported()) {
      window.speechSynthesis.cancel();
    }
  }, []);

  // Reset playback state cleanly whenever underlying lesson/experiment text changes
  useEffect(() => {
    if (prevKeyRef.current !== contentKey) {
      prevKeyRef.current = contentKey;
      abortRef.current?.abort();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      stopDeviceSpeech();
      setAsset(null);
      setStatus('idle');
      setErrorReason(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
    }
  }, [contentKey, stopDeviceSpeech]);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopDeviceSpeech();
    };
  }, [stopDeviceSpeech]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.playbackRate = playbackRate;
    audioRef.current.volume = muted ? 0 : volume;
  }, [playbackRate, volume, muted, asset]);

  const generateAndPlay = useCallback(async () => {
    if (!combinedText.trim()) return;
    setExpanded(true);
    setShowSubtitles(true);

    // If asset already matches and exists, just toggle play
    if (asset && status === 'ready' && audioRef.current) {
      if (audioRef.current.paused) {
        await audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    stopDeviceSpeech();
    setStatus('generating');
    setErrorReason(null);

    const result = await synthesizeAndValidateAudio({
      text: combinedText,
      language: activeLang,
      signal: controller.signal,
    });

    if (controller.signal.aborted) return;

    if (result.ok) {
      setAsset(result);
      setDuration(result.durationSec);
      setCurrentTime(0);
      setStatus('ready');
      onAssetReady?.(result);

      window.setTimeout(() => {
        if (audioRef.current) {
          audioRef.current.playbackRate = playbackRate;
          audioRef.current.volume = muted ? 0 : volume;
          audioRef.current.play().catch(() => {
            setIsPlaying(false);
          });
        }
      }, 40);
    } else {
      setStatus('error');
      setErrorReason(result.reason);
      setIsPlaying(false);
    }
  }, [activeLang, asset, combinedText, muted, onAssetReady, playbackRate, status, stopDeviceSpeech, volume]);

  const handleTogglePlayPause = async () => {
    if (status === 'fallback-active') {
      if (!isDeviceSpeechSupported()) return;
      if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
        window.speechSynthesis.pause();
        setIsPlaying(false);
      } else if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
        setIsPlaying(true);
      } else {
        startDeviceSpeechFallback();
      }
      return;
    }

    if (!asset || status !== 'ready') {
      await generateAndPlay();
      return;
    }
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      await el.play().catch(() => {});
    } else {
      el.pause();
    }
  };

  const handleReplay = async () => {
    if (status === 'fallback-active') {
      startDeviceSpeechFallback();
      return;
    }
    const el = audioRef.current;
    if (!el || !asset) {
      await generateAndPlay();
      return;
    }
    el.currentTime = 0;
    setCurrentTime(0);
    await el.play().catch(() => {});
  };

  const startDeviceSpeechFallback = useCallback(() => {
    if (!isDeviceSpeechSupported() || subtitleSlices.length === 0) return;
    stopDeviceSpeech();
    setExpanded(true);
    setShowSubtitles(true);
    setStatus('fallback-active');
    setIsPlaying(true);

    let cancelled = false;
    const speakNext = (idx: number) => {
      if (cancelled || idx >= subtitleSlices.length) {
        setIsPlaying(false);
        return;
      }
      setFallbackActiveIdx(idx);
      const utter = new SpeechSynthesisUtterance(subtitleSlices[idx].text);
      utter.lang = activeLang === 'kn' ? 'kn-IN' : activeLang === 'hi' ? 'hi-IN' : 'en-US';
      utter.rate = playbackRate;
      utter.volume = muted ? 0 : volume;
      utter.onend = () => speakNext(idx + 1);
      utter.onerror = () => setIsPlaying(false);
      window.speechSynthesis.speak(utter);
    };
    speakNext(0);
  }, [activeLang, muted, playbackRate, stopDeviceSpeech, subtitleSlices, volume]);

  const activeSubtitle = useMemo(() => {
    if (subtitleSlices.length === 0) return null;
    if (status === 'fallback-active') {
      return subtitleSlices[Math.min(fallbackActiveIdx, subtitleSlices.length - 1)];
    }
    const ratio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
    return (
      subtitleSlices.find((s) => ratio >= s.startRatio && ratio <= s.endRatio) ??
      subtitleSlices[0]
    );
  }, [currentTime, duration, fallbackActiveIdx, status, subtitleSlices]);

  if (!combinedText.trim()) return null;

  if (compact && !expanded) {
    return (
      <button
        type="button"
        onClick={() => void generateAndPlay()}
        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 min-h-[40px] ${className}`}
      >
        <Volume2 className="w-4 h-4 shrink-0" />
        <span>Listen ({title})</span>
      </button>
    );
  }

  return (
    <div
      className={`rounded-xl border border-slate-200 bg-slate-50/90 p-3.5 space-y-2.5 text-xs ${className}`}
      data-audio-status={status}
    >
      {asset && (
        <audio
          ref={audioRef}
          src={asset.blobUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(e) => {
            const dur = e.currentTarget.duration;
            if (Number.isFinite(dur) && dur > 0) setDuration(dur);
          }}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        />
      )}

      {/* Top Row: Play/Pause, Replay, Progress Slider, Speed, Volume, Subtitles */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => void handleTogglePlayPause()}
          disabled={status === 'generating'}
          aria-label={isPlaying ? `Pause narration for ${title}` : `Play narration for ${title}`}
          className="px-3 py-2 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 inline-flex items-center gap-1.5 min-h-[40px] shrink-0"
        >
          {status === 'generating' ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4" />
          ) : (
            <Play className="w-4 h-4" />
          )}
          <span>
            {status === 'generating'
              ? 'Generating Voice...'
              : isPlaying
                ? 'Pause'
                : status === 'ready' && currentTime > 0
                  ? 'Resume'
                  : `Listen · ${title}`}
          </span>
        </button>

        {(status === 'ready' || status === 'fallback-active') && (
          <button
            type="button"
            onClick={() => void handleReplay()}
            aria-label={`Replay narration for ${title}`}
            className="p-2 rounded-lg border border-slate-200 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700 min-h-[40px] min-w-[40px] inline-flex items-center justify-center"
            title="Replay from beginning"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        )}

        {/* Seekbar & Time */}
        {status === 'ready' && duration > 0 && (
          <div className="flex items-center gap-2 flex-1 min-w-[140px]">
            <span className="font-mono text-[11px] text-slate-600 tabular-nums shrink-0">
              {formatClock(currentTime)}
            </span>
            <input
              type="range"
              aria-label="Audio narration progress"
              min={0}
              max={duration}
              step={0.1}
              value={Math.min(duration, currentTime)}
              onChange={(e) => {
                const val = Number(e.target.value);
                setCurrentTime(val);
                if (audioRef.current) audioRef.current.currentTime = val;
              }}
              className="flex-1 accent-blue-700 h-2 cursor-pointer"
            />
            <span className="font-mono text-[11px] text-slate-500 tabular-nums shrink-0">
              {formatClock(duration)}
            </span>
          </div>
        )}

        {status === 'idle' && (
          <span className="text-[11px] text-slate-500 flex-1 min-w-[140px]">
            Ready to narrate ({activeLang.toUpperCase()} · {effectiveSegments.length} section
            {effectiveSegments.length === 1 ? '' : 's'})
          </span>
        )}

        {status === 'fallback-active' && (
          <span className="text-[11px] font-semibold text-amber-800 bg-amber-100 border border-amber-200 px-2 py-1 rounded flex-1">
            Device Speech Fallback Active
          </span>
        )}

        {/* Speed Selector */}
        <select
          aria-label="Playback speed"
          value={playbackRate}
          onChange={(e) => setPlaybackRate(Number(e.target.value))}
          className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-[11px] font-mono text-slate-800 min-h-[40px]"
        >
          {SPEED_OPTIONS.map((spd) => (
            <option key={spd} value={spd}>
              {spd}×
            </option>
          ))}
        </select>

        {/* Mute & Volume */}
        <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 min-h-[40px]">
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            aria-label={muted ? 'Unmute narration' : 'Mute narration'}
            className="text-slate-600 hover:text-slate-900"
          >
            {muted ? <VolumeX className="w-4 h-4 text-rose-600" /> : <Volume2 className="w-4 h-4 text-blue-700" />}
          </button>
          <input
            type="range"
            aria-label="Narration volume"
            min={0}
            max={1}
            step={0.05}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setMuted(false);
              setVolume(Number(e.target.value));
            }}
            className="w-14 accent-blue-700 cursor-pointer"
          />
        </div>

        {/* Subtitles Toggle */}
        <button
          type="button"
          onClick={() => setShowSubtitles((v) => !v)}
          aria-pressed={showSubtitles}
          className={`px-2.5 py-2 rounded-lg border text-[11px] font-semibold inline-flex items-center gap-1 min-h-[40px] ${
            showSubtitles
              ? 'border-blue-500 bg-blue-50 text-blue-800'
              : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900'
          }`}
        >
          <Subtitles className="w-3.5 h-3.5" />
          Subtitles
        </button>

        {compact && (
          <button
            type="button"
            onClick={() => {
              audioRef.current?.pause();
              stopDeviceSpeech();
              setIsPlaying(false);
              setExpanded(false);
            }}
            className="px-2 py-2 rounded-lg border border-slate-200 bg-white text-[11px] text-slate-500 hover:text-slate-900 min-h-[40px]"
          >
            Hide
          </button>
        )}
      </div>

      {/* Explicit Error + Retry + Honest Device Fallback */}
      {status === 'error' && errorReason && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-2.5 flex flex-wrap items-center justify-between gap-2 text-amber-950">
          <div className="flex items-start gap-2 flex-1 min-w-[200px]">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span className="leading-snug">{errorReason}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => void generateAndPlay()}
              className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 font-semibold text-amber-900 hover:bg-amber-100 inline-flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Retry Voice
            </button>
            {isDeviceSpeechSupported() && (
              <button
                type="button"
                onClick={startDeviceSpeechFallback}
                className="px-2.5 py-1.5 rounded-lg bg-amber-700 text-white font-semibold hover:bg-amber-800"
              >
                Use Device Speech Fallback
              </button>
            )}
          </div>
        </div>
      )}

      {/* Verified Source Attribution */}
      {asset && status === 'ready' && (
        <div className="text-[10px] font-mono text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            Verified WAV · {asset.chunkCount} chunk{asset.chunkCount > 1 ? 's' : ''} ·{' '}
            {(asset.byteLength / 1024).toFixed(1)} KB · {asset.modelUsed || 'Gemini TTS'}
            {asset.cached ? ' (Cached)' : ''}
          </span>
          <span>Speed {playbackRate}× · Vol {Math.round((muted ? 0 : volume) * 100)}%</span>
        </div>
      )}

      {/* Synchronized Subtitles / Transcript Highlight */}
      {showSubtitles && subtitleSlices.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white p-2.5 space-y-1.5 max-h-36 overflow-y-auto">
          <div className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
            Synchronized Narration Transcript
          </div>
          {subtitleSlices.map((sl) => {
            const isActive = activeSubtitle?.index === sl.index && (isPlaying || currentTime > 0 || status === 'fallback-active');
            return (
              <div
                key={sl.index}
                className={`px-2 py-1 rounded text-[11px] leading-relaxed transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-950 font-semibold border border-blue-200'
                    : 'text-slate-600'
                }`}
              >
                {sl.label && <span className="font-mono text-[10px] text-blue-700 mr-1.5">[{sl.label}]</span>}
                {sl.text}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
