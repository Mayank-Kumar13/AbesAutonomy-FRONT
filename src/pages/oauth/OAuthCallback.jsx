import { useEffect, useState } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authApi } from "../../auth/authApi";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { setTokenAndLoad } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const code = searchParams.get("code");
    const errorParam = searchParams.get("error");

    if (errorParam) {
      setError(`Login failed: ${errorParam}`);
      return;
    }

    if (token) {
      setTokenAndLoad(token).then(() => {
        navigate("/", { replace: true });
      });
      return;
    }

    if (code) {
      const provider = location.pathname.includes("github") ? "github" : "google";

      authApi.exchangeCode(provider, code)
        .then((data) => {
          if (data.token) {
            setTokenAndLoad(data.token).then(() => {
              navigate("/", { replace: true });
            });
          } else {
            setError("Login failed. No token returned from server.");
          }
        })
        .catch((err) => {
          setError(`Login failed: ${err.message}`);
        });
      return;
    }

    setError("Login failed. No token or code received.");
  }, [searchParams, location, setTokenAndLoad, navigate]);

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