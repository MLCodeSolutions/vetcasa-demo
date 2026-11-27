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

  /* ---------- Preloader: sai no load ou em 3 s ---------- */

  var preloader = document.querySelector('[data-preloader]');

  if (preloader) {
    var hidden = false;

    function hidePreloader() {
      if (hidden) return;
      hidden = true;
      preloader.classList.add('is-done');
      setTimeout(function () {
        if (preloader.parentNode) preloader.parentNode.removeChild(preloader);
      }, 450);
    }

    if (reduceMotion) {
      hidePreloader();
    } else {
      if (document.readyState === 'complete') {
        setTimeout(hidePreloader, 200);
      } else {
        window.addEventListener('load', function () {
          setTimeout(hidePreloader, 200);
        });
      }
      setTimeout(hidePreloader, 3000);
    }
  }

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
