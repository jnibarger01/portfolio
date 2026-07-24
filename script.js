(function () {
  'use strict';

  var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('js');

  function initNavigation() {
    var toggle = document.querySelector('.nav__toggle');
    var menu = document.getElementById('nav-menu');
    if (!toggle || !menu) return;

    function setOpen(open) {
      toggle.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('is-open', open);
      document.body.classList.toggle('nav-open', open);
    }

    toggle.addEventListener('click', function () {
      setOpen(toggle.getAttribute('aria-expanded') !== 'true');
    });

    menu.addEventListener('click', function (event) {
      if (event.target.closest('a')) setOpen(false);
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape') {
        setOpen(false);
        toggle.focus();
      }
    });

    window.addEventListener('resize', function () {
      if (window.innerWidth > 820) setOpen(false);
    });
  }

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
    }, { threshold: 0.1, rootMargin: '0px 0px -7% 0px' });
    els.forEach(function (el) { io.observe(el); });
  }

  function formatMetric(metric) {
    var value = metric.target;
    var text = metric.decimals != null ? value.toFixed(metric.decimals) : Math.round(value).toString();
    if (metric.comma) text = Number(text).toLocaleString('en-US');
    return (metric.prefix || '') + text + (metric.suffix || '');
  }

  function runCounter(el) {
    var raw = el.getAttribute('data-num');
    if (!raw || el.dataset.done) return;
    el.dataset.done = '1';
    var metric;
    try { metric = JSON.parse(raw); } catch (error) { return; }
    if (reduceMotion) { el.textContent = formatMetric(metric); return; }

    var duration = 1200;
    var start = performance.now();
    function tick(now) {
      var progress = Math.min(1, (now - start) / duration);
      var eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatMetric({
        target: metric.target * eased,
        prefix: metric.prefix,
        suffix: metric.suffix,
        decimals: metric.decimals,
        comma: metric.comma
      });
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = formatMetric(metric);
    }
    requestAnimationFrame(tick);
  }

  function initCounters() {
    var values = document.querySelectorAll('.metric-val[data-num]');
    if (!('IntersectionObserver' in window)) {
      values.forEach(runCounter);
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          runCounter(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.35 });
    values.forEach(function (el) { io.observe(el); });
  }

  function initCopyEmail() {
    var button = document.querySelector('[data-copy-email]');
    if (!button) return;
    var label = button.querySelector('[data-copy-label]');
    var email = button.getAttribute('data-copy-email');

    button.addEventListener('click', function () {
      function success() {
        if (label) label.textContent = 'Copied: ' + email;
        window.setTimeout(function () {
          if (label) label.textContent = 'Copy address to clipboard';
        }, 2200);
      }

      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(email).then(success).catch(function () {
          window.location.href = 'mailto:' + email;
        });
      } else {
        var textarea = document.createElement('textarea');
        textarea.value = email;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        try { document.execCommand('copy'); success(); }
        catch (error) { window.location.href = 'mailto:' + email; }
        textarea.remove();
      }
    });
  }

  function initMesh() {
    var canvas = document.getElementById('mesh');
    if (!canvas || reduceMotion) return;
    var context = canvas.getContext('2d');
    var width = 0;
    var height = 0;
    var dpr = 1;
    var raf = 0;
    var visible = false;
    var pageActive = !document.hidden;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      dpr = Math.min(2, window.devicePixelRatio || 1);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw(time) {
      if (!visible || !pageActive) { raf = 0; return; }
      context.clearRect(0, 0, width, height);
      var cols = width < 700 ? 28 : 44;
      var rows = width < 700 ? 20 : 26;
      var t = time * 0.00055;
      var gx = width / Math.max(1, cols - 1);
      var gy = height / Math.max(1, rows - 1);
      for (var i = 0; i < cols; i += 1) {
        for (var j = 0; j < rows; j += 1) {
          var wave = Math.sin(i * 0.4 + t * 1.6) + Math.cos(j * 0.5 + t * 1.2) + Math.sin((i + j) * 0.3 - t);
          var focus = Math.max(0, 1 - Math.abs((i / cols) - (0.55 + 0.12 * Math.sin(t))) * 2.4);
          var depth = (wave + 3) / 6;
          var alpha = (0.07 + depth * 0.4) * (0.2 + focus);
          var radius = 0.7 + depth * 1.5 + focus;
          context.beginPath();
          context.arc(i * gx + wave * 6, j * gy + wave * 4, radius, 0, Math.PI * 2);
          context.fillStyle = 'rgba(' + Math.round(150 + focus * 60) + ',' + Math.round(110 + focus * 40) + ',246,' + alpha.toFixed(3) + ')';
          context.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    }

    function updateAnimation() {
      if (visible && pageActive && !raf) raf = requestAnimationFrame(draw);
      if ((!visible || !pageActive) && raf) { cancelAnimationFrame(raf); raf = 0; }
    }

    resize();
    window.addEventListener('resize', resize, { passive: true });
    document.addEventListener('visibilitychange', function () {
      pageActive = !document.hidden;
      updateAnimation();
    });

    if ('IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        visible = entries[0] && entries[0].isIntersecting;
        updateAnimation();
      }, { rootMargin: '200px' });
      observer.observe(canvas);
    } else {
      visible = true;
      updateAnimation();
    }
  }

  function init() {
    initNavigation();
    initReveal();
    initCounters();
    initCopyEmail();
    initMesh();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
