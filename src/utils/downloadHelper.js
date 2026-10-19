import { getSupabaseFallbackUrl, isImageKitThrottled, markImageKitFailure, markImageKitSuccess } from "./storageFallback";

/**
 * Triggers a download from a Blob object in the browser.
 */
function triggerBlobDownload(blob, filename) {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(blobUrl), 2000);
}

/**
 * Triggers a direct download or opens fallback via anchor tag.
 */
function triggerDirectDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Robust note downloader:
 * 1. Attempts backend /notes/:id/download (which applies dynamic watermark and has Supabase fallback).
 * 2. If backend download fails, falls back to fetching direct CDN/pdfUrl as blob.
 * 3. If primary CDN fails (e.g. ImageKit bandwidth limit), attempts Supabase Storage fallback.
 * 4. Triggers direct browser download link if blob fetch fails.
 */
export async function downloadNoteFile({ noteId, pdfUrl, title }, index = 0) {
  const cleanTitle = (title || `document_${index + 1}`)
    .replace(/[\\/:*?"<>|]/g, "_")
    .trim();

  // Detect extension from URL or default to pdf
  let ext = "pdf";
  const urlToMatch = pdfUrl || "";
  const match = urlToMatch.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
  if (match) {
    ext = match[1].toLowerCase();
  }

  const filename = `${cleanTitle}.${ext}`;
  const token = localStorage.getItem("token");
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const rawApiBase = import.meta.env.VITE_API_URL || "/api";
  const apiBase = rawApiBase.replace(/\/+$/, "");

  // Strategy 1: Try backend watermarked download endpoint
  if (noteId) {
    try {
      const downloadUrl = `${apiBase}/notes/${noteId}/download`;
      const response = await fetch(downloadUrl, { headers, credentials: "include" });

      if (response.ok) {
        const blob = await response.blob();
        if (blob && blob.size > 0) {
          let determinedExt = ext;
          if (blob.type === "image/jpeg") determinedExt = "jpg";
          else if (blob.type === "image/png") determinedExt = "png";
          else if (blob.type === "image/webp") determinedExt = "webp";
          else if (blob.type === "application/pdf") determinedExt = "pdf";
          else if (blob.type.includes("wordprocessingml")) determinedExt = "docx";
          else if (blob.type.includes("msword")) determinedExt = "doc";

          triggerBlobDownload(blob, `${cleanTitle}.${determinedExt}`);
          return;
        }
      } else {
        console.warn(`Backend download failed with status ${response.status}. Falling back to direct CDN...`);
      }
    } catch (err) {
      console.warn("Backend download request error. Falling back to direct CDN...", err);
    }
  }

  // Strategy 2: Direct CDN fetch as blob with automatic Supabase fallback
  if (pdfUrl) {
    const fallbackUrl = getSupabaseFallbackUrl(pdfUrl);
    const throttled = isImageKitThrottled();

    // 2a. If ImageKit is throttled and Supabase fallback exists, try Supabase first
    if (throttled && fallbackUrl) {
      try {
        console.info("[downloadHelper] Primary provider throttled. Downloading directly from Supabase Storage fallback...");
        const sbResponse = await fetch(fallbackUrl);
        if (sbResponse.ok) {
          const blob = await sbResponse.blob();
          if (blob && blob.size > 0) {
            triggerBlobDownload(blob, filename);
            return;
          }
        }
      } catch (sbErr) {
        console.warn("[downloadHelper] Supabase fallback download failed:", sbErr);
      }
    }

    // 2b. Attempt Primary ImageKit download
    try {
      const cdnResponse = await fetch(pdfUrl);
      if (cdnResponse.ok) {
        markImageKitSuccess();
        const blob = await cdnResponse.blob();
        if (blob && blob.size > 0) {
          triggerBlobDownload(blob, filename);
          return;
        }
      } else {
        markImageKitFailure(cdnResponse.status);
        console.warn(`Direct CDN fetch returned ${cdnResponse.status}. Attempting Supabase fallback...`);
      }
    } catch (err) {
      markImageKitFailure('network_error');
      console.warn("Direct CDN fetch failed. Attempting Supabase fallback...", err);
    }

    // 2c. Fallback to Supabase Storage if primary failed
    if (fallbackUrl) {
      try {
        console.info("[downloadHelper] Attempting Supabase Storage fallback blob download...");
        const fbResponse = await fetch(fallbackUrl);
        if (fbResponse.ok) {
          const blob = await fbResponse.blob();
          if (blob && blob.size > 0) {
            triggerBlobDownload(blob, filename);
            return;
          }
        }
      } catch (fbErr) {
        console.warn("[downloadHelper] Supabase Storage fallback fetch error:", fbErr);
      }
    }

    // Strategy 3: Direct link trigger (using fallback if primary is throttled)
    const targetUrl = (throttled && fallbackUrl) ? fallbackUrl : pdfUrl;
    triggerDirectDownload(targetUrl, filename);
    return;
  }

  throw new Error("No download source available for this note.");
}

