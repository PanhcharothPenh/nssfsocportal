// Sign-in session for API calls. The server gives a token at sign-in; every /api request carries it.
const TOKEN_KEY = 'authToken';
// Cached copies of server data, removed when the session ends.
const CACHED_DATA_KEYS = ['nssf_soc_branches', 'nssf_soc_dashboard_stats', 'nssf_soc_hospital_vpns', 'nssf_soc_hq', 'nssf_soc_vpn'];

const readToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const saveSessionToken = (token) => {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearSession = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem('currentLoginUser');
    CACHED_DATA_KEYS.forEach((key) => localStorage.removeItem(key));
  } catch {}
};

const isOwnApi = (url) => {
  try {
    const u = new URL(url, window.location.href);
    const sameServer = u.origin === window.location.origin || u.origin === 'http://127.0.0.1:8000';
    return sameServer && u.pathname.startsWith('/api/');
  } catch {
    return false;
  }
};

export const installSessionFetch = () => {
  // Someone signed in before sessions existed has a saved user but no token: send them to sign in again.
  try {
    const saved = JSON.parse(localStorage.getItem('currentLoginUser') || 'null');
    const isGuest = saved && ((saved.role || '').toLowerCase() === 'guest' || (saved.username || '').toLowerCase() === 'guest');
    if (saved && !isGuest && !readToken()) clearSession();
  } catch {}

  const nativeFetch = window.fetch.bind(window);
  window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    if (!isOwnApi(url)) return nativeFetch(input, init);

    const token = readToken();
    let request = init;
    if (token) {
      const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
      if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
      request = { ...init, headers };
    }
    const res = await nativeFetch(input, request);
    // Expired or revoked session: back to the sign-in page. Sign-in calls report their own errors.
    if (res.status === 401 && token && !new URL(url, window.location.href).pathname.startsWith('/api/auth/')) {
      clearSession();
      window.location.reload();
    }
    return res;
  };
};
