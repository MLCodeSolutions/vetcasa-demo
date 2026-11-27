/* ==========================================================================
   main.js — interações sem jQuery/Elementor
   Config, digitação do hero, contadores, slideshow, FAQ, menu e copiar cupom.
   ========================================================================== */

(function () {
  'use strict';

  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var lite = document.documentElement.classList.contains('is-lite');

  /* ---------- Segurança: só http(s) ---------- */

  function safeUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value, window.location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  function safeEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || '') ? value : '';
  }

  /* ---------- Config: links de WhatsApp ---------- */

  document.querySelectorAll('[data-wa]').forEach(function (el) {
    if (!SITE.whatsapp) return;
    var msg = el.getAttribute('data-wa-msg');
    var href = safeUrl('https://wa.me/' + SITE.whatsapp + (msg ? '?text=' + encodeURIComponent(msg) : ''));
    if (href) el.href = href;
  });

  /* ---------- Config: textos ---------- */

  document.querySelectorAll('[data-config]').forEach(function (el) {
    var key = el.getAttribute('data-config');
    if (key && SITE[key]) el.textContent = SITE[key];
  });

  /* ---------- Config: e-mail e redes ---------- */

  document.querySelectorAll('[data-mail]').forEach(function (el) {
    var email = safeEmail(SITE.email);
    if (email) el.href = 'mailto:' + email;
  });

  document.querySelectorAll('[data-social]').forEach(function (el) {
    var key = el.getAttribute('data-social');
    var href = key ? safeUrl(SITE[key]) : '';
    if (href) el.href = href;
  });

  /* ---------- Hero: efeito de digitação ---------- */

  function typeWriter(el) {
    var full = el.getAttribute('data-sc-type') || '';
    if (!full) return;

    if (reduceMotion || lite) {
      el.textContent = full;
      return;
    }

    var caret = document.createElement('span');
    caret.style.cssText = 'display:inline-block;width:.06em;height:.8em;background:#f2d7c9;margin-left:.05em;vertical-align:-.04em;animation:scBlink 1s steps(1) infinite';

    var i = 0;
    var dir = 1;

    function render() {
      el.textContent = full.slice(0, i);
      el.appendChild(caret);
    }

    function tick() {
      i += dir;
      render();
      var delay = dir > 0 ? 95 : 45;
      if (i >= full.length) {
        dir = -1;
        delay = 1800;
      } else if (i <= 0) {
        dir = 1;
        delay = 500;
      }
      setTimeout(tick, delay);
    }

    render();
    setTimeout(tick, 500);
  }

  document.querySelectorAll('[data-sc-type]').forEach(typeWriter);

  /* ---------- Contadores ---------- */

  var counters = document.querySelectorAll('[data-sc-count]');

  counters.forEach(function (el) {
    var parts = (el.getAttribute('data-sc-count') || '0,0,').split(',');
    el.textContent = '0\u20130' + (parts[2] || '');
  });

  function runCounter(el) {
    var parts = (el.getAttribute('data-sc-count') || '0,0,').split(',');
    var from = +parts[0];
    var to = +parts[1];
    var suffix = parts[2] || '';

    if (reduceMotion || lite) {
      el.textContent = Math.round(from) + '\u2013' + Math.round(to) + suffix;
      return;
    }

    var start = performance.now();

    (function step(now) {
      var progress = Math.min(1, Math.max(0, (now - start) / 1600));
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(from * eased) + '\u2013' + Math.round(to * eased) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    })(start);
  }

  if ('IntersectionObserver' in window) {
    var counterObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        counterObserver.unobserve(entry.target);
        runCounter(entry.target);
      });
    }, { threshold: 0.4 });

    counters.forEach(function (el) {
      counterObserver.observe(el);
    });
  } else {
    counters.forEach(runCounter);
  }

  /* ---------- Slideshow de cenas animadas ---------- */

  document.querySelectorAll('[data-sc-fade]').forEach(function (group, groupIndex) {
    var slides = group.children;
    if (slides.length < 2) return;

    var current = 0;
    var interval = +group.getAttribute('data-sc-fade') || 3500;

    if (reduceMotion || lite) return;

    setTimeout(function () {
      setInterval(function () {
        slides[current].classList.remove('is-active');
        current = (current + 1) % slides.length;
        slides[current].classList.add('is-active');
      }, interval);
    }, groupIndex * 600);
  });

  /* ---------- FAQ ---------- */

  document.querySelectorAll('[data-sc-faq]').forEach(function (item) {
    var icon = item.querySelector('summary i');
    if (!icon) return;

    item.addEventListener('toggle', function () {
      icon.className = item.open ? 'icon-minus' : 'icon-plus';
    });
  });

  /* ---------- Menu mobile ---------- */

  var menu = document.querySelector('[data-sc-menu]');
  var burger = document.querySelector('[data-burger]');
  var burgerIcon = document.querySelector('[data-sc-burger]');

  function setMenu(open) {
    if (!menu) return;
    if (open) {
      menu.setAttribute('data-open', '');
    } else {
      menu.removeAttribute('data-open');
    }
    if (burger) burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (burger) burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    if (burgerIcon) burgerIcon.className = open ? 'icon-x' : 'icon-menu';
  }

  if (burger) {
    burger.addEventListener('click', function () {
      setMenu(!menu.hasAttribute('data-open'));
    });
  }

  document.querySelectorAll('[data-menu-close]').forEach(function (link) {
    link.addEventListener('click', function () {
      setMenu(false);
    });
  });

  document.addEventListener('click', function (event) {
    if (!menu || !menu.hasAttribute('data-open')) return;
    if (menu.contains(event.target)) return;
    if (burger && burger.contains(event.target)) return;
    setMenu(false);
  });

  document.addEventListener('keydown', function (event) {
    if (event.key !== 'Escape' || !menu || !menu.hasAttribute('data-open')) return;
    setMenu(false);
    if (burger) burger.focus();
  });

  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1181) setMenu(false);
  });

  /* ---------- Copiar cupom ---------- */

  function setLabel(label, iconClass, text) {
    label.textContent = '';
    var icon = document.createElement('i');
    icon.className = iconClass;
    icon.setAttribute('aria-hidden', 'true');
    label.appendChild(icon);
    label.appendChild(document.createTextNode(text));
  }

  function legacyCopy(text) {
    var input = document.createElement('textarea');
    input.value = text;
    input.setAttribute('readonly', '');
    input.style.cssText = 'position:fixed;top:-9999px;left:-9999px';
    document.body.appendChild(input);
    input.select();

    var ok = false;
    try {
      ok = document.execCommand('copy');
    } catch (error) {
      ok = false;
    }

    document.body.removeChild(input);
    return ok;
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return legacyCopy(text);
      });
    }
    return Promise.resolve(legacyCopy(text));
  }

  document.querySelectorAll('[data-copy]').forEach(function (button) {
    button.addEventListener('click', function () {
      var label = button.querySelector('.coupon__label span');
      if (!label) return;

      copyText(SITE.coupon || 'VETCASA10');

      setLabel(label, 'icon-check', 'Copiado!');
      setTimeout(function () {
        setLabel(label, 'icon-copy', 'Copiar');
      }, 2000);
    });
  });

  /* Compatibilidade: funções globais usadas no HTML original */
  window.scMenu = function (force) {
    setMenu(force === undefined ? !menu.hasAttribute('data-open') : force);
  };
})();
