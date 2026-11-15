import { useEffect, useState } from 'react';
import {
  ArrowRight, BadgeCheck, Check, ChevronDown, Download, ExternalLink, X,
  Globe, HardDrive, Lock, Monitor, RefreshCw, Shield, Sparkles, Wifi,
  WifiOff, Wrench, Layers, Cpu, PackageCheck, CircleHelp, DownloadCloud,
  Smartphone, ShieldCheck, CheckCircle2,
} from 'lucide-react';
import Logo from './Logo';
import { catalog } from '../data/catalog';
import { downloadApk } from '../lib/downloadApk';
import installerBase64 from '../data/installer.b64?raw';
import {
  APP_VERSION, INSTALLER_SIZE, INSTALLER_SHA256, OFFICIAL_URL, WHATSAPP_LINK, RELEASES,
  ANDROID_FILE, ANDROID_SIZE, ANDROID_SHA256, ANDROID_MIN_SDK,
} from '../lib/appInfo';

interface LandingPageProps {
  onInstall: () => void;
  onOpenApp: () => void;
}

const showcase = [catalog[0], catalog[16], catalog[10]];

function Thumb({ image, name, className = '' }: { image: string; name: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  if (failed || !image) {
    return (
      <div className={`flex items-center justify-center bg-gradient-to-br from-[#0d2344] to-[#071021] ${className}`}>
        <Logo size={44} />
      </div>
    );
  }
  return <img src={image} alt={name} loading="lazy" onError={() => setFailed(true)} className={className} />;
}

const INSTALLER_FILE = `MH_Apps_Gallery_Setup_v${APP_VERSION}.exe`;
const INSTALLER_URL = `/download/${INSTALLER_FILE}`;

export default function LandingPage({ onInstall, onOpenApp }: LandingPageProps) {
  const [downloaded, setDownloaded] = useState(false);
  const [faq, setFaq] = useState<number | null>(0);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installHint, setInstallHint] = useState(false);
  const [androidOpen, setAndroidOpen] = useState(false);
  const [androidStatus, setAndroidStatus] = useState<'idle' | 'started' | 'failed'>('idle');

  const downloadAndroid = () => {
    const result = downloadApk();
    setAndroidStatus(result.ok ? 'started' : 'failed');
    if (result.ok) window.setTimeout(() => setAndroidStatus('idle'), 14000);
  };

  useEffect(() => {
    const handler = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event);
    };
    const installed = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installed);
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installed);
    };
  }, []);

  const installWebApp = async () => {
    if (!installPrompt) {
      setInstallHint(true);
      setTimeout(() => setInstallHint(false), 6000);
      return;
    }
    installPrompt.prompt();
    try { await installPrompt.userChoice; } catch { /* dismissed */ }
    setInstallPrompt(null);
  };


  const startDownload = () => {
    if (!installerBase64.trim()) {
      // Inside the installed desktop copy there is no embedded payload:
      // send the visitor to the official download hub instead.
      window.open(OFFICIAL_URL, '_blank', 'noopener,noreferrer');
      return;
    }
    // The setup file is embedded so the download works even when only the
    // single-page build is hosted. A direct-file fallback keeps older hosts working.
    try {
      const binary = window.atob(installerBase64.replace(/\s+/g, ''));
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
      const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/vnd.microsoft.portable-executable' }));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = INSTALLER_FILE;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);
    } catch {
      const link = document.createElement('a');
      link.href = INSTALLER_URL;
      link.download = INSTALLER_FILE;
      document.body.appendChild(link);
      link.click();
      link.remove();
    }
    setDownloaded(true);
    window.setTimeout(() => setDownloaded(false), 15000);
  };

  const faqs = [
    {
      q: 'Can I use MH Apps Gallery without an internet connection?',
      a: 'Yes. The app keeps a local copy of the software catalog and your saved library, so browsing still works offline. Download links open the official blog post once you are back online.',
    },
    {
      q: 'How does the monthly update work?',
      a: 'A new catalog and app update ships every month. The app checks automatically every 30 days and you can run a manual check any time from the update button in the title bar.',
    },
    {
      q: 'Is there an Android app?',
      a: 'Yes. A signed APK with the full offline gallery is available in the download section. Android 5.0 and newer is supported — download it, allow install from your browser once, then tap Install.',
    },
    {
      q: 'Is the setup really next-next?',
      a: 'Yes. Run the installer, press Next on the welcome screen, choose your install folder, confirm shortcuts and monthly updates, then press Install. The full setup takes under a minute.',
    },
    {
      q: 'Where do the downloads come from?',
      a: 'Every listing links back to the original post on mhappsgallery.blogspot.com. We only reference official or permissioned sources — no cracks or modified files.',
    },
  ];

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#05080f] text-slate-200">
      {/* ambient background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-blue-600/15 blur-[130px]" />
        <div className="absolute right-[-10%] top-1/3 h-[420px] w-[420px] rounded-full bg-cyan-500/10 blur-[120px]" />
        <div className="absolute left-[-12%] top-[55%] h-[380px] w-[380px] rounded-full bg-blue-800/15 blur-[120px]" />
        <div className="absolute inset-0 grid-bg opacity-70" />
      </div>

      {/* NAV */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05080f]/80 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center gap-6 px-5 lg:px-8">
          <a href="#top" className="flex items-center gap-3">
            <Logo size={44} />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-display text-[15px] font-extrabold tracking-tight text-white">
                MH APPS <span className="text-sky-400">GALLERY</span>
              </span>
              <span className="mt-1 text-[9px] font-medium uppercase tracking-[0.24em] text-slate-500">
                Apps &amp; Software Hub
              </span>
            </span>
          </a>

          <nav className="ml-auto hidden items-center gap-7 text-[13px] font-medium text-slate-400 md:flex">
            <a href="#overview" className="transition-colors hover:text-white">Overview</a>
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#releases" className="transition-colors hover:text-white">Releases</a>
            <a href="#updates" className="transition-colors hover:text-white">Updates</a>
            <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 transition-colors hover:text-white">
              Blog <ExternalLink className="h-3 w-3 opacity-60" />
            </a>
          </nav>

          <div className="ml-auto flex items-center gap-2.5 md:ml-0">
            <button
              onClick={() => setAndroidOpen(true)}
              title="Android APK: download and install guide"
              className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:border-emerald-500/30 hover:bg-white/[0.08] sm:flex"
            >
              <Smartphone className="h-3.5 w-3.5 text-emerald-400" /> Android APK
            </button>
            <button
              onClick={installWebApp}
              title="Install MH Apps Gallery like a desktop app"
              className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:border-sky-500/30 hover:bg-white/[0.08] lg:flex"
            >
              <DownloadCloud className="h-3.5 w-3.5 text-sky-400" /> Install app
            </button>
            <button
              onClick={onOpenApp}
              className="hidden rounded-lg border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.08] sm:block"
            >
              Open web app
            </button>
            <button
              onClick={startDownload}
              className="flex items-center gap-2 rounded-lg brand-gradient px-4 py-2.5 text-[13px] font-bold text-white shadow-lg shadow-blue-700/30 transition hover:brightness-110 active:scale-[0.98]"
            >
              <Download className="h-4 w-4" />
              <span className="hidden xs:inline sm:inline">Download</span>
            </button>
          </div>
        </div>
      </header>

      <main id="top">
        {/* HERO */}
        <section id="overview" className="relative mx-auto max-w-7xl px-5 pb-16 pt-14 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid items-center gap-14 lg:grid-cols-[1.02fr_0.98fr]">
            <div className="animate-fade-up">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/[0.07] px-3.5 py-1.5 text-[11px] font-semibold text-sky-300">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
                </span>
                VERSION {APP_VERSION} · MONTHLY UPDATE · OCTOBER 2026
              </div>

              <h1 className="font-display text-[38px] font-extrabold leading-[1.05] tracking-tight text-white sm:text-[50px] lg:text-[56px]">
                Every app you need.
                <br />
                <span className="text-gradient">One desktop gallery.</span>
              </h1>

              <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-slate-400 sm:text-base">
                The official MH Apps Gallery desktop app. Browse hand-picked Windows tools, drivers,
                Android apps and guides — online or offline. Install once, get fresh software every month.
              </p>

              {/* trust line */}
              <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2.5 text-[12px] font-medium text-slate-400">
                {[
                  { icon: Wifi, label: 'Online + offline' },
                  { icon: Shield, label: 'Safe, official links' },
                  { icon: RefreshCw, label: 'Monthly updates' },
                  { icon: HardDrive, label: 'Windows 10 / 11' },
                ].map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5">
                    <Icon className="h-3.5 w-3.5 text-sky-400" />
                    {label}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  onClick={startDownload}
                  className="group relative flex items-center justify-center gap-3 overflow-hidden rounded-xl brand-gradient px-7 py-4 text-[15px] font-bold text-white shadow-[0_18px_45px_-12px_rgba(24,115,250,0.65)] transition hover:brightness-110 active:scale-[0.99]"
                >
                  <Monitor className="h-5 w-5" />
                  Download for Windows
                  <span className="rounded-md bg-white/15 px-1.5 py-0.5 text-[10px] font-bold tracking-wide">
                    .EXE
                  </span>
                  <span className="pointer-events-none absolute inset-0 sheen opacity-0 transition-opacity group-hover:opacity-100" />
                </button>

                <button
                  onClick={downloadAndroid}
                  className="flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-5 py-4 text-[14px] font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.14]"
                >
                  <Smartphone className="h-4 w-4" /> Get APK {ANDROID_SIZE}
                </button>
                <button
                  onClick={onOpenApp}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.035] px-6 py-4 text-[14px] font-semibold text-slate-200 transition hover:border-white/20 hover:bg-white/[0.07]"
                >
                  Preview the app
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="flex items-center gap-1.5 text-[10.5px] text-slate-500">
                  <Download className="h-3 w-3 text-emerald-500" /> Real setup file · downloaded directly
                </span>
                <button onClick={onInstall} className="flex items-center gap-1.5 text-[10.5px] font-medium text-slate-500 underline decoration-slate-700 underline-offset-2 transition hover:text-sky-300">
                  Preview the installation wizard
                </button>
              </div>

              {androidStatus === 'started' && (
                <p className="mt-3 flex max-w-md animate-fade-in items-start gap-2 rounded-lg border border-emerald-500/25 bg-emerald-500/[0.08] px-3 py-2 text-[11px] text-emerald-300">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                  <span>APK download started — {ANDROID_FILE} ({ANDROID_SIZE}). Open it from your Downloads.</span>
                </p>
              )}
              {androidStatus === 'failed' && (
                <p className="mt-3 max-w-md animate-fade-in rounded-lg border border-amber-500/25 bg-amber-500/[0.08] px-3 py-2 text-[11px] text-amber-300">
                  The browser blocked the download. Please try again in Chrome, or get the file from the{' '}
                  <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">official blog</a>.
                </p>
              )}
              {installHint && (
                <p className="mt-3 max-w-md animate-fade-in rounded-lg border border-sky-500/20 bg-sky-500/[0.06] px-3 py-2 text-[11px] text-sky-300">
                  To install the web app, use your browser menu → “Install app” / “Add to Home Screen”.
                  The browser installer appears automatically when available.
                </p>
              )}
              <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500">
                <span>Windows 10 / 11 · 64-bit</span>
                <span className="text-slate-700">•</span>
                <span>{INSTALLER_SIZE} installer</span>
                <span className="text-slate-700">•</span>
                <span>APK {ANDROID_SIZE}</span>
                <span className="text-slate-700">•</span>
                <span className="flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Verified publisher · MH Apps Gallery
                </span>
                <span className="flex items-center gap-1">
                  <PackageCheck className="h-3 w-3" /> Setup file details included below
                </span>
              </p>

              {downloaded && (
                <div className="mt-5 max-w-md animate-fade-in rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                  <div className="flex items-start gap-2.5">
                    <PackageCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-400" />
                    <div className="min-w-0">
                      <p className="text-[12px] font-semibold text-emerald-300">Your download has started</p>
                      <p className="mt-0.5 truncate font-mono text-[10px] text-slate-400">{INSTALLER_FILE}</p>
                      <p className="mt-1 text-[10px] leading-relaxed text-emerald-500/80">
                        Open the file and press Next → Next → Install. Windows may show a SmartScreen
                        prompt because the setup is new — choose “More info → Run anyway”.
                      </p>
                      <p className="mt-1.5 break-all font-mono text-[8.5px] text-slate-500">
                        SHA-256: {INSTALLER_SHA256}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button onClick={startDownload} className="rounded-md bg-emerald-500/15 px-2.5 py-1 text-[10px] font-semibold text-emerald-300 hover:bg-emerald-500/25">
                          Download again
                        </button>
                        <button onClick={onInstall} className="rounded-md border border-white/10 px-2.5 py-1 text-[10px] text-slate-300 hover:border-sky-500/30 hover:text-sky-300">
                          See the installer screens
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* APP PREVIEW */}
            <div className="relative animate-fade-up [animation-delay:120ms]">
              <div className="absolute -inset-6 rounded-[36px] bg-gradient-to-tr from-blue-600/20 via-cyan-500/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#080e1b] win-shadow">
                {/* title bar */}
                <div className="flex items-center gap-2 border-b border-white/[0.07] bg-[#0b1322] px-3.5 py-2.5">
                  <Logo size={22} />
                  <span className="text-[11px] font-semibold text-slate-300">MH Apps Gallery</span>
                  <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[9px] text-slate-500">v{APP_VERSION}</span>
                  <div className="ml-auto flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-600/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500/70" />
                  </div>
                </div>

                <div className="flex">
                  {/* sidebar */}
                  <aside className="hidden w-[122px] flex-col gap-1 border-r border-white/[0.06] bg-[#0a1120] p-2.5 sm:flex">
                    <div className="mb-2 flex items-center gap-2 rounded-lg bg-sky-500/10 p-2">
                      <Logo size={20} />
                      <div className="leading-tight">
                        <p className="text-[8px] font-bold text-white">MH APPS</p>
                        <p className="text-[7px] text-slate-500">GALLERY</p>
                      </div>
                    </div>
                    {[
                      { icon: Layers, label: 'Dashboard', active: true },
                      { icon: Monitor, label: 'Windows' },
                      { icon: Wrench, label: 'Tools' },
                      { icon: Cpu, label: 'Drivers' },
                      { icon: Globe, label: 'Android' },
                      { icon: RefreshCw, label: 'Updates' },
                    ].map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-[9px] ${
                          active ? 'bg-sky-500/15 font-semibold text-sky-300' : 'text-slate-500'
                        }`}
                      >
                        <Icon className="h-2.5 w-2.5" />
                        {label}
                      </div>
                    ))}
                    <div className="mt-auto rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5">
                      <p className="flex items-center gap-1 text-[8px] font-semibold text-emerald-400"><Wifi className="h-2 w-2" /> Online</p>
                    </div>
                  </aside>

                  {/* dashboard */}
                  <div className="flex-1 p-3">
                    <div className="mb-2.5 flex items-center gap-2">
                      <div className="flex h-6 flex-1 items-center rounded-md border border-white/10 bg-white/[0.03] px-2 text-[8px] text-slate-600">
                        Search apps, tools, drivers…
                      </div>
                      <span className="rounded-md bg-sky-500/15 px-2 py-1 text-[8px] font-semibold text-sky-300">Check update</span>
                    </div>

                    <div className="relative mb-2.5 overflow-hidden rounded-lg border border-sky-500/20 bg-gradient-to-r from-blue-800/60 to-cyan-800/25 p-3">
                      <p className="text-[8px] font-medium text-sky-200/80">Your Apps &amp; Software Hub</p>
                      <p className="mt-0.5 text-[13px] font-extrabold text-white">Welcome back</p>
                      <p className="mt-0.5 text-[8px] text-sky-100/60">23 releases · updated this month</p>
                      <Logo size={44} className="absolute -bottom-1 right-2 opacity-90" />
                    </div>

                    <div className="mb-2 flex items-center justify-between">
                      <p className="text-[9px] font-bold text-slate-300">Featured software</p>
                      <p className="text-[7px] text-sky-400">View all</p>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {showcase.map(item => (
                        <div key={item.id} className="overflow-hidden rounded-md border border-white/[0.07] bg-[#0d1626]">
                          <Thumb image={item.image} name={item.name} className="h-[42px] w-full object-cover" />
                          <div className="p-1.5">
                            <p className="truncate text-[7px] font-semibold text-slate-200">{item.name}</p>
                            <p className="text-[6px] text-slate-500">{item.category} · {item.format}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 rounded-md border border-white/[0.07] bg-[#0b1424] px-2 py-1.5">
                      <RefreshCw className="h-2.5 w-2.5 text-amber-400" />
                      <p className="flex-1 text-[7px] text-slate-400">Monthly update available — v2.2.0</p>
                      <span className="rounded bg-amber-400/15 px-1.5 py-0.5 text-[6px] font-bold text-amber-300">NEW</span>
                    </div>
                  </div>
                </div>

                {/* status bar */}
                <div className="flex items-center gap-3 border-t border-white/[0.06] bg-[#0b1322] px-3 py-1.5 text-[8px] text-slate-500">
                  <span className="flex items-center gap-1"><Shield className="h-2.5 w-2.5 text-emerald-500" /> 23 verified releases</span>
                  <span className="ml-auto flex items-center gap-1"><WifiOff className="h-2.5 w-2.5" /> Offline ready</span>
                </div>
              </div>

              {/* floating badge */}
              <div className="absolute -bottom-4 right-4 hidden items-center gap-2 rounded-xl border border-white/10 bg-[#0b1424]/95 px-3 py-2 shadow-xl backdrop-blur sm:flex">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-500/15">
                  <RefreshCw className="h-4 w-4 text-sky-400" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-white">Monthly updates</p>
                  <p className="text-[8px] text-slate-500">Next: November 2026</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* STATS STRIP */}
        <section className="border-y border-white/[0.06] bg-white/[0.015]">
          <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-white/[0.06] px-5 sm:grid-cols-4 lg:px-8">
            {[
              { value: '23+', label: 'Curated releases' },
              { value: '100%', label: 'Official sources' },
              { value: '2 modes', label: 'Online + offline' },
              { value: '30 days', label: 'Update cycle' },
            ].map(item => (
              <div key={item.label} className="px-4 py-6 text-center">
                <p className="font-display text-2xl font-extrabold text-white">{item.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-slate-500">{item.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="mx-auto max-w-7xl px-5 py-20 lg:px-8">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">Built for your desktop</p>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">
              A faster way to find <span className="text-gradient">good software.</span>
            </h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              No sketchy download pages. No guessing which link is real. Just a clean gallery of the
              tools people actually use, kept fresh every month.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: WifiOff, title: 'Works online & offline', body: 'Your catalog and saved library are stored locally. Keep browsing when the connection drops, then download when you are back online.', accent: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
              { icon: RefreshCw, title: 'Monthly software updates', body: 'A fresh release every month, with a manual "Check for updates" button right in the title bar and automatic checks every 30 days.', accent: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
              { icon: Shield, title: 'Official links only', body: 'Every card links straight back to its original MH Apps Gallery post and the publisher’s official download source.', accent: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
              { icon: Download, title: 'Next, next, done', body: 'The setup assistant keeps everything simple with sensible defaults, a real destination folder step and desktop shortcuts.', accent: 'text-blue-400 bg-blue-500/10 border-blue-500/20' },
              { icon: Layers, title: 'One organized library', body: 'Windows apps, tools, drivers, Android, games and guides are grouped into browsable categories with instant search.', accent: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
              { icon: CircleHelp, title: 'Real human support', body: 'Installation trouble? Message MH Apps Gallery directly on WhatsApp and get help with extracting or setting up a file.', accent: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
            ].map(({ icon: Icon, title, body, accent }, i) => (
              <div
                key={title}
                className="group rounded-2xl border border-white/[0.07] bg-gradient-to-b from-white/[0.035] to-transparent p-6 transition duration-300 hover:-translate-y-1 hover:border-sky-500/25 hover:from-sky-500/[0.06]"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-xl border ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mb-2 font-display text-base font-bold text-white">{title}</h3>
                <p className="text-[13px] leading-relaxed text-slate-400">{body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* GET IT ON YOUR DEVICE */}
        <section id="downloads" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">Choose your device</p>
            <h2 className="font-display text-3xl font-extrabold text-white sm:text-4xl">One gallery, <span className="text-gradient">every screen.</span></h2>
            <p className="mt-4 text-sm leading-relaxed text-slate-400">
              Install the desktop setup on Windows or the signed APK on Android. Both include the
              offline catalog, the official blog links and monthly update checks.
            </p>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {/* Windows card */}
            <div className="group relative overflow-hidden rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/50 to-[#0a1424] p-6 transition hover:border-sky-500/40">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sky-500/10 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-sky-500/25 bg-sky-500/10">
                  <Monitor className="h-6 w-6 text-sky-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-extrabold text-white">Windows desktop</h3>
                    <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-2 py-0.5 text-[9px] font-bold text-sky-300">.EXE SETUP</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
                    Next → Next → Install. Creates Desktop and Start menu shortcuts with the official logo,
                    plus an uninstaller under Settings → Apps.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-500">
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {INSTALLER_SIZE}</span>
                    <span className="flex items-center gap-1"><Shield className="h-3 w-3 text-emerald-500" /> Signed installer</span>
                    <span className="flex items-center gap-1"><RefreshCw className="h-3 w-3" /> Monthly updates</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={startDownload} className="inline-flex items-center gap-1.5 rounded-lg brand-gradient px-4 py-2.5 text-[12px] font-bold text-white transition hover:brightness-110">
                      <Download className="h-3.5 w-3.5" /> Download for Windows
                    </button>
                    <button onClick={onInstall} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-semibold text-slate-300 transition hover:border-white/20 hover:text-white">
                      Preview setup
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Android card */}
            <div className="group relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-950/40 to-[#0a1424] p-6 transition hover:border-emerald-500/40">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-emerald-500/10 blur-2xl" />
              <div className="relative flex items-start gap-4">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                  <Smartphone className="h-6 w-6 text-emerald-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-lg font-extrabold text-white">Android app</h3>
                    <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-300">.APK</span>
                    <span className="rounded-full border border-white/10 bg-white/[0.05] px-2 py-0.5 text-[9px] font-semibold text-slate-400">{ANDROID_MIN_SDK}</span>
                  </div>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-slate-400">
                    A lightweight native app with the full gallery built in. Works offline, opens software
                    links in your browser and stores your saved library on the phone.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10.5px] text-slate-500">
                    <span className="flex items-center gap-1"><HardDrive className="h-3 w-3" /> {ANDROID_SIZE}</span>
                    <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Signed APK</span>
                    <span className="flex items-center gap-1"><WifiOff className="h-3 w-3" /> Offline ready</span>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button onClick={downloadAndroid} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-[12px] font-bold text-[#03150d] transition hover:bg-emerald-400">
                      <Smartphone className="h-3.5 w-3.5" /> Download APK · {ANDROID_SIZE}
                    </button>
                    <button onClick={() => setAndroidOpen(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[12px] font-semibold text-slate-300 transition hover:border-emerald-400/30 hover:text-white">
                      Install guide
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* HOW TO INSTALL */}
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-gradient-to-br from-[#0a1729] via-[#081120] to-[#07101c]">
            <div className="grid gap-10 p-8 sm:p-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div>
                <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">Setup in three steps</p>
                <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
                  Installed in under a minute.
                </h2>
                <p className="mt-3 text-sm leading-relaxed text-slate-400">
                  The real Windows setup walks you through it — welcome, license, destination folder,
                  shortcut options and Install. Monthly update checking is enabled by default.
                </p>
                <button
                  onClick={startDownload}
                  className="mt-6 inline-flex items-center gap-2 rounded-lg brand-gradient px-5 py-3 text-[13px] font-bold text-white shadow-lg shadow-blue-800/30 transition hover:brightness-110"
                >
                  <Download className="h-4 w-4" /> Download installer
                </button>
              </div>

              <div className="space-y-3">
                {[
                  { n: '01', title: 'Download the installer', body: `MH_Apps_Gallery_Setup_v${APP_VERSION}.exe · ${INSTALLER_SIZE}`, icon: Download },
                  { n: '02', title: 'Press Next → Next → Install', body: 'Choose a folder, keep the suggested shortcuts and enable monthly updates.', icon: Monitor },
                  { n: '03', title: 'Browse & install', body: 'Open the gallery, search for what you need and download from the official post.', icon: Sparkles },
                ].map(({ n, title, body, icon: Icon }) => (
                  <div key={n} className="flex items-center gap-4 rounded-xl border border-white/[0.07] bg-white/[0.025] p-4 transition hover:border-sky-500/20 hover:bg-white/[0.045]">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-sky-500/10 text-sky-400">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-semibold text-white">{title}</p>
                      <p className="mt-0.5 text-[11px] text-slate-500">{body}</p>
                    </div>
                    <span className="font-mono text-[11px] font-bold text-slate-700">{n}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* LATEST RELEASES (real) */}
        <section id="releases" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">Fresh from the gallery</p>
              <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Latest releases this month</h2>
            </div>
            <button onClick={onOpenApp} className="flex items-center gap-1.5 text-[13px] font-semibold text-sky-400 transition hover:text-sky-300">
              Browse all 23 <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {catalog.slice(0, 4).map(item => (
              <a
                key={item.id}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0a1424] transition duration-300 hover:-translate-y-1 hover:border-sky-500/30 hover:shadow-xl hover:shadow-blue-950/50"
              >
                <div className="relative h-36 overflow-hidden bg-slate-900">
                  <Thumb image={item.image} name={item.name} className="h-full w-full object-cover opacity-90 transition duration-500 group-hover:scale-105 group-hover:opacity-100" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a1424] via-transparent to-transparent" />
                  <span className="absolute left-2.5 top-2.5 rounded-md border border-white/10 bg-black/60 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-300 backdrop-blur">
                    {item.category}
                  </span>
                </div>
                <div className="p-4">
                  <h3 className="line-clamp-2 text-[13px] font-bold leading-snug text-slate-100 group-hover:text-white">{item.name}</h3>
                  <p className="mt-1.5 flex items-center gap-1.5 text-[10px] text-slate-500">
                    <Monitor className="h-3 w-3" /> {item.platform}
                  </p>
                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.06] pt-3">
                    <span className="text-[10px] font-medium text-emerald-400">{item.license}</span>
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-sky-400">Details <ExternalLink className="h-2.5 w-2.5" /></span>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* UPDATES */}
        <section id="updates" className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.15fr]">
            <div className="rounded-3xl border border-white/[0.08] bg-gradient-to-br from-sky-950/60 to-[#07101d] p-8">
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
                <RefreshCw className="h-5 w-5 text-sky-400" />
              </div>
              <h2 className="font-display text-2xl font-extrabold text-white">Software updates, every month.</h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                The update center shows your current version, the newest release and a full changelog.
                Run a manual check whenever you like, or let the app check automatically every 30 days.
              </p>
              <div className="mt-6 flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4">
                <BadgeCheck className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                <div>
                  <p className="text-[12px] font-semibold text-emerald-300">You’re on the current release</p>
                  <p className="mt-0.5 text-[11px] text-emerald-500/70">v{APP_VERSION} · checked automatically</p>
                </div>
              </div>
              <button
                onClick={onOpenApp}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.05] px-5 py-3 text-[13px] font-bold text-white transition hover:border-sky-500/30 hover:bg-white/[0.08]"
              >
                <RefreshCw className="h-4 w-4" /> Open Update Center
              </button>
            </div>

            <div className="rounded-3xl border border-white/[0.08] bg-[#0a1424] p-8">
              <div className="mb-5 flex items-center justify-between">
                <h3 className="font-display text-base font-bold text-white">Release history</h3>
                <span className="rounded-full border border-sky-500/20 bg-sky-500/10 px-2.5 py-1 text-[10px] font-bold text-sky-300">CHANGELOG</span>
              </div>
              <div className="space-y-5">
                {RELEASES.map((release, idx) => (
                  <div key={release.version} className="relative pl-6">
                    {idx !== RELEASES.length - 1 && <span className="absolute left-[5px] top-4 h-full w-px bg-white/[0.08]" />}
                    <span className={`absolute left-0 top-1.5 h-2.5 w-2.5 rounded-full ${idx === 0 ? 'bg-sky-400 ring-4 ring-sky-500/15' : 'bg-slate-600'}`} />
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-[13px] font-bold text-white">v{release.version}</p>
                      <span className="text-[11px] text-slate-500">{release.date}</span>
                      {idx === 0 && <span className="rounded bg-sky-500/15 px-1.5 py-0.5 text-[9px] font-bold text-sky-300">LATEST</span>}
                    </div>
                    <p className="mt-0.5 text-[12px] text-slate-400">{release.title}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-4xl px-5 pb-20 lg:px-8">
          <div className="mb-8 text-center">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.22em] text-sky-400">Questions</p>
            <h2 className="font-display text-2xl font-extrabold text-white sm:text-3xl">Everything you should know</h2>
          </div>
          <div className="space-y-2.5">
            {faqs.map((item, i) => (
              <div key={item.q} className="overflow-hidden rounded-xl border border-white/[0.07] bg-white/[0.025]">
                <button
                  onClick={() => setFaq(faq === i ? null : i)}
                  className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
                >
                  <span className="text-[13px] font-semibold text-slate-200">{item.q}</span>
                  <ChevronDown className={`h-4 w-4 flex-shrink-0 text-slate-500 transition-transform ${faq === i ? 'rotate-180' : ''}`} />
                </button>
                {faq === i && (
                  <div className="animate-fade-in border-t border-white/[0.05] px-5 py-4 text-[12.5px] leading-relaxed text-slate-400">
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
          <div className="relative overflow-hidden rounded-3xl border border-sky-500/20 bg-gradient-to-r from-[#0a1c38] via-[#0a1830] to-[#081627] p-8 text-center sm:p-14">
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-sky-500/15 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-24 -right-16 h-64 w-64 rounded-full bg-cyan-500/10 blur-3xl" />
            <div className="relative">
              <Logo size={84} className="mx-auto" glow />
              <h2 className="mt-5 font-display text-2xl font-extrabold text-white sm:text-4xl">
                Your software hub is ready.
              </h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-slate-400">
                Install MH Apps Gallery on your PC and keep every useful tool one click away.
                Online or offline, always up to date.
              </p>
              <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  onClick={startDownload}
                  className="inline-flex items-center justify-center gap-2 rounded-xl brand-gradient px-7 py-3.5 text-[14px] font-bold text-white shadow-xl shadow-blue-800/30 transition hover:brightness-110"
                >
                  <Download className="h-4 w-4" /> Download setup (.exe)
                </button>
                <button
                  onClick={downloadAndroid}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.08] px-7 py-3.5 text-[14px] font-semibold text-emerald-200 transition hover:border-emerald-400/40 hover:bg-emerald-500/[0.14]"
                >
                  <Smartphone className="h-4 w-4" /> Download APK
                </button>
                <a
                  href={OFFICIAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-7 py-3.5 text-[14px] font-semibold text-white transition hover:border-white/20 hover:bg-white/[0.08]"
                >
                  <Globe className="h-4 w-4" /> mhappsgallery.blogspot.com
                </a>
              </div>
              <p className="mt-4 text-[10.5px] text-slate-600">
                Official Windows setup · Windows 10/11 · v{APP_VERSION}
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/[0.07] bg-[#04070d]">
        <div className="mx-auto max-w-7xl px-5 py-10 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3">
                <Logo size={40} />
                <div>
                  <p className="text-[14px] font-extrabold text-white">MH APPS <span className="text-sky-400">GALLERY</span></p>
                  <p className="text-[9px] uppercase tracking-[0.22em] text-slate-500">Your Apps &amp; Software Hub</p>
                </div>
              </div>
              <p className="mt-4 max-w-sm text-[12px] leading-relaxed text-slate-500">
                Software, PC tools, utilities and helpful technology guides — verified links,
                friendly support and a fresh catalog every month.
              </p>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/[0.07] px-3.5 py-2 text-[12px] font-semibold text-emerald-300 transition hover:bg-emerald-500/[0.12]"
              >
                <Check className="h-3.5 w-3.5" /> Installation help on WhatsApp
              </a>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Gallery</p>
              <ul className="space-y-2 text-[12px] text-slate-500">
                {['Windows', 'Tools', 'Drivers', 'Android', 'Games', 'Guides'].map(cat => (
                  <li key={cat}>
                    <button onClick={onOpenApp} className="transition hover:text-sky-300">{cat}</button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Product</p>
              <ul className="space-y-2 text-[12px] text-slate-500">
                <li><button onClick={onOpenApp} className="transition hover:text-sky-300">Web app</button></li>
                <li><button onClick={startDownload} className="transition hover:text-sky-300">Windows installer (.exe)</button></li>
                <li><button onClick={downloadAndroid} className="transition hover:text-sky-300">Android app (.apk)</button></li>
                <li><a href="#updates" className="transition hover:text-sky-300">Monthly updates</a></li>
                <li><a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="transition hover:text-sky-300">Official blog</a></li>
                <li><a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="transition hover:text-sky-300">Support: +881540085661</a></li>
              </ul>
            </div>
          </div>

          <div className="mt-9 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[10.5px] text-slate-600 sm:flex-row sm:items-center sm:justify-between">
            <p>© 2026 MH Apps Gallery. All software trademarks belong to their respective owners.</p>
            <p className="flex items-center gap-3">
              <span className="flex items-center gap-1"><Shield className="h-3 w-3" /> Official links only</span>
              <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> mhappsgallery.blogspot.com</span>
            </p>
          </div>
        </div>
      </footer>

      {/* Android install guide modal */}
      {androidOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm" onClick={() => setAndroidOpen(false)}>
          <div className="max-h-[92vh] w-full max-w-md overflow-y-auto animate-scale-in rounded-2xl border border-emerald-500/20 bg-[#08131f] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-3 border-b border-white/[0.07] p-4">
              <Logo size={46} />
              <div className="min-w-0 flex-1">
                <p className="font-display text-[15px] font-extrabold text-white">MH Apps Gallery for Android</p>
                <p className="mt-0.5 text-[10.5px] text-slate-500">Signed APK · v{APP_VERSION} · {ANDROID_MIN_SDK}</p>
              </div>
              <button onClick={() => setAndroidOpen(false)} className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 text-slate-400 hover:text-white">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="font-mono text-[11px] font-semibold text-emerald-200">{ANDROID_FILE}</p>
                    <p className="mt-0.5 text-[10px] text-slate-400">{ANDROID_SIZE} · package com.mhappsgallery.app</p>
                  </div>
                  <ShieldCheck className="h-5 w-5 flex-shrink-0 text-emerald-400" />
                </div>
                <button onClick={downloadAndroid} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2.5 text-[12px] font-bold text-[#03150d] transition hover:bg-emerald-400">
                  <Download className="h-3.5 w-3.5" /> Download the APK
                </button>
                {androidStatus === 'started' && (
                  <p className="mt-2 rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2 py-1.5 text-center text-[10px] text-emerald-300">
                    Download started. Open it from your browser's Downloads / notification shade.
                  </p>
                )}
                {androidStatus === 'failed' && (
                  <p className="mt-2 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-1.5 text-center text-[10px] text-amber-300">
                    Download was blocked. Open the <a href={OFFICIAL_URL} target="_blank" rel="noopener noreferrer" className="font-semibold underline">official blog</a> and request the APK link on WhatsApp.
                  </p>
                )}
              </div>

              <p className="mb-2 mt-4 text-[11px] font-bold uppercase tracking-wider text-slate-500">How to install</p>
              <ol className="space-y-2.5">
                {[
                  'Download the APK on your Android phone or tablet.',
                  'Open it from your Files / Downloads notification.',
                  'If asked, allow “Install unknown apps” for your browser or file manager.',
                  'Tap Install, then Open — MH Apps Gallery starts on the updated catalog.',
                ].map((step, i) => (
                  <li key={step} className="flex gap-2.5 text-[11.5px] leading-relaxed text-slate-300">
                    <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-[10px] font-bold text-emerald-300">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>

              <div className="mt-4 rounded-lg border border-white/[0.07] bg-white/[0.025] p-3 text-[10px] leading-relaxed text-slate-500">
                <p className="flex items-center gap-1.5 font-semibold text-slate-300"><Shield className="h-3 w-3 text-sky-400" /> Why “unknown apps”?</p>
                <p className="mt-1">
                  The APK is distributed directly from MH Apps Gallery, not through Google Play, so Android
                  asks for that permission once. The app only needs internet access to load software images
                  and open official download pages.
                </p>
                <p className="mt-1.5 break-all font-mono text-[8.5px] text-slate-600">SHA-256: {ANDROID_SHA256}</p>
              </div>

              <div className="mt-3 flex items-center justify-between text-[10px] text-slate-500">
                <span className="flex items-center gap-1"><ShieldCheck className="h-3 w-3 text-emerald-500" /> Bundled download · signature verified</span>
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="font-semibold text-emerald-400 hover:text-emerald-300">
                  Need help? WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}