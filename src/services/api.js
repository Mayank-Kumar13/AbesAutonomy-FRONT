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
 * Check if user is logged in (rely on user object for frontend, cookie handles backend)
 */
export const isLoggedIn = () => {
  return !!getStoredUser();
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
  if (user) {
    localStorage.setItem('abes_user', JSON.stringify(user));
  } else {
    localStorage.removeItem('abes_user');
  }
};

/**
 * Clear all auth data.
 */
export const clearAuth = () => {
  localStorage.removeItem('abes_user');
};

/**
 * Core fetch wrapper with auth header injection and error handling.
 */
async function request(url, options = {}, retries = 3, backoff = 1000) {
  const headers = {
    ...(options.headers || {}),
  };

  // Don't set Content-Type for FormData.
  // Browser automatically sets the correct multipart boundary.
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
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
    if (response.status === 429 && retries > 0) {
      console.warn(`Rate limited (429). Retrying in ${backoff}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return request(url, options, retries - 1, backoff * 2);
    }

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

    if (data.data?.user) {
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

    if (data.data?.user) {
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

  async logout() {
    try {
      await request('/auth/logout', { method: 'POST' });
    } catch (error) {
      console.error('Logout failed on backend:', error);
    }
    clearAuth();
  },
};

// ─────────────────────────────────────────────────────
// Notes API
// ─────────────────────────────────────────────────────

export const notesApi = {
  async list(filters = {}, options = {}) {
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

    return request(`/notes${qs ? `?${qs}` : ''}`, options);
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
  async getSubjects(filters = {}, options = {}) {
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
      `/meta/subjects${qs ? `?${qs}` : ''}`,
      options
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
// Subjects API
// ─────────────────────────────────────────────────────

export const subjectsApi = {
  async getSubjects(filters = {}, options = {}) {
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
    return request(`/subjects${qs ? `?${qs}` : ''}`, options);
  },
  
  async getAllSubjects(options = {}) {
    return request('/subjects/all', options);
  },

  async createSubject(subjectData) {
    return request('/subjects', {
      method: 'POST',
      body: JSON.stringify(subjectData),
    });
  },

  async updateSubject(id, updates) {
    return request(`/subjects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  },

  async deleteSubject(id) {
    return request(`/subjects/${id}`, {
      method: 'DELETE',
    });
  },
};

// ─────────────────────────────────────────────────────
// Upload API
// ─────────────────────────────────────────────────────

export const uploadApi = {
  async uploadPdf(file, metadata = {}) {
    const formData = new FormData();

    formData.append('file', file);

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

// ─────────────────────────────────────────────────────
// Tracking API
// ─────────────────────────────────────────────────────

export const trackingApi = {
  async ping(location, pdfId, pdfTitle, subject) {
    return request('/reader/status', {
      method: 'POST',
      body: JSON.stringify({ location, pdfId, pdfTitle, subject }),
    });
  },
  async getLiveUsers() {
    return request('/reader/active');
  },
  async getLogs() {
    return request('/reader/history');
  },
  async recordVisit() {
    return request('/tracking/visit', {
      method: 'POST',
    });
  },
};

// ─────────────────────────────────────────────────────
// Settings API
// ─────────────────────────────────────────────────────

export const settingsApi = {
  async getSettings() {
    return request('/settings');
  },
  async updateSettings(updates) {
    return request('/settings', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  },
  async reactToAnnouncement() {
    return request('/settings/react', {
      method: 'POST',
    });
  },
};

// ─────────────────────────────────────────────────────
// Credits API
// ─────────────────────────────────────────────────────

export const creditsApi = {
  async getPublicCredits() {
    return request('/credits/public');
  },
  async getAllSections() {
    return request('/credits/sections');
  },
  async createSection(data) {
    return request('/credits/sections', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
  async updateSection(id, data) {
    return request(`/credits/sections/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },
  async deleteSection(id) {
    return request(`/credits/sections/${id}`, {
      method: 'DELETE',
    });
  },
  async getMembersBySection(sectionId) {
    return request(`/credits/sections/${sectionId}/members`);
  },
  async createMember(sectionId, formData) {
    return request(`/credits/sections/${sectionId}/members`, {
      method: 'POST',
      body: formData, // FormData
    });
  },
  async updateMember(id, formData) {
    return request(`/credits/members/${id}`, {
      method: 'PUT',
      body: formData, // FormData
    });
  },
  async deleteMember(id) {
    return request(`/credits/members/${id}`, {
      method: 'DELETE',
    });
  },
};