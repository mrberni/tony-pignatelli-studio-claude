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
   Eccezione approvata dall'utente: l'hero della home ha un velo piatto `rgba(7,16,19,0.25)` sopra le foto, per la leggibilità del titolo. Le foto di schede, copertine e gallerie restano senza overlay.
7. In dubbio, fermati e chiedi: una domanda breve costa meno di un refactoring.

## Comandi
Sito: `pnpm dev` · `pnpm build` · `pnpm check` (astro check) · `pnpm preview`.
Studio: `pnpm studio` (locale, porta 3333) · `pnpm studio:check` (tsc + validazione schema) · `pnpm studio:build` · `pnpm studio:deploy` (pubblica: chiedere conferma).
Importatore Wix → Sanity (`/scripts`, Node 24 esegue direttamente i `.ts`): `pnpm import:dry` (non scrive nulla; con `-- --dataset staging` confronta in sola lettura) · `pnpm import:run -- --dataset staging` (scrive; serve `SANITY_WRITE_TOKEN` in `.env.local`) · `pnpm import:verify -- --dataset staging`. Foto (Fase 4, solo su richiesta esplicita): `pnpm import:photos:dry` (piano e peso, nessun download) · `pnpm import:photos:run -- --dataset staging [--limit N] [--update]` · `pnpm import:photos:verify -- --dataset staging`; scarica da Wix in `data/.cache/` (ignorata da git).
Opzioni dell'importatore dati: `--prune` (cancella i documenti estranei: chiedere conferma), `--update` (aggiorna anche i documenti esistenti), `--confirm-production` (obbligatorio per `production`: solo dopo l'ok dell'utente).

Foto della pagina Studio (dall'/about di Wix): `pnpm import:studio-photo -- --dataset staging [--update]` (idempotente; serve `SANITY_WRITE_TOKEN`). I clienti (striscia della home, elenco dello Studio) sono **solo nomi in testo**, niente loghi.

Redirect da Wix (Fase 5): `pnpm redirects` rigenera `public/_redirects` (e controlla che foglio e sitemap di Wix coincidano; l'elenco reale delle pagine di Wix è in `data/wix-sitemap.json`) · `pnpm redirects:check` (dopo `pnpm build`: ogni destinazione deve esistere in `dist/`). Dopo aver cambiato titoli/slug dei progetti vanno rigenerati.

## Progetti selezionati in home
Sono un elenco trascinabile (da 4 a 8 progetti) nella pagina **Home** dello Studio (`homePage.featuredProjects`), nell'ordine scelto lì; il campo `featured` sui progetti non esiste più. Passaggio una tantum per dataset: `pnpm migrate:featured -- --dataset staging` (riempie l'elenco con gli 8 di prima), poi `--cleanup` toglie il vecchio campo dai progetti; `production` richiede `--confirm-production`.

## Video nelle gallerie dei progetti
La galleria (`project.gallery`) accetta foto e video: nello Studio, «Aggiungi elemento» → Video (tipo `video`: file .mp4 + immagine di anteprima). Il file va su Sanity (asset `file`, servito da cdn.sanity.io, senza transcodifica: meglio .mp4 H.264 sotto i 30 MB). Nel sito il video è la sua anteprima con un segno di riproduzione; si avvia nel visore a tutto schermo (il file si scarica solo allora), **sempre muto e in ripetizione**, senza controlli del browser (niente audio attivabile): solo Pausa / Riproduci. Lo schema va pubblicato con `pnpm studio:deploy` (chiedere conferma).

## Modulo contatti
`worker/` è il Worker di Cloudflare davanti al sito statico: risponde solo a `/api/contact` (`run_worker_first` in `wrangler.jsonc`), verifica Turnstile e invia la mail con Resend; non salva nulla. Test: `pnpm test:worker`. Variabile di **build** pubblica: `PUBLIC_TURNSTILE_SITE_KEY`. Segreti/variabili del **Worker** (su Cloudflare; in locale solo `.env.local`): `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, `CONTACT_TO`, `CONTACT_FROM` (dominio verificato in Resend; senza, Resend consegna solo all'email dell'account). Senza queste variabili il Worker risponde errore e non invia.

## Sanity Studio
`/studio` è un pacchetto pnpm **separato** (proprio `pnpm-lock.yaml`, fuori dal workspace della radice), così il build del sito su Cloudflare non installa le dipendenze dello Studio. Prima installazione: `pnpm --dir studio install`.
Due workspace nello stesso Studio: `production` ("Sito") e `staging` ("Prove"). Progetto Sanity `8yzoe1bm`.
I file di configurazione vanno salvati in UTF-8 **senza BOM** (con il BOM `sanity dev` non legge `package.json`).

## Contenuti: Sanity o dati di prova
Le pagine leggono tutto da `src/lib/content.ts`. Con `SANITY_DATASET` impostato i contenuti arrivano da Sanity al momento del build; senza, si usano i dati di prova di `src/lib/fixtures.ts`. Nei build di Cloudflare di un branch diverso da `main` (anteprime) il dataset è `staging` in automatico (`WORKERS_CI_BRANCH`); `main` (produzione) legge il dataset `production`, importato il 12 ottobre 2026 (63 progetti, 45 clienti, 618 foto) e impostato con `SANITY_DATASET=production` nelle variabili di build dell'ambiente Production di Cloudflare; senza quella variabile ripiega sui dati di prova. Ogni pagina ha `<meta name="content-source">` (`sanity:staging`, `sanity:production` o `fixtures`) per verificarlo. Il foglio Excel contiene in fondo una riga "Esempio di riga compilata (da non importare)": l'importatore si ferma lì.

## Build automatico dalla pubblicazione in Sanity
Un webhook di Sanity (progetto `8yzoe1bm`, dataset `production`, create/update/delete, bozze escluse, filtro sui tipi `project`, `client`, `homePage`, `studioPage`, `servicesPage`, `contactPage`, `siteSettings`) chiama un Deploy hook di Cloudflare (tps-claude → Settings → Builds → Deploy Hooks, branch `main`) che ricostruisce il sito. L'indirizzo del hook è segreto: sta solo nelle impostazioni di Sanity e di Cloudflare, mai nel repository. Il dataset `staging` non ha webhook.

## Hosting
Il progetto Cloudflare `tps-claude` è di tipo **Workers** (Workers Builds), non Pages: gli asset statici di `dist/` sono dichiarati in `wrangler.jsonc`. Variabile di build `NODE_VERSION=24`.

## SEO e indicizzazione
Il dominio per canonical, sitemap e Open Graph è `PUBLIC_SITE_URL` (predefinito `https://www.tonypignatellistudio.com`). `public/_headers` mette `X-Robots-Tag: noindex` a tutti gli indirizzi `*.workers.dev` (produzione provvisoria e anteprime): sul dominio vero la regola non si applica. `robots.txt` e `sitemap.xml` si generano al build. Nel sito generato Astro riporta i percorsi con `.html`: usare `cleanPath()` (`src/lib/site.ts`) per canonical e voce attiva del menu.

## Larghezza massima
Decisione dell'utente che **sostituisce** i 1440px di HANDOFF §4.4: il contenuto si estende con la finestra (margine laterale 32px) fino a `--page-max: 2560px`; oltre resta centrato. Le linee di separazione e le fasce nere coprono sempre tutta la finestra. Il valore sta in `src/styles/tokens.css` (la copia in `design/` resta quella originale).

## Repository pubblico
Il repository GitHub è **pubblico**. Mai committare token, `.env.local`, email personali o altri dati privati. `main` è protetta da un ruleset (solo pull request, nessun force-push).

## Modelli consigliati
Opus: schema Sanity, architettura, revisione finale. Sonnet: implementazione di componenti, pagine, import, test.
