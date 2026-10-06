# Tony Pignatelli Studio — Documento di consegna per Claude Code

Versione 1 · tutto il materiale citato è in questa cartella.

## Indice
0. Come usare questo documento
1. Regole di lavoro
2. Contesto e obiettivi
3. Stack, infrastruttura, nomi
4. Design system
5. Mappa del sito e routing
6. Specifica pagina per pagina
7. Modello dati Sanity
8. Dati e migrazione da Wix
9. Redirect, SEO, accessibilità, prestazioni
10. Modulo contatti
11. Regole per il mobile
12. Fasi di lavoro e criteri di accettazione
13. Punti aperti
14. Confronto con l'altra versione
15. Appendice A — testi delle pagine

---

## 0. Come usare questo documento

- **Fonte di verità**: questo file. Se contraddice un mockup, vale questo file; se contraddice `design/design-system.md`, vale questo file.
- **Mockup**: `design/mockups/*.dc.html`. Sono pagine HTML con stili inline nel formato "design canvas" dello strumento con cui sono state disegnate. Contengono tag e codice propri di quello strumento (`<x-dc>`, `<sc-for>`, `<sc-if>`, `{{ }}`, la classe `DCLogic`, `support.js`): **non vanno portati nel sito**. Servono da riferimento di struttura, misure e testi. Non si aprono in un browser come sono.
- I link `claude.ai/artifact/...` che trovi nei messaggi dell'utente sono privati: non contarci. Tutto ciò che serve è in questa cartella.
- Nei mockup le foto sono **segnaposto** ("Foto — ..."): in produzione sono immagini vere da Sanity.
- Testi tra `[parentesi quadre]` = segnaposto da non pubblicare.
- Misure in px a 1440 di larghezza, salvo indicazione diversa. Le regole per schermi piccoli sono in §11 (nei mockup non sono disegnate).

## 1. Regole di lavoro

### Git e anteprime
- `main` è protetto: nessun commit diretto, nessun force-push.
- Un branch per attività, nome `feat/<cosa>`, `fix/<cosa>`, `content/<cosa>`. Commit piccoli, messaggi chiari in inglese (Conventional Commits).
- Ogni branch ha un'anteprima Cloudflare Pages: a fine attività passa all'utente il link e **aspetta il suo ok** prima del merge.
- Una pull request per attività, con elenco di cosa cambia e come verificarlo.

### Quando fermarsi e chiedere
Prima di: creare/collegare account o servizi; installare dipendenze non previste in questo documento; scrivere nel dataset `production`; eseguire l'importatore in modalità scrittura; cancellare file, documenti o asset; toccare DNS o dominio; pubblicare; cambiare lo schema dati dopo che esistono contenuti.

### Segreti
Solo variabili d'ambiente. `.env.local` è in `.gitignore`. Nessun token nel repository, nei log, nei messaggi o nelle PR. I token vanno creati con i permessi minimi (Sanity: uno di sola lettura per il sito se il dataset è privato, uno di scrittura solo per l'importatore, locale; Cloudflare: limitato al progetto Pages).

### Separazione dall'altra versione
Esiste già un sito costruito in parallelo con un altro assistente (Astro + Sanity + Cloudflare). **Questo progetto è indipendente**: repository, progetto Sanity e progetto Cloudflare nuovi. Non leggere né modificare nulla dell'altro, non riusarne ID o token. Serve per un confronto finale (§14).

### Contenuti e design
- Non inventare fatti sui clienti o sui progetti.
- Le regole del design system (§4) valgono sempre, anche dove i mockup sono ambigui. In caso di dubbio: chiedi.
- Se trovi un'incongruenza tra mockup e questo documento, segnalala nella PR invece di sceglierne una in silenzio.

### Modelli (indicazione per l'utente)
Opus per: schema Sanity, architettura dei componenti, revisione finale prima del deploy. Sonnet per: componenti, pagine, importatore, test. 

## 2. Contesto e obiettivi

- **Cliente**: Tony Pignatelli Studio, studio creativo multidisciplinare (scenografia, set design, allestimenti per eventi, vetrine e retail, art direction). Sede: Via Ludovico Ariosto 123, 20099 Sesto San Giovanni (MI).
- **Scopo del sito**: portfolio per presentarsi a potenziali nuovi clienti in Italia: Brand, Creative Agency, Event Agency, PR Agency, Production Company.
- **Situazione attuale**: sito su Wix (`tonypignatellistudio.com`) con 63 progetti: 32 Eventi, 26 Vetrine, 5 Set Design.
- **Obiettivi del rifacimento**: nuova struttura, nuovi testi, nuovo design (già disegnato nei mockup); aggiungere un lavoro deve essere semplice per chi non programma (pannello Sanity); prestazioni e SEO migliori; nessuna perdita di posizionamento (redirect 301).
- **Lingua**: solo italiano.
- **Tono dei testi**: diretto, professionale, orientato a chi commissiona.

## 3. Stack, infrastruttura, nomi

| Elemento | Scelta |
|---|---|
| Sito | Astro (stabile corrente), output **statico**, TypeScript strict |
| Interattività | TypeScript "vanilla" in piccoli script (carousel, filtri, caricamento continuo, menu mobile, visore foto). Nessun framework UI salvo accordo |
| Stile | CSS semplice con variabili (`design/tokens.css`). Niente Tailwind: i token corrispondono 1:1 alle variabili |
| CMS | Sanity (versione corrente), Studio in `/studio` nello stesso repository, pubblicato con `sanity deploy` (Studio ospitato). Dataset: `production` e `staging` |
| Immagini | Asset in Sanity, servite dal CDN con `@sanity/image-url`: `srcset` (480, 768, 1200, 1800, 2400), `auto=format`, `width`/`height` presi dai metadati (nessun salto di layout), sfondo di attesa dal colore dominante |
| Hosting | Cloudflare Pages collegato a GitHub: `main` = produzione, ogni altro branch = anteprima |
| Aggiornamento contenuti | Webhook Sanity → Deploy Hook di Cloudflare Pages alla pubblicazione (solo dataset `production`) |
| Font | Hanken Grotesk 400, 500, 700, **self-hosted** (woff2 in `public/fonts`, es. via `@fontsource`), `font-display: swap`, preload dei pesi 400 e 500. Ripiego: `"Helvetica Neue", Helvetica, Arial, sans-serif` |
| Gestore pacchetti | pnpm, lockfile committato; Node LTS |

**Nomi** (per distinguerli dall'altra versione): repository GitHub `tony-pignatelli-studio-claude`; progetto Sanity "Tony Pignatelli Studio — Claude"; progetto Cloudflare Pages `tps-claude`.

**Variabili d'ambiente** (esempio in `.env.example`, valori mai nel repo):
`SANITY_PROJECT_ID`, `SANITY_DATASET`, `SANITY_API_VERSION` (data fissa), `SANITY_READ_TOKEN` (solo se il dataset è privato), `SANITY_WRITE_TOKEN` (solo locale, importatore), `PUBLIC_SITE_URL`, più quelle del modulo contatti (§10).

**Struttura suggerita del repository**
```
/studio            Sanity Studio (schemi in /studio/schemaTypes)
/src               pages, components, layouts, lib (query Sanity, image helpers), styles
/public            fonts, favicon, _redirects, _headers, robots.txt
/scripts           importatore Wix → Sanity, generatore redirect
/design            tokens.css, design-system.md, mockups/ (riferimento, non è codice del sito)
/data              foglio Excel e CSV di Wix (sola lettura)
HANDOFF.md  CLAUDE.md
```

## 4. Design system

Fonte tecnica: `design/tokens.css` (variabili pronte) e `design/design-system.md` (descrizione). Qui le regole che contano.

### 4.1 Principi
1. Le foto comandano: poco testo, immagini grandi, nessuna decorazione.
2. Gerarchia con dimensione, peso, spazio e posizione; non con etichette pesanti.
3. **Nessun testo tutto in maiuscolo**, ovunque (menu, pulsanti, metadati, titoli). Solo la prima lettera maiuscola, più i nomi propri.
4. **Un solo colore di richiamo**: `--accent` (ciano). Lo si usa solo per: separatori dei filtri, filtro attivo/pulsante del form, puntini attivi quando previsto. Non per sfondi grandi.
5. Taglio netto: nessun `border-radius` (eccezione: i puntini del carousel), nessuna ombra, nessun gradiente.
6. **Il nome del cliente non compare** nelle schede, nel carousel, nelle griglie, nelle anteprime. Compare **solo** nella pagina del singolo progetto.
7. **L'anno non compare mai** nell'interfaccia.
8. Le foto non hanno bordi, cornici, overlay né filtri (il bordo grigio dei segnaposto nei mockup NON va riprodotto).

### 4.2 Tipografia (famiglia unica: Hanken Grotesk)
| Ruolo | Dimensione | Interlinea | Peso | Altro |
|---|---|---|---|---|
| Nome studio (header) | 17px | 1.2 | 700 | |
| Voci di menu | 15px | 1.2 | 400; **voce della pagina attiva 700** | |
| Etichetta di sezione (`label`) | 15px | 1.3 | 500 | colore `--ink-soft` |
| Display (titolo pagina progetto) | `clamp(41px, calc(5.5vw + 1px), 81px)` | 1 | 400 | letter-spacing −0.02em, larghezza max 16ch |
| H2 (titoli di sezione, domanda CTA, titolo hero) | `clamp(31px, calc(3.2vw + 1px), 49px)` | 1.05 | 400 | letter-spacing −0.015em |
| Lead / H3 | `clamp(23px, calc(2vw + 1px), 33px)` | 1.25 | 400 | letter-spacing −0.005em |
| Filtri pagina Progetti | 46px | 1.1 | 400 | letter-spacing −0.01em |
| Testo corrente | 19px | 1.45 (1.6 nei paragrafi lunghi) | 400 | paragrafi lunghi in `--ink-soft`, larghezza max 620px |
| Titolo scheda progetto | 19px in home, **22px** in `/progetti` | 1.3 | 500 | |
| Link di sezione (`tlink`) | 17px | 1.2 | 500 | sottolineato 1px `currentColor`, `padding-bottom: 2px`, freccia ↗ |
| Metadati (`meta`) | 14px | 1.3 | 500 | `--ink-soft`, es. "Eventi · Automotive" |
| Campi form | 17px | | 400 | etichette 15px/500 |

Pesi usati: 400, 500, 700 (700 solo per nome studio e voce di menu attiva).

### 4.3 Colore
Vedi `tokens.css`. Su sfondo scuro (CTA e footer): testo `--ink-inverse`, testo secondario `--ink-soft-inverse`, linee `--line-inverse`. Il testo sopra `--accent` è `--accent-ink` (scuro). Il bianco sul ciano non supera il contrasto minimo: non usarlo.

### 4.4 Spaziatura e griglia
- Scala: **8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128**. Ogni margine importante deve derivare da questa scala.
- Margine laterale della pagina: 32px (24px su mobile). Contenuto centrato con larghezza massima 1440px.
- **Sfondi a tutta larghezza**: le fasce scure (CTA, footer) devono estendersi a tutta la larghezza della finestra anche oltre i 1440px, con il contenuto interno centrato a 1440px. (Nei mockup sono contenute nei 1440px: è una semplificazione del disegno.)
- Griglia a 12 colonne, gutter 24px.
- Sezioni di testo: bordo superiore 1px `--line`, padding verticale 96px (128px per il CTA).

### 4.5 Pattern ricorrenti
**Sezione "etichetta · contenuto · link"** (Lo studio, Servizi in home): griglia 12 col; etichetta colonne 1–3; titolo H2 (max 20ch) + paragrafo (max 620px, `--ink-soft`) colonne 4–9; link a destra colonne 10–12, allineato al bordo destro, in alto rispetto al contenuto. Lo stesso bordo destro e la stessa linea di "Tutti i progetti ↗".

**Sezione di testo editoriale** (Studio: "Esperienza e network", "Dal brand allo spazio"): titolo H2 colonne 1–5; a destra (6–12) un primo paragrafo in grande (lead/H3, colore `--ink`) e poi paragrafi normali in `--ink-soft` (margine superiore 32px, poi 24px).

**CTA di fine pagina** (fondo nero, testi bianchi, padding 128px 32px, griglia 12 col):
- etichetta "Parliamo del tuo progetto" colonne 1–3 (`--ink-soft-inverse`);
- domanda (H2, max 18ch) colonne 4–9, **sulla stessa colonna di partenza dei testi centrali delle altre sezioni**;
- a destra (10–12, allineato a destra): link "Contatti ↗" (testo sottolineato, **non** un pulsante) e sotto email e telefono (17px, `--ink-soft-inverse`, `mailto:` e `tel:`).
- Una **domanda diversa per ogni pagina** (Appendice A).

**Footer** (fondo nero): riga 1 — nome studio, menu (Progetti, Studio, Servizi, Contatti), Instagram, LinkedIn, "Milano · Italia"; riga 2 su tre colonne (`1fr auto 1fr`) — copyright a sinistra, **"Torna su ↑" al centro** (in tutte le pagine **tranne Contatti**), Privacy e Cookie a destra. Una linea `--line-inverse` separa il footer dal CTA.

**Scheda progetto**: foto, sotto il titolo del progetto (peso 500) e la riga `meta` ("Eventi · Automotive", con "Set design" per la categoria Set Design). Nessun cliente, nessun anno, nessuna cornice. L'intera scheda è un link a `/progetti/<slug>`.

**Griglia sfalsata** (home "Progetti selezionati", `/progetti`, galleria): massimo 3 elementi per riga, larghezze diverse, colonne di partenza diverse da una riga all'altra e scarti verticali tra elementi della stessa riga. Si realizza con `grid-template-columns: repeat(12, minmax(0, 1fr))`, `column-gap: 24px`, `row-gap: 48px`, `align-items: start` e, per ogni elemento, `grid-column` e `margin-top` presi da uno schema che si ripete.

Schema di 8 slot per home e `/progetti` (ripetuto a ciclo; `ratio` = proporzione dell'immagine nello slot, con `object-fit: cover` e rispetto del punto focale di Sanity):

| # | grid-column | ratio | margin-top |
|---|---|---|---|
| 1 | 1 / 6 | 4 / 3 | 0 |
| 2 | 6 / 9 | 3 / 4 | 96px |
| 3 | 9 / 13 | 4 / 3 | 32px |
| 4 | 2 / 7 | 4 / 3 | 0 |
| 5 | 8 / 13 | 5 / 4 | 64px |
| 6 | 1 / 4 | 3 / 4 | 48px |
| 7 | 4 / 9 | 4 / 3 | 0 |
| 8 | 10 / 13 | 1 / 1 | 96px |

Righe che ne risultano: (1,2,3) · (4,5) · (6,7,8). In home gli 8 slot mostrano gli 8 progetti in evidenza.

Schema di 12 slot per la **galleria del singolo progetto** (a ciclo): 
`1/13 16:9 · 1/8 4:3 + 9/13 3:4 (mt 96) · 2/6 4:5 + 6/10 4:3 (mt 48) + 10/13 3:4 · 1/6 3:2 + 7/13 3:2 (mt 64) · 3/11 16:9 · 1/5 1:1 + 5/9 4:5 (mt 64) + 9/13 4:3 (mt 16)`.
Nella galleria vera conviene usare la **proporzione reale di ciascuna foto** (dai metadati) scegliendo l'ampiezza in base all'orientamento (orizzontali più larghe, verticali più strette), sempre con al massimo 3 per riga. Proponi l'algoritmo nella PR.

## 5. Mappa del sito e routing

| Percorso | Pagina | Mockup |
|---|---|---|
| `/` | Home | `Main.dc.html` |
| `/progetti` | Elenco progetti (filtri, caricamento continuo) | `Progetti.dc.html` |
| `/progetti/[slug]` | Singolo progetto | `Progetto.dc.html` |
| `/studio` | Studio (voce di menu "Studio") | `Studio.dc.html` |
| `/servizi` | Servizi | `Servizi.dc.html` |
| `/contatti` | Contatti | `Contatti.dc.html` |
| `/privacy`, `/cookie` | Testi legali | **da scrivere a cura dell'utente**; per ora pagine segnaposto |
| `/404` | Pagina non trovata | non disegnata: riusa header/footer, titolo "Pagina non trovata" e link "Torna ai progetti ↗" |
| `/sitemap.xml`, `/robots.txt` | SEO | da generare |

Voci di menu, in quest'ordine: **Progetti · Studio · Servizi · Contatti**. Nessun pulsante nel menu. Nome dello studio a sinistra, link alla home.
Il menu evidenzia (700) la pagina attiva; `/progetti/[slug]` evidenzia "Progetti".

## 6. Specifica pagina per pagina

Per ogni pagina: i mockup danno struttura e misure; i testi sono nell'Appendice A; i dati vengono da Sanity (§7). Header e footer sono uguali ovunque (§4.5, §5).

### 6.1 Home — `Main.dc.html`
Sezioni, dall'alto:
1. **Header**.
2. **Hero con carousel** a tutta larghezza, altezza 620px (desktop).
   - Contenuto: i 4–5 progetti di `homePage.carousel`, nell'ordine scelto. Ogni slide: foto di copertina a pieno riquadro (`object-fit: cover`), in basso a sinistra la riga `meta` (categoria · settore, colore `#B9C0C3`) e il titolo del progetto in H2 bianco (max 22ch); in basso a destra il link **"Esplora i progetti ↗"** verso `/progetti` (bianco). **Non** si mostra il cliente.
   - Avanza da sola ogni 5 secondi, a ciclo.
   - **Niente frecce visibili.** Il terzo sinistro e il terzo destro della foto (30% di larghezza ciascuno, a tutta altezza) sono due aree cliccabili: al passaggio del mouse il cursore diventa un cerchio bianco da 48px con una freccia ← o →; il click va al lavoro precedente/successivo. Le due aree sono `<button>` trasparenti con `aria-label` ("Lavoro precedente", "Lavoro successivo"), raggiungibili da tastiera.
   - Puntini indicatori (8px, tondi) in basso a sinistra (32px dal bordo, 16px dal fondo), attivo bianco pieno, altri bianchi al 35%; sono cliccabili.
   - Il testo non intercetta i click (`pointer-events: none`), tranne il link.
   - Accessibilità: l'autoplay si ferma con `prefers-reduced-motion`, al passaggio del mouse e al focus; deve esserci un modo di fermarlo. Mobile: vedi §11.
   - Contrasto del testo sulla foto: se una foto non garantisce leggibilità, **proponi** (non applicare) un velo scuro molto leggero e chiedi conferma.
3. **Lo studio** (pattern "etichetta · contenuto · link"): etichetta "Lo studio", H2, paragrafo, link "Conosci lo studio ↗" → `/studio`.
4. **Progetti selezionati**: riga con etichetta a sinistra e link "Tutti i progetti ↗" a destra; sotto la griglia sfalsata con gli **8** progetti con `featured = true`, ordinati per `order` crescente (più recente prima). Se sono più di 8 si mostrano i primi 8 (e lo Studio avvisa l'editor, §7).
5. **Servizi** (stesso pattern): etichetta "Servizi", H2, paragrafo, link "Scopri i servizi ↗" → `/servizi`.
6. **Brand & partner**: bordo superiore, etichetta, griglia a 6 colonne (gap 32px × 24px) con i **loghi** dei clienti con `showInLogoStrip = true` (oggi 12: BMW, Disney, Ferrari, Google, Lamborghini, LEGO, Miele, Missoni, Moleskine, Rinascente, Vans, Xiaomi). Loghi SVG resi **monocromatici in `--ink`** e di altezza ottica uniforme (28–40px, larghezza max 140px); si può ottenere con `mask-image` sull'SVG. Se un logo manca, si mostra il nome in testo (500, 19px): il componente deve funzionare in entrambi i casi.
7. **CTA** (domanda della home) e **footer**.

### 6.2 Progetti — `Progetti.dc.html`
- Nessun titolo visibile: la pagina parte direttamente dai filtri (c'è un `<h1>` nascosto "Progetti — Tony Pignatelli Studio" per SEO e screen reader). Nessun CTA in fondo, solo footer.
- **Filtri categoria**: tre voci di testo da 46px, **"Eventi | Vetrine | Set design"**, separate da una barra verticale `|` in grassetto color `--accent`. Nessun numero, nessun aspetto da pulsante, **nessuna voce "Tutti"**.
  - A riposo: elenco completo, le tre voci a piena opacità.
  - Cliccando una voce: l'elenco si filtra e le altre due si attenuano (opacità 0.4). Cliccando di nuovo la voce attiva: si torna all'elenco completo.
  - Sono veri `<button>` con `aria-pressed`.
- **Filtro settore**: a destra, etichetta "Settore" e menu a tendina (Tutti i settori, Automotive, Fashion, Beauty, Food & beverage, Technology, Entertainment, Retail, Sport). Nel mockup non è collegato: **va reso funzionante**, in combinazione (AND) con la categoria.
- Stato nell'URL: `?categoria=eventi&settore=fashion` (aggiornato con `history.replaceState`; letto al caricamento). Così i filtri sono condivisibili e i redirect da Wix possono puntare a una categoria.
- **Griglia sfalsata** (§4.5), ordinata per `order` crescente (più recente prima). Titolo scheda 22px/500, sotto la riga `meta`.
- **Caricamento continuo, senza pulsante**: all'inizio 9 schede; quando l'utente arriva a circa 300px dalla fine dell'elenco ne compaiono altre 9, fino alla fine. Sotto l'elenco una riga centrata in `meta`: "Caricamento altri progetti…" mentre ce ne sono altri, "Hai visto tutti i progetti" alla fine. Implementazione consigliata: tutte le schede sono già nell'HTML (utile a SEO e senza JavaScript; immagini oltre le prime 9 con `loading="lazy"`), e uno script le rivela a blocchi con `IntersectionObserver`. Cambiando filtro si riparte da 9. Senza JavaScript: elenco completo visibile.
- Stato vuoto (filtro senza risultati): messaggio "Nessun progetto per questa combinazione." con link per azzerare i filtri.

### 6.3 Singolo progetto — `Progetto.dc.html`
Sezioni dall'alto:
1. **Titolo**: link "← Progetti" a sinistra (colonne 1–3, 15px/500, colore `--ink`); a destra (4–12) la riga `meta` e il titolo del progetto in **Display** (`<h1>`, max 16ch). Il titolo è identico al titolo Wix.
2. **Copertina**: una sola immagine 16:9 a tutta larghezza utile, senza overlay né testo.
3. **Il progetto**: etichetta "Il progetto" (1–3); a colonne 4–9 la frase di apertura (`intro`, in lead/H3) e il testo (`description`, 19px, `--ink-soft`, max 620px); a destra (10–12) la scheda informazioni, con righe separate da linee sottili: **Cliente**, **Luogo**, **Servizi** (uno per riga). Etichette in `meta`, valori in 19px. Righe senza dato (es. città vuota) non si mostrano. **Nessun anno.** Questa è l'unica pagina in cui compare il cliente.
4. **Galleria**: etichetta "Galleria", poi tutte le foto con la griglia sfalsata di §4.5 (nella galleria vera, proporzioni reali).
5. **Precedente / Successivo**: bordo superiore, due blocchi a 6 colonne ciascuno. Sinistra: "← Precedente" + titolo (lead, max 18ch) + `meta`. Destra, allineato a destra: "Successivo →" + titolo + `meta`. **L'ordine è quello di recenza**: "Precedente" = il progetto con `order` immediatamente inferiore (più recente); "Successivo" = `order` immediatamente superiore. Al primo e all'ultimo progetto manca un lato: non mostrare nulla (nessun ciclo).
6. **CTA** con la domanda della pagina e **footer**.
- Menu: "Progetti" attivo. `<title>`: "<Titolo> — Tony Pignatelli Studio". Immagine Open Graph = copertina.
- Visore foto (proposta da confermare con l'utente): al click su una foto della galleria si apre a tutto schermo con frecce, tasti ← → e Esc. Non disegnato.

### 6.4 Studio — `Studio.dc.html`
Ordine delle sezioni (è stato deciso dall'utente):
1. **Intro**: due colonne. A sinistra `<h1>` "Studio" (Display) e due paragrafi; a destra una foto 4:5 (ritratto/studio al lavoro, da fornire).
2. **Esperienza e network** (pattern editoriale §4.5): titolo a sinistra; a destra primo paragrafo in lead e secondo normale. **Senza immagine.**
3. **Clienti**: H2 "Clienti" + elenco dei clienti dello studio su 6 colonne (testo, 19px). L'elenco (55 nomi, dal vecchio sito) è in Appendice A; è un contenuto separato dai clienti collegati ai progetti. L'utente vuole **loghi al posto del testo**: mostra il logo quando esiste un SVG per quel nome, altrimenti il nome (vedi punto aperto 13.3).
4. **Dal brand allo spazio**: sfondo **bianco**, stessa impaginazione di "Esperienza e network" (titolo a sinistra; lead + due paragrafi a destra).
5. **Il nostro metodo**: H2, frase introduttiva, poi 4 colonne (Fase 1–4: Ascolto, Concept, Progetto, Realizzazione), ognuna con filetto superiore di 2px in `--ink`, etichetta "Fase N" (14px, `--ink-soft`), nome (19px/500) e descrizione.
6. **CTA** (domanda dello Studio) e footer.

### 6.5 Servizi — `Servizi.dc.html`
1. **Intro**: etichetta "Servizi" (colonne 1–3) e `<h1>` in dimensione H2 (4–12, max 22ch).
2. **Quattro servizi numerati** 01–04 (Set design, Scenografia, Spatial design, Art direction). Ogni riga: filetto superiore, padding 32px sopra e 48px sotto; numero in `label` (colonne 1–2), titolo in dimensione H3 (3–7), descrizione in `--ink-soft` (8–12). Dopo il quarto, un filetto di chiusura. **Nessuna frase finale dopo l'elenco.**
3. **Come possiamo lavorare insieme**: sfondo **bianco** (non grigio), H2, frase introduttiva, 4 colonne (Creative partner, Set designer, Art direction, Partner operativo) separate da filetti verticali.
4. **CTA** (domanda dei Servizi) e footer.

### 6.6 Contatti — `Contatti.dc.html`
- Due colonne. **Sinistra**: `<h1>` "Contatti" (Display), frase introduttiva, poi tre blocchi con filetto superiore: **Studio** (indirizzo), **Scrivi o chiama** (email e telefono), **Seguici** (Instagram, LinkedIn). Etichette dei blocchi in `meta`.
- **Destra**: pannello `--surface-200` (padding 48px) con titolo "Parlaci del progetto" e il modulo: **solo tre campi — Nome, Email, Messaggio** — pulsante pieno "Invia richiesta" (`--accent`, testo scuro; è l'unico pulsante pieno del sito) e nota privacy con link. Dettagli in §10.
- **Nessun CTA** in fondo; footer **senza** "Torna su".
- Link social: Instagram `https://instagram.com/tonypignatellistudio/`, LinkedIn `https://www.linkedin.com/in/tony-pignatelli-studio-27238436/`. Nessun altro social.

## 7. Modello dati Sanity

Lo Studio è in italiano: titoli dei campi, descrizioni e messaggi di validazione in italiano. Singleton (un solo documento): `siteSettings`, `homePage`, `studioPage`, `servicesPage`, `contactPage` — senza pulsanti "crea/elimina" (`structure` personalizzata). Non esiste alcun campo "anno".

### 7.1 `project` (documento, uno per lavoro)
| Campo | Tipo | Note |
|---|---|---|
| `title` | string, obbligatorio | "Titolo (come appare nel sito)". Identico al titolo Wix, es. "Disney - Toy Story 5 - Premiere" |
| `slug` | slug da `title`, obbligatorio, univoco | |
| `category` | string, lista: `eventi` · `vetrine` · `set-design`, radio, obbligatorio | etichette: Eventi, Vetrine, Set design |
| `sector` | string, lista: Automotive · Fashion · Beauty · Food & beverage · Technology · Entertainment · Retail · Sport, obbligatorio | un solo settore per progetto |
| `client` | riferimento a `client`, obbligatorio | descrizione: "Visibile solo nella pagina del progetto" |
| `city` | string | facoltativo |
| `order` | number intero ≥ 1, obbligatorio | "1 = il lavoro più recente". Validazione: segnala duplicati |
| `featured` | boolean, default false | "Compare in 'Progetti selezionati' in home (consigliati 8)". Avviso (non blocco) se i progetti in evidenza sono più di 8 |
| `coverImage` | image con `hotspot`, obbligatorio | + campo `alt` (string, facoltativo; se vuoto si usa il titolo) |
| `gallery` | array di image con `hotspot` e `alt`, almeno 1 | l'ordine è quello di visualizzazione; trascinabile |
| `intro` | text (2 righe), max 160 caratteri | frase di apertura |
| `description` | text (5 righe) | paragrafi separati da riga vuota |
| `services` | array di string (tag), suggerimenti: Concept, Progettazione, Produzione, Allestimento, Set design, Scenografia, Art direction, Styling, Regia | |
| `seo` | oggetto: `title`, `description`, `image` | facoltativo; default da titolo, `intro`, copertina |
| `legacy` | oggetto **sola lettura**: `wixUrl`, `wixTitle` | tracciabilità e redirect |

Anteprima in elenco: titolo, "Categoria · Settore", copertina. Ordinamento predefinito in Studio: `order` crescente.

### 7.2 `client`
| Campo | Tipo | Note |
|---|---|---|
| `name` | string, obbligatorio | |
| `slug` | slug | |
| `logo` | file, accetta solo `.svg` | "Logo vettoriale ufficiale, fornito dal brand. Preferibilmente monocromatico" |
| `showInLogoStrip` | boolean | "Mostra nella striscia Brand & partner" |

### 7.3 `homePage` (singleton)
`carousel`: array di riferimenti a `project`, **minimo 4, massimo 5**, ordinabile · `studioSection` {`title`, `text`} · `servicesSection` {`title`, `text`} · `ctaQuestion` (string). I "Progetti selezionati" non si scelgono qui: derivano da `featured`.

### 7.4 Altri singleton
- `siteSettings`: nome studio, email, telefono, indirizzo, URL Instagram, URL LinkedIn, SEO di default (titolo, descrizione, immagine OG), `projectCtaQuestion`, URL delle pagine Privacy e Cookie, indirizzo di destinazione del modulo.
- `studioPage`: `intro` {testo 1, testo 2, foto}, `experience` {lead, testo}, `clientNames` (array di string — l'elenco di Appendice A), `brandToSpace` {lead, testo 2, testo 3}, `method` {intro, `steps`: array di {titolo, descrizione}}, `ctaQuestion`, `seo`.
- `servicesPage`: `intro`, `services` (array di {titolo, descrizione}, il numero è automatico), `collaboration` {titolo, intro, `roles`: array di {titolo, descrizione}}, `ctaQuestion`, `seo`.
- `contactPage`: `intro`, `formTitle`, `privacyNote`, `seo`.
I valori iniziali di tutti i singleton sono nell'Appendice A.

### 7.5 Note di implementazione
- Interrogazioni GROQ tipizzate (TypeGen o tipi scritti a mano), con `defined()` dove un campo è facoltativo.
- Le immagini si leggono con `asset->{url, metadata{dimensions, palette}}`.
- `order` è unico per progetto: la navigazione precedente/successivo si calcola in fase di build ordinando per `order`.
- Dopo l'importazione ordina l'elenco dello Studio per `order`, con anteprima a miniatura.

## 8. Dati e migrazione da Wix

### 8.1 Sorgenti (cartella `data/`)
- `tony-pignatelli-progetti_v5.xlsx` — **fonte di verità** per titolo, settore, città, cliente, in evidenza, carousel, ordine, URL Wix, nome dei file logo. Fogli: `Progetti` (63 righe), `Clienti` (45 righe), `Legenda`.
- `wix-export/Eventi.csv`, `Vetrine.csv`, `Set_Design.csv` — esportazioni del CMS Wix: servono **solo per le immagini** (`Main Project Image`, `Gallery`).
- **Ignora** nei CSV i campi `Client Name`, `Year`, `Description`, `Numero`, `Manual sort`, `Created/Updated Date`, `Owner`: sono dati d'esempio del template Wix o non pertinenti (es. clienti come "Breech" o "Kasta Travel", anno 2023-01-01, testo "placeholder").

### 8.2 Chiave di collegamento
`URL attuale Wix` nel foglio (es. `/eventi/foxcircus`) coincide con la colonna `... (Item)` dei CSV (`Eventi (Item)`, `Vetrine (Item)`, `Set Design (Item)`). Verificato: 63 su 63 univoci e presenti. **Non collegare per titolo**: alcuni titoli nel foglio sono stati rinominati rispetto ai CSV (es. "Bialetti Store" / "Bialetti Store - Milano", "VANS - TNT Advanced Prototype" / "VANS").

### 8.3 Mappa foglio → Sanity
| Foglio (`Progetti`) | Sanity |
|---|---|
| Categoria `Eventi` / `Vetrine` / `Set Design` | `category` = `eventi` / `vetrine` / `set-design` |
| Titolo progetto (trim) | `title`; `slug` = slugify(titolo) |
| Settore | `sector` |
| Città | `city` |
| In evidenza = Sì | `featured = true` |
| Carousel home = Sì | `homePage.carousel` (riferimenti, ordinati per `order`) |
| Ordine | `order` |
| Cliente (solo pagina progetto) | `client` (riferimento per nome) |
| N. foto (Wix) | solo verifica (§8.5) |
| URL attuale Wix | `legacy.wixUrl` e redirect (§9.1) |
| Cartella foto | vuota di proposito (le foto si prendono da Wix) |
| Foglio `Clienti` — Cliente, Logo (file SVG), Mostra nella striscia loghi | `client.name`, file logo, `showInLogoStrip` |

Slug: minuscolo, senza accenti, "&" e simboli eliminati, spazi e trattini → un solo `-`, massimo 80 caratteri, univoco (suffisso `-2` se serve). Esempi: "Paul & Shark - Pitti - Firenze" → `paul-shark-pitti-firenze`; "Nescafé Dolce Gusto - Neo" → `nescafe-dolce-gusto-neo`.

### 8.4 Immagini
Nei CSV `Gallery` è un JSON (lista di oggetti con `slug`, `fileName`, `src`, `settings{width,height}`) e `Main Project Image` una stringa `wix:image://v1/<id>/<nome>#originWidth=...&originHeight=...`. L'identificativo del file è la parte `<id>` (es. `ccac1d_dff204fec4ff4abdb3b53d67c287e5a1~mv2.jpg`). L'originale si scarica da `https://static.wixstatic.com/media/<id>`.
- `Main Project Image` → `coverImage`; `Gallery` → `gallery`, **stesso ordine**. Se la copertina compare anche nella galleria (stesso `<id>`), omettila dalla galleria per non mostrarla due volte.
- Scarica con concorrenza bassa (4), nuovi tentativi con attesa crescente, nome file originale conservato.
- Idempotenza: `_id` deterministici (`project-<slug>`, `client-<slug>`); rilanciare lo script non crea duplicati; gli asset uguali non si ricaricano.
- **Questa fase (foto) parte solo su richiesta esplicita dell'utente** (Fase 4). Le fasi precedenti importano solo testi e dati.

### 8.5 Procedura e verifiche
1. `pnpm import:dry`: legge foglio e CSV, non scrive nulla, stampa un riepilogo (progetti, clienti, anomalie).
2. `pnpm import:run -- --dataset staging`: scrive nel dataset `staging`. Mai in `production` senza conferma.
3. Verifiche automatiche a fine importazione: 63 progetti (32 Eventi, 26 Vetrine, 5 Set Design); 45 clienti; 8 in evidenza; 5 nel carousel; `order` da 1 a 63 senza buchi né doppioni; ogni progetto ha cliente, settore e slug univoco; numero di foto per progetto = `N. foto (Wix)` (meno l'eventuale copertina duplicata); 0 asset orfani.
4. Loghi: i file SVG li fornisce l'utente in una cartella `data/logos/` con i nomi indicati nel foglio (`ferrari.svg`, `disney-plus.svg`, `estee-lauder.svg`, …). Importali quando ci sono; i clienti senza file restano senza logo (il sito mostra il testo).
5. Passaggio in produzione: solo dopo l'ok dell'utente, rilanciando lo stesso script sul dataset `production`.

## 9. Redirect, SEO, accessibilità, prestazioni

### 9.1 Redirect 301 dal vecchio sito
Genera `public/_redirects` con uno script:
- per ogni progetto: `<URL attuale Wix>  /progetti/<slug>  301` (63 righe; es. `/eventi/foxcircus /progetti/fox-circus 301`);
- pagine principali: dalle pagine di Wix alle nuove (`/` resta). **Ricava l'elenco reale da `https://www.tonypignatellistudio.com/sitemap.xml`** (Wix lo espone). Probabili: `/work` → `/progetti`, `/about` → `/studio`, `/what-we-do` → `/servizi`, la pagina contatti → `/contatti`;
- liste per categoria: `/eventi` → `/progetti?categoria=eventi`, `/vetrine` → `/progetti?categoria=vetrine`, `/set-design` → `/progetti?categoria=set-design`.
Prova ogni redirect in anteprima. Non toccare DNS né dominio senza conferma.

### 9.2 SEO
- `lang="it"`, un solo `<h1>` per pagina, titoli e descrizioni unici (modello: "<Pagina> — Tony Pignatelli Studio"), URL canonici, `sitemap.xml`, `robots.txt`.
- Home: titolo "Tony Pignatelli Studio | Scenografia, allestimenti e set design a Milano"; descrizione "Studio di scenografia e set design a Milano. Eventi, pop-up, vetrine e set per brand e agenzie in tutta Italia."
- Open Graph e Twitter card con la copertina del progetto o l'immagine di default.
- Dati strutturati: `Organization` (nome, indirizzo, email, telefono, social) in home; `CreativeWork` per i progetti è facoltativo.
- Le anteprime (`*.pages.dev`) devono essere `noindex` (intestazione `X-Robots-Tag: noindex` in `_headers` per gli host non di produzione — verifica la sintassi nella documentazione di Cloudflare).

### 9.3 Accessibilità (obiettivo WCAG 2.2 AA)
Contrasto verificato per tutte le coppie di colori; focus visibile su ogni elemento interattivo (contorno 2px `--ink`, offset 2px; su fondo scuro `--ink-inverse`); navigazione completa da tastiera; `alt` delle foto = `alt` di Sanity oppure titolo del progetto; carousel con `aria-roledescription="carousel"`, controlli etichettati e autoplay fermabile; filtri come `button` con `aria-pressed`; elenco con caricamento continuo che annuncia i nuovi elementi (`aria-live="polite"` sulla riga di stato) e senza «trappole» per tastiera; obiettivi di tocco ≥ 44px.

### 9.4 Prestazioni
Obiettivo Lighthouse mobile in anteprima: Performance ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100. Immagine hero e prime schede con `fetchpriority`/preload appropriati, le altre `loading="lazy"`; nessun salto di layout (dimensioni sempre note); JavaScript totale piccolo (solo gli script elencati in §3); font self-hosted; niente librerie di terze parti pesanti.

## 10. Modulo contatti

- Campi: **Nome**, **Email**, **Messaggio** (tutti obbligatori), più un campo trappola nascosto (honeypot) e una verifica anti-spam (consigliato Cloudflare Turnstile).
- Invio a una funzione serverless (Cloudflare Pages Function `/api/contact`) che inoltra la mail a `tony@tonypignatellistudio.com` tramite un servizio di posta transazionale. **Il servizio non è ancora scelto**: proponi due opzioni all'utente prima di implementare (es. Resend o Postmark) e attendi conferma.
- Messaggi: successo "Grazie, ti rispondiamo entro un giorno lavorativo." ed errore "Non siamo riusciti a inviare il messaggio. Riprova o scrivici a tony@tonypignatellistudio.com."; validazione in italiano, accessibile (`aria-describedby`, focus sul primo errore).
- Nota privacy sotto il pulsante: "Inviando accetti che i tuoi dati siano usati per rispondere alla richiesta." con link a `/privacy`.
- Non salvare i messaggi sul sito; non inviare dati a servizi di terze parti diversi da quelli concordati.

## 11. Regole per il mobile

Nei mockup non c'è una versione per schermi piccoli: queste regole la definiscono. Il disegno desktop è il riferimento di stile; qui cambia solo la composizione.

**Punti di rottura**: mobile ≤ 640px · tablet 641–1023px · desktop ≥ 1024px. Prova a 360, 390, 768, 1024, 1440 e 1920px.

### 11.1 Regole generali
- Margine laterale: 24px su mobile, 32px da tablet in su.
- Tipografia: i titoli sono già fluidi (`clamp`). Testo corrente 18px su mobile (19px da tablet), interlinea 1.45. I campi del modulo restano ≥ 17px (evita lo zoom automatico di iOS).
- Spaziature verticali delle sezioni: 64px (mobile) / 96px (tablet e desktop); il CTA 96px (mobile) / 128px.
- Niente comportamenti legati al passaggio del mouse: ogni funzione ha un equivalente a tocco. Obiettivi di tocco ≥ 44 × 44px.
- Nessuno scorrimento orizzontale della pagina a nessuna larghezza.
- Le fasce nere (CTA, footer) restano a tutta larghezza.

### 11.2 Header e menu
- Mobile: a sinistra "Tony Pignatelli Studio" (bold), a destra il testo **"Menu"** (non un'icona a tre linee).
- Il tocco apre un pannello a tutto schermo su fondo `--surface-100`: le quattro voci (Progetti, Studio, Servizi, Contatti) in dimensione H2, impilate; la voce della pagina attiva in bold; in alto a destra "Chiudi"; sotto, Instagram e LinkedIn. Blocca lo scorrimento della pagina mentre è aperto; Esc e il tocco su "Chiudi" lo chiudono; il focus resta dentro il pannello.
- Tablet: stesso menu orizzontale del desktop se entra in una riga, altrimenti come mobile.

### 11.3 Griglie
- **Desktop**: griglia sfalsata a 12 colonne come disegnata.
- **Tablet**: 2 colonne. Gli elementi occupano 1 o 2 colonne a rotazione (larghi/stretti), scarti verticali ridotti a 0–48px.
- **Mobile**: 1 colonna a larghezza piena, spazio verticale 32px tra le schede, **nessuno scarto verticale**. Le proporzioni verticali (3:4) si limitano a 4:5 per non allungare troppo. Il ritmo si mantiene alternando larghezza piena e 88% (allineata a destra o a sinistra a rotazione).

### 11.4 Sezioni e componenti
| Componente | Mobile |
|---|---|
| Sezione "etichetta · contenuto · link" | Impilata: etichetta → H2 → paragrafo → link (a sinistra, 24px sopra). |
| CTA | Impilato e allineato a sinistra: etichetta → domanda → link "Contatti ↗" → email → telefono (ciascuno su una riga, area di tocco ≥ 44px). |
| Footer | Una colonna: nome studio, menu, social, "Milano · Italia", poi **"Torna su ↑" centrato** su una riga propria (non in Contatti), poi copyright, Privacy, Cookie. |
| Hero carousel | Altezza `min(70svh, 620px)`, minimo 440px. Niente aree laterali con cursore: **scorrimento orizzontale con il dito** (swipe) per cambiare lavoro, puntini più grandi (area di tocco 44px, pallino 8px). Titolo H2 sopra il link "Esplora i progetti ↗" (impilati in basso a sinistra, non su due lati). L'autoplay si ferma al primo tocco e con `prefers-reduced-motion`. |
| Filtri di `/progetti` | Testo da `clamp(28px, 8.5vw, 46px)`, a capo se serve, con le barre `|` in ciano; sotto, il menu "Settore" a tutta larghezza. |
| Elenco `/progetti` | 1 colonna; titolo scheda 20px/500; il caricamento continuo resta (stessa soglia). |
| Singolo progetto | Impilato: "← Progetti", `meta`, titolo (Display), copertina (anche 4:3 se serve a restare ben visibile), "Il progetto" con testo, **poi** la scheda informazioni a tutta larghezza (Cliente, Luogo, Servizi), galleria a 1 colonna, "Precedente" e "Successivo" uno sotto l'altro (separati da un filetto). Il visore foto è a tutto schermo con swipe. |
| Servizi | I quattro servizi impilati (numero, titolo, descrizione); "Come possiamo lavorare insieme" in 1 colonna (2 su tablet) con filetti orizzontali al posto dei verticali. |
| Studio | Intro: testo poi foto; sezioni editoriali in 1 colonna (titolo sopra, testo sotto, lead sempre in evidenza); "Clienti" su 2 colonne (3 su tablet); "Il nostro metodo" in 1 colonna (2 su tablet). |
| Contatti | Informazioni sopra, modulo sotto (pannello a tutta larghezza, padding 24px). |
| Strisce di loghi | 3 colonne su mobile (2 righe × 3 per 12 loghi → 4 righe), 4 su tablet; stessa altezza ottica. |

## 12. Fasi di lavoro e criteri di accettazione

Ogni fase = uno o più branch con anteprima. **STOP** = ferma il lavoro e aspetta l'ok dell'utente.

**Fase 0 — Impostazione**
- L'utente crea (o concede accesso a) GitHub, Sanity e Cloudflare. Tu proponi i nomi di §3 e aspetti conferma.
- Repository con Astro + TypeScript, `tokens.css`, font self-hosted, layout base (header, footer), `.env.example`, `CLAUDE.md`/`HANDOFF.md` in radice, `main` protetto, anteprima Cloudflare funzionante.
- Accettazione: pagina vuota con header/footer corretti pubblicata in anteprima; `pnpm build` e `pnpm check` verdi. **STOP**.

**Fase 1 — Schema e Studio (Opus)**
- Tipi di §7, struttura dello Studio (singleton, ordinamenti, anteprime), validazioni, etichette italiane; Studio ospitato; dataset `staging`.
- Accettazione: l'utente crea a mano un progetto di prova e uno nuovo cliente in meno di 5 minuti; i campi hanno descrizioni comprensibili a chi non programma. **STOP** (lo schema non si cambia più facilmente dopo l'import).

**Fase 2 — Componenti e pagine (Sonnet)**
- Pagine e componenti di §6 con dati di prova (fixture) e poi con query Sanity. Interazioni: carousel, filtri, caricamento continuo, menu mobile.
- Accettazione per ogni pagina: corrisponde al mockup a 1440px; rispetta §11 a 390 e 768px; nessun errore in console; navigazione da tastiera; Lighthouse come §9.4. Ogni pagina in una PR separata. **STOP** a ogni PR.

**Fase 3 — Importazione dei dati (senza foto)**
- Script di §8 in `--dry`, poi su `staging`, poi verifiche di §8.5. Singleton popolati con i testi di Appendice A.
- Accettazione: riepilogo e verifiche tutte verdi; il sito in anteprima mostra i 63 progetti con segnaposto per le immagini. **STOP** prima di scrivere in `production`.

**Fase 4 — Importazione delle foto** *(solo su richiesta esplicita dell'utente)*
- Download da Wix e caricamento in Sanity (§8.4), poi controllo del numero di foto per progetto e del peso totale.
- Accettazione: tutte le foto presenti e nell'ordine giusto; nessun duplicato; punti focali verificati a campione. **STOP**.

**Fase 5 — Rifinitura e verifiche**
- Redirect (§9.1), SEO e dati strutturati, accessibilità, prestazioni, modulo contatti (dopo la scelta del servizio di posta), pagina 404, pagine Privacy e Cookie con i testi forniti.
- Accettazione: elenco di controllo completo, report Lighthouse, test su dispositivi reali o emulati (iPhone, Android, desktop). **STOP**.

**Fase 6 — Confronto e messa online**
- Confronto con l'altra versione (§14). Poi, solo con l'ok dell'utente: dominio, DNS, passaggio dal vecchio sito, controllo dei redirect, monitoraggio per alcune settimane tenendo Wix come ripiego.

### Elenco di controllo per ogni pagina (da incollare nella PR)
- [ ] Struttura e misure come il mockup (1440px)
- [ ] Nessun testo tutto in maiuscolo; nessun cliente nelle schede; nessun anno
- [ ] Mobile 390px e tablet 768px secondo §11
- [ ] Tastiera: tutto raggiungibile, focus visibile
- [ ] Immagini con dimensioni, `alt`, caricamento corretto
- [ ] Contenuti letti da Sanity (nessun testo di contenuto scritto a mano nel codice, salvo etichette di interfaccia)
- [ ] `<title>`, descrizione, canonical, un solo `<h1>`
- [ ] Lighthouse mobile entro obiettivo
- [ ] Nessun errore o avviso in console e nel build

## 13. Punti aperti

Da decidere o fornire a cura dell'utente (non indovinare):
1. **Loghi SVG** dei clienti (45 nomi nel foglio `Clienti`; i 12 della striscia sono prioritari), dai kit ufficiali dei brand.
2. **Foto**: recupero da Wix su richiesta (Fase 4).
3. **Elenco "Clienti" della pagina Studio**: loghi o testo? Proposta: logo dove esiste l'SVG, nome in testo altrimenti. L'elenco di Appendice A (55 nomi) è più ampio dei clienti dei progetti (45).
4. **Testi dei progetti** (`intro`, `description`, `services`): nei mockup sono segnaposto; li scrive o li detta l'utente, tu non inventi fatti.
5. **Foto dello Studio** (ritratto/lavoro nello studio) e immagini del carousel.
6. **Privacy e Cookie**: testi a cura dell'utente (con un consulente). L'eventuale banner dipende dagli strumenti di misura scelti: proposta di partenza, statistiche senza cookie (es. Cloudflare Web Analytics). Non è consulenza legale.
7. **Servizio di invio mail** del modulo (§10).
8. **Dominio**: registrar, dove sono i DNS, piano di passaggio.
9. **Visore foto** (§6.3) e **velo sul testo dell'hero** (§6.1): da confermare.
10. **Pagina 404**: non disegnata.
11. **Nomi da verificare**: cliente "FOX" (dal progetto "FOX Circus"); "Brian & Berry" (potrebbe essere "Brian & Barry"); "Bixio x Paul & Shark" (da chiarire quale sia il cliente principale).
12. **Testo alternativo** delle foto: per ora il titolo del progetto; se vuoi alt specifici, vanno scritti.

## 14. Confronto con l'altra versione

Le due versioni (questa e quella fatta con ChatGPT) verranno confrontate sugli stessi 63 progetti. Preparati a produrre, per questa versione:
- link di anteprima stabile di `main`;
- report Lighthouse mobile e desktop per home, `/progetti`, un progetto, `/studio`;
- peso totale della home (KB) e numero di richieste;
- tempo e passaggi per aggiungere un progetto da Sanity fino alla pubblicazione (da misurare con l'utente);
- elenco dei difetti noti;
- numero di righe di codice e dipendenze (`pnpm list --depth 0`).
Criteri qualitativi (valuta l'utente): fedeltà al design, qualità del pannello Sanity per chi non programma, stabilità (nessuna regressione tra una modifica e l'altra), chiarezza del codice.


## 15. Appendice A — Testi delle pagine

Testi esatti dei mockup, da usare come valori iniziali nei singleton Sanity. Il simbolo ↗ nei link è parte del testo mostrato.

### Globali
- Header/footer: **Tony Pignatelli Studio** · menu: Progetti, Studio, Servizi, Contatti.
- Footer: Instagram, LinkedIn, "Milano · Italia"; "© 2026 Tony Pignatelli Studio"; Privacy; Cookie; "Torna su ↑".
- Contatti studio: Via Ludovico Ariosto, 123 — 20099 Sesto San Giovanni (MI) · tony@tonypignatellistudio.com · +39 339 469 5709.
- Etichetta del CTA (uguale in tutte le pagine): **Parliamo del tuo progetto**.
- Link del CTA: **Contatti ↗**.
- Domande del CTA (una per pagina):
  - Home: *Qual è lo spazio che vuoi raccontare?*
  - Servizi: *Hai un brief da condividere con noi?*
  - Studio: *Cerchi un partner per il tuo prossimo progetto?*
  - Singolo progetto: *Hai in mente un progetto simile?*
  - (Progetti e Contatti non hanno CTA.)

### Home
- Link hero: **Esplora i progetti ↗**
- **Lo studio** — H2: *Progettiamo spazi che rendono visibile una visione.* Testo: *Tony Pignatelli Studio è uno studio indipendente di set design, scenografia e progettazione degli spazi. Lavoriamo a partire da un'idea, da un brief o da una direzione creativa per trasformarla in uno spazio concreto, coerente e riconoscibile.* Link: **Conosci lo studio ↗**
- **Progetti selezionati** — link: **Tutti i progetti ↗**
- **Servizi** — H2: *Dal concept alla realizzazione.* Testo: *Concept design, set design e scenografia per eventi, brand experience, allestimenti e progetti speciali.* Link: **Scopri i servizi ↗**
- **Brand & partner** (solo etichetta; i loghi vengono dai clienti).

### Progetti
- Etichetta/voci: Eventi · Vetrine · Set design; "Settore"; "Tutti i settori".
- Stati: "Caricamento altri progetti…", "Hai visto tutti i progetti", "Nessun progetto per questa combinazione."

### Singolo progetto
- Etichette: "← Progetti", "Il progetto", "Cliente", "Luogo", "Servizi", "Galleria", "← Precedente", "Successivo →".
- Segnaposto dei campi da compilare: `intro`, `description`, `services`.

### Studio
- **Intro** — H1: *Studio*. Paragrafo 1: *Tony Pignatelli Studio è uno studio creativo multidisciplinare. Progettiamo spazi, scenografie e ambienti per brand, retail, eventi, editoria e produzioni visive.* Paragrafo 2: *Lo studio è coordinato da Tony Pignatelli — scenografo, set designer, art director e regista — e lavora con una rete consolidata di artisti, artigiani, decoratori, costruttori e tecnici.*
- **Esperienza e network** — Lead: *Negli anni abbiamo sviluppato progetti per brand internazionali e italiani nei settori fashion, luxury, beauty, food, beverage, automotive, sport, technology e retail.* Testo: *La nostra esperienza nel retail e nella comunicazione in vetrina resta parte fondamentale del nostro DNA. Oggi quella stessa sensibilità vive negli eventi, nelle installazioni, nei pop-up, nei set e nelle esperienze di marca.*
- **Clienti** — elenco (55 nomi):
- Astoria
- Barilla
- Bauli
- Bic
- Brian & Barry
- Canali
- Citterio
- Cleosolemoda
- Corona
- Diesel
- Disney
- Dodo
- Eicma
- Emporium
- Estée Lauder
- Ferrari
- Franklin & Marshall
- Freddy
- Hamilton
- Hasbro
- Herschel
- Io Donna
- Je m'en fous
- La Perla
- Larusmiani
- Lavazza
- Le Pandorine
- Liu-Jo
- Luisa Spagnoli
- M Collective
- Malìparmi
- Missoni
- Moleskine
- MSGM
- Nero Giardini
- Nespresso
- NYX
- O Jour
- Pandora
- Paul & Shark
- Puma
- Reebok
- Richard J. Brown
- Rinascente
- Samsung
- Serapian
- Sneakerness
- Superga
- Swarovski
- Tanqueray
- Trussardi
- Vans
- Vigorsol
- Yoox
- Zeybra
- **Dal brand allo spazio** — Lead: *Partiamo dall'identità del brand, dal prodotto e dal contesto per costruire un linguaggio visivo coerente e riconoscibile.* Testo 2: *Per noi una vetrina, un pop-up, un evento o un set sono forme diverse dello stesso problema: come trasformare un messaggio in un'esperienza fisica.* Testo 3: *L'obiettivo è creare spazi capaci di attirare, sorprendere e raccontare una storia, mantenendo equilibrio tra estetica, identità ed efficacia commerciale.*
- **Il nostro metodo** — Intro: *Ogni progetto parte dall'ascolto e arriva al cantiere passando per quattro fasi.*
  1. **Ascolto** — *Analizziamo brand, pubblico, prodotto e contesto, e chiariamo obiettivi, tempi e budget.*
  2. **Concept** — *Trasformiamo gli obiettivi in un'idea: sketch, moodboard, prime ipotesi di spazio.*
  3. **Progetto** — *Render, layout, ricerca materiali e progettazione tecnica esecutiva.*
  4. **Realizzazione** — *Produzione, logistica e installazione, con la nostra rete o con i fornitori del cliente.*

### Servizi
- Etichetta: *Servizi* — H1: *Progettiamo spazi, set e scenografie attraverso un approccio diretto e contemporaneo.*
- 01 **Set design** — *Ideazione e sviluppo di ambienti, set e sistemi spaziali per eventi e produzioni.*
- 02 **Scenografia** — *Progettazione scenografica, dalla direzione creativa alla definizione degli elementi nello spazio.*
- 03 **Spatial design** — *Progettazione di spazi e percorsi, con attenzione a proporzioni, materiali, atmosfera e fruizione.*
- 04 **Art direction** — *Sviluppo del linguaggio visivo e coordinamento delle scelte che costruiscono l'identità dello spazio.*
- **Come possiamo lavorare insieme** — Intro: *Entriamo nel progetto nel momento in cui serve, con il ruolo che serve.*
  - **Creative partner** — *Sviluppiamo l'idea con te, dalla prima ricerca al concept.*
  - **Set designer** — *Progettiamo lo spazio: layout, materiali, disegni tecnici.*
  - **Art direction** — *Definiamo e manteniamo la coerenza visiva del progetto.*
  - **Partner operativo** — *Coordiniamo produzione, logistica e installazione in cantiere.*

### Contatti
- H1: *Contatti* — Intro: *Raccontaci il tuo progetto: tipo di lavoro, tempi e budget indicativo. Rispondiamo entro un giorno lavorativo.*
- Blocchi: **Studio** (indirizzo), **Scrivi o chiama** (email, telefono), **Seguici** (Instagram, LinkedIn).
- Modulo — titolo: *Parlaci del progetto*; campi: Nome, Email, Messaggio; pulsante: **Invia richiesta**; nota: *Inviando accetti che i tuoi dati siano usati per rispondere alla richiesta.* (+ link alla pagina Privacy)

---
*Fine del documento.*
