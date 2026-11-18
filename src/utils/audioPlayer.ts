import type { SmartLanguage } from '../types/smartLearning';

export interface ValidatedAudioAsset {
  blobUrl: string;
  audioBase64: string;
  mimeType: string;
  byteLength: number;
  durationSec: number;
  chunkCount: number;
  normalizedText: string;
  modelUsed?: string;
  cached: boolean;
}

export type AudioSynthesisResult =
  | ({ ok: true } & ValidatedAudioAsset)
  | { ok: false; code: string; reason: string };

const CLIENT_AUDIO_CACHE = new Map<string, ValidatedAudioAsset>();
const MAX_CLIENT_CACHE = 40;

function getCacheKey(text: string, language: SmartLanguage, voiceName: string): string {
  return `${language}::${voiceName}::${text.trim()}`;
}

export function validateWavBytes(bytes: Uint8Array, mimeType?: string): { valid: boolean; reason?: string } {
  if (!bytes || bytes.length < 48) {
    return { valid: false, reason: 'Audio response is empty or too short.' };
  }
  if (!mimeType || !/audio\/(wav|x-wav|wave|mpeg|mp3|ogg|webm)/i.test(mimeType)) {
    return { valid: false, reason: `Unsupported audio MIME type: ${mimeType || 'unknown'}` };
  }
  if (/wav/i.test(mimeType)) {
    const riff = String.fromCharCode(bytes[0], bytes[1], bytes[2], bytes[3]);
    const wave = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    if (riff !== 'RIFF' || wave !== 'WAVE') {
      return { valid: false, reason: 'Invalid WAV container header (missing RIFF/WAVE signature).' };
    }
    // Check that PCM bytes aren't all zero
    let hasSignal = false;
    const step = Math.max(1, Math.floor((bytes.length - 44) / 200));
    for (let i = 44; i < bytes.length; i += step) {
      if (bytes[i] !== 0) {
        hasSignal = true;
        break;
      }
    }
    if (!hasSignal) {
      return { valid: false, reason: 'WAV audio payload contains only silence bytes.' };
    }
  }
  return { valid: true };
}

export function verifyBrowserAudioPlayable(url: string): Promise<{ valid: boolean; durationSec: number; reason?: string }> {
  if (typeof Audio === 'undefined') {
    return Promise.resolve({ valid: true, durationSec: 0 });
  }
  return new Promise((resolve) => {
    const el = new Audio();
    el.preload = 'metadata';
    let settled = false;

    const cleanup = () => {
      el.onloadedmetadata = null;
      el.onerror = null;
      el.src = '';
    };

    const timer = window.setTimeout(() => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve({ valid: false, durationSec: 0, reason: 'Browser audio metadata verification timed out.' });
    }, 4000);

    el.onloadedmetadata = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      const dur = Number.isFinite(el.duration) && el.duration > 0 ? Number(el.duration.toFixed(2)) : 0;
      cleanup();
      if (dur <= 0) {
        resolve({ valid: false, durationSec: 0, reason: 'Decoded audio reports zero duration.' });
        return;
      }
      resolve({ valid: true, durationSec: dur });
    };

    el.onerror = () => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      cleanup();
      resolve({ valid: false, durationSec: 0, reason: 'Browser failed to decode the returned audio stream.' });
    };

    el.src = url;
  });
}

export async function synthesizeAndValidateAudio(opts: {
  text: string;
  language: SmartLanguage;
  voiceName?: string;
  signal?: AbortSignal;
  simulateFailure?: boolean;
}): Promise<AudioSynthesisResult> {
  const cleanText = opts.text.trim();
  const voiceName = opts.voiceName || 'Kore';
  if (!cleanText) {
    return { ok: false, code: 'EMPTY_TEXT', reason: 'No content text available to narrate.' };
  }

  const cacheKey = getCacheKey(cleanText, opts.language, voiceName);
  if (!opts.simulateFailure && CLIENT_AUDIO_CACHE.has(cacheKey)) {
    const cached = CLIENT_AUDIO_CACHE.get(cacheKey)!;
    return { ok: true, ...cached, cached: true };
  }

  try {
    const res = await fetch('/api/smart-learning/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: cleanText,
        language: opts.language,
        voiceName,
        simulateFailure: opts.simulateFailure === true ? true : undefined,
      }),
      signal: opts.signal,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.available || !data.audioBase64) {
      return {
        ok: false,
        code: data?.code || `HTTP_${res.status}`,
        reason:
          data?.reason ||
          data?.error ||
          `Narration request failed (status ${res.status}). You can retry or switch to Device Speech Fallback.`,
      };
    }

    const binary = atob(data.audioBase64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    const mimeType = String(data.mimeType || 'audio/wav');
    const byteValidation = validateWavBytes(bytes, mimeType);
    if (!byteValidation.valid) {
      return {
        ok: false,
        code: 'INVALID_WAV',
        reason: byteValidation.reason || 'Audio container validation failed.',
      };
    }

    const blob = new Blob([bytes], { type: mimeType });
    const blobUrl = URL.createObjectURL(blob);

    const playbackCheck = await verifyBrowserAudioPlayable(blobUrl);
    if (!playbackCheck.valid) {
      URL.revokeObjectURL(blobUrl);
      return {
        ok: false,
        code: 'DECODE_FAILED',
        reason: playbackCheck.reason || 'Audio file could not be decoded for playback.',
      };
    }

    const asset: ValidatedAudioAsset = {
      blobUrl,
      audioBase64: data.audioBase64,
      mimeType,
      byteLength: bytes.length,
      durationSec: playbackCheck.durationSec || Number(data.durationSecEstimate || 0),
      chunkCount: Number(data.chunkCount || 1),
      normalizedText: String(data.normalizedText || cleanText),
      modelUsed: data.modelUsed,
      cached: Boolean(data.cached),
    };

    if (CLIENT_AUDIO_CACHE.size >= MAX_CLIENT_CACHE) {
      const oldestKey = CLIENT_AUDIO_CACHE.keys().next().value;
      if (oldestKey) {
        const oldAsset = CLIENT_AUDIO_CACHE.get(oldestKey);
        if (oldAsset) URL.revokeObjectURL(oldAsset.blobUrl);
        CLIENT_AUDIO_CACHE.delete(oldestKey);
      }
    }
    CLIENT_AUDIO_CACHE.set(cacheKey, asset);

    return { ok: true, ...asset };
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { ok: false, code: 'ABORTED', reason: 'Audio synthesis request was cancelled.' };
    }
    return {
      ok: false,
      code: 'NETWORK_ERROR',
      reason: err instanceof Error ? err.message : 'Network error while generating voice narration.',
    };
  }
}

export interface SubtitleSlice {
  index: number;
  label?: string;
  text: string;
  startRatio: number;
  endRatio: number;
}

export function buildProportionalSubtitles(
  segments: { label?: string; text: string }[]
): SubtitleSlice[] {
  const flat: { label?: string; text: string }[] = [];
  for (const seg of segments) {
    const sentences = seg.text
      .replace(/\s+/g, ' ')
      .trim()
      .split(/(?<=[.!?।])\s+/)
      .filter((s) => s.trim().length > 0);
    if (sentences.length === 0 && seg.text.trim()) {
      flat.push({ label: seg.label, text: seg.text.trim() });
    } else {
      sentences.forEach((s) => flat.push({ label: seg.label, text: s.trim() }));
    }
  }
  if (flat.length === 0) return [];
  const totalWeight = flat.reduce((sum, s) => sum + Math.max(8, s.text.length), 0);
  let cursor = 0;
  return flat.map((s, idx) => {
    const w = Math.max(8, s.text.length) / totalWeight;
    const startRatio = cursor;
    cursor += w;
    return {
      index: idx,
      label: s.label,
      text: s.text,
      startRatio,
      endRatio: idx === flat.length - 1 ? 1 : cursor,
    };
  });
}

export function isDeviceSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';
}
