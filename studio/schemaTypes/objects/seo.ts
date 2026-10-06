import { defineField, defineType } from 'sanity';

export const seo = defineType({
  name: 'seo',
  title: 'SEO (motori di ricerca e condivisione)',
  type: 'object',
  description:
    'Facoltativo. Se lasci vuoto, il sito usa titolo, testo e immagine già presenti nella pagina.',
  options: { collapsible: true, collapsed: true },
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo per Google',
      type: 'string',
      description: 'Compare nella scheda del browser e nei risultati di ricerca. Consigliati al massimo 60 caratteri.',
      validation: (rule) => rule.max(70).warning('Oltre i 70 caratteri Google taglia il titolo.'),
    }),
    defineField({
      name: 'description',
      title: 'Descrizione per Google',
      type: 'text',
      rows: 3,
      description: 'Una o due frasi che riassumono la pagina. Consigliati al massimo 160 caratteri.',
      validation: (rule) => rule.max(170).warning('Oltre i 170 caratteri Google taglia la descrizione.'),
    }),
    defineField({
      name: 'image',
      title: 'Immagine per la condivisione',
      type: 'image',
      description: 'Compare quando il link viene condiviso su WhatsApp, LinkedIn e simili. Formato orizzontale.',
      options: { hotspot: true },
    }),
  ],
});
