import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authApi } from "../../auth/authApi";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { loadAfterOAuth } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const errorParam = searchParams.get("error");
    const code = searchParams.get("code");

    if (errorParam) {
      setError(`Login failed: ${errorParam}`);
      return;
    }

    if (code) {
      const provider = location.pathname.includes("github") ? "github" : "google";
      authApi.exchangeCode(provider, code)
        .then(() => {
          loadAfterOAuth().then(() => {
            navigate("/", { replace: true });
          });
        })
        .catch((err) => {
          setError(`Login failed: ${err.message}`);
        });
      return;
    }

    // Default flow: Cookie is already set by backend redirect
    loadAfterOAuth().then(() => {
      navigate("/", { replace: true });
    });
  }, [searchParams, location, loadAfterOAuth, navigate]);

  if (error) {
    return (
      <div style={{ maxWidth: 400, margin: "4rem auto", textAlign: "center" }}>
        <p style={{ color: "red" }}>{error}</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", textAlign: "center" }}>
      <p>Signing you in...</p>
    </div>
  );
}