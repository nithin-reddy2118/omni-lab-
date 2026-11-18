import { execFileSync, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { classifyAiError, generateStructuredJson, getAiConfigurationSummary } from './aiService.ts';
import {
  buildDeterministicSmartLesson,
  mergeAiLessonWithDeterministic,
} from '../src/engine/smartLessonEngine.ts';
import type {
  EducationLevel,
  EnvironmentCapabilities,
  LearningStyle,
  SmartLanguage,
  SmartLessonPackage,
  SmartSubject,
  VideoDurationPreset,
} from '../src/types/smartLearning.ts';

let cachedCapabilities: EnvironmentCapabilities | null = null;

function checkBinary(cmd: string, args: string[] = ['--version']): boolean {
  try {
    execFileSync(cmd, args, { stdio: 'ignore', timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

function checkManimInstalled(): boolean {
  try {
    execFileSync('python3', ['-c', 'import manim'], { stdio: 'ignore', timeout: 2500 });
    return true;
  } catch {
    return false;
  }
}

export function getEnvironmentCapabilities(): EnvironmentCapabilities {
  const ai = getAiConfigurationSummary();
  if (!cachedCapabilities) {
    cachedCapabilities = {
      geminiConfigured: ai.configured,
      ffmpegInstalled: checkBinary('ffmpeg', ['-version']),
      ffprobeInstalled: checkBinary('ffprobe', ['-version']),
      manimInstalled: checkManimInstalled(),
      pythonInstalled: checkBinary('python3', ['--version']),
      ttsModel: 'gemini-3.8-flash-lite-tts',
      browserAnimationEngine: 'HTML5 Canvas 2D + Deterministic STEM Engine',
    };
  }
  return {
    ...cachedCapabilities,
    geminiConfigured: ai.configured,
  };
}

export async function generateSmartLessonService(opts: {
  topicQuery: string;
  language: SmartLanguage;
  educationLevel: EducationLevel;
  learningStyle: LearningStyle;
  durationPreset: VideoDurationPreset;
  preferredSubject?: SmartSubject | 'auto';
}): Promise<{
  lesson: SmartLessonPackage;
  aiWarning?: string;
  modelUsed?: string;
}> {
  const deterministicBlueprint = buildDeterministicSmartLesson(opts);

  const aiSummary = getAiConfigurationSummary();
  if (!aiSummary.configured) {
    return {
      lesson: deterministicBlueprint,
      aiWarning:
        'GEMINI_API_KEY is not configured in Settings > Secrets. Loaded our deterministic verified STEM lesson & interactive animation blueprint instead.',
    };
  }

  try {
    const langInstruction =
      opts.language === 'kn'
        ? 'Write clear, natural, academic Kannada (ಕನ್ನಡ) prose—NOT literal word-for-word translation. Preserve all mathematical symbols (a² + b² = c², V = I·R), units (cm, m/s², kPa, °C, Ω), and chemical formulas (H₂O, CO₂, HCl, NaOH) cleanly.'
        : opts.language === 'hi'
          ? 'Write clear, natural, academic Hindi (हिन्दी) prose. Preserve all mathematical symbols (a² + b² = c², V = I·R), units (cm, m/s², kPa, °C, Ω), and chemical formulas (H₂O, CO₂, HCl, NaOH) cleanly.'
          : 'Write clear, engaging, age-appropriate English suitable for students.';

    const levelMap: Record<EducationLevel, string> = {
      'classes-5-7': 'Classes 5-7 (Ages 10-13, concrete intuitive analogies)',
      'classes-8-10': 'Classes 8-10 (High school foundations, clear algebra & lab methods)',
      'classes-11-12': 'Classes 11-12 (Senior secondary rigor, quantitative derivations)',
      undergraduate: 'Undergraduate STEM level',
      engineering: 'Engineering & Applied Systems level',
      advanced: 'Advanced research perspective',
    };

    const { data, modelUsed } = await generateStructuredJson<Record<string, unknown>>({
      contents: `Create a structured STEM visual lesson for topic: "${opts.topicQuery}"
Detected Subject: ${deterministicBlueprint.subject}
Learning Mode: ${deterministicBlueprint.learningMode}
Student Level: ${levelMap[opts.educationLevel]}
Learning Style: ${opts.learningStyle}
Target Video Duration Preset: ${opts.durationPreset}
Deterministic Verified Reference (DO NOT contradict these numerical facts or equations):
- Formulas: ${deterministicBlueprint.formulasAndEquations.join('; ')}
- Validation Note: ${deterministicBlueprint.validationNote}`,
      systemInstruction: `You are an expert STEM educator for "OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY". ${langInstruction} Never invent chemical colours, toxic reaction products, fake math proofs, or false algorithm complexity bounds. Output crisp, educational JSON fields tailored to the exact subject and student level.`,
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          topicTitle: { type: Type.STRING },
          topicIntroduction: { type: Type.STRING },
          meaningAndDefinition: { type: Type.STRING },
          whyConceptMatters: { type: Type.STRING },
          scientificOrMathPrinciple: { type: Type.STRING },
          realLifeApplications: { type: Type.ARRAY, items: { type: Type.STRING } },
          commonMistakes: { type: Type.ARRAY, items: { type: Type.STRING } },
          furtherExploration: { type: Type.ARRAY, items: { type: Type.STRING } },
          scenes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                narrationText: { type: Type.STRING },
                subtitleText: { type: Type.STRING },
                caption: { type: Type.STRING },
              },
              required: ['title', 'narrationText', 'subtitleText', 'caption'],
            },
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
              },
              required: ['question', 'options', 'correctIndex', 'explanation'],
            },
          },
        },
        required: [
          'topicTitle',
          'topicIntroduction',
          'meaningAndDefinition',
          'whyConceptMatters',
          'scientificOrMathPrinciple',
          'realLifeApplications',
          'commonMistakes',
          'furtherExploration',
          'scenes',
          'quiz',
        ],
      },
    });

    const merged = mergeAiLessonWithDeterministic(data, deterministicBlueprint);
    merged.modelUsed = modelUsed;
    return {
      lesson: merged,
      modelUsed,
    };
  } catch (err) {
    const info = classifyAiError(err);
    return {
      lesson: deterministicBlueprint,
      aiWarning: `${info.userMessage} Loaded our verified deterministic lesson & interactive animation instead.`,
    };
  }
}

// ============================================================================
// REAL VOICE NARRATION (Gemini 3.8 Flash Lite TTS with Normalization, Chunking,
// WAV Concatenation, Validation & Caching)
// ============================================================================
const ALLOWED_TTS_VOICES = new Set(['Kore', 'Puck', 'Charon', 'Fenrir', 'Zephyr']);

interface CachedTtsEntry {
  audioBase64: string;
  mimeType: string;
  byteLength: number;
  durationSecEstimate: number;
  chunkCount: number;
  normalizedText: string;
  voiceName: string;
  modelUsed: string;
  createdAt: number;
}

const ttsLruCache = new Map<string, CachedTtsEntry>();
const MAX_TTS_CACHE_ENTRIES = 80;

function getTtsCacheKey(text: string, language: SmartLanguage, voiceName: string): string {
  return `${language}::${voiceName}::${text}`;
}

function setTtsCache(key: string, entry: CachedTtsEntry) {
  if (ttsLruCache.has(key)) {
    ttsLruCache.delete(key);
  }
  ttsLruCache.set(key, entry);
  if (ttsLruCache.size > MAX_TTS_CACHE_ENTRIES) {
    const oldest = ttsLruCache.keys().next().value;
    if (oldest) ttsLruCache.delete(oldest);
  }
}

export function normalizeScientificSpeechText(rawText: string, language: SmartLanguage): string {
  let out = rawText.replace(/\s+/g, ' ').trim();
  if (!out) return '';

  // Common chemical formulas & ions -> natural scientific phrasing (applied carefully on standalone tokens)
  if (language === 'en') {
    out = out
      .replace(/\bH₂O\b|\bH2O\b/g, 'water (H 2 O)')
      .replace(/\bCO₂\b|\bCO2\b/g, 'carbon dioxide (C O 2)')
      .replace(/\bO₂\b|\bO2\b/g, 'oxygen gas (O 2)')
      .replace(/\bH₂\b|\bH2\b/g, 'hydrogen gas (H 2)')
      .replace(/\bN₂\b|\bN2\b/g, 'nitrogen gas (N 2)')
      .replace(/\bH₂SO₄\b|\bH2SO4\b/g, 'sulfuric acid')
      .replace(/\bCH₃COOH\b|\bCH3COOH\b/g, 'acetic acid')
      .replace(/\bCaCO₃\b|\bCaCO3\b/g, 'calcium carbonate')
      .replace(/\bNaHCO₃\b|\bNaHCO3\b/g, 'sodium bicarbonate')
      .replace(/\bCuSO₄(?:·5H₂O)?\b|\bCuSO4\b/g, 'copper sulfate')
      .replace(/\bFeSO₄\b|\bFeSO4\b/g, 'iron sulfate')
      .replace(/\bCa\(OH\)₂\b|\bCa\(OH\)2\b/g, 'calcium hydroxide')
      .replace(/\bNaOH\b/g, 'sodium hydroxide')
      .replace(/\bKOH\b/g, 'potassium hydroxide')
      .replace(/\bHCl\b/g, 'hydrochloric acid')
      .replace(/\bNaCl\b/g, 'sodium chloride')
      .replace(/H₃O⁺/g, 'hydronium ion')
      .replace(/H⁺/g, 'hydrogen ion')
      .replace(/OH⁻/g, 'hydroxide ion');
  }

  // Scientific symbols & units across languages
  out = out
    .replace(/m\/s²/g, language === 'en' ? 'meters per second squared' : 'm per s squared')
    .replace(/g\/cm³/g, language === 'en' ? 'grams per cubic centimeter' : 'g per cm cubed')
    .replace(/mol\/L/g, language === 'en' ? 'moles per liter' : 'mol per liter')
    .replace(/kJ\/mol/g, language === 'en' ? 'kilojoules per mole' : 'kJ per mol')
    .replace(/µmol\/m²\/s/g, language === 'en' ? 'micromoles per square meter per second' : 'micromoles per m squared s')
    .replace(/µL/g, language === 'en' ? 'microliters' : 'micro L')
    .replace(/°C/g, language === 'en' ? ' degrees Celsius' : ' degrees Celsius')
    .replace(/kPa/g, language === 'en' ? ' kilopascals' : ' kPa')
    .replace(/ΔH/g, language === 'en' ? 'delta H' : 'delta H')
    .replace(/ΔT/g, language === 'en' ? 'delta T' : 'delta T')
    .replace(/Ω/g, language === 'en' ? ' ohms' : ' ohms')
    .replace(/λ/g, ' lambda ')
    .replace(/τ/g, ' tau ')
    .replace(/ρ/g, ' rho ')
    .replace(/π/g, ' pi ')
    .replace(/⇌/g, language === 'en' ? ' is in equilibrium with ' : ' = ')
    .replace(/→|->/g, language === 'en' ? ' yields ' : ' -> ')
    .replace(/∝/g, language === 'en' ? ' is proportional to ' : ' proportional ')
    .replace(/±/g, language === 'en' ? ' plus or minus ' : ' plus minus ')
    .replace(/≈/g, language === 'en' ? ' approximately ' : ' approx ')
    .replace(/≤/g, language === 'en' ? ' less than or equal to ' : ' <= ')
    .replace(/≥/g, language === 'en' ? ' greater than or equal to ' : ' >= ')
    .replace(/√/g, language === 'en' ? 'square root of ' : 'root ')
    .replace(/²/g, language === 'en' ? ' squared' : ' squared')
    .replace(/³/g, language === 'en' ? ' cubed' : ' cubed')
    .replace(/⁻¹/g, language === 'en' ? ' inverse' : ' inverse')
    .replace(/\s+/g, ' ')
    .trim();

  return out;
}

export function splitSpeechChunks(text: string, maxChars = 750): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  if (clean.length <= maxChars) return [clean];

  // Split on sentence boundaries (English . ! ?, Devanagari ।, Kannada/Unicode)
  const sentences = clean.split(/(?<=[.!?।])\s+/);
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if (sentence.length > maxChars) {
      if (current) {
        chunks.push(current.trim());
        current = '';
      }
      // Split long clauses cleanly at comma/semicolon/space
      let remaining = sentence;
      while (remaining.length > maxChars) {
        let cutIdx = remaining.lastIndexOf(',', maxChars);
        if (cutIdx < maxChars * 0.4) cutIdx = remaining.lastIndexOf(' ', maxChars);
        if (cutIdx < 1) cutIdx = maxChars;
        chunks.push(remaining.slice(0, cutIdx).trim());
        remaining = remaining.slice(cutIdx).trim();
      }
      if (remaining) current = remaining;
      continue;
    }

    if ((current ? `${current} ${sentence}` : sentence).length > maxChars) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }

  if (current.trim()) {
    chunks.push(current.trim());
  }

  return chunks;
}

export interface ParsedWavInfo {
  sampleRate: number;
  numChannels: number;
  bitsPerSample: number;
  byteRate: number;
  pcmData: Buffer;
}

export function parseWavBuffer(buf: Buffer): ParsedWavInfo | null {
  if (buf.length < 44) return null;
  if (buf.subarray(0, 4).toString('ascii') !== 'RIFF') return null;
  if (buf.subarray(8, 12).toString('ascii') !== 'WAVE') return null;

  let sampleRate = 24000;
  let numChannels = 1;
  let bitsPerSample = 16;
  let byteRate = 48000;
  let foundFmt = false;
  let pcmData: Buffer | null = null;

  let offset = 12;
  while (offset + 8 <= buf.length) {
    const chunkId = buf.subarray(offset, offset + 4).toString('ascii');
    const chunkSize = buf.readUInt32LE(offset + 4);
    const dataStart = offset + 8;
    const dataEnd = Math.min(buf.length, dataStart + chunkSize);

    if (chunkId === 'fmt ' && chunkSize >= 16 && dataStart + 16 <= buf.length) {
      numChannels = buf.readUInt16LE(dataStart + 2);
      sampleRate = buf.readUInt32LE(dataStart + 4);
      byteRate = buf.readUInt32LE(dataStart + 8);
      bitsPerSample = buf.readUInt16LE(dataStart + 14);
      foundFmt = true;
    } else if (chunkId === 'data') {
      pcmData = buf.subarray(dataStart, dataEnd);
    }

    // RIFF chunks are word-aligned (2 bytes)
    offset = dataStart + chunkSize + (chunkSize % 2);
  }

  if (!foundFmt || !pcmData || pcmData.length < 16) return null;
  return {
    sampleRate,
    numChannels,
    bitsPerSample,
    byteRate: byteRate || (sampleRate * numChannels * bitsPerSample) / 8,
    pcmData,
  };
}

export function encodeWavBuffer(
  pcmData: Buffer,
  sampleRate = 24000,
  numChannels = 1,
  bitsPerSample = 16
): Buffer {
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const dataSize = pcmData.length;
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + dataSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(dataSize, 40);
  return Buffer.concat([header, pcmData]);
}

export function concatWavBuffers(wavBuffers: Buffer[]): {
  buffer: Buffer;
  durationSecEstimate: number;
} | null {
  if (wavBuffers.length === 0) return null;
  const parsedList: ParsedWavInfo[] = [];
  for (const b of wavBuffers) {
    const info = parseWavBuffer(b);
    if (!info) return null;
    parsedList.push(info);
  }

  const base = parsedList[0];
  // Add tiny 180ms silence gap between narration chunks so sentences breathe naturally
  const silenceBytes = Math.floor(base.sampleRate * 0.18) * (base.numChannels * (base.bitsPerSample / 8));
  const silencePad = Buffer.alloc(silenceBytes);

  const pcmParts: Buffer[] = [];
  parsedList.forEach((p, idx) => {
    pcmParts.push(p.pcmData);
    if (idx < parsedList.length - 1 && silencePad.length > 0) {
      pcmParts.push(silencePad);
    }
  });

  const combinedPcm = Buffer.concat(pcmParts);
  const buffer = encodeWavBuffer(combinedPcm, base.sampleRate, base.numChannels, base.bitsPerSample);
  const durationSecEstimate = Number((combinedPcm.length / Math.max(1, base.byteRate)).toFixed(2));
  return { buffer, durationSecEstimate };
}

function ensureWavBuffer(base64Data: string, mimeType?: string): Buffer | null {
  const rawBuf = Buffer.from(base64Data, 'base64');
  if (rawBuf.length < 32) return null;

  const isRiffWav =
    rawBuf.length >= 44 &&
    rawBuf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    rawBuf.subarray(8, 12).toString('ascii') === 'WAVE';

  if (isRiffWav) {
    const parsed = parseWavBuffer(rawBuf);
    return parsed ? rawBuf : null;
  }

  if (!mimeType || /pcm|l16|raw/i.test(mimeType) || mimeType === 'audio/wav') {
    return encodeWavBuffer(rawBuf, 24000, 1, 16);
  }

  return null;
}

async function synthesizeSingleChunk(opts: {
  chunkText: string;
  language: SmartLanguage;
  safeVoice: string;
  apiKey: string;
}): Promise<{
  ok: boolean;
  wavBuffer?: Buffer;
  modelUsed?: string;
  code?: string;
  reason?: string;
}> {
  const aiBeta = new GoogleGenAI({
    apiKey: opts.apiKey,
    apiVersion: 'v1beta',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const aiDefault = new GoogleGenAI({
    apiKey: opts.apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const stylePrompt =
    opts.language === 'kn'
      ? 'Speak clearly, warmly, and naturally in Kannada (kn-IN) as an encouraging science teacher.'
      : opts.language === 'hi'
        ? 'Speak clearly, warmly, and naturally in Hindi (hi-IN) as an encouraging science teacher.'
        : 'Speak clearly and warmly in English as an engaging science and mathematics teacher.';

  const attempts: {
    label: string;
    client: GoogleGenAI;
    model: string;
    contents: unknown;
    includeSpeechConfig: boolean;
  }[] = [
    {
      label: 'v1beta-lite-tts-with-metadata',
      client: aiBeta,
      model: 'gemini-3.8-flash-lite-tts',
      includeSpeechConfig: true,
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: opts.chunkText,
              speechMetadata: {
                style: stylePrompt,
              },
            },
          ],
        },
      ],
    },
    {
      label: 'v1beta-lite-tts-plain-parts',
      client: aiBeta,
      model: 'gemini-3.8-flash-lite-tts',
      includeSpeechConfig: true,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${stylePrompt} Read aloud clearly: ${opts.chunkText}` }],
        },
      ],
    },
    {
      label: 'v1beta-lite-tts-audio-only',
      client: aiBeta,
      model: 'gemini-3.8-flash-lite-tts',
      includeSpeechConfig: false,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${stylePrompt} Read aloud clearly: ${opts.chunkText}` }],
        },
      ],
    },
    {
      label: 'v1beta-flash-tts',
      client: aiBeta,
      model: 'gemini-3.8-flash-tts',
      includeSpeechConfig: true,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${stylePrompt} Read aloud clearly: ${opts.chunkText}` }],
        },
      ],
    },
    {
      label: 'default-lite-tts-audio-only',
      client: aiDefault,
      model: 'gemini-3.8-flash-lite-tts',
      includeSpeechConfig: false,
      contents: [
        {
          role: 'user',
          parts: [{ text: `${stylePrompt} Read aloud clearly: ${opts.chunkText}` }],
        },
      ],
    },
  ];

  let lastErr: unknown = null;
  for (const attempt of attempts) {
    try {
      const configPayload: Record<string, unknown> = {
        responseModalities: ['AUDIO'],
      };
      if (attempt.includeSpeechConfig) {
        configPayload.speechConfig = {
          voiceConfig: {
            prebuiltVoiceConfig: {
              voiceName: opts.safeVoice,
            },
          },
        };
      }

      const response = await attempt.client.models.generateContent({
        model: attempt.model,
        contents: attempt.contents as any,
        config: configPayload as any,
      });

      const part = response.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
      const inline = part?.inlineData;
      const base64Audio = inline?.data;
      if (base64Audio) {
        const wavBuf = ensureWavBuffer(base64Audio, inline?.mimeType);
        if (wavBuf) {
          return {
            ok: true,
            wavBuffer: wavBuf,
            modelUsed: attempt.model,
          };
        }
      }
      console.warn(`[tts] attempt=${attempt.label} returned empty or invalid audio payload`);
    } catch (err) {
      lastErr = err;
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`[tts] attempt=${attempt.label} failed: ${msg}`);
      const info = classifyAiError(err);
      if (info.code === 'AI_KEY_INVALID' || info.code === 'AI_KEY_MISSING') {
        return {
          ok: false,
          code: info.code,
          reason: `${info.userMessage} Text explanation, Device Speech Fallback, and synchronized subtitles remain available.`,
        };
      }
    }
  }

  const info = lastErr ? classifyAiError(lastErr) : null;
  return {
    ok: false,
    code: info?.code ?? 'NO_AUDIO_RETURNED',
    reason:
      'Cloud Gemini voice synthesis is currently unavailable for this endpoint. Enable Device Speech Fallback or follow the synchronized subtitles and narration transcript.',
  };
}

export async function synthesizeSceneSpeech(opts: {
  text: string;
  language: SmartLanguage;
  voiceName?: string;
}): Promise<{
  available: boolean;
  audioBase64?: string;
  mimeType?: string;
  byteLength?: number;
  durationSecEstimate?: number;
  chunkCount?: number;
  normalizedText?: string;
  voiceName?: string;
  cached?: boolean;
  reason?: string;
  code?: string;
  modelUsed?: string;
}> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return {
      available: false,
      code: 'AI_KEY_MISSING',
      reason:
        'Voice narration requires GEMINI_API_KEY in Settings > Secrets. Enable Device Speech Fallback or follow synchronized subtitles.',
    };
  }

  const boundedRaw = opts.text.trim().slice(0, 6000);
  const normalizedText = normalizeScientificSpeechText(boundedRaw, opts.language);
  if (!normalizedText) {
    return { available: false, code: 'EMPTY_TEXT', reason: 'No narration script text provided.' };
  }

  const safeVoice = opts.voiceName && ALLOWED_TTS_VOICES.has(opts.voiceName) ? opts.voiceName : 'Kore';
  const cacheKey = getTtsCacheKey(normalizedText, opts.language, safeVoice);
  const cachedEntry = ttsLruCache.get(cacheKey);
  if (cachedEntry) {
    return {
      available: true,
      audioBase64: cachedEntry.audioBase64,
      mimeType: cachedEntry.mimeType,
      byteLength: cachedEntry.byteLength,
      durationSecEstimate: cachedEntry.durationSecEstimate,
      chunkCount: cachedEntry.chunkCount,
      normalizedText: cachedEntry.normalizedText,
      voiceName: cachedEntry.voiceName,
      modelUsed: cachedEntry.modelUsed,
      cached: true,
    };
  }

  const chunks = splitSpeechChunks(normalizedText, 750);
  if (chunks.length === 0) {
    return { available: false, code: 'EMPTY_TEXT', reason: 'No narration script text provided.' };
  }

  const chunkBuffers: Buffer[] = [];
  let modelUsed = 'gemini-3.8-flash-lite-tts';

  for (const chunkText of chunks) {
    const res = await synthesizeSingleChunk({
      chunkText,
      language: opts.language,
      safeVoice,
      apiKey,
    });
    if (!res.ok || !res.wavBuffer) {
      return {
        available: false,
        code: res.code ?? 'TTS_FAILED',
        reason: res.reason ?? 'Voice synthesis failed.',
      };
    }
    chunkBuffers.push(res.wavBuffer);
    if (res.modelUsed) modelUsed = res.modelUsed;
  }

  const stitched = concatWavBuffers(chunkBuffers);
  if (!stitched || stitched.buffer.length < 64) {
    return {
      available: false,
      code: 'INVALID_AUDIO_BUFFER',
      reason: 'Generated audio failed RIFF WAV validation.',
    };
  }

  const audioBase64 = stitched.buffer.toString('base64');
  const entry: CachedTtsEntry = {
    audioBase64,
    mimeType: 'audio/wav',
    byteLength: stitched.buffer.length,
    durationSecEstimate: stitched.durationSecEstimate,
    chunkCount: chunks.length,
    normalizedText,
    voiceName: safeVoice,
    modelUsed,
    createdAt: Date.now(),
  };
  setTtsCache(cacheKey, entry);

  return {
    available: true,
    audioBase64: entry.audioBase64,
    mimeType: entry.mimeType,
    byteLength: entry.byteLength,
    durationSecEstimate: entry.durationSecEstimate,
    chunkCount: entry.chunkCount,
    normalizedText: entry.normalizedText,
    voiceName: entry.voiceName,
    modelUsed: entry.modelUsed,
    cached: false,
  };
}

// ============================================================================
// REAL FFMPEG MP4 RENDERING PIPELINE (Canvas Frames + Audio + SRT Subtitles)
// ============================================================================
interface RenderJobEntry {
  id: string;
  dir: string;
  frameCount: number;
  status: 'uploading' | 'rendering' | 'ready' | 'failed';
  outputMp4Path?: string;
  durationSec?: number;
  error?: string;
  createdAt: number;
}

const renderJobs = new Map<string, RenderJobEntry>();
const MAX_FRAMES_PER_JOB = 720; // Safety resource cap (~60s @ 12fps)

function pruneOldJobs() {
  const cutoff = Date.now() - 25 * 60 * 1000;
  for (const [id, job] of renderJobs.entries()) {
    if (job.createdAt < cutoff) {
      try {
        fs.rmSync(job.dir, { recursive: true, force: true });
      } catch {
        // Ignore cleanup errors
      }
      renderJobs.delete(id);
    }
  }
}

export function initRenderJob(): { jobId: string; ffmpegInstalled: boolean } {
  pruneOldJobs();
  const caps = getEnvironmentCapabilities();
  const jobId = `vid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const dir = path.join(os.tmpdir(), `btr-render-${jobId}`);
  fs.mkdirSync(dir, { recursive: true });
  renderJobs.set(jobId, {
    id: jobId,
    dir,
    frameCount: 0,
    status: 'uploading',
    createdAt: Date.now(),
  });
  return { jobId, ffmpegInstalled: caps.ffmpegInstalled };
}

export function appendRenderFrames(jobId: string, dataUrls: string[]): { frameCount: number } {
  const job = renderJobs.get(jobId);
  if (!job) {
    throw new Error('Render job not found or expired.');
  }
  if (job.status !== 'uploading') {
    throw new Error('Cannot upload frames after finalization started.');
  }

  for (const dataUrl of dataUrls) {
    if (job.frameCount >= MAX_FRAMES_PER_JOB) {
      break;
    }
    const commaIdx = dataUrl.indexOf(',');
    const b64 = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : dataUrl;
    const buf = Buffer.from(b64, 'base64');
    const frameNum = String(job.frameCount + 1).padStart(5, '0');
    fs.writeFileSync(path.join(job.dir, `frame_${frameNum}.jpg`), buf);
    job.frameCount += 1;
  }

  return { frameCount: job.frameCount };
}

function runFfmpegCommand(args: string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    const timer = setTimeout(() => {
      proc.kill('SIGKILL');
      reject(new Error('FFmpeg rendering timed out after 45 seconds.'));
    }, 45000);

    proc.stderr.on('data', (chunk) => {
      stderr += String(chunk);
    });
    proc.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    proc.on('close', (code) => {
      clearTimeout(timer);
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`FFmpeg exited with code ${code}: ${stderr.slice(-400)}`));
      }
    });
  });
}

export async function finalizeRenderJob(
  jobId: string,
  opts: {
    fps: number;
    audioWavBase64?: string | null;
    subtitlesSrt?: string;
  }
): Promise<{
  jobId: string;
  downloadUrl: string;
  sizeBytes: number;
  frameCount: number;
  hasAudioTrack: boolean;
}> {
  const caps = getEnvironmentCapabilities();
  if (!caps.ffmpegInstalled) {
    throw new Error('FFmpeg is not installed on this server; MP4 encoding is unavailable.');
  }

  const job = renderJobs.get(jobId);
  if (!job) {
    throw new Error('Render job not found or expired.');
  }
  if (job.frameCount < 2) {
    throw new Error('At least 2 animation frames are required to render an MP4 video.');
  }

  job.status = 'rendering';
  const safeFps = Math.min(24, Math.max(4, Number(opts.fps) || 8));
  const outputMp4 = path.join(job.dir, 'lesson_video.mp4');

  const ffmpegArgs: string[] = [
    '-y',
    '-framerate',
    String(safeFps),
    '-i',
    path.join(job.dir, 'frame_%05d.jpg'),
  ];

  let hasAudioTrack = false;
  if (opts.audioWavBase64 && opts.audioWavBase64.length > 100) {
    const wavPath = path.join(job.dir, 'narration.wav');
    fs.writeFileSync(wavPath, Buffer.from(opts.audioWavBase64, 'base64'));
    ffmpegArgs.push('-i', wavPath);
    hasAudioTrack = true;
  }

  if (opts.subtitlesSrt && opts.subtitlesSrt.trim()) {
    fs.writeFileSync(path.join(job.dir, 'subtitles.srt'), opts.subtitlesSrt, 'utf8');
  }

  ffmpegArgs.push(
    '-c:v',
    'libx264',
    '-preset',
    'veryfast',
    '-pix_fmt',
    'yuv420p',
    '-vf',
    'scale=trunc(iw/2)*2:trunc(ih/2)*2',
    '-movflags',
    '+faststart'
  );

  if (hasAudioTrack) {
    ffmpegArgs.push('-c:a', 'aac', '-b:a', '128k', '-shortest');
  } else {
    ffmpegArgs.push('-an');
  }

  ffmpegArgs.push(outputMp4);

  try {
    await runFfmpegCommand(ffmpegArgs);
    const stat = fs.statSync(outputMp4);
    if (!stat.size || stat.size < 512) {
      throw new Error('Rendered MP4 file was empty.');
    }
    job.status = 'ready';
    job.outputMp4Path = outputMp4;
    job.durationSec = Number((job.frameCount / safeFps).toFixed(1));
    return {
      jobId,
      downloadUrl: `/api/smart-learning/video/${jobId}.mp4`,
      sizeBytes: stat.size,
      frameCount: job.frameCount,
      hasAudioTrack,
    };
  } catch (err) {
    job.status = 'failed';
    job.error = err instanceof Error ? err.message : 'MP4 compilation failed';
    throw err;
  }
}

export function getRenderedVideoFile(jobId: string): { filePath: string } | null {
  const cleanId = jobId.replace(/\.mp4$/i, '');
  const job = renderJobs.get(cleanId);
  if (!job || job.status !== 'ready' || !job.outputMp4Path || !fs.existsSync(job.outputMp4Path)) {
    return null;
  }
  return { filePath: job.outputMp4Path };
}
