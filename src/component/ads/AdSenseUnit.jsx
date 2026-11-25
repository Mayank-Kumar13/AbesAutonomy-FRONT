import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';

/**
 * Safely renders a Google AdSense display unit inside React SPA navigation
 * without double-pushing or pushing into zero-width hidden containers.
 */
export default function AdSenseUnit({
  clientId,
  slotId,
  variant = 'skyscraper',
  label = 'Advertisement',
  slotTitle = 'Ad Space',
  routeKey = '/',
  isPreviewVisible = false,
  isAdmin = false,
}) {
  const wrapRef = useRef(null);
  const insRef = useRef(null);
  const [unfilled, setUnfilled] = useState(false);

  const hasLiveSlot = Boolean(clientId && slotId);
  const isSkyscraper = variant === 'skyscraper';

  useEffect(() => {
    if (!hasLiveSlot) return undefined;

    const wrap = wrapRef.current;
    const ins = insRef.current;
    if (!wrap || !ins) return undefined;

    let pushed = false;
    const tryPushAd = () => {
      if (pushed) return;
      if (!wrapRef.current || !insRef.current) return;
      // Google throws TagError if pushed while display:none (width === 0)
      if (wrapRef.current.offsetWidth <= 0) return;
      if (insRef.current.getAttribute('data-adsbygoogle-status')) {
        pushed = true;
        return;
      }
      pushed = true;
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch {
        // Ad blockers or unloaded adsbygoogle.js fail silently
      }
    };

    tryPushAd();

    let ro;
    if (!pushed && typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        if (wrapRef.current && wrapRef.current.offsetWidth > 0) {
          tryPushAd();
          if (pushed) ro.disconnect();
        }
      });
      ro.observe(wrap);
    }

    const mo = new MutationObserver(() => {
      if (ins.getAttribute('data-ad-status') === 'unfilled') {
        setUnfilled(true);
      }
    });
    mo.observe(ins, { attributes: true, attributeFilter: ['data-ad-status'] });

    return () => {
      if (ro) ro.disconnect();
      mo.disconnect();
    };
  }, [hasLiveSlot, clientId, slotId, routeKey]);

  if (!hasLiveSlot) {
    if (!isPreviewVisible) return null;
    return (
      <div className={`ad-unit-frame ad-unit-frame--${variant} is-preview`}>
        <span className="ad-unit-caption">{slotTitle}</span>
        <div className="ad-unit-preview-body">
          <span className="ad-unit-preview-badge">GOOGLE ADSENSE</span>
          <strong className="ad-unit-preview-size">
            {isSkyscraper ? '160 × 600' : 'Responsive Banner'}
          </strong>
          <span className="ad-unit-preview-note">
            {isAdmin
              ? 'Paste AdSense Slot ID in Admin Panel'
              : 'Ad slot ready for live placement'}
          </span>
          {isAdmin && (
            <Link to="/admin" className="ad-unit-admin-link">
              Configure in Admin
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={wrapRef}
      className={`ad-unit-frame ad-unit-frame--${variant}${unfilled ? ' is-unfilled' : ''}`}
    >
      <span className="ad-unit-caption">{label}</span>
      <ins
        key={`${routeKey}-${slotId}`}
        ref={insRef}
        className="adsbygoogle ad-unit-ins"
        style={
          isSkyscraper
            ? { display: 'block', width: '160px', height: '600px' }
            : { display: 'block', width: '100%', minHeight: '90px' }
        }
        data-ad-client={clientId}
        data-ad-slot={slotId}
        {...(!isSkyscraper
          ? {
              'data-ad-format': 'auto',
              'data-full-width-responsive': 'true',
            }
          : {})}
      />
    </div>
  );
}
