import { createClient } from '@sanity/client';

/** Variabili d'ambiente: `import.meta.env` in Astro, `process.env` come riserva (Cloudflare). */
function env(name: string): string | undefined {
  const value = (import.meta.env as Record<string, string | undefined>)[name] ?? process.env[name];
  return value && value.trim() !== '' ? value.trim() : undefined;
}

/**
 * Dataset da cui leggere. `SANITY_DATASET` vince sempre. Se manca, nei build di Cloudflare di un
 * branch diverso da `main` (le anteprime) si usa `staging`, senza dipendere da una variabile
 * impostata a mano; `main` resta sui dati di prova finché non si imposta `SANITY_DATASET=production`.
 */
const branch = env('WORKERS_CI_BRANCH') ?? env('CF_PAGES_BRANCH');
export const sanityDataset = env('SANITY_DATASET') ?? (branch && branch !== 'main' ? 'staging' : undefined);

/** Se `false` il sito usa i dati di prova (vedi `content.ts`). */
export const isSanityConfigured = sanityDataset !== undefined;

// L'ID del progetto non è un segreto: compare comunque nel sito pubblicato.
const projectId = env('SANITY_PROJECT_ID') ?? '8yzoe1bm';
const token = env('SANITY_READ_TOKEN'); // solo se il dataset diventa privato

export const sanityClient = createClient({
  projectId,
  dataset: sanityDataset ?? 'production',
  apiVersion: env('SANITY_API_VERSION') ?? '2026-10-01',
  // Al build serve sempre il dato più recente: niente CDN
  useCdn: false,
  perspective: 'published',
  ...(token ? { token } : {}),
});

/**
 * Query GROQ con nuovi tentativi (1-2-4-8 s): una caduta di rete momentanea non deve far fallire
 * un build di decine di pagine. Gli errori veri (query sbagliata, permessi) falliscono subito.
 */
export async function query<T>(groq: string, params: Record<string, unknown> = {}): Promise<T> {
  const attempts = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      return await sanityClient.fetch<T>(groq, params);
    } catch (error) {
      const code = (error as { cause?: { code?: string } }).cause?.code ?? '';
      const transient = ['EAI_AGAIN', 'ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'UND_ERR_CONNECT_TIMEOUT'].includes(code) || error instanceof TypeError;
      if (!transient || attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }
}

/** Scarica un testo (es. un SVG) con gli stessi nuovi tentativi delle query. */
export async function fetchText(url: string): Promise<string> {
  const attempts = 5;
  for (let attempt = 1; ; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status} per ${url}`);
      return await response.text();
    } catch (error) {
      if (attempt === attempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }
}
