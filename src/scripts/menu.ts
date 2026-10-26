/**
 * Menu mobile: pannello a tutto schermo con <dialog>. Il browser gestisce focus
 * contenuto nel pannello, tasto Esc e ritorno del focus al pulsante "Menu".
 */
export function initMenu(): void {
  const dialog = document.querySelector<HTMLDialogElement>('#menu-panel');
  const openers = document.querySelectorAll<HTMLButtonElement>('[data-menu-open]');
  const closers = document.querySelectorAll<HTMLButtonElement>('[data-menu-close]');
  if (!dialog) return;

  const setExpanded = (value: boolean): void => {
    openers.forEach((button) => button.setAttribute('aria-expanded', String(value)));
  };

  openers.forEach((button) =>
    button.addEventListener('click', () => {
      dialog.showModal();
      setExpanded(true);
    }),
  );
  closers.forEach((button) =>
    button.addEventListener('click', () => {
      dialog.close();
      setExpanded(false);
    }),
  );
  // Un link del pannello (per esempio «Progetti» → /#progetti, stessa pagina) deve chiuderlo
  dialog.querySelectorAll('a').forEach((link) =>
    link.addEventListener('click', () => {
      if (dialog.open) dialog.close();
    }),
  );

  // Esc (o qualsiasi altra chiusura) chiude il pannello da solo: il pulsante "Menu" segue lo stato
  // reale del pannello, senza dipendere dall'evento `close`, che non arriva in tutti i browser.
  new MutationObserver(() => setExpanded(dialog.open)).observe(dialog, { attributes: true, attributeFilter: ['open'] });

  // Se la finestra diventa larga, il menu orizzontale riprende il suo posto
  window.matchMedia('(min-width: 641px)').addEventListener('change', (event) => {
    if (event.matches && dialog.open) dialog.close();
  });
}
