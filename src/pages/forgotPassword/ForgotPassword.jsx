import { useState } from "react";
import { Link } from "react-router-dom";
import { authApi } from "../../auth/authApi";
import "../loginPage/LoginPage.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStatus("loading");
    try {
      await authApi.forgotPassword(email);
      setStatus("sent");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">

          <h2 className="modal-title">FORGOT<br />PASSWORD</h2>

          {status === "sent" ? (
            <p style={{ textAlign: "center", color: "#e2e8f0", fontSize: "0.9rem" }}>
              If that email exists, a reset link has been sent. Check your inbox.
            </p>
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