import { defineField, defineType } from 'sanity';
import { siteSettingsInitial } from '../initialContent';

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Impostazioni del sito',
  type: 'document',
  initialValue: siteSettingsInitial,
  groups: [
    { name: 'contacts', title: 'Contatti', default: true },
    { name: 'texts', title: 'Testi comuni' },
    { name: 'seo', title: 'SEO' },
    { name: 'technical', title: 'Tecnico' },
  ],
  fields: [
    defineField({
      name: 'studioName',
      title: 'Nome dello studio',
      type: 'string',
      group: 'contacts',
      description: 'Compare in alto a sinistra e nel piè di pagina.',
      validation: (rule) => rule.required().error('Il nome dello studio è obbligatorio.'),
    }),
    defineField({
      name: 'email',
      title: 'Email',
      type: 'string',
      group: 'contacts',
      validation: (rule) => rule.required().email().error('Inserisci un indirizzo email valido.'),
    }),
    defineField({
      name: 'phone',
      title: 'Telefono',
      type: 'string',
      group: 'contacts',
      description: 'Con il prefisso internazionale. Esempio: +39 339 469 5709.',
    }),
    defineField({ name: 'address', title: 'Indirizzo', type: 'text', rows: 2, group: 'contacts' }),
    defineField({
      name: 'instagramUrl',
      title: 'Instagram (indirizzo completo)',
      type: 'url',
      group: 'contacts',
    }),
    defineField({
      name: 'linkedinUrl',
      title: 'LinkedIn (indirizzo completo)',
      type: 'url',
      group: 'contacts',
    }),

    defineField({
      name: 'projectCtaQuestion',
      title: 'Domanda finale nelle pagine dei progetti',
      type: 'string',
      group: 'texts',
      description: 'La stessa domanda compare in fondo a tutte le pagine dei singoli progetti.',
      validation: (rule) => rule.required().error('La domanda finale è obbligatoria.'),
    }),

    defineField({
      name: 'defaultSeo',
      title: 'SEO di default',
      type: 'seo',
      group: 'seo',
      description: 'Usato per la home e per le pagine che non hanno un SEO proprio.',
      options: { collapsible: false },
    }),

    defineField({
      name: 'privacyUrl',
      title: 'Indirizzo della pagina Privacy',
      type: 'string',
      group: 'technical',
      description: 'Di norma "/privacy". Cambialo solo se la pagina viene spostata.',
    }),
    defineField({
      name: 'cookieUrl',
      title: 'Indirizzo della pagina Cookie',
      type: 'string',
      group: 'technical',
      description: 'Di norma "/cookie". Cambialo solo se la pagina viene spostata.',
    }),
    defineField({
      name: 'contactFormRecipient',
      title: 'Email che riceve i messaggi del modulo contatti',
      type: 'string',
      group: 'technical',
      description: 'Non compare nel sito.',
      validation: (rule) => rule.email().error('Inserisci un indirizzo email valido.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Impostazioni del sito' }) },
});
