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
