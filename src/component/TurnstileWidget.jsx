import React, { useEffect, useRef } from 'react';

const SCRIPT_ID = 'cloudflare-turnstile-script';
const DEFAULT_TEST_SITE_KEY = '1x00000000000000000000AA'; // Cloudflare official dummy testing key (always passes)

export default function TurnstileWidget({ onVerify, onExpire, theme = 'dark' }) {
  const containerRef = useRef(null);
  const widgetIdRef = useRef(null);

  const siteKey =
    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
    import.meta.env.TURNSTILE_SITE_KEY ||
    import.meta.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ||
    import.meta.env.VITE_CLOUDFLARE_TURNSTILE_SITE_KEY ||
    DEFAULT_TEST_SITE_KEY;

  useEffect(() => {
    let isMounted = true;

    const renderWidget = () => {
      if (!isMounted || !containerRef.current || !window.turnstile) return;

      // Clean up previous widget instance if exists
      if (widgetIdRef.current !== null) {
        try {
          window.turnstile.remove(widgetIdRef.current);
        } catch (e) {}
        widgetIdRef.current = null;
      }

      try {
        widgetIdRef.current = window.turnstile.render(containerRef.current, {
          sitekey: siteKey,
          theme: theme,
          callback: (token) => {
            if (isMounted && onVerify) onVerify(token);
          },
          'expired-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
          'error-callback': () => {
            if (isMounted && onExpire) onExpire();
          },
        });
      } catch (err) {
        console.error('Error rendering Turnstile widget:', err);
      }
    };

    if (!window.turnstile) {
      let script = document.getElementById(SCRIPT_ID);
      if (!script) {
        script = document.createElement('script');
        script.id = SCRIPT_ID;
        script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }

      script.addEventListener('load', renderWidget);
      return () => {
        isMounted = false;
        script.removeEventListener('load', renderWidget);
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {}
        }
      };
    } else {
      renderWidget();
      return () => {
        isMounted = false;
        if (widgetIdRef.current !== null && window.turnstile) {
          try {
            window.turnstile.remove(widgetIdRef.current);
          } catch (e) {}
        }
      };
    }
  }, [siteKey, theme, onVerify, onExpire]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '12px 0', minHeight: '65px' }}>
      <div ref={containerRef} />
    </div>
  );
}
