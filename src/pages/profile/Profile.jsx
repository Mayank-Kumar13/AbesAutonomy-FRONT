import { useEffect, useState } from "react";
import "./Profile.css";
import { FiEdit2, FiMail } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Crown, Zap, Shield, Sparkles, CheckCircle2 } from "lucide-react";
import { useAuth } from "../../auth/AuthContext";
import { paymentApi } from "../../services/api";

export default function Profile() {
  const { user, updateProfile } = useAuth();

  const [student, setStudent] = useState({
    name: "",
    email: "",
    mobile: "",
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [subData, setSubData] = useState(null);

  useEffect(() => {
    if (user) {
      setStudent({
        name: user.name || "",
        email: user.email || "",
        mobile: user.mobile || "",
      });

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

  const handleSave = async () => {
    setSaving(true);
    setMessage("");
    try {
      await updateProfile({
        name: student.name,
        mobile: student.mobile,
      });
      setMessage("Profile updated successfully");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return <div className="profile-page">Loading...</div>;
  }

  return (
    <div className="profile-page">

      <h1 className="page-title">Profile</h1>
      <p className="page-subtitle">
        Manage your personal information and account settings.
      </p>

      <div className="profile-card">

        <div className="profile-header">
          <div className="profile-left">
            {user.profilePicture ? (
              <img src={user.profilePicture} alt="avatar" className="avatar" style={{ objectFit: "cover" }} />
            ) : (
              <div className="avatar">
                {student.name
                  ? student.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                  : "?"}
              </div>
            )}

            <div>
              <h2>{student.name}</h2>

              <div className="email-line">
                <FiMail />
                <span>{student.email}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Membership & Subscription Status Banner */}
        {subData?.isSuperAdmin ? (
          <div className="prof-membership-banner premium">
            <div>
              <span className="prof-badge-pill premium">
                <Crown size={14} /> SUPER ADMIN
              </span>
              <h3 className="prof-membership-title">Unrestricted Platform Exemption</h3>
              <p className="prof-membership-desc">
                Your account is the designated Main Administrator with unrestricted document and administrative access.
              </p>
            </div>
          </div>
        ) : subData?.isPremium ? (
          <div className="prof-membership-banner premium">
            <div>
              <span className="prof-badge-pill premium">
                <Crown size={14} /> ★ PREMIUM MEMBER
              </span>
              <h3 className="prof-membership-title">
                {subData.premiumPlan === 'premium_4_months'
                  ? 'Premium – 4 Months (Full Semester)'
                  : 'Premium – 2 Months'}
              </h3>
              <p className="prof-membership-desc">
                Status: <strong style={{ color: '#4ade80' }}>ACTIVE</strong> • Valid until:{' '}
                {subData.premiumExpiryDate ? new Date(subData.premiumExpiryDate).toLocaleDateString() : '—'}{' '}
                ({subData.daysRemaining} days remaining)
              </p>
            </div>
            <Link to="/premium" className="prof-action-btn">
              <Zap size={15} /> Extend Plan
            </Link>
          </div>
        ) : subData?.premiumStatus === 'EXPIRED' ? (
          <div className="prof-membership-banner expired">
            <div>
              <span className="prof-badge-pill expired">PREMIUM EXPIRED</span>
              <h3 className="prof-membership-title">Your Subscription Has Expired</h3>
              <p className="prof-membership-desc">
                Expired on:{' '}
                {subData.premiumExpiryDate ? new Date(subData.premiumExpiryDate).toLocaleDateString() : '—'}.
                Renew now to restore unlimited access to all notes, study materials, and AI tools.
              </p>
            </div>
            <Link to="/premium" className="prof-action-btn">
              Renew Premium
            </Link>
          </div>
        ) : (
          <div className="prof-membership-banner free">
            <div>
              <span className="prof-badge-pill free">FREE MEMBER</span>
              <h3 className="prof-membership-title">Free Student Account</h3>
              <p className="prof-membership-desc">
                Free Document Accesses Used: <strong>{subData?.freePdfAccessCount || 0} / 5</strong> ({subData?.freePdfRemaining ?? 5} remaining)
                <br />
                <span style={{ color: '#4ade80', fontSize: '0.82rem' }}>★ PYQ section remains 100% Free Forever</span>
              </p>
            </div>
            <Link to="/premium" className="prof-action-btn">
              <Crown size={15} /> Upgrade to Premium
            </Link>
          </div>
        )}

        <hr />

        <div className="field">
          <div className="label">
            <h4>Full Name</h4>
          </div>

          <div className="input-box">
            <input
              type="text"
              name="name"
              value={student.name}
              onChange={handleChange}
            />
            <FiEdit2 />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Email Address</h4>
          </div>

          <div className="input-box">
            <input
              type="email"
              name="email"
              value={student.email}
              disabled
            />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Mobile Number</h4>
          </div>

          <div className="input-box">
            <input
              type="text"
              name="mobile"
              value={student.mobile}
              onChange={handleChange}
            />
            <FiEdit2 />
          </div>
        </div>

        <div className="field">
          <div className="label">
            <h4>Sign-in Provider</h4>
          </div>
          <p>{user.provider}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Account Created</h4>
          </div>
          <p>{new Date(user.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Last Login</h4>
          </div>
          <p>{user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "—"}</p>
        </div>

        <div className="field">
          <div className="label">
            <h4>Login Count</h4>
          </div>
          <p>{user.loginCount}</p>
        </div>

        {message && <p style={{ color: message.includes("success") ? "green" : "red" }}>{message}</p>}

        <div className="buttons">
          <button className="cancel">Cancel</button>
          <button className="save" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Billing & Payment History */}
        {subData?.payments && subData.payments.length > 0 && (
          <div className="prof-history-section">
            <h3 className="prof-history-title">Payment & Billing History</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="prof-history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Transaction Ref</th>
                  </tr>
                </thead>
                <tbody>
                  {subData.payments.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        {p.plan === 'premium_4_months'
                          ? '4 Months'
                          : p.plan === 'premium_2_months'
                          ? '2 Months'
                          : p.plan}
                      </td>
                      <td>₹{p.amount / 100}</td>
                      <td style={{ textTransform: 'uppercase' }}>{p.paymentMethod}</td>
                      <td>
                        <span
                          style={{
                            color:
                              p.status === 'captured'
                                ? '#4ade80'
                                : p.status === 'failed'
                                ? '#ef4444'
                                : '#eab308',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                          }}
                        >
                          {p.status}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
                        {p.razorpayPaymentId || p.razorpayOrderId}
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
  );
}