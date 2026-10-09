/**
 * Invio del modulo contatti (HANDOFF §10): controlla i dati, verifica Cloudflare Turnstile
 * e inoltra il messaggio con Resend. Non salva nulla.
 */
export interface ContactEnv {
  /** Chiave API di Resend (segreto). */
  RESEND_API_KEY?: string;
  /** Chiave segreta di Turnstile (segreto). */
  TURNSTILE_SECRET_KEY?: string;
  /** Destinatario dei messaggi (la casella dello studio). */
  CONTACT_TO?: string;
  /** Mittente, per esempio `Tony Pignatelli Studio <modulo@tonypignatellistudio.com>`: il dominio va verificato in Resend. */
  CONTACT_FROM?: string;
}

type Fetch = (input: string, init?: RequestInit) => Promise<Response>;

const MAX = { name: 120, email: 254, message: 5000, token: 2048 } as const;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DEFAULT_FROM = 'Tony Pignatelli Studio <onboarding@resend.dev>';

const json = (status: number, body: Record<string, unknown>): Response =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });

const text = (value: unknown, max: number): string => (typeof value === 'string' ? value.trim().slice(0, max) : '');

export async function handleContact(request: Request, env: ContactEnv, doFetch: Fetch = fetch): Promise<Response> {
  if (request.method !== 'POST') return json(405, { error: 'method' });

  let payload: Record<string, unknown>;
  try {
    const parsed: unknown = await request.json();
    if (typeof parsed !== 'object' || parsed === null) throw new Error('formato');
    payload = parsed as Record<string, unknown>;
  } catch {
    return json(400, { error: 'invalid' });
  }

  // Campo trappola compilato: è un bot. Si risponde "ok" senza inviare nulla.
  if (text(payload.website, 200) !== '') return json(200, { ok: true });

  const name = text(payload.name, MAX.name);
  const email = text(payload.email, MAX.email);
  const message = text(payload.message, MAX.message);
  const token = text(payload.turnstile, MAX.token);
  if (!name || !message || !EMAIL_PATTERN.test(email)) return json(400, { error: 'invalid' });

  // Senza configurazione completa non si invia nulla (meglio un errore che un modulo aperto).
  if (!env.RESEND_API_KEY || !env.TURNSTILE_SECRET_KEY || !env.CONTACT_TO) return json(500, { error: 'config' });
  if (!token) return json(400, { error: 'captcha' });

  const verification = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) verification.set('remoteip', ip);
  const check = await doFetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: verification,
  }).catch(() => null);
  const verdict = check?.ok ? ((await check.json().catch(() => null)) as { success?: boolean } | null) : null;
  if (!verdict?.success) return json(400, { error: 'captcha' });

  const subjectName = name.replace(/[\r\n]+/g, ' ');
  const send = await doFetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.CONTACT_FROM || DEFAULT_FROM,
      to: [env.CONTACT_TO],
      reply_to: email,
      subject: `Nuova richiesta dal sito — ${subjectName}`,
      text: `Nome: ${name}\nEmail: ${email}\n\n${message}\n`,
    }),
  }).catch(() => null);
  if (!send?.ok) return json(502, { error: 'send' });
  return json(200, { ok: true });
}
