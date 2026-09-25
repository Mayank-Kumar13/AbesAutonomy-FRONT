import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

export default function Pdfviewer({ file, isImageFlag }) {
  const { user } = useAuth();
  
  const initialIsImage = isImageFlag || (file ? /\.(png|jpe?g|webp|gif|bmp|jfif|heic)$/i.test(file.split('?')[0]) : false);
  const [isImage, setIsImage] = useState(initialIsImage);

  useEffect(() => {
    if (file && !initialIsImage) {
      const img = new Image();
      img.onload = () => setIsImage(true);
      img.src = file;
    }
  }, [file, initialIsImage]);

  if (!file) {
    return <p style={{ textAlign: "center", padding: "20px" }}>Loading Document...</p>;
  }

  const viewerUrl = `/pdfjs-6.1.200-dist/web/viewer.html?file=${encodeURIComponent(file)}`;
  const viewerName = user ? (user.name || user.email) : 'Guest User';


  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      {isImage ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f172a' }}>
          <img src={file} alt="Document View" style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain' }} />
        </div>
      ) : (
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
      )}
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
          {/* Logo SVG matching Navbar */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 400 500"
            width="100"
            height="100"
            style={{ opacity: 0.6 }}
          >
            <rect width="400" height="500" fill="#111215" />
            <path
              d="M50 60 L350 60 L350 250 C350 380 200 460 200 460 C200 460 50 380 50 250 Z"
              stroke="#C5AC86"
              fill="none"
              strokeWidth="1.5"
            />
            <path
              d="M58 68 L342 68 L342 250 C342 372 200 448 200 448 C200 448 58 372 58 250 Z"
              stroke="#C5AC86"
              fill="none"
              strokeWidth="1"
            />
            <text
              x="200"
              y="145"
              fontFamily="'Times New Roman', Times, serif"
              fill="#C5AC86"
              textAnchor="middle"
              fontSize="72"
              letterSpacing="5"
            >
              ABES
            </text>
            <line x1="58" y1="165" x2="342" y2="165" stroke="#C5AC86" fill="none" strokeWidth="1" />
            <g transform="translate(0,-5)">
              <path d="M98 280 A102 102 0 0 1 302 280" stroke="#C5AC86" fill="none" strokeWidth="16" />
              <path d="M98 280 A102 102 0 0 1 302 280" stroke="#111215" strokeWidth="18" strokeDasharray="6 15" fill="none" />
              <path d="M90 280 A110 110 0 0 1 310 280" stroke="#C5AC86" fill="none" strokeWidth="2" />
              <path d="M120 280 A80 80 0 0 1 280 280 Z" fill="#C5AC86" />
              <g fill="#111215">
                <path d="M194 270 C194 270 180 240 200 223 C220 240 206 270 206 270 Z" />
                <path d="M189 271 C189 271 160 255 160 235 C180 240 192 260 192 260 Z" />
                <path d="M211 271 C211 271 240 255 240 235 C220 240 208 260 208 260 Z" />
                <path d="M183 275 C183 275 140 270 135 255 C160 255 183 266 183 266 Z" />
                <path d="M217 275 C217 275 260 270 265 255 C240 255 217 266 217 266 Z" />
                <path d="M120 282 Q160 270 200 283 Q240 270 280 282 L280 285 Q240 273 200 286 Q160 273 120 285 Z" />
                <path d="M130 275 Q165 263 200 278 Q235 263 270 275 L270 278 Q235 268 200 281 Q165 268 130 278 Z" />
              </g>
              <rect x="110" y="284" width="180" height="4" fill="#C5AC86" />
            </g>
            <text x="200" y="325" fontFamily="'Times New Roman', Times, serif" fill="#C5AC86" textAnchor="middle" fontSize="34" letterSpacing="4">ABES</text>
            <text x="200" y="352" fontFamily="'Times New Roman', Times, serif" fill="#C5AC86" textAnchor="middle" fontSize="17" letterSpacing="5">AUTONOMY</text>
            <line x1="135" y1="370" x2="190" y2="370" stroke="#C5AC86" fill="none" strokeWidth="1" />
            <polygon points="200,366 204,370 200,374 196,370" fill="#C5AC86" />
            <line x1="210" y1="370" x2="265" y2="370" stroke="#C5AC86" fill="none" strokeWidth="1" />
            <text x="200" y="400" fontFamily="'Times New Roman', Times, serif" fill="#C5AC86" textAnchor="middle" fontSize="18" letterSpacing="1">Estd. 2025</text>
          </svg>
          
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