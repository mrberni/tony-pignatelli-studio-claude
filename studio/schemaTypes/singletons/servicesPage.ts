import { defineArrayMember, defineField, defineType } from 'sanity';
import { servicesPageInitial } from '../initialContent';

const titledItem = (name: string, title: string) =>
  defineArrayMember({
    type: 'object',
    name,
    title,
    fields: [
      defineField({
        name: 'title',
        title: 'Titolo',
        type: 'string',
        validation: (rule) => rule.required().error('Il titolo è obbligatorio.'),
      }),
      defineField({ name: 'description', title: 'Descrizione', type: 'text', rows: 3 }),
    ],
    preview: { select: { title: 'title', subtitle: 'description' } },
  });

export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Servizi',
  type: 'document',
  initialValue: servicesPageInitial,
  fields: [
    defineField({
      name: 'intro',
      title: 'Titolo della pagina',
      type: 'text',
      rows: 2,
      description: 'La frase grande in cima alla pagina.',
      validation: (rule) => rule.required().error('Il titolo della pagina è obbligatorio.'),
    }),
    defineField({
      name: 'services',
      title: 'Servizi',
      type: 'array',
      description: 'Il numero (01, 02…) è automatico e segue l\'ordine dell\'elenco: trascina per riordinare.',
      of: [titledItem('service', 'Servizio')],
    }),
    defineField({
      name: 'collaboration',
      title: 'Sezione "Come possiamo lavorare insieme"',
      type: 'object',
      fields: [
        defineField({ name: 'title', title: 'Titolo', type: 'string' }),
        defineField({ name: 'intro', title: 'Frase introduttiva', type: 'text', rows: 2 }),
        defineField({
          name: 'roles',
          title: 'Ruoli',
          type: 'array',
          description: 'Nel sito compaiono su quattro colonne.',
          of: [titledItem('role', 'Ruolo')],
        }),
      ],
    }),
    defineField({
      name: 'ctaQuestion',
      title: 'Domanda finale',
      type: 'string',
      description: 'La domanda nella fascia nera in fondo alla pagina, sopra il link "Contatti".',
      validation: (rule) => rule.required().error('La domanda finale è obbligatoria.'),
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Servizi' }) },
});
