# Fase 5 — Relazione di verifica

Misure del 14 ottobre 2026 sul sito pubblicato (`https://tps-claude.bernardoalmeida3.workers.dev`, contenuti di `production`: 63 progetti con foto), dopo tutte le modifiche di layout, animazioni e nitidezza delle foto (PR fino alla 32), con Lighthouse in Chrome headless da un PC (mobile = profilo predefinito, con DPR 1,75 e CPU rallentata; desktop = `--preset=desktop`). Per Home e Progetti su mobile, tre misure: il valore in tabella è quello mediano, tra parentesi le tre.

| Pagina | Dispositivo | Prestazioni | Accessibilità | Best Practices | SEO* | LCP (ms) | CLS | Peso (KB) | Richieste |
|---|---|---|---|---|---|---|---|---|---|
| Home | mobile | 95 (95/95/95) | 100 | 100 | 69 | 2790 | 0 | 518 | 22 |
| Home | desktop | 99 | 100 | 100 | 69 | 844 | 0 | 1070 | 24 |
| Progetti | mobile | 98 (98/97/99) | 100 | 100 | 69 | 2316 | 0 | 504 | 21 |
| Progetti | desktop | 100 | 100 | 100 | 69 | 737 | 0 | 965 | 33 |
| Singolo progetto (Lego Stadium) | mobile | 97 | 100 | 100 | 69 | 2618 | 0 | 249 | 14 |
| Singolo progetto (Lego Stadium) | desktop | 100 | 100 | 100 | 69 | 753 | 0 | 223 | 14 |
| Studio | mobile | 99 | 100 | 100 | 69 | 1839 | 0 | 60 | 7 |
| Studio | desktop | 100 | 100 | 100 | 69 | 554 | 0 | 60 | 7 |
| Contatti | mobile | 100 (100/100/100) | 100 | 100 | 66 | 1597 | 0 | 51 | 6 |
| Contatti | desktop | 100 | 100 | 100 | 66 | 648 | 0.002 | 185 | 10 |

* **SEO**: l'unica prova fallita è «Pagina bloccata dall'indicizzazione» (`is-crawlable`), voluta: tutti gli indirizzi `*.workers.dev` hanno l'intestazione `X-Robots-Tag: noindex` (vedi CLAUDE.md, «SEO e indicizzazione»). Sul dominio vero la regola non si applica e il punteggio va rifatto: nelle misure su build locale, senza l'intestazione, era 100.

Obiettivi di HANDOFF §9.4 (mobile: Prestazioni ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100): **rispettati su tutte le pagine misurate** (il SEO, spiegato sopra, solo per il `noindex` voluto su `workers.dev`). Accessibilità e Best Practices a 100 ovunque, CLS 0 (0,002 in Contatti desktop), blocco del thread (TBT) 0 ms. Peso della home su mobile: circa 520 KB. Home mobile è a 95: al limite dell'obiettivo (tre misure, tutte 95).

Cronologia delle correzioni di prestazioni di questa fase:
- Progetti mobile: il caricamento immediato delle prime 9 foto (94) è stato ridotto alle prime 3. La correzione della nitidezza delle foto ritagliate (PR 29) aveva poi fatto salire il peso (Progetti 89–92, Home 94); su telefono le schede ora non si ritagliano più (PR 32) e Progetti mobile torna a 97–99.
- Contatti mobile: tra 92 e 99 in sei misure (rumore di rete, ma con un costo reale: lo script anti-spam di Cloudflare, circa 135 KB, partiva subito). Ora si carica solo quando il modulo entra in vista o lo si tocca (PR 34): peso iniziale da 183 a 51 KB, Prestazioni 100/100/100.

## Controlli automatici sul sito generato (71 pagine)

Un solo `<h1>`, `lang="it"`, `<title>`, descrizione e canonical presenti; ogni immagine ha `alt`, larghezza e altezza; nessun pulsante o link senza nome accessibile; nessun testo tutto maiuscolo. Gli unici `border-radius` nel codice sono i puntini del carousel (eccezione prevista da HANDOFF §4.1).

## Dimensioni del progetto (HANDOFF §14)

- Righe di codice del sito, degli script e dello schema Sanity: circa 6.000.
- Dipendenze dirette del sito: 3 (`astro`, `@sanity/client`, `@fontsource/hanken-grotesk`) + 3 di sviluppo (`@astrojs/check`, `@types/node`, `typescript`).
- JavaScript lato visitatore: solo gli script elencati in HANDOFF §3 (carousel, filtri/caricamento continuo, visore foto, menu).

## Prova da tastiera (sito pubblicato)

Fatta nel browser integrato con tasti reali (Tab, Invio, frecce, Esc): salto al contenuto come primo elemento; ordine di tabulazione logico e senza trappole in Home, Progetti, singolo progetto e Contatti; focus visibile (contorno 2 px, chiaro sui fondi scuri); puntini del carousel azionabili con Invio e annuncio automatico spento mentre scorre da solo; filtri di Progetti con `aria-pressed` corretto e caricamento continuo senza blocchi; visore foto come finestra modale (frecce, Esc, focus bloccato dentro e ritorno al pulsante); validazione del modulo con focus sul primo campo e errori collegati ai campi; menu su telefono come finestra modale, pulsanti da almeno 44 px. Difetto trovato e corretto: dopo Esc il pulsante «Menu» restava `aria-expanded="true"`.

Note: con il layout a colonne la tabulazione scorre per colonne (dall'alto in basso), non per righe; il carousel non ha un pulsante di pausa (scelta dell'utente), ma si ferma da solo con il focus da tastiera, al primo tocco e con «riduci animazioni».

## Cosa NON è stato verificato

- Prova con un lettore di schermo (VoiceOver, NVDA, TalkBack): non fatta.
- Casella Turnstile con la tastiera e invio completo con token valido dopo il caricamento rinviato dello script (PR 34): è una verifica anti-bot, non completabile in automatico; il rinvio, il messaggio «Completa la verifica…» e l'assenza di richieste prematuri sono invece verificati.
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
7. **Dominio e DNS**: da affrontare in Fase 6.
