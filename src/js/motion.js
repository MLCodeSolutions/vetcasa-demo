/* ==========================================================================
   motion.js — animações suaves do Modelo 3
   Reveals ao rolar, stagger por grupo e sombra do header sticky.
   Sem estado oculto inicial: o conteúdo continua visível se o JS falhar.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Header: sombra ao rolar ---------- */

  var header = document.querySelector('.site-header');

  if (header) {
    var ticking = false;

    function updateHeader() {
      header.classList.toggle('is-scrolled', window.pageYOffset > 8);
      ticking = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(updateHeader);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    updateHeader();
  }

  /* ---------- Reveals: começam depois do boot ---------- */

  if (reduceMotion) return;
  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll('[data-reveal]');
  var groups = document.querySelectorAll('[data-reveal-group]');
  var revealsStarted = false;

  function initReveals() {
    if (revealsStarted) return;
    revealsStarted = true;

    Array.prototype.forEach.call(groups, function (group) {
      var step = parseInt(group.getAttribute('data-reveal-group'), 10);
      if (!step || step < 0) step = 70;

      var index = 0;

      Array.prototype.forEach.call(group.children, function (child) {
        if (!child.hasAttribute('data-reveal')) return;

        if (!child.hasAttribute('data-reveal-delay')) {
          child.style.setProperty('--reveal-delay', Math.min(index * step, 350) + 'ms');
        }

        index += 1;
      });
    });

    Array.prototype.forEach.call(targets, function (target) {
      var delay = target.getAttribute('data-reveal-delay');

      if (delay !== null && delay !== '') {
        var parsed = parseInt(delay, 10);
        if (!isNaN(parsed)) target.style.setProperty('--reveal-delay', parsed + 'ms');
      }
    });

    var revealObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in');
        revealObserver.unobserve(entry.target);
      });
    }, {
      threshold: 0,
      rootMargin: '0px 0px -32px 0px'
    });

    Array.prototype.forEach.call(targets, function (target) {
      revealObserver.observe(target);
    });
  }

  if (document.documentElement.classList.contains('is-complete')) {
    initReveals();
  } else {
    window.addEventListener('site:ready', initReveals, { once: true });
    setTimeout(initReveals, 3000);
  }
}());
