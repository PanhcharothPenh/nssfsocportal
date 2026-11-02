// Attaches the logged-in user's session token to every API request.
// The token comes back from the server inside the user object at login
// (user.session_token) and is stored with it in localStorage.

const USER_KEY = 'currentLoginUser';

const readUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || 'null');
  } catch {
    return null;
  }
};

export const getSessionToken = () => readUser()?.session_token || '';

const isApiUrl = (url) => {
  try {
    const u = new URL(url, window.location.origin);
    const sameOrigin = u.origin === window.location.origin;
    const localApi = (u.hostname === '127.0.0.1' || u.hostname === 'localhost') && u.port === '8000';
    return (sameOrigin || localApi) && u.pathname.startsWith('/api');
  } catch {
    return false;
  }
};

// For links opened in a new tab (file downloads), which cannot carry headers
export const withAccessToken = (url) => {
  const token = getSessionToken();
  if (!token || !url || !isApiUrl(url)) return url;
  return url + (url.includes('?') ? '&' : '?') + 'access_token=' + encodeURIComponent(token);
};

// Sessions saved before tokens existed cannot call the API any more; sign them out once.
const saved = readUser();
if (saved && !saved.session_token && saved.role !== 'guest') {
  localStorage.removeItem(USER_KEY);
}

const originalFetch = window.fetch.bind(window);

window.fetch = async (input, init = {}) => {
  const url = typeof input === 'string' ? input : input?.url || String(input);
  if (!isApiUrl(url)) return originalFetch(input, init);

  const token = getSessionToken();
  const headers = new Headers(init.headers || (input instanceof Request ? input.headers : undefined));
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await originalFetch(input, { ...init, headers });

  // Expired or invalid session: drop it and go back to the login screen
  const path = new URL(url, window.location.origin).pathname;
  if (response.status === 401 && token && !path.startsWith('/api/auth/')) {
    localStorage.removeItem(USER_KEY);
    window.location.reload();
  }
  return response;
};
