import React, { useState, useEffect, useCallback } from 'react';
import {
  Crown,
  BarChart3,
  Users,
  CreditCard,
  History,
  Bell,
  Search,
  Check,
  X,
  AlertTriangle,
  RotateCcw,
  Zap,
  Eye,
  FileText,
  Bot,
  Ticket,
} from 'lucide-react';
import { adminPremiumApi } from '../../services/api';
import CouponManagement from './CouponManagement';
import './PremiumManagement.css';

export default function PremiumManagement() {
  const [subTab, setSubTab] = useState('analytics'); // 'analytics', 'users', 'payments', 'audit', 'notifications'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Analytics state
  const [analytics, setAnalytics] = useState(null);

  // Users state
  const [users, setUsers] = useState([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersQuery, setUsersQuery] = useState('');
  const [usersStatusFilter, setUsersStatusFilter] = useState('all');
  const [usersPage, setUsersPage] = useState(1);

  // Payments state
  const [payments, setPayments] = useState([]);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [paymentsQuery, setPaymentsQuery] = useState('');
  const [paymentsStatusFilter, setPaymentsStatusFilter] = useState('all');
  const [paymentsPage, setPaymentsPage] = useState(1);

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditTotal, setAuditTotal] = useState(0);

  // Notifications state
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  // Modals state
  const [activeModal, setActiveModal] = useState(null); // 'activate', 'extend', 'revoke', 'details'
  const [targetUser, setTargetUser] = useState(null);
  const [userDetails, setUserDetails] = useState(null);
  const [modalForm, setModalForm] = useState({ plan: 'premium_2_months', days: 30, reason: '' });
  const [directGrantId, setDirectGrantId] = useState('');
  const [modalLoading, setModalLoading] = useState(false);
  const [modalMsg, setModalMsg] = useState('');

  // Fetch Analytics
  const loadAnalytics = useCallback(async () => {
    try {
      const res = await adminPremiumApi.getAnalytics();
      setAnalytics(res.data);
    } catch (err) {
      console.error('Analytics load error:', err);
    }
  }, []);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    try {
      const res = await adminPremiumApi.getUsers({
        q: usersQuery,
        status: usersStatusFilter,
        page: usersPage,
        limit: 15,
      });
      setUsers(res.data || []);
      setUsersTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Users load error:', err);
    }
  }, [usersQuery, usersStatusFilter, usersPage]);

  // Fetch Payments
  const loadPayments = useCallback(async () => {
    try {
      const res = await adminPremiumApi.getPayments({
        q: paymentsQuery,
        status: paymentsStatusFilter,
        page: paymentsPage,
        limit: 15,
      });
      setPayments(res.data || []);
      setPaymentsTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Payments load error:', err);
    }
  }, [paymentsQuery, paymentsStatusFilter, paymentsPage]);

  // Fetch Audit Logs
  const loadAuditLogs = useCallback(async () => {
    try {
      const res = await adminPremiumApi.getAuditLogs({ page: 1, limit: 30 });
      setAuditLogs(res.data || []);
      setAuditTotal(res.pagination?.total || 0);
    } catch (err) {
      console.error('Audit logs load error:', err);
    }
  }, []);

  // Fetch Notifications
  const loadNotifications = useCallback(async () => {
    try {
      const res = await adminPremiumApi.getNotifications();
      setNotifications(res.data.notifications || []);
      setUnreadNotifications(res.data.unreadCount || 0);
    } catch (err) {
      console.error('Notifications load error:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    setLoading(true);
    Promise.all([
      loadAnalytics(),
      loadNotifications(),
    ]).finally(() => setLoading(false));
  }, [loadAnalytics, loadNotifications]);

  // Tab switch effect
  useEffect(() => {
    if (subTab === 'users') loadUsers();
    if (subTab === 'payments') loadPayments();
    if (subTab === 'audit') loadAuditLogs();
    if (subTab === 'notifications') loadNotifications();
  }, [subTab, loadUsers, loadPayments, loadAuditLogs, loadNotifications]);

  // Open User Details Modal
  const handleOpenDetails = async (u) => {
    setTargetUser(u);
    setActiveModal('details');
    setUserDetails(null);
    setModalLoading(true);
    try {
      const res = await adminPremiumApi.getUserDetails(u._id);
      setUserDetails(res.data);
    } catch (err) {
      console.error('Details fetch error:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Submit Modal Actions
  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const effectiveUserId = targetUser?._id || directGrantId?.trim();
    if (!effectiveUserId) {
      setModalMsg('Please select a student or enter a valid User ID.');
      return;
    }
    setModalLoading(true);
    setModalMsg('');

    try {
      if (activeModal === 'activate') {
        await adminPremiumApi.manualActivate(effectiveUserId, {
          plan: modalForm.plan,
          reason: modalForm.reason || 'Admin manual activation',
        });
      } else if (activeModal === 'extend') {
        await adminPremiumApi.manualExtend(effectiveUserId, {
          days: modalForm.days,
          reason: modalForm.reason || 'Admin manual extension',
        });
      } else if (activeModal === 'revoke') {
        await adminPremiumApi.manualRevoke(effectiveUserId, {
          reason: modalForm.reason || 'Admin manual revocation',
        });
      }

      // Reload
      setActiveModal(null);
      setDirectGrantId('');
      loadUsers();
      loadAnalytics();
      loadAuditLogs();
      loadNotifications();
    } catch (err) {
      setModalMsg(err.message || 'Action failed');
    } finally {
      setModalLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await adminPremiumApi.markNotificationRead({ markAll: true });
      loadNotifications();
    } catch (err) {}
  };

  return (
    <div className="pm-wrap">
      {/* Top Header */}
      <div className="pm-header">
        <h2 className="pm-title">
          <Crown size={24} color="#C5AC86" />
          <span>Premium Management</span> & Analytics
        </h2>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="pm-nav">
        <button
          className={`pm-nav-btn ${subTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setSubTab('analytics')}
        >
          <BarChart3 size={16} /> Analytics
        </button>
        <button
          className={`pm-nav-btn ${subTab === 'users' ? 'active' : ''}`}
          onClick={() => setSubTab('users')}
        >
          <Users size={16} /> Users & Subscriptions
        </button>
        <button
          className={`pm-nav-btn ${subTab === 'coupons' ? 'active' : ''}`}
          onClick={() => setSubTab('coupons')}
        >
          <Ticket size={16} /> Coupons
        </button>
        <button
          className={`pm-nav-btn ${subTab === 'payments' ? 'active' : ''}`}
          onClick={() => setSubTab('payments')}
        >
          <CreditCard size={16} /> Transactions
        </button>
        <button
          className={`pm-nav-btn ${subTab === 'audit' ? 'active' : ''}`}
          onClick={() => setSubTab('audit')}
        >
          <History size={16} /> Audit Log
        </button>
        <button
          className={`pm-nav-btn ${subTab === 'notifications' ? 'active' : ''}`}
          onClick={() => setSubTab('notifications')}
        >
          <Bell size={16} /> Notifications
          {unreadNotifications > 0 && <span className="pm-nav-badge">{unreadNotifications}</span>}
        </button>
      </div>

      {/* ─── TAB 1: ANALYTICS ─── */}
      {subTab === 'analytics' && analytics && (
        <div>
          <div className="pm-metrics-grid">
            <div className="pm-metric-card gold">
              <div className="pm-metric-label">Total Revenue</div>
              <div className="pm-metric-val gold">₹{analytics.totalRevenueRupees.toLocaleString()}</div>
              <div className="pm-metric-sub">{analytics.successfulPaymentsCount} successful transactions</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">Active Premium Users</div>
              <div className="pm-metric-val" style={{ color: '#4ade80' }}>
                {analytics.activePremiumUsers}
              </div>
              <div className="pm-metric-sub">Out of {analytics.totalUsers} total students</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">Conversion Rate</div>
              <div className="pm-metric-val">{analytics.conversionRate}</div>
              <div className="pm-metric-sub">Free to Premium ratio</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">Expired Subscriptions</div>
              <div className="pm-metric-val" style={{ color: '#f87171' }}>
                {analytics.expiredUsers}
              </div>
              <div className="pm-metric-sub">Eligible for renewal</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">1-Month Plan (₹29)</div>
              <div className="pm-metric-val">{analytics.plan1mSales || 0}</div>
              <div className="pm-metric-sub">30-day exam sprint sales</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">Semester Plan (₹99)</div>
              <div className="pm-metric-val" style={{ color: '#C5AC86' }}>
                {analytics.plan4mSales || 0}
              </div>
              <div className="pm-metric-sub">Full semester sales</div>
            </div>

            <div className="pm-metric-card">
              <div className="pm-metric-label">Lifetime Pass (₹399)</div>
              <div className="pm-metric-val" style={{ color: '#60a5fa' }}>
                {analytics.planLifetimeSales || 0}
              </div>
              <div className="pm-metric-sub">Degree lifetime sales</div>
            </div>
          </div>

          {/* Recent Transactions Box */}
          <div className="pm-box">
            <div className="pm-box-header">
              <h3 className="pm-box-title">Recent Transactions</h3>
              <button className="pm-btn-sm" onClick={() => setSubTab('payments')}>
                View All
              </button>
            </div>

            <div className="pm-table-wrap">
              <table className="pm-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>User</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Order Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {(analytics.recentTransactions || []).map((t) => (
                    <tr key={t._id}>
                      <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                      <td>
                        <strong>{t.userName || 'Student'}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{t.userEmail}</div>
                      </td>
                      <td>{t.plan === 'premium_lifetime' ? 'Lifetime' : t.plan === 'premium_4_months' ? '4 Months' : t.plan === 'premium_1_month' ? '1 Month' : '2 Months'}</td>
                      <td>
                        ₹{t.amount / 100}
                        {t.couponCode && (
                          <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                            {t.couponCode} (-₹{(t.discountAmount || 0) / 100})
                          </div>
                        )}
                      </td>
                      <td style={{ textTransform: 'uppercase' }}>{t.paymentMethod}</td>
                      <td>
                        <span className={`pm-status ${t.status}`}>{t.status}</span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{t.razorpayOrderId}</td>
                    </tr>
                  ))}
                  {(!analytics.recentTransactions || analytics.recentTransactions.length === 0) && (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', color: '#64748b' }}>
                        No transactions yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 2: USERS & SUBSCRIPTION MANAGEMENT ─── */}
      {subTab === 'users' && (
        <div className="pm-box">
          <div className="pm-box-header">
            <h3 className="pm-box-title">User Subscriptions ({usersTotal})</h3>
            <div className="pm-controls">
              <input
                type="text"
                placeholder="Search Name, Email, or User ID..."
                value={usersQuery}
                onChange={(e) => {
                  setUsersQuery(e.target.value);
                  setUsersPage(1);
                }}
                className="pm-input"
                style={{ minWidth: '240px' }}
              />
              <select
                value={usersStatusFilter}
                onChange={(e) => {
                  setUsersStatusFilter(e.target.value);
                  setUsersPage(1);
                }}
                className="pm-select"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified Students Only</option>
                <option value="active">Active Premium</option>
                <option value="expired">Expired</option>
                <option value="free">Free Members</option>
              </select>
              <button
                type="button"
                className="pm-btn-primary"
                onClick={() => {
                  setTargetUser(null);
                  setDirectGrantId('');
                  setActiveModal('activate');
                  setModalForm({ plan: 'premium_4_months', days: 120, reason: 'Direct admin grant' });
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, #DFCAAA, #C5AC86)',
                  color: '#080a0e',
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                <Zap size={14} />
                <span>Direct Grant by ID</span>
              </button>
            </div>
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Plan</th>
                  <th>Expiry Date</th>
                  <th>Free Used</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u._id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                        <strong>{u.name}</strong>
                        {u.isVerified && (
                          <span className="pm-verified-pill" title="Verified Student">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{u.email}</div>
                      <div className="pm-id-copy-row">
                        <span className="pm-id-label">ID:</span>
                        <code className="pm-id-code">{u._id}</code>
                        <button
                          type="button"
                          className="pm-copy-id-btn"
                          title="Copy User ID to clipboard"
                          onClick={() => {
                            navigator.clipboard.writeText(u._id);
                            alert(`Copied ID: ${u._id}`);
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </td>
                    <td>
                      {u.isSuperAdmin ? (
                        <span style={{ color: '#C5AC86', fontWeight: 700 }}>SUPER ADMIN</span>
                      ) : (
                        u.role
                      )}
                    </td>
                    <td>
                      <span className={`pm-status ${u.isActivelyPremium ? 'active' : u.premiumStatus === 'EXPIRED' ? 'expired' : 'free'}`}>
                        {u.isActivelyPremium ? 'ACTIVE' : u.premiumStatus === 'EXPIRED' ? 'EXPIRED' : 'FREE'}
                      </span>
                    </td>
                    <td>
                      {u.premiumPlan === 'premium_lifetime'
                        ? 'Lifetime'
                        : u.premiumPlan === 'premium_4_months'
                        ? '4 Months'
                        : u.premiumPlan === 'premium_1_month'
                        ? '1 Month'
                        : u.premiumPlan === 'premium_2_months'
                        ? '2 Months'
                        : '—'}
                    </td>
                    <td>
                      {u.premiumExpiryDate ? new Date(u.premiumExpiryDate).toLocaleDateString() : '—'}
                      {u.isActivelyPremium && (
                        <div style={{ fontSize: '0.75rem', color: '#4ade80' }}>({u.daysRemaining}d left)</div>
                      )}
                    </td>
                    <td>{u.freePdfAccessCount || 0} / 3</td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          className="pm-btn-sm"
                          title="View Usage & Logs"
                          onClick={() => handleOpenDetails(u)}
                        >
                          <Eye size={13} />
                        </button>
                        <button
                          className="pm-btn-sm"
                          title="Manual Grant"
                          onClick={() => {
                            setTargetUser(u);
                            setActiveModal('activate');
                            setModalForm({ plan: 'premium_2_months', days: 60, reason: '' });
                          }}
                        >
                          Grant
                        </button>
                        {u.isActivelyPremium && (
                          <button
                            className="pm-btn-sm"
                            title="Extend"
                            onClick={() => {
                              setTargetUser(u);
                              setActiveModal('extend');
                              setModalForm({ plan: '', days: 30, reason: '' });
                            }}
                          >
                            +Days
                          </button>
                        )}
                        {u.isActivelyPremium && (
                          <button
                            className="pm-btn-sm danger"
                            title="Revoke"
                            onClick={() => {
                              setTargetUser(u);
                              setActiveModal('revoke');
                              setModalForm({ plan: '', days: 0, reason: '' });
                            }}
                          >
                            Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 2B: COUPONS MANAGEMENT ─── */}
      {subTab === 'coupons' && <CouponManagement />}

      {/* ─── TAB 3: TRANSACTIONS & PAYMENTS ─── */}
      {subTab === 'payments' && (
        <div className="pm-box">
          <div className="pm-box-header">
            <h3 className="pm-box-title">Payment Transactions ({paymentsTotal})</h3>
            <div className="pm-controls">
              <input
                type="text"
                placeholder="Search user, order or payment ID..."
                value={paymentsQuery}
                onChange={(e) => {
                  setPaymentsQuery(e.target.value);
                  setPaymentsPage(1);
                }}
                className="pm-input"
              />
              <select
                value={paymentsStatusFilter}
                onChange={(e) => {
                  setPaymentsStatusFilter(e.target.value);
                  setPaymentsPage(1);
                }}
                className="pm-select"
              >
                <option value="all">All Statuses</option>
                <option value="captured">Captured (Successful)</option>
                <option value="failed">Failed</option>
                <option value="created">Created (Pending)</option>
              </select>
            </div>
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Student</th>
                  <th>Order ID</th>
                  <th>Payment ID</th>
                  <th>Plan</th>
                  <th>Amount</th>
                  <th>Method</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td>{new Date(p.createdAt).toLocaleString()}</td>
                    <td>
                      <strong>{p.userName || 'Student'}</strong>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.userEmail}</div>
                    </td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.razorpayOrderId}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}>{p.razorpayPaymentId || '—'}</td>
                    <td>{p.plan === 'premium_lifetime' ? 'Lifetime' : p.plan === 'premium_4_months' ? '4 Months' : p.plan === 'premium_1_month' ? '1 Month' : '2 Months'}</td>
                    <td>
                      ₹{p.amount / 100}
                      {p.couponCode && (
                        <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                          {p.couponCode} (-₹{(p.discountAmount || 0) / 100})
                        </div>
                      )}
                    </td>
                    <td style={{ textTransform: 'uppercase' }}>{p.paymentMethod}</td>
                    <td>
                      <span className={`pm-status ${p.status}`}>{p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 4: AUDIT LOG ─── */}
      {subTab === 'audit' && (
        <div className="pm-box">
          <div className="pm-box-header">
            <h3 className="pm-box-title">Admin Audit Logs ({auditTotal})</h3>
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Admin</th>
                  <th>Target Student</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((l) => (
                  <tr key={l._id}>
                    <td>{new Date(l.createdAt).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 700, color: '#C5AC86' }}>{l.action}</span>
                    </td>
                    <td>
                      <div>{l.adminName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.adminEmail}</div>
                    </td>
                    <td>
                      <div>{l.targetUserName}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{l.targetUserEmail}</div>
                    </td>
                    <td>{l.reason || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── TAB 5: NOTIFICATIONS ─── */}
      {subTab === 'notifications' && (
        <div className="pm-box">
          <div className="pm-box-header">
            <h3 className="pm-box-title">Payment & Subscription Notifications</h3>
            {unreadNotifications > 0 && (
              <button className="pm-btn-sm" onClick={handleMarkAllRead}>
                Mark All Read
              </button>
            )}
          </div>

          <div className="pm-table-wrap">
            <table className="pm-table">
              <thead>
                <tr>
                  <th>Time</th>
                  <th>Type</th>
                  <th>Title</th>
                  <th>Message</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n) => (
                  <tr key={n._id} style={{ background: !n.isRead ? 'rgba(197, 172, 134, 0.05)' : undefined }}>
                    <td>{new Date(n.createdAt).toLocaleString()}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: '#C5AC86' }}>{n.type}</span>
                    </td>
                    <td><strong>{n.title}</strong></td>
                    <td>{n.message}</td>
                    <td>
                      <span className={`pm-status ${n.isRead ? 'free' : 'active'}`}>
                        {n.isRead ? 'Read' : 'New'}
                      </span>
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                      No notifications found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── ACTION MODALS ─── */}
      {activeModal && activeModal !== 'details' && (
        <div className="pm-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="pm-modal-card" onClick={(e) => e.stopPropagation()}>
            <h3 className="pm-modal-title">
              {activeModal === 'activate' && (targetUser ? `Grant Premium to ${targetUser.name}` : 'Direct Grant Premium by ID')}
              {activeModal === 'extend' && `Extend Subscription: ${targetUser?.name}`}
              {activeModal === 'revoke' && `Revoke Premium: ${targetUser?.name}`}
            </h3>

            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.2rem' }}>
              {targetUser ? (
                <>Target: <strong>{targetUser.name}</strong> ({targetUser.email}) — ID: <code style={{ color: '#DFCAAA' }}>{targetUser._id}</code></>
              ) : (
                <>Paste any student's MongoDB User ID to immediately assign active Premium privileges.</>
              )}
            </p>

            {modalMsg && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px', marginBottom: '1rem' }}>
                {modalMsg}
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              {activeModal === 'activate' && !targetUser && (
                <div className="pm-field">
                  <label>Student User ID (24-character hex ID)</label>
                  <input
                    type="text"
                    placeholder="e.g. 660f1b2c4d8e9a1234567890"
                    className="pm-input"
                    style={{ width: '100%', fontFamily: 'monospace' }}
                    value={directGrantId}
                    onChange={(e) => setDirectGrantId(e.target.value)}
                    required
                  />
                </div>
              )}
              {activeModal === 'activate' && (
                <div className="pm-field">
                  <label>Select Plan</label>
                  <select
                    className="pm-select"
                    style={{ width: '100%' }}
                    value={modalForm.plan}
                    onChange={(e) => setModalForm({ ...modalForm, plan: e.target.value })}
                  >
                    <option value="premium_1_month">Monthly Plan – 1 Month (30 Days)</option>
                    <option value="premium_4_months">Semester Plan – 4 Months (120 Days)</option>
                    <option value="premium_lifetime">Lifetime Plan – Degree Pass</option>
                    <option value="premium_2_months">Legacy – 2 Months (60 Days)</option>
                  </select>
                </div>
              )}

              {activeModal === 'extend' && (
                <div className="pm-field">
                  <label>Add Number of Days</label>
                  <input
                    type="number"
                    min="1"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={modalForm.days}
                    onChange={(e) => setModalForm({ ...modalForm, days: e.target.value })}
                    required
                  />
                </div>
              )}

              <div className="pm-field">
                <label>Reason / Audit Note (Required)</label>
                <input
                  type="text"
                  placeholder="e.g. Student support request / Campus coordinator"
                  className="pm-input"
                  style={{ width: '100%' }}
                  value={modalForm.reason}
                  onChange={(e) => setModalForm({ ...modalForm, reason: e.target.value })}
                  required
                />
              </div>

              <div className="pm-modal-actions">
                <button
                  type="button"
                  className="pm-modal-btn secondary"
                  onClick={() => setActiveModal(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`pm-modal-btn ${activeModal === 'revoke' ? 'danger' : 'primary'}`}
                  disabled={modalLoading}
                >
                  {modalLoading ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── USER DETAILS MODAL ─── */}
      {activeModal === 'details' && (
        <div className="pm-modal-backdrop" onClick={() => setActiveModal(null)}>
          <div className="pm-modal-card" style={{ maxWidth: '750px' }} onClick={(e) => e.stopPropagation()}>
            <h3 className="pm-modal-title">Student Subscription & Usage Overview</h3>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              <strong>{targetUser?.name}</strong> ({targetUser?.email})
            </p>

            {modalLoading ? (
              <p>Loading records...</p>
            ) : userDetails ? (
              <div>
                <h4 style={{ color: '#C5AC86', marginBottom: '8px' }}>Recent PDF Access History</h4>
                <div className="pm-table-wrap" style={{ maxHeight: '200px', marginBottom: '1.5rem' }}>
                  <table className="pm-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Document</th>
                        <th>Type</th>
                        <th>Access Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(userDetails.pdfLogs || []).map((l) => (
                        <tr key={l._id}>
                          <td>{new Date(l.createdAt).toLocaleString()}</td>
                          <td>{l.noteTitle || 'Document'}</td>
                          <td>{l.resourceType}</td>
                          <td>
                            <span className={`pm-status ${l.allowed ? 'active' : 'failed'}`}>
                              {l.accessType}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {(!userDetails.pdfLogs || userDetails.pdfLogs.length === 0) && (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No PDF view logs recorded.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <h4 style={{ color: '#C5AC86', marginBottom: '8px' }}>AI Feature Usage History</h4>
                <div className="pm-table-wrap" style={{ maxHeight: '180px' }}>
                  <table className="pm-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Feature</th>
                        <th>Snippet</th>
                        <th>Tokens</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(userDetails.aiLogs || []).map((l) => (
                        <tr key={l._id}>
                          <td>{new Date(l.createdAt).toLocaleString()}</td>
                          <td>{l.feature}</td>
                          <td>{l.promptSnippet || '—'}</td>
                          <td>{l.tokensUsed}</td>
                        </tr>
                      ))}
                      {(!userDetails.aiLogs || userDetails.aiLogs.length === 0) && (
                        <tr><td colSpan="4" style={{ textAlign: 'center' }}>No AI features used yet.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : null}

            <div className="pm-modal-actions" style={{ marginTop: '1.5rem' }}>
              <button
                type="button"
                className="pm-modal-btn secondary"
                onClick={() => setActiveModal(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
