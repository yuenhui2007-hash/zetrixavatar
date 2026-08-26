(function() {
  'use strict';
  var DEBUG = false;

  // Auth guard for protected pages (dashboard, courses, etc.)
  // Include this script AFTER auth.js on any page that requires login

  var PUBLIC_PATHS = ['index.html', 'signin.html', 'signup.html', 'support.html', 'blog.html', 'courses.html', ''];
  var current = window.location.pathname.split('/').pop() || 'index.html';

  function isPublic(path) {
    return PUBLIC_PATHS.some(function(p) { return path === p || path.endsWith('/' + p); });
  }

  function checkAuth() {
    // Auth module must be loaded
    if (typeof Auth === 'undefined') {
      if (DEBUG) console.warn('Auth guard: Auth module not loaded');
      return;
    }
    var user = Auth.getUser();
    if (!user && !isPublic(current)) {
      // Redirect to sign-in with return URL
      var redirect = encodeURIComponent(current);
      window.location.replace('signin.html?redirect=' + redirect);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', checkAuth);
  } else {
    checkAuth();
  }
})();
