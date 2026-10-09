const MESSAGES = {
  name: 'Inserisci il tuo nome.',
  emailMissing: 'Inserisci la tua email.',
  emailInvalid: "L'indirizzo email non sembra corretto: controllalo.",
  message: 'Scrivi un messaggio.',
  success: 'Grazie, ti rispondiamo entro un giorno lavorativo.',
  error: 'Non siamo riusciti a inviare il messaggio. Riprova o scrivici a',
  sending: 'Invio in corso…',
} as const;

type FieldName = 'name' | 'email' | 'message';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Modulo contatti: validazione in italiano e accessibile (messaggio collegato con
 * `aria-describedby`, focus sul primo campo non valido) e invio a `/api/contact`.
 * L'invio richiede JavaScript (anche la verifica Turnstile ne ha bisogno).
 */
export function initContactForm(form: HTMLFormElement): void {
  const submit = form.querySelector<HTMLButtonElement>('[data-submit]');
  const status = form.querySelector<HTMLElement>('[data-status]');
  if (!submit || !status) return;
  const ui = { submit, status };
  const fallbackEmail = form.dataset.fallbackEmail ?? '';
  const submitLabel = ui.submit.textContent ?? 'Invia richiesta';

  const control = (name: FieldName): HTMLInputElement | HTMLTextAreaElement | null =>
    form.querySelector<HTMLInputElement | HTMLTextAreaElement>(`[name="${name}"]`);
  const errorOf = (name: FieldName): HTMLElement | null => form.querySelector<HTMLElement>(`#contact-${name}-error`);

  function setError(name: FieldName, message: string | null): void {
    const field = control(name);
    const error = errorOf(name);
    if (!field || !error) return;
    if (message) {
      error.textContent = message;
      error.hidden = false;
      field.setAttribute('aria-invalid', 'true');
    } else {
      error.textContent = '';
      error.hidden = true;
      field.removeAttribute('aria-invalid');
    }
  }

  function validate(): FieldName[] {
    const invalid: FieldName[] = [];
    const name = control('name')?.value.trim() ?? '';
    const email = control('email')?.value.trim() ?? '';
    const message = control('message')?.value.trim() ?? '';

    setError('name', name ? null : MESSAGES.name);
    if (!name) invalid.push('name');

    const emailError = !email ? MESSAGES.emailMissing : EMAIL_PATTERN.test(email) ? null : MESSAGES.emailInvalid;
    setError('email', emailError);
    if (emailError) invalid.push('email');

    setError('message', message ? null : MESSAGES.message);
    if (!message) invalid.push('message');
    return invalid;
  }

  function showStatus(kind: 'success' | 'error'): void {
    ui.status.replaceChildren();
    if (kind === 'success') {
      ui.status.textContent = MESSAGES.success;
    } else {
      ui.status.append(`${MESSAGES.error} `);
      const link = document.createElement('a');
      link.href = `mailto:${fallbackEmail}`;
      link.textContent = fallbackEmail;
      ui.status.append(link, '.');
    }
    ui.status.hidden = false;
  }

  // Appena si corregge un campo l'errore sparisce
  (['name', 'email', 'message'] as const).forEach((name) =>
    control(name)?.addEventListener('input', () => setError(name, null)),
  );

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    ui.status.hidden = true;

    const invalid = validate();
    const first = invalid[0];
    if (first) {
      control(first)?.focus();
      return;
    }

    const data = new FormData(form);
    // Campo trappola compilato: è un bot. Si finge un successo senza inviare nulla.
    if (String(data.get('website') ?? '') !== '') {
      showStatus('success');
      return;
    }

    ui.submit.disabled = true;
    ui.submit.textContent = MESSAGES.sending;
    form.setAttribute('aria-busy', 'true');
    try {
      const response = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: String(data.get('name') ?? '').trim(),
          email: String(data.get('email') ?? '').trim(),
          message: String(data.get('message') ?? '').trim(),
          website: '',
          turnstile: String(data.get('cf-turnstile-response') ?? ''),
        }),
      });
      if (!response.ok) throw new Error(`Risposta ${response.status}`);
      form.reset();
      showStatus('success');
    } catch {
      showStatus('error');
    } finally {
      // Il token Turnstile vale una sola volta: ne serve uno nuovo per un altro invio
      (window as { turnstile?: { reset(): void } }).turnstile?.reset();
      ui.submit.disabled = false;
      ui.submit.textContent = submitLabel;
      form.removeAttribute('aria-busy');
    }
  });
}
