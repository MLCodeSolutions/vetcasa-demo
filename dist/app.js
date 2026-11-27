/* site-config.js */
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

/* main.js */
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

  /* ---------- Contadores ---------- */

  var counters = document.querySelectorAll('[data-sc-count]');

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

  /* ---------- Hero: só começa depois do boot ---------- */

  var heroStarted = false;

  function startHero() {
    if (heroStarted) return;
    heroStarted = true;

    document.querySelectorAll('[data-sc-type]').forEach(typeWriter);

    counters.forEach(function (el) {
      var parts = (el.getAttribute('data-sc-count') || '0,0,').split(',');
      el.textContent = '0\u20130' + (parts[2] || '');
    });

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
  }

  if (document.documentElement.classList.contains('is-complete')) {
    startHero();
  } else {
    window.addEventListener('site:ready', startHero, { once: true });
    setTimeout(startHero, 3000);
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

/* booking.js */
/* ==========================================================================
   booking.js — wizard de agendamento do Modelo 3
   Config, calendário, disponibilidade mock, validação, resumo e WhatsApp.
   Estrutura portada de uma referência de agendamento, adaptada para a VetCasa.
   ========================================================================== */

(function () {
  'use strict';

  var SITE = window.SITE || {};
  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  }

  /* ---------- Wizard: referências ---------- */

  var booking = $('#agendamento');
  if (!booking) return;

  var wizard = booking.querySelector('.bk-wrap');

  var steps = [1, 2, 3, 4];
  var stepLabels = ['Serviço', 'Data e hora', 'Dados', 'Confirmação'];

  var calendarGrid = $('#cg');
  var calendarMonth = $('#cl');
  var timesWrap = $('#ta');
  var morningSlots = $('#sm');
  var afternoonSlots = $('#st');
  var nextStep1 = $('#b1');
  var nextStep2 = $('#b2');
  var summary = $('#smr');
  var whatsappLink = $('#wal');
  var stepStatus = $('#step-status');

  var serviceButtons = $all('.bk-service');
  var state = {
    service: null,
    date: null,
    time: null
  };

  var MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  var DOWS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  var today = new Date();
  var viewYear = today.getFullYear();
  var viewMonth = today.getMonth();
  var busyCache = {};

  function pad(value) {
    return String(value).length < 2 ? '0' + value : String(value);
  }

  function keyOf(year, month, day) {
    return year + '-' + pad(month + 1) + '-' + pad(day);
  }

  function startOfToday() {
    return new Date(today.getFullYear(), today.getMonth(), today.getDate());
  }

  function formatFullDate(date) {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }

  function clear(el) {
    while (el.firstChild) el.removeChild(el.firstChild);
  }

  /* ---------- Disponibilidade (mock) ----------
     ALTERAR: substituir por disponibilidade real (API, planilha ou agenda).
     O hash mantém os horários estáveis por data e funciona em qualquer mês. */

  function hashString(str) {
    var hash = 2166136261;
    for (var i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function mulberry32(seed) {
    return function () {
      seed |= 0;
      seed = (seed + 0x6d2b79f5) | 0;
      var t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function getBusy(dateKey) {
    if (Object.prototype.hasOwnProperty.call(busyCache, dateKey)) {
      return busyCache[dateKey];
    }

    var random = mulberry32(hashString(dateKey));
    var count = Math.floor(random() * 3);
    var pool = [8, 9, 10, 11, 14, 15, 16, 17];

    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var swap = pool[i];
      pool[i] = pool[j];
      pool[j] = swap;
    }

    busyCache[dateKey] = pool.slice(0, count).sort(function (a, b) {
      return a - b;
    });

    return busyCache[dateKey];
  }

  /* ---------- Navegação entre passos ---------- */

  function scrollToForm() {
    var target = wizard || booking;

    try {
      target.scrollIntoView({
        behavior: reduceMotion ? 'auto' : 'smooth',
        block: 'start'
      });
    } catch (error) {
      target.scrollIntoView();
    }
  }

  function go(step) {
    steps.forEach(function (index) {
      var panel = document.getElementById('pn' + index);
      var progress = document.getElementById('ps' + index);

      panel.classList.remove('is-on');
      progress.classList.remove('is-on', 'is-done');
      progress.removeAttribute('aria-current');

      if (index < step) progress.classList.add('is-done');
    });

    document.getElementById('pn' + step).classList.add('is-on');

    var activeProgress = document.getElementById('ps' + step);
    activeProgress.classList.add('is-on');
    activeProgress.setAttribute('aria-current', 'step');

    if (step === 2) renderCalendar();
    if (step === 4) buildSummary();

    if (stepStatus) {
      stepStatus.textContent = 'Etapa ' + step + ' de 4: ' + stepLabels[step - 1];
    }

    var heading = document.getElementById('pn' + step + '-h');
    if (heading) {
      try {
        heading.focus({ preventScroll: true });
      } catch (error) {
        heading.focus();
      }
    }

    scrollToForm();
  }

  /* ---------- Passo 1: serviço ---------- */

  serviceButtons.forEach(function (button) {
    button.setAttribute('aria-pressed', 'false');

    button.addEventListener('click', function () {
      serviceButtons.forEach(function (item) {
        item.classList.remove('is-on');
        item.setAttribute('aria-pressed', 'false');
      });

      button.classList.add('is-on');
      button.setAttribute('aria-pressed', 'true');
      state.service = button.getAttribute('data-service');
      nextStep1.disabled = false;
    });
  });

  /* ---------- Passo 2: calendário ---------- */

  function renderCalendar() {
    calendarMonth.textContent = MONTHS[viewMonth] + ' ' + viewYear;
    clear(calendarGrid);

    DOWS.forEach(function (dayName) {
      var cell = document.createElement('div');
      cell.className = 'bk-dow';
      cell.setAttribute('aria-hidden', 'true');
      cell.textContent = dayName;
      calendarGrid.appendChild(cell);
    });

    var firstWeekday = new Date(viewYear, viewMonth, 1).getDay();
    var totalDays = new Date(viewYear, viewMonth + 1, 0).getDate();

    for (var blank = 0; blank < firstWeekday; blank++) {
      var empty = document.createElement('span');
      empty.className = 'bk-day is-empty';
      empty.setAttribute('aria-hidden', 'true');
      calendarGrid.appendChild(empty);
    }

    for (var day = 1; day <= totalDays; day++) {
      var date = new Date(viewYear, viewMonth, day);
      var dateKey = keyOf(viewYear, viewMonth, day);
      var disabled = date.getDay() === 0 || date < startOfToday();
      var isToday = date.toDateString() === today.toDateString();
      var button = document.createElement('button');

      button.type = 'button';
      button.className = 'bk-day';
      button.textContent = String(day);
      button.setAttribute('aria-label', formatFullDate(date));

      if (disabled) {
        button.classList.add('is-disabled');
        button.disabled = true;
      }

      if (isToday) button.classList.add('is-today');

      if (state.date === dateKey) {
        button.classList.add('is-selected');
        button.setAttribute('aria-pressed', 'true');
      } else {
        button.setAttribute('aria-pressed', 'false');
      }

      if (!disabled) {
        var dot = document.createElement('span');
        dot.className = 'bk-day-dot';
        dot.setAttribute('aria-hidden', 'true');
        button.appendChild(dot);

        button.addEventListener('click', (function (key) {
          return function () {
            selectDate(key);
          };
        }(dateKey)));
      }

      calendarGrid.appendChild(button);
    }
  }

  function selectDate(dateKey) {
    state.date = dateKey;
    state.time = null;

    renderCalendar();

    timesWrap.hidden = false;
    renderSlots();
    updateStep2Button();
  }

  function renderSlots() {
    var busy = getBusy(state.date);

    clear(morningSlots);
    clear(afternoonSlots);

    [8, 9, 10, 11].forEach(function (hour) {
      morningSlots.appendChild(createSlot(hour, busy));
    });

    [14, 15, 16, 17].forEach(function (hour) {
      afternoonSlots.appendChild(createSlot(hour, busy));
    });
  }

  function createSlot(hour, busy) {
    var label = pad(hour) + ':00';
    var button = document.createElement('button');
    var unavailable = busy.indexOf(hour) !== -1;

    button.type = 'button';
    button.className = 'bk-slot';
    button.textContent = label;

    if (unavailable) {
      button.classList.add('is-busy');
      button.disabled = true;
      button.setAttribute('aria-label', label + ' — indisponível');
      return button;
    }

    if (state.time === label) {
      button.classList.add('is-on');
      button.setAttribute('aria-pressed', 'true');
    } else {
      button.setAttribute('aria-pressed', 'false');
    }

    button.setAttribute('aria-label', label + ' — disponível');

    button.addEventListener('click', function () {
      selectTime(label);
    });

    return button;
  }

  function selectTime(label) {
    state.time = label;
    renderSlots();
    updateStep2Button();
  }

  function updateStep2Button() {
    nextStep2.disabled = !(state.date && state.time);
  }

  /* ---------- Passo 3: validação ---------- */

  var requiredFields = [
    ['ff1', 'i1'],
    ['ff2', 'i2'],
    ['ff3', 'i3'],
    ['ff4', 'i4'],
    ['ff5', 'i7']
  ];

  function validateField(wrapperId, inputId) {
    var input = document.getElementById(inputId);
    var wrapper = document.getElementById(wrapperId);
    var valid = !!input.value.trim();

    wrapper.classList.toggle('is-invalid', !valid);
    input.setAttribute('aria-invalid', valid ? 'false' : 'true');

    return valid;
  }

  function validateForm() {
    var valid = true;
    var firstInvalid = null;

    requiredFields.forEach(function (pair) {
      var fieldValid = validateField(pair[0], pair[1]);

      if (!fieldValid && !firstInvalid) {
        firstInvalid = document.getElementById(pair[1]);
      }

      valid = valid && fieldValid;
    });

    if (firstInvalid) firstInvalid.focus();

    return valid;
  }

  $all('#pn3 input, #pn3 select, #pn3 textarea').forEach(function (input) {
    function clearError() {
      var wrapper = input.closest('.bk-field');

      if (wrapper) wrapper.classList.remove('is-invalid');
      input.setAttribute('aria-invalid', 'false');
    }

    input.addEventListener('input', clearError);
    input.addEventListener('change', clearError);
  });

  /* ---------- Passo 4: resumo e WhatsApp ---------- */

  function fieldValue(id) {
    return document.getElementById(id).value.trim();
  }

  function buildSummary() {
    if (!state.date) return;

    var parts = state.date.split('-');
    var date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    var dateLabel = date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });

    var tutor = fieldValue('i1');
    var phone = fieldValue('i2');
    var pet = fieldValue('i3');
    var species = fieldValue('i4');
    var breed = fieldValue('i5');
    var age = fieldValue('i6');
    var address = fieldValue('i7');
    var district = fieldValue('i8');
    var complement = fieldValue('i9');
    var notes = fieldValue('i10');
    var fullAddress = [address, district, complement].filter(Boolean).join(', ');
    var petInfo = pet + ' (' + species + (breed ? ', ' + breed : '') + (age ? ', ' + age : '') + ')';

    var rows = [
      ['Serviço', state.service],
      ['Data', dateLabel],
      ['Horário', state.time],
      ['Tutor', tutor],
      ['WhatsApp', phone],
      ['Pet', petInfo],
      ['Endereço', fullAddress]
    ];

    if (notes) rows.push(['Obs', notes]);

    clear(summary);

    rows.forEach(function (row) {
      var line = document.createElement('div');
      var key = document.createElement('span');
      var value = document.createElement('span');

      line.className = 'bk-summary-row';
      key.className = 'bk-summary-key';
      key.textContent = row[0];
      value.className = 'bk-summary-value';
      value.textContent = row[1];

      line.appendChild(key);
      line.appendChild(value);
      summary.appendChild(line);
    });

    var message = [
      '🐾 *Solicitação de Agendamento — VetCasa*',
      '',
      'Olá, Dra. Helena! Gostaria de agendar:',
      '',
      '📋 *Serviço:* ' + state.service,
      '📅 *Data preferida:* ' + dateLabel,
      '⏰ *Horário preferido:* ' + state.time,
      '',
      '👤 *Tutor:* ' + tutor,
      '📱 *Contato:* ' + phone,
      '',
      '🐶 *Pet:* ' + pet,
      '🐾 *Espécie:* ' + species + (breed ? ' — ' + breed : ''),
      age ? '🎂 *Idade:* ' + age : null,
      '',
      '📍 *Endereço:* ' + fullAddress,
      notes ? '💬 *Obs:* ' + notes : null,
      '',
      'Aguardo confirmação, obrigado(a)! 🙏'
    ].filter(function (line) {
      return line !== null;
    }).join('\n');

    whatsappLink.href = 'https://wa.me/' + (SITE.whatsapp || '5511912345678') + '?text=' + encodeURIComponent(message);
  }

  /* ---------- Eventos gerais do wizard ---------- */

  $all('[data-go]').forEach(function (button) {
    button.addEventListener('click', function () {
      go(parseInt(button.getAttribute('data-go'), 10));
    });
  });

  $('#cal-prev').addEventListener('click', function () {
    viewMonth -= 1;

    if (viewMonth < 0) {
      viewMonth = 11;
      viewYear -= 1;
    }

    renderCalendar();
  });

  $('#cal-next').addEventListener('click', function () {
    viewMonth += 1;

    if (viewMonth > 11) {
      viewMonth = 0;
      viewYear += 1;
    }

    renderCalendar();
  });

  $('#b-review').addEventListener('click', function () {
    if (validateForm()) go(4);
  });

  renderCalendar();
}());

/* motion.js */
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

  /* ---------- Reveals: respeitar movimento reduzido ---------- */

  if (reduceMotion) return;
  if (!('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll('[data-reveal]');
  var groups = document.querySelectorAll('[data-reveal-group]');

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
}());

/* app.js */
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
