const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000/api';

const myFetch = (url, options = {}) => {
  options.headers = {
    ...options.headers,
    'ngrok-skip-browser-warning': 'true'
  };
  return fetch(url, options);
};

export const chatAPI = {
  startSession: async () => {
    const res = await myFetch(`${API_BASE}/chat/start`, { method: 'POST' });
    return res.json();
  },

  sendMessage: async (sessionId, message) => {
    const res = await myFetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, message }),
    });
    return res.json();
  },

  getHistory: async (sessionId) => {
    const res = await myFetch(`${API_BASE}/chat/${sessionId}`);
    return res.json();
  },
};

export const adminAPI = {
  getLeads: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });
    const res = await myFetch(`${API_BASE}/admin/leads?${params}`);
    return res.json();
  },

  getLead: async (id) => {
    const res = await myFetch(`${API_BASE}/admin/leads/${id}`);
    return res.json();
  },

  updateLeadStatus: async (id, status) => {
    const res = await myFetch(`${API_BASE}/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    return res.json();
  },

  deleteLead: async (id) => {
    const res = await myFetch(`${API_BASE}/admin/leads/${id}`, { method: 'DELETE' });
    return res.json();
  },

  getStats: async () => {
    const res = await myFetch(`${API_BASE}/admin/stats`);
    return res.json();
  },
};

