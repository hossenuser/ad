import { useCallback, useEffect, useRef, useState } from 'react';
import { catalog as bundled, type CatalogItem } from '../data/catalog';
import { OFFICIAL_URL } from './appInfo';

/**
 * Live sync with the Blogger site (mhappsgallery.blogspot.com).
 * - Uses the public Blogger feed over JSONP, so it works from the website,
 *   the installed desktop app and the Android WebView alike (no CORS needed).
 * - The last successful sync is cached; the bundled catalog is the final fallback,
 *   so the app keeps working fully offline.
 */

const CACHE_KEY = 'mh_live_catalog_v1';
const FEED = `${OFFICIAL_URL}/feeds/posts/summary`;
const PAGE = 150;
const MAX_ITEMS = 600;
const TIMEOUT_MS = 15000;
const REFRESH_MS = 5 * 60 * 1000; // re-check the website every 5 minutes while the app is open

interface FeedEntry {
  title?: { $t?: string };
  published?: { $t?: string };
  summary?: { $t?: string };
  category?: { term?: string }[];
  link?: { rel?: string; href?: string }[];
  media$thumbnail?: { url?: string };
}
interface FeedResponse {
  feed?: { entry?: FeedEntry[]; openSearch$totalResults?: { $t?: string } };
}

const KNOWN_CATEGORIES = ['Windows', 'Tools', 'Drivers', 'Games', 'Android', 'iOS', 'macOS', 'Apps', 'Guides'];
const BOILERPLATE = /welcome to mh apps gallery[^.]*?(guides|tools)\.?/i;

let cbCounter = 0;
function jsonp(url: string): Promise<FeedResponse> {
  return new Promise((resolve, reject) => {
    const name = `__mhFeedCb${Date.now()}_${cbCounter++}`;
    const w = window as unknown as Record<string, unknown>;
    const script = document.createElement('script');
    const cleanup = () => { delete w[name]; script.remove(); window.clearTimeout(timer); };
    const timer = window.setTimeout(() => { cleanup(); reject(new Error('timeout')); }, TIMEOUT_MS);
    w[name] = (data: FeedResponse) => { cleanup(); resolve(data); };
    script.onerror = () => { cleanup(); reject(new Error('network')); };
    script.src = `${url}${url.includes('?') ? '&' : '?'}alt=json-in-script&callback=${name}`;
    document.head.appendChild(script);
  });
}

function hashId(s: string): number {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return 1000 + (Math.abs(h) % 900000000);
}

function explicitCategory(labels: string[]): string | null {
  const hay = labels.join(' ').toLowerCase();
  for (const c of KNOWN_CATEGORIES) if (hay.includes(c.toLowerCase())) return c;
  return null;
}

function pickCategory(labels: string[], title: string): string {
  const hay = labels.join(' ').toLowerCase();
  const ex = explicitCategory(labels);
  if (ex) return ex;
  if (/pc version|windows|driver/i.test(`${hay} ${title}`)) return /driver/i.test(title) ? 'Drivers' : 'Windows';
  if (/android|apk/i.test(title)) return 'Android';
  return 'Apps';
}

function pickPlatform(category: string, title: string): string {
  if (/android|apk/i.test(`${category} ${title}`)) return 'Android';
  if (/ios|iphone|ipad/i.test(`${category} ${title}`)) return 'iOS';
  if (/macos|\bmac\b/i.test(`${category} ${title}`)) return 'macOS';
  return 'Windows 10 / 11';
}

function shortName(title: string): string {
  const t = title.replace(/\s+/g, ' ').trim();
  const cut = t.split(/\s+(?:latest|download|offline|lets|is a|is the|is an|free)\b/i)[0].trim();
  const out = cut.length >= 3 ? cut : t;
  return out.length > 56 ? `${out.slice(0, 53).trim()}…` : out;
}

function toItem(e: FeedEntry, known: Map<string, CatalogItem>): CatalogItem | null {
  const url = e.link?.find(l => l.rel === 'alternate')?.href;
  const title = e.title?.$t?.trim();
  if (!url || !title) return null;
  const old = known.get(url);
  const labels = (e.category || []).map(c => c.term || '').filter(Boolean);
  const category = explicitCategory(labels) || old?.category || pickCategory(labels, title);
  const thumb = e.media$thumbnail?.url?.replace(/\/s\d+(-c)?\//, '/s400/') || '';
  const desc = (e.summary?.$t || '').replace(BOILERPLATE, '').replace(/\s+/g, ' ').trim();
  return {
    id: old?.id ?? hashId(url),
    name: old && old.title === title ? old.name : shortName(title),
    title,
    image: thumb || old?.image || '',
    category,
    date: (e.published?.$t || '').slice(0, 10) || old?.date || '',
    url,
    platform: old?.platform || pickPlatform(category, title),
    format: old?.format || (category === 'Android' ? 'APK' : 'EXE'),
    license: old?.license || 'Official source',
    description: desc ? (desc.length > 150 ? `${desc.slice(0, 147)}…` : desc) : (old?.description || ''),
    featured: old?.featured ?? false,
  };
}

export async function fetchLiveCatalog(): Promise<CatalogItem[]> {
  const known = new Map(bundled.map(i => [i.url, i]));
  const items: CatalogItem[] = [];
  let start = 1;
  let total = Infinity;
  while (start <= total && items.length < MAX_ITEMS) {
    const data = await jsonp(`${FEED}?max-results=${PAGE}&start-index=${start}`);
    const entries = data.feed?.entry || [];
    total = Number(data.feed?.openSearch$totalResults?.$t) || entries.length;
    for (const e of entries) {
      const it = toItem(e, known);
      if (it) items.push(it);
    }
    if (entries.length < PAGE) break;
    start += PAGE;
  }
  if (!items.length) throw new Error('empty feed');
  items.sort((a, b) => b.date.localeCompare(a.date));
  // make sure the dashboard always has featured items
  let feat = items.filter(i => i.featured).length;
  for (const i of items) { if (feat >= 4) break; if (!i.featured) { i.featured = true; feat += 1; } }
  return items;
}

interface Cached { t: number; items: CatalogItem[] }
function readCache(): Cached | null {
  try {
    const raw = window.localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const c = JSON.parse(raw) as Cached;
    return Array.isArray(c.items) && c.items.length ? c : null;
  } catch { return null; }
}
function writeCache(c: Cached) {
  try { window.localStorage.setItem(CACHE_KEY, JSON.stringify(c)); } catch { /* storage may be unavailable */ }
}

export interface SyncResult { ok: boolean; added: number; total: number }

export function useLiveCatalog(enabled: boolean, autoSync: boolean) {
  const [state, setState] = useState(() => {
    const c = readCache();
    return { items: c?.items ?? bundled, syncedAt: c?.t ?? 0 };
  });
  const [syncing, setSyncing] = useState(false);
  const busy = useRef(false);
  const itemsRef = useRef(state.items);
  itemsRef.current = state.items;

  const sync = useCallback(async (): Promise<SyncResult> => {
    if (busy.current) return { ok: false, added: 0, total: itemsRef.current.length };
    busy.current = true;
    setSyncing(true);
    try {
      const fresh = await fetchLiveCatalog();
      const before = new Set(itemsRef.current.map(i => i.url));
      const added = fresh.filter(i => !before.has(i.url)).length;
      const t = Date.now();
      writeCache({ t, items: fresh });
      setState({ items: fresh, syncedAt: t });
      return { ok: true, added, total: fresh.length };
    } catch {
      return { ok: false, added: 0, total: itemsRef.current.length };
    } finally {
      busy.current = false;
      setSyncing(false);
    }
  }, []);

  const lastRun = useRef(0);
  const syncRef = useRef(sync);
  syncRef.current = sync;
  useEffect(() => {
    if (!enabled || !autoSync) return;
    const run = (minGapMs: number) => {
      if (document.visibilityState === 'hidden') return;
      if (Date.now() - lastRun.current < minGapMs) return;
      lastRun.current = Date.now();
      void syncRef.current();
    };
    run(0); // on open
    const timer = window.setInterval(() => run(REFRESH_MS - 1000), REFRESH_MS);
    const onFocus = () => run(60 * 1000);
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
    };
  }, [enabled, autoSync]);

  return { catalog: state.items, syncedAt: state.syncedAt, syncing, sync };
}
