import { createOpenAI } from '@ai-sdk/openai';
import { createAnthropic } from '@ai-sdk/anthropic';
import type { LanguageModel } from 'ai';

export function getModel(): LanguageModel {
  const provider = process.env.MODEL_PROVIDER ?? 'openai';
  const name = process.env.MODEL_NAME ?? 'gpt-4o-mini';
  const apiKey = process.env.MODEL_API_KEY;
  if (!apiKey) throw new Error('MODEL_API_KEY is not set');

  if (provider === 'anthropic') {
    return createAnthropic({ apiKey })(name);
  }
  const baseURL = process.env.MODEL_BASE_URL;
  const openai = createOpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) });
  return openai(name);
}
