(function() {
  'use strict';

  function injectNav() {
    var isNotes = window.location.pathname.includes('/notes/');
    var prefix = isNotes ? '../' : './';

    var currentPath = window.location.pathname.split('/').pop() || 'index.html';

    function navLink(href, text, isActive) {
      var activeClass = isActive ? ' active' : '';
      var ariaCurrent = isActive ? ' aria-current="page"' : '';
      return '<li><a href="' + href + '" class="nav-link' + activeClass + '"' + ariaCurrent + '>' + text + '</a></li>';
    }

    var navHTML =
      '<div class="container nav-container">' +
        '<a href="' + prefix + 'index.html" class="logo"><img src="' + prefix + 'assets/logo-zetrix-new.png" alt="Zetrix" style="height:32px;vertical-align:middle;margin-right:8px;border-radius:4px;"></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>' +
        '<ul class="nav-menu" id="navMenu">' +
          navLink(prefix + 'index.html', 'AI Academy', currentPath === 'index.html') +
          navLink(prefix + 'courses.html', 'Courses', currentPath === 'courses.html') +
          navLink(prefix + 'dashboard.html', 'Dashboard', currentPath === 'dashboard.html') +
          navLink(prefix + 'blog.html', 'Blog', currentPath === 'blog.html') +
          navLink(prefix + 'support.html', 'Support', currentPath === 'support.html') +
          navLink(prefix + 'tutor.html', 'AI Tutor', currentPath === 'tutor.html') +
          '<li><a href="' + prefix + 'signin.html" class="nav-link" style="color:var(--primary);font-weight:700;">Sign In</a></li>' +
        '</ul>' +
      '</div>';

    var navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.setAttribute('aria-label', 'Main navigation');
      navbar.innerHTML = navHTML;
    } else {
      navbar = document.createElement('nav');
      navbar.className = 'navbar';
      navbar.id = 'navbar';
      navbar.setAttribute('aria-label', 'Main navigation');
      navbar.innerHTML = navHTML;
      document.body.insertBefore(navbar, document.body.firstChild);
    }

    // Re-attach mobile toggle
    var toggle = document.getElementById('navToggle');
    var menu = document.getElementById('navMenu');
    if (toggle && menu) {
      toggle.addEventListener('click', function() {
        menu.classList.toggle('active');
        toggle.classList.toggle('active');
      });
    }

    // Update auth state if Auth module is loaded
    if (typeof window.Auth !== 'undefined' && window.Auth.updateNav) {
      window.Auth.updateNav();
    }

    // Inject back button on all pages except index/home
    injectBackButton();
  }

  function injectBackButton() {
    var currentPath = window.location.pathname.split('/').pop() || 'index.html';
    if (currentPath === 'index.html' || currentPath === '' || currentPath === '/') return;

    // Don't show on course pages (they have their own nav)
    if (document.querySelector('.course-layout')) return;

    var backBtn = document.createElement('button');
    backBtn.className = 'back-button';
    backBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg> Back';
    backBtn.setAttribute('aria-label', 'Go back one page');
    backBtn.onclick = function() {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = './index.html';
      }
    };
    document.body.appendChild(backBtn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }
})();
