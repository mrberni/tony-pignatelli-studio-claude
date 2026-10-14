const SWIPE_MIN_PX = 40;

/**
 * Visore foto: al click su una foto della galleria si apre a tutto schermo (<dialog> modale:
 * focus nel pannello, Esc, ritorno del focus alla foto). Frecce ← →, pulsanti, swipe su touch.
 */
export function initGallery(gallery: HTMLElement): void {
  const viewer = gallery.parentElement?.querySelector<HTMLDialogElement>('[data-viewer]');
  // Nell'HTML le foto sono raggruppate per colonna: il visore le scorre nell'ordine dell'elenco
  const items = Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-item]')).sort(
    (a, b) => Number(a.dataset.index) - Number(b.dataset.index),
  );
  if (!viewer || items.length === 0) return;

  const img = viewer.querySelector<HTMLImageElement>('[data-viewer-img]');
  const video = viewer.querySelector<HTMLVideoElement>('[data-viewer-video]');
  const placeholder = viewer.querySelector<HTMLElement>('[data-viewer-placeholder]');
  const count = viewer.querySelector<HTMLElement>('[data-viewer-count]');
  const stage = viewer.querySelector<HTMLElement>('[data-viewer-stage]');
  const prev = viewer.querySelector<HTMLButtonElement>('[data-viewer-prev]');
  const next = viewer.querySelector<HTMLButtonElement>('[data-viewer-next]');
  const close = viewer.querySelector<HTMLButtonElement>('[data-viewer-close]');
  if (!img || !video || !placeholder || !count || !stage || !prev || !next || !close) return;
  const ui = { img, video, placeholder, count, stage, prev, next, close };

  let index = 0;
  let swiped = false;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /** Ferma il video e libera il file (si scarica solo quando serve). */
  function stopVideo(): void {
    ui.video.pause();
    ui.video.hidden = true;
    if (ui.video.hasAttribute('src')) {
      ui.video.removeAttribute('src');
      ui.video.removeAttribute('poster');
      ui.video.load();
    }
  }

  function show(target: number): void {
    index = Math.min(Math.max(target, 0), items.length - 1);
    const item = items[index];
    if (!item) return;
    const { src, srcset, alt, videoSrc } = item.dataset;
    stopVideo();
    if (videoSrc) {
      // Video: l'anteprima resta come poster, il file parte dopo il clic (anche con le frecce)
      ui.img.hidden = true;
      ui.placeholder.hidden = true;
      ui.video.setAttribute('aria-label', alt ?? 'Video');
      if (src) ui.video.poster = src;
      ui.video.src = videoSrc;
      ui.video.hidden = false;
      if (!reducedMotion.matches) void ui.video.play().catch(() => undefined);
    } else if (src) {
      ui.img.hidden = false;
      ui.placeholder.hidden = true;
      ui.img.alt = alt ?? '';
      ui.img.sizes = '100vw';
      ui.img.srcset = srcset ?? '';
      ui.img.src = src;
    } else {
      ui.img.hidden = true;
      ui.img.removeAttribute('src');
      ui.img.removeAttribute('srcset');
      ui.placeholder.hidden = false;
      ui.placeholder.textContent = `Foto — ${alt ?? ''}`;
    }
    ui.count.textContent = `${index + 1} / ${items.length}`;
    ui.prev.disabled = index === 0;
    ui.next.disabled = index === items.length - 1;
    // Precarica le foto vicine
    [index - 1, index + 1].forEach((i) => {
      const neighbour = items[i]?.dataset.src;
      if (neighbour) new Image().src = neighbour;
    });
  }

  items.forEach((item, i) =>
    item.addEventListener('click', () => {
      show(i);
      viewer.showModal();
    }),
  );
  ui.prev.addEventListener('click', () => show(index - 1));
  ui.next.addEventListener('click', () => show(index + 1));
  ui.close.addEventListener('click', () => viewer.close());
  viewer.addEventListener('close', stopVideo);

  viewer.addEventListener('keydown', (event) => {
    // Con il video selezionato le frecce servono a spostarsi nel video: per cambiare elemento ci sono i pulsanti
    if (event.target === ui.video) return;
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });

  // Click sullo sfondo (non sulla foto) chiude il visore
  ui.stage.addEventListener('click', (event) => {
    if (event.target === ui.stage && !swiped) viewer.close();
    swiped = false;
  });

  // Swipe orizzontale su tutto il visore (esclusi pulsanti): sinistra = foto successiva
  let startX = 0;
  let startY = 0;
  let tracking = false;
  viewer.addEventListener('pointerdown', (event) => {
    swiped = false;
    if (event.target instanceof Element && event.target.closest('button, video')) return;
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  viewer.addEventListener('pointerup', (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) {
      swiped = true;
      show(dx < 0 ? index + 1 : index - 1);
    }
  });
  viewer.addEventListener('pointercancel', () => {
    tracking = false;
  });
}
