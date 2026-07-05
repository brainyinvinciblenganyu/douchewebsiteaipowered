export type VendorDraft = {
  id: string;
  vendorUserId: string;
  createdAt: string;
  updatedAt: string;
  isPublished: boolean;
  metadata: {
    name: string;
    category: string;
    description: string;
    tags: string[];
  };
  pricing: {
    currency: string;
    price: number;
  };
  previewVersions: Array<{
    versionId: string;
    modelUrl: string;
    generatedAt: string;
  }>;
  activeVersionId: string;
};

type AddOptions = {
  replace?: boolean;
};

const STORAGE_KEY = 'douche_vendor_drafts_v1';
const CURRENT_DRAFTS_KEY = 'douche_vendor_drafts_index_v1';

function defaultDrafts(): VendorDraft[] {
  return [];
}

function readDrafts(): VendorDraft[] {
  if (typeof window === 'undefined') return defaultDrafts();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultDrafts();
    const parsed = JSON.parse(raw) as VendorDraft[];
    return Array.isArray(parsed) ? parsed : defaultDrafts();
  } catch {
    return defaultDrafts();
  }
}

function writeDrafts(drafts: VendorDraft[]) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
}

export function getVendorDrafts(): VendorDraft[] {
  return readDrafts();
}

export function addVendorDraft(draft: VendorDraft, opts?: AddOptions) {
  const drafts = readDrafts();
  const replace = opts?.replace ?? false;

  const existingIndex = drafts.findIndex((d) => d.id === draft.id);

  let next: VendorDraft[];
  if (existingIndex >= 0) {
    if (replace) {
      next = [...drafts.slice(0, existingIndex), draft, ...drafts.slice(existingIndex + 1)];
    } else {
      // keep existing, add as new by ID collision? do nothing.
      next = drafts;
    }
  } else {
    next = [draft, ...drafts].slice(0, 100);
  }

  writeDrafts(next);

  try {
    window.localStorage.setItem(
      CURRENT_DRAFTS_KEY,
      JSON.stringify({ updatedAt: new Date().toISOString(), count: next.length })
    );
  } catch {
    // ignore
  }
}

export function clearVendorDrafts() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_DRAFTS_KEY);
}

