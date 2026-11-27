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
