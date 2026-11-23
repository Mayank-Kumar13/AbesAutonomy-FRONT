// Fetch the complete document before opening PDF.js. This avoids broken CDN
// range responses and lets us distinguish an API error or image from a PDF.
export async function loadDocument({ file, backendUrl, fallbackUrl, signal, token, timeoutMs = 45000 }) {
  const urls = [...new Set([backendUrl, file, fallbackUrl].filter(Boolean))];
  let lastError;
  for (const url of urls) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const isBackend = url === backendUrl || /^\/api\//.test(url);
      const response = await fetch(url, {
        signal: controller.signal,
        ...(isBackend ? { credentials: 'include', headers: token ? { Authorization: `Bearer ${token}` } : {} } : {}),
      });
      if (!response.ok) {
        const error = new Error(`Document could not be loaded (${response.status}). Please try again.`);
        if (isBackend && (response.status === 401 || response.status === 403)) {
          const body = await response.json().catch(() => ({}));
          error.message = body.message || 'Please sign in or check your document access.';
          error.accessDenied = true;
        }
        throw error;
      }
      const blob = await response.blob();
      const signature = await blob.slice(0, 1024).text();
      const isPdf = signature.includes('%PDF-');
      const isImage = blob.type.startsWith('image/');
      if (!blob.size || (!isPdf && !isImage)) {
        throw new Error('The server did not return a valid PDF or image. Please try again.');
      }
      return { blob: isPdf ? new Blob([blob], { type: 'application/pdf' }) : blob, isImage, source: url };
    } catch (error) {
      signal?.throwIfAborted();
      if (error.accessDenied) throw error;
      lastError = error.name === 'AbortError' ? new Error('Document loading timed out. Please try again.') : error;
    } finally {
      clearTimeout(timer);
      signal?.removeEventListener('abort', abort);
    }
  }
  throw lastError || new Error('No document URL is available.');
}
