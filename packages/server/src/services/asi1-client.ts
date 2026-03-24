import axios, { AxiosInstance, AxiosError } from 'axios';
import { ASI1Message, ASI1Response, ASI1StreamResponse, ASI1_DEFAULTS } from '@frontendforge/shared';
import { config } from '../config/env.js';
import { logger } from '../utils/logger.js';
import { stripCodeFences } from '../utils/code-parser.js';
import { countTokens } from '../utils/token-counter.js';

export class ASI1Client {
  private client: AxiosInstance;
  private model: string;
  private concurrentRequests = 0;
  private maxConcurrent = ASI1_DEFAULTS.MAX_CONCURRENT_REQUESTS;
  private waitQueue: Array<() => void> = [];

  constructor() {
    this.model = config.ASI1_MODEL || ASI1_DEFAULTS.MODEL;
    this.client = axios.create({
      baseURL: config.ASI1_BASE_URL || ASI1_DEFAULTS.BASE_URL,
      timeout: ASI1_DEFAULTS.TIMEOUT_MS,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.ASI1_API_KEY}`,
      },
    });
  }

  async chat(
    messages: ASI1Message[],
    options: { temperature?: number; max_tokens?: number; top_p?: number } = {}
  ): Promise<ASI1Response> {
    await this.waitForSlot();
    try {
      const body = {
        model: this.model,
        messages,
        temperature: options.temperature ?? ASI1_DEFAULTS.TEMPERATURE,
        max_tokens: options.max_tokens ?? ASI1_DEFAULTS.MAX_TOKENS,
        top_p: options.top_p ?? ASI1_DEFAULTS.TOP_P,
        stream: false,
      };

      logger.info('ASI-1 request', { messageCount: messages.length, tokenEstimate: countTokens(messages.map(m => m.content).join('')) });

      const result = await this.retryWithBackoff(async () => {
        const response = await this.client.post<ASI1Response>('/chat/completions', body);
        return response.data;
      }, ASI1_DEFAULTS.MAX_RETRIES);

      logger.info('ASI-1 response', { status: 'success', usage: result.usage });
      return result;
    } finally {
      this.releaseSlot();
    }
  }

  async *chatStream(
    messages: ASI1Message[],
    options: { temperature?: number; max_tokens?: number } = {},
    signal?: AbortSignal
  ): AsyncGenerator<string> {
    await this.waitForSlot();
    try {
      const body = {
        model: this.model,
        messages,
        temperature: options.temperature ?? ASI1_DEFAULTS.TEMPERATURE,
        max_tokens: options.max_tokens ?? ASI1_DEFAULTS.MAX_TOKENS,
        top_p: ASI1_DEFAULTS.TOP_P,
        stream: true,
      };

      const response = await this.client.post('/chat/completions', body, {
        responseType: 'stream',
        signal,
      });

      let buffer = '';
      for await (const chunk of response.data) {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data: ')) continue;
          const data = trimmed.slice(6);
          if (data === '[DONE]') return;

          try {
            const parsed: ASI1StreamResponse = JSON.parse(data);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) yield content;
          } catch {
            // Skip malformed chunks
          }
        }
      }
    } catch (err) {
      if (signal?.aborted) return;
      throw err;
    } finally {
      this.releaseSlot();
    }
  }

  async analyzeCode(code: string, instruction: string, systemPrompt: string): Promise<string> {
    const messages: ASI1Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `${instruction}\n\n\`\`\`\n${code}\n\`\`\`` },
    ];

    const response = await this.chat(messages, {
      temperature: 0.2,
      max_tokens: ASI1_DEFAULTS.MAX_TOKENS,
    });

    return response.choices[0]?.message?.content || '';
  }

  async completeCode(
    prefix: string,
    suffix: string,
    language: string,
    fileContext?: string
  ): Promise<string> {
    const systemPrompt = `You are an expert ${language} code completion engine. You will be given code with a cursor position marked as <CURSOR>. Output ONLY the code that should be inserted at the cursor position. Do not include any explanation, markdown formatting, or the surrounding code. Output raw code only.`;

    const userContent = fileContext
      ? `${fileContext}\n\n// Current file:\n${prefix}<CURSOR>${suffix}`
      : `${prefix}<CURSOR>${suffix}`;

    const messages: ASI1Message[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userContent },
    ];

    const response = await this.chat(messages, {
      temperature: 0.3,
      max_tokens: 256,
    });

    const content = response.choices[0]?.message?.content || '';
    return stripCodeFences(content);
  }

  private async waitForSlot(): Promise<void> {
    if (this.concurrentRequests < this.maxConcurrent) {
      this.concurrentRequests++;
      return;
    }
    return new Promise((resolve) => {
      this.waitQueue.push(() => {
        this.concurrentRequests++;
        resolve();
      });
    });
  }

  private releaseSlot(): void {
    this.concurrentRequests--;
    const next = this.waitQueue.shift();
    if (next) next();
  }

  private async retryWithBackoff<T>(fn: () => Promise<T>, maxRetries: number): Promise<T> {
    const delays = ASI1_DEFAULTS.RETRY_DELAYS;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        const axiosErr = error as AxiosError;
        const status = axiosErr.response?.status;

        if (status && status >= 400 && status < 500 && status !== 429) {
          throw error;
        }

        if (attempt === maxRetries) throw error;

        let delay = delays[attempt] || 4000;
        if (status === 429) {
          const retryAfter = axiosErr.response?.headers?.['retry-after'];
          if (retryAfter) delay = parseInt(retryAfter, 10) * 1000;
        }

        logger.warn(`ASI-1 request failed (attempt ${attempt + 1}/${maxRetries + 1}), retrying in ${delay}ms`, {
          status,
          message: axiosErr.message,
        });

        await new Promise((r) => setTimeout(r, delay));
      }
    }
    throw new Error('Retry exhausted');
  }
}

export const asi1 = new ASI1Client();
