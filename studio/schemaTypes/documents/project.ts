import { defineArrayMember, defineField, defineType, type ValidationContext } from 'sanity';
import { apiVersion } from '../../env';
import { slugify } from '../../lib/slugify';
import { CATEGORIES, FEATURED_LIMIT, SECTORS, SUGGESTED_SERVICES, labelOf } from '../constants';

const publishedId = (id: string | undefined) => (id ?? '').replace(/^drafts\./, '');

/** Gli altri progetti (bozze comprese) che soddisfano `filter`, escluso quello aperto. */
function fetchOtherProjects(
  context: ValidationContext,
  filter: string,
  params: Record<string, unknown> = {},
): Promise<Array<{ _id: string; title?: string }>> {
  const id = publishedId(context.document?._id);
  return context
    .getClient({ apiVersion })
    .withConfig({ perspective: 'raw' })
    .fetch(
      `*[_type == "project" && ${filter} && !(_id in [$id, "drafts." + $id])]{_id, title}`,
      { ...params, id },
    );
}

export const project = defineType({
  name: 'project',
  title: 'Progetto',
  type: 'document',
  groups: [
    { name: 'main', title: 'Dati principali', default: true },
    { name: 'photos', title: 'Foto' },
    { name: 'text', title: 'Testi' },
    { name: 'seo', title: 'SEO' },
  ],
  fields: [
    defineField({
      name: 'title',
      title: 'Titolo (come appare nel sito)',
      type: 'string',
      group: 'main',
      description: 'Esempio: "Disney - Toy Story 5 - Premiere". Scrivilo normalmente, non tutto in maiuscolo.',
      validation: (rule) => rule.required().error('Il titolo è obbligatorio.'),
    }),
    defineField({
      name: 'slug',
      title: 'Indirizzo della pagina',
      type: 'slug',
      group: 'main',
      description:
        'La parte finale dell\'indirizzo: tonypignatellistudio.com/progetti/… Premi "Generate" per crearlo dal titolo. Dopo la pubblicazione è meglio non cambiarlo.',
      options: { source: 'title', maxLength: 80, slugify },
      validation: (rule) => rule.required().error('Premi "Generate" per creare l\'indirizzo della pagina.'),
    }),
    defineField({
      name: 'category',
      title: 'Categoria',
      type: 'string',
      group: 'main',
      options: { list: [...CATEGORIES], layout: 'radio' },
      validation: (rule) => rule.required().error('Scegli una categoria.'),
    }),
    defineField({
      name: 'sector',
      title: 'Settore',
      type: 'string',
      group: 'main',
      description: 'Un solo settore per progetto. Serve per il filtro nella pagina Progetti.',
      options: { list: [...SECTORS] },
      validation: (rule) => rule.required().error('Scegli un settore.'),
    }),
    defineField({
      name: 'client',
      title: 'Cliente',
      type: 'reference',
      group: 'main',
      to: [{ type: 'client' }],
      description:
        'Visibile solo nella pagina del progetto. Se il cliente non è in elenco, puoi crearlo da qui con "Create new".',
      validation: (rule) => rule.required().error('Scegli o crea un cliente.'),
    }),
    defineField({
      name: 'city',
      title: 'Città',
      type: 'string',
      group: 'main',
      description: 'Facoltativo. Esempio: "Milano". Compare alla voce "Luogo" nella pagina del progetto.',
    }),
    defineField({
      name: 'order',
      title: 'Ordine',
      type: 'number',
      group: 'main',
      description:
        '1 = il lavoro più recente. Decide la posizione nell\'elenco dei progetti e i link "Precedente" e "Successivo".',
      validation: (rule) => [
        rule
          .required()
          .integer()
          .min(1)
          .error('Inserisci un numero intero, da 1 in su.'),
        rule
          .custom(async (value, context) => {
            if (typeof value !== 'number') return true;
            const others = await fetchOtherProjects(context, 'order == $order', { order: value });
            const titles = [...new Set(others.map((doc) => doc.title || 'Senza titolo'))];
            return titles.length === 0
              ? true
              : `Questo numero è già usato da: ${titles.join(', ')}. Due progetti con lo stesso numero finiscono in ordine casuale.`;
          })
          .warning(),
      ],
    }),
    defineField({
      name: 'featured',
      title: 'In evidenza in home',
      type: 'boolean',
      group: 'main',
      description: `Compare in "Progetti selezionati" in home (consigliati ${FEATURED_LIMIT}).`,
      initialValue: false,
      validation: (rule) =>
        rule
          .custom(async (value, context) => {
            if (value !== true) return true;
            const docs = await fetchOtherProjects(context, 'featured == true');
            const others = new Set(docs.map((doc) => publishedId(doc._id))).size;
            return others < FEATURED_LIMIT
              ? true
              : `Ci sono già ${others} progetti in evidenza. In home compaiono solo i primi ${FEATURED_LIMIT} per ordine: togli la spunta a uno degli altri.`;
          })
          .warning(),
    }),

    defineField({
      name: 'coverImage',
      title: 'Foto di copertina',
      type: 'photo',
      group: 'photos',
      description:
        'La foto principale del progetto: compare in cima alla pagina e nelle anteprime. Dopo il caricamento puoi indicare il punto più importante della foto (Edit → cerchio), così non viene tagliato.',
      validation: (rule) => rule.required().error('Carica la foto di copertina.'),
    }),
    defineField({
      name: 'gallery',
      title: 'Galleria',
      type: 'array',
      group: 'photos',
      description:
        'Le altre foto del progetto. Puoi trascinarne più di una insieme. L\'ordine qui è l\'ordine nel sito: trascina per cambiarlo. Non rimettere la foto di copertina.',
      of: [defineArrayMember({ type: 'photo' })],
      options: { layout: 'grid' },
      validation: (rule) => rule.min(1).error('Carica almeno una foto nella galleria.'),
    }),

    defineField({
      name: 'intro',
      title: 'Frase di apertura',
      type: 'text',
      rows: 2,
      group: 'text',
      description: 'Una frase che riassume il progetto, in grande nella pagina. Massimo 160 caratteri.',
      validation: (rule) => rule.max(160).error('La frase di apertura non può superare i 160 caratteri.'),
    }),
    defineField({
      name: 'description',
      title: 'Descrizione',
      type: 'text',
      rows: 5,
      group: 'text',
      description: 'Il testo del progetto. Per separare i paragrafi lascia una riga vuota.',
    }),
    defineField({
      name: 'services',
      title: 'Servizi',
      type: 'array',
      group: 'text',
      of: [defineArrayMember({ type: 'string' })],
      options: { layout: 'tags' },
      description: `Cosa ha fatto lo studio in questo progetto. Scrivi una voce e premi Invio. Voci consigliate: ${SUGGESTED_SERVICES.join(', ')}.`,
      validation: (rule) => rule.unique(),
    }),

    defineField({ name: 'seo', title: 'SEO', type: 'seo', group: 'seo' }),
    defineField({
      name: 'legacy',
      title: 'Dati del vecchio sito (Wix)',
      type: 'object',
      group: 'seo',
      readOnly: true,
      description: 'Compilati in automatico dall\'importazione. Servono per i reindirizzamenti dal vecchio sito.',
      options: { collapsible: true, collapsed: true },
      fields: [
        defineField({ name: 'wixUrl', title: 'Indirizzo nel vecchio sito', type: 'string' }),
        defineField({ name: 'wixTitle', title: 'Titolo nel vecchio sito', type: 'string' }),
      ],
    }),
  ],
  orderings: [
    { title: 'Ordine (più recente prima)', name: 'orderAsc', by: [{ field: 'order', direction: 'asc' }] },
    { title: 'Titolo (A–Z)', name: 'titleAsc', by: [{ field: 'title', direction: 'asc' }] },
  ],
  preview: {
    select: { title: 'title', category: 'category', sector: 'sector', order: 'order', media: 'coverImage' },
    prepare({ title, category, sector, order, media }) {
      const meta = [labelOf(CATEGORIES, category), labelOf(SECTORS, sector)].filter(Boolean).join(' · ');
      return {
        title: title || 'Senza titolo',
        subtitle: [typeof order === 'number' ? `${order}.` : '', meta].filter(Boolean).join(' '),
        media,
      };
    },
  },
});
