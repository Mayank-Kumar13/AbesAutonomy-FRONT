import { supabase, BUCKET_NAME, isSupabaseConfigured } from '../services/supabaseClient';

const HEALTH_STORAGE_KEY = 'storage_provider_health';

/**
 * Deterministically map an ImageKit asset URL or path to the corresponding Supabase Storage path.
 *
 * Examples:
 *   "https://ik.imagekit.io/dfkux2rsp/notes/cse/MATHS/file.pdf?updatedAt=123" -> "notes/cse/MATHS/file.pdf"
 *   "https://ik.imagekit.io/dfkux2rsp/tr:w-300/notes/unit1.pdf" -> "notes/unit1.pdf"
 *   "/notes/cse/file.pdf" -> "notes/cse/file.pdf"
 *
 * @param {string} urlOrPath
 * @returns {string} Relative path in Supabase bucket
 */
export const mapImageKitUrlToSupabasePath = (urlOrPath) => {
  if (!urlOrPath || typeof urlOrPath !== 'string') return '';

  let cleanPath = urlOrPath.trim();

  // Strip query string and hash
  cleanPath = cleanPath.split('?')[0].split('#')[0];

  // If full ImageKit URL, strip origin and endpoint
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    try {
      const parsed = new URL(cleanPath);
      // Remove leading endpoint part if matched, e.g. /dfkux2rsp/notes/...
      const segments = parsed.pathname.split('/').filter(Boolean);

      // Check if first segment is the ImageKit ID (e.g. dfkux2rsp)
      if (segments.length > 0 && /^[a-zA-Z0-9_\-]+$/.test(segments[0]) && segments[0] !== 'notes') {
        segments.shift();
      }

      // Filter out ImageKit transformation segments like tr:w-300,h-400
      const filtered = segments.filter((seg) => !seg.startsWith('tr:'));
      return filtered.join('/');
    } catch {
      // Fallback below
    }
  }

  // Remove leading slashes and any ImageKit transformation prefixes
  return cleanPath
    .replace(/^\/+/, '')
    .replace(/^tr:[^/]+\//, '');
};

/**
 * Get the Supabase Storage fallback URL for a given ImageKit URL or path.
 * @param {string} imagekitUrl
 * @returns {string} Supabase URL or empty string
 */
export const getSupabaseFallbackUrl = (imagekitUrl) => {
  if (!isSupabaseConfigured() || !imagekitUrl) return '';

  const mappedPath = mapImageKitUrlToSupabasePath(imagekitUrl);
  if (!mappedPath) return '';

  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(mappedPath);
  return data?.publicUrl || '';
};

/**
 * Retrieve session provider health record
 */
const getHealthRecord = () => {
  try {
    const raw = sessionStorage.getItem(HEALTH_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { imagekitConsecutiveFailures: 0, lastFailureTime: 0 };
  } catch {
    return { imagekitConsecutiveFailures: 0, lastFailureTime: 0 };
  }
};

/**
 * Persist health record to session
 */
const saveHealthRecord = (rec) => {
  try {
    sessionStorage.setItem(HEALTH_STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // Ignore storage quota errors
  }
};

/**
 * Check if ImageKit is currently considered in a bandwidth limit / failure state for this session.
 * Resets after 5 minutes cooldown.
 */
export const isImageKitThrottled = () => {
  const rec = getHealthRecord();
  if (rec.imagekitConsecutiveFailures >= 3) {
    const elapsed = Date.now() - rec.lastFailureTime;
    if (elapsed < 5 * 60 * 1000) {
      return true; // Still within cooldown window
    }
  }
  return false;
};

/**
 * Record a failure on ImageKit (e.g. 403, 429, network failure)
 */
export const markImageKitFailure = (statusCode = null) => {
  const rec = getHealthRecord();
  rec.imagekitConsecutiveFailures = (rec.imagekitConsecutiveFailures || 0) + 1;
  rec.lastFailureTime = Date.now();
  rec.lastStatusCode = statusCode;
  saveHealthRecord(rec);

  console.warn(
    `[StorageFallback] ImageKit failure recorded (count: ${rec.imagekitConsecutiveFailures}, status: ${statusCode || 'net_err'}).`
  );
};

/**
 * Record a successful fetch from ImageKit
 */
export const markImageKitSuccess = () => {
  const rec = getHealthRecord();
  if (rec.imagekitConsecutiveFailures > 0) {
    rec.imagekitConsecutiveFailures = 0;
    saveHealthRecord(rec);
  }
};

/**
 * Smart fetch with automatic fallback from ImageKit to Supabase Storage.
 *
 * @param {string} primaryUrl - The primary ImageKit URL
 * @param {object} options - Fetch options + { fallbackUrl, timeoutMs }
 * @returns {Promise<{response: Response, providerUsed: 'imagekit'|'supabase'}>}
 */
export const fetchAssetWithFallback = async (primaryUrl, options = {}) => {
  const { timeoutMs = 8000, fallbackUrl: explicitFallbackUrl, ...fetchOptions } = options;

  const fallbackUrl = explicitFallbackUrl || getSupabaseFallbackUrl(primaryUrl);
  const isThrottled = isImageKitThrottled();

  // Helper with timeout
  const fetchWithTimeout = async (url, opts) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...opts, signal: controller.signal });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  // If ImageKit is heavily failing in this session and Supabase is configured, try Supabase first
  if (isThrottled && fallbackUrl && isSupabaseConfigured()) {
    try {
      console.info('[StorageFallback] Primary provider throttled. Attempting Supabase fallback directly...');
      const fallbackRes = await fetchWithTimeout(fallbackUrl, fetchOptions);
      if (fallbackRes.ok) {
        return { response: fallbackRes, providerUsed: 'supabase' };
      }
    } catch (e) {
      console.warn('[StorageFallback] Supabase fallback directly failed. Re-trying primary...', e);
    }
  }

  // 1. Attempt Primary Request (ImageKit)
  try {
    const primaryRes = await fetchWithTimeout(primaryUrl, fetchOptions);

    if (primaryRes.ok) {
      markImageKitSuccess();
      return { response: primaryRes, providerUsed: 'imagekit' };
    }

    // Detected non-2xx response from primary (e.g. 403 forbidden / 429 quota / 502 / 404)
    markImageKitFailure(primaryRes.status);
    console.warn(`[StorageFallback] Primary provider returned status ${primaryRes.status}. Triggering Supabase fallback...`);
  } catch (err) {
    // Network error, CORS error, or timeout
    markImageKitFailure(err.name === 'AbortError' ? 'timeout' : 'network_error');
    console.warn('[StorageFallback] Primary provider network error. Triggering Supabase fallback...', err);
  }

  // 2. Attempt Fallback (Supabase Storage)
  if (fallbackUrl && isSupabaseConfigured()) {
    try {
      const fallbackRes = await fetchWithTimeout(fallbackUrl, fetchOptions);
      if (fallbackRes.ok) {
        console.info('[StorageFallback] Successfully retrieved asset from Supabase Storage fallback.');
        return { response: fallbackRes, providerUsed: 'supabase' };
      } else {
        console.warn(`[StorageFallback] Supabase Storage returned status ${fallbackRes.status}`);
      }
    } catch (fallbackErr) {
      console.error('[StorageFallback] Supabase fallback also failed:', fallbackErr);
    }
  }

  throw new Error('Both primary (ImageKit) and fallback (Supabase Storage) failed to load the requested asset.');
};

export default {
  mapImageKitUrlToSupabasePath,
  getSupabaseFallbackUrl,
  isImageKitThrottled,
  markImageKitFailure,
  markImageKitSuccess,
  fetchAssetWithFallback,
};
