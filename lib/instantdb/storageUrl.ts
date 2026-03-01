/**
 * Resolve display URLs for InstantDB storage files.
 * Accepts both legacy S3 URLs and storage.instantdb.com URLs.
 * Falls back to constructed URL when $files doesn't provide a valid URL.
 */

const INSTANT_STORAGE_DOMAINS = [
  'instant-storage.s3.amazonaws.com',
  'storage.instantdb.com',
];

export function isValidInstantDbUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== 'string') return false;
  return INSTANT_STORAGE_DOMAINS.some((domain) => url.includes(domain));
}

export function getStorageUrlFromKey(storageKey: string): string | null {
  if (!storageKey) return null;
  const appId = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
  if (!appId) return null;
  if (storageKey.startsWith('http://') || storageKey.startsWith('https://')) {
    return storageKey;
  }
  return `https://storage.instantdb.com/${appId}/${storageKey}`;
}

/**
 * Get display URL for a file from $files query result.
 * If the file object has a valid InstantDB URL, use it; otherwise
 * fall back to the asset URL (if provided), then to a constructed URL from storageKey.
 */
export function getFileUrl(
  file: any,
  storageKey?: string | null,
  fallbackUrl?: string | null
): string | null {
  if (file) {
    // Prefer whatever URL InstantDB provides on the $files row.
    // (Domains can change; we still validate to avoid obvious non-storage URLs.)
    if (file.url && isValidInstantDbUrl(file.url)) return file.url;
    if (file.src && isValidInstantDbUrl(file.src)) return file.src;
    if (file.downloadUrl && isValidInstantDbUrl(file.downloadUrl)) return file.downloadUrl;

    // If InstantDB returns a URL on a new domain, use it as long as it's https.
    if (typeof file.url === 'string' && file.url.startsWith('https://')) return file.url;
    if (typeof file.src === 'string' && file.src.startsWith('https://')) return file.src;
    if (typeof file.downloadUrl === 'string' && file.downloadUrl.startsWith('https://'))
      return file.downloadUrl;
  }

  // Fall back to the stored asset URL if it looks usable
  if (typeof fallbackUrl === 'string' && fallbackUrl.startsWith('https://')) {
    return fallbackUrl;
  }
  if (storageKey) {
    return getStorageUrlFromKey(storageKey);
  }
  return null;
}
