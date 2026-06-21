/* ============================================================
   Jace Nibarger — Portfolio behaviour
   Ported from the Claude Design prototype's DCLogic class:
   scroll reveal · metric count-up · contact canvas mesh · form
   ============================================================ */
(function () {
  'use strict';

  var reduceMotion = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- scroll reveal ---------- */
  // Mark as JS-capable so CSS can hide [data-reveal] before animating it in.
  document.documentElement.classList.add('js');

  function initReveal() {
    var els = document.querySelectorAll('[data-reveal]');
    if (reduceMotion || !('IntersectionObserver' in window)) {
      els.forEach(function (el) { el.classList.add('revealed'); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ---------- metric count-up ---------- */
  // Mirrors the prototype's fmt(): prefix + number (decimals / thousands) + suffix.
  function fmt(m) {
    var n = m.target;
    var s = (m.decimals != null) ? n.toFixed(m.decimals) : Math.round(n).toString();
    if (m.comma) s = Number(s).toLocaleString('en-US');
    return (m.prefix || '') + s + (m.suffix || '');
  }

  function runCounter(el) {
    var raw = el.getAttribute('data-num');
    if (!raw || el.dataset.done) return;
    el.dataset.done = '1';
    var m;
    try { m = JSON.parse(raw); } catch (e) { return; }

    if (reduceMotion) { el.textContent = fmt(m); return; }

    var dur = 1300, t0 = performance.now();
    function tick(t) {
      var p = Math.min(1, (t - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);              // cubic ease-out
      el.textContent = fmt({ target: m.target * e, prefix: m.prefix, suffix: m.suffix, decimals: m.decimals, comma: m.comma });
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = fmt(m);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    var vals = document.querySelectorAll('.metric-val[data-num]');
    if (!('IntersectionObserver' in window)) {
      vals.forEach(runCounter);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    vals.forEach(function (el) { io.observe(el); });
  }

  /* ---------- contact canvas mesh ---------- */
  function initMesh() {
    var cv = document.getElementById('mesh');
    if (!cv || reduceMotion) return;
    var ctx = cv.getContext('2d');
    var w, h, dpr;

    function resize() {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      var r = cv.getBoundingClientRect();
      w = r.width; h = r.height;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    window.addEventListener('resize', resize);

    var cols = 46, rows = 26, raf;
    function draw(time) {
      ctx.clearRect(0, 0, w, h);
      var t = time * 0.0006;
      var gx = w / (cols - 1);
      var gy = h / (rows - 1);
      for (var i = 0; i < cols; i++) {
        for (var j = 0; j < rows; j++) {
          var bx = i * gx;
          var by = j * gy;
          var wave = Math.sin(i * 0.4 + t * 1.6) + Math.cos(j * 0.5 + t * 1.2) + Math.sin((i + j) * 0.3 - t);
          var off = wave * 7;
          var x = bx + off;
          var y = by + off * 0.7;
          var depth = (wave + 3) / 6;
          var focus = Math.max(0, 1 - Math.abs((i / cols) - (0.55 + 0.12 * Math.sin(t))) * 2.4);
          var alpha = (0.08 + depth * 0.5) * (0.25 + focus);
          var rad = 0.7 + depth * 1.6 + focus * 1.2;
          ctx.beginPath();
          ctx.arc(x, y, rad, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(' + Math.round(150 + focus * 60) + ',' + Math.round(110 + focus * 40) + ',246,' + alpha.toFixed(3) + ')';
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }
    raf = requestAnimationFrame(draw);
  }

  /* ---------- contact form (backend-free mailto) ---------- */
  function initForm() {
    var form = document.getElementById('contact-form');
    if (!form) return;
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get('name') || '').trim();
      var email = (data.get('email') || '').trim();
      var company = (data.get('company') || '').trim();
      var message = (data.get('message') || '').trim();

      var subject = 'Portfolio inquiry' + (name ? ' from ' + name : '');
      var bodyLines = [
        'Name: ' + name,
        'Email: ' + email,
        company ? 'Company: ' + company : null,
        '',
        message
      ].filter(function (l) { return l !== null; });

      window.location.href = 'mailto:jnibarger01@gmail.com' +
        '?subject=' + encodeURIComponent(subject) +
        '&body=' + encodeURIComponent(bodyLines.join('\n'));
    });
  }

  /* ---------- boot ---------- */
  function init() {
    initReveal();
    initCounters();
    initMesh();
    initForm();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
