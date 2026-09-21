import { useEffect } from "react";

export default function Pdfviewer({ file }) {
  if (!file) {
    return <p style={{ textAlign: "center", padding: "20px" }}>Loading Document...</p>;
  }

  // Pass the token as a query parameter if it exists, so the backend can use it (if we update the backend to support it)
  // Or just pass the file url.
  const viewerUrl = `/pdfjs-6.1.200-dist/web/viewer.html?file=${encodeURIComponent(file)}`;

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