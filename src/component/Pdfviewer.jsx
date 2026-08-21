export default function Pdfviewer({ file }) {
  // If the file is a full URL (ImageKit), use it directly.
  // If it's a local path (starts with /), use the pdfjs viewer.
  const isFullUrl = file.startsWith('http://') || file.startsWith('https://');

  // For full URLs (ImageKit), use the pdfjs viewer with the URL directly
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