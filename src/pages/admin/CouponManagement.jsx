import React, { useState, useEffect, useCallback } from 'react';
import {
  Ticket,
  Plus,
  Wand2,
  Copy,
  Check,
  Edit2,
  Trash2,
  Power,
  Users,
  Link2,
} from 'lucide-react';
import { adminPremiumApi } from '../../services/api';
import { useAuth } from '../../auth/AuthContext';

const PLAN_OPTIONS = [
  { id: 'premium_1_month', label: 'Monthly (₹29)' },
  { id: 'premium_4_months', label: 'Semester (₹99)' },
  { id: 'premium_lifetime', label: 'Lifetime (₹399)' },
];

const EMPTY_FORM = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '20',
  maxDiscountRupees: '',
  minOrderRupees: '0',
  applicablePlans: [],
  maxUses: '',
  perUserLimit: '1',
  startsAt: '',
  expiresAt: '',
  isActive: true,
};

function generateRandomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (let i = 0; i < 6; i++) {
    suffix += chars[Math.floor(Math.random() * chars.length)];
  }
  return `ABES-${suffix}`;
}

function toDatetimeLocal(isoString) {
  if (!isoString) return '';
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatPlanTag(planId) {
  if (planId === 'premium_1_month') return 'Monthly';
  if (planId === 'premium_4_months') return 'Semester';
  if (planId === 'premium_lifetime') return 'Lifetime';
  return planId;
}

export default function CouponManagement() {
  const { user } = useAuth();
  const isMainSuperAdmin = Boolean(
    user && (user.isSuperAdmin === true || user.email?.toLowerCase().trim() === 'abesautonomy30@gmail.com')
  );
  const [coupons, setCoupons] = useState([]);
  const [summary, setSummary] = useState({
    totalCoupons: 0,
    activeCoupons: 0,
    totalRedemptions: 0,
    totalDiscountRupees: 0,
  });
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedId, setCopiedId] = useState(null);

  // Create / Edit modal state
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');

  // Redemptions viewer modal
  const [redemptionsModal, setRedemptionsModal] = useState(null); // { coupon, redemptions, loading }

  const loadCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminPremiumApi.getCoupons({
        q: query,
        status: statusFilter,
      });
      setCoupons(res.data?.coupons || []);
      if (res.data?.summary) setSummary(res.data.summary);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }, [query, statusFilter]);

  useEffect(() => {
    if (!isMainSuperAdmin) {
      setLoading(false);
      return;
    }
    loadCoupons();
  }, [isMainSuperAdmin, loadCoupons]);

  const openCreateModal = () => {
    setEditingCoupon(null);
    setForm({ ...EMPTY_FORM, code: generateRandomCode() });
    setFormError('');
    setFormModalOpen(true);
  };

  const openEditModal = (coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code || '',
      description: coupon.description || '',
      discountType: coupon.discountType || 'percentage',
      discountValue: String(coupon.discountValue ?? ''),
      maxDiscountRupees: coupon.maxDiscountRupees ? String(coupon.maxDiscountRupees) : '',
      minOrderRupees: String(coupon.minOrderRupees ?? 0),
      applicablePlans: Array.isArray(coupon.applicablePlans) ? coupon.applicablePlans : [],
      maxUses: coupon.maxUses ? String(coupon.maxUses) : '',
      perUserLimit: coupon.perUserLimit !== undefined && coupon.perUserLimit !== null ? String(coupon.perUserLimit) : '1',
      startsAt: toDatetimeLocal(coupon.startsAt),
      expiresAt: toDatetimeLocal(coupon.expiresAt),
      isActive: Boolean(coupon.isActive),
    });
    setFormError('');
    setFormModalOpen(true);
  };

  const handleTogglePlan = (planId) => {
    setForm((prev) => {
      const exists = prev.applicablePlans.includes(planId);
      return {
        ...prev,
        applicablePlans: exists
          ? prev.applicablePlans.filter((p) => p !== planId)
          : [...prev.applicablePlans, planId],
      };
    });
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');

    const payload = {
      code: form.code.trim().toUpperCase(),
      autoGenerate: !form.code.trim(),
      description: form.description.trim(),
      discountType: form.discountType,
      discountValue: Number(form.discountValue),
      maxDiscountRupees:
        form.discountType === 'percentage' && form.maxDiscountRupees
          ? Number(form.maxDiscountRupees)
          : null,
      minOrderRupees: form.minOrderRupees ? Number(form.minOrderRupees) : 0,
      applicablePlans: form.applicablePlans,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      perUserLimit: form.perUserLimit !== '' ? Number(form.perUserLimit) : 1,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null,
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      isActive: Boolean(form.isActive),
    };

    try {
      if (editingCoupon) {
        await adminPremiumApi.updateCoupon(editingCoupon._id, payload);
      } else {
        await adminPremiumApi.createCoupon(payload);
      }
      setFormModalOpen(false);
      loadCoupons();
    } catch (err) {
      setFormError(err.message || 'Failed to save coupon.');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (coupon) => {
    try {
      await adminPremiumApi.updateCoupon(coupon._id, { isActive: !coupon.isActive });
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Could not toggle coupon status.');
    }
  };

  const handleDeleteCoupon = async (coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}" permanently?`)) return;
    try {
      await adminPremiumApi.deleteCoupon(coupon._id);
      loadCoupons();
    } catch (err) {
      alert(err.message || 'Failed to delete coupon.');
    }
  };

  const handleOpenRedemptions = async (coupon) => {
    setRedemptionsModal({ coupon, redemptions: [], loading: true });
    try {
      const res = await adminPremiumApi.getCouponRedemptions(coupon._id);
      setRedemptionsModal({
        coupon: res.data?.coupon || coupon,
        redemptions: res.data?.redemptions || [],
        loading: false,
      });
    } catch (err) {
      setRedemptionsModal((prev) => ({ ...prev, loading: false, error: err.message }));
    }
  };

  const handleCopyText = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1600);
  };

  if (!isMainSuperAdmin) {
    return (
      <div className="pm-box" style={{ padding: '40px 24px', textAlign: 'center' }}>
        <Ticket size={32} color="#C5AC86" style={{ margin: '0 auto 10px' }} />
        <h3 style={{ color: '#fff', marginBottom: '6px' }}>Restricted Main Admin Area</h3>
        <p style={{ color: '#9ca3af', maxWidth: '460px', margin: '0 auto' }}>
          Coupon creation and management are strictly restricted to the main administrator account (abesautonomy30@gmail.com).
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Coupon Metrics Summary */}
      <div className="pm-metrics-grid">
        <div className="pm-metric-card gold">
          <div className="pm-metric-label">Total Coupons</div>
          <div className="pm-metric-val gold">{summary.totalCoupons}</div>
          <div className="pm-metric-sub">{summary.activeCoupons} currently active</div>
        </div>

        <div className="pm-metric-card">
          <div className="pm-metric-label">Total Redemptions</div>
          <div className="pm-metric-val" style={{ color: '#4ade80' }}>
            {summary.totalRedemptions}
          </div>
          <div className="pm-metric-sub">Successful coupon checkouts</div>
        </div>

        <div className="pm-metric-card">
          <div className="pm-metric-label">Total Discount Given</div>
          <div className="pm-metric-val" style={{ color: '#60a5fa' }}>
            ₹{Number(summary.totalDiscountRupees || 0).toLocaleString()}
          </div>
          <div className="pm-metric-sub">Total student savings</div>
        </div>
      </div>

      {/* Main Coupon Box */}
      <div className="pm-box">
        <div className="pm-box-header">
          <h3 className="pm-box-title">
            <Ticket size={18} color="#C5AC86" />
            <span>Promo & Coupon Codes ({coupons.length})</span>
          </h3>

          <div className="pm-controls">
            <input
              type="text"
              placeholder="Search code or note..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pm-input"
              style={{ minWidth: '210px' }}
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="pm-select"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Paused / Inactive</option>
              <option value="expired">Expired</option>
              <option value="exhausted">Limit Reached</option>
            </select>
            <button
              type="button"
              onClick={openCreateModal}
              className="pm-gold-cta"
            >
              <Plus size={15} />
              <span>Generate Coupon</span>
            </button>
          </div>
        </div>

        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>Coupon Code</th>
                <th>Discount Rule</th>
                <th>Eligibility</th>
                <th>Usage & Savings</th>
                <th>Validity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {!loading && coupons.map((c) => (
                <tr key={c._id}>
                  <td>
                    <div className="pm-coupon-code-cell">
                      <code className="pm-coupon-code-pill">{c.code}</code>
                      <button
                        type="button"
                        className="pm-copy-id-btn"
                        title="Copy coupon code"
                        onClick={() => handleCopyText(`code-${c._id}`, c.code)}
                      >
                        {copiedId === `code-${c._id}` ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                      <button
                        type="button"
                        className="pm-copy-id-btn"
                        title="Copy shareable link with coupon pre-applied"
                        onClick={() =>
                          handleCopyText(
                            `link-${c._id}`,
                            `${window.location.origin}/premium?coupon=${encodeURIComponent(c.code)}`
                          )
                        }
                      >
                        {copiedId === `link-${c._id}` ? <Check size={11} /> : <Link2 size={11} />}
                      </button>
                    </div>
                    {c.description && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                        {c.description}
                      </div>
                    )}
                  </td>

                  <td>
                    <strong style={{ color: '#DFCAAA' }}>
                      {c.discountType === 'percentage'
                        ? c.discountValue === 100 && !c.maxDiscountRupees
                          ? '100% FREE'
                          : `${c.discountValue}% OFF`
                        : `Flat ₹${c.discountValue} OFF`}
                    </strong>
                    {c.discountType === 'percentage' && c.maxDiscountRupees && (
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                        Max discount ₹{c.maxDiscountRupees}
                      </div>
                    )}
                  </td>

                  <td>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                      {!c.applicablePlans || c.applicablePlans.length === 0 ? (
                        <span className="pm-plan-chip">All Plans</span>
                      ) : (
                        c.applicablePlans.map((p) => (
                          <span key={p} className="pm-plan-chip">{formatPlanTag(p)}</span>
                        ))
                      )}
                    </div>
                    {c.minOrderRupees > 0 && (
                      <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: '3px' }}>
                        Min order: ₹{c.minOrderRupees}
                      </div>
                    )}
                  </td>

                  <td>
                    <div>
                      <strong>{c.usedCount}</strong>
                      <span style={{ color: '#64748b' }}>
                        {' '}/ {c.maxUses ? c.maxUses : '∞'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Per student: {c.perUserLimit > 0 ? `${c.perUserLimit}x` : 'Unlimited'} • ₹{c.totalDiscountGivenRupees || 0} saved
                    </div>
                  </td>

                  <td style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                    {c.expiresAt ? (
                      <>
                        <div>Expires:</div>
                        <div>{new Date(c.expiresAt).toLocaleString()}</div>
                      </>
                    ) : (
                      <span style={{ color: '#64748b' }}>No Expiry</span>
                    )}
                  </td>

                  <td>
                    <span className={`pm-status ${c.effectiveStatus}`}>
                      {c.effectiveStatus}
                    </span>
                  </td>

                  <td>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="pm-btn-sm"
                        title={c.isActive ? 'Pause coupon' : 'Activate coupon'}
                        onClick={() => handleToggleActive(c)}
                      >
                        <Power size={13} color={c.isActive ? '#4ade80' : '#f87171'} />
                      </button>
                      <button
                        type="button"
                        className="pm-btn-sm"
                        title="View Redemptions"
                        onClick={() => handleOpenRedemptions(c)}
                      >
                        <Users size={13} />
                      </button>
                      <button
                        type="button"
                        className="pm-btn-sm"
                        title="Edit Coupon"
                        onClick={() => openEditModal(c)}
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        className="pm-btn-sm danger"
                        title="Delete Coupon"
                        onClick={() => handleDeleteCoupon(c)}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && coupons.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#64748b', padding: '2rem' }}>
                    No coupons found. Click "Generate Coupon" to create your first promo code.
                  </td>
                </tr>
              )}
              {loading && (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', color: '#94a3b8', padding: '1.5rem' }}>
                    Loading coupons...
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── CREATE / EDIT COUPON MODAL ─── */}
      {formModalOpen && (
        <div className="pm-modal-backdrop" onClick={() => setFormModalOpen(false)}>
          <div
            className="pm-modal-card"
            style={{ maxWidth: '620px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pm-modal-title">
              {editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : 'Generate New Coupon Code'}
            </h3>

            {formError && (
              <div style={{ color: '#f87171', background: 'rgba(239, 68, 68, 0.12)', padding: '9px 12px', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.85rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSaveCoupon}>
              <div className="pm-field">
                <label>Coupon Code (Uppercase alphanumeric)</label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="pm-input"
                    style={{ flex: 1, fontFamily: 'monospace', letterSpacing: '0.06em', textTransform: 'uppercase' }}
                    placeholder="e.g. ABES50"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    required
                  />
                  <button
                    type="button"
                    className="pm-btn-sm"
                    onClick={() => setForm({ ...form, code: generateRandomCode() })}
                    title="Auto-generate random code"
                  >
                    <Wand2 size={14} />
                    <span>Auto-Generate</span>
                  </button>
                </div>
              </div>

              <div className="pm-field">
                <label>Description / Campaign Note (Optional)</label>
                <input
                  type="text"
                  className="pm-input"
                  style={{ width: '100%' }}
                  placeholder="e.g. Mid-Sem Special 20% Off"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div className="pm-form-grid">
                <div className="pm-field">
                  <label>Discount Type</label>
                  <select
                    className="pm-select"
                    style={{ width: '100%' }}
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                  >
                    <option value="percentage">Percentage (% Off)</option>
                    <option value="fixed">Flat Amount (₹ Off)</option>
                  </select>
                </div>

                <div className="pm-field">
                  <label>
                    {form.discountType === 'percentage' ? 'Discount Percentage (1 - 100%)' : 'Discount Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={form.discountType === 'percentage' ? '100' : undefined}
                    step="1"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    required
                  />
                </div>

                {form.discountType === 'percentage' && (
                  <div className="pm-field">
                    <label>Max Discount Cap (₹, Optional)</label>
                    <input
                      type="number"
                      min="1"
                      className="pm-input"
                      style={{ width: '100%' }}
                      placeholder="Blank = No cap"
                      value={form.maxDiscountRupees}
                      onChange={(e) => setForm({ ...form, maxDiscountRupees: e.target.value })}
                    />
                  </div>
                )}

                <div className="pm-field">
                  <label>Min Plan Price (₹, Optional)</label>
                  <input
                    type="number"
                    min="0"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={form.minOrderRupees}
                    onChange={(e) => setForm({ ...form, minOrderRupees: e.target.value })}
                  />
                </div>
              </div>

              <div className="pm-field">
                <label>Applicable Plans (Leave all unchecked for All Plans)</label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                  {PLAN_OPTIONS.map((p) => {
                    const selected = form.applicablePlans.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleTogglePlan(p.id)}
                        className={`pm-plan-chip selectable ${selected ? 'selected' : ''}`}
                      >
                        {selected && <Check size={12} />}
                        <span>{p.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pm-form-grid">
                <div className="pm-field">
                  <label>Total Global Usage Limit (Blank = Unlimited)</label>
                  <input
                    type="number"
                    min="1"
                    className="pm-input"
                    style={{ width: '100%' }}
                    placeholder="Unlimited"
                    value={form.maxUses}
                    onChange={(e) => setForm({ ...form, maxUses: e.target.value })}
                  />
                </div>

                <div className="pm-field">
                  <label>Uses Allowed Per Student (0 = Unlimited)</label>
                  <input
                    type="number"
                    min="0"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={form.perUserLimit}
                    onChange={(e) => setForm({ ...form, perUserLimit: e.target.value })}
                  />
                </div>

                <div className="pm-field">
                  <label>Start Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                  />
                </div>

                <div className="pm-field">
                  <label>Expiry Date & Time (Optional)</label>
                  <input
                    type="datetime-local"
                    className="pm-input"
                    style={{ width: '100%' }}
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                  />
                </div>
              </div>

              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.86rem', color: '#e2e8f0', marginTop: '4px' }}>
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                />
                <span>Coupon is Active (Students can apply immediately)</span>
              </label>

              <div className="pm-modal-actions">
                <button
                  type="button"
                  className="pm-modal-btn secondary"
                  onClick={() => setFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="pm-modal-btn primary"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : editingCoupon ? 'Save Changes' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── REDEMPTIONS MODAL ─── */}
      {redemptionsModal && (
        <div className="pm-modal-backdrop" onClick={() => setRedemptionsModal(null)}>
          <div
            className="pm-modal-card"
            style={{ maxWidth: '720px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="pm-modal-title">
              Redemption History: <code style={{ color: '#DFCAAA' }}>{redemptionsModal.coupon?.code}</code>
            </h3>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
              Total uses: <strong>{redemptionsModal.coupon?.usedCount || 0}</strong>
              {redemptionsModal.coupon?.maxUses ? ` / ${redemptionsModal.coupon.maxUses}` : ' (Unlimited)'}
            </p>

            {redemptionsModal.loading ? (
              <p style={{ color: '#94a3b8' }}>Loading redemption records...</p>
            ) : (
              <div className="pm-table-wrap" style={{ maxHeight: '340px' }}>
                <table className="pm-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Student</th>
                      <th>Plan</th>
                      <th>Original</th>
                      <th>Discount</th>
                      <th>Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {redemptionsModal.redemptions.map((r) => (
                      <tr key={r._id}>
                        <td>{new Date(r.redeemedAt || r.createdAt).toLocaleString()}</td>
                        <td>
                          <strong>{r.userName || 'Student'}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{r.userEmail}</div>
                        </td>
                        <td>{formatPlanTag(r.plan)}</td>
                        <td>₹{r.originalRupees}</td>
                        <td style={{ color: '#4ade80' }}>-₹{r.discountRupees}</td>
                        <td><strong>₹{r.finalRupees}</strong></td>
                      </tr>
                    ))}
                    {redemptionsModal.redemptions.length === 0 && (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: '#64748b' }}>
                          No students have redeemed this coupon yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            <div className="pm-modal-actions" style={{ marginTop: '1.2rem' }}>
              <button
                type="button"
                className="pm-modal-btn secondary"
                onClick={() => setRedemptionsModal(null)}
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
