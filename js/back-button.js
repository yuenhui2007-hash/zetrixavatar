(function() {
  'use strict';

  function addBackButton() {
    // Don't add if already exists
    if (document.querySelector('.back-button-fixed')) return;

    // Don't show on home page
    var path = window.location.pathname;
    var page = path.split('/').pop() || 'index.html';
    if (page === 'index.html' || page === '' || page === '/') return;

    var btn = document.createElement('button');
    btn.className = 'back-button-fixed';
    btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg><span>Back</span>';
    btn.setAttribute('aria-label', 'Go back to previous page');
    btn.onclick = function(e) {
      e.preventDefault();
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = 'index.html';
      }
    };
    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addBackButton);
  } else {
    addBackButton();
  }
})();