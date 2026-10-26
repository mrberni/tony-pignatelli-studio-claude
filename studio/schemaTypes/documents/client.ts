import { defineField, defineType } from 'sanity';
import { slugify } from '../../lib/slugify';

export const client = defineType({
  name: 'client',
  title: 'Cliente',
  type: 'document',
  fields: [
    defineField({
      name: 'name',
      title: 'Nome',
      type: 'string',
      description: 'Il nome del brand come va scritto nel sito. Esempio: "Estée Lauder".',
      validation: (rule) => rule.required().error('Il nome è obbligatorio.'),
    }),
    defineField({
      name: 'slug',
      title: 'Identificativo',
      type: 'slug',
      description: 'Uso tecnico. Premi "Generate" per crearlo dal nome.',
      options: { source: 'name', maxLength: 80, slugify },
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'file',
      description:
        'Logo vettoriale ufficiale, fornito dal brand. Solo file .svg, preferibilmente monocromatico. Se manca, il sito mostra il nome in testo.',
      options: { accept: '.svg,image/svg+xml' },
    }),
  ],
  orderings: [{ title: 'Nome (A–Z)', name: 'nameAsc', by: [{ field: 'name', direction: 'asc' }] }],
  preview: {
    select: { title: 'name' },
    prepare({ title }) {
      return { title: title || 'Senza nome' };
    },
  },
});
