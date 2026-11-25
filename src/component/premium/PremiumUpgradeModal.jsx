import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { paymentApi } from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpay';
import { formatRupees, getPlanDisplayPrice } from '../../utils/couponUi';
import { Crown, Check, X, Shield, Zap, Sparkles, ArrowRight, Loader2, Clock, Tag } from 'lucide-react';
import './PremiumUpgradeModal.css';

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  message = 'You have used all 3 free document accesses. Upgrade to Premium for unlimited access.',
  onSuccess,
  freePdfResetAt: propResetAt,
}) {
  const { user, setTokenAndLoad } = useAuth();
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCouponData, setAppliedCouponData] = useState(null);

  const targetResetAt = propResetAt || user?.freePdfResetAt || null;
  const [countdown, setCountdown] = useState(null);

  useEffect(() => {
    if (!targetResetAt) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const diff = Math.max(0, new Date(targetResetAt).getTime() - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setCountdown({ hours, minutes, seconds, totalSecs });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [targetResetAt]);

  const handleApplyCoupon = useCallback(async (e) => {
    e.preventDefault();
    const clean = couponInput.trim().toUpperCase();
    if (!clean) {
      setCouponError('Please enter a coupon code.');
      return;
    }
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await paymentApi.validateCoupon(clean);
      setAppliedCouponData(res.data);
      setCouponInput(res.data.coupon.code);
    } catch (err) {
      setAppliedCouponData(null);
      setCouponError(err.message || 'Invalid or expired coupon code.');
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput]);

  const handleRemoveCoupon = () => {
    setAppliedCouponData(null);
    setCouponInput('');
    setCouponError('');
  };

  if (!isOpen) return null;

  const monthPrice = getPlanDisplayPrice('premium_1_month', 29, appliedCouponData);
  const semesterPrice = getPlanDisplayPrice('premium_4_months', 99, appliedCouponData);

  const handleCheckout = async (planId) => {
    if (!user) {
      if (onClose) onClose();
      navigate('/login', { state: { from: { pathname: '/premium' } } });
      return;
    }

    setLoadingPlan(planId);
    setError('');

    const planPriceInfo = getPlanDisplayPrice(planId, 0, appliedCouponData);
    const couponToUse =
      appliedCouponData?.coupon?.code && planPriceInfo.eligible
        ? appliedCouponData.coupon.code
        : null;

    try {
      // 1. Create order (or instant 100% coupon unlock) on backend
      const orderRes = await paymentApi.createOrder(planId, couponToUse);
      const orderDetails = orderRes.data;

      if (orderDetails.isFreeActivation) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);

        if (onSuccess) onSuccess(orderDetails);
        if (onClose) onClose();
        navigate('/payment/success', {
          state: {
            plan: orderDetails.plan,
            payment: orderDetails.payment,
            subscription: orderDetails.subscription,
          },
        });
        return;
      }

      // 2. Open Razorpay checkout
      const paymentResponse = await openRazorpayCheckout(orderDetails, user);

      // 3. Verify payment signature on backend
      const verifyRes = await paymentApi.verifyPayment(paymentResponse);

      if (verifyRes.success) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);

        if (onSuccess) onSuccess(verifyRes.data);
        if (onClose) onClose();
        navigate('/payment/success', {
          state: {
            plan: orderDetails.plan,
            payment: verifyRes.data.payment,
            subscription: verifyRes.data.subscription,
          },
        });
      }
    } catch (err) {
      console.error('Payment checkout error:', err);
      if (err.message !== 'Payment cancelled by user.') {
        setError(err.message || 'Payment processing failed. Please try again.');
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  const handleViewAllPlans = () => {
    if (onClose) onClose();
    navigate(
      appliedCouponData?.coupon?.code
        ? `/premium?coupon=${encodeURIComponent(appliedCouponData.coupon.code)}`
        : '/premium'
    );
  };

  const renderModalPrice = (priceInfo, period, isFeatured = false) => {
    const showDiscount = priceInfo.hasCoupon && priceInfo.eligible && priceInfo.discountRupees > 0;
    return (
      <div className="pum-price-wrap">
        {showDiscount && (
          <span className="pum-price-orig">{formatRupees(priceInfo.originalRupees)}</span>
        )}
        <span className={`pum-price-num ${isFeatured ? 'featured' : ''} ${priceInfo.isFree && showDiscount ? 'is-free' : ''}`}>
          {priceInfo.isFree && showDiscount ? 'FREE' : formatRupees(priceInfo.finalRupees)}
        </span>
        {!(priceInfo.isFree && showDiscount) && (
          <span className="pum-price-period">{period}</span>
        )}
      </div>
    );
  };

  return (
    <div className="pum-backdrop" onClick={onClose}>
      <div 
        className="pum-modal-container" 
        onClick={(e) => e.stopPropagation()} 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="pum-title"
      >
        {/* Ambient Modal Lighting Orbs */}
        <div className="pum-ambient-orbs" aria-hidden="true">
          <div className="pum-orb-glow" />
          <div className="pum-orb-caustic" />
        </div>

        {/* Mac OS Frosted Titlebar */}
        <div className="pum-window-header">
          <div className="pum-mac-dots" aria-hidden="true">
            <span className="pum-dot pum-dot-red" onClick={onClose} title="Close" />
            <span className="pum-dot pum-dot-amber" />
            <span className="pum-dot pum-dot-green" />
          </div>

          <div className="pum-header-chip">
            <Crown size={12} className="pum-chip-crown" />
            <span>ABES AUTONOMY PREMIUM</span>
          </div>

          <button className="pum-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={15} />
          </button>
        </div>

        {/* Modal Hero Title & Subtitle */}
        <div className="pum-modal-hero">
          <h2 id="pum-title" className="pum-title">
            Unlock Unlimited <span>Learning</span>
          </h2>
          <p className="pum-subtitle">
            {message || 'You have reached your 3 free document accesses. Continue studying without limits.'}
          </p>
        </div>

        {/* Error Alert if any */}
        {error && (
          <div className="pum-error-banner" role="alert">
            {error}
          </div>
        )}

        {/* 24-Hour Free Quota Reset Timer Banner */}
        {countdown && (
          <div className="pum-timer-banner">
            <div className="pum-timer-left">
              <div className="pum-timer-label">
                <Clock size={13} className="pum-timer-clock-icon" />
                <span>DAILY FREE QUOTA RENEWS IN</span>
              </div>
              <div className="pum-timer-clock">
                <span className="pum-timer-num">{String(countdown.hours).padStart(2, '0')}</span>
                <span className="pum-timer-unit">h</span>
                <span className="pum-timer-sep">:</span>
                <span className="pum-timer-num">{String(countdown.minutes).padStart(2, '0')}</span>
                <span className="pum-timer-unit">m</span>
                <span className="pum-timer-sep">:</span>
                <span className="pum-timer-num">{String(countdown.seconds).padStart(2, '0')}</span>
                <span className="pum-timer-unit">s</span>
              </div>
            </div>
            <div className="pum-timer-right">
              <span className="pum-timer-prompt">
                Don't want to wait? Buy Premium from <strong>₹29</strong> for instant access!
              </span>
            </div>
          </div>
        )}

        {/* Compact Coupon Code Bar inside Modal */}
        <div className="pum-coupon-row">
          {appliedCouponData ? (
            <div className="pum-coupon-applied">
              <div className="pum-coupon-applied-left">
                <Check size={13} className="pum-coupon-check-icon" />
                <span>
                  Coupon <code>{appliedCouponData.coupon.code}</code> applied (
                  {appliedCouponData.coupon.discountType === 'percentage'
                    ? `${appliedCouponData.coupon.discountValue}% OFF`
                    : `Flat ₹${appliedCouponData.coupon.discountValue} OFF`}
                  )
                </span>
              </div>
              <button
                type="button"
                className="pum-coupon-clear"
                onClick={handleRemoveCoupon}
              >
                <X size={12} /> Remove
              </button>
            </div>
          ) : (
            <form className="pum-coupon-form" onSubmit={handleApplyCoupon}>
              <Tag size={13} className="pum-coupon-tag-icon" />
              <input
                type="text"
                placeholder="Have a coupon code? Enter here (e.g. ABES20)"
                value={couponInput}
                onChange={(e) => {
                  setCouponInput(e.target.value.toUpperCase());
                  if (couponError) setCouponError('');
                }}
                className="pum-coupon-input"
                maxLength={32}
              />
              <button
                type="submit"
                className="pum-coupon-btn"
                disabled={couponLoading || !couponInput.trim()}
              >
                {couponLoading ? 'Checking...' : 'Apply'}
              </button>
            </form>
          )}
          {couponError && <div className="pum-coupon-err">{couponError}</div>}
        </div>

        {/* ─── SIDE-BY-SIDE 2-COLUMN LIQUID GLASS PLANS GRID ─── */}
        <div className="pum-cards-grid">
          {/* ── CARD 1: Monthly Plan (₹29) ── */}
          <div className="pum-glass-card pum-card-monthly">
            <div className="pum-card-refraction-lens" aria-hidden="true">
              <div className="pum-lens-caustic" />
            </div>

            <div className="pum-card-content">
              <div className="pum-card-top-row">
                <div className="pum-badge-pill standard">
                  <Sparkles size={11} />
                  <span>EXAM SPRINT</span>
                </div>
                {monthPrice.hasCoupon && monthPrice.eligible && monthPrice.discountRupees > 0 && (
                  <span className="pum-save-tag">Save {formatRupees(monthPrice.discountRupees)}</span>
                )}
              </div>

              <div className="pum-plan-header">
                <div className="pum-plan-meta">
                  <span className="pum-plan-title">Monthly Plan</span>
                  <span className="pum-plan-sub">30-Day Complete Notes Pass</span>
                </div>

                {renderModalPrice(monthPrice, '/m', false)}
              </div>

              <div className="pum-divider" />

              <ul className="pum-checklist">
                <li>
                  <span className="pum-check-circle"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Unlimited access to all subject notes & theory PDFs</span>
                </li>
                <li>
                  <span className="pum-check-circle"><Check size={11} strokeWidth={2.8} /></span>
                  <span>AI Academic Study Assistant & instant solver</span>
                </li>
                <li>
                  <span className="pum-check-circle"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Handwritten toppers' notes & assignments</span>
                </li>
                <li>
                  <span className="pum-check-circle"><Check size={11} strokeWidth={2.8} /></span>
                  <span>PYQs included 100% free forever</span>
                </li>
                <li>
                  <span className="pum-check-circle"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Verified student Premium badge</span>
                </li>
              </ul>

              <button
                type="button"
                className="pum-cta-btn pum-btn-outline"
                onClick={() => handleCheckout('premium_1_month')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'premium_1_month' ? (
                  <>
                    <Loader2 size={14} className="pum-spinner" />
                    <span>Opening Payment...</span>
                  </>
                ) : (
                  <span>
                    {monthPrice.isFree && monthPrice.eligible
                      ? 'Activate 1 Month Free'
                      : `Get 1 Month • ${formatRupees(monthPrice.finalRupees)}`}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* ── CARD 2: Semester Plan (₹99) - BEST VALUE / HIGHLIGHTED ── */}
          <div className="pum-glass-card pum-card-semester featured">
            <div className="pum-card-refraction-lens" aria-hidden="true">
              <div className="pum-lens-caustic" />
            </div>

            <div className="pum-card-content">
              <div className="pum-card-top-row">
                <div className="pum-badge-pill featured">
                  <Crown size={11} />
                  <span>MOST POPULAR • FULL SEMESTER</span>
                </div>
                {semesterPrice.hasCoupon && semesterPrice.eligible && semesterPrice.discountRupees > 0 && (
                  <span className="pum-save-tag">Save {formatRupees(semesterPrice.discountRupees)}</span>
                )}
              </div>

              <div className="pum-plan-header">
                <div className="pum-plan-meta">
                  <span className="pum-plan-title featured">Semester Plan</span>
                  <span className="pum-plan-sub">Full Semester Coverage (₹24.75/mo)</span>
                </div>

                {renderModalPrice(semesterPrice, '/4m', true)}
              </div>

              <div className="pum-divider featured" />

              <ul className="pum-checklist">
                <li className="pum-highlight-item">
                  <span className="pum-check-circle featured"><Check size={11} strokeWidth={2.8} /></span>
                  <span><strong>All Monthly Plan features included</strong></span>
                </li>
                <li>
                  <span className="pum-check-circle featured"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Full 120-Day semester exam protection</span>
                </li>
                <li>
                  <span className="pum-check-circle featured"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Priority AI Study Assistant query processing</span>
                </li>
                <li>
                  <span className="pum-check-circle featured"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Complete question bank & solved sample papers</span>
                </li>
                <li>
                  <span className="pum-check-circle featured"><Check size={11} strokeWidth={2.8} /></span>
                  <span>Early access to upcoming 2.0 academic tools</span>
                </li>
              </ul>

              <button
                type="button"
                className="pum-cta-btn pum-btn-featured"
                onClick={() => handleCheckout('premium_4_months')}
                disabled={loadingPlan !== null}
              >
                {loadingPlan === 'premium_4_months' ? (
                  <>
                    <Loader2 size={14} className="pum-spinner" />
                    <span>Opening Payment...</span>
                  </>
                ) : (
                  <>
                    <Zap size={14} />
                    <span>
                      {semesterPrice.isFree && semesterPrice.eligible
                        ? 'Activate Semester Free'
                        : `Get Semester Pass • ${formatRupees(semesterPrice.finalRupees)}`}
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer: View all plans & Trust Note */}
        <div className="pum-modal-footer">
          <button
            type="button"
            className="pum-view-all-link"
            onClick={handleViewAllPlans}
          >
            <span>Looking for Degree Lifetime Pass (₹399)? View all plans & comparison</span>
            <ArrowRight size={13} />
          </button>

          <div className="pum-trust-line">
            <Shield size={12} />
            <span>One-Time Payment • No Auto-Renewal • Instant UPI Activation via Razorpay</span>
          </div>
        </div>
      </div>
    </div>
  );
}
