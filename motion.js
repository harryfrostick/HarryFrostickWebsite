/* motion.js: shared GSAP motion layer for harryfrostick.com
 *
 * Markup vocabulary (add attributes, no extra JS per page):
 *   data-m-group="hero"   plays on page load, in reading order
 *   data-m-group          plays once when the section scrolls into view
 *   data-m-batch          (with data-m-group) children reveal row by row as they arrive
 *   data-m="rise"         text and blocks: rise 24px with opacity (the default)
 *   data-m="line"         dividers: draw from the left
 *   data-m="list"         rows, tags, items: children arrive one after another
 *   data-m="fade"         opacity only (pictures and video)
 *   data-m-headline       the page's big headline: letters rise from a mask, then the wave starts
 *   data-m-marquee="22"   seconds per loop; slows under the pointer, pauses off screen
 *   data-m-magnet         primary buttons: follow the pointer a little, give on press
 *   data-m-cursor         grows the custom cursor on hover, like the nav links
 *
 * Window.Motion exposes onHeroDone(fn), stopWave(), spring(apply, opts), project(v),
 * rubberband(), reduce and fine for page-specific code.
 *
 * Interaction follows Apple's fluid-interface rules: feedback on pointer-down, springs
 * (damping ratio + response) that start from the live value and keep their velocity
 * when retargeted, so every move can be interrupted and reversed.
 */
(function () {
  var root = document.documentElement;
  if (!window.gsap) { root.classList.remove('gsap-ready'); return; }
  var hasST = !!window.ScrollTrigger;
  if (hasST) gsap.registerPlugin(ScrollTrigger);

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  // Tokens (taste-skill motion tokens, translated to GSAP)
  var EASE_OUT = 'expo.out';        // enters and reveals
  var T_REVEAL = 0.8, STAGGER = 0.075, RISE = 24;

  var heroCallbacks = [], heroFinished = false, waves = [];
  window.Motion = {
    reduce: reduce, fine: fine,
    onHeroDone: function (fn) { heroFinished ? fn() : heroCallbacks.push(fn); },
    stopWave: function () { waves.forEach(function (w) { w.kill(); }); waves = []; }
  };

  // ── Springs: Apple's damping ratio + response, integrated per frame ──
  // A spring has no duration. Retargeting keeps position and velocity, so it is always interruptible.
  function spring(apply, opts) {
    opts = opts || {};
    var damping = opts.damping == null ? 1 : opts.damping;    // 1 = critically damped, no overshoot
    var response = opts.response || 0.35;                       // seconds, lower = snappier
    var k = Math.pow(2 * Math.PI / response, 2);
    var c = 4 * Math.PI * damping / response;
    var x = opts.from || 0, v = 0, to = x, raf = null, last = 0, onRest = null;
    function step(now) {
      var dt = Math.min(0.064, (now - last) / 1000); last = now;
      var n = Math.max(1, Math.ceil(dt / 0.004)), h = dt / n;
      for (var i = 0; i < n; i++) { v += (-k * (x - to) - c * v) * h; x += v * h; }
      if (Math.abs(v) < 0.01 * (opts.precision || 1) && Math.abs(x - to) < 0.01 * (opts.precision || 1)) {
        x = to; v = 0; apply(x); raf = null;
        if (onRest) { var f = onRest; onRest = null; f(); }
        return;
      }
      apply(x);
      raf = requestAnimationFrame(step);
    }
    function run() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(step); } }
    return {
      to: function (t, velocity, done) {                       // animate from wherever it is now
        to = t; if (velocity != null) v = velocity; onRest = done || null; run();
      },
      jump: function (t) { if (raf) cancelAnimationFrame(raf); raf = null; x = to = t; v = 0; apply(x); },
      stop: function () { if (raf) cancelAnimationFrame(raf); raf = null; onRest = null; },
      get value() { return x; },
      get velocity() { return v; },
      get moving() { return !!raf; }
    };
  }
  // Where a flick would come to rest (Apple's projection, deceleration rate per ms)
  function project(velocity, rate) {
    rate = rate || 0.998;
    return (velocity / 1000) * rate / (1 - rate);
  }
  // Progressive resistance past an edge
  function rubberband(overshoot, dimension, constant) {
    constant = constant || 0.55;
    return (overshoot * dimension * constant) / (dimension + constant * Math.abs(overshoot));
  }
  window.Motion.spring = spring;
  window.Motion.project = project;
  window.Motion.rubberband = rubberband;

  // Elements that rest below full opacity say so with data-m-opacity
  function target(el) { return parseFloat(el.getAttribute('data-m-opacity')) || 1; }

  // ── One element's entrance, chosen by its data-m kind ──
  function reveal(el) {
    var kind = el.getAttribute('data-m') || 'rise';
    if (reduce) {
      // fewer and gentler: keep the fade, drop the travel
      return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: target(el), duration: 0.4, ease: 'power1.out' });
    }
    if (kind === 'line') {
      return gsap.fromTo(el, { autoAlpha: 1, scaleX: 0, transformOrigin: 'left center' },
                             { scaleX: 1, duration: 1, ease: 'expo.inOut', clearProps: 'transform' });
    }
    if (kind === 'list') {
      var kids = el.children;
      return gsap.timeline()
        .set(el, { autoAlpha: 1 })
        .fromTo(kids, { autoAlpha: 0, y: 14 },
                      { autoAlpha: 1, y: 0, duration: 0.6, ease: EASE_OUT, stagger: 0.045, clearProps: 'transform' });
    }
    if (kind === 'fade') {
      return gsap.fromTo(el, { autoAlpha: 0 }, { autoAlpha: target(el), duration: T_REVEAL, ease: 'power1.out' });
    }
    return gsap.fromTo(el, { autoAlpha: 0, y: RISE },
                           { autoAlpha: target(el), y: 0, duration: T_REVEAL, ease: EASE_OUT, clearProps: 'transform' });
  }

  function playInOrder(items) {
    var tl = gsap.timeline();
    items.forEach(function (el, i) { tl.add(reveal(el), i * STAGGER); });
    return tl;
  }

  // ── Headline: wrap letters in masks ──
  var headline = document.querySelector('[data-m-headline]');
  var chars = [];
  if (headline) {
    chars = gsap.utils.toArray(headline.querySelectorAll('.wave-char'));
    chars.forEach(function (c) {
      var m = document.createElement('span');
      m.className = 'm-mask';
      c.parentNode.insertBefore(m, c);
      m.appendChild(c);
    });
  }

  function startWave() {
    if (reduce || !chars.length) return;
    var w = gsap.to(chars, {
      y: -8, duration: 1.25, ease: 'sine.inOut',
      stagger: { each: 0.1, repeat: -1, yoyo: true }
    });
    waves.push(w);
    if (hasST) ScrollTrigger.create({     // no point waving off screen
      trigger: headline, start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { s.isActive ? w.resume() : w.pause(); }
    });
  }

  // ── Groups ──
  function ownItems(group) {
    return gsap.utils.toArray(group.querySelectorAll('[data-m], [data-m-headline]')).filter(function (el) {
      return el.closest('[data-m-group]') === group;
    });
  }

  var heroGroup = document.querySelector('[data-m-group="hero"]');

  gsap.utils.toArray('[data-m-group]').forEach(function (g) {
    if (g === heroGroup) return;
    var items = ownItems(g);
    if (!items.length) return;
    if (!hasST) { items.forEach(reveal); return; }
    if (g.hasAttribute('data-m-batch') && !reduce) {
      ScrollTrigger.batch(items, {
        start: 'clamp(top 92%)', once: true,
        onEnter: function (batch) { batch.forEach(function (el, i) { gsap.delayedCall(i * 0.08, function () { reveal(el); }); }); }
      });
      return;
    }
    ScrollTrigger.create({ trigger: g, start: 'clamp(top 85%)', once: true, onEnter: function () { playInOrder(items); } });
  });

  // Loose elements outside any group trigger on their own
  gsap.utils.toArray('[data-m]').forEach(function (el) {
    if (el.closest('[data-m-group]')) return;
    if (!hasST) { reveal(el); return; }
    ScrollTrigger.create({ trigger: el, start: 'clamp(top 88%)', once: true, onEnter: function () { reveal(el); } });
  });

  // ── Hero: plays on load ──
  function finishHero() {
    heroFinished = true;
    startWave();
    heroCallbacks.forEach(function (fn) { fn(); });
    heroCallbacks = [];
  }

  (function playHero() {
    var items = heroGroup ? ownItems(heroGroup) : [];
    if (headline && items.indexOf(headline) === -1) items.unshift(headline);
    var tl = gsap.timeline({ delay: 0.1, onComplete: finishHero });
    var t = 0;
    items.forEach(function (el) {
      if (el === headline) {
        tl.set(headline, { autoAlpha: 1 }, t);
        if (reduce) {
          tl.fromTo(chars, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.4 }, t);
          t += 0.2;
        } else {
          // the signature move: letters rise out of their masks
          tl.fromTo(chars, { yPercent: 105 },
                           { yPercent: 0, duration: 1.1, ease: EASE_OUT, stagger: 0.04 }, t);
          t += 0.35 + chars.length * 0.03;
        }
      } else {
        tl.add(reveal(el), t);
        t += reduce ? 0.03 : 0.09;
      }
    });
    if (!items.length) finishHero();
  })();

  // ── Marquees ──
  gsap.utils.toArray('[data-m-marquee]').forEach(function (track) {
    if (reduce) return;                   // no autoplay under reduced motion
    var loop = gsap.to(track, {
      xPercent: -50, ease: 'none', repeat: -1,
      duration: parseFloat(track.getAttribute('data-m-marquee')) || 20
    });
    var host = track.parentElement;
    if (fine) {
      host.addEventListener('mouseenter', function () { gsap.to(loop, { timeScale: 0.2, duration: 0.6, ease: 'power2.out' }); });
      host.addEventListener('mouseleave', function () { gsap.to(loop, { timeScale: 1, duration: 0.6, ease: 'power2.out' }); });
    }
    if (hasST) ScrollTrigger.create({
      trigger: host, start: 'top bottom', end: 'bottom top',
      onToggle: function (s) { s.isActive ? loop.resume() : loop.pause(); }
    });
  });

  // ── Cursor: same grow + difference state the nav links already use ──
  var cursor = document.getElementById('cursor');
  function cursorState(on) {
    if (!cursor) return;
    cursor.style.transform = 'translate(-50%,-50%) scale(' + (on ? 4.5 : 1) + ')';
    cursor.style.mixBlendMode = on ? 'difference' : 'multiply';
    cursor.style.transition = 'transform 0.3s ease';
  }
  if (fine) {
    gsap.utils.toArray('[data-m-cursor], [data-m-magnet]').forEach(function (el) {
      el.addEventListener('mouseenter', function () { cursorState(true); });
      el.addEventListener('mouseleave', function () { cursorState(false); });
    });
  }

  // ── Press feedback: on pointer-down, instantly, for every control ──
  // Uses the individual `scale` property so it composes with any existing transform.
  var PRESSABLE = 'button, .submit-btn, .cta-btn, .masonry-item, .featured-card, .tag, ' +
                  '.footer-nav a, .prox-links a, .mobile-menu a, .success-msg a, .nav-logo';
  gsap.utils.toArray(PRESSABLE).forEach(function (el) {
    var big = el.offsetWidth > 240;                 // large surfaces give less
    var down = big ? 0.985 : 0.96;
    var s = spring(function (v) { el.style.scale = v; }, { from: 1, damping: 1, response: 0.18, precision: 0.1 });
    function press() { if (!reduce) s.to(down); }
    function release() { s.to(1); }
    el.addEventListener('pointerdown', press);
    ['pointerup', 'pointerleave', 'pointercancel', 'dragstart'].forEach(function (ev) { el.addEventListener(ev, release); });
    el.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') press(); });
    el.addEventListener('keyup', release);
    el.addEventListener('blur', release);
  });

  // ── Magnetic primary buttons: two independent springs, X and Y ──
  gsap.utils.toArray('[data-m-magnet]').forEach(function (btn) {
    if (!fine || reduce) return;
    var sx = spring(function (v) { gsap.set(btn, { x: v }); }, { response: 0.35 });
    var sy = spring(function (v) { gsap.set(btn, { y: v }); }, { response: 0.35 });
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var cx = r.left + r.width / 2 - sx.value, cy = r.top + r.height / 2 - sy.value;   // rest position
      sx.to((e.clientX - cx) * 0.25);
      sy.to((e.clientY - cy) * 0.4);
    });
    btn.addEventListener('mouseleave', function () { sx.to(0); sy.to(0); });
  });

  // ── Desktop nav: reachable by keyboard and by clicking the burger, not only by hovering ──
  var proxNav = document.getElementById('proxNav');
  var proxLinks = document.getElementById('proxLinks');
  var proxBurger = document.getElementById('proxBurger');
  if (proxNav && proxLinks && proxBurger) {
    proxBurger.setAttribute('aria-expanded', 'false');
    proxBurger.setAttribute('aria-controls', 'proxLinks');
    var setOpen = function (on) {
      proxLinks.classList.toggle('expanded', on);
      proxBurger.classList.toggle('open', on);
      proxBurger.setAttribute('aria-expanded', on ? 'true' : 'false');
    };
    // a pointer click opens (hover may already have); the keyboard toggles
    proxBurger.addEventListener('click', function (e) { setOpen(e.detail === 0 ? !proxLinks.classList.contains('expanded') : true); });
    proxNav.addEventListener('focusin', function () { setOpen(true); });
    proxNav.addEventListener('focusout', function (e) { if (!proxNav.contains(e.relatedTarget)) setOpen(false); });
    new MutationObserver(function () {   // keep aria in sync with the hover behaviour
      proxBurger.setAttribute('aria-expanded', proxLinks.classList.contains('expanded') ? 'true' : 'false');
    }).observe(proxLinks, { attributes: true, attributeFilter: ['class'] });
  }

  // ── Reduced motion: no full-screen moving background ──
  if (reduce) {
    document.querySelectorAll('video[autoplay]').forEach(function (v) {
      v.removeAttribute('autoplay'); v.pause();
      v.addEventListener('play', function () { v.pause(); }, { once: true });
    });
  }

  // Images load late and change heights; keep scroll triggers accurate
  if (hasST) window.addEventListener('load', function () { ScrollTrigger.refresh(); });
})();
