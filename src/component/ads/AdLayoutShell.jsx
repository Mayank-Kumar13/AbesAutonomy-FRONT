import React from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { getRouteAdConfig } from '../../utils/adConfig';
import AdSenseUnit from './AdSenseUnit';
import './AdLayoutShell.css';

export default function AdLayoutShell({ children }) {
  const location = useLocation();
  const { user, adsSettings } = useAuth();

  const routeConfig = getRouteAdConfig(location.pathname);
  if (!routeConfig.eligible) {
    return <>{children}</>;
  }

  const params = new URLSearchParams(location.search);
  const adPreviewParam = params.get('adpreview') === '1';
  const isAdmin = Boolean(user && (user.role === 'admin' || user.isSuperAdmin === true));
  const isPremiumUser = Boolean(user?.isPremium === true);

  const adsEnabled = Boolean(adsSettings?.enabled ?? true) || adPreviewParam;
  const blockedByPremium = Boolean((adsSettings?.hideForPremium ?? true) && isPremiumUser && !adPreviewParam);

  if (!adsEnabled || blockedByPremium) {
    return <>{children}</>;
  }

  const clientId = adsSettings?.clientId || '';
  const leftSlotId = adsSettings?.leftSlotId || '';
  const rightSlotId = adsSettings?.rightSlotId || '';
  const mobileSlotId = adsSettings?.mobileSlotId || '';
  const isPreviewVisible =
    adPreviewParam || isAdmin || Boolean(adsSettings?.showSetupPlaceholders);

  const hasLeftRail = Boolean(leftSlotId) || isPreviewVisible;
  const hasRightRail = Boolean(rightSlotId) || isPreviewVisible;
  const hasMobileBanner = Boolean(mobileSlotId) || isPreviewVisible;

  if (!hasLeftRail && !hasRightRail && !hasMobileBanner) {
    return <>{children}</>;
  }

  return (
    <div
      className={`ad-rail-shell${hasLeftRail || hasRightRail ? ' has-side-rails' : ''}`}
      style={{ '--ad-shell-bg': routeConfig.shellBg }}
    >
      {(hasLeftRail || hasRightRail) && (
        <aside className="ad-rail-col ad-rail-col--left" aria-label="Sponsored sidebar left">
          {hasLeftRail && (
            <div className="ad-rail-sticky">
              <AdSenseUnit
                key={`left-${location.pathname}-${leftSlotId}`}
                clientId={clientId}
                slotId={leftSlotId}
                variant="skyscraper"
                slotTitle="Left Ad Rail"
                routeKey={location.pathname}
                isPreviewVisible={isPreviewVisible}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </aside>
      )}

      <div className="ad-rail-center">
        {children}
        {hasMobileBanner && (
          <div className="ad-mobile-banner-slot" aria-label="Sponsored banner">
            <AdSenseUnit
              key={`mobile-${location.pathname}-${mobileSlotId || leftSlotId || rightSlotId}`}
              clientId={clientId}
              slotId={mobileSlotId || leftSlotId || rightSlotId}
              variant="banner"
              slotTitle="Mobile / Tablet Ad Slot"
              routeKey={location.pathname}
              isPreviewVisible={isPreviewVisible}
              isAdmin={isAdmin}
            />
          </div>
        )}
      </div>

      {(hasLeftRail || hasRightRail) && (
        <aside className="ad-rail-col ad-rail-col--right" aria-label="Sponsored sidebar right">
          {hasRightRail && (
            <div className="ad-rail-sticky">
              <AdSenseUnit
                key={`right-${location.pathname}-${rightSlotId}`}
                clientId={clientId}
                slotId={rightSlotId}
                variant="skyscraper"
                slotTitle="Right Ad Rail"
                routeKey={location.pathname}
                isPreviewVisible={isPreviewVisible}
                isAdmin={isAdmin}
              />
            </div>
          )}
        </aside>
      )}
    </div>
  );
}
