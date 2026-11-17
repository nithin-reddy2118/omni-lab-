import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Film,
  Loader2,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Subtitles,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { renderSmartSceneFrame } from '../../engine/smartCanvasRenderer';
import { buildSrtContent } from '../../engine/smartLessonEngine';
import type {
  EnvironmentCapabilities,
  SmartLanguage,
  SmartLessonPackage,
  VideoPipelineStage,
} from '../../types/smartLearning';

interface ConceptVideoPlayerProps {
  lesson: SmartLessonPackage;
  capabilities: EnvironmentCapabilities | null;
  interactiveParams?: {
    a?: number;
    b?: number;
    forceN?: number;
    massKg?: number;
    voltageV?: number;
    resistanceOhm?: number;
  };
  onLanguageSwitch?: (lang: SmartLanguage) => void;
  onMp4Generated?: (mp4Url: string, durationSec: number) => void;
}

export function ConceptVideoPlayer({
  lesson,
  capabilities,
  interactiveParams,
  onLanguageSwitch,
  onMp4Generated,
}: ConceptVideoPlayerProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playerWrapperRef = useRef<HTMLDivElement | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTimeSec, setCurrentTimeSec] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [showSubtitles, setShowSubtitles] = useState<boolean>(true);
  const [volume, setVolume] = useState<number>(0.85);
  const [muted, setMuted] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Voice Narration State (Real Gemini TTS + Optional Browser Device Fallback)
  const [ttsVoice, setTtsVoice] = useState<'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr'>('Kore');
  const [ttsStatus, setTtsStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable'>('idle');
  const [ttsMessage, setTtsMessage] = useState<string>('');
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsAudioBase64, setTtsAudioBase64] = useState<string | null>(null);
  const [deviceSpeechPlaying, setDeviceSpeechPlaying] = useState<boolean>(false);

  // Adaptive Bandwidth Video Quality Preset
  const [videoQuality, setVideoQuality] = useState<'high' | 'balanced' | 'low-bandwidth'>('balanced');

  // Real FFmpeg MP4 Export Pipeline State
  const [pipelineStage, setPipelineStage] = useState<VideoPipelineStage>('idle');
  const [pipelineProgress, setPipelineProgress] = useState<number>(0);
  const [pipelineError, setPipelineError] = useState<string | null>(null);
  const [renderedMp4Url, setRenderedMp4Url] = useState<string | null>(null);
  const [renderedMp4SizeBytes, setRenderedMp4SizeBytes] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'canvas' | 'mp4'>('canvas');

  const sceneTimings = useMemo(() => {
    let cursor = 0;
    return lesson.scenes.map((scene) => {
      const start = cursor;
      cursor += scene.durationSec;
      return { scene, start, end: cursor };
    });
  }, [lesson.scenes]);

  const totalDurationSec = useMemo(
    () => Math.max(2, sceneTimings[sceneTimings.length - 1]?.end ?? 6),
    [sceneTimings]
  );

  const activeSceneEntry = useMemo(() => {
    const found = sceneTimings.find(
      (s) => currentTimeSec >= s.start && currentTimeSec < s.end
    );
    return found ?? sceneTimings[sceneTimings.length - 1];
  }, [sceneTimings, currentTimeSec]);

  // Reset player state cleanly when lesson changes
  useEffect(() => {
    setCurrentTimeSec(0);
    setIsPlaying(true);
    setTtsStatus('idle');
    setTtsMessage('');
    setTtsAudioBase64(null);
    setPipelineStage('idle');
    setPipelineProgress(0);
    setPipelineError(null);
    setRenderedMp4Url(null);
    setViewMode('canvas');
    setDeviceSpeechPlaying(false);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (ttsAudioUrl) {
      URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lesson.id]);

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // Playback animation loop
  useEffect(() => {
    if (!isPlaying || viewMode !== 'canvas') return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000) * playbackSpeed;
      last = now;
      setCurrentTimeSec((prev) => {
        const next = prev + dt;
        if (next >= totalDurationSec) {
          setIsPlaying(false);
          return totalDurationSec;
        }
        return next;
      });
      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, playbackSpeed, totalDurationSec, viewMode]);

  // Draw current Canvas frame whenever time or params update
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !activeSceneEntry) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const span = Math.max(0.1, activeSceneEntry.end - activeSceneEntry.start);
    const localProgress = (currentTimeSec - activeSceneEntry.start) / span;

    renderSmartSceneFrame(
      ctx,
      canvas.width,
      canvas.height,
      activeSceneEntry.scene,
      localProgress,
      {
        showSubtitles,
        subtitleText: activeSceneEntry.scene.subtitleText,
        interactiveParams,
      }
    );
  }, [activeSceneEntry, currentTimeSec, showSubtitles, interactiveParams]);

  // Synchronize Audio Element with Play/Pause/Volume/Speed
  useEffect(() => {
    const audio = audioElRef.current;
    if (!audio || !ttsAudioUrl) return;
    audio.volume = muted ? 0 : volume;
    audio.playbackRate = playbackSpeed;
    if (isPlaying && viewMode === 'canvas') {
      if (audio.paused) {
        audio.play().catch(() => {});
      }
    } else if (!audio.paused) {
      audio.pause();
    }
  }, [isPlaying, volume, muted, playbackSpeed, ttsAudioUrl, viewMode]);

  const handleGenerateNarration = async (): Promise<string | null> => {
    setTtsStatus('loading');
    setTtsMessage(`Requesting real voice narration (${ttsVoice}) via Gemini TTS...`);
    try {
      const resp = await fetch('/api/smart-learning/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: lesson.narrationScript,
          language: lesson.language,
          voiceName: ttsVoice,
        }),
      });
      const data = (await resp.json()) as {
        available?: boolean;
        audioBase64?: string;
        mimeType?: string;
        reason?: string;
        modelUsed?: string;
      };

      if (!data.available || !data.audioBase64) {
        setTtsStatus('unavailable');
        setTtsMessage(
          data.reason ||
            'Voice narration provider is currently unavailable. Use Device Speech Fallback or synchronized subtitles.'
        );
        return null;
      }

      const byteChars = atob(data.audioBase64);
      const byteNums = new Uint8Array(byteChars.length);
      for (let i = 0; i < byteChars.length; i++) {
        byteNums[i] = byteChars.charCodeAt(i);
      }
      const blob = new Blob([byteNums], { type: data.mimeType || 'audio/wav' });
      const blobUrl = URL.createObjectURL(blob);
      if (ttsAudioUrl) URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(blobUrl);
      setTtsAudioBase64(data.audioBase64);
      setTtsStatus('ready');
      setTtsMessage(
        `${lesson.language === 'kn' ? 'Kannada' : 'English'} voice narration ready (${ttsVoice}${data.modelUsed ? ` · ${data.modelUsed}` : ''}).`
      );
      return data.audioBase64;
    } catch (err) {
      setTtsStatus('unavailable');
      setTtsMessage(
        err instanceof Error
          ? `${err.message} Text explanation & subtitles remain active.`
          : 'Voice service unreachable.'
      );
      return null;
    }
  };

  const handleToggleDeviceSpeech = () => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    if (deviceSpeechPlaying) {
      window.speechSynthesis.cancel();
      setDeviceSpeechPlaying(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(lesson.narrationScript);
    utter.rate = playbackSpeed;
    utter.lang = lesson.language === 'kn' ? 'kn-IN' : 'en-US';
    utter.onend = () => setDeviceSpeechPlaying(false);
    utter.onerror = () => setDeviceSpeechPlaying(false);
    setDeviceSpeechPlaying(true);
    window.speechSynthesis.speak(utter);
  };

  // REAL FFmpeg MP4 Rendering Pipeline (Canvas Frame Sequence + Optional TTS WAV + SRT Subtitles)
  const handleRenderMp4 = async () => {
    setPipelineError(null);
    setPipelineStage('rendering-frames');
    setPipelineProgress(12);

    try {
      // 1. Initialize server FFmpeg render job
      const initResp = await fetch('/api/smart-learning/render/init', { method: 'POST' });
      const initData = (await initResp.json()) as { jobId: string; ffmpegInstalled: boolean };
      if (!initData.ffmpegInstalled) {
        throw new Error('FFmpeg binary is not installed on the server.');
      }

      // 2. Capture genuine animated offscreen Canvas frames based on selected quality preset
      const preset =
        videoQuality === 'high'
          ? { width: 960, height: 540, fps: 8, jpegQuality: 0.85 }
          : videoQuality === 'low-bandwidth'
            ? { width: 480, height: 270, fps: 4, jpegQuality: 0.58 }
            : { width: 640, height: 360, fps: 6, jpegQuality: 0.72 };

      const offscreen = document.createElement('canvas');
      offscreen.width = preset.width;
      offscreen.height = preset.height;
      const ctx = offscreen.getContext('2d');
      if (!ctx) throw new Error('Browser 2D Canvas context unavailable.');

      const fps = preset.fps;
      const totalFrames = Math.min(480, Math.max(12, Math.round(totalDurationSec * fps)));
      const batch: string[] = [];

      for (let i = 0; i < totalFrames; i++) {
        const t = (i / fps);
        const found =
          sceneTimings.find((s) => t >= s.start && t < s.end) ??
          sceneTimings[sceneTimings.length - 1];
        const span = Math.max(0.1, found.end - found.start);
        const localP = (t - found.start) / span;

        renderSmartSceneFrame(ctx, offscreen.width, offscreen.height, found.scene, localP, {
          showSubtitles: true,
          subtitleText: found.scene.subtitleText,
          interactiveParams,
        });

        batch.push(offscreen.toDataURL('image/jpeg', preset.jpegQuality));

        if (batch.length >= 24 || i === totalFrames - 1) {
          const uploadResp = await fetch(`/api/smart-learning/render/${initData.jobId}/frames`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frames: batch.splice(0, batch.length) }),
          });
          if (!uploadResp.ok) {
            throw new Error('Failed to stream rendered frames to FFmpeg worker.');
          }
          setPipelineProgress(15 + Math.round(((i + 1) / totalFrames) * 45));
        }
      }

      // 3. Generate/Attach Real TTS Audio if not yet generated
      setPipelineStage('synthesizing-tts');
      setPipelineProgress(68);
      let wavBase64 = ttsAudioBase64;
      if (!wavBase64 && ttsStatus !== 'unavailable' && capabilities?.geminiConfigured) {
        wavBase64 = await handleGenerateNarration();
      }

      // 4. Mux video + audio + SRT via FFmpeg on server
      setPipelineStage('muxing-mp4');
      setPipelineProgress(82);
      const subtitlesSrt = buildSrtContent(lesson.subtitleSegments);

      const finalResp = await fetch(`/api/smart-learning/render/${initData.jobId}/finalize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fps,
          audioWavBase64: wavBase64,
          subtitlesSrt,
        }),
      });
      const finalData = (await finalResp.json()) as {
        downloadUrl?: string;
        sizeBytes?: number;
        error?: string;
      };
      if (!finalResp.ok || !finalData.downloadUrl) {
        throw new Error(finalData.error || 'FFmpeg MP4 compilation failed.');
      }

      setRenderedMp4Url(finalData.downloadUrl);
      setRenderedMp4SizeBytes(finalData.sizeBytes ?? 0);
      setPipelineStage('mp4-ready');
      setPipelineProgress(100);
      setViewMode('mp4');
      onMp4Generated?.(finalData.downloadUrl, totalDurationSec);
    } catch (err) {
      setPipelineStage('error');
      setPipelineError(err instanceof Error ? err.message : 'MP4 video export failed.');
    }
  };

  const handleToggleFullscreen = () => {
    const el = playerWrapperRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div
      ref={playerWrapperRef}
      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden"
    >
      {/* Mode & Truthfulness Header Bar */}
      <div className="px-4 py-3 border-b border-slate-200 bg-slate-50 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-900 flex items-center gap-1.5">
            <Film className="w-4 h-4 text-blue-700" />
            {viewMode === 'mp4' && renderedMp4Url
              ? 'Rendered H.264 MP4 Video'
              : 'Interactive Canvas Animation Preview'}
          </span>
          <span className="text-slate-400">·</span>
          <span className="text-slate-600">
            {lesson.scenes.length} Scenes · {totalDurationSec.toFixed(1)}s
          </span>
          {capabilities && (
            <>
              <span className="text-slate-400">·</span>
              <span className="font-mono text-[11px] text-slate-500">
                {capabilities.manimInstalled
                  ? 'Manim Ready'
                  : 'Canvas 2D + FFmpeg MP4'}
              </span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {renderedMp4Url && (
            <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('canvas')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  viewMode === 'canvas' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Live Interactive
              </button>
              <button
                type="button"
                onClick={() => setViewMode('mp4')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  viewMode === 'mp4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Rendered MP4
              </button>
            </div>
          )}

          {onLanguageSwitch && (
            <div className="flex items-center p-0.5 rounded-lg bg-slate-200/80 text-xs">
              <button
                type="button"
                onClick={() => onLanguageSwitch('en')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  lesson.language === 'en' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => onLanguageSwitch('kn')}
                className={`px-2.5 py-1 rounded-md font-medium ${
                  lesson.language === 'kn' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                ಕನ್ನಡ
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Theater Viewport */}
      <div className="relative bg-[#0B1324] aspect-video w-full overflow-hidden">
        {viewMode === 'mp4' && renderedMp4Url ? (
          <video
            src={renderedMp4Url}
            controls
            autoPlay
            className="w-full h-full object-contain bg-[#0B1324]"
          />
        ) : (
          <canvas
            ref={canvasRef}
            width={960}
            height={540}
            className="w-full h-full object-contain block"
          />
        )}
        {ttsAudioUrl && <audio ref={audioElRef} src={ttsAudioUrl} />}
      </div>

      {/* Interactive Player Controls (Canvas Mode) */}
      <div className="p-4 space-y-3 border-t border-slate-200 bg-white">
        {viewMode === 'canvas' && (
          <>
            <div className="flex items-center gap-3">
              <span className="text-xs font-mono tabular-nums text-slate-600 w-10">
                {formatTime(currentTimeSec)}
              </span>
              <input
                type="range"
                aria-label="Seek animation timeline"
                min={0}
                max={totalDurationSec}
                step={0.05}
                value={currentTimeSec}
                onChange={(e) => {
                  const nextTime = Number(e.target.value);
                  setCurrentTimeSec(nextTime);
                  if (audioElRef.current && ttsAudioUrl) {
                    audioElRef.current.currentTime = Math.min(
                      audioElRef.current.duration || nextTime,
                      nextTime
                    );
                  }
                }}
                className="flex-1 accent-blue-700 cursor-pointer"
              />
              <span className="text-xs font-mono tabular-nums text-slate-600 w-10 text-right">
                {formatTime(totalDurationSec)}
              </span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (currentTimeSec >= totalDurationSec - 0.05) {
                      setCurrentTimeSec(0);
                      if (audioElRef.current) audioElRef.current.currentTime = 0;
                    }
                    setIsPlaying((p) => !p);
                  }}
                  className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5 min-h-[38px]"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  {isPlaying ? 'Pause' : 'Play'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentTimeSec(0);
                    if (audioElRef.current) audioElRef.current.currentTime = 0;
                    setIsPlaying(true);
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium hover:text-slate-900 flex items-center gap-1.5 min-h-[38px]"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Replay
                </button>
                <select
                  aria-label="Playback speed"
                  value={playbackSpeed}
                  onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-mono text-slate-800 min-h-[38px]"
                >
                  <option value={0.5}>0.5x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.5}>1.5x</option>
                  <option value={2}>2.0x</option>
                </select>
                <button
                  type="button"
                  onClick={() => setShowSubtitles((s) => !s)}
                  className={`px-3 py-2 rounded-lg border text-xs font-medium flex items-center gap-1.5 min-h-[38px] ${
                    showSubtitles
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <Subtitles className="w-3.5 h-3.5" />
                  Subtitles {showSubtitles ? 'On' : 'Off'}
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMuted((m) => !m)}
                  aria-label={muted ? 'Unmute audio' : 'Mute audio'}
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700"
                >
                  {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
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
                  className="w-20 accent-blue-700 cursor-pointer"
                />
                <button
                  type="button"
                  onClick={handleToggleFullscreen}
                  aria-label="Toggle fullscreen"
                  className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-slate-950"
                >
                  {isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </>
        )}

        {/* Scene Jump Strip */}
        <div className="flex gap-2 overflow-x-auto pb-1 pt-1">
          {sceneTimings.map((entry) => {
            const active = activeSceneEntry?.scene.id === entry.scene.id;
            return (
              <button
                key={entry.scene.id}
                type="button"
                onClick={() => {
                  setViewMode('canvas');
                  setCurrentTimeSec(entry.start + 0.02);
                  setIsPlaying(true);
                }}
                className={`px-2.5 py-1.5 rounded-lg border text-[11px] whitespace-nowrap shrink-0 transition-colors ${
                  active
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                    : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                }`}
              >
                {entry.scene.sceneNumber}. {entry.scene.title.replace(/^Scene \d+:\s*/i, '')}
              </button>
            );
          })}
        </div>

        {/* Voice Narration & Real FFmpeg MP4 Export Pipeline */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-xs text-slate-700">
              <strong className="text-slate-900">Voice Narration &amp; Video Export Pipeline:</strong>{' '}
              {ttsStatus === 'ready'
                ? ttsMessage
                : ttsStatus === 'unavailable'
                  ? ttsMessage
                  : 'Generate spoken narration audio or compile a real H.264 MP4 video via FFmpeg.'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Video quality preset"
                value={videoQuality}
                onChange={(e) => setVideoQuality(e.target.value as 'high' | 'balanced' | 'low-bandwidth')}
                className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium"
                title="Adjust canvas export resolution and frame rate for bandwidth"
              >
                <option value="high">High (540p · 8fps)</option>
                <option value="balanced">Balanced (360p · 6fps)</option>
                <option value="low-bandwidth">Low-Bandwidth (270p · 4fps)</option>
              </select>

              <select
                aria-label="Narration voice"
                value={ttsVoice}
                onChange={(e) => setTtsVoice(e.target.value as 'Kore' | 'Puck' | 'Charon' | 'Fenrir' | 'Zephyr')}
                className="px-2.5 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-medium"
                title="Select Gemini TTS narrator voice"
              >
                <option value="Kore">Voice: Kore</option>
                <option value="Puck">Voice: Puck</option>
                <option value="Charon">Voice: Charon</option>
                <option value="Fenrir">Voice: Fenrir</option>
                <option value="Zephyr">Voice: Zephyr</option>
              </select>

              <button
                type="button"
                disabled={ttsStatus === 'loading'}
                onClick={handleGenerateNarration}
                className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 text-xs font-semibold hover:border-blue-400 disabled:opacity-50 flex items-center gap-1.5"
              >
                {ttsStatus === 'loading' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-700" />
                ) : (
                  <Volume2 className="w-3.5 h-3.5 text-blue-700" />
                )}
                {ttsStatus === 'ready' ? 'Regenerate Voice' : 'Generate Voice Narration'}
              </button>

              {typeof window !== 'undefined' && 'speechSynthesis' in window && (
                <button
                  type="button"
                  onClick={handleToggleDeviceSpeech}
                  className={`px-3 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1.5 ${
                    deviceSpeechPlaying
                      ? 'border-amber-500 bg-amber-50 text-amber-900'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400'
                  }`}
                  title="Optional browser SpeechSynthesis voice fallback"
                >
                  {deviceSpeechPlaying ? 'Stop Device Voice' : 'Device Speech Fallback'}
                </button>
              )}

              <button
                type="button"
                disabled={
                  !capabilities?.ffmpegInstalled ||
                  (pipelineStage !== 'idle' &&
                    pipelineStage !== 'mp4-ready' &&
                    pipelineStage !== 'error')
                }
                onClick={handleRenderMp4}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 disabled:opacity-45 flex items-center gap-1.5"
              >
                {pipelineStage === 'rendering-frames' ||
                pipelineStage === 'synthesizing-tts' ||
                pipelineStage === 'muxing-mp4' ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Film className="w-3.5 h-3.5" />
                )}
                {renderedMp4Url ? 'Re-Render MP4 Video' : 'Render Real MP4 Video'}
              </button>

              {/* Strict Truthfulness: Download button ONLY renders once a real MP4 file exists */}
              {renderedMp4Url && pipelineStage === 'mp4-ready' && (
                <a
                  href={`${renderedMp4Url}?download=1`}
                  download
                  className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download MP4 ({Math.max(1, Math.round(renderedMp4SizeBytes / 1024))} KB)
                </a>
              )}
            </div>
          </div>

          {(pipelineStage === 'rendering-frames' ||
            pipelineStage === 'synthesizing-tts' ||
            pipelineStage === 'muxing-mp4') && (
            <div className="space-y-1">
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-600">
                <span>
                  Stage:{' '}
                  {pipelineStage === 'rendering-frames'
                    ? 'Capturing Canvas Animation Frames'
                    : pipelineStage === 'synthesizing-tts'
                      ? 'Synthesizing Voice Audio Track'
                      : 'Muxing H.264 Video + Audio via FFmpeg'}
                </span>
                <span className="tabular-nums">{pipelineProgress}%</span>
              </div>
              <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full bg-emerald-600 transition-all duration-200"
                  style={{ width: `${pipelineProgress}%` }}
                />
              </div>
            </div>
          )}

          {pipelineStage === 'mp4-ready' && renderedMp4Url && (
            <div className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-700" />
              <span>
                Real MP4 compiled successfully via FFmpeg ({Math.round(renderedMp4SizeBytes / 1024)} KB). Click &ldquo;Download MP4&rdquo; to save locally.
              </span>
            </div>
          )}

          {pipelineStage === 'error' && pipelineError && (
            <div className="text-xs text-rose-800 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 flex items-center justify-between gap-2">
              <span className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
                {pipelineError}
              </span>
              <button
                type="button"
                onClick={handleRenderMp4}
                className="underline font-semibold shrink-0"
              >
                Retry Render
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
