import { GoogleGenAI, ThinkingLevel, type Schema } from '@google/genai';

const PRIMARY_MODEL = (process.env.GEMINI_MODEL || 'gemini-4-hydrogen').trim();
const FALLBACK_MODELS = ['gemini-3.1-flash-lite'];
const REQUEST_TIMEOUT_MS = 14000;
const MAX_RETRIES_PER_MODEL = 2;

export interface AiServiceErrorInfo {
  statusCode: number;
  code: string;
  userMessage: string;
  retryable: boolean;
}

export function getAiConfigurationSummary() {
  const key = process.env.GEMINI_API_KEY;
  return {
    configured: Boolean(key && key !== 'MY_GEMINI_API_KEY'),
    primaryModel: PRIMARY_MODEL,
    fallbackModels: FALLBACK_MODELS,
  };
}

function getClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error('GEMINI_API_KEY_MISSING');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function classifyAiError(err: unknown): AiServiceErrorInfo {
  const raw = err instanceof Error ? err.message : String(err ?? 'Unknown error');

  if (raw.includes('GEMINI_API_KEY_MISSING')) {
    return {
      statusCode: 503,
      code: 'AI_KEY_MISSING',
      userMessage:
        'Live AI explanations require GEMINI_API_KEY in Settings > Secrets. All deterministic Virtual Lab simulations and video search remain available.',
      retryable: false,
    };
  }

  // Try parsing embedded JSON error payload if present
  let parsedCode: number | undefined;
  let parsedStatus = '';
  const jsonStart = raw.indexOf('{');
  if (jsonStart >= 0) {
    try {
      const obj = JSON.parse(raw.slice(jsonStart)) as {
        error?: { code?: number; status?: string; message?: string };
      };
      parsedCode = obj?.error?.code;
      parsedStatus = obj?.error?.status ?? '';
    } catch {
      // Ignore parse errors
    }
  }

  if (
    parsedCode === 503 ||
    parsedStatus === 'UNAVAILABLE' ||
    /\b503\b|UNAVAILABLE|high demand|overloaded|timed out|TIMEOUT/i.test(raw)
  ) {
    return {
      statusCode: 503,
      code: 'AI_TEMPORARILY_UNAVAILABLE',
      userMessage:
        'The AI explanation service is temporarily busy due to high demand. We automatically retried with fallback models—please click Retry in a moment or use the deterministic Virtual Lab below.',
      retryable: true,
    };
  }

  if (
    parsedCode === 429 ||
    parsedStatus === 'RESOURCE_EXHAUSTED' ||
    /\b429\b|RESOURCE_EXHAUSTED|quota|rate limit/i.test(raw)
  ) {
    return {
      statusCode: 429,
      code: 'AI_RATE_LIMIT',
      userMessage:
        'AI request rate limit was reached temporarily. Please wait a few seconds and click Retry, or continue with our deterministic Virtual Lab models.',
      retryable: true,
    };
  }

  if (
    parsedCode === 403 ||
    parsedCode === 401 ||
    /\b403\b|PERMISSION_DENIED|API_KEY_INVALID/i.test(raw)
  ) {
    return {
      statusCode: 403,
      code: 'AI_KEY_INVALID',
      userMessage:
        'The configured Gemini API key could not be authorized. Please verify your key in Settings > Secrets.',
      retryable: false,
    };
  }

  if (parsedCode === 404 || /\b404\b|NOT_FOUND/i.test(raw)) {
    return {
      statusCode: 502,
      code: 'AI_MODEL_NOT_FOUND',
      userMessage:
        'The selected AI model endpoint was unavailable. Please retry or use the deterministic Virtual Lab fallback.',
      retryable: true,
    };
  }

  return {
    statusCode: 502,
    code: 'AI_UPSTREAM_ERROR',
    userMessage:
      'Could not complete the AI request right now. Please click Retry or explore our deterministic Virtual Lab experiments.',
    retryable: true,
  };
}

function isTransientError(info: AiServiceErrorInfo): boolean {
  return (
    info.code === 'AI_TEMPORARILY_UNAVAILABLE' ||
    info.code === 'AI_RATE_LIMIT' ||
    info.code === 'AI_MODEL_NOT_FOUND'
  );
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((_resolve, reject) => {
        timer = setTimeout(() => reject(new Error('TIMEOUT: AI request timed out')), ms);
      }),
    ]);
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export async function generateStructuredJson<T>(args: {
  contents: string;
  systemInstruction: string;
  responseSchema: Schema;
}): Promise<{ data: T; modelUsed: string }> {
  const ai = getClient();
  const modelsToTry = Array.from(new Set([PRIMARY_MODEL, ...FALLBACK_MODELS]));
  let lastErr: unknown = new Error('AI request failed');

  for (const model of modelsToTry) {
    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      try {
        const useThinkingLow = model.startsWith('gemini-4');
        const response = await withTimeout(
          ai.models.generateContent({
            model,
            contents: args.contents,
            config: {
              systemInstruction: args.systemInstruction,
              ...(useThinkingLow
                ? { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } }
                : {}),
              responseMimeType: 'application/json',
              responseSchema: args.responseSchema,
            },
          }),
          REQUEST_TIMEOUT_MS
        );

        const text = (response.text ?? '').trim();
        if (!text) {
          throw new Error('Empty response received from model');
        }
        const parsed = JSON.parse(text) as T;
        return { data: parsed, modelUsed: model };
      } catch (err) {
        lastErr = err;
        const classified = classifyAiError(err);
        console.warn(
          `[aiService] model=${model} attempt=${attempt + 1}/${MAX_RETRIES_PER_MODEL + 1} code=${classified.code}`
        );

        if (!isTransientError(classified)) {
          throw err;
        }
        if (attempt < MAX_RETRIES_PER_MODEL) {
          const baseDelay = 450 * Math.pow(2, attempt);
          const jitter = Math.floor(Math.random() * 250);
          await sleep(baseDelay + jitter);
        }
      }
    }
  }

  throw lastErr;
}
