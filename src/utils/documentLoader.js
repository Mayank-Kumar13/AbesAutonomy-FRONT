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
      const head = new Uint8Array(await blob.slice(0, 1024).arrayBuffer());
      const signature = new TextDecoder('latin1').decode(head);
      if (signature.startsWith('PK\x03\x04')) {
        // The protected /pdf endpoint also serves Office uploads, sometimes as application/pdf.
        const { default: JSZip } = await import('jszip');
        const archive = await JSZip.loadAsync(await blob.arrayBuffer());
        const format = archive.file('ppt/presentation.xml') ? 'pptx'
          : archive.file('word/document.xml') ? 'docx' : null;
        if (!format) throw new Error('This archive has no supported document preview.');
        return { blob, format, isImage: false, source: url };
      }
      const isPdf = signature.includes('%PDF-');
      const imageType = head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff ? 'image/jpeg'
        : signature.startsWith('\x89PNG\r\n\x1a\n') ? 'image/png'
        : signature.startsWith('RIFF') && signature.slice(8, 12) === 'WEBP' ? 'image/webp'
        : /^(GIF87a|GIF89a)/.test(signature) ? 'image/gif' : '';
      const isImage = !isPdf && Boolean(imageType || blob.type.startsWith('image/'));
      if (!blob.size || (!isPdf && !isImage)) {
        throw new Error('This file could not be previewed. It may be damaged or in an unsupported format.');
      }
      const type = isPdf ? 'application/pdf' : imageType || blob.type;
      return { blob: blob.slice(0, blob.size, type), isImage, source: url };
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
