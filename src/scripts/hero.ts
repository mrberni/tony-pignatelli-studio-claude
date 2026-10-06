const AUTOPLAY_MS = 5000;
const SWIPE_MIN_PX = 40;

/**
 * Carousel della home. L'autoplay (5 s) si ferma con prefers-reduced-motion, al passaggio
 * del mouse, al focus da tastiera e al primo tocco.
 */
export function initHero(root: HTMLElement): void {
  const slides = Array.from(root.querySelectorAll<HTMLElement>('[data-slide]'));
  const dots = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-dot]'));
  const prev = root.querySelector<HTMLButtonElement>('[data-prev]');
  const next = root.querySelector<HTMLButtonElement>('[data-next]');
  const live = root.querySelector<HTMLElement>('[data-live]');
  if (slides.length < 2) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let index = 0;
  let timer: number | undefined;
  let reduced = reducedMotion.matches;
  let touched = false;
  let hovering = false;
  let focused = false;

  const running = (): boolean => !reduced && !touched && !hovering && !focused;

  function render(): void {
    slides.forEach((slide, i) => slide.setAttribute('data-active', String(i === index)));
    dots.forEach((dot, i) => {
      if (i === index) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
  }

  function schedule(): void {
    window.clearInterval(timer);
    timer = undefined;
    live?.setAttribute('aria-live', running() ? 'off' : 'polite');
    if (running()) timer = window.setInterval(() => goTo(index + 1, false), AUTOPLAY_MS);
  }

  function goTo(target: number, manual: boolean): void {
    index = (target + slides.length) % slides.length;
    render();
    if (manual) schedule();
  }

  prev?.addEventListener('click', () => goTo(index - 1, true));
  next?.addEventListener('click', () => goTo(index + 1, true));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i, true)));

  root.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') goTo(index - 1, true);
    if (event.key === 'ArrowRight') goTo(index + 1, true);
  });

  // Mouse: pausa mentre il puntatore è sopra il carousel
  root.addEventListener('pointerenter', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = true;
    schedule();
  });
  root.addEventListener('pointerleave', (event) => {
    if (event.pointerType !== 'mouse') return;
    hovering = false;
    schedule();
  });

  // Tastiera: pausa solo per il focus visibile (non per il click del mouse)
  root.addEventListener('focusin', (event) => {
    if (event.target instanceof HTMLElement && event.target.matches(':focus-visible')) {
      focused = true;
      schedule();
    }
  });
  root.addEventListener('focusout', (event) => {
    const to = event.relatedTarget;
    focused = to instanceof Node && root.contains(to) && to instanceof HTMLElement && to.matches(':focus-visible');
    schedule();
  });

  // Tocco: il primo tocco ferma l'autoplay; lo swipe orizzontale cambia lavoro
  let startX = 0;
  let startY = 0;
  let tracking = false;
  root.addEventListener('pointerdown', (event) => {
    if (event.pointerType === 'mouse') return;
    touched = true;
    schedule();
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  root.addEventListener('pointerup', (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      goTo(dx < 0 ? index + 1 : index - 1, true);
    }
  });
  root.addEventListener('pointercancel', () => {
    tracking = false;
  });

  reducedMotion.addEventListener('change', () => {
    reduced = reducedMotion.matches;
    schedule();
  });

  render();
  schedule();
}
