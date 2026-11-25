import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../auth/AuthContext';
import { settingsApi } from '../../services/api';
import { mergeAdsSettings } from '../../utils/adConfig';

const CHECKLIST_ITEMS = [
  'AdSense publisher script (ca-pub-9991688552602855) & meta tag present in index.html',
  'IAB /ads.txt verification file added at /ads.txt (excluded from SPA rewrite in vercel.json)',
  'Google AdSense cookies & opt-out notice included in Privacy Policy (/privacy)',
  'Desktop (>=1280px) sticky 160x600 Left & Right side rails + Mobile responsive bottom slot active',
];

export default function AdsManagementPanel() {
  const { adsSettings, setAdsSettings } = useAuth();
  const [form, setForm] = useState(() => mergeAdsSettings(adsSettings));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', text: '' });

  useEffect(() => {
    let active = true;
    settingsApi
      .getSettings()
      .then((res) => {
        if (!active) return;
        const merged = mergeAdsSettings(res?.data?.ads);
        setForm(merged);
        setAdsSettings(merged);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [setAdsSettings]);

  const handleChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (feedback.text) setFeedback({ type: '', text: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFeedback({ type: '', text: '' });
    try {
      const res = await settingsApi.updateSettings({ ads: form });
      const merged = mergeAdsSettings(res?.data?.ads || form);
      setForm(merged);
      setAdsSettings(merged);
      setFeedback({ type: 'success', text: 'Google AdSense settings saved and applied live.' });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Failed to save Google AdSense settings.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-table-wrap" style={{ padding: '1.5rem', marginBottom: '2rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '1.25rem',
        }}
      >
        <div>
          <h2 style={{ color: '#e2e8f0', margin: '0 0 0.35rem 0' }}>
            Google AdSense &amp; Side-Rail Monetization
          </h2>
          <p style={{ color: '#94a3b8', margin: 0, fontSize: '0.88rem' }}>
            Manage Left &amp; Right 160×600 skyscraper slots and mobile banner placement across resource pages.
          </p>
        </div>
        <Link
          to="/resources?adpreview=1"
          style={{
            padding: '0.55rem 1rem',
            borderRadius: '8px',
            border: '1px solid rgba(197, 172, 134, 0.45)',
            color: '#C5AC86',
            fontSize: '0.84rem',
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Preview Ad Rails Live ↗
        </Link>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Loading AdSense configuration...</p>
      ) : (
        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '1rem',
            }}
          >
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #2d3748',
                background: '#0b0d10',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(e) => handleChange('enabled', e.target.checked)}
              />
              <span>Enable Google Ads globally</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #2d3748',
                background: '#0b0d10',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.hideForPremium}
                onChange={(e) => handleChange('hideForPremium', e.target.checked)}
              />
              <span>Ad-Free experience for Premium users</span>
            </label>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                padding: '0.75rem 1rem',
                borderRadius: '10px',
                border: '1px solid #2d3748',
                background: '#0b0d10',
                color: '#e2e8f0',
                cursor: 'pointer',
                fontSize: '0.9rem',
              }}
            >
              <input
                type="checkbox"
                checked={form.showSetupPlaceholders}
                onChange={(e) => handleChange('showSetupPlaceholders', e.target.checked)}
              />
              <span>Show placeholder frames publicly</span>
            </label>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))',
              gap: '1rem',
            }}
          >
            <div>
              <label
                htmlFor="adsClientId"
                style={{ display: 'block', color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.84rem' }}
              >
                AdSense Publisher Client ID
              </label>
              <input
                id="adsClientId"
                type="text"
                value={form.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="ca-pub-9991688552602855"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #2d3748',
                  background: '#0b0d10',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="adsLeftSlot"
                style={{ display: 'block', color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.84rem' }}
              >
                Left Skyscraper Slot ID (160×600)
              </label>
              <input
                id="adsLeftSlot"
                type="text"
                value={form.leftSlotId}
                onChange={(e) => handleChange('leftSlotId', e.target.value)}
                placeholder="e.g. 1234567890"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #2d3748',
                  background: '#0b0d10',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="adsRightSlot"
                style={{ display: 'block', color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.84rem' }}
              >
                Right Skyscraper Slot ID (160×600)
              </label>
              <input
                id="adsRightSlot"
                type="text"
                value={form.rightSlotId}
                onChange={(e) => handleChange('rightSlotId', e.target.value)}
                placeholder="e.g. 0987654321"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #2d3748',
                  background: '#0b0d10',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
            </div>

            <div>
              <label
                htmlFor="adsMobileSlot"
                style={{ display: 'block', color: '#94a3b8', marginBottom: '0.4rem', fontSize: '0.84rem' }}
              >
                Mobile Bottom Banner Slot ID (Auto)
              </label>
              <input
                id="adsMobileSlot"
                type="text"
                value={form.mobileSlotId}
                onChange={(e) => handleChange('mobileSlotId', e.target.value)}
                placeholder="Optional responsive slot"
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid #2d3748',
                  background: '#0b0d10',
                  color: '#fff',
                  fontFamily: 'monospace',
                }}
              />
            </div>
          </div>

          <div
            style={{
              padding: '0.9rem 1rem',
              borderRadius: '10px',
              border: '1px solid rgba(197, 172, 134, 0.2)',
              background: 'rgba(197, 172, 134, 0.04)',
            }}
          >
            <div style={{ color: '#C5AC86', fontSize: '0.82rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              ADSENSE READINESS CHECKLIST
            </div>
            <ul style={{ margin: 0, paddingLeft: '1.2rem', color: '#cbd5e1', fontSize: '0.84rem', lineHeight: 1.65 }}>
              {CHECKLIST_ITEMS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          {feedback.text && (
            <div
              style={{
                padding: '0.65rem 0.9rem',
                borderRadius: '8px',
                fontSize: '0.88rem',
                color: feedback.type === 'success' ? '#4ade80' : '#f87171',
                background:
                  feedback.type === 'success' ? 'rgba(74, 222, 128, 0.1)' : 'rgba(248, 113, 113, 0.1)',
                border: `1px solid ${feedback.type === 'success' ? 'rgba(74, 222, 128, 0.35)' : 'rgba(248, 113, 113, 0.35)'}`,
              }}
            >
              {feedback.text}
            </div>
          )}

          <div>
            <button
              type="submit"
              className="upload-submit-btn"
              style={{ width: 'auto', padding: '0.7rem 1.6rem', margin: 0 }}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save AdSense Settings'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
