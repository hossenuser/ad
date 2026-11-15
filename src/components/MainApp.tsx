import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownUp, ArrowRight, ArrowUpRight, Bell, Bookmark, BookmarkCheck,
  BookOpen, CalendarDays, Check, CheckCircle2, ChevronDown, ChevronRight,
  Clock3, Compass, Download, ExternalLink, FileArchive, FolderDown,
  Gamepad2, Globe, HardDrive, Info, LayoutDashboard, Library as LibraryIcon,
  Link2, Menu, Minus, Monitor, PackageOpen, Power, RefreshCw,
  RotateCw, Search, Settings, ShieldCheck, Smartphone, Sparkles, Square,
  Trash2, TrendingUp, Wifi, WifiOff, Wrench, X,
} from 'lucide-react';
import Logo from './Logo';
import { categories as baseCategories } from '../data/catalog';
import { useLiveCatalog } from '../lib/liveCatalog';
import { downloadApk } from '../lib/downloadApk';
import {
  APP_VERSION, OFFICIAL_URL, RELEASES, WHATSAPP_LINK,
  formatDate, nextCheckDate, UPDATE_INTERVAL_DAYS,
} from '../lib/appInfo';

type Page = 'dashboard' | 'browse' | 'library' | 'updates' | 'settings';
type Sort = 'latest' | 'az' | 'category';

interface MainAppProps {
  onExit: () => void;
  onRunSetup: () => void;
}

const LS = {
  saved: 'mh_saved_apps',
  installed: 'mh_installed_apps',
  lastCheck: 'mh_last_update_check',
  autoUpdate: 'mh_auto_update',
  workOffline: 'mh_work_offline',
  version: 'mh_app_version',
};

const store = {
  get(key: string): string | null {
    try { return window.localStorage.getItem(key); } catch { return null; }
  },
  set(key: string, value: string) {
    try { window.localStorage.setItem(key, value); } catch { /* storage may be unavailable */ }
  },
  remove(key: string) {
    try { window.localStorage.removeItem(key); } catch { /* storage may be unavailable */ }
  },
};

function readNumber(key: string, fallback: number) {
  const raw = store.get(key);
  const val = raw ? Number(raw) : NaN;
  return Number.isFinite(val) ? val : fallback;
}

function readBool(key: string, fallback: boolean) {
  const raw = store.get(key);
  return raw === null ? fallback : raw === 'true';
}

function readList(key: string): number[] {
  try {
    const raw = store.get(key);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((n): n is number => typeof n === 'number') : [];
  } catch {
    return [];
  }
}

function Thumb({ image, name, className = '' }: { image: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !image) {
    return (
      <div className={`flex items-center justify-center bg-[radial-gradient(circle_at_50%_40%,#12294a,#070f1d)] ${className}`}>
        <div className="text-center">
          <Logo size={46} className="mx-auto" />
          <p className="mt-1.5 line-clamp-2 px-2 text-[9px] font-semibold text-slate-500">{name}</p>
        </div>
      </div>
    );
  }
  return <img src={image} alt={name} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

function Sparkline() {
  return (
    <svg viewBox="0 0 120 32" className="h-8 w-24" fill="none">
      <path d="M2 26 L16 20 L28 23 L42 13 L56 17 L70 9 L84 13 L98 5 L118 8" stroke="url(#mhg)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <defs>
        <linearGradient id="mhg" x1="0" y1="0" x2="120" y2="0">
          <stop stopColor="#38bdf8" />
          <stop offset="1" stopColor="#22d3ee" />
        </linearGradient>
      </defs>
    </svg>
  );
}

const IS_ANDROID_APP = typeof window !== 'undefined' && window.location.protocol === 'file:';

export default function MainApp({ onExit, onRunSetup }: MainAppProps) {
  const [page, setPage] = useState<Page>('dashboard');
  const [category, setCategory] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('latest');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [exitOpen, setExitOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [now, setNow] = useState(new Date());
  const [booting, setBooting] = useState(true);
  const searchRef = useRef<HTMLInputElement>(null);

  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);
  const [workOffline, setWorkOffline] = useState(() => readBool(LS.workOffline, false));
  const [autoUpdate, setAutoUpdate] = useState(() => readBool(LS.autoUpdate, true));
  const [version, setVersion] = useState(() => store.get(LS.version) || APP_VERSION);
  const [lastCheck, setLastCheck] = useState(() => readNumber(LS.lastCheck, Date.now()));
  const [saved, setSaved] = useState<number[]>(() => readList(LS.saved));
  const [installed, setInstalled] = useState<number[]>(() => readList(LS.installed));
  const [checking, setChecking] = useState(false);
  const [checkedResult, setCheckedResult] = useState<'idle' | 'current'>('idle');
  const autoRan = useRef(false);

  const effectiveOffline = !online || workOffline;
  const { catalog, syncedAt, syncing, sync } = useLiveCatalog(!effectiveOffline, autoUpdate);
  const categories = useMemo(() => {
    const extra = Array.from(new Set(catalog.map(a => a.category))).filter(c => !(baseCategories as readonly string[]).includes(c));
    return [...baseCategories, ...extra];
  }, [catalog]);
  const latestVersion = RELEASES[0].version;
  const updateAvailable = version !== latestVersion;
  const selected = catalog.find(a => a.id === selectedId) || null;

  useEffect(() => { store.set(LS.saved, JSON.stringify(saved)); }, [saved]);
  useEffect(() => { store.set(LS.installed, JSON.stringify(installed)); }, [installed]);
  useEffect(() => { store.set(LS.autoUpdate, String(autoUpdate)); }, [autoUpdate]);
  useEffect(() => { store.set(LS.workOffline, String(workOffline)); }, [workOffline]);
  useEffect(() => { store.set(LS.version, version); }, [version]);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const boot = setTimeout(() => setBooting(false), 1400);
    return () => clearTimeout(boot);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setSelectedId(null);
        setNotifOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3600);
  };

  const saveApk = () => {
    const result = downloadApk();
    showToast(result.ok
      ? 'Android APK download started (MH Apps Gallery 2.2.0).'
      : 'Download blocked — please use the official blog to get the APK.');
  };

  const checkForUpdates = () => {
    if (checking) return;
    setChecking(true);
    setCheckedResult('idle');
    const minDelay = new Promise(r => setTimeout(r, 900));
    void Promise.all([effectiveOffline ? Promise.resolve(null) : sync(), minDelay]).then(([res]) => {
      const stamp = Date.now();
      setLastCheck(stamp);
      store.set(LS.lastCheck, String(stamp));
      setChecking(false);
      setCheckedResult('current');
      setVersion(latestVersion);
      if (effectiveOffline) showToast('You’re offline — showing your saved catalog.');
      else if (res && res.ok) showToast(res.added > 0
        ? `Synced with the website — ${res.added} new ${res.added === 1 ? 'release' : 'releases'} added (${res.total} total).`
        : `Synced with the website — catalog is up to date (${res.total} releases).`);
      else showToast('Couldn’t reach the website — showing your last saved catalog.');
    });
  };

  // automatic monthly check
  useEffect(() => {
    if (autoRan.current) return;
    autoRan.current = true;
    if (!autoUpdate) return;
    const due = Date.now() - lastCheck > UPDATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000;
    if (due) {
      const timer = setTimeout(() => {
        setLastCheck(Date.now());
        store.set(LS.lastCheck, String(Date.now()));
        setCheckedResult('current');
        showToast('Monthly update check completed automatically.');
      }, 2200);
      return () => clearTimeout(timer);
    }
  }, [autoUpdate, lastCheck]);

  const filtered = useMemo(() => {
    let list = catalog.filter(item => {
      const matchesCat = category === 'All' || item.category === category;
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || `${item.name} ${item.title} ${item.category} ${item.platform}`.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
    if (sort === 'az') list = [...list].sort((a, b) => a.name.localeCompare(b.name));
    else if (sort === 'category') list = [...list].sort((a, b) => a.category.localeCompare(b.category));
    else list = [...list].sort((a, b) => b.date.localeCompare(a.date));
    return list;
  }, [category, search, sort]);

  const savedApps = catalog.filter(a => saved.includes(a.id));
  const installedApps = catalog.filter(a => installed.includes(a.id));

  const toggleSave = (id: number) => {
    setSaved(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    showToast(saved.includes(id) ? 'Removed from your library.' : 'Saved to your library — available offline.');
  };

  const openDownload = (item: typeof catalog[number]) => {
    if (!effectiveOffline) {
      setInstalled(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
      window.open(item.url, '_blank', 'noopener,noreferrer');
      return;
    }
    setSelectedId(item.id);
    showToast('You’re offline. The official link will be ready when you reconnect.');
  };

  const navigate = (next: Page, cat?: string) => {
    setPage(next);
    setSidebarOpen(false);
    if (cat) setCategory(cat);
    if (next === 'browse') setSearch('');
  };

  const pageTitles: Record<Page, string> = {
    dashboard: 'Dashboard',
    browse: 'Browse catalog',
    library: 'My library',
    updates: 'Update center',
    settings: 'Settings',
  };

  const categoryCount = (cat: string) => cat === 'All' ? catalog.length : catalog.filter(a => a.category === cat).length;

  // ---------- App card ----------
  const AppCard = ({ item, compact = false }: { item: typeof catalog[number]; compact?: boolean }) => {
    const isSaved = saved.includes(item.id);
    return (
      <article
        onClick={() => setSelectedId(item.id)}
        className="group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-white/[0.07] bg-[#0c1526] transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/30 hover:bg-[#0e1a2e] hover:shadow-lg hover:shadow-black/40"
      >
        <div className={`relative overflow-hidden bg-slate-900 ${compact ? 'h-28' : 'h-36'}`}>
          <Thumb image={item.image} name={item.name} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-[1.04] group-hover:opacity-100" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0c1526] via-[#0c1526]/10 to-transparent" />
          <span className="absolute left-2.5 top-2.5 rounded-md border border-white/10 bg-black/55 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
            {item.category}
          </span>
          <button
            onClick={e => { e.stopPropagation(); toggleSave(item.id); }}
            title={isSaved ? 'Remove from library' : 'Save to library'}
            className={`absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md border backdrop-blur transition ${
              isSaved
                ? 'border-sky-400/30 bg-sky-500/25 text-sky-300'
                : 'border-white/10 bg-black/45 text-slate-300 hover:bg-black/70 hover:text-white'
            }`}
          >
            {isSaved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          </button>
        </div>

        <div className="flex flex-1 flex-col p-3.5">
          <h3 className="line-clamp-2 min-h-[34px] text-[12.5px] font-bold leading-snug text-slate-100 group-hover:text-white">
            {item.name}
          </h3>
          <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-500">
            <Monitor className="h-2.5 w-2.5" /> {item.platform}
          </p>
          <div className="mt-2.5 flex items-center gap-1.5 text-[9.5px] text-slate-500">
            <span className="rounded bg-white/[0.05] px-1.5 py-0.5 font-mono text-slate-400">{item.format}</span>
            <span className={`rounded px-1.5 py-0.5 font-semibold ${
              item.license === 'Free' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
            }`}>{item.license}</span>
            <span className="ml-auto flex items-center gap-1"><Clock3 className="h-2.5 w-2.5" /> {formatDate(item.date).replace(' 2026', '')}</span>
          </div>

          <div className="mt-3 flex gap-1.5">
            <button
              onClick={e => { e.stopPropagation(); openDownload(item); }}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-[11px] font-semibold transition ${
                effectiveOffline
                  ? 'border border-white/10 bg-white/[0.03] text-slate-500 hover:text-slate-300'
                  : 'bg-sky-500/90 text-[#04101f] hover:bg-sky-400'
              }`}
            >
              {effectiveOffline ? <WifiOff className="h-3 w-3" /> : <Download className="h-3 w-3" />}
              {effectiveOffline ? 'Offline' : 'Download'}
            </button>
            <button
              onClick={e => { e.stopPropagation(); setSelectedId(item.id); }}
              className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 text-slate-400 transition hover:border-white/20 hover:text-white"
              title="View details"
            >
              <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </div>
      </article>
    );
  };

  // ---------- Pages ----------
  const Dashboard = () => (
    <div className="space-y-5 animate-fade-in">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-2xl border border-sky-500/15 bg-[radial-gradient(ellipse_at_80%_20%,rgba(20,132,255,0.24),transparent_60%),linear-gradient(120deg,#0a1a30_0%,#0a1424_55%,#08111f_100%)] p-5 sm:p-7">
        <div className="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-sky-500/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="min-w-0 flex-1">
            <div className="mb-2.5 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold text-emerald-400">
                <span className={`h-1.5 w-1.5 rounded-full ${effectiveOffline ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                {effectiveOffline ? 'Offline mode' : 'Online'}
              </span>
              <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-semibold text-slate-400">
                v{version} · October 2026
              </span>
              {checkedResult === 'current' && (
                <span className="flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-semibold text-sky-300">
                  <CheckCircle2 className="h-3 w-3" /> Up to date
                </span>
              )}
            </div>
            <h1 className="font-display text-[24px] font-extrabold leading-tight text-white sm:text-[30px]">
              Everything you need,<br />
              <span className="text-gradient">one click away.</span>
            </h1>
            <p className="mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-400">
              {effectiveOffline
                ? 'You’re offline — your saved catalog is still right here. Reconnect to download from official links.'
                : 'Browse this month’s hand-picked releases from MH Apps Gallery. One library, always up to date.'}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button onClick={() => navigate('browse')} className="flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2.5 text-[12px] font-bold text-white shadow-lg shadow-blue-900/30 transition hover:brightness-110">
                <Compass className="h-3.5 w-3.5" /> Browse catalog
              </button>
              <button onClick={() => setPage('updates')} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-[12px] font-semibold text-slate-200 transition hover:border-sky-500/30 hover:bg-white/[0.08]">
                <RefreshCw className="h-3.5 w-3.5" /> Update center
              </button>
            </div>
          </div>
          <div className="flex flex-shrink-0 items-center justify-center gap-4 sm:block">
            <Logo size={116} glow className="sm:mx-auto" />
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Catalog items', value: `${catalog.length}`, sub: '+6 this month', icon: PackageOpen, color: 'text-sky-400 bg-sky-500/10' },
          { label: 'Saved offline', value: `${saved.length}`, sub: 'in your library', icon: BookmarkCheck, color: 'text-cyan-400 bg-cyan-500/10' },
          { label: 'Downloaded', value: `${installed.length}`, sub: 'from the gallery', icon: FolderDown, color: 'text-violet-400 bg-violet-500/10' },
          { label: 'Last update check', value: formatDate(new Date(lastCheck).toISOString().slice(0, 10)).replace(' 2026', ''), sub: `next ${nextCheckDate(lastCheck)}`, icon: CalendarDays, color: 'text-amber-400 bg-amber-500/10' },
        ].map(({ label, value, sub, icon: Icon, color }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-[#0b1424] p-3.5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[10.5px] text-slate-500">{label}</p>
                <p className="mt-1 font-display text-xl font-extrabold text-white">{value}</p>
                <p className="mt-0.5 text-[9.5px] text-slate-500">{sub}</p>
              </div>
              <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                <Icon className="h-4 w-4" />
              </div>
            </div>
          </div>
        ))}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_280px]">
        <div className="min-w-0 space-y-5">
          {/* Featured */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-[15px] font-extrabold text-white">
                  <Sparkles className="h-4 w-4 text-sky-400" /> Featured this month
                </h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">Most useful releases from the MH Apps Gallery blog</p>
              </div>
              <button onClick={() => navigate('browse')} className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300">
                View all <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {catalog.filter(a => a.featured).slice(0, 4).map(item => <AppCard key={item.id} item={item} compact />)}
            </div>
          </section>

          {/* Latest */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2 font-display text-[15px] font-extrabold text-white">
                  <TrendingUp className="h-4 w-4 text-cyan-400" /> Latest releases
                </h2>
                <p className="mt-0.5 text-[10.5px] text-slate-500">Added on {formatDate(catalog[0].date)}</p>
              </div>
              <button onClick={() => navigate('browse')} className="flex items-center gap-1 text-[11px] font-semibold text-sky-400 hover:text-sky-300">
                Open catalog <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {catalog.slice(0, 6).map(item => <AppCard key={item.id} item={item} />)}
            </div>
          </section>
        </div>

        {/* Side rail */}
        <aside className="space-y-3">
          <div className="rounded-xl border border-white/[0.08] bg-gradient-to-b from-sky-950/50 to-[#0a1424] p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/15">
                <RefreshCw className="h-4 w-4 text-sky-400" />
              </div>
              <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-300">MONTHLY</span>
            </div>
            <h3 className="text-[12.5px] font-bold text-white">Software update</h3>
            <p className="mt-1 text-[10.5px] leading-relaxed text-slate-400">
              {updateAvailable
                ? `Version ${latestVersion} is available. Update now to get this month's catalog.`
                : `You're on v${version}. The next monthly check runs on ${nextCheckDate(lastCheck)}.`}
            </p>
            <button
              onClick={checkForUpdates}
              disabled={checking || effectiveOffline}
              className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-500/25 bg-sky-500/15 px-3 py-2 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/25 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
              {checking ? 'Checking…' : effectiveOffline ? 'Offline' : 'Check for updates'}
            </button>
            <button onClick={() => setPage('updates')} className="mt-1.5 w-full text-center text-[10px] text-slate-500 hover:text-slate-300">
              View changelog and schedule
            </button>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0b1424] p-4">
            <h3 className="flex items-center gap-1.5 text-[11.5px] font-bold text-white"><Globe className="h-3.5 w-3.5 text-sky-400" /> Official blog</h3>
            <p className="mt-1.5 text-[10.5px] leading-relaxed text-slate-500">
              Every release links to its original post on mhappsgallery.blogspot.com.
            </p>
            <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="mt-2.5 flex items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-[10px] font-medium text-slate-300 transition hover:border-sky-500/25 hover:text-white">
              mhappsgallery.blogspot.com <ExternalLink className="h-3 w-3" />
            </a>
          </div>

          <div className="rounded-xl border border-emerald-500/15 bg-emerald-500/[0.05] p-4">
            <h3 className="flex items-center gap-1.5 text-[11.5px] font-bold text-emerald-300"><ShieldCheck className="h-3.5 w-3.5" /> Verified sources</h3>
            <p className="mt-1 text-[10.5px] leading-relaxed text-emerald-600/90">
              Official or permissioned links only. No cracked or modified files.
            </p>
          </div>

          <div className="rounded-xl border border-white/[0.07] bg-[#0b1424] p-4">
            <p className="text-[10px] uppercase tracking-wider text-slate-500">Catalog activity</p>
            <div className="mt-2 flex items-end justify-between">
              <p className="font-display text-xl font-extrabold text-white">+6 <span className="text-[10px] font-medium text-slate-500">this month</span></p>
              <Sparkline />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );

  const Browse = () => (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">{search ? `Search results` : category === 'All' ? 'All software' : category}</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">
            {search ? `Showing matches for “${search}”` : `${category === 'All' ? 'Official releases' : category + ' releases'} from MH Apps Gallery`} · {filtered.length} item{filtered.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <ArrowDownUp className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
            <select
              value={sort}
              onChange={e => setSort(e.target.value as Sort)}
              className="appearance-none rounded-lg border border-white/[0.08] bg-[#0b1424] py-2 pl-7 pr-7 text-[11px] font-medium text-slate-300 outline-none transition hover:border-white/20 focus:border-sky-500/40"
            >
              <option value="latest">Latest first</option>
              <option value="az">Name A–Z</option>
              <option value="category">Category</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>

      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`flex flex-shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-semibold transition ${
              category === cat
                ? 'border-sky-500/30 bg-sky-500/15 text-sky-300'
                : 'border-white/[0.07] bg-white/[0.025] text-slate-400 hover:border-white/15 hover:text-slate-200'
            }`}
          >
            {cat}
            <span className={`rounded px-1 text-[9px] ${category === cat ? 'bg-sky-400/20' : 'bg-white/[0.05]'}`}>
              {categoryCount(cat) || 'Soon'}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 py-16 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10">
            {search || category === 'All' ? <Search className="h-6 w-6 text-sky-400" /> : <PackageOpen className="h-6 w-6 text-sky-400" />}
          </div>
          <h3 className="mt-4 font-display text-base font-bold text-white">
            {search ? `No results for “${search}”` : `No ${category.toLowerCase()} releases yet`}
          </h3>
          <p className="mt-1.5 max-w-sm text-[11.5px] leading-relaxed text-slate-500">
            {search
              ? 'Try a different name, or clear the search to browse the full catalog.'
              : 'New categories are added with the monthly catalog update. In the meantime, everything new lands on the official blog first.'}
          </p>
          <div className="mt-4 flex gap-2">
            {search && (
              <button onClick={() => setSearch('')} className="rounded-lg border border-white/10 bg-white/[0.05] px-3.5 py-2 text-[11px] font-semibold text-slate-200 hover:bg-white/[0.08]">
                Clear search
              </button>
            )}
            <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 rounded-lg brand-gradient px-3.5 py-2 text-[11px] font-bold text-white hover:brightness-110">
              <Globe className="h-3.5 w-3.5" /> Visit the blog
            </a>
          </div>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {filtered.map(item => <AppCard key={item.id} item={item} />)}
        </div>
      )}
    </div>
  );

  const Library = () => (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">My library</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">Saved releases stay available even when you’re offline.</p>
        </div>
        <div className="flex gap-2">
          {saved.length > 0 && (
            <button
              onClick={() => { setSaved([]); showToast('Library cleared.'); }}
              className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[11px] font-semibold text-slate-400 transition hover:border-rose-500/30 hover:text-rose-300"
            >
              <Trash2 className="h-3 w-3" /> Clear library
            </button>
          )}
          <button onClick={() => navigate('browse')} className="flex items-center gap-1.5 rounded-lg brand-gradient px-3.5 py-2 text-[11px] font-bold text-white transition hover:brightness-110">
            <Compass className="h-3 w-3" /> Browse apps
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: 'Saved apps', value: saved.length, icon: BookmarkCheck },
          { label: 'Downloaded', value: installedApps.length, icon: FolderDown },
          { label: 'Offline ready', value: effectiveOffline ? 'Yes' : 'Standby', icon: WifiOff },
          { label: 'Current version', value: `v${version}`, icon: ShieldCheck },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-xl border border-white/[0.07] bg-[#0b1424] p-3.5">
            <Icon className="h-4 w-4 text-sky-400" />
            <p className="mt-2 font-display text-lg font-extrabold text-white">{value}</p>
            <p className="text-[10px] text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="mb-2.5 flex items-center gap-2 font-display text-[14px] font-extrabold text-white">
          <BookmarkCheck className="h-4 w-4 text-sky-400" /> Saved releases
        </h2>
        {savedApps.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.015] px-6 py-14 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-sky-500/10">
              <Bookmark className="h-6 w-6 text-sky-400" />
            </div>
            <h3 className="mt-4 font-display text-base font-bold text-white">Your library is empty</h3>
            <p className="mt-1.5 max-w-sm text-[11.5px] leading-relaxed text-slate-500">
              Tap the bookmark on any app to save it here. Saved releases are cached for offline browsing.
            </p>
            <button onClick={() => navigate('browse')} className="mt-4 flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2 text-[11px] font-bold text-white">
              <Compass className="h-3.5 w-3.5" /> Discover apps
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
            {savedApps.map(item => <AppCard key={item.id} item={item} />)}
          </div>
        )}
      </div>

      {installedApps.length > 0 && (
        <div>
          <h2 className="mb-2.5 mt-5 flex items-center gap-2 font-display text-[14px] font-extrabold text-white">
            <FolderDown className="h-4 w-4 text-cyan-400" /> Recently downloaded
          </h2>
          <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#0b1424]">
            {installedApps.map((item, i) => (
              <div key={item.id} className={`flex items-center gap-3 px-3.5 py-2.5 ${i !== installedApps.length - 1 ? 'border-b border-white/[0.05]' : ''}`}>
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-md">
                  <Thumb image={item.image} name={item.name} className="h-full w-full object-cover" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[11.5px] font-semibold text-slate-200">{item.name}</p>
                  <p className="text-[9.5px] text-slate-500">{item.category} · {item.format} · {formatDate(item.date)}</p>
                </div>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 rounded-md border border-white/[0.08] px-2 py-1 text-[10px] text-slate-400 hover:border-sky-500/25 hover:text-sky-300">
                  Open <ExternalLink className="h-2.5 w-2.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const Updates = () => (
    <div className="animate-fade-in space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">Update center</h1>
          <p className="mt-1 text-[11.5px] text-slate-500">Monthly software updates, changelog and automatic check schedule.</p>
        </div>
        <button
          onClick={checkForUpdates}
          disabled={checking || effectiveOffline}
          className="flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2 text-[11.5px] font-bold text-white transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking for updates…' : 'Check for updates'}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <div className="flex flex-wrap items-center gap-4">
            <Logo size={64} />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase tracking-widest text-slate-500">MH Apps Gallery Desktop</p>
              <h2 className="font-display text-lg font-extrabold text-white">Version {version}</h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-emerald-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {updateAvailable ? `Update available (v${latestVersion})` : 'Latest version installed'}
              </p>
            </div>
            <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1 text-[10px] font-bold text-sky-300">STABLE</span>
          </div>

          <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
            {[
              { icon: Clock3, label: 'Last checked', value: formatDate(new Date(lastCheck).toISOString().slice(0, 10)) },
              { icon: CalendarDays, label: 'Next automatic check', value: nextCheckDate(lastCheck) },
              { icon: RotateCw, label: 'Update cycle', value: `Every ${UPDATE_INTERVAL_DAYS} days` },
              { icon: Wifi, label: 'Download channel', value: effectiveOffline ? 'Offline — cached' : 'Official blog links' },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <Icon className="h-3.5 w-3.5 flex-shrink-0 text-sky-400" />
                <div className="min-w-0">
                  <p className="text-[9.5px] text-slate-500">{label}</p>
                  <p className="truncate text-[11px] font-semibold text-slate-200">{value}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] p-3.5">
            <div>
              <p className="text-[11.5px] font-semibold text-slate-200">Automatic monthly checks</p>
              <p className="mt-0.5 text-[10px] text-slate-500">Keep the catalog fresh without thinking about it.</p>
            </div>
            <button
              onClick={() => { setAutoUpdate(v => !v); showToast(autoUpdate ? 'Automatic update checks disabled.' : 'Automatic monthly checks enabled.'); }}
              className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${autoUpdate ? 'bg-sky-500' : 'bg-slate-700'}`}
              aria-label="Toggle automatic updates"
            >
              <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${autoUpdate ? 'left-[18px]' : 'left-0.5'}`} />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-sky-500/15 bg-sky-500/[0.05] px-3.5 py-2.5">
            <p className="flex items-center gap-1.5 text-[10.5px] text-sky-300/80">
              <ShieldCheck className="h-3.5 w-3.5" /> Updates are delivered from mhappsgallery.blogspot.com
            </p>
            <button onClick={onRunSetup} className="text-[10.5px] font-semibold text-sky-300 hover:text-sky-200">Repair installation</button>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 font-display text-[14px] font-extrabold text-white"><BookOpen className="h-4 w-4 text-sky-400" /> Changelog</h3>
            <span className="text-[9.5px] text-slate-500">3 releases</span>
          </div>
          <div className="mt-4 space-y-4">
            {RELEASES.map((release, idx) => (
              <div key={release.version} className="relative pl-4">
                {idx !== RELEASES.length - 1 && <span className="absolute left-[3px] top-3 h-full w-px bg-white/[0.08]" />}
                <span className={`absolute left-0 top-1.5 h-1.5 w-1.5 rounded-full ${idx === 0 ? 'bg-sky-400 ring-4 ring-sky-500/10' : 'bg-slate-600'}`} />
                <div className="flex flex-wrap items-center gap-1.5">
                  <p className="text-[11.5px] font-bold text-slate-100">v{release.version}</p>
                  <span className="text-[9.5px] text-slate-500">{release.date}</span>
                  {idx === 0 && <span className="rounded bg-sky-500/15 px-1 py-0.5 text-[8px] font-bold text-sky-300">LATEST</span>}
                </div>
                <p className="mt-0.5 text-[10.5px] text-slate-400">{release.title}</p>
                <ul className="mt-1.5 space-y-1">
                  {release.changes.slice(0, idx === 0 ? 3 : 2).map(change => (
                    <li key={change} className="flex gap-1.5 text-[9.5px] leading-relaxed text-slate-500">
                      <Check className="mt-0.5 h-2.5 w-2.5 flex-shrink-0 text-emerald-500" /> {change}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.07] bg-[#0b1424] px-4 py-3">
        <p className="flex items-center gap-2 text-[10.5px] text-slate-500">
          <Info className="h-3.5 w-3.5" /> Updates include a refreshed catalog and app improvements. No restart is required for catalog updates.
        </p>
        <button onClick={onRunSetup} className="flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-[10.5px] font-semibold text-slate-300 hover:border-sky-500/25 hover:text-white">
          <Power className="h-3 w-3" /> Run setup again
        </button>
      </div>
    </div>
  );

  const SettingsPage = () => (
    <div className="animate-fade-in space-y-4">
      <div>
        <h1 className="font-display text-xl font-extrabold text-white sm:text-2xl">Settings</h1>
        <p className="mt-1 text-[11.5px] text-slate-500">Manage updates, offline mode, storage and the installed app.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-extrabold text-white"><Settings className="h-4 w-4 text-sky-400" /> General</h2>
          <div className="space-y-1">
            {[
              { key: 'auto', label: 'Automatic monthly updates', desc: `Check for a new catalog every ${UPDATE_INTERVAL_DAYS} days`, value: autoUpdate, toggle: () => { setAutoUpdate(v => !v); showToast(autoUpdate ? 'Automatic updates off.' : 'Automatic monthly updates on.'); } },
              { key: 'offline', label: 'Work offline', desc: 'Browse the cached catalog without a connection', value: workOffline, toggle: () => { setWorkOffline(v => !v); showToast(workOffline ? 'Back online.' : 'Offline mode enabled.'); } },
            ].map(row => (
              <div key={row.key} className="flex items-center justify-between gap-3 border-b border-white/[0.05] py-3 last:border-0">
                <div>
                  <p className="text-[11.5px] font-semibold text-slate-200">{row.label}</p>
                  <p className="mt-0.5 text-[10px] text-slate-500">{row.desc}</p>
                </div>
                <button
                  onClick={row.toggle}
                  className={`relative h-5 w-9 flex-shrink-0 rounded-full transition ${row.value ? 'bg-sky-500' : 'bg-slate-700'}`}
                  aria-label={row.label}
                >
                  <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${row.value ? 'left-[18px]' : 'left-0.5'}`} />
                </button>
              </div>
            ))}
            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <p className="text-[11.5px] font-semibold text-slate-200">Connection status</p>
                <p className="mt-0.5 text-[10px] text-slate-500">{online ? 'Connected to the internet' : 'No internet connection detected'}</p>
              </div>
              <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-semibold ${
                effectiveOffline ? 'border-amber-500/20 bg-amber-500/10 text-amber-400' : 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              }`}>
                {effectiveOffline ? <WifiOff className="h-3 w-3" /> : <Wifi className="h-3 w-3" />}
                {effectiveOffline ? 'Offline' : 'Online'}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-extrabold text-white"><HardDrive className="h-4 w-4 text-cyan-400" /> Storage &amp; library</h2>
          <div className="space-y-2.5 text-[11px]">
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
              <span className="text-slate-500">Saved releases</span>
              <span className="font-semibold text-slate-200">{saved.length} items</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
              <span className="text-slate-500">Downloaded releases</span>
              <span className="font-semibold text-slate-200">{installed.length} items</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/[0.05] pb-2.5">
              <span className="text-slate-500">Offline catalog</span>
              <span className="flex items-center gap-1 font-semibold text-emerald-400"><CheckCircle2 className="h-3 w-3" /> Cached</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Local data</span>
              <span className="font-mono text-[10.5px] text-slate-400">≈ 1.2 MB</span>
            </div>
          </div>
          <button
            onClick={() => {
              setSaved([]);
              setInstalled([]);
              store.remove(LS.saved);
              store.remove(LS.installed);
              showToast('Local library and download history cleared.');
            }}
            className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-[10.5px] font-semibold text-slate-300 transition hover:border-rose-500/30 hover:text-rose-300"
          >
            <Trash2 className="h-3 w-3" /> Clear local data
          </button>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-extrabold text-white"><Info className="h-4 w-4 text-sky-400" /> About</h2>
          <div className="flex items-center gap-3">
            <Logo size={56} />
            <div>
              <p className="text-[13px] font-extrabold text-white">MH Apps Gallery</p>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Your Apps &amp; Software Hub</p>
              <p className="mt-1 text-[10px] text-sky-400">Version {version} · Windows 10/11</p>
            </div>
          </div>
          <div className="mt-3 space-y-2 text-[10.5px]">
            <div className="flex justify-between"><span className="text-slate-500">Publisher</span><span className="text-slate-200">MH Apps Gallery</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Installed</span><span className="text-slate-200">October 2026</span></div>
            <div className="flex justify-between">
              <span className="text-slate-500">Android APK</span>
              {IS_ANDROID_APP
                ? <span className="flex items-center gap-1 text-emerald-400"><Smartphone className="h-2.5 w-2.5" /> Installed</span>
                : <button onClick={saveApk} className="text-sky-400 hover:text-sky-300">v2.2.0 · 0.5 MB</button>}
            </div>
            <div className="flex justify-between"><span className="text-slate-500">Website</span>
              <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sky-400 hover:text-sky-300">mhappsgallery.blogspot.com <ExternalLink className="h-2.5 w-2.5" /></a>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.08] bg-[#0b1424] p-5">
          <h2 className="mb-3 flex items-center gap-2 font-display text-[13px] font-extrabold text-white"><ShieldCheck className="h-4 w-4 text-emerald-400" /> App actions</h2>
          <div className="space-y-2">
            <button onClick={onRunSetup} className="flex w-full items-center justify-between rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-[11px] font-semibold text-slate-200 transition hover:border-sky-500/25">
              Repair or reinstall app <RotateCw className="h-3 w-3 text-slate-500" />
            </button>
            {!IS_ANDROID_APP && (
              <button onClick={saveApk} className="flex w-full items-center justify-between rounded-lg border border-sky-500/15 bg-sky-500/[0.05] px-3 py-2.5 text-[11px] font-semibold text-sky-300 transition hover:bg-sky-500/[0.1]">
                Get the Android APK <Smartphone className="h-3 w-3" />
              </button>
            )}
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="flex w-full items-center justify-between rounded-lg border border-emerald-500/15 bg-emerald-500/[0.05] px-3 py-2.5 text-[11px] font-semibold text-emerald-300 transition hover:bg-emerald-500/[0.1]">
              Get help on WhatsApp <ArrowUpRight className="h-3 w-3" />
            </a>
            <button onClick={() => setExitOpen(true)} className="flex w-full items-center justify-between rounded-lg border border-rose-500/15 bg-rose-500/[0.04] px-3 py-2.5 text-[11px] font-semibold text-rose-300 transition hover:bg-rose-500/[0.09]">
              Uninstall MH Apps Gallery <Power className="h-3 w-3" />
            </button>
          </div>
          <p className="mt-3 text-[9.5px] leading-relaxed text-slate-600">
            Uninstalling removes the app and its local cache from this browser profile. Your blog links remain unchanged.
          </p>
        </div>
      </div>
    </div>
  );

  // ---------- Launch splash ----------
  if (booting) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#05080f] px-6">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-600/10 blur-[110px]" />
          <div className="absolute inset-0 grid-bg opacity-40" />
        </div>
        <div className="relative flex flex-col items-center animate-scale-in">
          <Logo size={110} glow className="animate-pulse-ring" />
          <h1 className="mt-6 font-display text-xl font-extrabold text-white">MH APPS <span className="text-sky-400">GALLERY</span></h1>
          <p className="mt-1 text-[9px] uppercase tracking-[0.28em] text-slate-500">Your Apps &amp; Software Hub</p>
          <div className="mt-7 h-[3px] w-44 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-sky-500 to-cyan-400" style={{ animation: 'mh-scan 1.2s ease-in-out infinite' }} />
          </div>
          <p className="mt-3 text-[10px] text-slate-500">Launching version {version}…</p>
        </div>
        <div className="absolute bottom-6 flex items-center gap-2 text-[9px] text-slate-600">
          <ShieldCheck className="h-3 w-3 text-sky-600" /> Verified installation · mhappsgallery.blogspot.com
        </div>
      </div>
    );
  }

  // ---------- Minimized desktop ----------
  if (minimized) {
    return (
      <div className="relative flex h-screen flex-col overflow-hidden bg-[#071120]" style={{ fontFamily: 'Inter, sans-serif' }}>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_20%,#123a6e_0%,#081a31_45%,#050b14_100%)]" />
        <div className="absolute inset-0 grid-bg opacity-50" />
        <div className="relative z-10 flex items-start gap-5 p-7">
          <button onClick={() => setMinimized(false)} className="group flex w-20 flex-col items-center gap-2 rounded-lg p-2 transition hover:bg-white/[0.06]">
            <Logo size={52} />
            <span className="text-[10.5px] font-medium text-slate-300 group-hover:text-white">MH Apps Gallery</span>
          </button>
          <div className="flex w-20 flex-col items-center gap-2 rounded-lg p-2 opacity-60">
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full border border-white/15 bg-white/[0.06]">
              <Globe className="h-6 w-6 text-sky-300" />
            </div>
            <span className="text-center text-[10.5px] text-slate-400">MH Apps Blog</span>
          </div>
        </div>

        <div className="relative z-10 mt-auto flex flex-col items-center pb-16">
          <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/25 px-5 py-2.5 backdrop-blur">
            <Logo size={26} />
            <p className="text-[11px] text-slate-300">MH Apps Gallery is minimized to the desktop</p>
            <button onClick={() => setMinimized(false)} className="rounded-full bg-sky-500 px-3 py-1 text-[10px] font-bold text-[#04101f] hover:bg-sky-400">Restore</button>
          </div>
          <p className="mt-4 text-[10px] text-slate-600">Click the app icon or Restore to continue.</p>
        </div>

        <div className="relative z-10 flex h-12 items-center gap-2 border-t border-white/10 bg-[#050b14]/85 px-3 backdrop-blur-xl">
          <button className="flex h-9 w-9 items-center justify-center rounded-md bg-white/[0.06]"><Logo size={22} /></button>
          <button onClick={() => setMinimized(false)} className="flex items-center gap-1.5 rounded-md bg-sky-500/15 px-2.5 py-1.5 text-[10px] font-semibold text-sky-300"><Logo size={16} /> MH Apps Gallery</button>
          <div className="ml-auto flex items-center gap-3 text-[10px] text-slate-400">
            <Wifi className="h-3.5 w-3.5 text-emerald-400" />
            <div className="text-right leading-tight">
              <p>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
              <p className="text-slate-600">{now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
            </div>
            <button onClick={() => setMinimized(false)} className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.05] hover:bg-white/[0.1]"><Square className="h-3 w-3" /></button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-[#05080f] p-0 sm:p-2.5 lg:p-4">
      <div className="relative mx-auto flex h-full w-full max-w-[1560px] flex-col overflow-hidden rounded-none border-0 border-white/10 bg-[#080f1c] sm:rounded-xl sm:border win-shadow">

        {/* Toast */}
        {toast && (
          <div className="absolute right-4 top-14 z-[60] max-w-xs animate-fade-up rounded-lg border border-sky-500/25 bg-[#0d1b2e]/95 px-3.5 py-2.5 text-[11px] text-slate-200 shadow-2xl backdrop-blur">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
              <span>{toast}</span>
            </div>
          </div>
        )}

        {/* Title bar */}
        <div className="flex h-10 flex-shrink-0 items-center gap-2 border-b border-white/[0.07] bg-[#070e19] px-2.5 sm:px-3.5">
          <button onClick={() => setSidebarOpen(v => !v)} className="flex h-7 w-7 items-center justify-center rounded text-slate-500 hover:bg-white/[0.06] hover:text-slate-200 lg:hidden" aria-label="Toggle menu">
            <Menu className="h-4 w-4" />
          </button>
          <Logo size={20} />
          <p className="truncate text-[11px] font-semibold text-slate-300">MH Apps Gallery</p>
          <span className="hidden rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] font-medium text-slate-500 sm:inline">v{version}</span>
          <span className="mx-1 hidden h-3 w-px bg-white/10 sm:block" />
          <p className="hidden flex-1 text-[10px] text-slate-600 sm:block">Your Apps &amp; Software Hub</p>
          <div className="ml-auto flex items-center">
            <div className="mr-2 hidden items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-2 py-0.5 text-[9px] text-slate-500 md:flex">
              <span className={`h-1.5 w-1.5 rounded-full ${effectiveOffline ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              {effectiveOffline ? 'Offline mode' : 'Connected'}
            </div>
            <button onClick={() => setMinimized(true)} title="Minimize" className="flex h-7 w-8 items-center justify-center text-slate-500 transition hover:bg-white/[0.07] hover:text-slate-200">
              <Minus className="h-3 w-3" />
            </button>
            <button title="Maximized" className="hidden h-7 w-8 items-center justify-center text-slate-600 sm:flex">
              <Square className="h-2.5 w-2.5" />
            </button>
            <button onClick={() => setExitOpen(true)} title="Close" className="flex h-7 w-8 items-center justify-center text-slate-500 transition hover:bg-rose-500/80 hover:text-white">
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Offline banner */}
        {effectiveOffline && (
          <div className="flex flex-shrink-0 items-center justify-center gap-2 border-b border-amber-500/15 bg-amber-500/[0.07] px-3 py-1 text-[10px] text-amber-300">
            <WifiOff className="h-3 w-3" />
            Offline mode — your cached catalog and library are still available. Downloads resume when you reconnect.
            <button onClick={() => setWorkOffline(false)} className="ml-1 rounded border border-amber-500/30 px-1.5 py-0.5 text-[9px] font-semibold hover:bg-amber-500/15">
              Go online
            </button>
          </div>
        )}

        <div className="relative flex min-h-0 flex-1">
          {/* Mobile overlay */}
          {sidebarOpen && <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} />}

          {/* Sidebar */}
          <aside className={`absolute inset-y-0 left-0 z-40 flex w-[236px] flex-col border-r border-white/[0.07] bg-[#080f1c] transition-transform duration-300 lg:static lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex flex-col items-center border-b border-white/[0.06] px-4 py-4">
              <Logo size={64} glow />
              <p className="mt-2 text-[12px] font-extrabold tracking-wide text-white">MH APPS <span className="text-sky-400">GALLERY</span></p>
              <p className="text-[8px] uppercase tracking-[0.22em] text-slate-500">Your Apps &amp; Software Hub</p>
              <button onClick={() => { setSidebarOpen(false); window.open(OFFICIAL_URL, '_blank', 'noopener,noreferrer'); }} className="mt-2 flex items-center gap-1 rounded-full border border-sky-500/20 bg-sky-500/[0.07] px-2.5 py-0.5 text-[8.5px] text-sky-300 transition hover:bg-sky-500/[0.12]">
                <Globe className="h-2.5 w-2.5" /> mhappsgallery.blogspot.com
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto px-2.5 py-3">
              <p className="mb-1.5 px-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-600">Workspace</p>
              {[
                { id: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
                { id: 'browse' as Page, label: 'Browse catalog', icon: Compass },
                { id: 'library' as Page, label: 'My library', icon: LibraryIcon, badge: saved.length },
              ].map(({ id, label, icon: Icon, badge }) => (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] font-medium transition ${
                    page === id ? 'bg-sky-500/[0.13] text-sky-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  {badge !== undefined && badge > 0 && (
                    <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">{badge}</span>
                  )}
                  {page === id && <span className="h-1 w-1 rounded-full bg-sky-400" />}
                </button>
              ))}

              <p className="mb-1.5 mt-4 px-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-600">Categories</p>
              {categories.filter(c => c !== 'All').map(cat => {
                const Icon = cat === 'Windows' ? Monitor : cat === 'Android' ? Smartphone : cat === 'Tools' ? Wrench : cat === 'Games' ? Gamepad2 : cat === 'Drivers' ? HardDrive : BookOpen;
                const count = categoryCount(cat);
                return (
                  <button
                    key={cat}
                    onClick={() => navigate('browse', cat)}
                    className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-[11.5px] transition ${
                      page === 'browse' && category === cat ? 'bg-sky-500/[0.13] text-sky-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="flex-1 text-left">{cat}</span>
                    <span className={`text-[9px] ${count === 0 ? 'rounded bg-white/[0.04] px-1 text-slate-600' : 'text-slate-600'}`}>
                      {count || 'Soon'}
                    </span>
                  </button>
                );
              })}

              <p className="mb-1.5 mt-4 px-2 text-[8.5px] font-bold uppercase tracking-[0.2em] text-slate-600">Application</p>
              {[
                { id: 'updates' as Page, label: 'Update center', icon: RefreshCw, dot: true },
                { id: 'settings' as Page, label: 'Settings', icon: Settings },
              ].map(({ id, label, icon: Icon, dot }) => (
                <button
                  key={id}
                  onClick={() => navigate(id)}
                  className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[11.5px] font-medium transition ${
                    page === id ? 'bg-sky-500/[0.13] text-sky-300' : 'text-slate-400 hover:bg-white/[0.04] hover:text-slate-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {dot && <span className={`h-1.5 w-1.5 rounded-full ${checkedResult === 'idle' ? 'bg-amber-400' : 'bg-emerald-500'}`} />}
                </button>
              ))}
            </nav>

            <div className="border-t border-white/[0.06] p-2.5">
              <button
                onClick={() => setPage('updates')}
                className="w-full rounded-lg border border-sky-500/15 bg-gradient-to-br from-sky-500/[0.09] to-transparent p-2.5 text-left transition hover:border-sky-500/30"
              >
                <div className="flex items-center justify-between">
                  <p className="flex items-center gap-1.5 text-[10px] font-bold text-sky-300"><RefreshCw className="h-3 w-3" /> Monthly update</p>
                  <ChevronRight className="h-3 w-3 text-slate-500" />
                </div>
                <p className="mt-1 text-[9px] leading-snug text-slate-500">
                  {updateAvailable ? `v${latestVersion} is available` : `Next check ${nextCheckDate(lastCheck)}`}
                </p>
              </button>
              <div className="mt-2 flex items-center justify-between px-1 text-[9px] text-slate-600">
                <span className="flex items-center gap-1">
                  {effectiveOffline ? <WifiOff className="h-2.5 w-2.5 text-amber-400" /> : <Wifi className="h-2.5 w-2.5 text-emerald-400" />}
                  {effectiveOffline ? 'Offline' : 'Online'}
                </span>
                <span>v{version} · installed</span>
              </div>
            </div>
          </aside>

          {/* Content column */}
          <div className="flex min-w-0 flex-1 flex-col">
            {/* Header */}
            <header className="flex flex-shrink-0 flex-wrap items-center gap-2 border-b border-white/[0.07] bg-[#0a1322]/70 px-3 py-2 backdrop-blur sm:px-4">
              <div className="hidden items-center gap-1.5 text-[10px] text-slate-600 md:flex">
                <span>Gallery</span>
                <ChevronRight className="h-2.5 w-2.5" />
                <span className="font-medium text-slate-300">{pageTitles[page]}</span>
              </div>

              <div className="relative order-3 w-full sm:order-none sm:ml-2 sm:w-auto sm:flex-1 sm:max-w-sm">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  ref={searchRef}
                  value={search}
                  onChange={e => { setSearch(e.target.value); if (e.target.value) setPage('browse'); }}
                  placeholder="Search apps, tools, drivers…"
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-1.5 pl-8 pr-8 text-[11px] text-slate-200 placeholder-slate-600 outline-none transition focus:border-sky-500/40 focus:bg-white/[0.06]"
                  aria-label="Search catalog"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-500 hover:text-slate-200">
                    <X className="h-3 w-3" />
                  </button>
                )}
                <kbd className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 rounded border border-white/10 bg-white/[0.05] px-1 text-[8px] text-slate-500 sm:block">Ctrl K</kbd>
              </div>

              <div className="ml-auto flex items-center gap-1.5">
                <button
                  onClick={checkForUpdates}
                  disabled={checking || effectiveOffline}
                  title="Check for updates"
                  className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold transition ${
                    effectiveOffline
                      ? 'cursor-not-allowed border-white/[0.06] bg-white/[0.02] text-slate-600'
                      : 'border-sky-500/25 bg-sky-500/[0.08] text-sky-300 hover:bg-sky-500/[0.15]'
                  }`}
                >
                  <RefreshCw className={`h-3 w-3 ${checking ? 'animate-spin' : ''}`} />
                  <span className="hidden xs:inline sm:inline">{checking ? 'Checking…' : 'Check updates'}</span>
                  {updateAvailable && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
                </button>

                <div className="relative">
                  <button
                    onClick={() => setNotifOpen(v => !v)}
                    className="relative flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.03] text-slate-400 transition hover:text-slate-100"
                    aria-label="Notifications"
                  >
                    <Bell className="h-3.5 w-3.5" />
                    <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-sky-400" />
                  </button>
                  {notifOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />
                      <div className="absolute right-0 top-9 z-50 w-72 animate-scale-in overflow-hidden rounded-xl border border-white/10 bg-[#0d1929] shadow-2xl">
                        <div className="flex items-center justify-between border-b border-white/[0.07] px-3.5 py-2.5">
                          <p className="text-[11px] font-bold text-white">Notifications</p>
                          <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[8.5px] font-bold text-sky-300">2 NEW</span>
                        </div>
                        <div className="divide-y divide-white/[0.05]">
                          <button onClick={() => { setPage('updates'); setNotifOpen(false); }} className="flex w-full gap-2.5 px-3.5 py-3 text-left transition hover:bg-white/[0.03]">
                            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-sky-500/15"><RefreshCw className="h-3 w-3 text-sky-400" /></div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-slate-200">v{latestVersion} catalog update</p>
                              <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">23 verified releases, new tools and drivers are ready.</p>
                              <p className="mt-1 text-[8.5px] text-slate-600">October 29, 2026</p>
                            </div>
                          </button>
                          <button onClick={() => { setNotifOpen(false); window.open(OFFICIAL_URL, '_blank', 'noopener,noreferrer'); }} className="flex w-full gap-2.5 px-3.5 py-3 text-left transition hover:bg-white/[0.03]">
                            <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md bg-emerald-500/15"><Globe className="h-3 w-3 text-emerald-400" /></div>
                            <div>
                              <p className="text-[10.5px] font-semibold text-slate-200">Fresh on the blog</p>
                              <p className="mt-0.5 text-[9.5px] leading-relaxed text-slate-500">New software guides and installers were published this week.</p>
                              <p className="mt-1 text-[8.5px] text-slate-600">mhappsgallery.blogspot.com</p>
                            </div>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button onClick={() => setPage('settings')} className="flex h-7 items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-1.5 text-slate-400 transition hover:text-slate-100">
                  <Logo size={18} />
                  <span className="hidden text-[10px] font-medium sm:block">Local user</span>
                  <ChevronDown className="hidden h-2.5 w-2.5 sm:block" />
                </button>
              </div>
            </header>

            {/* Page body */}
            <main className="min-h-0 flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top_right,rgba(18,60,110,0.18),transparent_55%)] px-3.5 py-4 sm:px-5 sm:py-5">
              {page === 'dashboard' && <Dashboard />}
              {page === 'browse' && <Browse />}
              {page === 'library' && <Library />}
              {page === 'updates' && <Updates />}
              {page === 'settings' && <SettingsPage />}

              <footer className="mt-7 flex flex-wrap items-center justify-between gap-2 border-t border-white/[0.06] pt-3 text-[9px] text-slate-600">
                <p>© 2026 MH Apps Gallery · Official links only · Your Apps &amp; Software Hub</p>
                <div className="flex items-center gap-3">
                  <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="hover:text-sky-400">Official blog</a>
                  <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-emerald-400">Support</a>
                  <button onClick={() => setPage('settings')} className="hover:text-sky-400">About</button>
                </div>
              </footer>
            </main>

            {/* Status bar */}
            <div className="flex h-6 flex-shrink-0 items-center gap-3 border-t border-white/[0.07] bg-[#070e19] px-3 text-[9px] text-slate-600">
              <span className="flex items-center gap-1">
                {effectiveOffline ? <WifiOff className="h-2.5 w-2.5 text-amber-400" /> : <Wifi className="h-2.5 w-2.5 text-emerald-400" />}
                {effectiveOffline ? 'Working offline' : 'Connected'}
              </span>
              <span className="hidden items-center gap-1 sm:flex"><ShieldCheck className="h-2.5 w-2.5 text-sky-500" /> Verified sources</span>
              <span className="hidden items-center gap-1 md:flex"><FolderDown className="h-2.5 w-2.5" /> {catalog.length} releases</span>
              <span className="ml-auto flex items-center gap-2">
                <button onClick={() => setPage('updates')} className="hidden items-center gap-1 hover:text-sky-400 sm:flex">
                  <RefreshCw className="h-2.5 w-2.5" /> {updateAvailable ? 'Update available' : `v${version} up to date`}
                </button>
                <span className="text-slate-700">|</span>
                <span>{now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* App details modal */}
      {selected && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm" onClick={() => setSelectedId(null)}>
          <div className="max-h-[92vh] w-full max-w-lg animate-scale-in overflow-y-auto rounded-2xl border border-white/10 bg-[#0b1424] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="relative h-44 overflow-hidden">
              <Thumb image={selected.image} name={selected.name} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0b1424] via-[#0b1424]/30 to-transparent" />
              <button onClick={() => setSelectedId(null)} className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full border border-white/10 bg-black/60 text-slate-300 backdrop-blur transition hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between gap-2">
                <div>
                  <span className="rounded bg-sky-500/20 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sky-300">{selected.category}</span>
                  <h2 className="mt-1 font-display text-lg font-extrabold leading-tight text-white">{selected.name}</h2>
                </div>
                <button
                  onClick={() => toggleSave(selected.id)}
                  className={`flex flex-shrink-0 items-center gap-1 rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold backdrop-blur transition ${
                    saved.includes(selected.id)
                      ? 'border-sky-400/30 bg-sky-500/25 text-sky-200'
                      : 'border-white/15 bg-black/50 text-slate-300 hover:text-white'
                  }`}
                >
                  {saved.includes(selected.id) ? <BookmarkCheck className="h-3 w-3" /> : <Bookmark className="h-3 w-3" />}
                  {saved.includes(selected.id) ? 'Saved' : 'Save'}
                </button>
              </div>
            </div>

            <div className="p-4">
              <p className="text-[11px] leading-relaxed text-slate-400">{selected.description}</p>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-600">{selected.title}</p>

              <div className="mt-4 grid grid-cols-2 gap-2">
                {[
                  { label: 'Platform', value: selected.platform, icon: Monitor },
                  { label: 'File format', value: selected.format, icon: FileArchive },
                  { label: 'License', value: selected.license, icon: ShieldCheck },
                  { label: 'Published', value: formatDate(selected.date), icon: CalendarDays },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="rounded-lg border border-white/[0.06] bg-white/[0.025] p-2.5">
                    <p className="flex items-center gap-1 text-[9px] text-slate-500"><Icon className="h-2.5 w-2.5" /> {label}</p>
                    <p className="mt-0.5 text-[10.5px] font-semibold text-slate-200">{value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openDownload(selected)}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2.5 text-[11px] font-bold transition ${
                    effectiveOffline ? 'border border-white/10 bg-white/[0.03] text-slate-400' : 'brand-gradient text-white hover:brightness-110'
                  }`}
                >
                  {effectiveOffline ? <WifiOff className="h-3.5 w-3.5" /> : <Download className="h-3.5 w-3.5" />}
                  {effectiveOffline ? 'Available when online' : 'Download from official post'}
                </button>
                <a href={selected.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2.5 text-slate-400 transition hover:text-white" title="Open blog post">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="mt-2 flex items-center justify-center gap-1 text-[9px] text-slate-600">
                <Link2 className="h-2.5 w-2.5" /> Opens mhappsgallery.blogspot.com — official source
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Close / uninstall modal */}
      {exitOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm" onClick={() => setExitOpen(false)}>
          <div className="w-full max-w-sm animate-scale-in overflow-hidden rounded-xl border border-white/10 bg-[#0b1424] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 border-b border-white/[0.07] px-4 py-3">
              <Logo size={34} />
              <div>
                <p className="text-[12px] font-bold text-white">Close MH Apps Gallery?</p>
                <p className="text-[9.5px] text-slate-500">Your saved library stays on this computer.</p>
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-2">
                <button onClick={() => { setExitOpen(false); setMinimized(true); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] py-2 text-[11px] font-semibold text-slate-300 hover:bg-white/[0.06]">
                  <Minus className="h-3 w-3" /> Minimize
                </button>
                <button onClick={() => { setExitOpen(false); onExit(); }} className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-500/90 py-2 text-[11px] font-bold text-white hover:bg-rose-500">
                  <Power className="h-3 w-3" /> Exit app
                </button>
              </div>
              <button onClick={() => { setExitOpen(false); onRunSetup(); }} className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg border border-white/[0.06] py-2 text-[10px] font-medium text-slate-500 hover:text-slate-300">
                <RotateCw className="h-3 w-3" /> Repair installation instead
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden preload for offline thumbnails */}
      <div className="hidden" aria-hidden>
        {catalog.slice(0, 4).map(item => <img key={item.id} src={item.image} alt="" />)}
      </div>
    </div>
  );
}
