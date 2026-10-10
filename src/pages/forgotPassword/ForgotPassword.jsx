import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../auth/authApi";
import "../loginPage/LoginPage.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [captchaSvg, setCaptchaSvg] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaValue, setCaptchaValue] = useState("");

  const loadCaptcha = async () => {
    try {
      const res = await authApi.getCaptcha();
      if (res.data) {
        setCaptchaSvg(res.data.svg);
        setCaptchaToken(res.data.captchaToken);
        setCaptchaValue("");
      }
    } catch (err) {
      console.error("Failed to load captcha", err);
    }
  };

  useEffect(() => {
    loadCaptcha();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      await authApi.forgotPassword(email, captchaToken, captchaValue);
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
      loadCaptcha();
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">

          <h2 className="modal-title">FORGOT<br />PASSWORD</h2>

          {status === "sent" ? (
            <>
              <p style={{ textAlign: "center", color: "#e2e8f0", fontSize: "0.9rem", marginBottom: "1rem" }}>
                If that email exists, a reset link has been sent. Check your inbox.
              </p>
              <p style={{ textAlign: 'center', fontSize: '0.85rem', marginBottom: '1.5rem', color: '#94a3b8' }}>
                If you don't see the email, please check your <strong>Spam or Junk folder</strong> (especially for college emails).
              </p>
            </>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {captchaSvg && (
                <div className="input-group">
                  <label>Captcha</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div 
                      dangerouslySetInnerHTML={{ __html: captchaSvg }} 
                      style={{ background: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}
                    />
                    <button 
                      type="button" 
                      onClick={loadCaptcha}
                      style={{ background: 'transparent', border: '1px solid #334155', color: '#cbd5e1', padding: '8px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      Refresh
                    </button>
                  </div>
                  <input 
                    type="text" 
                    value={captchaValue}
                    onChange={(e) => setCaptchaValue(e.target.value)}
                    placeholder="Enter characters above"
                    required
                    style={{ marginTop: '10px' }}
                  />
                </div>
              )}

              {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

              <button type="submit" className="submit-btn" disabled={status === "loading"}>
                {status === "loading" ? "Sending..." : "Send reset link"}
              </button>
            </form>
          )}

          <div className="modal-footer">
            <p className="create-account">
              <Link to="/login" className="forgot-link">Back to login</Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}