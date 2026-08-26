(function() {
  'use strict';

  const AUTH_KEY = 'zetrix_auth_user';
  const TOKEN_KEY = 'zetrix_auth_token';
  const PROGRESS_PREFIX = 'zetrix_progress_';

  // ========== USER SESSION ==========

  function getUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; }
    catch (e) { return null; }
  }

  function setUser(user) {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
  }



  function generateToken() {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    const hex = Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
    return 'tk_' + Date.now() + '_' + hex;
  }

  const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  function setToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(TOKEN_KEY + '_expiry', Date.now() + SESSION_DURATION);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_KEY + '_expiry');
    }
  }

  function getToken() {
    const expiry = localStorage.getItem(TOKEN_KEY + '_expiry');
    if (expiry && Date.now() > parseInt(expiry, 10)) {
      setUser(null);
      setToken(null);
      return null;
    }
    return localStorage.getItem(TOKEN_KEY) || null;
  }

  // ========== PROGRESS (per-user) ==========

  function _progressKey(userId) {
    return PROGRESS_PREFIX + (userId || 'guest');
  }

  function getProgressStore() {
    const user = getUser();
    try {
      return JSON.parse(localStorage.getItem(_progressKey(user && user.id))) || {};
    } catch (e) { return {}; }
  }

  function setProgressStore(store) {
    const user = getUser();
    localStorage.setItem(_progressKey(user && user.id), JSON.stringify(store || {}));
  }

  function getCourseProgress(courseId) {
    const store = getProgressStore();
    return store[courseId] || null;
  }

  function setCourseProgress(courseId, data) {
    const store = getProgressStore();
    store[courseId] = data;
    setProgressStore(store);
  }

  // ========== NAV UPDATE ==========

  function updateNav() {
    const user = getUser();
    var menu = document.getElementById('navMenu');
    if (!menu) return;

    var signinItem = menu.querySelector('a[href$="signin.html"]');
    if (!signinItem) return;

    var parentLi = signinItem.closest('li');
    if (!parentLi) return;

    if (user) {
      parentLi.innerHTML = '<a href="dashboard.html" class="nav-link" style="color:var(--primary);font-weight:700;">' +
        (user.name ? user.name.split(' ')[0] : 'Account') + '</a>' +
        '<ul style="list-style:none;padding:0;margin:6px 0 0;">' +
        '<li><a href="dashboard.html" class="nav-link" style="font-size:0.85rem;padding:6px 0;">Dashboard</a></li>' +
        '<li><a href="#" class="nav-link" onclick="Auth.logout();return false;" style="font-size:0.85rem;padding:6px 0;">Sign Out</a></li>' +
        '</ul>';
    } else {
      parentLi.innerHTML = '<a href="signin.html" class="nav-link" style="color:var(--primary);font-weight:700;">Sign In</a>';
    }
  }

  // ========== AUTH GUARD ==========

  function requireAuth(redirectUrl) {
    if (!getUser()) {
      window.location.href = redirectUrl || 'signin.html?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop());
      return false;
    }
    return true;
  }

  // ========== PUBLIC API ==========

  window.Auth = {
    getUser: getUser,
    getToken: getToken,
    getCourseProgress: getCourseProgress,
    setCourseProgress: setCourseProgress,
    getProgressStore: getProgressStore,

    register: async function(name, email, password) {
      if (!name || !email || !password) {
        return { success: false, error: 'All fields are required.' };
      }
      if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' };
      }

      // Simulate network delay
      await new Promise(r => setTimeout(r, 600));

      const user = {
        id: 'u_' + Date.now(),
        name: name,
        email: email,
        createdAt: Date.now()
      };
      const token = generateToken();
      localStorage.removeItem(TOKEN_KEY + '_duration');
      setUser(user);
      setToken(token);
      updateNav();
      return { success: true, user: user, token: token };
    },

    login: async function(email, password, remember) {
      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      await new Promise(r => setTimeout(r, 600));

      // Demo: accept any email/password combo for testing
      // In production, validate against backend
      const user = {
        id: 'u_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        createdAt: Date.now()
      };
      const token = generateToken();
      if (remember) {
        localStorage.setItem(TOKEN_KEY + '_duration', (30 * 24 * 60 * 60 * 1000).toString());
      } else {
        localStorage.removeItem(TOKEN_KEY + '_duration');
      }
      setUser(user);
      setToken(token);
      updateNav();
      return { success: true, user: user, token: token };
    },

    logout: function() {
      setUser(null);
      setToken(null);
      updateNav();
      window.location.href = 'index.html';
    },

    updateNav: updateNav,
    requireAuth: requireAuth
  };

  // Auto-update nav on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }
})();
