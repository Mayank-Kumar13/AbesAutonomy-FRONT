import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Pdfviewer({ file }) {
  const { user } = useAuth();
  
  if (!file) {
    return <p style={{ textAlign: "center", padding: "20px" }}>Loading Document...</p>;
  }

  const viewerUrl = `/pdfjs-6.1.200-dist/web/viewer.html?file=${encodeURIComponent(file)}`;
  const viewerName = user ? (user.name || user.email) : 'Guest User';

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
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
      {/* CSS Watermark Overlay */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none', // Crucial: lets clicks pass through to the PDF
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 50,
          opacity: 0.15,
          userSelect: 'none',
        }}
      >
        <div style={{
          transform: 'rotate(-45deg)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px'
        }}>
          <h1 style={{
            fontSize: '6vw',
            color: '#888',
            fontWeight: 'bold',
            whiteSpace: 'nowrap',
            textTransform: 'uppercase',
            letterSpacing: '5px',
            margin: 0
          }}>
            ABES AUTONOMY
          </h1>
          <h2 style={{
            fontSize: '4vw',
            color: '#888',
            fontWeight: 'normal',
            whiteSpace: 'nowrap',
            margin: 0
          }}>
            {viewerName}
          </h2>
        </div>
      </div>
    </div>
  );
}