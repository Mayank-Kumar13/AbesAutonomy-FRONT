import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext";
import { getSupabaseFallbackUrl, isImageKitThrottled, markImageKitFailure, markImageKitSuccess } from "../utils/storageFallback";
import { Database, RefreshCw, Wrench, ArrowLeft } from "lucide-react";

export default function Pdfviewer({ file, isImageFlag, isDarkMode }) {
  const { user } = useAuth();

  const [activeFile, setActiveFile] = useState(file);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const [fallbackAttempted, setFallbackAttempted] = useState(false);

  // Sync activeFile when file prop changes
  useEffect(() => {
    if (isImageKitThrottled()) {
      const fallback = getSupabaseFallbackUrl(file);
      if (fallback) {
        setActiveFile(fallback);
        setIsUsingFallback(true);
        setFallbackAttempted(true);
        return;
      }
    }

    setActiveFile(file);
    setIsUsingFallback(false);
    setFallbackAttempted(false);
  }, [file]);

  const cleanFileUrl = activeFile ? activeFile.split('?')[0] : '';
  const initialIsImage = isImageFlag || (activeFile ? /\.(png|jpe?g|webp|gif|bmp|jfif|heic)$/i.test(cleanFileUrl) : false);
  const isPdf = activeFile ? /\.(pdf)$/i.test(cleanFileUrl) : true;
  const isOffice = activeFile ? /\.(docx?|pptx?|xlsx?)$/i.test(cleanFileUrl) : false;

  const [isImage, setIsImage] = useState(initialIsImage);

  const [fallbackUnavailable, setFallbackUnavailable] = useState(false);

  // Trigger fallback switch safely
  const triggerFallback = useCallback(async () => {
    if (fallbackAttempted) return;
    setFallbackAttempted(true);

    const fallback = getSupabaseFallbackUrl(file);
    if (!fallback) {
      setFallbackUnavailable(true);
      return;
    }

    try {
      const probe = await fetch(fallback, { method: 'GET', headers: { Range: 'bytes=0-10' } });
      if (probe.ok || probe.status === 206) {
        console.info("[Pdfviewer] Switching to Supabase Storage fallback URL:", fallback);
        setActiveFile(fallback);
        setIsUsingFallback(true);
      } else {
        console.warn("[Pdfviewer] Supabase fallback file does not exist (status " + probe.status + "):", fallback);
        setFallbackUnavailable(true);
      }
    } catch {
      // If probe was blocked by CORS, try loading activeFile fallback anyway
      setActiveFile(fallback);
      setIsUsingFallback(true);
    }
  }, [file, fallbackAttempted]);

  // For PDFs: preflight probe to detect ImageKit bandwidth limit (403, 429) or failure
  useEffect(() => {
    if (!file || isUsingFallback || fallbackAttempted) return;

    // Only probe external ImageKit URLs
    if (file.includes('ik.imagekit.io') || file.includes('imagekit')) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 6000);

      fetch(file, { method: 'GET', headers: { Range: 'bytes=0-10' }, signal: controller.signal })
        .then((res) => {
          clearTimeout(timer);
          if (res.ok || res.status === 206) {
            markImageKitSuccess();
          } else {
            console.warn(`[Pdfviewer] Primary provider probe failed with status ${res.status}. Falling back to Supabase...`);
            markImageKitFailure(res.status);
            triggerFallback();
          }
        })
        .catch((err) => {
          clearTimeout(timer);
          console.warn("[Pdfviewer] Primary provider probe network error. Falling back to Supabase...", err.message);
          markImageKitFailure('network_error');
          triggerFallback();
        });

      return () => {
        clearTimeout(timer);
        controller.abort();
      };
    }
  }, [file, isUsingFallback, fallbackAttempted, triggerFallback]);

  useEffect(() => {
    if (activeFile && !initialIsImage) {
      const img = new Image();
      img.onload = () => setIsImage(true);
      img.src = activeFile;
    }
  }, [activeFile, initialIsImage]);

  if (!activeFile) {
    return <p style={{ textAlign: "center", padding: "20px" }}>Loading Document...</p>;
  }

  let viewerUrl = activeFile;
  if (isPdf && !isOffice) {
    viewerUrl = `/pdfjs-6.1.200-dist/web/viewer.html?file=${encodeURIComponent(activeFile)}`;
  } else if (isOffice) {
    viewerUrl = `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(activeFile)}`;
  } else if (!isImage) {
    viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(activeFile)}&embedded=true`;
  }

  const viewerName = user ? (user.name || user.email) : 'Guest User';
  const isAdmin = user?.role === 'admin' || user?.role === 'coordinator';
  const filterStyle = isDarkMode ? 'invert(1) hue-rotate(180deg) brightness(0.9) contrast(1.1)' : 'none';


  return (
    <div style={{ position: 'relative', width: '100%', minHeight: '100vh', overflow: 'hidden' }}>
      {/* Fallback storage indicator badge - Admin only */}
      {isUsingFallback && !fallbackUnavailable && isAdmin && (
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '16px',
          zIndex: 60,
          backgroundColor: 'rgba(16, 185, 129, 0.95)',
          color: '#ffffff',
          padding: '6px 12px',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
          backdropFilter: 'blur(8px)',
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <span style={{ fontSize: '14px' }}>🛡️</span>
          <span>Backup Storage Active (Supabase)</span>
        </div>
      )}

      {fallbackUnavailable ? (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '85vh',
          padding: '2rem 1rem',
          textAlign: 'center',
          color: '#e2e8f0',
          background: 'radial-gradient(ellipse at center, rgba(30, 58, 138, 0.22) 0%, rgba(15, 23, 42, 0.95) 70%, #0b0f19 100%)',
          position: 'relative',
          zIndex: 60
        }}>
          <div style={{
            background: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: '24px',
            padding: '2.8rem 2.2rem',
            maxWidth: '540px',
            width: '92%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 35px rgba(59, 130, 246, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            position: 'relative'
          }}>
            {/* Glowing Icon Container */}
            <div style={{
              width: '84px',
              height: '84px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.25), rgba(124, 58, 237, 0.25))',
              border: '1.5px solid rgba(96, 165, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '1.5rem',
              position: 'relative',
              boxShadow: '0 0 30px rgba(59, 130, 246, 0.35)'
            }}>
              <Database size={40} color="#60a5fa" />
              <div style={{
                position: 'absolute',
                bottom: '-2px',
                right: '-2px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                borderRadius: '50%',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                border: '2px solid #0f172a'
              }}>
                <Wrench size={13} color="#ffffff" />
              </div>
            </div>

            {/* Status Pill */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 14px',
              borderRadius: '9999px',
              background: 'rgba(59, 130, 246, 0.12)',
              border: '1px solid rgba(59, 130, 246, 0.3)',
              color: '#93c5fd',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.04em',
              textTransform: 'uppercase',
              marginBottom: '1.25rem'
            }}>
              <span style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: '#38bdf8',
                boxShadow: '0 0 8px #38bdf8'
              }} />
              <span>Database Maintenance</span>
            </div>

            {/* Main Headline */}
            <h3 style={{
              fontSize: '1.65rem',
              fontWeight: 700,
              margin: '0 0 0.8rem 0',
              letterSpacing: '-0.02em',
              background: 'linear-gradient(135deg, #ffffff 40%, #93c5fd 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              We are working on the database
            </h3>

            {/* English Message only */}
            <p style={{
              color: '#cbd5e1',
              fontSize: '0.98rem',
              lineHeight: '1.6',
              margin: '0 0 0.7rem 0',
              maxWidth: '440px'
            }}>
              We are currently optimizing and upgrading our database to provide a faster and more reliable experience.
            </p>

            <p style={{
              color: '#94a3b8',
              fontSize: '0.88rem',
              lineHeight: '1.5',
              margin: '0 0 1.8rem 0',
              maxWidth: '440px'
            }}>
              This document will be accessible shortly. Thank you for your patience!
            </p>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button
                type="button"
                onClick={() => window.location.reload()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px 20px',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <RefreshCw size={15} />
                <span>Check Again</span>
              </button>

              <button
                type="button"
                onClick={() => window.history.back()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(255, 255, 255, 0.06)',
                  color: '#cbd5e1',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  borderRadius: '10px',
                  padding: '10px 18px',
                  fontSize: '0.88rem',
                  fontWeight: 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.12)';
                  e.currentTarget.style.color = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                  e.currentTarget.style.color = '#cbd5e1';
                }}
              >
                <ArrowLeft size={15} />
                <span>Go Back</span>
              </button>
            </div>
          </div>
        </div>
      ) : isImage ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: isDarkMode ? '#111' : '#0f172a' }}>
          <img
            src={activeFile}
            alt="Document View"
            onError={triggerFallback}
            style={{ maxWidth: '100%', maxHeight: '100vh', objectFit: 'contain', filter: filterStyle, transition: 'filter 0.3s ease' }}
          />
        </div>
      ) : (
        <iframe
          src={viewerUrl}
          width="100%"
          height="100%"
          style={{
            border: "none",
            minHeight: "100vh",
            filter: filterStyle,
            transition: 'filter 0.3s ease',
            backgroundColor: isDarkMode ? 'black' : 'white'
          }}
          title="PDF Viewer"
        />
      )}

      {/* CSS Watermark Overlay */}
      {!fallbackUnavailable && (
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
      )}
    </div>
  );
}