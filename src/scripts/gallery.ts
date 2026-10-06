const SWIPE_MIN_PX = 40;

/**
 * Visore foto: al click su una foto della galleria si apre a tutto schermo (<dialog> modale:
 * focus nel pannello, Esc, ritorno del focus alla foto). Frecce ← →, pulsanti, swipe su touch.
 */
export function initGallery(gallery: HTMLElement): void {
  const viewer = gallery.parentElement?.querySelector<HTMLDialogElement>('[data-viewer]');
  const items = Array.from(gallery.querySelectorAll<HTMLElement>('[data-gallery-item]'));
  if (!viewer || items.length === 0) return;

  const img = viewer.querySelector<HTMLImageElement>('[data-viewer-img]');
  const placeholder = viewer.querySelector<HTMLElement>('[data-viewer-placeholder]');
  const count = viewer.querySelector<HTMLElement>('[data-viewer-count]');
  const stage = viewer.querySelector<HTMLElement>('[data-viewer-stage]');
  const prev = viewer.querySelector<HTMLButtonElement>('[data-viewer-prev]');
  const next = viewer.querySelector<HTMLButtonElement>('[data-viewer-next]');
  const close = viewer.querySelector<HTMLButtonElement>('[data-viewer-close]');
  if (!img || !placeholder || !count || !stage || !prev || !next || !close) return;
  const ui = { img, placeholder, count, stage, prev, next, close };

  let index = 0;

  function show(target: number): void {
    index = Math.min(Math.max(target, 0), items.length - 1);
    const item = items[index];
    if (!item) return;
    const { src, srcset, alt } = item.dataset;
    if (src) {
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

  viewer.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft') show(index - 1);
    if (event.key === 'ArrowRight') show(index + 1);
  });

  // Click sullo sfondo (non sulla foto) chiude il visore
  ui.stage.addEventListener('click', (event) => {
    if (event.target === ui.stage) viewer.close();
  });

  // Swipe orizzontale
  let startX = 0;
  let startY = 0;
  let tracking = false;
  ui.stage.addEventListener('pointerdown', (event) => {
    tracking = true;
    startX = event.clientX;
    startY = event.clientY;
  });
  ui.stage.addEventListener('pointerup', (event) => {
    if (!tracking) return;
    tracking = false;
    const dx = event.clientX - startX;
    const dy = event.clientY - startY;
    if (Math.abs(dx) >= SWIPE_MIN_PX && Math.abs(dx) > Math.abs(dy) * 1.5) show(dx < 0 ? index + 1 : index - 1);
  });
  ui.stage.addEventListener('pointercancel', () => {
    tracking = false;
  });
}
