const STEP_MS = 90;
const MAX_STEPS = 5;

/**
 * Comparsa delle schede mentre si scorre: dissolvenza con un leggero movimento verso l'alto.
 * Gli elementi con `data-reveal` partono nascosti (solo se questo script gira e senza
 * `prefers-reduced-motion`: altrimenti restano sempre visibili) e si rivelano quando entrano
 * nella finestra, in successione se ne entrano più insieme (da sinistra a destra, dall'alto in basso).
 * Quelli già in vista al caricamento non vengono mai nascosti: nessun lampo e nessun ritardo.
 */
export function initReveal(): void {
  const items = Array.from(document.querySelectorAll<HTMLElement>('[data-reveal]'));
  if (items.length === 0) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced || !('IntersectionObserver' in window)) return;

  const reveal = (el: HTMLElement): void => el.classList.add('is-revealed');

  // Prima di nascondere: ciò che è già visibile resta com'è
  items.forEach((el) => {
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) reveal(el);
  });
  document.documentElement.classList.add('reveal-on');

  const io = new IntersectionObserver(
    (entries) => {
      const entering = entries
        .filter((entry) => entry.isIntersecting)
        .map((entry) => entry.target)
        .filter((el): el is HTMLElement => el instanceof HTMLElement)
        .sort((a, b) => {
          const ra = a.getBoundingClientRect();
          const rb = b.getBoundingClientRect();
          return Math.abs(ra.top - rb.top) > 8 ? ra.top - rb.top : ra.left - rb.left;
        });
      entering.forEach((el, i) => {
        el.style.setProperty('--reveal-delay', `${Math.min(i, MAX_STEPS) * STEP_MS}ms`);
        reveal(el);
        io.unobserve(el);
      });
    },
    { rootMargin: '0px 0px -6% 0px', threshold: 0.04 },
  );
  items.filter((el) => !el.classList.contains('is-revealed')).forEach((el) => io.observe(el));
}
