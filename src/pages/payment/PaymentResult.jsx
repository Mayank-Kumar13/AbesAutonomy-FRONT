import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, ArrowRight, BookOpen, Crown } from 'lucide-react';
import { paymentApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';
import './PaymentResult.css';

export default function PaymentResult({ type = 'success' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const stateData = location.state || {};
  const [subStatus, setSubStatus] = useState(null);
  const [loading, setLoading] = useState(type === 'pending');

  useEffect(() => {
    // If user lands directly on this route or type is pending, check subscription status from backend
    paymentApi
      .getSubscriptionStatus()
      .then((res) => {
        setSubStatus(res.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const planName =
    stateData.plan?.name ||
    (subStatus?.premiumPlan === 'premium_4_months'
      ? 'Premium – 4 Months'
      : subStatus?.premiumPlan === 'premium_2_months'
      ? 'Premium – 2 Months'
      : 'ABES Autonomy Premium');

  const expiryDate =
    stateData.subscription?.endDate || subStatus?.premiumExpiryDate;

  const paymentId =
    stateData.payment?.razorpayPaymentId || stateData.payment?._id || 'Verified via Razorpay';

  if (type === 'failed') {
    return (
      <div className="pay-res-page">
        <div className="pay-res-card failed">
          <div className="pay-res-icon-wrap failed">
            <XCircle size={38} />
          </div>

          <h1 className="pay-res-title">Payment Failed</h1>
          <p className="pay-res-sub">
            Your transaction could not be completed and your Premium subscription has not been activated.
            No money was deducted. If debited, it will be automatically refunded by your bank within 2-3 business days.
          </p>

          <div className="pay-res-actions">
            <Link to="/premium" className="pay-res-btn primary">
              Try Again
            </Link>
            <Link to="/resources" className="pay-res-btn secondary">
              Back to Resources
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (type === 'pending' || loading) {
    return (
      <div className="pay-res-page">
        <div className="pay-res-card pending">
          <div className="pay-res-icon-wrap pending">
            <Clock size={38} />
          </div>

          <h1 className="pay-res-title">Payment Processing</h1>
          <p className="pay-res-sub">
            Your transaction is currently being verified with the payment gateway.
            Your Premium features will be active as soon as verification completes.
          </p>

          <div className="pay-res-actions">
            <button
              onClick={() => window.location.reload()}
              className="pay-res-btn primary"
            >
              Refresh Status
            </button>
            <Link to="/profile" className="pay-res-btn secondary">
              View Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success view
  return (
    <div className="pay-res-page">
      <div className="pay-res-card success">
        <div className="pay-res-icon-wrap success">
          <Crown size={38} />
        </div>

        <h1 className="pay-res-title">Payment Successful!</h1>
        <p className="pay-res-sub">
          Welcome to <strong>ABES Autonomy Premium</strong>. Your account now has unlimited access
          to all study materials, question banks, and AI features.
        </p>

        <div className="pay-res-details-box">
          <div className="pay-res-row">
            <span className="pay-res-label">Subscription Plan</span>
            <span className="pay-res-val">{planName}</span>
          </div>
          <div className="pay-res-row">
            <span className="pay-res-label">Status</span>
            <span className="pay-res-val" style={{ color: '#4ade80' }}>ACTIVE</span>
          </div>
          {expiryDate && (
            <div className="pay-res-row">
              <span className="pay-res-label">Valid Until</span>
              <span className="pay-res-val">{new Date(expiryDate).toLocaleDateString()}</span>
            </div>
          )}
          <div className="pay-res-row">
            <span className="pay-res-label">Transaction Ref</span>
            <span className="pay-res-val" style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
              {paymentId}
            </span>
          </div>
        </div>

        <div className="pay-res-actions">
          <Link to="/resources" className="pay-res-btn primary">
            <BookOpen size={16} />
            <span>Explore Resources</span>
          </Link>
          <Link to="/profile" className="pay-res-btn secondary">
            <span>My Profile</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </div>
  );
}
