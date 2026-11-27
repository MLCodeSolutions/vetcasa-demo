/* ==========================================================================
   site-config.js — dados do modelo VetCasa
   Troque os valores abaixo para reaproveitar o modelo em outro projeto.
   ========================================================================== */

window.SITE = {
  brand: 'VetCasa',
  whatsapp: '5511912345678',
  phoneDisplay: '(11) 91234-5678',
  email: 'contato@vetcasa.com.br',
  instagram: 'https://www.instagram.com/vetcasa.demo',
  facebook: 'https://www.facebook.com/vetcasa.demo',
  coupon: 'VETCASA10',
  crmv: 'CRMV 00000-SP',
  domain: 'vetcasa.com.br'
};

/* Modo leve: celular pequeno, economia de dados ou 2G. */
(function () {
  try {
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection || {};
    var lite = conn.saveData === true ||
      /(^|-)2g$/.test(conn.effectiveType || '') ||
      (window.matchMedia && window.matchMedia('(prefers-reduced-data: reduce)').matches) ||
      window.innerWidth < 600;

    if (lite) document.documentElement.classList.add('is-lite');
  } catch (error) {
    /* sem suporte: segue no modo normal */
  }
}());
