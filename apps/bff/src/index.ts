import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { z } from 'zod';
import { geminiRoute } from './routes/gemini';
import { openrouterRoute } from './routes/openrouter';
import { deepseekRoute } from './routes/deepseek';

type Env = {
  PLATFORM_GEMINI_KEY: string;
  PLATFORM_ENABLED: string;
  PLATFORM_DAILY_LIMIT: string;
  PLATFORM_PER_USER_DAILY: string;
};

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({
  origin: ['http://localhost:5173', 'https://canfenci.github.io', 'https://fenai.canfenci.workers.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
}));

// Health check
app.get('/health', (c) => c.json({ ok: true, service: 'fenai-bff', timestamp: new Date().toISOString() }));

// AI Routes
app.route('/api/ai', geminiRoute);
app.route('/api/ai', openrouterRoute);
app.route('/api/ai', deepseekRoute);

// Platform key resolver helper
async function getPlatformKey(provider: string, env: Env): Promise<string | null> {
  if (env.PLATFORM_ENABLED !== 'true') return null;
  switch (provider) {
    case 'gemini': return env.PLATFORM_GEMINI_KEY || null;
    default: return null;
  }
}

// User key getter (from KV or header) - placeholder
async function getUserKey(provider: string, c: any): Promise<string | null> {
  // TODO: Implement user key storage (KV/D1)
  // For now, check Authorization header for BYOK
  const auth = c.req.header('Authorization');
  if (auth?.startsWith('Bearer ')) return auth.slice(7);
  return null;
}

// Key resolver: user key first, then platform key
async function resolveKey(provider: string, c: any): Promise<{ type: 'user' | 'platform'; key: string } | null> {
  const userKey = await getUserKey(provider, c);
  if (userKey) return { type: 'user', key: userKey };
  
  const platformKey = await getPlatformKey(provider, c.env);
  if (platformKey) return { type: 'platform', key: platformKey };
  
  return null;
}

// Shared provider call
async function callProvider(provider: string, key: string, prompt: string, systemPrompt: string, model?: string): Promise<string> {
  const endpoints: Record<string, { url: string; headers: (key: string) => Record<string, string>; body: (prompt: string, systemPrompt: string, model?: string) => any }> = {
    gemini: {
      url: `https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-2.5-flash'}:generateContent?key=${key}`,
      headers: () => ({ 'Content-Type': 'application/json' }),
      body: (p, s) => ({ contents: [{ parts: [{ text: p }] }], systemInstruction: { parts: [{ text: s }] } }),
    },
    openrouter: {
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}`, 'HTTP-Referer': 'https://canfenci.github.io/fenai', 'X-Title': 'FenAI' }),
      body: (p, s, m) => ({ model: m || 'openai/gpt-4o-mini', messages: [{ role: 'system', content: s }, { role: 'user', content: p }], temperature: 0.7, max_tokens: 3500 }),
    },
    deepseek: {
      url: 'https://api.deepseek.com/chat/completions',
      headers: (k) => ({ 'Content-Type': 'application/json', 'Authorization': `Bearer ${k}` }),
      body: (p, s, m) => ({ model: m || 'deepseek-chat', messages: [{ role: 'system', content: s }, { role: 'user', content: p }], temperature: 0.6, max_tokens: 3500 }),
    },
  };

  const ep = endpoints[provider];
  if (!ep) throw new Error(`Unknown provider: ${provider}`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);
  
  try {
    const res = await fetch(ep.url, {
      method: 'POST',
      headers: ep.headers(key),
      body: JSON.stringify(ep.body(prompt, systemPrompt, model)),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!res.ok) {
      const err = await res.text();
      throw new Error(`${provider} API error (${res.status}): ${err}`);
    }

    const data = await res.json();
    
    // Extract text based on provider response format
    if (provider === 'gemini') {
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    }
    return data.choices?.[0]?.message?.content || '';
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// Request validation schemas
const GenerateSchema = z.object({
  prompt: z.string().min(1),
  systemPrompt: z.string().min(1),
  preferredProvider: z.enum(['gemini', 'openrouter', 'deepseek']).default('gemini'),
  model: z.string().optional(),
});

// Routes
const geminiRoute = new Hono<{ Bindings: Env }>()
  .post('/generate-exam', async (c) => {
    const body = await c.req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);

    const { prompt, systemPrompt, preferredProvider, model } = parsed.data;
    const provider = preferredProvider;

    const keyInfo = await resolveKey(provider, c);
    if (!keyInfo) return c.json({ error: 'No API key available. Provide your own or enable platform access.' }, 402);

    try {
      const result = await callProvider(provider, keyInfo.key, prompt, systemPrompt, model);
      return c.json({ provider: keyInfo.type, result });
    } catch (e: any) {
      console.error(`${provider} error:`, e);
      return c.json({ error: e.message }, 502);
    }
  })
  .post('/analyze-dna', async (c) => {
    const body = await c.req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);

    const { prompt, systemPrompt, preferredProvider, model } = parsed.data;
    const provider = preferredProvider;

    const keyInfo = await resolveKey(provider, c);
    if (!keyInfo) return c.json({ error: 'No API key available' }, 402);

    try {
      const result = await callProvider(provider, keyInfo.key, prompt, systemPrompt, model);
      return c.json({ provider: keyInfo.type, result });
    } catch (e: any) {
      console.error(`${provider} error:`, e);
      return c.json({ error: e.message }, 502);
    }
  })
  .post('/generate-questions', async (c) => {
    const body = await c.req.json();
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) return c.json({ error: 'Invalid request', details: parsed.error.flatten() }, 400);

    const { prompt, systemPrompt, preferredProvider, model } = parsed.data;
    const provider = preferredProvider;

    const keyInfo = await resolveKey(provider, c);
    if (!keyInfo) return c.json({ error: 'No API key available' }, 402);

    try {
      const result = await callProvider(provider, keyInfo.key, prompt, systemPrompt, model);
      return c.json({ provider: keyInfo.type, result });
    } catch (e: any) {
      console.error(`${provider} error:`, e);
      return c.json({ error: e.message }, 502);
    }
  });

const openrouterRoute = new Hono<{ Bindings: Env }>();
const deepseekRoute = new Hono<{ Bindings: Env }>();

export default app;
export type { Env };
