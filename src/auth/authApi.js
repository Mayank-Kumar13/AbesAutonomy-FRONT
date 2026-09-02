// In development, Vite proxies /api → http://localhost:5000 (see vite.config.js).
// For production builds, set VITE_API_URL to the full backend URL.
const envApiUrl = import.meta.env.VITE_API_URL; const API_URL = (envApiUrl && envApiUrl.includes("abes.work")) ? "/api" : (envApiUrl || "/api");

async function request(path, options = {}) {
  const token = localStorage.getItem("token");

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Something went wrong");
  }

  return data;
}

function buildOAuthUrl(provider) {
  const url = `${API_URL}${provider}`;
  if (url.includes("undefined")) {
    throw new Error(
      `[authApi] OAuth URL contains "undefined": "${url}". ` +
      `Check that VITE_API_URL is set correctly in your .env file.`
    );
  }
  return url;
}

export const authApi = {
  register: (name, email, password) =>
    request("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }),

  login: (email, password) =>
    request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),

  verifyOtp: (userId, otp, purpose = "signup") =>
    request("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify({ userId, otp, purpose }),
    }),

  resendOtp: (userId, purpose = "signup") =>
    request("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify({ userId, purpose }),
    }),

  getProfile: () => request("/auth/profile"),

  updateProfile: (updates) =>
    request("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(updates),
    }),

  forgotPassword: (email) =>
    request("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),

  resetPassword: (token, newPassword) =>
    request("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    }),

  googleLoginUrl: () => buildOAuthUrl("/auth/google"),
  githubLoginUrl: () => buildOAuthUrl("/auth/github"),

  exchangeCode: (provider, code) =>
    request(`/auth/${provider}/callback`, {
      method: "POST",
      body: JSON.stringify({ code }),
    }),

  heartbeat: (intervalMs = 20000) =>
    request("/activity/heartbeat", {
      method: "POST",
      body: JSON.stringify({ intervalMs }),
    }),

  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: () => request("/admin/users"),
  getAdminLogs: () => request("/admin/logs"),
};