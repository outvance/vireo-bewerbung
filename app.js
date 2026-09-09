/* VIREO Bewerbungsseite · Formular, Sticky-CTA, Consent, Meta-Pixel */
(function () {
  'use strict';

  var CONFIG = {
    ENDPOINT: 'https://script.google.com/macros/s/AKfycbyrQPWwRM6cvABHQGAZtKaaZpDd3LQ4YpdoySQ6_iCczE-s4fDKnjVO-NFGwmfEXw34Jw/exec',
    META_PIXEL_ID: '',           // Pixel-ID des TZO-Werbekontos eintragen, sonst bleibt der Consent-Streifen aus
    MAX_FILE_BYTES: 8 * 1024 * 1024,
    VARIANTE: 'landingpage',
    TEST_MODE: /[?&]test=1/.test(location.search)
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Reveal ---------- */
  var reveals = $$('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------- Sticky CTA (mobil) ---------- */
  var sticky = $('#stickyCta');
  var formSection = $('#bewerbung');
  var hero = $('main > section');
  if (sticky && formSection && 'IntersectionObserver' in window) {
    var heroSeen = false, formVisible = false;
    var update = function () {
      var show = heroSeen && !formVisible;
      sticky.classList.toggle('is-visible', show);
      document.body.classList.toggle('has-sticky', show);
    };
    new IntersectionObserver(function (en) { heroSeen = !en[0].isIntersecting; update(); }, { threshold: 0.2 }).observe(hero);
    new IntersectionObserver(function (en) { formVisible = en[0].isIntersecting; update(); }, { threshold: 0.05 }).observe(formSection);
  }

  /* ---------- Herkunft (UTM, fbclid) ---------- */
  var params = new URLSearchParams(location.search);
  var origin = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) {
    var v = params.get(k);
    if (v) { origin[k] = v; try { sessionStorage.setItem('vireo_' + k, v); } catch (e) {} }
    else { try { var s = sessionStorage.getItem('vireo_' + k); if (s) origin[k] = s; } catch (e) {} }
  });

  /* ---------- Consent + Meta-Pixel ---------- */
  var consent = $('#consent');
  var consentKey = 'vireo_consent_meta';
  function getConsent() { try { return localStorage.getItem(consentKey); } catch (e) { return null; } }
  function setConsent(v) { try { localStorage.setItem(consentKey, v); } catch (e) {} }
  function loadPixel() {
    if (!CONFIG.META_PIXEL_ID || window.fbq) return;
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', CONFIG.META_PIXEL_ID);
    window.fbq('track', 'PageView');
  }
  function track(ev) { if (window.fbq) { try { window.fbq('track', ev); } catch (e) {} } }
  function showConsent() {
    consent.classList.add('is-visible');
    document.body.classList.add('consent-open');
    document.body.style.setProperty('--consent-h', consent.offsetHeight + 'px');
  }
  function hideConsent() { consent.classList.remove('is-visible'); document.body.classList.remove('consent-open'); }
  if (consent && CONFIG.META_PIXEL_ID) {
    var c = getConsent();
    if (c === 'yes') loadPixel();
    else if (c !== 'no') showConsent();
    $$('[data-consent]', consent).forEach(function (b) {
      b.addEventListener('click', function () {
        var v = b.getAttribute('data-consent');
        setConsent(v); hideConsent();
        if (v === 'yes') loadPixel();
      });
    });
  }
  $$('[data-consent-reset]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      if (!CONFIG.META_PIXEL_ID) return;
      try { localStorage.removeItem(consentKey); } catch (err) {}
      showConsent();
    });
  });

  /* ---------- Formular ---------- */
  var form = $('#form');
  if (!form) return;
  var panels = $$('.panel', form);
  var total = panels.length;
  var current = 1;
  var stepsLabel = $('#stepsLabel');
  var bars = $$('.steps__bar span', form);
  var stepsBox = $('#steps');
  var success = $('#success');
  var formError = $('#formError');
  var submitBtn = $('#submitBtn');
  var fileInput = form.querySelector('input[name=lebenslauf]');
  var fileLabel = $('#fileLabel');
  var fileText = $('#fileText');
  var fileData = null;

  function show(n) {
    current = n;
    panels.forEach(function (p) { p.classList.toggle('is-active', +p.getAttribute('data-step') === n); });
    bars.forEach(function (b, i) { b.classList.toggle('is-done', i < n); });
    stepsLabel.textContent = 'Schritt ' + n + ' von ' + total;
    var top = form.getBoundingClientRect().top + window.pageYOffset - 24;
    if (window.pageYOffset > top) window.scrollTo({ top: top, behavior: 'smooth' });
    var first = panels[n - 1].querySelector('input:not([type=radio]):not([type=checkbox]):not([type=file]), textarea');
    if (first && window.matchMedia('(min-width: 768px)').matches) first.focus();
  }

  function setError(field, on) {
    var box = form.querySelector('[data-field="' + field + '"]');
    if (box) box.classList.toggle('has-error', !!on);
  }

  function radio(name) { var r = form.querySelector('input[name="' + name + '"]:checked'); return r ? r.value : ''; }

  function validate(n) {
    var ok = true;
    if (n === 1) {
      ['umfang', 'start', 'ausbildung'].forEach(function (k) { var v = !!radio(k); setError(k, !v); ok = ok && v; });
    } else if (n === 2) {
      var v = !!radio('erfahrung'); setError('erfahrung', !v); ok = ok && v;
    } else if (n === 3) {
      ['vorname', 'nachname', 'telefon'].forEach(function (k) {
        var val = form.elements[k].value.trim(); setError(k, !val); ok = ok && !!val;
      });
      var em = form.elements.email.value.trim();
      var emOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em); setError('email', !emOk); ok = ok && emOk;
      var kw = !!radio('kontaktweg'); setError('kontaktweg', !kw); ok = ok && kw;
      var ds = form.elements.datenschutz.checked; setError('datenschutz', !ds); ok = ok && ds;
      if (fileInput.files[0] && fileInput.files[0].size > CONFIG.MAX_FILE_BYTES) { setError('lebenslauf', true); ok = false; }
    }
    if (!ok) { var firstErr = form.querySelector('.has-error'); if (firstErr) firstErr.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
    return ok;
  }

  // Fehler zurücknehmen, sobald der Wert sich ändert
  form.addEventListener('change', function (e) {
    var box = e.target.closest('[data-field]');
    if (box) box.classList.remove('has-error');
  });
  form.addEventListener('input', function (e) {
    var box = e.target.closest('[data-field]');
    if (box) box.classList.remove('has-error');
  });

  $$('[data-next]', form).forEach(function (b) { b.addEventListener('click', function () { if (validate(current)) show(current + 1); }); });
  $$('[data-prev]', form).forEach(function (b) { b.addEventListener('click', function () { show(current - 1); }); });

  // Enter in Textfeldern: weiter statt absenden
  form.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && e.target.tagName === 'INPUT' && e.target.type !== 'checkbox' && current < total) { e.preventDefault(); if (validate(current)) show(current + 1); }
  });

  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    fileData = null;
    if (!f) { fileText.textContent = 'Datei auswählen'; fileLabel.classList.remove('has-file'); return; }
    if (f.size > CONFIG.MAX_FILE_BYTES) { setError('lebenslauf', true); fileInput.value = ''; fileText.textContent = 'Datei auswählen'; fileLabel.classList.remove('has-file'); return; }
    fileText.textContent = f.name + ' (' + (f.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB)';
    fileLabel.classList.add('has-file');
    var reader = new FileReader();
    reader.onload = function () { fileData = { name: f.name, type: f.type || 'application/octet-stream', data: String(reader.result).split(',')[1] }; };
    reader.readAsDataURL(f);
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!validate(3)) return;
    formError.classList.remove('is-visible');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Wird gesendet';

    var payload = {
      umfang: radio('umfang'), start: radio('start'), ausbildung: radio('ausbildung'),
      erfahrung: radio('erfahrung'),
      zusatz: $$('input[name=zusatz]:checked', form).map(function (i) { return i.value; }),
      nachricht: form.elements.nachricht.value.trim(),
      vorname: form.elements.vorname.value.trim(), nachname: form.elements.nachname.value.trim(),
      telefon: form.elements.telefon.value.trim(), email: form.elements.email.value.trim(),
      kontaktweg: radio('kontaktweg'),
      datenschutz: form.elements.datenschutz.checked,
      website: form.elements.website.value,
      lebenslauf: fileData,
      variante: CONFIG.VARIANTE,
      test: CONFIG.TEST_MODE,
      page: location.href
    };
    for (var k in origin) payload[k] = origin[k];

    fetch(CONFIG.ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error(res && res.error || 'unknown');
        panels.forEach(function (p) { p.classList.remove('is-active'); });
        stepsBox.style.display = 'none';
        success.classList.add('is-active');
        track('Lead');
        try { history.replaceState(null, '', location.pathname + location.search + '#danke'); } catch (err) {}
      })
      .catch(function (err) {
        formError.classList.add('is-visible');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Bewerbung absenden';
        if (window.console) console.warn('Bewerbung fehlgeschlagen', err);
      });
  });
})();
