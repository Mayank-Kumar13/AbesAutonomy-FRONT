export function formatRupees(value) {
  const num = Number(value);
  if (!Number.isFinite(num) || num <= 0) return '₹0';
  return Number.isInteger(num) ? `₹${num}` : `₹${num.toFixed(2).replace(/\.?0+$/, '')}`;
}

export function getPlanDisplayPrice(planId, baseRupees, appliedCouponData) {
  const planInfo = appliedCouponData?.plans?.[planId];
  if (!appliedCouponData || !planInfo) {
    return {
      hasCoupon: false,
      eligible: true,
      originalRupees: baseRupees,
      finalRupees: baseRupees,
      discountRupees: 0,
      isFree: false,
      reason: '',
    };
  }

  return {
    hasCoupon: true,
    eligible: planInfo.eligible,
    originalRupees: planInfo.originalRupees ?? baseRupees,
    finalRupees: planInfo.finalRupees ?? baseRupees,
    discountRupees: planInfo.discountRupees ?? 0,
    isFree: Boolean(planInfo.isFree),
    reason: planInfo.reason || '',
  };
}
