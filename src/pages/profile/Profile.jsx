import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Crown,
  Zap,
  Shield,
  Sparkles,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  Lock,
  ArrowUpRight,
  Check,
  RotateCcw,
  ShieldCheck,
  CreditCard,
  Edit3,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthContext';
import { paymentApi } from '../../services/api';
import './Profile.css';

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const currentUser = user || {
    name: 'Mayank Kotuli',
    email: 'mayank.21b0121099@abes.ac.in',
    mobile: '+91 98765 43210',
    provider: 'google',
    createdAt: '2026-08-15T10:00:00.000Z',
    lastLogin: '2026-11-24T09:30:00.000Z',
    loginCount: 42,
  };

  const [student, setStudent] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [initialData, setInitialData] = useState({
    name: '',
    email: '',
    mobile: '',
  });
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [subData, setSubData] = useState(null);

  useEffect(() => {
    const userData = {
      name: currentUser.name || '',
      email: currentUser.email || '',
      mobile: currentUser.mobile || '',
    };
    setStudent(userData);
    setInitialData(userData);

    if (user) {
      paymentApi
        .getSubscriptionStatus()
        .then((res) => setSubData(res.data))
        .catch(() => {});
    }
  }, [user]);

  const handleChange = (e) => {
    setStudent({
      ...student,
      [e.target.name]: e.target.value,
    });
  };

  const handleReset = () => {
    setStudent(initialData);
    setStatusMessage({ type: '', text: '' });
  };

  const isModified =
    student.name !== initialData.name || student.mobile !== initialData.mobile;

  const handleSave = async () => {
    setSaving(true);
    setStatusMessage({ type: '', text: '' });
    try {
      await updateProfile({
        name: student.name,
        mobile: student.mobile,
      });
      setInitialData(student);
      setStatusMessage({
        type: 'success',
        text: 'Profile details updated successfully.',
      });
      setTimeout(() => setStatusMessage({ type: '', text: '' }), 4000);
    } catch (err) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to update profile.',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatPlanName = (plan) => {
    if (plan === 'premium_lifetime') return 'Lifetime Degree Pass';
    if (plan === 'premium_4_months') return 'Full Semester (4 Months)';
    if (plan === 'premium_1_month') return '1-Month Intensive';
    if (plan === 'premium_2_months') return '2-Month Sprint';
    return plan || 'Premium Member';
  };

  // Generate fallback avatar monogram initials
  const initials = student.name
    ? student.name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((n) => n[0].toUpperCase())
        .join('')
    : 'AB';

  const freeTotal = subData?.freePdfMax || 3;
  const freeUsed = subData?.freePdfAccessCount || 0;
  const freeRemaining = subData?.freePdfRemaining ?? Math.max(0, freeTotal - freeUsed);
  const freeResetAt = subData?.freePdfResetAt || user?.freePdfResetAt || null;
  const [profileTimer, setProfileTimer] = useState(null);

  useEffect(() => {
    if (!freeResetAt || freeRemaining > 0) {
      setProfileTimer(null);
      return;
    }
    const update = () => {
      const diff = Math.max(0, new Date(freeResetAt).getTime() - Date.now());
      const totalSecs = Math.floor(diff / 1000);
      const hours = Math.floor(totalSecs / 3600);
      const minutes = Math.floor((totalSecs % 3600) / 60);
      const seconds = totalSecs % 60;
      setProfileTimer(`${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [freeResetAt, freeRemaining]);

  return (
    <div className="prof-page">
      {/* Ambient Radial Illumination */}
      <div className="prof-bg-decorations" aria-hidden="true">
        <div className="prof-ambient-glow" />
      </div>

      <div className="prof-container">
        {/* ─── APPLE iOS 27 LIQUID GLASS IDENTITY CARD ─── */}
        <div className="prof-glass-identity-card">
          {/* Card Top macOS/iOS Control Bar */}
          <div className="prof-card-topbar">
            <div className="prof-window-dots">
              <span className="prof-dot red" />
              <span className="prof-dot yellow" />
              <span className="prof-dot green" />
            </div>
            <div className="prof-window-title">
              <ShieldCheck size={13} className="prof-top-icon" />
              <span>ABES AUTONOMY • VERIFIED STUDENT IDENTITY</span>
            </div>
            <div className="prof-window-status">
              <span className="prof-online-pulse" />
              <span>ONLINE</span>
            </div>
          </div>

          {/* ─── PFP (PROFILE PICTURE) & HEADER SECTION ─── */}
          <div className="prof-avatar-section">
            <div className="prof-avatar-bezel">
              {currentUser.profilePicture ? (
                <img
                  src={currentUser.profilePicture}
                  alt={student.name || 'User Avatar'}
                  className="prof-pfp-image"
                />
              ) : (
                <div className="prof-pfp-monogram">
                  <span>{initials}</span>
                </div>
              )}
              <div className="prof-pfp-online-badge" title="Active Account">
                <span className="prof-online-core" />
              </div>
            </div>

            <div className="prof-identity-meta">
              <h1 className="prof-display-name">{student.name || 'Student Name'}</h1>
              <div className="prof-verified-email-pill">
                <Mail size={13} />
                <span>{student.email}</span>
                <CheckCircle2 size={13} className="prof-verified-check" />
              </div>

              {/* Tier Badge Pill */}
              <div className="prof-tier-badge-wrap">
                {subData?.isSuperAdmin ? (
                  <span className="prof-tier-pill super-admin">
                    <Crown size={13} />
                    <span>SUPER ADMIN</span>
                  </span>
                ) : subData?.isPremium ? (
                  <span className="prof-tier-pill premium">
                    <Crown size={13} />
                    <span>★ PREMIUM SCHOLAR</span>
                  </span>
                ) : subData?.premiumStatus === 'EXPIRED' ? (
                  <span className="prof-tier-pill expired">
                    <span>PREMIUM EXPIRED</span>
                  </span>
                ) : (
                  <span className="prof-tier-pill free">
                    <Shield size={13} />
                    <span>FREE STUDENT TIER</span>
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─── MEMBERSHIP & QUOTA GLASS TILE ─── */}
          <div className="prof-membership-tile glass-frosted">
            {subData?.isSuperAdmin ? (
              <div className="prof-membership-content">
                <div className="prof-member-icon-wrap gold">
                  <Crown size={22} />
                </div>
                <div className="prof-member-info">
                  <h3 className="prof-member-title">Super Administrator Access</h3>
                  <p className="prof-member-desc">
                    Your account has unrestricted platform exemption with complete access to all academic resources, analytics, and admin tools.
                  </p>
                </div>
              </div>
            ) : subData?.isPremium ? (
              <div className="prof-membership-content">
                <div className="prof-member-icon-wrap gold">
                  <Crown size={22} />
                </div>
                <div className="prof-member-info">
                  <div className="prof-member-title-row">
                    <h3 className="prof-member-title">
                      {formatPlanName(subData.premiumPlan)}
                    </h3>
                    <span className="prof-status-active-pill">ACTIVE</span>
                  </div>
                  <p className="prof-member-desc">
                    Valid until{' '}
                    <strong>
                      {subData.premiumExpiryDate
                        ? new Date(subData.premiumExpiryDate).toLocaleDateString(undefined, {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })
                        : '—'}
                    </strong>{' '}
                    ({subData.daysRemaining} days remaining). Full unlimited access to all notes and AI tools.
                  </p>
                </div>
                <Link to="/premium" className="prof-tile-action-btn gold">
                  <Zap size={14} />
                  <span>Extend Plan</span>
                </Link>
              </div>
            ) : subData?.premiumStatus === 'EXPIRED' ? (
              <div className="prof-membership-content">
                <div className="prof-member-icon-wrap expired">
                  <Clock size={22} />
                </div>
                <div className="prof-member-info">
                  <h3 className="prof-member-title">Subscription Expired</h3>
                  <p className="prof-member-desc">
                    Your previous plan expired on{' '}
                    {subData.premiumExpiryDate
                      ? new Date(subData.premiumExpiryDate).toLocaleDateString()
                      : '—'}
                    . Renew to regain full access to notes, toppers' copies, and AI tools.
                  </p>
                </div>
                <Link to="/premium" className="prof-tile-action-btn gold">
                  <Sparkles size={14} />
                  <span>Renew Premium</span>
                </Link>
              </div>
            ) : (
              <div className="prof-membership-content">
                <div className="prof-member-icon-wrap free">
                  <Shield size={22} />
                </div>
                <div className="prof-member-info">
                  <div className="prof-member-title-row">
                    <h3 className="prof-member-title">Free Student Account</h3>
                    <span className="prof-quota-counter">
                      {freeUsed} / {freeTotal} Used
                    </span>
                  </div>
                  <p className="prof-member-desc">
                    {freeRemaining > 0
                      ? `${freeRemaining} free document accesses remaining. Previous Year Questions (PYQs) remain 100% free forever.`
                      : profileTimer 
                        ? `Daily limit reached. Renews in ${profileTimer} (or Upgrade to Premium for unlimited access).`
                        : `You have used all ${freeTotal} free document accesses for today. Quota renews in 24 hours.`}
                  </p>
                  <div className="prof-quota-bar-track">
                    <div
                      className="prof-quota-bar-fill"
                      style={{
                        width: `${Math.min(100, (freeUsed / freeTotal) * 100)}%`,
                      }}
                    />
                  </div>
                </div>
                <Link to="/premium" className="prof-tile-action-btn gold">
                  <Crown size={14} />
                  <span>Upgrade to Premium</span>
                </Link>
              </div>
            )}
          </div>

          {/* ─── FORMATTED USER DETAILS SECTION (iOS FORM STYLE) ─── */}
          <div className="prof-details-section">
            <h2 className="prof-section-heading">Personal Information</h2>

            <div className="prof-form-card glass-frosted">
              {/* Full Name Field */}
              <div className="prof-field-row">
                <div className="prof-field-label">
                  <User size={15} />
                  <span>Full Name</span>
                </div>
                <div className="prof-field-input-wrap">
                  <input
                    type="text"
                    name="name"
                    value={student.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className="prof-glass-input"
                  />
                  <Edit3 size={14} className="prof-input-edit-icon" />
                </div>
              </div>

              <div className="prof-row-divider" />

              {/* Email Field (Verified Readonly) */}
              <div className="prof-field-row">
                <div className="prof-field-label">
                  <Mail size={15} />
                  <span>Email Address</span>
                </div>
                <div className="prof-field-input-wrap">
                  <input
                    type="email"
                    name="email"
                    value={student.email}
                    disabled
                    className="prof-glass-input disabled"
                  />
                  <span className="prof-verified-badge" title="Verified College Email">
                    <Lock size={12} />
                    <span>Verified</span>
                  </span>
                </div>
              </div>

              <div className="prof-row-divider" />

              {/* Mobile Number Field */}
              <div className="prof-field-row">
                <div className="prof-field-label">
                  <Phone size={15} />
                  <span>Mobile Number</span>
                </div>
                <div className="prof-field-input-wrap">
                  <input
                    type="tel"
                    name="mobile"
                    value={student.mobile}
                    onChange={handleChange}
                    placeholder="Add your mobile number"
                    className="prof-glass-input"
                  />
                  <Edit3 size={14} className="prof-input-edit-icon" />
                </div>
              </div>
            </div>

            {/* Notification Toast */}
            {statusMessage.text && (
              <div className={`prof-status-toast ${statusMessage.type} anim-fade-in`}>
                {statusMessage.type === 'success' ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <ShieldCheck size={16} />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="prof-action-bar">
              <button
                type="button"
                className="prof-btn-secondary"
                onClick={handleReset}
                disabled={!isModified || saving}
              >
                <RotateCcw size={15} />
                <span>Reset</span>
              </button>

              <button
                type="button"
                className="prof-btn-primary"
                onClick={handleSave}
                disabled={!isModified || saving}
              >
                <Check size={16} />
                <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
              </button>
            </div>
          </div>

          {/* ─── ACCOUNT TELEMETRY & SYSTEM METADATA ─── */}
          <div className="prof-telemetry-grid">
            <div className="prof-telemetry-card glass-frosted">
              <div className="prof-telemetry-label">Sign-In Provider</div>
              <div className="prof-telemetry-val">
                {currentUser.provider ? currentUser.provider.toUpperCase() : 'GOOGLE AUTH'}
              </div>
            </div>

            <div className="prof-telemetry-card glass-frosted">
              <div className="prof-telemetry-label">Member Since</div>
              <div className="prof-telemetry-val">
                {currentUser.createdAt
                  ? new Date(currentUser.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })
                  : 'Nov 2026'}
              </div>
            </div>

            <div className="prof-telemetry-card glass-frosted">
              <div className="prof-telemetry-label">Last Active Session</div>
              <div className="prof-telemetry-val">
                {currentUser.lastLogin
                  ? new Date(currentUser.lastLogin).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Just now'}
              </div>
            </div>

            <div className="prof-telemetry-card glass-frosted">
              <div className="prof-telemetry-label">Total Logins</div>
              <div className="prof-telemetry-val">{currentUser.loginCount || 1}</div>
            </div>
          </div>

          {/* ─── PAYMENT & BILLING HISTORY TABLE ─── */}
          {subData?.payments && subData.payments.length > 0 && (
            <div className="prof-history-container">
              <div className="prof-history-header">
                <CreditCard size={16} />
                <h3>Billing & Transaction History</h3>
              </div>

              <div className="prof-history-table-wrap glass-frosted">
                <table className="prof-history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Plan</th>
                      <th>Amount</th>
                      <th>Method</th>
                      <th>Status</th>
                      <th>Transaction ID</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subData.payments.map((p) => (
                      <tr key={p._id}>
                        <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                        <td>{formatPlanName(p.plan)}</td>
                        <td>₹{(p.amount / 100).toFixed(0)}</td>
                        <td style={{ textTransform: 'uppercase' }}>
                          {p.paymentMethod || 'UPI'}
                        </td>
                        <td>
                          <span
                            className={`prof-payment-status-pill ${
                              p.status === 'captured'
                                ? 'success'
                                : p.status === 'failed'
                                ? 'failed'
                                : 'pending'
                            }`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="prof-tx-id">
                          {p.razorpayPaymentId || p.razorpayOrderId || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
