import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { authApi } from "../../auth/authApi";

export default function ProviderCallback({ provider }) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenAndLoad } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");

    if (!code) {
      setError("Login failed. No authorization code received from " + provider + ".");
      return;
    }

    authApi.exchangeCode(provider, code)
      .then((res) => {
        if (res.token) {
          return setTokenAndLoad(res.token).then(() => {
            navigate("/", { replace: true });
          });
        } else {
          setError("Login failed. Missing token in response.");
        }
      })
      .catch((err) => {
        console.error(provider + " OAuth callback error:", err);
        setError("Login failed: " + (err.message || "Unknown error"));
      });
  }, [provider, searchParams, setTokenAndLoad, navigate]);

  if (error) {
    return (
      <div style={{ maxWidth: 400, margin: "4rem auto", textAlign: "center" }}>
        <p style={{ color: "red" }}>{error}</p>
        <button onClick={() => navigate("/login")}>Back to Login</button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 400, margin: "4rem auto", textAlign: "center" }}>
      <p>Authenticating with {provider}...</p>
    </div>
  );
}
