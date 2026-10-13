import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';
const SITE_KEY =
  import.meta.env.VITE_TURNSTILE_SITE_KEY ||
  import.meta.env.TURNSTILE_SITE_KEY ||
  import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
  import.meta.env.VITE_CLOUDFLARE_SITE_KEY ||
  '0x4AAAAAAFV46cLibwXLAuAN';

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
          'error-callback': () => {
            if (isMounted && onExpireRef.current) {
              onExpireRef.current();
            }
          },
        });
      } catch (err) {
        console.error('Error rendering Turnstile widget:', err);
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

      script.addEventListener('load', handleLoad);
      return () => {
        isMounted = false;
        script.removeEventListener('load', handleLoad);
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


