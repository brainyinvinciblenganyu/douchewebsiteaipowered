export interface UserInteractions {
  viewedProductIds: number[];
  cartProductIds: number[];
  vrViewedIds: number[];
  generatedTags: string[];
  searchQueries: string[];
  lastViewedAt: Record<number, string>;
}

const STORAGE_KEY = 'douche_interactions';

function defaultState(): UserInteractions {
  return {
    viewedProductIds: [],
    cartProductIds: [],
    vrViewedIds: [],
    generatedTags: [],
    searchQueries: [],
    lastViewedAt: {},
  };
}

function read(): UserInteractions {
  if (typeof window === 'undefined') return defaultState();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? { ...defaultState(), ...JSON.parse(raw) } : defaultState();
  } catch {
    return defaultState();
  }
}

function write(state: UserInteractions) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  localStorage.setItem('viewedProducts', JSON.stringify(state.viewedProductIds));
}

function appendUnique(list: number[], id: number): number[] {
  const filtered = list.filter((x) => x !== id);
  return [id, ...filtered].slice(0, 20);
}

export function getInteractions(): UserInteractions {
  return read();
}

export function trackView(productId: number) {
  const state = read();
  state.viewedProductIds = appendUnique(state.viewedProductIds, productId);
  state.lastViewedAt[productId] = new Date().toISOString();
  write(state);
}

export function trackVR(productId: number) {
  const state = read();
  state.vrViewedIds = appendUnique(state.vrViewedIds, productId);
  state.viewedProductIds = appendUnique(state.viewedProductIds, productId);
  write(state);
}

export function trackCart(productIds: number[]) {
  const state = read();
  state.cartProductIds = productIds;
  write(state);
}

export function trackGeneration(tag: string) {
  const state = read();
  const tags = [tag, ...state.generatedTags.filter((t) => t !== tag)].slice(0, 10);
  state.generatedTags = tags;
  write(state);
}

export function trackSearch(query: string) {
  if (!query.trim()) return;
  const state = read();
  state.searchQueries = [query.trim(), ...state.searchQueries.filter((q) => q !== query)].slice(0, 10);
  write(state);
}
