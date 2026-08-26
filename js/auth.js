(function() {
  'use strict';

  const AUTH_KEY = 'zetrix_auth_user';
  const TOKEN_KEY = 'zetrix_auth_token';
  const PROGRESS_PREFIX = 'zetrix_progress_';

  // ========== UNIFIED USER RESOLUTION ==========
  // Prefers Firebase auth when available; falls back to local demo auth

  function _firebaseReady() {
    return typeof firebase !== 'undefined' && firebase.apps && firebase.apps.length > 0 && firebase.auth;
  }

  function _fromFirebaseUser(fbUser) {
    if (!fbUser) return null;
    return {
      id: fbUser.uid,
      uid: fbUser.uid,
      name: fbUser.displayName || fbUser.email && fbUser.email.split('@')[0] || 'User',
      email: fbUser.email || '',
      photoURL: fbUser.photoURL || '',
      provider: 'firebase'
    };
  }

  function _getLocalUser() {
    try { return JSON.parse(localStorage.getItem(AUTH_KEY)) || null; }
    catch (e) { return null; }
  }

  function getUser() {
    if (_firebaseReady()) {
      var fbUser = firebase.auth().currentUser;
      if (fbUser) return _fromFirebaseUser(fbUser);
    }
    return _getLocalUser();
  }

  function getUserAsync() {
    return new Promise(function(resolve) {
      if (_firebaseReady()) {
        var unsub = firebase.auth().onAuthStateChanged(function(fbUser) {
          unsub && unsub();
          resolve(_fromFirebaseUser(fbUser) || _getLocalUser());
        });
      } else {
        resolve(_getLocalUser());
      }
    });
  }

  function isAuthenticated() {
    return !!getUser();
  }

  // ========== OBSERVERS ==========
  var _authCallbacks = [];

  function onAuthStateChanged(cb) {
    _authCallbacks.push(cb);
    // Immediately call with current state
    try { cb(getUser()); } catch (e) {}
    return function() {
      _authCallbacks = _authCallbacks.filter(function(c) { return c !== cb; });
    };
  }

  function _notify(user) {
    _authCallbacks.forEach(function(cb) {
      try { cb(user); } catch (e) {}
    });
  }

  // Wire into Firebase auth state if available
  if (typeof firebase !== 'undefined' && firebase.auth) {
    firebase.auth().onAuthStateChanged(function(fbUser) {
      var user = _fromFirebaseUser(fbUser) || _getLocalUser();
      _notify(user);
      updateNav();
    });
  }

  // ========== TOKEN / SESSION ==========

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

  // ========== LOCAL USER SET/REMOVE ==========

  function setUser(user) {
    if (user) localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    else localStorage.removeItem(AUTH_KEY);
    _notify(user);
  }

  // ========== PROGRESS (localStorage) ==========

  function _progressKey(userId) {
    return PROGRESS_PREFIX + (userId || 'guest');
  }

  function _currentUserId() {
    var u = getUser();
    return u ? (u.uid || u.id) : null;
  }

  function getProgressStore() {
    try {
      return JSON.parse(localStorage.getItem(_progressKey(_currentUserId()))) || {};
    } catch (e) { return {}; }
  }

  function setProgressStore(store) {
    localStorage.setItem(_progressKey(_currentUserId()), JSON.stringify(store || {}));
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
      var target = redirectUrl || ('signin.html?redirect=' + encodeURIComponent(window.location.pathname.split('/').pop()));
      window.location.href = target;
      return false;
    }
    return true;
  }

  // ========== PUBLIC API ==========

  window.Auth = {
    getUser: getUser,
    getUserAsync: getUserAsync,
    isAuthenticated: isAuthenticated,
    onAuthStateChanged: onAuthStateChanged,
    getToken: getToken,
    getCourseProgress: getCourseProgress,
    setCourseProgress: setCourseProgress,
    getProgressStore: getProgressStore,

    register: async function(name, email, password) {
      // Try Firebase first if available
      if (_firebaseReady()) {
        try {
          const cred = await firebase.auth().createUserWithEmailAndPassword(email, password);
          if (name && cred.user) {
            await cred.user.updateProfile({ displayName: name });
          }
          var u = _fromFirebaseUser(cred.user);
          localStorage.setItem(AUTH_KEY, JSON.stringify(u));
          _notify(u);
          updateNav();
          return { success: true, user: u };
        } catch (err) {
          return { success: false, error: _mapFirebaseErr(err) };
        }
      }

      // Fallback: local demo auth
      if (!name || !email || !password) {
        return { success: false, error: 'All fields are required.' };
      }
      if (password.length < 8) {
        return { success: false, error: 'Password must be at least 8 characters.' };
      }

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
      if (_firebaseReady()) {
        try {
          const cred = await firebase.auth().signInWithEmailAndPassword(email, password);
          var u = _fromFirebaseUser(cred.user);
          localStorage.setItem(AUTH_KEY, JSON.stringify(u));
          _notify(u);
          updateNav();
          return { success: true, user: u };
        } catch (err) {
          return { success: false, error: _mapFirebaseErr(err) };
        }
      }

      if (!email || !password) {
        return { success: false, error: 'Email and password are required.' };
      }

      await new Promise(r => setTimeout(r, 600));

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

    logout: async function() {
      if (_firebaseReady()) {
        try { await firebase.auth().signOut(); } catch (e) {}
      }
      setUser(null);
      setToken(null);
      updateNav();
      window.location.href = 'index.html';
    },

    loginWithGoogle: async function() {
      if (_firebaseReady()) {
        try {
          var provider = new firebase.auth.GoogleAuthProvider();
          var cred = await firebase.auth().signInWithPopup(provider);
          var u = _fromFirebaseUser(cred.user);
          localStorage.setItem(AUTH_KEY, JSON.stringify(u));
          _notify(u);
          updateNav();
          return { success: true, user: u };
        } catch (err) {
          return { success: false, error: _mapFirebaseErr(err) };
        }
      }
      return { success: false, error: 'Google sign-in requires Firebase backend setup.' };
    },

    loginWithGitHub: async function() {
      if (_firebaseReady()) {
        try {
          var provider = new firebase.auth.GithubAuthProvider();
          var cred = await firebase.auth().signInWithPopup(provider);
          var u = _fromFirebaseUser(cred.user);
          localStorage.setItem(AUTH_KEY, JSON.stringify(u));
          _notify(u);
          updateNav();
          return { success: true, user: u };
        } catch (err) {
          return { success: false, error: _mapFirebaseErr(err) };
        }
      }
      return { success: false, error: 'GitHub sign-in requires Firebase backend setup.' };
    },

    updateNav: updateNav,
    requireAuth: requireAuth
  };

  function _mapFirebaseErr(err) {
    if (!err || !err.code) return 'An error occurred. Please try again.';
    var map = {
      'auth/invalid-email': 'Invalid email address.',
      'auth/user-disabled': 'This account has been disabled.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-credential': 'Invalid email or password.',
      'auth/popup-closed-by-user': 'Popup closed before sign-in completed.',
      'auth/cancelled-popup-request': 'Popup request cancelled.',
      'auth/network-request-failed': 'Network error. Check your connection.'
    };
    return map[err.code] || (err.message || 'An error occurred. Please try again.');
  }

  // Auto-update nav on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', updateNav);
  } else {
    updateNav();
  }
})();
