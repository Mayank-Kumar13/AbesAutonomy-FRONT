import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { authApi } from "./authApi";

const AuthContext = createContext(null);
const HEARTBEAT_INTERVAL_MS = 20000;

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [websiteStatus, setWebsiteStatus] = useState('UNDER_CONSTRUCTION');
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const heartbeatRef = useRef(null);
  const versionRef = useRef(null);

  // Poll for code version changes and data refresh
  useEffect(() => {
    // 1. Initial version load
    fetch('/version.json?t=' + Date.now())
      .then(res => res.json())
      .then(data => { versionRef.current = data.version; })
      .catch(() => {});

    // 2. Window focus listener to refresh data immediately when user returns
    const onFocus = () => {
      setRefreshTrigger(prev => prev + 1);
    };
    window.addEventListener('focus', onFocus);

    // 3. Background interval (every 30 seconds)
    const interval = setInterval(() => {
      setRefreshTrigger(prev => prev + 1);
      
      // Check version.json for code updates
      fetch('/version.json?t=' + Date.now())
        .then(res => res.json())
        .then(data => {
          if (versionRef.current && data.version !== versionRef.current) {
            window.location.reload(true);
          }
        })
        .catch(() => {});
    }, 30000);

    return () => {
      window.removeEventListener('focus', onFocus);
      clearInterval(interval);
    };
  }, []);

  const loadProfile = useCallback(async () => {
    const token = localStorage.getItem("token");
    
    // We shouldn't exit early if there is no token, because the backend might be using HttpOnly cookies for Google OAuth.
    try {
      const [profileRes, settingsRes] = await Promise.all([
        token ? authApi.getProfile().catch(() => null) : Promise.resolve(null),
        authApi.getSettings().catch(() => ({ data: { websiteStatus: 'UNDER_CONSTRUCTION' } }))
      ]);

      if (profileRes) {
        setUser(profileRes.data);
      } else {
        if (token) localStorage.removeItem("token");
        setUser(null);
      }

      if (settingsRes && settingsRes.data) {
        setWebsiteStatus(settingsRes.data.websiteStatus);
      }
    } catch (err) {
      if (token) localStorage.removeItem("token");
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
    localStorage.setItem("token", res.data.token);
    setUser(res.data.user);
    return res.data.user;
  };

  const resendOtp = async (userId, purpose = "signup") => {
    const res = await authApi.resendOtp(userId, purpose);
    return res.data;
  };

  const setTokenAndLoad = async (token) => {
    localStorage.setItem("token", token);
    await loadProfile();
  };

  const logout = () => {
    localStorage.removeItem("token");
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
    refreshTrigger,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    resendOtp,
    logout,
    setTokenAndLoad,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}