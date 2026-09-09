/* VIREO Bewerbungsfunnel · Schrittsteuerung, Antworten, Versand */
(function () {
  'use strict';

  var CONFIG = {
    ENDPOINT: 'https://script.google.com/macros/s/AKfycbyrQPWwRM6cvABHQGAZtKaaZpDd3LQ4YpdoySQ6_iCczE-s4fDKnjVO-NFGwmfEXw34Jw/exec',
    VARIANTE: 'funnel',
    TOTAL_STEPS: 8,
    MAX_FILE_BYTES: 8 * 1024 * 1024,
    TEST_MODE: /[?&]test=1/.test(location.search)
  };

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var funnel = $('#funnel'), stage = $('#stage'), bar = $('#bar'), back = $('#back'), stepsBox = $('#steps');
  var screens = $$('.screen', stage);
  var order = screens.map(function (s) { return s.getAttribute('data-screen'); });
  var answers = { zusatz: [] };
  var history = ['intro'];
  var fileData = null;

  /* Fortschrittssegmente aufbauen */
  for (var i = 0; i < CONFIG.TOTAL_STEPS; i++) stepsBox.appendChild(document.createElement('span'));
  var segs = $$('span', stepsBox);

  /* Herkunft aus der URL merken */
  var params = new URLSearchParams(location.search);
  var origin = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'fbclid'].forEach(function (k) {
    var v = params.get(k);
    if (v) { origin[k] = v; try { sessionStorage.setItem('vireo_' + k, v); } catch (e) {} }
    else { try { var s = sessionStorage.getItem('vireo_' + k); if (s) origin[k] = s; } catch (e) {} }
  });

  function screenEl(name) { return stage.querySelector('.screen[data-screen="' + name + '"]'); }

  function show(name, dir) {
    var el = screenEl(name);
    if (!el) return;
    stage.setAttribute('data-dir', dir === 'back' ? 'back' : 'forward');
    screens.forEach(function (s) { s.classList.toggle('is-active', s === el); });

    var tone = el.getAttribute('data-tone');
    funnel.classList.toggle('on-inverse', tone === 'forest');

    var step = el.getAttribute('data-step');
    bar.hidden = (name === 'intro' || name === 'danke');
    if (step) {
      var n = parseInt(step, 10);
      segs.forEach(function (s, idx) { s.classList.toggle('is-done', idx < n); });
      stepsBox.setAttribute('aria-valuenow', n);
    }
    back.disabled = history.length <= 1 || name === 'danke';
    el.scrollTop = 0;
    var h = el.querySelector('.f-title');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  function go(name) {
    if (history[history.length - 1] !== name) history.push(name);
    show(name, 'forward');
  }

  back.addEventListener('click', function () {
    if (history.length <= 1) return;
    history.pop();
    show(history[history.length - 1], 'back');
  });

  /* Einzelauswahl: markieren und automatisch weiterspringen */
  $$('.opts').forEach(function (group) {
    var field = group.getAttribute('data-field');
    group.addEventListener('click', function (e) {
      var btn = e.target.closest('.opt');
      if (!btn) return;
      $$('.opt', group).forEach(function (b) { b.classList.toggle('is-selected', b === btn); });
      answers[field] = btn.getAttribute('data-value');
      var current = group.closest('.screen').getAttribute('data-screen');
      var next = String(parseInt(current, 10) + 1);
      setTimeout(function () { go(next); }, 260);
    });
  });

  /* Mehrfachauswahl Zusatzqualifikationen */
  var zusatz = $('#zusatz');
  zusatz.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    chip.classList.toggle('is-selected');
    answers.zusatz = $$('.chip.is-selected', zusatz).map(function (c) { return c.getAttribute('data-value'); });
  });

  /* Kontaktweg */
  var kw = $('#kontaktweg');
  kw.addEventListener('click', function (e) {
    var chip = e.target.closest('.chip');
    if (!chip) return;
    $$('.chip', kw).forEach(function (c) { c.classList.toggle('is-selected', c === chip); });
    answers.kontaktweg = chip.getAttribute('data-value');
    kw.closest('.f-field').classList.remove('has-error');
  });

  /* Weiter- und Überspringen-Knöpfe */
  $$('[data-go]').forEach(function (b) { b.addEventListener('click', function () { go(b.getAttribute('data-go')); }); });
  $$('[data-skip]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.chip.is-selected', zusatz).forEach(function (c) { c.classList.remove('is-selected'); });
      answers.zusatz = [];
      go(b.getAttribute('data-skip'));
    });
  });

  /* Lebenslauf */
  var fileInput = $('#fl'), fileLabel = $('#fileLabel'), fileText = $('#fileText');
  fileInput.addEventListener('change', function () {
    var f = fileInput.files[0];
    fileData = null;
    var box = fileLabel.closest('.f-field');
    box.classList.remove('has-error');
    if (!f) { fileText.textContent = 'Datei auswählen'; fileLabel.classList.remove('has-file'); return; }
    if (f.size > CONFIG.MAX_FILE_BYTES) { box.classList.add('has-error'); fileInput.value = ''; fileText.textContent = 'Datei auswählen'; fileLabel.classList.remove('has-file'); return; }
    fileText.textContent = f.name + ' (' + (f.size / 1024 / 1024).toFixed(1).replace('.', ',') + ' MB)';
    fileLabel.classList.add('has-file');
    var reader = new FileReader();
    reader.onload = function () { fileData = { name: f.name, type: f.type || 'application/octet-stream', data: String(reader.result).split(',')[1] }; };
    reader.readAsDataURL(f);
  });

  /* Absenden */
  var form = $('#ffm'), ferr = $('#ferr'), fsub = $('#fsub'), dsWrap = $('#dsWrap'), ds = $('#fd');
  function mark(field, on) {
    var box = form.querySelector('[data-field="' + field + '"]');
    if (box) box.classList.toggle('has-error', !!on);
  }
  form.addEventListener('input', function (e) {
    var box = e.target.closest('[data-field]');
    if (box) box.classList.remove('has-error');
    if (e.target === ds) dsWrap.classList.remove('has-error');
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var ok = true;
    ['vorname', 'nachname', 'telefon'].forEach(function (k) {
      var v = form.elements[k].value.trim(); mark(k, !v); ok = ok && !!v;
    });
    var em = form.elements.email.value.trim();
    var emOk = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em); mark('email', !emOk); ok = ok && emOk;
    var kwOk = !!answers.kontaktweg; mark('kontaktweg', !kwOk); ok = ok && kwOk;
    var dsOk = ds.checked; dsWrap.classList.toggle('has-error', !dsOk); ok = ok && dsOk;
    if (!ok) {
      var first = form.querySelector('.has-error');
      if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    ferr.classList.remove('is-visible');
    fsub.disabled = true;
    fsub.textContent = 'Wird gesendet';

    var payload = {
      umfang: answers.umfang, start: answers.start, ausbildung: answers.ausbildung,
      erfahrung: answers.erfahrung, zusatz: answers.zusatz,
      nachricht: '',
      vorname: form.elements.vorname.value.trim(), nachname: form.elements.nachname.value.trim(),
      telefon: form.elements.telefon.value.trim(), email: em,
      kontaktweg: answers.kontaktweg,
      datenschutz: true,
      website: $('#hp').value,
      lebenslauf: fileData,
      variante: CONFIG.VARIANTE,
      test: CONFIG.TEST_MODE,
      page: location.href
    };
    for (var k in origin) payload[k] = origin[k];

    fetch(CONFIG.ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow' })
      .then(function (r) { return r.json(); })
      .then(function (res) {
        if (!res || !res.ok) throw new Error((res && res.error) || 'unknown');
        history.push('danke');
        show('danke', 'forward');
      })
      .catch(function (err) {
        ferr.classList.add('is-visible');
        fsub.disabled = false;
        fsub.textContent = 'Bewerbung absenden';
        if (window.console) console.warn('Bewerbung fehlgeschlagen', err);
      });
  });

  show('intro', 'forward');
})();
