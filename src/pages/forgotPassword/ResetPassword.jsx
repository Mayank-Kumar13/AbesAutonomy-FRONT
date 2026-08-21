import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { authApi } from "../../auth/authApi";
import "../loginPage/LoginPage.css";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (!token) {
      setError("Invalid or missing reset token");
      return;
    }

    setStatus("loading");
    try {
      await authApi.resetPassword(token, newPassword);
      setStatus("done");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setError(err.message);
      setStatus("idle");
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-content">

          <h2 className="modal-title">RESET<br />PASSWORD</h2>

          {status === "done" ? (
            <p style={{ textAlign: "center", color: "#e2e8f0", fontSize: "0.9rem" }}>
              Password reset successful. Redirecting to login...
            </p>
          ) : (
            <form className="auth-form" onSubmit={handleSubmit}>
              <div className="input-group">
                <label>New Password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              <div className="input-group">
                <label>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>

              {error && <p style={{ color: "red", fontSize: "0.9rem" }}>{error}</p>}

              <button type="submit" className="submit-btn" disabled={status === "loading"}>
                {status === "loading" ? "Resetting..." : "Reset Password"}
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