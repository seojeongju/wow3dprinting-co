import { findEnvKey } from '@/lib/admin-auth';

/** 월 소수 건이면 gpt-4o-mini로도 충분 (저렴) */
const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini';

export type AssistAction = 'rewrite' | 'expand' | 'shorten' | 'titles' | 'lead' | 'bullets';

const ASSIST_HINT: Record<AssistAction, string> = {
  rewrite: '같은 의미를 유지하며 문장을 다듬고 자연스러운 한국어 뉴스체로 고쳐 주세요.',
  expand: '근거와 맥락을 보강해 2~3배 분량으로 확장하세요. 추측은 "~로 알려졌다" 등으로 표시하세요.',
  shorten: '핵심만 남기고 절반 이하 길이로 압축하세요.',
  titles: '아래 텍스트에 맞는 한국어 뉴스 제목 후보 5개를 JSON 배열로만 답하세요. 형식: ["제목1","제목2",...]',
  lead: '뉴스 리드(도입) 문단 2~4문장을 작성하세요. 5W1H를 반영하되 과장하지 마세요.',
  bullets: '본문을 Markdown 불릿 목록으로 요약 정리하세요.',
};

function providerOrder(env: Record<string, unknown>): Array<'gemini' | 'openai'> {
  const gemini = findEnvKey(env, 'GEMINI_API_KEY');
  const openai = findEnvKey(env, 'OPENAI_API_KEY');
  const mode = (findEnvKey(env, 'AI_PROVIDER') || 'auto').toLowerCase();

  if (mode === 'openai') {
    return openai ? ['openai'] : [];
  }
  if (mode === 'gemini') {
    return gemini ? ['gemini'] : [];
  }
  if (gemini && openai) return ['gemini', 'openai'];
  if (gemini) return ['gemini'];
  if (openai) return ['openai'];
  return [];
}

function shouldTryFallback(errMsg: string, httpStatus: number): boolean {
  const m = errMsg.toLowerCase();
  return (
    httpStatus === 429 ||
    httpStatus === 503 ||
    m.includes('quota') ||
    m.includes('rate limit') ||
    m.includes('resource exhausted') ||
    m.includes('limit: 0') ||
    m.includes('exceeded your current quota')
  );
}

const ARTICLE_SCHEMA_DESC = `반드시 JSON 한 덩어리만 출력하세요. 키: title(한국어 제목), slug(영문 소문자·숫자·하이픈), content(Markdown 본문).`;

async function geminiGenerateArticle(
  apiKey: string,
  systemInstruction: string,
  userText: string
): Promise<{ title: string; slug: string; content: string }> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userText }] }],
      generationConfig: {
        temperature: 0.65,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            title: { type: 'string' },
            slug: { type: 'string' },
            content: { type: 'string' },
          },
          required: ['title', 'slug', 'content'],
        },
      },
    }),
  });
  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const e = new Error(`Gemini 응답 파싱 실패 (${res.status})`);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message || raw.slice(0, 200);
    const e = new Error(msg);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
  const text = candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    const e = new Error('Gemini가 빈 응답을 반환했습니다.');
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  return normalizeArticleJson(text);
}

async function openaiGenerateArticle(
  apiKey: string,
  model: string,
  systemInstruction: string,
  userText: string
): Promise<{ title: string; slug: string; content: string }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.65,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: `${systemInstruction}\n\n${ARTICLE_SCHEMA_DESC}` },
        { role: 'user', content: userText },
      ],
    }),
  });
  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const e = new Error(`OpenAI 응답 파싱 실패 (${res.status})`);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message || raw.slice(0, 200);
    const e = new Error(msg);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
  const text = choices?.[0]?.message?.content?.trim();
  if (!text) {
    const e = new Error('OpenAI가 빈 응답을 반환했습니다.');
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  return normalizeArticleJson(text);
}

function normalizeArticleJson(text: string): { title: string; slug: string; content: string } {
  let parsed: { title?: string; slug?: string; content?: string };
  try {
    parsed = JSON.parse(text) as { title?: string; slug?: string; content?: string };
  } catch {
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) throw new Error('AI 응답이 올바른 JSON이 아닙니다.');
    parsed = JSON.parse(m[0]) as { title?: string; slug?: string; content?: string };
  }
  const title = String(parsed.title || '').trim();
  const slug = String(parsed.slug || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/^-|-$/g, '');
  const content = String(parsed.content || '').trim();
  if (!title || !content) {
    throw new Error('생성된 초안에 제목 또는 본문이 비어 있습니다.');
  }
  return { title, slug: slug || `article-${Date.now()}`, content };
}

/**
 * 기사 초안: AI_PROVIDER에 따라 순서대로 시도, 할당량/429 시 다음 제공자로 폴백
 */
export async function generateArticleDraftWithFallback(
  env: Record<string, unknown>,
  systemInstruction: string,
  userText: string
): Promise<{ title: string; slug: string; content: string; usedProvider: 'gemini' | 'openai' }> {
  const order = providerOrder(env);
  if (order.length === 0) {
    throw new Error(
      'AI 키가 없습니다. Cloudflare 환경 변수에 GEMINI_API_KEY 또는 OPENAI_API_KEY를 설정하세요. (Gemini 무료 한도 초과 시 OPENAI_API_KEY 권장)'
    );
  }

  const geminiKey = findEnvKey(env, 'GEMINI_API_KEY');
  const openaiKey = findEnvKey(env, 'OPENAI_API_KEY');
  const openaiModel = findEnvKey(env, 'OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;

  let lastError = '';

  for (const p of order) {
    try {
      if (p === 'gemini' && geminiKey) {
        const data = await geminiGenerateArticle(geminiKey, systemInstruction, userText);
        return { ...data, usedProvider: 'gemini' };
      }
      if (p === 'openai' && openaiKey) {
        const data = await openaiGenerateArticle(openaiKey, openaiModel, systemInstruction, userText);
        return { ...data, usedProvider: 'openai' };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = (e as Error & { status?: number }).status ?? 0;
      lastError = msg;
      const next = order[order.indexOf(p) + 1];
      if (next && shouldTryFallback(msg, status)) {
        console.warn(`[ai-providers] ${p} failed (${status}), trying ${next}:`, msg.slice(0, 200));
        continue;
      }
      throw e;
    }
  }

  throw new Error(lastError || 'AI 기사 생성에 실패했습니다.');
}

async function geminiAssist(
  apiKey: string,
  instruction: string,
  wantJsonArray: boolean
): Promise<{ text: string; titles?: string[] }> {
  const genCfg: Record<string, unknown> = {
    temperature: 0.5,
    responseMimeType: wantJsonArray ? 'application/json' : 'text/plain',
  };
  if (wantJsonArray) {
    genCfg.responseSchema = {
      type: 'array',
      items: { type: 'string' },
      minItems: 3,
      maxItems: 7,
    };
  }
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: instruction }] }],
      generationConfig: genCfg,
    }),
  });
  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const e = new Error(`Gemini 응답 오류 (${res.status})`);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message || raw.slice(0, 200);
    const e = new Error(msg);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  const candidates = data.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
  let out = candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  if (wantJsonArray) {
    try {
      const arr = JSON.parse(out) as unknown;
      if (Array.isArray(arr)) {
        const titles = arr.map(String).filter(Boolean);
        return { text: titles.map((t, i) => `${i + 1}. ${t}`).join('\n'), titles };
      }
    } catch {
      /* fall through */
    }
    return { text: out, titles: [] };
  }
  return { text: out };
}

async function openaiAssist(
  apiKey: string,
  model: string,
  instruction: string,
  wantJsonArray: boolean
): Promise<{ text: string; titles?: string[] }> {
  const system = wantJsonArray
    ? '답은 반드시 JSON 문자열 배열만 출력하세요. 예: ["제목1","제목2"]. 다른 설명 없음.'
    : '한국어로 요청을 수행하세요. 불필요한 서론 없이 결과 본문만 출력하세요.';

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.5,
      ...(wantJsonArray ? { response_format: { type: 'json_object' } } : {}),
      messages: [
        { role: 'system', content: system },
        {
          role: 'user',
          content: wantJsonArray
            ? `${instruction}\n\nJSON 객체로 답하세요: {"titles":["제목1","제목2",...]} (5개 내외)`
            : instruction,
        },
      ],
    }),
  });
  const raw = await res.text();
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    const e = new Error(`OpenAI 응답 오류 (${res.status})`);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  if (!res.ok) {
    const msg = (data as { error?: { message?: string } }).error?.message || raw.slice(0, 200);
    const e = new Error(msg);
    (e as Error & { status?: number }).status = res.status;
    throw e;
  }
  const choices = data.choices as Array<{ message?: { content?: string } }> | undefined;
  let out = choices?.[0]?.message?.content?.trim() || '';

  if (wantJsonArray) {
    try {
      const obj = JSON.parse(out) as { titles?: unknown };
      if (Array.isArray(obj.titles)) {
        const titles = obj.titles.map(String).filter(Boolean);
        return { text: titles.map((t, i) => `${i + 1}. ${t}`).join('\n'), titles };
      }
    } catch {
      try {
        const arr = JSON.parse(out) as unknown;
        if (Array.isArray(arr)) {
          const titles = arr.map(String).filter(Boolean);
          return { text: titles.map((t, i) => `${i + 1}. ${t}`).join('\n'), titles };
        }
      } catch {
        /* ignore */
      }
    }
    return { text: out, titles: [] };
  }
  return { text: out };
}

export async function runAssistWithFallback(
  env: Record<string, unknown>,
  action: AssistAction,
  text: string,
  context?: string
): Promise<{ result: string; titles: string[]; usedProvider: 'gemini' | 'openai' }> {
  const order = providerOrder(env);
  if (order.length === 0) {
    throw new Error('GEMINI_API_KEY 또는 OPENAI_API_KEY가 필요합니다.');
  }

  const ctx = context?.trim();
  const userBlock = ctx ? `[전체 맥락]\n${ctx}\n\n[대상 텍스트]\n${text}` : `[대상 텍스트]\n${text}`;
  const instruction = `${ASSIST_HINT[action]}\n\n${userBlock}`;
  const wantJsonArray = action === 'titles';

  const geminiKey = findEnvKey(env, 'GEMINI_API_KEY');
  const openaiKey = findEnvKey(env, 'OPENAI_API_KEY');
  const openaiModel = findEnvKey(env, 'OPENAI_MODEL') || DEFAULT_OPENAI_MODEL;

  let lastError = '';

  for (const p of order) {
    try {
      if (p === 'gemini' && geminiKey) {
        const r = await geminiAssist(geminiKey, instruction, wantJsonArray);
        return { result: r.text, titles: r.titles ?? [], usedProvider: 'gemini' };
      }
      if (p === 'openai' && openaiKey) {
        const r = await openaiAssist(openaiKey, openaiModel, instruction, wantJsonArray);
        return { result: r.text, titles: r.titles ?? [], usedProvider: 'openai' };
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      const status = (e as Error & { status?: number }).status ?? 0;
      lastError = msg;
      const next = order[order.indexOf(p) + 1];
      if (next && shouldTryFallback(msg, status)) {
        console.warn(`[ai-providers] assist ${p} failed, trying ${next}`);
        continue;
      }
      throw e;
    }
  }

  throw new Error(lastError || '어시스턴트 호출 실패');
}
