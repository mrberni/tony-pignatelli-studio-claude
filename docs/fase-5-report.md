# Fase 5 — Relazione di verifica

Misure fatte su `main` (dopo le PR 12 e 14) con i contenuti di `staging`, build locale servita con `astro preview`, Lighthouse in Chrome headless (mobile = profilo predefinito, desktop = `--preset=desktop`). In locale non c'è la rete reale di Cloudflare: i tempi di LCP in produzione possono variare.

## Lighthouse

| Pagina | Dispositivo | Prestazioni | Accessibilità | Best Practices | SEO | LCP (ms) | CLS | Peso (KB) | Richieste |
|---|---|---|---|---|---|---|---|---|---|
| Home | mobile | 99 | 100 | 100 | 100 | 2006 | 0 | 471 | 19 |
| Home | desktop | 100 | 100 | 100 | 100 | 749 | 0 | 920 | 22 |
| Progetti | mobile | 97 | 100 | 100 | 100 | 2575 | 0 | 374 | 16 |
| Progetti | desktop | 100 | 100 | 100 | 100 | 598 | 0 | 374 | 16 |
| Singolo progetto (Lego Stadium) | mobile | 99 | 100 | 100 | 100 | 2206 | 0 | 323 | 12 |
| Singolo progetto | desktop | 100 | 100 | 100 | 100 | 764 | 0 | 514 | 12 |
| Studio | mobile | 100 | 100 | 100 | 100 | 1780 | 0 | 58 | 7 |
| Studio | desktop | 100 | 100 | 100 | 100 | 382 | 0 | 58 | 7 |

Obiettivi di HANDOFF §9.4 (mobile: Prestazioni ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100): **rispettati** su tutte le pagine misurate. Blocco del thread (TBT) 0 ms ovunque.

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
- Report con la rete reale di Cloudflare: da rifare sull'anteprima stabile di `main` quando `production` avrà i contenuti.

## Difetti noti e lavoro rimasto

1. **Foto**: 103 foto sotto gli 800 px di larghezza (limite di Wix); la foto dello Studio è 600×397 px e va sostituita.
2. **Testi dei progetti** (`intro`, `description`, `services`): ancora da scrivere.
3. **Modulo contatti**: la pagina c'è ma non invia mail finché non si sceglie il servizio di posta (+ `/api/contact` e Turnstile).
4. **Privacy e Cookie**: pagine con testi segnaposto, da sostituire con i testi legali.
5. **Redirect da Wix**: 7 destinazioni ambigue restano ai valori predefiniti proposti.
6. **Nomi da verificare**: "FOX", "Brian & Berry" (forse "Barry"), "Bixio x Paul & Shark".
7. **`production` è vuoto**: `main` mostra i dati di prova finché non si importa il contenuto (`--dataset production --confirm-production`) e si imposta `SANITY_DATASET=production` su Cloudflare.
8. **Dominio e DNS**: da affrontare in Fase 6.
