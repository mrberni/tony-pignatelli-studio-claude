# Fase 5 — Relazione di verifica

Misure del 6 novembre 2026 sul **dominio vero**, `https://www.tonypignatellistudio.com` (Cloudflare, contenuti di `production`: 76 progetti), con Lighthouse in Chrome headless da un PC (mobile = profilo predefinito, con DPR 1,75 e CPU rallentata; desktop = `--preset=desktop`). Su mobile tre misure per pagina: in tabella la mediana, tra parentesi le tre. La sezione Progetti è nella Home, quindi inclusa nella sua misura.

| Pagina | Dispositivo | Prestazioni | Accessibilità | Best Practices | SEO | LCP (ms) | CLS | Peso (KB) | Richieste |
|---|---|---|---|---|---|---|---|---|---|
| Home (con la sezione Progetti) | mobile | 96 (96/96/96) | 100 | 100 | 100 | 2164 | 0 | 473 | 21 |
| Home (con la sezione Progetti) | desktop | 100 | 100 | 100 | 100 | 804 | 0 | 1450 | 34 |
| Singolo progetto (Lego Stadium) | mobile | 98 (99/98/98) | 100 | 100 | 100 | 2338 | 0 | 250 | 14 |
| Singolo progetto (Lego Stadium) | desktop | 100 | 100 | 100 | 100 | 734 | 0 | 224 | 14 |
| Studio | mobile | 100 (100/100/100) | 100 | 100 | 100 | 1736 | 0 | 60 | 7 |
| Studio | desktop | 100 | 100 | 100 | 100 | 468 | 0 | 60 | 7 |
| Servizi | mobile | 100 (100/100/100) | 100 | 100 | 100 | 859 | 0 | 50 | 6 |
| Servizi | desktop | 100 | 100 | 100 | 100 | 247 | 0 | 50 | 6 |
| Contatti | mobile | 100 (100/100/100) | 100 | 100 | 100 | 947 | 0 | 51 | 6 |
| Contatti | desktop | 100 | 100 | 100 | 100 | 445 | 0.002 | 292 | 10 |

Obiettivi di HANDOFF §9.4 (mobile: Prestazioni ≥ 95, Accessibilità 100, Best Practices ≥ 95, SEO 100): **rispettati su tutte le pagine misurate, SEO compreso**. Il SEO, che sugli indirizzi `workers.dev` era 66–69 per il `noindex` voluto, sul dominio vero è **100** (nessuna intestazione `noindex`). Accessibilità e Best Practices a 100 ovunque, CLS 0 (0,002 in Contatti desktop). Peso della Home su mobile: circa 470 KB. La Home mobile ha un tempo di blocco del thread di circa 117 ms (era vicino a 0): effetto dello script di comparsa delle schede e del carousel con più contenuti, senza conseguenze sul punteggio (96).

Cronologia delle correzioni di prestazioni di questa fase:
- Progetti mobile: il caricamento immediato delle prime 9 foto (94) è stato ridotto alle prime 3. La correzione della nitidezza delle foto ritagliate (PR 29) aveva poi fatto salire il peso (Progetti 89–92, Home 94); su telefono le schede ora non si ritagliano più (PR 32) e Progetti mobile torna a 97–99.
- Contatti mobile: tra 92 e 99 in sei misure (rumore di rete, ma con un costo reale: lo script anti-spam di Cloudflare, circa 135 KB, partiva subito). Ora si carica solo quando il modulo entra in vista o lo si tocca (PR 34): peso iniziale da 183 a 51 KB, Prestazioni 100/100/100.
- Home: la ristrutturazione (tutti i progetti nella home, brand scorrevoli) non ha peggiorato i numeri: mobile 95–97 con 67 progetti nella pagina.
- Dominio: il sito è passato dal dominio provvisorio `workers.dev` a `www.tonypignatellistudio.com` (nameserver di Cloudflare, registrazione ancora su Wix) e il SEO è salito a 100.

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
- Misure da rete mobile reale (finora profilo simulato di Lighthouse).

## Difetti noti e lavoro rimasto

1. **Foto a bassa risoluzione** (controllo del 22 ottobre su `production`): su 636 foto di galleria, 44 sono sotto i 1000 px sul lato lungo (da sostituire) e 152 tra 1000 e 1599 px; 28 copertine su 66 sono sotto i 2000 px (le copertine occupano tutta la larghezza); la foto dello Studio è 600×397 px. I progetti più colpiti: EICMA - 2018, Rinascente - Food, IO Donna, Paul & Shark - Cortina, Disney - Frozen, Missoni, EICMA - Rinascente. Da ripetere dopo la sostituzione delle foto.
2. **Testi dei progetti** (`intro`, `description`, `services`): ancora da scrivere.
3. **Modulo contatti**: funziona sul dominio vero (Worker, Turnstile, Resend con dominio verificato e regione Irlanda, destinatario `tony@tonypignatellistudio.com`); prova di invio completa riuscita. Le anteprime dei branch non vedono i segreti e non inviano.
4. **Privacy e Cookie**: testi aggiornati a ciò che il sito fa (Turnstile, Resend, Google Workspace, nessun messaggio salvato); da far rivedere a un consulente. Restano tra parentesi due verifiche (altre forme di memoria del browser di Turnstile; contratti dei fornitori fuori dall'UE). Le pagine sono ancora `noindex`.
5. **Redirect da Wix**: 7 destinazioni ambigue restano ai valori predefiniti proposti.
6. **Nomi da verificare**: risolti ("Brian & Barry"; "Bixio x Paul & Shark" ha come cliente Paul & Shark; FOX confermato).
7. **Dominio e DNS**: fatto (www su Cloudflare, registrazione su Wix). Restano: il reindirizzamento di `it.tonypignatellistudio.com` (la regola copre solo il dominio senza `www`), il record SPF per Google Workspace (facoltativo), e il piano per spegnere il vecchio sito Wix (HANDOFF §12: tenerlo come ripiego per alcune settimane).
