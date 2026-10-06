const PAGE_SIZE = 9;
/** Distanza dalla fine dell'elenco a cui si caricano altri progetti. */
const LOAD_MARGIN_PX = 300;
const SLOTS = 8;

interface Filters {
  category: string | null;
  sector: string | null;
}

/**
 * Elenco progetti: tutte le schede sono già nell'HTML (SEO, funziona anche senza JavaScript);
 * qui si filtrano e si rivelano a blocchi di 9 con IntersectionObserver.
 * Stato dei filtri nell'URL: ?categoria=eventi&settore=fashion.
 */
export function initProjectList(root: HTMLElement): void {
  const grid = root.querySelector<HTMLElement>('[data-grid]');
  const categoryButtons = Array.from(root.querySelectorAll<HTMLButtonElement>('[data-category-button]'));
  const sectorSelect = root.querySelector<HTMLSelectElement>('[data-sector-select]');
  const sentinel = root.querySelector<HTMLElement>('[data-sentinel]');
  const statusEl = root.querySelector<HTMLElement>('[data-status]');
  const countEl = root.querySelector<HTMLElement>('[data-count]');
  const emptyEl = root.querySelector<HTMLElement>('[data-empty]');
  const resetButton = root.querySelector<HTMLButtonElement>('[data-reset]');
  if (!grid || !sectorSelect || !sentinel || !statusEl || !countEl || !emptyEl) return;
  // Dopo il controllo i riferimenti sono tutti presenti: raccolti qui, restano tipizzati nelle funzioni interne
  const ui = { grid, sectorSelect, sentinel, statusEl, countEl, emptyEl };

  const cards = Array.from(ui.grid.children).filter((el): el is HTMLElement => el instanceof HTMLElement);
  const validCategories = new Set(categoryButtons.map((b) => b.dataset.categoryButton ?? ''));
  const validSectors = new Set(Array.from(ui.sectorSelect.options, (o) => o.value).filter(Boolean));

  const params = new URLSearchParams(window.location.search);
  const fromUrl = (name: string, valid: Set<string>): string | null => {
    const value = params.get(name);
    return value && valid.has(value) ? value : null;
  };
  const filters: Filters = {
    category: fromUrl('categoria', validCategories),
    sector: fromUrl('settore', validSectors),
  };
  let visible = PAGE_SIZE;
  let io: IntersectionObserver | undefined;

  const matches = (card: HTMLElement): boolean =>
    (!filters.category || card.dataset.category === filters.category) &&
    (!filters.sector || card.dataset.sector === filters.sector);

  function writeUrl(): void {
    const next = new URLSearchParams();
    if (filters.category) next.set('categoria', filters.category);
    if (filters.sector) next.set('settore', filters.sector);
    const query = next.toString();
    history.replaceState(null, '', `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`);
  }

  function render(): void {
    const matching = cards.filter(matches);
    const shown = new Set(matching.slice(0, visible));
    cards.forEach((card) => {
      card.hidden = !shown.has(card);
    });
    // Lo schema sfalsato riparte da 1 a ogni cambio di filtro: numera solo i visibili
    matching.slice(0, visible).forEach((card, i) => {
      card.dataset.slot = String((i % SLOTS) + 1);
    });

    categoryButtons.forEach((button) =>
      button.setAttribute('aria-pressed', String(button.dataset.categoryButton === filters.category)),
    );
    root.classList.toggle('has-category', filters.category !== null);
    ui.sectorSelect.value = filters.sector ?? '';

    const hasMore = shown.size < matching.length;
    ui.emptyEl.hidden = matching.length > 0;
    ui.grid.hidden = matching.length === 0;
    ui.statusEl.textContent = matching.length === 0 ? '' : hasMore ? 'Caricamento altri progetti…' : 'Hai visto tutti i progetti';
    ui.countEl.textContent = matching.length === 0 ? '' : `${shown.size} di ${matching.length} progetti. `;

    if (io) {
      io.unobserve(ui.sentinel);
      if (hasMore) io.observe(ui.sentinel); // ricontrolla subito se la fine è ancora in vista
    }
  }

  function setFilters(next: Partial<Filters>): void {
    Object.assign(filters, next);
    visible = PAGE_SIZE;
    writeUrl();
    render();
  }

  categoryButtons.forEach((button) =>
    button.addEventListener('click', () => {
      const value = button.dataset.categoryButton ?? null;
      // un secondo click sulla voce attiva torna all'elenco completo
      setFilters({ category: filters.category === value ? null : value });
    }),
  );
  ui.sectorSelect.addEventListener('change', () => setFilters({ sector: ui.sectorSelect.value || null }));
  resetButton?.addEventListener('click', () => setFilters({ category: null, sector: null }));

  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        visible += PAGE_SIZE;
        render();
      },
      { rootMargin: `0px 0px ${LOAD_MARGIN_PX}px 0px` },
    );
    render();
  } else {
    // Senza IntersectionObserver si mostra l'elenco completo
    visible = cards.length;
    render();
  }
}
