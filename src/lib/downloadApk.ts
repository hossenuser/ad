import apkBase64 from '../data/android.b64?raw';

export const APK_FILENAME = 'MH_Apps_Gallery_v2.2.0.apk';

export interface DownloadResult {
  ok: boolean;
  reason?: 'missing-payload' | 'decode-error' | 'blocked';
}

/**
 * Delivers the signed APK as an in-memory file.
 * The APK is bundled with the site, so the download never depends on a
 * separate server route that may not be deployed.
 */
export function downloadApk(): DownloadResult {
  const cleaned = apkBase64.replace(/\s+/g, '');
  if (!cleaned) return { ok: false, reason: 'missing-payload' };

  try {
    const binary = window.atob(cleaned);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'application/vnd.android.package-archive' });
    const objectUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = APK_FILENAME;
    link.rel = 'noopener';
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Keep the blob alive long enough for slower mobile browsers to start saving.
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 120000);
    return { ok: true };
  } catch {
    return { ok: false, reason: 'decode-error' };
  }
}
