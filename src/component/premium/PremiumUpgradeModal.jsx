import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { paymentApi } from '../../services/api';
import { openRazorpayCheckout } from '../../utils/razorpay';
import { Crown, Check, X, Shield, Zap, Sparkles } from 'lucide-react';
import './PremiumUpgradeModal.css';

export default function PremiumUpgradeModal({
  isOpen,
  onClose,
  message = 'You have used all 3 free document accesses. Upgrade to Premium for unlimited access.',
  onSuccess,
}) {
  const { user, setTokenAndLoad } = useAuth();
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState('premium_4_months');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (planId) => {
    if (!user) {
      onClose();
      navigate('/login', { state: { from: { pathname: '/premium' } } });
      return;
    }

    setLoading(true);
    setError('');

    try {
      // 1. Create order on backend
      const orderRes = await paymentApi.createOrder(planId);
      const orderDetails = orderRes.data;

      // 2. Open Razorpay checkout
      const paymentResponse = await openRazorpayCheckout(orderDetails, user);

      // 3. Verify payment signature on backend
      const verifyRes = await paymentApi.verifyPayment(paymentResponse);

      if (verifyRes.success) {
        // Refresh auth profile
        const currentToken = localStorage.getItem('token');
        if (currentToken) await setTokenAndLoad(currentToken);

        if (onSuccess) onSuccess(verifyRes.data);
        onClose();
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
      setLoading(false);
    }
  };

  return (
    <div className="pum-backdrop" onClick={onClose}>
      <div className="pum-card" onClick={(e) => e.stopPropagation()}>
        <div className="pum-window-header">
          <div className="mac-dots" aria-hidden="true">
            <span className="mac-dot red" onClick={onClose} title="Close" />
            <span className="mac-dot amber" />
            <span className="mac-dot green" />
          </div>
          <button className="pum-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <div className="pum-badge">
          <Crown size={14} />
          <span>ABES Autonomy Premium</span>
        </div>

        <h2 className="pum-title">
          Unlock Unlimited <span>Learning</span>
        </h2>

        <p className="pum-message">{message}</p>

        <div className="pum-pyq-notice">
          <Sparkles size={14} />
          <span>PYQ Previous Year Questions remain 100% Free Forever for all students!</span>
        </div>

        {error && (
          <div style={{ color: '#fca5a5', fontSize: '0.85rem', marginBottom: '1rem', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        <div className="pum-plans-grid">
          {/* Plan 1 */}
          <div
            className={`pum-plan-card ${selectedPlan === 'premium_1_month' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('premium_1_month')}
          >
            <h3 className="pum-plan-name">Monthly Plan</h3>
            <div className="pum-plan-price">₹49</div>
            <div className="pum-plan-duration">Validity: 30 Days</div>
            <ul className="pum-plan-features">
              <li><Check size={14} color="#C5AC86" /> All premium PDFs & Notes</li>
              <li><Check size={14} color="#C5AC86" /> AI Study Assistant</li>
              <li><Check size={14} color="#C5AC86" /> Verified Study Materials</li>
              <li><Check size={14} color="#C5AC86" /> Premium Student Badge</li>
            </ul>
            <button
              className="pum-upgrade-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('premium_1_month');
              }}
              disabled={loading}
            >
              {loading && selectedPlan === 'premium_1_month' ? 'Opening UPI...' : 'Get Monthly (₹49)'}
            </button>
          </div>

          {/* Plan 2 */}
          <div
            className={`pum-plan-card best-value ${selectedPlan === 'premium_4_months' ? 'selected' : ''}`}
            onClick={() => setSelectedPlan('premium_4_months')}
          >
            <div className="pum-best-value-pill">BEST VALUE</div>
            <h3 className="pum-plan-name">Semester Plan</h3>
            <div className="pum-plan-price">₹139</div>
            <div className="pum-plan-duration">Validity: 120 Days (Full Semester)</div>
            <ul className="pum-plan-features">
              <li><Check size={14} color="#C5AC86" /> All Monthly Features</li>
              <li><Check size={14} color="#C5AC86" /> Complete Semester Validity</li>
              <li><Check size={14} color="#C5AC86" /> AI-Powered Learning Tools</li>
              <li><Check size={14} color="#C5AC86" /> Priority AI Query Processing</li>
            </ul>
            <button
              className="pum-upgrade-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleCheckout('premium_4_months');
              }}
              disabled={loading}
            >
              {loading && selectedPlan === 'premium_4_months' ? 'Opening UPI...' : 'Get Semester (₹139)'}
            </button>
          </div>
        </div>

        <p className="pum-footer-note">
          <Shield size={13} />
          <span>One-time payment • No auto-renewal • Or check out our <a href="/premium" style={{ color: '#DFCAAA', textDecoration: 'underline' }}>₹499 Lifetime Degree Pass</a></span>
        </p>
      </div>
    </div>
  );
}
