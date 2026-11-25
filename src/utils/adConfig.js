export const DEFAULT_ADSENSE_CLIENT =
  import.meta.env.VITE_ADSENSE_CLIENT || 'ca-pub-9991688552602855';

export const DEFAULT_ADS_SETTINGS = {
  enabled: true,
  clientId: DEFAULT_ADSENSE_CLIENT,
  leftSlotId: import.meta.env.VITE_ADSENSE_LEFT_SLOT || '',
  rightSlotId: import.meta.env.VITE_ADSENSE_RIGHT_SLOT || '',
  mobileSlotId: import.meta.env.VITE_ADSENSE_MOBILE_SLOT || '',
  hideForPremium: true,
  showSetupPlaceholders: false,
};

export function mergeAdsSettings(serverAds) {
  const s = serverAds && typeof serverAds === 'object' ? serverAds : {};
  return {
    enabled: s.enabled !== undefined ? Boolean(s.enabled) : DEFAULT_ADS_SETTINGS.enabled,
    clientId: (s.clientId || '').trim() || DEFAULT_ADS_SETTINGS.clientId,
    leftSlotId: (s.leftSlotId || '').trim() || DEFAULT_ADS_SETTINGS.leftSlotId,
    rightSlotId: (s.rightSlotId || '').trim() || DEFAULT_ADS_SETTINGS.rightSlotId,
    mobileSlotId: (s.mobileSlotId || '').trim() || DEFAULT_ADS_SETTINGS.mobileSlotId,
    hideForPremium:
      s.hideForPremium !== undefined ? Boolean(s.hideForPremium) : DEFAULT_ADS_SETTINGS.hideForPremium,
    showSetupPlaceholders:
      s.showSetupPlaceholders !== undefined
        ? Boolean(s.showSetupPlaceholders)
        : DEFAULT_ADS_SETTINGS.showSetupPlaceholders,
  };
}

const ELIGIBLE_ROUTE_META = {
  '/resources': { eligible: true, shellBg: '#101211' },
  '/choosesubject': { eligible: true, shellBg: '#060709' },
  '/subject': { eligible: true, shellBg: '#060709' },
  '/mvp-projects': { eligible: true, shellBg: '#060709' },
  '/about': { eligible: true, shellBg: '#060709' },
  '/contact': { eligible: true, shellBg: '#060709' },
  '/contribute': { eligible: true, shellBg: '#060709' },
  '/privacy': { eligible: true, shellBg: '#060709' },
  '/terms': { eligible: true, shellBg: '#060709' },
};

export function getRouteAdConfig(pathname = '/') {
  const normalized = String(pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';
  return ELIGIBLE_ROUTE_META[normalized] || { eligible: false, shellBg: '#060709' };
}
