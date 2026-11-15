export const APP_NAME = 'MH Apps Gallery';
export const APP_TAGLINE = 'Your Apps & Software Hub';
export const APP_VERSION = '2.2.0';
export const INSTALLER_VERSION = '2.2.0';
export const INSTALLER_SIZE = '949 KB';
export const ANDROID_FILE = 'MH_Apps_Gallery_v2.2.0.apk';
export const ANDROID_URL = '/download/MH_Apps_Gallery_v2.2.0.apk';
export const ANDROID_SIZE = '0.5 MB';
export const ANDROID_SHA256 = '33560a151525024c5b672f13143284a525b4acc97b4d588e4330d4f29e31a087';
export const ANDROID_MIN_SDK = 'Android 5.0+';
export const INSTALLER_SHA256 = 'f405cd09f1d58000733b42e7a44e5dd37f59c2175405edf2d81d7a2bddb225c8';
export const OFFICIAL_URL = 'https://mhappsgallery.blogspot.com';
export const WHATSAPP = '+881540085661';
export const WHATSAPP_LINK =
  'https://wa.me/881540085661?text=Hello%20MH%20APPS%20GALLERY%2C%20I%20need%20software%20installation%20help.';
export const SUPPORT_EMAIL = 'mhappsgallery@gmail.com';
export const UPDATE_INTERVAL_DAYS = 30;

export interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  changes: string[];
}

export const RELEASES: ReleaseNote[] = [
  {
    version: '2.2.0',
    date: 'October 29, 2026',
    title: 'Monthly catalog refresh',
    changes: [
      'Added 23 verified Windows tools, drivers and guides from the MH Apps Gallery blog.',
      'New offline library: saved apps stay available without an internet connection.',
      'New monthly update center with one-click update checks.',
      'Improved search, category filters and release cards.',
      'Minor fixes to the installer and first-run experience.',
    ],
  },
  {
    version: '2.1.0',
    date: 'September 28, 2026',
    title: 'Offline mode',
    changes: [
      'Browse your cached catalog when you are offline.',
      'Added status indicator for online / offline mode.',
    ],
  },
  {
    version: '2.0.0',
    date: 'August 30, 2026',
    title: 'A brand new gallery',
    changes: [
      'Complete desktop redesign.',
      'Introduced featured releases and category browsing.',
      'Added support for Windows, Android, tools, games and drivers.',
    ],
  },
];

export function formatDate(iso: string) {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function nextCheckDate(lastCheckMs: number) {
  const next = new Date(lastCheckMs + UPDATE_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  return next.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
