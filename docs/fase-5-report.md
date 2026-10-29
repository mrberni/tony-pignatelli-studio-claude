# Fase 5 — Relazione di verifica

Misure del 29 ottobre 2026 sul sito pubblicato (`https://tps-claude.bernardoalmeida3.workers.dev`, contenuti di `production`: 67 progetti con foto), dopo la ristrutturazione della home (sezione Progetti con filtri e tutti i progetti, menu fisso, brand scorrevoli, domanda finale centrata) e le animazioni, con Lighthouse in Chrome headless da un PC (mobile = profilo predefinito, con DPR 1,75 e CPU rallentata; desktop = `--preset=desktop`). Su mobile tre misure per pagina: in tabella la mediana, tra parentesi le tre. La pagina `/progetti` non esiste più (la sezione Progetti è nella home, quindi inclusa nella misura della Home).

| Pagina | Dispositivo | Prestazioni | Accessibilità | Best Practices | SEO* | LCP (ms) | CLS | Peso (KB) | Richieste |
|---|---|---|---|---|---|---|---|---|---|
| Home (con la sezione Progetti) | mobile | 96 (95/96/97) | 100 | 100 | 69 | 2701 | 0 | 462 | 21 |
| Home (con la sezione Progetti) | desktop | 99 | 100 | 100 | 69 | 931 | 0 | 1334 | 33 |
| Singolo progetto (Lego Stadium) | mobile | 98 (97/98/98) | 100 | 100 | 69 | 2379 | 0 | 250 | 14 |
| Singolo progetto (Lego Stadium) | desktop | 99 | 100 | 100 | 69 | 884 | 0 | 223 | 14 |
| Studio | mobile | 100 (100/100/100) | 100 | 100 | 69 | 1881 | 0 | 60 | 7 |
| Studio | desktop | 100 | 100 | 100 | 69 | 650 | 0 | 60 | 7 |
| Servizi | mobile | 100 (100/100/100) | 100 | 100 | 66 | 873 | 0 | 49 | 6 |
| Servizi | desktop | 100 | 100 | 100 | 66 | 270 | 0 | 50 | 6 |
| Contatti | mobile | 100 (100/100/100) | 100 | 100 | 66 | 905 | 0 | 51 | 6 |
| Contatti | desktop | 100 | 100 | 100 | 66 | 563 | 0.002 | 278 | 10 |

* **SEO**: l'unica prova fallita è «Pagina bloccata dall'indicizzazione» (`is-crawlable`), voluta: tutti gli indirizzi `*.workers.dev` hanno l'intestazione `X-Robots-Tag: noindex` (vedi CLAUDE.md, «SEO e indicizzazione»). Sul dominio vero la regola non si applica e il punteggio va rifatto: nelle misure su build locale, senza l'intestazione, era 100.

Obiettivi di HANDOFF §9.4 (mobile: Prestazioni ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100): **rispettati su tutte le pagine misurate** (il SEO, spiegato sopra, solo per il `noindex` voluto su `workers.dev`). Home mobile: 95/96/97, la più bassa ma dentro l'obiettivo, con tutti i 67 progetti nell'HTML (le foto si caricano solo quando si avvicinano). Accessibilità e Best Practices a 100 ovunque, CLS 0 (0,002 in Contatti desktop), blocco del thread (TBT) tra 0 e 12 ms. Peso della Home: circa 460 KB su mobile e 1,3 MB su desktop (più foto in vista).

Cronologia delle correzioni di prestazioni di questa fase:
- Progetti mobile: il caricamento immediato delle prime 9 foto (94) è stato ridotto alle prime 3. La correzione della nitidezza delle foto ritagliate (PR 29) aveva poi fatto salire il peso (Progetti 89–92, Home 94); su telefono le schede ora non si ritagliano più (PR 32) e Progetti mobile torna a 97–99.
- Contatti mobile: tra 92 e 99 in sei misure (rumore di rete, ma con un costo reale: lo script anti-spam di Cloudflare, circa 135 KB, partiva subito). Ora si carica solo quando il modulo entra in vista o lo si tocca (PR 34): peso iniziale da 183 a 51 KB, Prestazioni 100/100/100.
- Home: la ristrutturazione (tutti i progetti nella home, brand scorrevoli) non ha peggiorato i numeri: mobile 95–97 con 67 progetti nella pagina.

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

1. **Foto a bassa risoluzione** (controllo del 22 ottobre su `production`): su 636 foto di galleria, 44 sono sotto i 1000 px sul lato lungo (da sostituire) e 152 tra 1000 e 1599 px; 28 copertine su 66 sono sotto i 2000 px (le copertine occupano tutta la larghezza); la foto dello Studio è 600×397 px. I progetti più colpiti: EICMA - 2018, Rinascente - Food, IO Donna, Paul & Shark - Cortina, Disney - Frozen, Missoni, EICMA - Rinascente. Da ripetere dopo la sostituzione delle foto.
2. **Testi dei progetti** (`intro`, `description`, `services`): ancora da scrivere.
3. **Modulo contatti**: funziona (Worker, Turnstile, Resend) solo sull'indirizzo di produzione; consegna soltanto a `bernardo@tonypignatellistudio.com` finché il dominio non è verificato in Resend (poi `CONTACT_FROM` e `CONTACT_TO=tony@…`, e il dominio vero nel widget Turnstile). Le anteprime dei branch non vedono i segreti e non inviano.
4. **Privacy e Cookie**: bozze complete con i dati del titolare, da far rivedere a un consulente; resta tra parentesi una verifica (se Turnstile salva dati nel browser) e quella sui contratti dei fornitori extra UE. Le pagine sono ancora `noindex`.
5. **Redirect da Wix**: 7 destinazioni ambigue restano ai valori predefiniti proposti.
6. **Nomi da verificare**: "FOX", "Brian & Berry" (forse "Barry"), "Bixio x Paul & Shark".
7. **Dominio e DNS**: da affrontare in Fase 6.
