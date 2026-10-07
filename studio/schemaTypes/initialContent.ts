/**
 * Valori iniziali dei singleton: testi esatti di HANDOFF, Appendice A.
 * Servono solo a precompilare un documento nuovo; dopo si modificano dallo Studio.
 */

export const siteSettingsInitial = {
  studioName: 'Tony Pignatelli Studio',
  email: 'tony@tonypignatellistudio.com',
  phone: '+39 339 469 5709',
  address: 'Via Ludovico Ariosto, 123 — 20099 Sesto San Giovanni (MI)',
  instagramUrl: 'https://instagram.com/tonypignatellistudio/',
  linkedinUrl: 'https://www.linkedin.com/in/tony-pignatelli-studio-27238436/',
  defaultSeo: {
    title: 'Tony Pignatelli Studio | Scenografia, allestimenti e set design a Milano',
    description:
      'Studio di scenografia e set design a Milano. Eventi, pop-up, vetrine e set per brand e agenzie in tutta Italia.',
  },
  projectCtaQuestion: 'Hai in mente un progetto simile?',
  privacyUrl: '/privacy',
  cookieUrl: '/cookie',
  contactFormRecipient: 'tony@tonypignatellistudio.com',
};

export const homePageInitial = {
  studioSection: {
    title: 'Progettiamo spazi che rendono visibile una visione.',
    text: "Tony Pignatelli Studio è uno studio indipendente di set design, scenografia e progettazione degli spazi. Lavoriamo a partire da un'idea, da un brief o da una direzione creativa per trasformarla in uno spazio concreto, coerente e riconoscibile.",
  },
  servicesSection: {
    title: 'Dal concept alla realizzazione.',
    text: 'Concept design, set design e scenografia per eventi, brand experience, allestimenti e progetti speciali.',
  },
  ctaQuestion: 'Qual è lo spazio che vuoi raccontare?',
};

export const studioPageInitial = {
  intro: {
    text1:
      'Tony Pignatelli Studio è uno studio creativo multidisciplinare. Progettiamo spazi, scenografie e ambienti per brand, retail, eventi, editoria e produzioni visive.',
    text2:
      'Lo studio è coordinato da Tony Pignatelli — scenografo, set designer, art director e regista — e lavora con una rete consolidata di artisti, artigiani, decoratori, costruttori e tecnici.',
  },
  experience: {
    lead: 'Negli anni abbiamo sviluppato progetti per brand internazionali e italiani nei settori fashion, luxury, beauty, food, beverage, automotive, sport, technology e retail.',
    text: 'La nostra esperienza nel retail e nella comunicazione in vetrina resta parte fondamentale del nostro DNA. Oggi quella stessa sensibilità vive negli eventi, nelle installazioni, nei pop-up, nei set e nelle esperienze di marca.',
  },
  clientNames: [
    'Astoria', 'Barilla', 'Bauli', 'Bic', 'BMW', 'Brian & Barry',
    'Canali', 'Citterio', 'Cleosolemoda', 'Corona', 'Diesel', 'Disney',
    'Dodo', 'Eicma', 'Emporium', 'Estée Lauder', 'Ferrari', 'Franklin & Marshall',
    'Freddy', 'Google', 'Hamilton', 'Hasbro', 'Herschel', 'Io Donna',
    "Je m'en fous", 'La Perla', 'Lamborghini', 'Larusmiani', 'Lavazza', 'Le Pandorine',
    'LEGO', 'Liu-Jo', 'Luisa Spagnoli', 'M Collective', 'Malìparmi', 'Miele',
    'Missoni', 'Moleskine', 'MSGM', 'Nero Giardini', 'Nespresso', 'NYX',
    'O Jour', 'Pandora', 'Paul & Shark', 'Puma', 'Reebok', 'Richard J. Brown',
    'Rinascente', 'Samsung', 'Serapian', 'Sneakerness', 'Superga', 'Swarovski',
    'Tanqueray', 'Trussardi', 'Vans', 'Vigorsol', 'Xiaomi', 'Yoox',
    'Zeybra',
  ],
  brandToSpace: {
    lead: "Partiamo dall'identità del brand, dal prodotto e dal contesto per costruire un linguaggio visivo coerente e riconoscibile.",
    text2:
      "Per noi una vetrina, un pop-up, un evento o un set sono forme diverse dello stesso problema: come trasformare un messaggio in un'esperienza fisica.",
    text3:
      "L'obiettivo è creare spazi capaci di attirare, sorprendere e raccontare una storia, mantenendo equilibrio tra estetica, identità ed efficacia commerciale.",
  },
  method: {
    intro: "Ogni progetto parte dall'ascolto e arriva al cantiere passando per quattro fasi.",
    steps: [
      { _key: 'ascolto', title: 'Ascolto', description: 'Analizziamo brand, pubblico, prodotto e contesto, e chiariamo obiettivi, tempi e budget.' },
      { _key: 'concept', title: 'Concept', description: "Trasformiamo gli obiettivi in un'idea: sketch, moodboard, prime ipotesi di spazio." },
      { _key: 'progetto', title: 'Progetto', description: 'Render, layout, ricerca materiali e progettazione tecnica esecutiva.' },
      { _key: 'realizzazione', title: 'Realizzazione', description: 'Produzione, logistica e installazione, con la nostra rete o con i fornitori del cliente.' },
    ],
  },
  ctaQuestion: 'Cerchi un partner per il tuo prossimo progetto?',
};

export const servicesPageInitial = {
  intro: 'Progettiamo spazi, set e scenografie attraverso un approccio diretto e contemporaneo.',
  services: [
    { _key: 'set-design', title: 'Set design', description: 'Ideazione e sviluppo di ambienti, set e sistemi spaziali per eventi e produzioni.' },
    { _key: 'scenografia', title: 'Scenografia', description: 'Progettazione scenografica, dalla direzione creativa alla definizione degli elementi nello spazio.' },
    { _key: 'spatial-design', title: 'Spatial design', description: 'Progettazione di spazi e percorsi, con attenzione a proporzioni, materiali, atmosfera e fruizione.' },
    { _key: 'art-direction', title: 'Art direction', description: "Sviluppo del linguaggio visivo e coordinamento delle scelte che costruiscono l'identità dello spazio." },
  ],
  collaboration: {
    title: 'Come possiamo lavorare insieme',
    intro: 'Entriamo nel progetto nel momento in cui serve, con il ruolo che serve.',
    roles: [
      { _key: 'creative-partner', title: 'Creative partner', description: "Sviluppiamo l'idea con te, dalla prima ricerca al concept." },
      { _key: 'set-designer', title: 'Set designer', description: 'Progettiamo lo spazio: layout, materiali, disegni tecnici.' },
      { _key: 'art-direction', title: 'Art direction', description: 'Definiamo e manteniamo la coerenza visiva del progetto.' },
      { _key: 'partner-operativo', title: 'Partner operativo', description: 'Coordiniamo produzione, logistica e installazione in cantiere.' },
    ],
  },
  ctaQuestion: 'Hai un brief da condividere con noi?',
};

export const contactPageInitial = {
  intro: 'Raccontaci il tuo progetto: tipo di lavoro, tempi e budget indicativo. Rispondiamo entro un giorno lavorativo.',
  formTitle: 'Parlaci del progetto',
  privacyNote: 'Inviando accetti che i tuoi dati siano usati per rispondere alla richiesta.',
};
