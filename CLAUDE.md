# Tony Pignatelli Studio — sito (versione Claude)

Portfolio di uno studio di scenografia e set design, rivolto a brand e agenzie in Italia.
Lingua del sito e dello Studio Sanity: **italiano**. Nomi di codice: inglese.

**Leggi per intero `HANDOFF.md` prima di scrivere qualsiasi codice.** È la fonte di verità.
Ordine di priorità se due fonti si contraddicono: `HANDOFF.md` > `design/mockups/` > `design/design-system.md`.

## Stack
Astro (output statico) · TypeScript strict · CSS con variabili (`design/tokens.css`) · Sanity (CMS) · Cloudflare Pages · GitHub.
Font: Hanken Grotesk (self-hosted), ripiego Helvetica Neue, Helvetica, Arial.

## Regole non negoziabili
1. **Mai commit diretti su `main`.** Un branch per attività (`feat/...`, `fix/...`), pull request, anteprima Cloudflare, revisione dell'utente, poi merge.
2. **Chiedi conferma prima di**: creare o collegare account/servizi, installare dipendenze nuove non previste, scrivere nel dataset `production`, cancellare qualsiasi cosa, toccare DNS/dominio, pubblicare.
3. **Questo progetto è separato** dal sito costruito con ChatGPT (altro repository, altro progetto Sanity, altro progetto Cloudflare). Non leggerlo, non modificarlo, non riusarne gli ID.
4. **Segreti**: solo variabili d'ambiente, `.env.local` fuori da Git. Non stampare mai token nei log o nei messaggi.
5. **Non inventare contenuti**: i testi tra `[parentesi quadre]` sono segnaposto. Non attribuire ai clienti affermazioni o risultati che non hai in input.
6. **Regole di design**: nessun testo tutto in maiuscolo; il nome del cliente compare **solo** nella pagina del singolo progetto; nessun angolo arrotondato, ombra o gradiente; `accent` solo dove previsto; niente anno nell'interfaccia.
7. In dubbio, fermati e chiedi: una domanda breve costa meno di un refactoring.

## Comandi
Sito: `pnpm dev` · `pnpm build` · `pnpm check` (astro check) · `pnpm preview`.
Studio: `pnpm studio` (locale, porta 3333) · `pnpm studio:check` (tsc + validazione schema) · `pnpm studio:build` · `pnpm studio:deploy` (pubblica: chiedere conferma).
Previsti nelle fasi successive: `pnpm import:dry` / `pnpm import:run` (importatore).

## Sanity Studio
`/studio` è un pacchetto pnpm **separato** (proprio `pnpm-lock.yaml`, fuori dal workspace della radice), così il build del sito su Cloudflare non installa le dipendenze dello Studio. Prima installazione: `pnpm --dir studio install`.
Due workspace nello stesso Studio: `production` ("Sito") e `staging` ("Prove"). Progetto Sanity `8yzoe1bm`.
I file di configurazione vanno salvati in UTF-8 **senza BOM** (con il BOM `sanity dev` non legge `package.json`).

## Hosting
Il progetto Cloudflare `tps-claude` è di tipo **Workers** (Workers Builds), non Pages: gli asset statici di `dist/` sono dichiarati in `wrangler.jsonc`. Variabile di build `NODE_VERSION=24`.

## Repository pubblico
Il repository GitHub è **pubblico**. Mai committare token, `.env.local`, email personali o altri dati privati. `main` è protetta da un ruleset (solo pull request, nessun force-push).

## Modelli consigliati
Opus: schema Sanity, architettura, revisione finale. Sonnet: implementazione di componenti, pagine, import, test.
