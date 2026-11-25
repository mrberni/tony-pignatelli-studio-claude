import { defineField, defineType } from 'sanity';

/** Agenzia di eventi per cui lo studio ha lavorato: compare solo nella pagina del progetto. */
export const agency = defineType({
  name: 'agency',
  title: 'Agenzia',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      description: 'Il nome dell\'agenzia come va scritto nel sito. Esempio: "Blackmongoose".',
      validation: (rule) => rule.required().error('Il nome è obbligatorio.'),
    }),
  ],
  orderings: [{ title: 'Nome (A–Z)', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name' },
    prepare: ({ title }) => ({ title: title || 'Senza nome' }),
  },
});
