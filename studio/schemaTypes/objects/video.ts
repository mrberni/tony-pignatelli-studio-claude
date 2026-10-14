import { defineField, defineType } from 'sanity';

/** Video .mp4 della galleria di un progetto: file + immagine di anteprima. */
export const video = defineType({
  name: 'video',
  title: 'Video',
  type: 'object',
  fields: [
    defineField({
      name: 'file',
      title: 'File video (.mp4)',
      type: 'file',
      options: { accept: 'video/mp4' },
      description:
        'Formato .mp4 (H.264). Sul sito il video si vede SEMPRE SENZA AUDIO, senza possibilità di attivarlo (se il file ha una traccia audio, resta nel file ma non viene riprodotta). Per un sito veloce: sotto i 30 MB e ben compresso, meglio se breve: si ripete in continuazione.',
      validation: (rule) => rule.required().error('Carica un file .mp4.'),
    }),
    defineField({
      name: 'poster',
      title: 'Immagine di anteprima',
      type: 'photo',
      description:
        'Si vede nella galleria prima di avviare il video e ne decide la forma (orizzontale, verticale…). Un fotogramma del video va bene. Il testo alternativo descrive il video.',
      validation: (rule) =>
        rule.custom((value) => ((value as { asset?: unknown } | undefined)?.asset ? true : "Carica un'immagine di anteprima.")),
    }),
  ],
  preview: {
    select: { media: 'poster', alt: 'poster.alt' },
    prepare: ({ media, alt }) => ({
      title: (alt as string | undefined) || 'Video',
      subtitle: 'Video',
      media,
    }),
  },
});
