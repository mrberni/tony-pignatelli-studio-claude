import { defineField, defineType } from 'sanity';

/** Foto con punto focale e testo alternativo, usata per copertina e galleria. */
export const photo = defineType({
  name: 'photo',
  title: 'Foto',
  type: 'image',
  options: { hotspot: true },
  fields: [
    defineField({
      name: 'alt',
      title: 'Testo alternativo',
      type: 'string',
      description:
        'Breve descrizione della foto per chi non la vede (lettori di schermo, Google). Se lasci vuoto si usa il titolo del progetto.',
    }),
  ],
});
