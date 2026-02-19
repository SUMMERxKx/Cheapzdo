const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'deepseek/deepseek-chat';
const FALLBACK_MODEL = 'google/gemma-3-27b-it:free';

interface AIRequestOptions {
  prompt: string;
  systemPrompt: string;
  temperature?: number;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

function getApiKey(): string | null {
  return import.meta.env.VITE_OPENROUTER_API_KEY || null;
}

export function isAIConfigured(): boolean {
  return !!getApiKey();
}

function repairJSON(raw: string): unknown {
  const trimmed = raw.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // continue to repair
  }

  const fenceStripped = trimmed
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/i, '');

  try {
    return JSON.parse(fenceStripped);
  } catch {
    // continue
  }

  const objStart = fenceStripped.indexOf('{');
  const arrStart = fenceStripped.indexOf('[');

  let start = -1;
  let closeChar = '';

  if (objStart >= 0 && (arrStart < 0 || objStart < arrStart)) {
    start = objStart;
    closeChar = '}';
  } else if (arrStart >= 0) {
    start = arrStart;
    closeChar = ']';
  }

  if (start >= 0) {
    const lastClose = fenceStripped.lastIndexOf(closeChar);
    if (lastClose > start) {
      try {
        return JSON.parse(fenceStripped.slice(start, lastClose + 1));
      } catch {
        // truly malformed
      }
    }
  }

  throw new Error('Unable to parse JSON from AI response');
}

async function callOpenRouter(
  messages: OpenRouterMessage[],
  temperature: number,
  model: string,
  signal?: AbortSignal,
): Promise<string> {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error('OpenRouter API key not configured. Add VITE_OPENROUTER_API_KEY to your .env file.');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Cheapzdo Task Board',
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: 2048,
    }),
    signal,
  });

  if (res.status === 429) {
    throw new Error('Rate limited — too many requests. Wait a moment and try again.');
  }

  if (res.status === 401) {
    throw new Error('Invalid API key. Check VITE_OPENROUTER_API_KEY in your .env file.');
  }

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`AI service error (${res.status}): ${body.slice(0, 300)}`);
  }

  const data = await res.json();

  if (data?.error) {
    throw new Error(`AI error: ${data.error.message || JSON.stringify(data.error).slice(0, 200)}`);
  }

  const content: string | undefined = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from AI model. Try again.');
  return content;
}

export async function queryAI<T = unknown>(options: AIRequestOptions): Promise<T> {
  const { prompt, systemPrompt, temperature = 0.3 } = options;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: prompt },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 45_000);

  const attempt = async (model: string, isRetry: boolean): Promise<T> => {
    try {
      const raw = await callOpenRouter(messages, temperature, model, controller.signal);
      return repairJSON(raw) as T;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        throw new Error('Request timed out. The AI model took too long to respond.');
      }
      // On first failure (not auth), try fallback model
      if (!isRetry && !err.message.includes('API key') && !err.message.includes('Invalid')) {
        return attempt(FALLBACK_MODEL, true);
      }
      throw err;
    }
  };

  try {
    return await attempt(MODEL, false);
  } finally {
    clearTimeout(timeout);
  }
}
