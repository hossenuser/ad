import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight, Check, CheckCircle2, ChevronLeft, Download, Folder,
  HardDrive, Info, Minus, Monitor, RefreshCw, ShieldCheck, Sparkles,
  Wifi, X, Lock, Rocket, ScrollText,
} from 'lucide-react';
import Logo from './Logo';
import { APP_VERSION, INSTALLER_SIZE, UPDATE_INTERVAL_DAYS } from '../lib/appInfo';

interface SetupWizardProps {
  onComplete: () => void;
  onCancel: () => void;
}

const STEPS = ['Welcome', 'License', 'Location', 'Preferences', 'Installing', 'Finish'];

const EXTRACT_FILES = [
  'MHAppsGallery.exe',
  'resources/app/dist/index.html',
  'resources/app/assets/main.js',
  'resources/app/assets/styles.css',
  'resources/catalog.json',
  'resources/offline.db',
  'locales/en-US.pak',
  'locales/bn.pak',
  'ffmpeg.dll',
  'libEGL.dll',
  'snapshot_blob.bin',
  'uninstaller.exe',
];

const folders = [
  'C:\\Program Files\\MH Apps Gallery',
  'C:\\Program Files (x86)\\MH Apps Gallery',
  'D:\\Applications\\MH Apps Gallery',
  'C:\\Users\\Public\\MH Apps Gallery',
];

function useClock() {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);
  return now;
}

export default function SetupWizard({ onComplete, onCancel }: SetupWizardProps) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [fileLog, setFileLog] = useState('');
  const [destination, setDestination] = useState(folders[0]);
  const [customPath, setCustomPath] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [accepted, setAccepted] = useState(true);
  const [prefs, setPrefs] = useState({
    desktop: true,
    startMenu: true,
    autoUpdate: true,
    launch: true,
  });
  const [launchAfter, setLaunchAfter] = useState(true);
  const now = useClock();

  const isInstalling = step === 4;
  const isComplete = step === 5;

  useEffect(() => {
    if (!isInstalling) return;
    let p = 0;
    let f = 0;
    const timer = setInterval(() => {
      p += Math.random() * 9 + 4;
      if (p >= 100) {
        p = 100;
        setProgress(100);
        setFileLog('Setting up shortcuts and monthly update task…');
        clearInterval(timer);
        setTimeout(() => setStep(5), 700);
      } else {
        setProgress(p);
        setFileLog(`Extracting: ${destination}\\${EXTRACT_FILES[f % EXTRACT_FILES.length]}`);
        f += 1;
      }
    }, 190);
    return () => clearInterval(timer);
  }, [isInstalling, destination]);

  useEffect(() => {
    if (!isInstalling) return;
    setProgress(0);
    setFileLog('Preparing installation…');
  }, [isInstalling]);

  const next = () => setStep(s => Math.min(s + 1, 5));
  const back = () => setStep(s => Math.max(s - 1, 0));

  const canContinue = useMemo(() => {
    if (step === 1) return accepted;
    if (step === 2) return destination.trim().length > 4;
    return true;
  }, [step, accepted, destination]);

  const toggle = (key: keyof typeof prefs) =>
    setPrefs(p => ({ ...p, [key]: !p[key] }));

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0a1628]">
      {/* Desktop wallpaper backdrop */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_20%_10%,#12315c_0%,#081326_45%,#040910_100%)]" />
        <div className="absolute inset-0 grid-bg opacity-40" />
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500/[0.06] blur-[100px]" />
        <div className="absolute -right-24 top-10 h-72 w-72 rounded-full bg-cyan-500/[0.07] blur-3xl" />
        <div className="absolute left-6 top-6 flex items-center gap-2.5 opacity-40">
          <Logo size={34} />
          <div>
            <p className="text-[11px] font-bold text-white">MH APPS GALLERY</p>
            <p className="text-[8px] uppercase tracking-[0.2em] text-sky-200/70">Setup environment</p>
          </div>
        </div>
      </div>

      {/* Installer window */}
      <div className="relative z-10 flex flex-1 items-center justify-center overflow-y-auto p-3 sm:p-6">
        <div className="my-auto w-full max-w-[620px] overflow-hidden rounded-xl border border-white/15 bg-[#f5f7fa] text-slate-800 shadow-[0_40px_120px_-20px_rgba(0,0,0,0.9)]">
          {/* Title bar */}
          <div className="flex items-center gap-2.5 border-b border-slate-300/80 bg-[#e8edf4] px-3 py-2">
            <Logo size={22} />
            <p className="text-[12px] font-semibold text-slate-700">
              MH Apps Gallery Setup <span className="font-normal text-slate-500">— v{APP_VERSION}</span>
            </p>
            <div className="ml-auto flex items-center gap-0.5">
              <button onClick={onCancel} className="flex h-7 w-8 items-center justify-center rounded text-slate-500 transition hover:bg-slate-300/70" aria-label="Minimize">
                <Minus className="h-3 w-3" />
              </button>
              <button onClick={onCancel} className="flex h-7 w-8 items-center justify-center rounded text-slate-500 transition hover:bg-slate-300/70" aria-label="Maximize">
                <span className="h-2.5 w-2.5 rounded-[2px] border border-current" />
              </button>
              <button onClick={onCancel} className="flex h-7 w-8 items-center justify-center rounded text-slate-500 transition hover:bg-rose-500 hover:text-white" aria-label="Close">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Header band */}
          <div className="relative overflow-hidden border-b border-slate-200 bg-white px-5 py-4 sm:px-7">
            <div className="absolute right-0 top-0 h-full w-40 bg-gradient-to-l from-sky-100 to-transparent" />
            <div className="relative flex items-start gap-4">
              <Logo size={52} />
              <div className="min-w-0 flex-1">
                <h1 className="font-display text-[17px] font-extrabold leading-tight text-slate-900 sm:text-lg">
                  {isComplete
                    ? 'Installation completed'
                    : isInstalling
                    ? 'Installing MH Apps Gallery'
                    : `Welcome to MH Apps Gallery Setup`}
                </h1>
                <p className="mt-0.5 text-[12px] leading-snug text-slate-500">
                  {isComplete
                    ? 'The application is ready to launch.'
                    : isInstalling
                    ? 'Please wait while Setup installs the application on your computer.'
                    : `This wizard will install version ${APP_VERSION} on your computer.`}
                </p>
              </div>
              <span className="hidden flex-shrink-0 items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:flex">
                <ShieldCheck className="h-3 w-3" /> Verified
              </span>
            </div>
          </div>

          {/* Step rail */}
          <div className="flex border-b border-slate-200 bg-[#eef2f7] px-3 py-2.5 sm:px-5">
            {STEPS.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1.5 last:flex-none">
                <span
                  className={`flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                    i < step
                      ? 'bg-emerald-500 text-white'
                      : i === step
                      ? 'bg-[#1578e8] text-white ring-2 ring-sky-200'
                      : 'bg-slate-300 text-slate-500'
                  }`}
                >
                  {i < step ? <Check className="h-3 w-3" /> : i + 1}
                </span>
                <span className={`hidden whitespace-nowrap text-[10px] sm:block ${i === step ? 'font-bold text-slate-800' : 'text-slate-500'}`}>
                  {label}
                </span>
                {i < STEPS.length - 1 && (
                  <span className={`mx-1 h-px flex-1 sm:mx-2 ${i < step ? 'bg-emerald-400' : 'bg-slate-300'}`} />
                )}
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="min-h-[300px] bg-[#f5f7fa] px-5 py-5 sm:px-7 sm:py-6">
            {step === 0 && (
              <div className="animate-fade-in">
                <p className="text-[13px] leading-relaxed text-slate-700">
                  This will install <strong>MH Apps Gallery {APP_VERSION}</strong> on your computer.
                </p>
                <p className="mt-2.5 text-[13px] leading-relaxed text-slate-600">
                  It is recommended that you close all other applications before continuing. This
                  ensures the installation finishes without interruption.
                </p>

                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="mb-3 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-slate-500">
                    <Info className="h-3.5 w-3.5" /> What will be installed
                  </p>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {[
                      { icon: Monitor, label: 'Desktop application', sub: 'Windows 10 / 11 (64-bit)' },
                      { icon: HardDrive, label: '1.2 MB on disk', sub: `${INSTALLER_SIZE} setup file` },
                      { icon: Wifi, label: 'Online + offline', sub: 'Cached catalog included' },
                      { icon: RefreshCw, label: 'Monthly updates', sub: `Auto-check every ${UPDATE_INTERVAL_DAYS} days` },
                    ].map(({ icon: Icon, label, sub }) => (
                      <div key={label} className="flex items-start gap-2.5">
                        <div className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md bg-sky-100 text-sky-600">
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <p className="text-[11.5px] font-semibold text-slate-800">{label}</p>
                          <p className="text-[10.5px] text-slate-500">{sub}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="mt-4 flex items-center gap-1.5 text-[11.5px] text-slate-500">
                  <Lock className="h-3.5 w-3.5 text-emerald-600" />
                  Downloaded from mhappsgallery.blogspot.com — verified publisher.
                </p>
              </div>
            )}

            {step === 1 && (
              <div className="animate-fade-in">
                <p className="mb-2 text-[13px] font-semibold text-slate-800">Please read the following important information before continuing.</p>
                <div className="h-44 overflow-y-auto rounded-lg border border-slate-300 bg-white p-4 text-[11.5px] leading-relaxed text-slate-600">
                  <p className="mb-2 font-bold text-slate-800">MH Apps Gallery — End User License Agreement</p>
                  <p>
                    MH Apps Gallery provides software information, catalog browsing and technical
                    assistance. This application is provided “as is”, without warranty of any kind.
                  </p>
                  <p className="mt-2">
                    All software names, logos and trademarks are the property of their respective
                    owners. MH Apps Gallery does not host modified or cracked software. Downloads are
                    served from the original publisher or the official MH Apps Gallery blog post.
                  </p>
                  <p className="mt-2">
                    Users are responsible for checking system requirements and license terms before
                    installing third-party software. By continuing, you agree to use this application
                    only for lawful purposes.
                  </p>
                  <p className="mt-2">
                    Offline data is stored locally on your device. Uninstalling the application removes
                    its local cache and preferences.
                  </p>
                  <p className="mt-3 text-[10.5px] text-slate-400">Last updated: October 2026 · MH Apps Gallery</p>
                </div>
                <label className="mt-3.5 flex cursor-pointer items-center gap-2 text-[12px] text-slate-700">
                  <input
                    type="checkbox"
                    checked={accepted}
                    onChange={e => setAccepted(e.target.checked)}
                    className="h-3.5 w-3.5 accent-[#1578e8]"
                  />
                  I accept the terms of this license agreement.
                </label>
                {!accepted && <p className="mt-1 text-[10.5px] font-medium text-rose-600">Please accept the agreement to continue.</p>}
              </div>
            )}

            {step === 2 && (
              <div className="animate-fade-in">
                <p className="text-[13px] text-slate-700">Setup will install MH Apps Gallery into the following folder.</p>
                <p className="mt-1.5 text-[12px] text-slate-500">
                  To continue, click Next. If you would like to select a different folder, click Browse.
                </p>

                <label className="mt-4 block text-[11px] font-bold uppercase tracking-wide text-slate-500">Destination folder</label>
                <div className="mt-1.5 flex gap-2">
                  <div className="relative flex flex-1 items-center rounded-md border border-slate-300 bg-white">
                    <Folder className="ml-2.5 h-4 w-4 flex-shrink-0 text-sky-500" />
                    <input
                      value={destination}
                      onChange={e => { setDestination(e.target.value); setCustomPath(true); }}
                      className="w-full bg-transparent px-2.5 py-2 font-mono text-[11.5px] text-slate-700 outline-none"
                      aria-label="Destination folder"
                    />
                  </div>
                  <button
                    onClick={() => setShowFolders(v => !v)}
                    className="rounded-md border border-slate-300 bg-white px-3.5 py-2 text-[11.5px] font-semibold text-slate-700 transition hover:border-sky-400 hover:bg-sky-50"
                  >
                    Browse…
                  </button>
                </div>

                {showFolders && (
                  <div className="mt-2 animate-scale-in rounded-md border border-slate-300 bg-white p-1.5 shadow-lg">
                    {folders.map(folder => (
                      <button
                        key={folder}
                        onClick={() => { setDestination(folder); setShowFolders(false); setCustomPath(false); }}
                        className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left font-mono text-[11px] text-slate-600 hover:bg-sky-50 hover:text-sky-700"
                      >
                        <Folder className="h-3.5 w-3.5 text-sky-500" /> {folder}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-5 rounded-lg border border-slate-200 bg-white p-3.5">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-slate-600">Space required</span>
                    <span className="text-slate-800">1.2 MB</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-600" style={{ width: '8%' }} />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[10.5px] text-slate-500">
                    <span>Installing to drive C:</span>
                    <span>87.3 GB available</span>
                  </div>
                </div>

                {customPath && destination.trim().length <= 4 && (
                  <p className="mt-2 text-[10.5px] text-rose-600">Please enter a valid folder path.</p>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="animate-fade-in">
                <p className="text-[13px] text-slate-700">Select the additional tasks you would like Setup to perform, then click Install.</p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Shortcuts</p>
                  <div className="space-y-2.5 text-[12px] text-slate-700">
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input type="checkbox" checked={prefs.desktop} onChange={() => toggle('desktop')} className="h-3.5 w-3.5 accent-[#1578e8]" />
                      Create a desktop shortcut
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input type="checkbox" checked={prefs.startMenu} onChange={() => toggle('startMenu')} className="h-3.5 w-3.5 accent-[#1578e8]" />
                      Add to the Start menu
                    </label>
                  </div>

                  <div className="my-4 h-px bg-slate-200" />

                  <p className="mb-2.5 text-[10.5px] font-bold uppercase tracking-wide text-slate-400">Software updates</p>
                  <div className="space-y-2.5 text-[12px] text-slate-700">
                    <label className="flex cursor-pointer items-start gap-2.5">
                      <input type="checkbox" checked={prefs.autoUpdate} onChange={() => toggle('autoUpdate')} className="mt-0.5 h-3.5 w-3.5 accent-[#1578e8]" />
                      <span>
                        Check for software updates automatically
                        <span className="mt-0.5 block text-[10.5px] font-normal text-slate-500">
                          A new catalog and app update is released monthly. You can also check manually at any time.
                        </span>
                      </span>
                    </label>
                    <label className="flex cursor-pointer items-center gap-2.5">
                      <input type="checkbox" checked={prefs.launch} onChange={() => toggle('launch')} className="h-3.5 w-3.5 accent-[#1578e8]" />
                      Launch MH Apps Gallery after setup
                    </label>
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-md border border-sky-200 bg-sky-50 px-3 py-2.5 text-[11px] text-sky-800">
                  <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                  Ready to install. Setup will copy {EXTRACT_FILES.length + 12} files to your computer.
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="animate-fade-in">
                <p className="text-[13px] text-slate-700">Please wait while Setup installs MH Apps Gallery on your computer.</p>

                <div className="mt-4 rounded-lg border border-slate-200 bg-white p-4">
                  <div className="mb-2 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
                      {progress < 100 ? 'Installing…' : 'Finalizing…'}
                    </span>
                    <span className="font-mono font-semibold text-slate-700">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-4 overflow-hidden rounded-sm border border-slate-200 bg-slate-100">
                    <div
                      className="relative h-full bg-gradient-to-r from-[#0f6ee0] to-[#31a4ff] transition-all duration-200"
                      style={{ width: `${progress}%` }}
                    >
                      <span className="absolute inset-0 sheen opacity-60" />
                    </div>
                  </div>
                  <div className="mt-2 flex gap-1">
                    {[0, 1, 2, 3, 4, 5, 6, 7].map(i => (
                      <span key={i} className={`h-1 flex-1 rounded-full ${progress > i * 12 ? 'bg-sky-500' : 'bg-slate-200'}`} />
                    ))}
                  </div>
                  <p className="mt-3 truncate font-mono text-[9.5px] text-slate-500">{fileLog}</p>
                </div>

                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Copying application files', done: progress > 55, active: progress <= 55 },
                    { label: 'Creating desktop & Start menu shortcuts', done: progress > 75, active: progress > 55 && progress <= 75 },
                    { label: 'Preparing offline catalog', done: progress > 90, active: progress > 75 && progress <= 90 },
                    { label: 'Scheduling monthly update check', done: progress >= 100, active: progress > 90 && progress < 100 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-[11px]">
                      {item.done ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : item.active ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin text-sky-500" />
                      ) : (
                        <span className="h-3.5 w-3.5 rounded-full border border-slate-300" />
                      )}
                      <span className={item.done ? 'text-slate-500' : 'text-slate-700'}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div className="animate-fade-in text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                  <CheckCircle2 className="h-9 w-9 text-emerald-600" />
                </div>
                <h3 className="font-display text-lg font-extrabold text-slate-900">Setup has finished installing MH Apps Gallery</h3>
                <p className="mx-auto mt-2 max-w-md text-[12.5px] leading-relaxed text-slate-500">
                  The application and its offline catalog were installed successfully. You can launch
                  it now or from the desktop shortcut and Start menu.
                </p>

                <div className="mx-auto mt-5 max-w-sm rounded-lg border border-slate-200 bg-white p-3.5 text-left">
                  <div className="flex justify-between border-b border-slate-100 pb-2 text-[11px]">
                    <span className="text-slate-500">Install location</span>
                    <span className="max-w-[200px] truncate font-mono text-slate-700" title={destination}>{destination}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-100 py-2 text-[11px]">
                    <span className="text-slate-500">Version</span>
                    <span className="font-semibold text-slate-700">v{APP_VERSION}</span>
                  </div>
                  <div className="flex justify-between pt-2 text-[11px]">
                    <span className="text-slate-500">Monthly updates</span>
                    <span className={prefs.autoUpdate ? 'font-semibold text-emerald-600' : 'text-slate-500'}>
                      {prefs.autoUpdate ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                </div>

                <label className="mx-auto mt-4 flex w-fit cursor-pointer items-center gap-2 text-[12px] font-semibold text-slate-700">
                  <input type="checkbox" checked={launchAfter} onChange={e => setLaunchAfter(e.target.checked)} className="h-3.5 w-3.5 accent-[#1578e8]" />
                  Launch MH Apps Gallery
                </label>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between gap-2 border-t border-slate-200 bg-[#e8edf4] px-4 py-3 sm:px-6">
            <button
              onClick={onCancel}
              className="flex items-center gap-1.5 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-[11.5px] font-medium text-slate-600 transition hover:bg-slate-50"
            >
              {isComplete ? 'Close' : 'Cancel'}
            </button>

            <div className="flex items-center gap-2">
              {step > 0 && step < 4 && (
                <button
                  onClick={back}
                  className="flex items-center gap-1 rounded-md border border-slate-300 bg-white px-3.5 py-1.5 text-[11.5px] font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Back
                </button>
              )}

              {step < 3 && (
                <button
                  onClick={next}
                  disabled={!canContinue}
                  className="flex items-center gap-1 rounded-md bg-[#1578e8] px-4 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition hover:bg-[#0f67cc] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next <ArrowRight className="h-3.5 w-3.5" />
                </button>
              )}

              {step === 3 && (
                <button
                  onClick={next}
                  className="flex items-center gap-1.5 rounded-md bg-[#1578e8] px-4 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition hover:bg-[#0f67cc]"
                >
                  <Download className="h-3.5 w-3.5" /> Install
                </button>
              )}

              {step === 4 && (
                <button
                  disabled
                  className="flex items-center gap-1 rounded-md bg-[#9fc3ea] px-4 py-1.5 text-[11.5px] font-bold text-white"
                >
                  Installing…
                </button>
              )}

              {step === 5 && (
                <button
                  onClick={onComplete}
                  className="flex items-center gap-1.5 rounded-md bg-[#1578e8] px-4 py-1.5 text-[11.5px] font-bold text-white shadow-sm transition hover:bg-[#0f67cc]"
                >
                  <Rocket className="h-3.5 w-3.5" /> Finish
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Taskbar */}
      <div className="relative z-10 flex h-11 flex-shrink-0 items-center gap-3 border-t border-white/10 bg-[#071120]/85 px-3 backdrop-blur-xl sm:px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-white/[0.06]">
          <Logo size={22} />
        </div>
        <div className="hidden h-7 flex-1 max-w-xs items-center gap-2 rounded-md border border-white/[0.08] bg-white/[0.05] px-2.5 text-[10px] text-slate-500 sm:flex">
          <span className="h-2 w-2 rounded-full bg-sky-400/70" /> Search
        </div>
        <div className="ml-auto flex items-center gap-3 text-slate-400">
          <span className="flex items-center gap-1.5 text-[10px]">
            <Wifi className="h-3 w-3 text-emerald-400" />
            <span className="hidden sm:inline">Online</span>
          </span>
          <span className="flex items-center gap-1.5 text-[10px]">
            <ShieldCheck className="h-3 w-3 text-sky-400" />
            <span className="hidden sm:inline">Protected</span>
          </span>
          <div className="text-right text-[10px] leading-tight">
            <p className="font-medium text-slate-300">
              {now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-slate-600">{now.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
          </div>
          <button onClick={onCancel} className="rounded p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-300" title="Exit setup">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Footer hint */}
      <div className="pointer-events-none absolute bottom-16 left-1/2 z-10 hidden -translate-x-1/2 items-center gap-2 rounded-full border border-white/[0.08] bg-black/20 px-3.5 py-1.5 text-[10px] text-slate-500 backdrop-blur sm:flex">
        <ScrollText className="h-3 w-3" />
        Setup assistant · Next → Next → Install · No restart required
      </div>
    </div>
  );
}
