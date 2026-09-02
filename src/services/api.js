/**
 * Centralized API client for ABES Autonomy.
 * All backend requests go through this module.
 */

// Production:
// https://abes-autonomy-backend.onrender.com/api
//
// Local:
// http://localhost:5000/api
const envApiBase = import.meta.env.VITE_API_URL; const API_BASE = (envApiBase && envApiBase.includes("abes.work")) ? "/api" : (envApiBase || "/api");

/**
 * Get auth token from localStorage.
 */
const getToken = () => localStorage.getItem('token');

/**
 * Set auth token in localStorage.
 */
export const setToken = (token) => {
  localStorage.setItem('token', token);
};

/**
 * Remove auth token from localStorage.
 */
export const removeToken = () => {
  localStorage.removeItem('token');
};

/**
 * Check if user is logged in.
 */
export const isLoggedIn = () => {
  return !!getToken();
};

/**
 * Get stored user data.
 */
export const getStoredUser = () => {
  try {
    const data = localStorage.getItem('abes_user');
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

/**
 * Store user data.
 */
export const setStoredUser = (user) => {
  localStorage.setItem('abes_user', JSON.stringify(user));
};

/**
 * Clear all auth data.
 */
export const clearAuth = () => {
  removeToken();
  localStorage.removeItem('abes_user');
};

/**
 * Core fetch wrapper with auth header injection and error handling.
 */
async function request(url, options = {}) {
  const headers = {
    ...(options.headers || {}),
  };

  // Don't set Content-Type for FormData.
  // Browser automatically sets the correct multipart boundary.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  // Handle empty responses safely.
  const contentType = response.headers.get('content-type');

  let data;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const message =
      typeof data === 'object' && data?.message
        ? data.message
        : 'Request failed';

    const error = new Error(message);

    error.status = response.status;
    error.data = data;

    throw error;
  }

  return data;
}

// ─────────────────────────────────────────────────────
// Auth API
// ─────────────────────────────────────────────────────

export const authApi = {
  async register(name, email, password) {
    const data = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        name,
        email,
        password,
      }),
    });

    if (data.data?.token) {
      setToken(data.data.token);
      setStoredUser(data.data.user);
    }

    return data;
  },

  async login(email, password) {
    const data = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (data.data?.token) {
      setToken(data.data.token);
      setStoredUser(data.data.user);
    }

    return data;
  },

  async getProfile() {
    return request('/auth/profile');
  },

  async updateProfile(updates) {
    const data = await request('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });

    if (data.data) {
      setStoredUser(data.data);
    }

    return data;
  },

  logout() {
    clearAuth();
  },
};

// ─────────────────────────────────────────────────────
// Notes API
// ─────────────────────────────────────────────────────

export const notesApi = {
  async list(filters = {}) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        params.append(key, value);
      }
    }

    const qs = params.toString();

    return request(`/notes${qs ? `?${qs}` : ''}`);
  },

  async get(id) {
    return request(`/notes/${id}`);
  },

  async search(query, page = 1, limit = 20) {
    const params = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });

    return request(`/notes/search?${params.toString()}`);
  },

  async create(noteData) {
    return request('/notes', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async update(id, updates) {
    return request(`/notes/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },

  async delete(id, deleteFile = true) {
    return request(
      `/notes/${id}?deleteFile=${deleteFile}`,
      {
        method: 'DELETE',
      }
    );
  },

  async incrementView(id) {
    return request(`/notes/${id}/view`, {
      method: 'POST',
    });
  },
};

// ─────────────────────────────────────────────────────
// Meta API
// ─────────────────────────────────────────────────────

export const metaApi = {
  async getSubjects(filters = {}) {
    const params = new URLSearchParams();

    for (const [key, value] of Object.entries(filters)) {
      if (
        value !== undefined &&
        value !== null &&
        value !== ''
      ) {
        params.append(key, value);
      }
    }

    const qs = params.toString();

    return request(
      `/meta/subjects${qs ? `?${qs}` : ''}`
    );
  },

  async getBranches() {
    return request('/meta/branches');
  },

  async getStats() {
    return request('/meta/stats');
  },
};

// ─────────────────────────────────────────────────────
// Upload API
// ─────────────────────────────────────────────────────

export const uploadApi = {
  async uploadPdf(file, metadata = {}) {
    const formData = new FormData();

    formData.append('pdf', file);

    for (const [key, value] of Object.entries(metadata)) {
      formData.append(
        key,
        typeof value === 'object'
          ? JSON.stringify(value)
          : value
      );
    }

    return request('/upload/pdf', {
      method: 'POST',
      body: formData,
    });
  },

  async registerExisting(noteData) {
    return request('/upload/register', {
      method: 'POST',
      body: JSON.stringify(noteData),
    });
  },

  async deleteFile(fileId) {
    return request(`/upload/${fileId}`, {
      method: 'DELETE',
    });
  },
};

// ─────────────────────────────────────────────────────
// Reviews API
// ─────────────────────────────────────────────────────

export const reviewApi = {
  async list(page = 1, limit = 50) {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(limit),
    });

    return request(`/reviews?${params.toString()}`);
  },

  async create(rating, content) {
    return request('/reviews', {
      method: 'POST',
      body: JSON.stringify({ rating, content }),
    });
  },

  async remove() {
    return request('/reviews', {
      method: 'DELETE',
    });
  },
};