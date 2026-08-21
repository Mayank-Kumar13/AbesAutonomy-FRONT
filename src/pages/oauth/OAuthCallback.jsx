import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";

export default function OAuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setTokenAndLoad } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setError("Login failed. No token received.");
      return;
    }

    setTokenAndLoad(token).then(() => {
      navigate("/", { replace: true });
    });
  }, [searchParams, setTokenAndLoad, navigate]);

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