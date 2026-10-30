import { orderableDocumentListDeskItem } from '@sanity/orderable-document-list';
import type { StructureBuilder, StructureResolver } from 'sanity/structure';

/** Un solo documento per tipo: si apre direttamente, senza elenco né "crea nuovo". */
const singleton = (S: StructureBuilder, type: string, title: string) =>
  S.listItem()
    .id(type)
    .title(title)
    .child(S.document().schemaType(type).documentId(type).title(title));

export const structure: StructureResolver = (S, context) =>
  S.list()
    .title('Contenuti')
    .items([
      // Elenco trascinabile: l'ordine qui è l'ordine nel sito (primo = più in alto in home)
      orderableDocumentListDeskItem({ type: 'project', id: 'projects', title: 'Progetti', S, context }),
      S.listItem()
        .id('clients')
        .title('Clienti')
        .child(
          S.documentTypeList('client')
            .title('Clienti')
            .defaultOrdering([{ field: 'name', direction: 'asc' }]),
        ),
      S.divider(),
      singleton(S, 'homePage', 'Pagina Home'),
      singleton(S, 'studioPage', 'Pagina Studio'),
      singleton(S, 'servicesPage', 'Pagina Servizi'),
      singleton(S, 'contactPage', 'Pagina Contatti'),
      S.divider(),
      singleton(S, 'siteSettings', 'Impostazioni del sito'),
    ]);
