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
  // Esc chiude il pannello da solo: il pulsante "Menu" deve seguire
  dialog.addEventListener('close', () => setExpanded(false));

  // Se la finestra diventa larga, il menu orizzontale riprende il suo posto
  window.matchMedia('(min-width: 641px)').addEventListener('change', (event) => {
    if (event.matches && dialog.open) dialog.close();
  });
}
