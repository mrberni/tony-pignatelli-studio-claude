import { defineArrayMember, defineField, defineType } from 'sanity';
import { studioPageInitial } from '../initialContent';

export const studioPage = defineType({
  name: 'studioPage',
  title: 'Studio',
  type: 'document',
  initialValue: studioPageInitial,
  fields: [
    defineField({
      name: 'intro',
      title: 'Apertura',
      type: 'object',
      fields: [
        defineField({ name: 'text1', title: 'Primo paragrafo', type: 'text', rows: 4 }),
        defineField({ name: 'text2', title: 'Secondo paragrafo', type: 'text', rows: 4 }),
        defineField({
          name: 'photo',
          title: 'Foto',
          type: 'photo',
          description: 'Ritratto o foto dello studio al lavoro. Formato verticale (4:5).',
        }),
      ],
    }),
    defineField({
      name: 'experience',
      title: 'Sezione "Esperienza e network"',
      type: 'object',
      fields: [
        defineField({
          name: 'lead',
          title: 'Paragrafo in evidenza',
          type: 'text',
          rows: 3,
          description: 'Il primo paragrafo, scritto in grande.',
        }),
        defineField({ name: 'text', title: 'Secondo paragrafo', type: 'text', rows: 4 }),
      ],
    }),
    defineField({
      name: 'clientNames',
      title: 'Elenco "Clienti"',
      type: 'array',
      description:
        'I nomi che compaiono nella sezione Clienti di questa pagina. È un elenco separato dai clienti collegati ai progetti. Trascina per riordinare.',
      of: [defineArrayMember({ type: 'string' })],
      validation: (rule) => rule.unique().error('Lo stesso nome compare due volte.'),
    }),
    defineField({
      name: 'brandToSpace',
      title: 'Sezione "Dal brand allo spazio"',
      type: 'object',
      fields: [
        defineField({
          name: 'lead',
          title: 'Paragrafo in evidenza',
          type: 'text',
          rows: 3,
          description: 'Il primo paragrafo, scritto in grande.',
        }),
        defineField({ name: 'text2', title: 'Secondo paragrafo', type: 'text', rows: 4 }),
        defineField({ name: 'text3', title: 'Terzo paragrafo', type: 'text', rows: 4 }),
      ],
    }),
    defineField({
      name: 'method',
      title: 'Sezione "Il nostro metodo"',
      type: 'object',
      fields: [
        defineField({ name: 'intro', title: 'Frase introduttiva', type: 'text', rows: 2 }),
        defineField({
          name: 'steps',
          title: 'Fasi',
          type: 'array',
          description: 'Il numero ("Fase 1", "Fase 2"…) è automatico e segue l\'ordine dell\'elenco.',
          of: [
            defineArrayMember({
              type: 'object',
              name: 'step',
              title: 'Fase',
              fields: [
                defineField({
                  name: 'title',
                  title: 'Nome',
                  type: 'string',
                  validation: (rule) => rule.required().error('Il nome è obbligatorio.'),
                }),
                defineField({ name: 'description', title: 'Descrizione', type: 'text', rows: 3 }),
              ],
              preview: { select: { title: 'title', subtitle: 'description' } },
            }),
          ],
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
  preview: { prepare: () => ({ title: 'Studio' }) },
});
