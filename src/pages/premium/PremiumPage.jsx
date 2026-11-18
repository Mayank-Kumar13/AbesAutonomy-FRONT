import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { paymentApi } from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpay';
import {
  Crown,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Zap,
  Sparkles,
  BookOpen,
  Bot,
  Lock,
} from 'lucide-react';
import './PremiumPage.css';

export default function PremiumPage() {
  const { user, setTokenAndLoad } = useAuth();
  const navigate = useNavigate();

  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState('');
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/login', { state: { from: { pathname: '/premium' } } });
      return;
    }

    setLoadingPlan(planId);
    setError('');

    try {
      // 1. Create Razorpay order on backend
      const orderRes = await paymentApi.createOrder(planId);
      const orderDetails = orderRes.data;

      // 2. Open Razorpay Checkout modal
      const paymentResponse = await openRazorpayCheckout(orderDetails, user);

      // 3. Verify signature on backend
      const verifyRes = await paymentApi.verifyPayment(paymentResponse);

      if (verifyRes.success) {
        // Refresh authenticated user state
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);

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

  const faqs = [
    {
      q: 'Are Previous Year Questions (PYQs) really free forever?',
      a: 'Yes! All PYQs are 100% free forever for every student, whether you have a free or premium account. PYQ views never count against your free document limit.',
    },
    {
      q: 'How does the 5-free-document system work?',
      a: 'As a free student, your first 5 eligible premium document accesses are free of cost. Once you access a document, you can revisit and re-read it as many times as you like without consuming additional credits.',
    },
    {
      q: 'Which payment methods are accepted?',
      a: 'We accept all major UPI apps (Google Pay, PhonePe, Paytm, BHIM, CRED), debit/credit cards, and netbanking through our official Razorpay integration.',
    },
    {
      q: 'Will my subscription renew automatically?',
      a: 'No! All subscriptions are strictly one-time payments. You will never be charged automatically. When your subscription ends, your account simply returns to free status.',
    },
    {
      q: 'Can I extend my plan before it expires?',
      a: 'Yes! If you purchase a plan while you already have an active subscription, your validity is automatically extended from your current expiry date.',
    },
    {
      q: 'Are AI study features included in Premium?',
      a: 'Yes, all AI Academic Assistant features and upcoming AI learning integrations are fully included in both Premium plans at no extra charge.',
    },
  ];

  return (
    <div className="prem-page">
      <div className="prem-bg-decorations" aria-hidden="true">
        <div className="prem-glow-orb prem-orb-1" />
        <div className="prem-glow-orb prem-orb-2" />
      </div>

      <div className="prem-container">
        {/* Hero Section */}
        <section className="prem-hero">
          <div className="prem-badge">
            <Crown size={15} />
            <span>ABES Autonomy Premium</span>
          </div>

          <h1 className="prem-heading">
            Unlock Your Full <span>Learning Potential</span>
          </h1>

          <p className="prem-description">
            Get unlimited access to ABES Autonomy’s academic resources, verified semester notes,
            question banks, and AI-powered learning experience.
          </p>

          <div className="prem-pyq-banner">
            <Sparkles size={16} />
            <span>PYQ Section is 100% FREE FOREVER for all students — No subscription required!</span>
          </div>

          {error && (
            <div style={{ marginTop: '1.5rem', color: '#fca5a5', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 16px', borderRadius: '10px' }}>
              {error}
            </div>
          )}
        </section>

        {/* Pricing Cards Grid */}
        <section className="prem-pricing-grid">
          {/* Plan 1: 2 Months */}
          <div className="prem-plan-card">
            <div className="prem-card-header">
              <h3 className="prem-plan-title">Premium – 2 Months</h3>
              <p className="prem-plan-sub">Ideal for mid-term exams & quick revisions</p>
            </div>

            <div className="prem-card-price-wrap">
              <span className="prem-currency">₹</span>
              <span className="prem-amount">100</span>
              <span className="prem-billing-term">/ 60 Days</span>
            </div>

            <div className="prem-one-time-badge">One-time payment • No auto-renewal</div>

            <ul className="prem-features-list">
              <li>
                <Check size={18} color="#C5AC86" />
                <span>Unlimited access to all subject notes & theory PDFs</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>AI Study Assistant & interactive academic help</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>Handwritten toppers' notes & assignment solutions</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>PYQs included free forever</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>Verified student Premium badge</span>
              </li>
            </ul>

            <button
              className="prem-cta-btn"
              onClick={() => handleSubscribe('premium_2_months')}
              disabled={loadingPlan !== null}
            >
              <Zap size={18} />
              <span>{loadingPlan === 'premium_2_months' ? 'Opening Payment...' : 'Choose 2 Months'}</span>
            </button>
          </div>

          {/* Plan 2: 4 Months (Best Value) */}
          <div className="prem-plan-card best-value">
            <div className="prem-best-tag">BEST VALUE • FULL SEMESTER</div>

            <div className="prem-card-header">
              <h3 className="prem-plan-title">Premium – 4 Months</h3>
              <p className="prem-plan-sub">Complete semester protection & maximum savings</p>
            </div>

            <div className="prem-card-price-wrap">
              <span className="prem-currency">₹</span>
              <span className="prem-amount">150</span>
              <span className="prem-billing-term">/ 120 Days</span>
            </div>

            <div className="prem-one-time-badge">One-time payment • No auto-renewal</div>

            <ul className="prem-features-list">
              <li>
                <Check size={18} color="#C5AC86" />
                <span><strong>All 2-Month plan features included</strong></span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>Full semester 120-day validity (Only ₹37.5/month)</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>AI Study Assistant with priority processing</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>All semester resources, question banks & solutions</span>
              </li>
              <li>
                <Check size={18} color="#C5AC86" />
                <span>Early access to all upcoming 2.0 features</span>
              </li>
            </ul>

            <button
              className="prem-cta-btn"
              onClick={() => handleSubscribe('premium_4_months')}
              disabled={loadingPlan !== null}
            >
              <Crown size={18} />
              <span>{loadingPlan === 'premium_4_months' ? 'Opening Payment...' : 'Get Full Semester (Best Value)'}</span>
            </button>
          </div>
        </section>

        {/* Comparison Table */}
        <section className="prem-comparison-section">
          <h2 className="prem-section-title">Plan Comparison</h2>
          <p className="prem-section-sub">Transparent access control designed for students</p>

          <table className="prem-table">
            <thead>
              <tr>
                <th>Feature / Resource</th>
                <th>Free Student</th>
                <th>Premium Member</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Previous Year Questions (PYQs)</td>
                <td><span style={{ color: '#4ade80', fontWeight: 600 }}>Unlimited Free Forever</span></td>
                <td><span style={{ color: '#4ade80', fontWeight: 600 }}>Unlimited Free Forever</span></td>
              </tr>
              <tr>
                <td>Theory & Subject Notes</td>
                <td>5 Free Document Accesses</td>
                <td><span style={{ color: '#C5AC86', fontWeight: 600 }}>Unlimited Access</span></td>
              </tr>
              <tr>
                <td>Question Banks & Assignments</td>
                <td>5 Free Document Accesses</td>
                <td><span style={{ color: '#C5AC86', fontWeight: 600 }}>Unlimited Access</span></td>
              </tr>
              <tr>
                <td>AI Study Assistant</td>
                <td><span style={{ color: '#f87171' }}>Locked</span></td>
                <td><span style={{ color: '#C5AC86', fontWeight: 600 }}>Included (Unlimited)</span></td>
              </tr>
              <tr>
                <td>Dynamic Watermarked Downloads</td>
                <td>Free allowance only</td>
                <td><span style={{ color: '#C5AC86', fontWeight: 600 }}>Unlimited</span></td>
              </tr>
              <tr>
                <td>Student Profile Badge</td>
                <td>Free Member</td>
                <td><span style={{ color: '#C5AC86', fontWeight: 600 }}>★ Premium Badge</span></td>
              </tr>
            </tbody>
          </table>
        </section>

        {/* FAQs */}
        <section className="prem-faq-section">
          <h2 className="prem-section-title">Frequently Asked Questions</h2>
          <p className="prem-section-sub">Everything you need to know about ABES Autonomy Premium</p>

          {faqs.map((faq, idx) => (
            <div key={idx} className="prem-faq-item">
              <div className="prem-faq-question" onClick={() => toggleFaq(idx)}>
                <span>{faq.q}</span>
                {openFaq === idx ? <ChevronUp size={18} color="#C5AC86" /> : <ChevronDown size={18} color="#94a3b8" />}
              </div>
              {openFaq === idx && (
                <div className="prem-faq-answer">{faq.a}</div>
              )}
            </div>
          ))}
        </section>

        {/* Trust & Security Footer */}
        <div className="prem-trust-footer">
          <span><ShieldCheck size={16} style={{ display: 'inline', verticalAlign: '-3px' }} /> 256-Bit SSL Encrypted</span>
          <span>• Verified Razorpay UPI Gateway</span>
          <span>• Instant Digital Activation</span>
          <span>• No Auto-Debit / No Hidden Fees</span>
        </div>
      </div>
    </div>
  );
}
