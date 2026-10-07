/**
 * Piano delle foto (HANDOFF §8.4): `Main Project Image` → copertina, `Gallery` → galleria nello
 * stesso ordine; se la copertina compare anche in galleria (stesso id) si omette dalla galleria.
 */
import type { SourceProject } from './source.ts';

export interface PhotoRef {
  /** Identificativo del file su Wix, es. `ccac1d_dff2…~mv2.jpg` */
  id: string;
  fileName: string;
  width: number;
  height: number;
}

export interface ProjectPhotos {
  slug: string;
  title: string;
  documentId: string;
  cover: PhotoRef;
  gallery: PhotoRef[];
  /** La copertina era anche nella galleria di Wix e non viene ripetuta. */
  coverWasInGallery: boolean;
  /** `N. foto (Wix)` del foglio. */
  sheetCount: number;
}

export interface PhotoPlan {
  projects: ProjectPhotos[];
  /** Foto uniche da scaricare, per id. */
  unique: Map<string, PhotoRef>;
  errors: string[];
}

const WIX_IMAGE = /^wix:image:\/\/v1\/([^/]+)\/([^#]*)(?:#originWidth=(\d+)&originHeight=(\d+))?/;

export const wixMediaUrl = (id: string): string => `https://static.wixstatic.com/media/${id}`;

function parseWixImage(src: string, fileNameOverride?: string, size?: { width?: number; height?: number }): PhotoRef | undefined {
  const match = WIX_IMAGE.exec(src);
  if (!match) return undefined;
  const [, id = '', encodedName = '', w, h] = match;
  let name = encodedName;
  try {
    name = decodeURIComponent(encodedName);
  } catch {
    // nome non decodificabile: si tiene così com'è
  }
  return {
    id,
    fileName: fileNameOverride || name || id,
    width: size?.width ?? (w ? Number(w) : 0),
    height: size?.height ?? (h ? Number(h) : 0),
  };
}

interface RawGalleryItem {
  src?: string;
  fileName?: string;
  settings?: { width?: number; height?: number };
}

export function planPhotos(projects: SourceProject[]): PhotoPlan {
  const errors: string[] = [];
  const unique = new Map<string, PhotoRef>();
  const result: ProjectPhotos[] = [];

  for (const project of projects) {
    const where = `Progetto "${project.title}"`;
    const row = project.wixRow;
    const coverSrc = row?.['Main Project Image'] ?? '';
    const cover = parseWixImage(coverSrc);
    if (!cover) {
      errors.push(`${where}: copertina non leggibile ("${coverSrc.slice(0, 60)}")`);
      continue;
    }

    let rawGallery: RawGalleryItem[] = [];
    try {
      rawGallery = JSON.parse(row?.['Gallery'] || '[]') as RawGalleryItem[];
    } catch {
      errors.push(`${where}: galleria non leggibile (JSON non valido)`);
      continue;
    }
    const all = rawGallery.map((item) => parseWixImage(item.src ?? '', item.fileName, item.settings));
    if (all.some((photo) => photo === undefined)) errors.push(`${where}: una foto della galleria non ha un indirizzo Wix valido`);
    const photos = all.filter((photo): photo is PhotoRef => photo !== undefined);

    const coverWasInGallery = photos.some((photo) => photo.id === cover.id);
    const gallery = photos.filter((photo) => photo.id !== cover.id);

    // Il numero del foglio deve coincidere con la galleria di Wix (controllo già verde in Fase 3)
    if (photos.length !== project.photoCount) {
      errors.push(`${where}: il foglio dichiara ${project.photoCount} foto, la galleria Wix ne ha ${photos.length}`);
    }

    for (const photo of [cover, ...gallery]) if (!unique.has(photo.id)) unique.set(photo.id, photo);
    result.push({
      slug: project.slug,
      title: project.title,
      documentId: `project-${project.slug}`,
      cover,
      gallery,
      coverWasInGallery,
      sheetCount: project.photoCount,
    });
  }
  return { projects: result, unique, errors };
}

/** Esegue `task` su tutti gli elementi con al massimo `concurrency` operazioni insieme. */
export async function runPool<T>(items: T[], concurrency: number, task: (item: T, index: number) => Promise<void>): Promise<void> {
  let next = 0;
  const worker = async (): Promise<void> => {
    while (next < items.length) {
      const index = next++;
      await task(items[index] as T, index);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker));
}

/** Ripete `operation` con attesa crescente (1, 2, 4, 8 s) prima di arrendersi. */
export async function withRetry<T>(label: string, operation: () => Promise<T>, attempts = 5): Promise<T> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, 1000 * 2 ** (attempt - 1)));
    }
  }
  throw new Error(`${label}: ${lastError instanceof Error ? lastError.message : String(lastError)} (dopo ${attempts} tentativi)`);
}
