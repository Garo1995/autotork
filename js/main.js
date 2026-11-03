(function () {
  'use strict';

  /* Set to your backend URL. If empty, submit is simulated. */
  var FORM_ENDPOINT = '';

  var header = document.querySelector('.header');
  var burger = document.querySelector('.header__burger');
  var nav = document.getElementById('nav');
  var links = nav.querySelectorAll('a');

  /* Header shadow on scroll */
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  function setMenu(open) {
    nav.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  links.forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* Reveal on scroll + active nav link */
  if ('IntersectionObserver' in window) {
    var reveal = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); reveal.unobserve(entry.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll('[data-reveal]').forEach(function (el, i) {
      el.style.transitionDelay = (i % 4) * 70 + 'ms';
      reveal.observe(el);
    });

    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('main section[id]').forEach(function (s) { spy.observe(s); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* Phone mask: +7 (900) 000-00-00, digits only */
  var phone = document.getElementById('phone');

  function getDigits(value) {
    var d = value.replace(/\D/g, '');
    if (d.charAt(0) === '7' || d.charAt(0) === '8') d = d.slice(1);
    return d.slice(0, 10);
  }
  function formatPhone(d) {
    if (!d) return '';
    var out = '+7 (' + d.slice(0, 3);
    if (d.length > 3) out += ') ' + d.slice(3, 6);
    if (d.length > 6) out += '-' + d.slice(6, 8);
    if (d.length > 8) out += '-' + d.slice(8, 10);
    return out;
  }
  phone.addEventListener('beforeinput', function (e) {
    if (e.data && /\D/.test(e.data)) e.preventDefault();
  });
  phone.addEventListener('input', function () { phone.value = formatPhone(getDigits(phone.value)); });
  phone.addEventListener('keydown', function (e) {
    var atEnd = phone.selectionStart === phone.value.length && phone.selectionEnd === phone.value.length;
    if (e.key === 'Backspace' && atEnd) {
      e.preventDefault();
      phone.value = formatPhone(getDigits(phone.value).slice(0, -1));
    }
  });
  phone.addEventListener('focus', function () { if (!phone.value) phone.value = '+7 ('; });
  phone.addEventListener('blur', function () { if (!getDigits(phone.value)) phone.value = ''; });

  /* Booking form */
  var form = document.getElementById('booking-form');
  var status = form.querySelector('.form__status');
  var submit = form.querySelector('button[type="submit"]');

  function setError(input, message) {
    var box = input.type === 'checkbox' ? form.querySelector('.form__consent-error') : input.parentNode.querySelector('small');
    box.textContent = message;
    input.setAttribute('aria-invalid', message ? 'true' : 'false');
  }

  var rules = {
    name: function (v) { return /^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(v.trim()) ? '' : 'Введите имя'; },
    phone: function () { return getDigits(phone.value).length === 10 ? '' : 'Введите номер полностью'; },
    service: function (v) { return v ? '' : 'Выберите услугу'; },
    consent: function () { return form.consent.checked ? '' : 'Нужно согласие на обработку данных'; }
  };

  function validateField(name) {
    var input = form.elements[name];
    var message = rules[name](input.value || '');
    setError(input, message);
    return !message;
  }

  Object.keys(rules).forEach(function (name) {
    var input = form.elements[name];
    input.addEventListener('blur', function () { if (name !== 'consent') validateField(name); });
    input.addEventListener('input', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(name); });
    input.addEventListener('change', function () { if (input.getAttribute('aria-invalid') === 'true') validateField(name); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.className = 'form__status';
    status.textContent = '';

    var valid = Object.keys(rules).map(validateField).every(Boolean);
    if (!valid) {
      var firstBad = form.querySelector('[aria-invalid="true"]');
      if (firstBad) firstBad.focus();
      return;
    }

    var payload = {
      name: form.name.value.trim(),
      phone: '+7' + getDigits(phone.value),
      service: form.service.value,
      car: form.car.value.trim()
    };

    submit.disabled = true;
    var request = FORM_ENDPOINT
      ? fetch(FORM_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); })
      : new Promise(function (resolve) { setTimeout(resolve, 600); });

    request.then(function () {
      form.reset();
      status.classList.add('is-success');
      status.textContent = 'Заявка отправлена. Перезвоним в течение 10 минут.';
    }).catch(function () {
      status.classList.add('is-error');
      status.textContent = 'Не удалось отправить. Позвоните нам: +7 (495) 000-00-00.';
    }).then(function () { submit.disabled = false; });
  });

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
