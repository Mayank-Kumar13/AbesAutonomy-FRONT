import { useState, useEffect } from "react";

export default function Pdfviewer({ file }) {
  const [blobUrl, setBlobUrl] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Revoke previous blob URLs to prevent memory leaks
    if (blobUrl) {
      URL.revokeObjectURL(blobUrl);
    }

    // Only fetch if a file URL is provided
    if (!file) return;

    console.log("[DIAGNOSTIC] PDF source URL origin:", new URL(file, window.location.origin).origin);
    console.log("[DIAGNOSTIC] fetch(file) starts for:", file);
    
    // Check if we need to add the auth token.
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    fetch(file, { headers })
      .then(async (res) => {
        console.log("[DIAGNOSTIC] HTTP status:", res.status, res.statusText);
        console.log("[DIAGNOSTIC] response Content-Type:", res.headers.get("Content-Type"));
        if (!res.ok) throw new Error(`Failed to fetch PDF (Status: ${res.status})`);
        
        const blob = await res.blob();
        console.log("[DIAGNOSTIC] Blob creation succeeds. Size:", blob.size, "bytes, Type:", blob.type);
        
        const objectUrl = URL.createObjectURL(blob);
        console.log("[DIAGNOSTIC] createObjectURL succeeds");
        
        setBlobUrl(objectUrl);
      })
      .catch((err) => {
        console.error("[DIAGNOSTIC] fetch error:", err);
        setError(err.message);
      });

    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file]);

  if (error) {
    return <p style={{ textAlign: "center", padding: "20px", color: "red" }}>Error loading PDF: {error}</p>;
  }
  if (!blobUrl) {
    return <p style={{ textAlign: "center", padding: "20px" }}>Loading Document...</p>;
  }

  const viewerUrl = `/pdfjs-6.1.200-dist/web/viewer.html?file=${encodeURIComponent(blobUrl)}`;
  console.log("[DIAGNOSTIC] final viewer URL TYPE:", viewerUrl.substring(0, 50) + "...");

  return (
    <iframe
      src={viewerUrl}
      width="100%"
      height="100%"
      style={{
        border: "none",
        minHeight: "100vh",
      }}
      title="PDF Viewer"
    />
  );
}