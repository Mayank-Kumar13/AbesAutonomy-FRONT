import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { paymentApi } from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpay';
import { formatRupees, getPlanDisplayPrice } from '../../utils/couponUi';
import {
  Crown,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Sparkles,
  Lock,
  Tag,
  Loader2,
} from 'lucide-react';
import './PremiumPage.css';

const PENDING_COUPON_KEY = 'abes_pending_coupon';

export default function PremiumPage() {
  const { user, setTokenAndLoad } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCouponData, setAppliedCouponData] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const applyCouponCode = useCallback(async (rawCode) => {
    const clean = String(rawCode || '').trim().toUpperCase();
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
      sessionStorage.setItem(PENDING_COUPON_KEY, res.data.coupon.code);
    } catch (err) {
      setAppliedCouponData(null);
      setCouponError(err.message || 'Invalid or expired coupon code.');
      sessionStorage.removeItem(PENDING_COUPON_KEY);
    } finally {
      setCouponLoading(false);
    }
  }, []);

  // Auto-apply from ?coupon=CODE query param or saved code across login redirect
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const urlCoupon = params.get('coupon');
    const savedCoupon = sessionStorage.getItem(PENDING_COUPON_KEY);
    const target = urlCoupon || savedCoupon;
    if (target) {
      setCouponInput(target.toUpperCase());
      applyCouponCode(target);
    }
  }, [location.search, applyCouponCode]);

  const handleCouponSubmit = (e) => {
    e.preventDefault();
    applyCouponCode(couponInput);
  };

  const handleRemoveCoupon = () => {
    setAppliedCouponData(null);
    setCouponInput('');
    setCouponError('');
    sessionStorage.removeItem(PENDING_COUPON_KEY);
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      if (appliedCouponData?.coupon?.code) {
        sessionStorage.setItem(PENDING_COUPON_KEY, appliedCouponData.coupon.code);
      }
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

      // 2. If 100% discounted coupon activated immediately, skip Razorpay
      if (orderDetails.isFreeActivation) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);
        sessionStorage.removeItem(PENDING_COUPON_KEY);

        navigate('/payment/success', {
          state: {
            plan: orderDetails.plan,
            payment: orderDetails.payment,
            subscription: orderDetails.subscription,
          },
        });
        return;
      }

      // 3. Open Razorpay Checkout modal with discounted/final amount
      const paymentResponse = await openRazorpayCheckout(orderDetails, user);

      // 4. Verify signature on backend
      const verifyRes = await paymentApi.verifyPayment(paymentResponse);

      if (verifyRes.success) {
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);
        sessionStorage.removeItem(PENDING_COUPON_KEY);

        navigate('/payment/success', {
          state: {
            plan: orderDetails.plan,
            payment: verifyRes.data.payment,
            subscription: verifyRes.data.subscription,
          },
        });
      }
    } catch (err) {
      console.error('Subscription purchase error:', err);
      if (err.message !== 'Payment cancelled by user.') {
        setError(err.message || 'Payment failed. Please try again.');
      }
    } finally {
      setLoadingPlan(null);
    }
  };

  const monthPrice = getPlanDisplayPrice('premium_1_month', 29, appliedCouponData);
  const semesterPrice = getPlanDisplayPrice('premium_4_months', 99, appliedCouponData);
  const lifetimePrice = getPlanDisplayPrice('premium_lifetime', 399, appliedCouponData);

  const renderCardPricing = (priceInfo, periodLabel, isFeatured = false) => {
    const showDiscount = priceInfo.hasCoupon && priceInfo.eligible && priceInfo.discountRupees > 0;
    return (
      <div className="prem-price-col">
        <div className="prem-price-block">
          {showDiscount && (
            <span className="prem-price-original">{formatRupees(priceInfo.originalRupees)}</span>
          )}
          <span className={`prem-price-num ${isFeatured ? 'featured' : ''} ${priceInfo.isFree && showDiscount ? 'is-free' : ''}`}>
            {priceInfo.isFree && showDiscount ? 'FREE' : formatRupees(priceInfo.finalRupees)}
          </span>
          {!(priceInfo.isFree && showDiscount) && (
            <span className="prem-price-period">{periodLabel}</span>
          )}
        </div>
        {showDiscount && (
          <span className="prem-save-badge">
            Save {formatRupees(priceInfo.discountRupees)} with {appliedCouponData.coupon.code}
          </span>
        )}
        {priceInfo.hasCoupon && !priceInfo.eligible && priceInfo.reason && (
          <span className="prem-ineligible-note">{priceInfo.reason}</span>
        )}
      </div>
    );
  };

  const faqs = [
    {
      q: 'Are Previous Year Questions (PYQs) really free forever?',
      a: 'Yes, absolutely! All PYQs and solution hints are 100% free forever for every student, whether you have a free or premium account. PYQ views never count against your free document limit.',
    },
    {
      q: 'How does the 3-free-document system work?',
      a: 'As a free student, your first 3 eligible premium document accesses are completely free of cost. Once you access a document, you can revisit and re-read it as many times as you like without consuming additional credits.',
    },
    {
      q: 'What is included in the ₹399 Lifetime Access Plan?',
      a: 'The Lifetime Plan grants you permanent, unrestricted access across all 8 semesters for your entire degree tenure. There are zero recurring renewals or annual maintenance fees.',
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM, CRED), debit/credit cards, and netbanking securely through our official Razorpay payment gateway.',
    },
    {
      q: 'Will my subscription renew automatically or deduct money?',
      a: 'No! All subscriptions on ABES Autonomy are strictly one-time payments. You will never be charged automatically. When your subscription ends, your account simply returns to free status without penalty.',
    },
    {
      q: 'Can I extend my plan before it expires?',
      a: 'Yes! If you purchase a plan while you already have an active subscription, your validity is automatically extended from your current expiry date without losing a single day.',
    },
    {
      q: 'Are AI study features included in Premium?',
      a: 'Yes! All AI Academic Assistant features, instant doubt-solving, summarization, and upcoming AI study tools are fully included in all Premium plans at no extra charge.',
    },
  ];

  return (
    <div className="prem-page">
      {/* Ambient Canvas Lighting */}
      <div className="prem-bg-decorations" aria-hidden="true">
        <div className="prem-glow-orb prem-orb-1" />
        <div className="prem-glow-orb prem-orb-2" />
        <div className="prem-glow-orb prem-orb-caustic" />
      </div>

      <div className="prem-container">
        {error && (
          <div className="prem-hero-header">
            <div className="prem-error-alert glass-clear">
              {error}
            </div>
          </div>
        )}

        {/* ─── OPTICAL PRICING SHOWCASE WITH GIANT 'PRICING' BACKDROP ─── */}
        <section className="prem-pricing-showcase">
          {/* Giant Bold Backdrop Typography (Behind the Cards) */}
          <div className="prem-bg-pricing-text" aria-hidden="true">
            Pricing
          </div>

          {/* 3 Floating Liquid Glass Cards */}
          <div className="prem-cards-grid">
            {/* ── CARD 1: ₹29/m (Monthly Plan) ── */}
            <div className="prem-glass-card">
              <div className="prem-card-refraction-lens" aria-hidden="true">
                <div className="prem-lens-caustic" />
              </div>

              <div className="prem-card-inner">
                <div className="prem-card-top">
                  <div className="prem-plan-meta">
                    <span className="prem-plan-label">Monthly Plan</span>
                    <span className="prem-plan-sub">1-Month Exam Sprint</span>
                  </div>

                  {renderCardPricing(monthPrice, '/m', false)}
                </div>

                <div className="prem-divider" />

                <ul className="prem-feature-checklist">
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Unlimited access to all subject notes & theory PDFs</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>AI Academic Study Assistant & instant doubt solver</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Handwritten toppers' notes & assignment solutions</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>PYQs included 100% free forever</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Verified student Premium badge</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="prem-card-cta-btn glass-outline"
                  onClick={() => handleSubscribe('premium_1_month')}
                  disabled={loadingPlan !== null}
                >
                  <span>
                    {loadingPlan === 'premium_1_month'
                      ? 'Opening Payment...'
                      : monthPrice.hasCoupon && monthPrice.eligible
                      ? monthPrice.isFree
                        ? 'Activate Free Now'
                        : `Get Started • ${formatRupees(monthPrice.finalRupees)}`
                      : 'Get Started'}
                  </span>
                </button>
              </div>
            </div>

            {/* ── CARD 2: ₹99/4m (Semester Plan - BEST VALUE / HIGHLIGHTED) ── */}
            <div className="prem-glass-card featured-popular">
              <div className="prem-card-refraction-lens" aria-hidden="true">
                <div className="prem-lens-caustic" />
              </div>

              <div className="prem-featured-ribbon">
                <Crown size={12} />
                <span>MOST POPULAR • FULL SEMESTER</span>
              </div>

              <div className="prem-card-inner">
                <div className="prem-card-top">
                  <div className="prem-plan-meta">
                    <span className="prem-plan-label featured">Semester Plan</span>
                    <span className="prem-plan-sub">Full Semester Coverage (₹24.75/mo)</span>
                  </div>

                  {renderCardPricing(semesterPrice, '/4m', true)}
                </div>

                <div className="prem-divider featured" />

                <ul className="prem-feature-checklist">
                  <li className="featured-item">
                    <span className="prem-check-circle featured"><Check size={13} strokeWidth={2.8} /></span>
                    <span><strong>All Monthly Plan features included</strong></span>
                  </li>
                  <li>
                    <span className="prem-check-circle featured"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Full 120-Day semester exam protection</span>
                  </li>
                  <li>
                    <span className="prem-check-circle featured"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Priority AI Study Assistant query processing</span>
                  </li>
                  <li>
                    <span className="prem-check-circle featured"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Complete question bank & solved sample papers</span>
                  </li>
                  <li>
                    <span className="prem-check-circle featured"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Early access to upcoming 2.0 academic tools</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="prem-card-cta-btn featured-solid"
                  onClick={() => handleSubscribe('premium_4_months')}
                  disabled={loadingPlan !== null}
                >
                  <Zap size={16} />
                  <span>
                    {loadingPlan === 'premium_4_months'
                      ? 'Opening Payment...'
                      : semesterPrice.hasCoupon && semesterPrice.eligible
                      ? semesterPrice.isFree
                        ? 'Activate Free Now'
                        : `Get Started • ${formatRupees(semesterPrice.finalRupees)}`
                      : 'Get Started'}
                  </span>
                </button>
              </div>
            </div>

            {/* ── CARD 3: ₹399 (Lifetime Plan - DEGREE PASS) ── */}
            <div className="prem-glass-card">
              <div className="prem-card-refraction-lens" aria-hidden="true">
                <div className="prem-lens-caustic" />
              </div>

              <div className="prem-featured-ribbon lifetime">
                <Sparkles size={12} />
                <span>ALL-DEGREE LIFETIME PASS</span>
              </div>

              <div className="prem-card-inner">
                <div className="prem-card-top">
                  <div className="prem-plan-meta">
                    <span className="prem-plan-label">Lifetime Plan</span>
                    <span className="prem-plan-sub">Entire 4-Year B.Tech Degree Access</span>
                  </div>

                  {renderCardPricing(lifetimePrice, '/lifetime', false)}
                </div>

                <div className="prem-divider" />

                <ul className="prem-feature-checklist">
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span><strong>Permanent lifetime access — Zero renewals</strong></span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>All 8 Semesters across all engineering branches</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Unlimited high-speed downloads & offline saves</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Unrestricted AI Assistant with highest token limit</span>
                  </li>
                  <li>
                    <span className="prem-check-circle"><Check size={13} strokeWidth={2.8} /></span>
                    <span>Exclusive Lifetime Scholar verified badge & VIP support</span>
                  </li>
                </ul>

                <button
                  type="button"
                  className="prem-card-cta-btn glass-outline"
                  onClick={() => handleSubscribe('premium_lifetime')}
                  disabled={loadingPlan !== null}
                >
                  <span>
                    {loadingPlan === 'premium_lifetime'
                      ? 'Opening Payment...'
                      : lifetimePrice.hasCoupon && lifetimePrice.eligible
                      ? lifetimePrice.isFree
                        ? 'Activate Free Now'
                        : `Get Started • ${formatRupees(lifetimePrice.finalRupees)}`
                      : 'Get Started'}
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* ─── LIQUID GLASS COUPON CODE BAR ─── */}
          <div className="prem-coupon-wrap">
            {appliedCouponData ? (
              <div className="prem-coupon-applied">
                <div className="prem-coupon-applied-info">
                  <span className="prem-coupon-check">
                    <Check size={14} strokeWidth={2.8} />
                  </span>
                  <div>
                    <div className="prem-coupon-applied-title">
                      Coupon <code>{appliedCouponData.coupon.code}</code> applied
                    </div>
                    <div className="prem-coupon-applied-sub">
                      {appliedCouponData.coupon.discountType === 'percentage'
                        ? `${appliedCouponData.coupon.discountValue}% OFF`
                        : `Flat ₹${appliedCouponData.coupon.discountValue} OFF`}
                      {appliedCouponData.coupon.maxDiscountRupees
                        ? ` (up to ₹${appliedCouponData.coupon.maxDiscountRupees})`
                        : ''}
                      {appliedCouponData.coupon.description
                        ? ` • ${appliedCouponData.coupon.description}`
                        : ' • Eligible plans updated above'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="prem-coupon-remove-btn"
                  onClick={handleRemoveCoupon}
                  title="Remove coupon"
                >
                  <X size={14} />
                  <span>Remove</span>
                </button>
              </div>
            ) : (
              <form className="prem-coupon-form" onSubmit={handleCouponSubmit}>
                <div className="prem-coupon-input-group">
                  <Tag size={15} className="prem-coupon-icon" />
                  <input
                    type="text"
                    placeholder="Have a coupon code? Enter code (e.g. ABES20)"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value.toUpperCase());
                      if (couponError) setCouponError('');
                    }}
                    className="prem-coupon-input"
                    maxLength={32}
                    aria-label="Coupon code"
                  />
                </div>
                <button
                  type="submit"
                  className="prem-coupon-apply-btn"
                  disabled={couponLoading || !couponInput.trim()}
                >
                  {couponLoading ? (
                    <>
                      <Loader2 size={14} className="prem-spinner" />
                      <span>Checking...</span>
                    </>
                  ) : (
                    <span>Apply Code</span>
                  )}
                </button>
              </form>
            )}
            {couponError && <p className="prem-coupon-error">{couponError}</p>}
          </div>

          {/* Bottom Billing Info Toggle */}
          <div className="prem-billing-toggle">
            <span className="prem-toggle-switch" aria-hidden="true">
              <span className="prem-toggle-slider" />
            </span>
            <span className="prem-toggle-label">One-Time Payment • No Auto-Debit • Instant UPI Activation</span>
          </div>
        </section>

        {/* ─── PLAN COMPARISON SECTION ─── */}
        <section className="prem-comparison-section">
          <div className="prem-section-header">
            <h2 className="prem-section-title">Compare Academic Plans</h2>
            <p className="prem-section-sub">Transparent feature breakdown designed for ABES engineering students</p>
          </div>

          <div className="prem-comparison-table-wrap glass-frosted">
            <table className="prem-table">
              <thead>
                <tr>
                  <th className="prem-th-feature">Feature / Resource</th>
                  <th>Free Student</th>
                  <th>Monthly (₹29)</th>
                  <th className="prem-th-highlight">Full Semester (₹99)</th>
                  <th>Lifetime (₹399)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="prem-td-feature">Previous Year Questions (PYQs)</td>
                  <td><span className="prem-pill success">✓ Free Forever</span></td>
                  <td><span className="prem-pill success">✓ Free Forever</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill success">✓ Free Forever</span></td>
                  <td><span className="prem-pill success">✓ Free Forever</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">Theory & Subject Notes</td>
                  <td><span className="prem-status-dim">3 Pdf Access</span></td>
                  <td><span className="prem-pill gold">Unlimited</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">Unlimited</span></td>
                  <td><span className="prem-pill gold">Unlimited</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">Question Banks & Model Solutions</td>
                  <td><span className="prem-status-dim">3 Pdf Access</span></td>
                  <td><span className="prem-pill gold">Unlimited</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">Unlimited</span></td>
                  <td><span className="prem-pill gold">Unlimited</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">AI Academic Assistant</td>
                  <td><span className="prem-pill locked"><Lock size={12} /> Locked</span></td>
                  <td><span className="prem-pill gold">Unlimited Access</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">Priority Speed ⚡</span></td>
                  <td><span className="prem-pill gold">Highest Quota 🚀</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">High-Speed Watermarked PDFs</td>
                  <td><span className="prem-status-dim">3 Pdf Access</span></td>
                  <td><span className="prem-pill gold">Unlimited</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">Unlimited</span></td>
                  <td><span className="prem-pill gold">Unlimited + Offline</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">Student Profile Badge</td>
                  <td><span className="prem-status-dim">Free Member</span></td>
                  <td><span className="prem-pill gold">Verified Student</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">★ Premium Scholar</span></td>
                  <td><span className="prem-pill gold">★ Lifetime Scholar</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">Duration & Validity</td>
                  <td><span className="prem-status-dim">Continuous Free</span></td>
                  <td><span className="prem-status-text">30 Days</span></td>
                  <td className="prem-td-highlight"><span className="prem-status-text bold">120 Days</span></td>
                  <td><span className="prem-status-text bold">All 4 Years (Degree)</span></td>
                </tr>
                <tr>
                  <td className="prem-td-feature">Effective Cost</td>
                  <td><span className="prem-status-dim">₹0</span></td>
                  <td><span className="prem-status-text">₹29 / month</span></td>
                  <td className="prem-td-highlight"><span className="prem-pill gold">₹24.75 / mo (Save 15%)</span></td>
                  <td><span className="prem-pill gold">One-time forever</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── RELEVANT FAQS ACCORDION ─── */}
        <section className="prem-faq-section">
          <div className="prem-section-header">
            <h2 className="prem-section-title">Got Questions? We’ve Got Answers.</h2>
            <p className="prem-section-sub">Everything you need to know about ABES Autonomy access and subscriptions</p>
          </div>

          <div className="prem-faq-grid">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`prem-faq-item glass-frosted ${openFaq === idx ? 'is-open' : ''}`}
              >
                <button
                  type="button"
                  className="prem-faq-question"
                  onClick={() => toggleFaq(idx)}
                  aria-expanded={openFaq === idx}
                >
                  <span className="prem-faq-q-text">{faq.q}</span>
                  <div className={`prem-faq-chevron-wrap ${openFaq === idx ? 'active' : ''}`}>
                    {openFaq === idx ? (
                      <ChevronUp size={18} />
                    ) : (
                      <ChevronDown size={18} />
                    )}
                  </div>
                </button>
                {openFaq === idx && (
                  <div className="prem-faq-answer">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ─── TRUST & SECURITY FOOTER ─── */}
        <div className="prem-trust-footer glass-clear">
          <div className="prem-trust-item">
            <ShieldCheck size={16} />
            <span>256-Bit SSL Encrypted</span>
          </div>
          <span className="prem-trust-sep">•</span>
          <div className="prem-trust-item">
            <Zap size={16} />
            <span>Official Razorpay UPI</span>
          </div>
          <span className="prem-trust-sep">•</span>
          <div className="prem-trust-item">
            <Sparkles size={16} />
            <span>Instant Digital Activation</span>
          </div>
          <span className="prem-trust-sep">•</span>
          <div className="prem-trust-item">
            <Lock size={16} />
            <span>Zero Auto-Debits or Hidden Fees</span>
          </div>
        </div>
      </div>
    </div>
  );
}
