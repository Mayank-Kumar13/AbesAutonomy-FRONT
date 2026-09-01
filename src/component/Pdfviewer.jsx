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

    fetch(file)
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed to fetch PDF");
        const blob = await res.blob();
        setBlobUrl(URL.createObjectURL(blob));
      })
      .catch((err) => {
        console.error("PDF fetch error:", err);
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