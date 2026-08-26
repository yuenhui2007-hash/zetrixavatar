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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectNav);
  } else {
    injectNav();
  }
})();
