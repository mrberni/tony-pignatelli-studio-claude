# Tony Pignatelli Studio — Design System

Studio creativo multidisciplinare (scenografia, set design, retail, eventi).
Pubblico: brand, agenzie creative, event agency, PR agency, production
company, soprattutto in Italia. Chi arriva sul sito deve capire in pochi
secondi *cosa* fa lo studio e *per chi*, e trovare in fretta il portfolio
fotografico: è lui a vendere il lavoro, non il testo.

Scala tipografica, spaziature e gerarchia dei testi riprendono il Design
System v1 del progetto parallelo (Astro + Sanity). La palette resta quella
fredda/neutra di questo design system, con il ciano come unico colore di
richiamo.

## Principi

1. **Le foto comandano.** Testo ridotto all'essenziale, immagini grandi,
   poche decorazioni.
2. **Gerarchia tipografica, non decorativa.** Il contrasto si ottiene con
   dimensione, peso, spazio e posizione.
3. **Nessun testo tutto in maiuscolo.** Ovunque (menu, pulsanti, metadati,
   titoli) si scrive in maiuscolo/minuscolo normale: solo la prima lettera
   maiuscola, oltre ai nomi propri.
4. **Un solo colore di richiamo.** `accent` solo su pulsanti primari e
   stati attivi.
5. **Taglio netto.** `radius-none` ovunque, anche sui filtri.
6. **Il cliente non compare nelle schede.** Griglie, carousel e anteprime
   mostrano solo il titolo del progetto (identico al titolo originale di
   Wix) e la riga categoria · settore. Il nome del cliente si vede solo
   nella pagina del singolo progetto.

## Colore

- `surface-100` fondo di pagina: bianco neutro e freddo (non crema, non caldo).
- `surface-200` fasce alternate e segnaposto foto.
- `ink` testo principale; `ink-soft` metadati e didascalie; `line` divisori.
- `accent` (ciano) solo su pulsante primario e filtro attivo. Il testo sopra
  `accent` è `accent-ink` (scuro): il ciano è troppo chiaro per il bianco.
- `surface-inverse` / `ink-inverse` per i blocchi a massimo contrasto: **CTA di
  fine pagina e footer sono neri con testi bianchi**. Su fondo scuro il testo
  secondario è `ink-soft-inverse` e le linee `line-inverse`.

## Tipografia

Una sola famiglia: **Hanken Grotesk** (Google Fonts, pesi 400, 500, 700),
con ripiego `"Helvetica Neue", Helvetica, Arial, sans-serif`.
Suisse Int'l è escluso.

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;500;700&display=swap" rel="stylesheet">
```

Pesi: **400 Regular** per titoli e testo, **500 Medium** per titoli di
progetto in elenco, metadati e pulsanti. Eccezioni in bold: il nome dello
studio nel menu e la voce di menu della pagina attiva.

| Stile | Dimensione (desktop) | Interlinea | Peso | Uso |
|---|---|---|---|---|
| display | `clamp(41px, calc(5.5vw + 1px), 81px)` | 1.0 | 400 | titolo di pagina, pochissimi |
| h2 | `clamp(31px, calc(3.2vw + 1px), 49px)` | 1.05 | 400 | titoli di sezione, domanda del CTA |
| h3 | `clamp(23px, calc(2vw + 1px), 33px)` | 1.1 | 400 | titoli minori |
| filter | 46px | 1.1 | 400 | filtri della pagina Progetti |
| body | 19px | 1.45 | 400 | testo corrente |
| small | 15px | 1.3 | 500 | menu, link, etichette di sezione |
| meta | 14px | 1.3 | 500 | categoria · settore, note |

## Spaziatura e griglia

Scala: **8 · 12 · 16 · 24 · 32 · 48 · 64 · 96 · 128**.
Margine laterale della pagina 32px, griglia fluida a 12 colonne. Le griglie
di progetti hanno **al massimo tre elementi per riga**, con larghezze
diverse, colonne di partenza diverse tra una riga e l'altra e scarti verticali
tra gli elementi della stessa riga (layout sfalsato, non una griglia uniforme).
Sezioni importanti: 96 o 128px. Header: padding 28px 32px, essenziale (nome dello studio e quattro voci, nessun pulsante).

## Componenti chiave

- **Card progetto**: foto, sotto il titolo del progetto (`body-medium`) e
  la riga `meta` (categoria · settore). Nessun cliente, cornice o overlay.
- **Filtri**: solo testo da 46px (`filter`), senza numeri né aspetto da
  tasto, separati da una barra verticale `|` in bold color `accent`. Nessun
  filtro "Tutti": a riposo l'elenco è completo e le voci sono tutte a piena
  opacità; scegliendone una le altre si attenuano, e cliccando di nuovo la
  voce attiva si torna all'elenco completo.
- **Link di sezione**: testo in `ink` con freccia ↗, sottolineato. Nelle
  sezioni a tre colonne (etichetta · contenuto · link) il link sta a destra,
  allineato al bordo destro di "Tutti i progetti" e in alto rispetto al
  contenuto della sezione.
- **CTA di fine pagina** (fondo nero, testi bianchi): etichetta a sinistra, domanda (`h2`) allineata
  alla colonna centrale delle altre sezioni, link "Contatti ↗" a destra e
  sotto email e telefono dello studio. Una domanda diversa per ogni pagina.
- **Pulsante pieno** (`accent`): solo per l'invio del form.
- **Footer** (fondo nero, testi bianchi): nome dello studio, menu, social; sotto,
  su tre colonne, copyright a sinistra, "Torna su ↑" al centro (in tutte le
  pagine tranne Contatti), Privacy e Cookie a destra. La voce di menu è
  "Studio" (non "Lo studio").
- **Sezioni di testo**: fondo chiaro, separate da linee sottili (`line`).
  Impaginazione editoriale a 12 colonne: titolo a sinistra (colonne 1-5),
  testo a destra (6-12) con un primo paragrafo in grande (`h3`) e gli altri
  in `body` (es. "Esperienza e network", "Dal brand allo spazio"). Il fondo
  `surface-200` resta solo per segnaposto foto e pannello del form.
- **Carousel hero**: avanza da solo; niente frecce sovrapposte. Passando il
  mouse sul terzo sinistro o destro il cursore diventa una freccia e il
  click cambia lavoro; i puntini restano come indicatore.
- **Elenco a caricamento continuo** (pagina Progetti): niente pulsante
  "Carica altri": i progetti successivi si caricano quando il visitatore
  arriva in fondo alla pagina.

## Pagina del singolo progetto

L'unica pagina in cui compare il nome del cliente. Struttura, dall'alto:

1. **Titolo**: link "← Progetti" a sinistra; a destra categoria · settore
   (`meta`) e titolo del progetto in `display` (identico al titolo Wix).
2. **Cover**: una sola grande immagine 16:9, senza overlay né testo sopra.
3. **Il progetto**: etichetta a sinistra; frase di apertura in `h3` e testo in
   `body` (colonne 4-9); a destra la scheda informazioni (colonne 10-12) con
   Cliente, Luogo e Servizi, separati da linee sottili. Niente anno.
4. **Galleria**: stessa logica sfalsata della pagina Progetti (1, 2 o 3 foto
   per riga, larghezze e scarti verticali diversi), con tutte le foto del
   progetto.
5. **Precedente / Successivo**: due blocchi con titolo e categoria · settore.
   L'ordine è quello di recenza: "Precedente" porta al lavoro più recente.
6. **CTA nero** con una domanda propria della pagina, poi footer.

Il menu mantiene attiva la voce "Progetti".

## Ordine dei progetti

Elenco Progetti, "Progetti selezionati" e navigazione precedente/successivo
seguono la recenza: il lavoro più recente è il primo. Il campo `ordine`
(1 = più recente) arriva dal foglio ed è modificabile da Sanity.

## Cosa NON fare

- Testi tutti in maiuscolo.
- Il nome del cliente in griglie, carousel o anteprime.
- Angoli arrotondati, ombre diffuse, gradienti.
- Più di una famiglia di font o più di due pesi (più il bold del menu).
- `accent` come sfondo di sezioni intere.
