# Fase 5 — Relazione di verifica

Misure ripetute il 12 ottobre 2026 sul sito pubblicato (`https://tps-claude.bernardoalmeida3.workers.dev`, contenuti di `production`: 63 progetti con foto), con Lighthouse in Chrome headless da un PC (mobile = profilo predefinito, desktop = `--preset=desktop`). Le prime misure, fatte su una build locale con i contenuti di `staging`, davano risultati simili.

| Pagina | Dispositivo | Prestazioni | Accessibilità | Best Practices | SEO* | LCP (ms) | CLS | Peso (KB) | Richieste |
|---|---|---|---|---|---|---|---|---|---|
| Home | mobile | 98 | 100 | 100 | 69 | 2158 | 0 | 477 | 18 |
| Home | desktop | 99 | 100 | 100 | 69 | 967 | 0 | 809 | 22 |
| Progetti | mobile | **94** | 100 | 100 | 69 | 2833 | 0 | 582 | 21 |
| Progetti | desktop | 100 | 100 | 100 | 69 | 729 | 0 | 290 | 22 |
| Singolo progetto (Lego Stadium) | mobile | 98 | 100 | 100 | 69 | 2323 | 0 | 330 | 12 |
| Singolo progetto | desktop | 99 | 100 | 100 | 69 | 971 | 0 | 516 | 12 |
| Studio | mobile | 98 | 100 | 100 | 69 | 2235 | 0 | 59 | 7 |
| Studio | desktop | 100 | 100 | 100 | 69 | 539 | 0 | 59 | 7 |
| Contatti | mobile | 99 | 100 | 100 | 66 | 2171 | 0 | 766 | 16 |
| Contatti | desktop | 100 | 100 | 100 | 66 | 686 | 0.002 | 185 | 11 |

* **SEO**: l'unica prova fallita è «Pagina bloccata dall'indicizzazione» (`is-crawlable`), voluta: tutti gli indirizzi `*.workers.dev` hanno l'intestazione `X-Robots-Tag: noindex` (vedi CLAUDE.md, «SEO e indicizzazione»). Sul dominio vero la regola non si applica e il punteggio va rifatto: nelle misure su build locale, senza l'intestazione, era 100.

Obiettivi di HANDOFF §9.4 (mobile: Prestazioni ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100): rispettati, con due eccezioni: **Progetti mobile è a 94** (LCP 2,8 s, da migliorare caricando subito solo le prime foto) e il SEO, spiegato sopra. Blocco del thread (TBT) 0 ms ovunque. Il peso della home su mobile è 477 KB.

## Controlli automatici sul sito generato (71 pagine)

Un solo `<h1>`, `lang="it"`, `<title>`, descrizione e canonical presenti; ogni immagine ha `alt`, larghezza e altezza; nessun pulsante o link senza nome accessibile; nessun testo tutto maiuscolo. Gli unici `border-radius` nel codice sono i puntini del carousel (eccezione prevista da HANDOFF §4.1).

## Dimensioni del progetto (HANDOFF §14)

- Righe di codice del sito, degli script e dello schema Sanity: circa 6.000.
- Dipendenze dirette del sito: 3 (`astro`, `@sanity/client`, `@fontsource/hanken-grotesk`) + 3 di sviluppo (`@astrojs/check`, `@types/node`, `typescript`).
- JavaScript lato visitatore: solo gli script elencati in HANDOFF §3 (carousel, filtri/caricamento continuo, visore foto, menu).

## Cosa NON è stato verificato

- Prova manuale con la tastiera e con un lettore di schermo: l'accessibilità è stata controllata con Lighthouse e con le verifiche statiche sopra, non da una persona. Da fare, in particolare per carousel, filtri e visore foto.
- Test su dispositivi reali (iPhone, Android): finora solo emulazione.
- Tempo per aggiungere un progetto da Sanity (§14): da misurare con l'utente.
- Misure con il dominio vero e senza `noindex` (SEO), e da rete mobile reale: da rifare al passaggio di dominio.

## Difetti noti e lavoro rimasto

1. **Foto**: 103 foto sotto gli 800 px di larghezza (limite di Wix); la foto dello Studio è 600×397 px e va sostituita.
2. **Testi dei progetti** (`intro`, `description`, `services`): ancora da scrivere.
3. **Modulo contatti**: funziona (Worker, Turnstile, Resend) solo sull'indirizzo di produzione; consegna soltanto a `bernardo@tonypignatellistudio.com` finché il dominio non è verificato in Resend (poi `CONTACT_FROM` e `CONTACT_TO=tony@…`, e il dominio vero nel widget Turnstile). Le anteprime dei branch non vedono i segreti e non inviano.
4. **Privacy e Cookie**: bozze complete con i dati del titolare, da far rivedere a un consulente; resta tra parentesi una verifica (se Turnstile salva dati nel browser) e quella sui contratti dei fornitori extra UE. Le pagine sono ancora `noindex`.
5. **Redirect da Wix**: 7 destinazioni ambigue restano ai valori predefiniti proposti.
6. **Nomi da verificare**: "FOX", "Brian & Berry" (forse "Barry"), "Bixio x Paul & Shark".
7. **Progetti → mobile**: Prestazioni 94 (obiettivo 95); si migliora caricando subito solo le prime foto invece di nove.
8. **Dominio e DNS**: da affrontare in Fase 6.
