import ArrowUpIcon from '@sanity/icons/ArrowUp';
import { useState } from 'react';
import { useClient, type DocumentActionComponent } from 'sanity';
import { apiVersion } from '../env';

const publishedId = (id: string) => id.replace(/^drafts\./, '');

type ProjectRow = { _id: string; order?: number };

/**
 * "Metti in cima": porta il progetto al numero d'ordine 1 e scala di un posto
 * tutti quelli che erano prima di lui (o tutti, se non aveva ancora un numero).
 * Aggiorna in un'unica transazione il progetto e gli altri, bozze comprese.
 */
export const moveToTop: DocumentActionComponent = (props) => {
  const { id, type, draft, published, onComplete } = props;
  const client = useClient({ apiVersion });
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (type !== 'project') return null;

  const baseId = publishedId(id);
  const currentOrder = (draft?.order ?? published?.order) as number | undefined;
  const alreadyOnTop = currentOrder === 1;

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const ids = [baseId, `drafts.${baseId}`];
      const rows = await client.withConfig({ perspective: 'raw' }).fetch<ProjectRow[]>(
        `*[_type == "project" && defined(order)]{_id, order}`,
      );
      const tx = client.transaction();
      for (const row of rows) {
        const isThis = ids.includes(row._id);
        const shouldShift =
          !isThis && typeof row.order === 'number' && (currentOrder === undefined || row.order < currentOrder);
        if (shouldShift) tx.patch(row._id, (patch) => patch.inc({ order: 1 }));
      }
      // il progetto stesso: tutte le versioni esistenti (bozza e/o pubblicata)
      const existing = await client
        .withConfig({ perspective: 'raw' })
        .fetch<string[]>(`*[_id in $ids]._id`, { ids });
      for (const docId of existing) tx.patch(docId, (patch) => patch.set({ order: 1 }));
      await tx.commit();
      setConfirming(false);
      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setBusy(false);
    }
  }

  return {
    label: 'Metti in cima',
    icon: ArrowUpIcon,
    disabled: alreadyOnTop || busy,
    title: alreadyOnTop
      ? 'Questo progetto è già il primo.'
      : 'Porta questo progetto al numero 1 e sposta di un posto gli altri.',
    onHandle: () => setConfirming(true),
    dialog: confirming
      ? {
          type: 'confirm',
          tone: 'caution',
          message: error
            ? `Non è stato possibile completare l'operazione: ${error}`
            : 'Il progetto diventa il numero 1 (il più recente) e gli altri scalano di un posto. Gli altri progetti vengono aggiornati subito, senza dover premere "Publish".',
          confirmButtonText: 'Metti in cima',
          cancelButtonText: 'Annulla',
          onConfirm: run,
          onCancel: () => {
            setConfirming(false);
            setError(null);
          },
        }
      : null,
  };
};
