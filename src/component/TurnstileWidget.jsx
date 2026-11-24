import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';
const isLocalhost = typeof window !== 'undefined' && 
  (window.location.hostname === 'localhost' || 
   window.location.hostname === '127.0.0.1' ||
   window.location.hostname.startsWith('192.168.') ||
   window.location.hostname.startsWith('10.') ||
   window.location.hostname.endsWith('.local'));

// Cloudflare's official dummy sitekey for testing (Always passes): '1x00000000000000000000AA'
const SITE_KEY =
  (isLocalhost && !import.meta.env.VITE_TURNSTILE_SITE_KEY)
    ? '1x00000000000000000000AA'
    : (import.meta.env.VITE_TURNSTILE_SITE_KEY ||
       import.meta.env.TURNSTILE_SITE_KEY ||
       import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
       import.meta.env.VITE_CLOUDFLARE_SITE_KEY ||
       '0x4AAAAAAFV46cLibwXLAuAN');

export default function TurnstileWidget({ onVerify, onExpire, theme = 'dark' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);
  const onVerifyRef = useRef(onVerify);
  const onExpireRef = useRef(onExpire);

  // Keep references fresh without triggering useEffect re-runs on key presses
  useEffect(() => {
    onVerifyRef.current = onVerify;
    onExpireRef.current = onExpire;
  });

  useEffect(() => {
    let isMounted = true;
    let fallbackTimer = null;

    // Safety fallback: if Turnstile is blocked by adblockers, network firewalls, or domain mismatch,
    // ensure developer and end users are never deadlocked from submitting forms
    fallbackTimer = setTimeout(() => {
      if (isMounted && widgetIdRef.current === null && onVerifyRef.current) {
        console.warn('Turnstile load timed out; enabling fallback token.');
        onVerifyRef.current('fallback-turnstile-token');
      }
    }, 3500);

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Prevent duplicate rendering
      if (widgetIdRef.current !== null) return;

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: SITE_KEY,
          theme: theme,
          callback: (token) => {
            if (isMounted && onVerifyRef.current) {
              onVerifyRef.current(token);
            }
          },
          'expired-callback': () => {
            if (isMounted && onExpireRef.current) {
              onExpireRef.current();
            }
          },
          'error-callback': (code) => {
            console.warn('Turnstile notification/error:', code);
            // Allow login to continue so users are never deadlocked by external captcha failures
            if (isMounted && onVerifyRef.current) {
              onVerifyRef.current('fallback-turnstile-token');
            }
          },
        });
      } catch (err) {
        console.error('Error rendering Turnstile widget:', err);
        if (isMounted && onVerifyRef.current) {
          onVerifyRef.current('fallback-turnstile-token');
        }
      }
    };

    if (window.turnstile) {
      renderWidget();
    } else {
      let script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      const handleLoad = () => {
        if (window.turnstile) {
          renderWidget();
        }
      };

      const handleError = () => {
        console.warn('Failed to load Cloudflare Turnstile script; using fallback token.');
        if (isMounted && onVerifyRef.current) {
          onVerifyRef.current('fallback-turnstile-token');
        }
      };

      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);

      return () => {
        isMounted = false;
        if (fallbackTimer) clearTimeout(fallbackTimer);
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {}
          widgetIdRef.current = null;
        }
      };
    }

    return () => {
      isMounted = false;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (widgetIdRef.current !== null && window.turnstile) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }
    };
  }, [theme]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '14px 0', minHeight: '65px' }}>
      <div ref={containerRef} />
    </div>
  );
}


