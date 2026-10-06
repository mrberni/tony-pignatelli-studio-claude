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
Importatore Wix → Sanity (`/scripts`, Node 24 esegue direttamente i `.ts`): `pnpm import:dry` (non scrive nulla; con `-- --dataset staging` confronta in sola lettura) · `pnpm import:run -- --dataset staging` (scrive; serve `SANITY_WRITE_TOKEN` in `.env.local`) · `pnpm import:verify -- --dataset staging`. Opzioni: `--prune` (cancella i documenti estranei: chiedere conferma), `--update` (aggiorna anche i documenti esistenti), `--confirm-production` (obbligatorio per `production`: solo dopo l'ok dell'utente).

## Sanity Studio
`/studio` è un pacchetto pnpm **separato** (proprio `pnpm-lock.yaml`, fuori dal workspace della radice), così il build del sito su Cloudflare non installa le dipendenze dello Studio. Prima installazione: `pnpm --dir studio install`.
Due workspace nello stesso Studio: `production` ("Sito") e `staging` ("Prove"). Progetto Sanity `8yzoe1bm`.
I file di configurazione vanno salvati in UTF-8 **senza BOM** (con il BOM `sanity dev` non legge `package.json`).

## Contenuti: Sanity o dati di prova
Le pagine leggono tutto da `src/lib/content.ts`. Con `SANITY_DATASET` impostato (`staging` per le anteprime, `production` per il sito) i contenuti arrivano da Sanity al momento del build; senza, si usano i dati di prova di `src/lib/fixtures.ts`. Il foglio Excel contiene in fondo una riga "Esempio di riga compilata (da non importare)": l'importatore si ferma lì.

## Hosting
Il progetto Cloudflare `tps-claude` è di tipo **Workers** (Workers Builds), non Pages: gli asset statici di `dist/` sono dichiarati in `wrangler.jsonc`. Variabile di build `NODE_VERSION=24`.

## Larghezza massima
Decisione dell'utente che **sostituisce** i 1440px di HANDOFF §4.4: il contenuto si estende con la finestra (margine laterale 32px) fino a `--page-max: 2560px`; oltre resta centrato. Le linee di separazione e le fasce nere coprono sempre tutta la finestra. Il valore sta in `src/styles/tokens.css` (la copia in `design/` resta quella originale).

## Repository pubblico
Il repository GitHub è **pubblico**. Mai committare token, `.env.local`, email personali o altri dati privati. `main` è protetta da un ruleset (solo pull request, nessun force-push).

## Modelli consigliati
Opus: schema Sanity, architettura, revisione finale. Sonnet: implementazione di componenti, pagine, import, test.
