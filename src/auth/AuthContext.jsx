import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi } from "./authApi";

const AuthContext = createContext(null);
const HEARTBEAT_INTERVAL_MS = 20000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [websiteStatus, setWebsiteStatus] = useState('UNDER_CONSTRUCTION');
  const heartbeatRef = useRef(null);

  const loadProfile = useCallback(async () => {
    try {
      const [profileRes, settingsRes] = await Promise.all([
        authApi.getProfile().catch(() => null),
        authApi.getSettings().catch(() => ({ data: { websiteStatus: 'UNDER_CONSTRUCTION' } }))
      ]);

      if (profileRes) {
        setUser(profileRes.data);
      } else {
        setUser(null);
      }

      if (settingsRes && settingsRes.data) {
        setWebsiteStatus(settingsRes.data.websiteStatus);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  // Watch-time heartbeat — only while a user is logged in
  useEffect(() => {
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    if (user) {
      heartbeatRef.current = setInterval(() => {
        authApi.heartbeat(HEARTBEAT_INTERVAL_MS).catch(() => {});
      }, HEARTBEAT_INTERVAL_MS);
    }
    return () => {
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [user]);

  const login = async (email, password) => {
    const res = await authApi.login(email, password);
    return res.data;
  };

  const register = async (name, email, password) => {
    const res = await authApi.register(name, email, password);
    return res.data;
  };

  const verifyOtp = async (userId, otp, purpose = "signup") => {
    const res = await authApi.verifyOtp(userId, otp, purpose);
    setUser(res.data.user);
    return res.data.user;
  };

  const resendOtp = async (userId, purpose = "signup") => {
    const res = await authApi.resendOtp(userId, purpose);
    return res.data;
  };

  const loadAfterOAuth = async () => {
    await loadProfile();
  };

  const logout = async () => {
    await authApi.logout();
    setUser(null);
  };

  const updateProfile = async (updates) => {
    const res = await authApi.updateProfile(updates);
    setUser(res.data);
    return res.data;
  };

  const value = {
    user,
    loading,
    websiteStatus,
    setWebsiteStatus,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    loadAfterOAuth,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}