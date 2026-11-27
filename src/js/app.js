/* ==========================================================================
   app.js — recursos de app para o embed
   Preloader com fallback, voltar ao topo e lightbox acessível.
   ========================================================================== */

(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function safeUrl(value) {
    if (!value) return '';
    try {
      var url = new URL(value, window.location.href);
      return (url.protocol === 'https:' || url.protocol === 'http:') ? url.href : '';
    } catch (error) {
      return '';
    }
  }

  /* ---------- Boot de entrada (padrão Amanda) ---------- */

  var boot = document.getElementById('vc-boot');
  var bootDone = false;
  var bootFade = reduceMotion ? 0 : 320;
  /* No embed, o loader marca window.__vcBootAt no document.write para a
     intro contar 1 s a partir da página, não do tempo de fetch. */
  var bootStartedAt = typeof window.__vcBootAt === 'number' ? window.__vcBootAt : 0;

  function finishBoot() {
    if (bootDone) return;
    bootDone = true;
    document.documentElement.classList.add('is-ready');

    setTimeout(function () {
      document.documentElement.classList.add('is-complete');
      try {
        window.dispatchEvent(new Event('site:ready'));
      } catch (error) {}

      setTimeout(function () {
        if (boot && boot.parentNode) boot.parentNode.removeChild(boot);
      }, 700);
    }, bootFade);
  }

  function scheduleBoot() {
    if (bootDone) return;
    var min = reduceMotion ? 500 : 1000;
    var wait = Math.max(0, min - (performance.now() - bootStartedAt));
    setTimeout(finishBoot, wait);
  }

  var pageLoaded = new Promise(function (resolve) {
    if (document.readyState === 'complete') {
      resolve();
    } else {
      window.addEventListener('load', resolve, { once: true });
    }
  });

  var fontsLoaded = document.fonts && document.fonts.ready
    ? Promise.race([
        document.fonts.ready,
        new Promise(function (resolve) {
          setTimeout(resolve, 1200);
        })
      ])
    : Promise.resolve();

  Promise.all([pageLoaded, fontsLoaded]).then(scheduleBoot);
  setTimeout(finishBoot, 3000);

  /* ---------- Voltar ao topo ---------- */

  var toTop = document.querySelector('[data-to-top]');

  if (toTop) {
    function updateToTop() {
      toTop.hidden = window.pageYOffset < 600;
    }

    window.addEventListener('scroll', updateToTop, { passive: true });
    updateToTop();

    toTop.addEventListener('click', function () {
      window.scrollTo({
        top: 0,
        behavior: reduceMotion ? 'auto' : 'smooth'
      });
    });
  }

  /* ---------- Lightbox ---------- */

  var modal = document.querySelector('[data-lightbox]');

  if (modal && typeof modal.showModal === 'function') {
    var modalImg = modal.querySelector('[data-lightbox-img]');
    var modalCap = modal.querySelector('[data-lightbox-cap]');
    var zoomSelector = '.hero-photo img, .benefits-photo img, .about-photo img, .marquee__img--gallery:not([aria-hidden="true"])';
    var zoomables = document.querySelectorAll(zoomSelector);

    function openLightbox() {
      var src = safeUrl(this.currentSrc || this.src);
      if (!src) return;

      modalImg.src = src;
      modalImg.alt = this.alt || '';
      modalCap.textContent = this.alt || '';
      modal.showModal();
    }

    Array.prototype.forEach.call(zoomables, function (img) {
      img.classList.add('is-zoomable');
      img.addEventListener('click', openLightbox);
    });

    modal.addEventListener('click', function (event) {
      if (event.target === modal) modal.close();
    });

    modal.addEventListener('close', function () {
      modalImg.removeAttribute('src');
      modalCap.textContent = '';
    });
  }
}());
