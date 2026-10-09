import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleContact, type ContactEnv } from './contact.ts';

const env: ContactEnv = {
  RESEND_API_KEY: 'prova',
  TURNSTILE_SECRET_KEY: 'segreto',
  CONTACT_TO: 'studio@example.com',
  CONTACT_FROM: 'Studio <modulo@example.com>',
};
const valid = { name: 'Anna', email: 'anna@example.com', message: 'Ciao', website: '', turnstile: 'token' };
const post = (body: unknown): Request =>
  new Request('https://sito.test/api/contact', { method: 'POST', body: JSON.stringify(body) });

/** Finto fetch: registra le chiamate e risponde come Turnstile e Resend. */
function fakeFetch(opts: { captcha?: boolean; send?: boolean } = {}) {
  const calls: Array<{ url: string; init: RequestInit | undefined }> = [];
  const fn = async (url: string, init?: RequestInit): Promise<Response> => {
    calls.push({ url, init });
    if (url.includes('turnstile')) return Response.json({ success: opts.captcha ?? true });
    return new Response('{}', { status: opts.send === false ? 500 : 200 });
  };
  return { fn, calls };
}

test('invia il messaggio con mittente, destinatario e risposta all\'utente', async () => {
  const { fn, calls } = fakeFetch();
  const response = await handleContact(post(valid), env, fn);
  assert.equal(response.status, 200);
  const sent = JSON.parse(String(calls[1]?.init?.body));
  assert.deepEqual(sent.to, ['studio@example.com']);
  assert.equal(sent.reply_to, 'anna@example.com');
  assert.equal(sent.from, 'Studio <modulo@example.com>');
  assert.match(sent.text, /Ciao/);
});

test('rifiuta metodi diversi da POST', async () => {
  const response = await handleContact(new Request('https://sito.test/api/contact'), env, fakeFetch().fn);
  assert.equal(response.status, 405);
});

test('rifiuta dati mancanti o email non valida senza chiamare nessun servizio', async () => {
  for (const bad of [{ ...valid, name: '' }, { ...valid, message: ' ' }, { ...valid, email: 'no' }]) {
    const { fn, calls } = fakeFetch();
    assert.equal((await handleContact(post(bad), env, fn)).status, 400);
    assert.equal(calls.length, 0);
  }
});

test('campo trappola compilato: risposta ok ma nessun invio', async () => {
  const { fn, calls } = fakeFetch();
  const response = await handleContact(post({ ...valid, website: 'http://spam' }), env, fn);
  assert.equal(response.status, 200);
  assert.equal(calls.length, 0);
});

test('senza token Turnstile o con verifica fallita non invia', async () => {
  const none = fakeFetch();
  assert.equal((await handleContact(post({ ...valid, turnstile: '' }), env, none.fn)).status, 400);
  assert.equal(none.calls.length, 0);
  const failed = fakeFetch({ captcha: false });
  assert.equal((await handleContact(post(valid), env, failed.fn)).status, 400);
  assert.equal(failed.calls.length, 1);
});

test('configurazione incompleta: errore e nessuna chiamata', async () => {
  const { fn, calls } = fakeFetch();
  const { RESEND_API_KEY: _omit, ...partial } = env;
  assert.equal((await handleContact(post(valid), partial, fn)).status, 500);
  assert.equal(calls.length, 0);
});

test('errore di Resend: risposta 502', async () => {
  assert.equal((await handleContact(post(valid), env, fakeFetch({ send: false }).fn)).status, 502);
});

test('nome con a capo non rompe l\'oggetto della mail', async () => {
  const { fn, calls } = fakeFetch();
  await handleContact(post({ ...valid, name: 'Anna\r\nBcc: x@y.z' }), env, fn);
  assert.doesNotMatch(JSON.parse(String(calls[1]?.init?.body)).subject, /[\r\n]/);
});
