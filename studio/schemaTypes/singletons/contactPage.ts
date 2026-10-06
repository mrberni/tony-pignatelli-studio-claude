import { defineField, defineType } from 'sanity';
import { contactPageInitial } from '../initialContent';

export const contactPage = defineType({
  name: 'contactPage',
  title: 'Contatti',
  type: 'document',
  initialValue: contactPageInitial,
  fields: [
    defineField({
      name: 'intro',
      title: 'Frase introduttiva',
      type: 'text',
      rows: 3,
      description: 'Indirizzo, email, telefono e social si modificano in "Impostazioni del sito".',
    }),
    defineField({
      name: 'formTitle',
      title: 'Titolo del modulo',
      type: 'string',
      validation: (rule) => rule.required().error('Il titolo del modulo è obbligatorio.'),
    }),
    defineField({
      name: 'privacyNote',
      title: 'Nota sulla privacy',
      type: 'text',
      rows: 2,
      description: 'Compare sotto il pulsante "Invia richiesta". Il link alla pagina Privacy viene aggiunto in automatico.',
    }),
    defineField({ name: 'seo', title: 'SEO', type: 'seo' }),
  ],
  preview: { prepare: () => ({ title: 'Contatti' }) },
});
