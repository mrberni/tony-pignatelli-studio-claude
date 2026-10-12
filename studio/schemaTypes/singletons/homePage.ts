import { defineArrayMember, defineField, defineType } from 'sanity';
import { FEATURED_LIMIT, FEATURED_MIN } from '../constants';
import { homePageInitial } from '../initialContent';

const sectionFields = [
  defineField({
    name: 'title',
    title: 'Titolo',
    type: 'string',
    validation: (rule) => rule.required().error('Il titolo è obbligatorio.'),
  }),
  defineField({
    name: 'text',
    title: 'Testo',
    type: 'text',
    rows: 4,
    validation: (rule) => rule.required().error('Il testo è obbligatorio.'),
  }),
];

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',
  initialValue: homePageInitial,
  fields: [
    defineField({
      name: 'carousel',
      title: 'Carousel in cima alla home',
      type: 'array',
      description:
        'Da 4 a 5 progetti. Scorrono in automatico, nell\'ordine di questo elenco: trascina per cambiarlo. Di ogni progetto si vede la foto di copertina.',
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'project' }] })],
      validation: (rule) => [
        rule.min(4).error('Servono almeno 4 progetti nel carousel.'),
        rule.max(5).error('Il carousel può contenere al massimo 5 progetti.'),
        rule.unique().error('Lo stesso progetto compare due volte nel carousel.'),
      ],
    }),
    defineField({
      name: 'featuredProjects',
      title: 'Progetti selezionati',
      type: 'array',
      description: `Da ${FEATURED_MIN} a ${FEATURED_LIMIT} progetti. Compaiono in home nell'ordine di questo elenco: trascina per cambiarlo.`,
      of: [defineArrayMember({ type: 'reference', to: [{ type: 'project' }] })],
      validation: (rule) => [
        rule.min(FEATURED_MIN).error(`Servono almeno ${FEATURED_MIN} progetti selezionati.`),
        rule.max(FEATURED_LIMIT).error(`Si possono selezionare al massimo ${FEATURED_LIMIT} progetti.`),
        rule.unique().error('Lo stesso progetto compare due volte.'),
      ],
    }),
    defineField({
      name: 'studioSection',
      title: 'Sezione "Lo studio"',
      type: 'object',
      fields: sectionFields,
    }),
    defineField({
      name: 'servicesSection',
      title: 'Sezione "Servizi"',
      type: 'object',
      fields: sectionFields,
    }),
    defineField({
      name: 'ctaQuestion',
      title: 'Domanda finale',
      type: 'string',
      description: 'La domanda nella fascia nera in fondo alla pagina, sopra il link "Contatti".',
      validation: (rule) => rule.required().error('La domanda finale è obbligatoria.'),
    }),
  ],
  preview: { prepare: () => ({ title: 'Home' }) },
});
