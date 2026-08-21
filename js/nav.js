(function() {
  'use strict';

  function injectNav() {
    var isNotes = window.location.pathname.includes('/notes/');
    var prefix = isNotes ? '../' : './';

    var navHTML =
      '<div class="container nav-container">' +
        '<a href="' + prefix + 'index.html" class="logo"><img src="' + prefix + 'assets/logo-zetrix-new.png" alt="Zetrix" style="height:32px;vertical-align:middle;margin-right:8px;border-radius:4px;"></a>' +
        '<button class="nav-toggle" id="navToggle" aria-label="Toggle navigation"><span></span><span></span><span></span></button>' +
        '<ul class="nav-menu" id="navMenu">' +
          '<li><a href="' + prefix + 'index.html" class="nav-link">AI Academy</a></li>' +
          '<li class="nav-dropdown">' +
            '<a href="#" class="nav-link nav-dropdown-toggle" onclick="event.preventDefault();this.parentElement.classList.toggle(\'open\');">Courses ▾</a>' +
            '<ul class="nav-dropdown-menu">' +
              '<li><a href="' + prefix + 'course-ai-brain.html">AI Brain</a></li>' +
              '<li><a href="' + prefix + 'course-avatar-foundations.html">Avatar Foundations</a></li>' +
              '<li><a href="' + prefix + 'course-sales-marketing.html">Sales & Marketing</a></li>' +
              '<li><a href="' + prefix + 'course-business-automation.html">Business Automation</a></li>' +
              '<li><a href="' + prefix + 'course-ai-coding.html">AI Coding</a></li>' +
              '<li><a href="' + prefix + 'course-solution-architecture.html">Solution Architecture</a></li>' +
              '<li><a href="' + prefix + 'course-enterprise-deployment.html">Enterprise Deployment</a></li>' +
              '<li><a href="' + prefix + 'course-one-person-company.html">One-Person Company</a></li>' +
              '<li><a href="' + prefix + 'course-personal-productivity.html">Personal Productivity</a></li>' +
            '</ul>' +
          '</li>' +
          '<li><a href="' + prefix + 'tutor.html" class="nav-link">AI Tutor</a></li>' +
        '</ul>' +
      '</div>';

    var navbar = document.getElementById('navbar');
    if (navbar) {
      navbar.innerHTML = navHTML;
    } else {
      navbar = document.createElement('nav');
      navbar.className = 'navbar';
      navbar.id = 'navbar';
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
