/* Pierre's face: mouth, eyelids, head bob and breathing, drawn as an SVG
   overlay on top of the 900x1200 portrait. window.PierreAvatar */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var W = 900, H = 1200;

  // Measured points (percent of image) -> image pixels.
  var MOUTH = { x: 0.580 * W, y: 0.461 * H, w: 0.055 * W, maxH: 0.045 * H };
  var EYES = [
    { x: 0.489 * W, y: 0.363 * H, w: 0.055 * W, h: 0.030 * H },
    { x: 0.642 * W, y: 0.357 * H, w: 0.055 * W, h: 0.030 * H }
  ];

  var figure = null, mouthPath = null, clipPath = null, tongue = null, mouthGroup = null;
  var lids = [];
  var reduceMotion = false;
  var talking = false, mouthCur = 0, mouthTarget = 0, mouthManual = null;
  var nextFlap = 0, boundaryKick = 0;
  var blinkT0 = -1, blinkTimer = null, doubleBlink = false;
  var rafId = 0, started = 0;

  function el(name, attrs, parent) {
    var n = document.createElementNS(NS, name);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function build(stage) {
    figure = stage.querySelector('.stage-figure');
    if (!figure) {
      figure = document.createElement('div');
      figure.className = 'stage-figure';
      while (stage.firstChild) figure.appendChild(stage.firstChild);
      stage.appendChild(figure);
    }
    var old = figure.querySelector('svg.avatar-overlay');
    if (old) old.remove();

    var svg = el('svg', {
      'class': 'avatar-overlay', viewBox: '0 0 ' + W + ' ' + H,
      preserveAspectRatio: 'none', 'aria-hidden': 'true', focusable: 'false'
    }, figure);

    var defs = el('defs', {}, svg);
    var grad = el('linearGradient', { id: 'lidGrad', x1: '0', y1: '0', x2: '0', y2: '1' }, defs);
    el('stop', { offset: '0', 'stop-color': '#ab958f' }, grad);
    el('stop', { offset: '1', 'stop-color': '#b6a29c' }, grad);
    var fl = el('filter', { id: 'lidSoft', x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    el('feGaussianBlur', { stdDeviation: 2 }, fl);
    var cp = el('clipPath', { id: 'mouthClip' }, defs);
    clipPath = el('path', { d: '' }, cp);

    // Eyelids: an ellipse hanging from the top of each eye; scaleY grows it shut.
    lids = EYES.map(function (e) {
      var g = el('g', { filter: 'url(#lidSoft)' }, svg);
      var lw = e.w * 1.3, lh = e.h * 1.7;
      el('ellipse', { cx: 0, cy: lh / 2, rx: lw / 2, ry: lh / 2, fill: 'url(#lidGrad)' }, g);
      el('path', {
        d: 'M ' + (-lw / 2 + 4) + ' ' + (lh - 3) + ' Q 0 ' + (lh + 5) + ' ' + (lw / 2 - 4) + ' ' + (lh - 3),
        fill: 'none', stroke: '#4f3f40', 'stroke-width': 1.4, 'stroke-linecap': 'round', opacity: 0.35
      }, g);
      g.style.visibility = 'hidden';
      return { g: g, top: e.y - lh * 0.42, x: e.x, w: lw, h: lh };
    });

    tuneLidColor(figure.querySelector('img'), grad);

    mouthGroup = el('g', { opacity: 0 }, svg);
    mouthPath = el('path', { d: '', fill: '#3a1418' }, mouthGroup);
    var tg = el('g', { 'clip-path': 'url(#mouthClip)' }, mouthGroup);
    tongue = el('ellipse', { cx: MOUTH.x, cy: MOUTH.y, rx: 10, ry: 8, fill: '#e88a9a' }, tg);
    setMouthShape(0);
  }

  // Sample the fur just above/below the eyes so the eyelids match the photo.
  function tuneLidColor(img, grad) {
    function run() {
      try {
        var c = document.createElement('canvas'); c.width = 90; c.height = 120;
        var x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, 90, 120);
        function avg(px, py) {
          var d = x.getImageData(px, py, 4, 2).data, r = 0, g = 0, b = 0, n = 0;
          for (var i = 0; i < d.length; i += 4) { if (d[i + 3] > 200) { r += d[i]; g += d[i + 1]; b += d[i + 2]; n++; } }
          return n ? [r / n, g / n, b / n] : null;
        }
        var pts = [[44, 39], [58, 39], [44, 46], [58, 46]], sum = [0, 0, 0], k = 0;
        pts.forEach(function (p) { var v = avg(p[0], p[1]); if (v) { sum[0] += v[0]; sum[1] += v[1]; sum[2] += v[2]; k++; } });
        if (!k) return;
        var m = sum.map(function (s) { return s / k; });
        var gray = (m[0] + m[1] + m[2]) / 3;
        function hex(f) { return 'rgb(' + m.map(function (v) { return Math.round(Math.min(255, (v * 0.75 + gray * 0.25) * f)); }).join(',') + ')'; }
        var stops = grad.querySelectorAll('stop');
        stops[0].setAttribute('stop-color', hex(1.05));
        stops[1].setAttribute('stop-color', hex(1.1));
      } catch (e) { /* tainted canvas (file://) or no data: keep defaults */ }
    }
    if (img.complete && img.naturalWidth) run(); else img.addEventListener('load', run);
  }

  function setMouthShape(o) {
    o = Math.max(0, Math.min(1, o));
    if (o < 0.04) { mouthGroup.setAttribute('opacity', 0); return; }
    var cx = MOUTH.x, cy = MOUTH.y + 1;
    var w = MOUTH.w * (0.55 + 0.45 * o);
    var h = MOUTH.maxH * o;
    var d = 'M ' + (cx - w / 2) + ' ' + cy +
      ' Q ' + cx + ' ' + (cy - 3 - 2 * o) + ' ' + (cx + w / 2) + ' ' + cy +
      ' C ' + (cx + w / 2) + ' ' + (cy + h * 1.15) + ' ' + (cx - w / 2) + ' ' + (cy + h * 1.15) + ' ' + (cx - w / 2) + ' ' + cy + ' Z';
    mouthPath.setAttribute('d', d);
    clipPath.setAttribute('d', d);
    tongue.setAttribute('cx', cx);
    tongue.setAttribute('cy', cy + h * 0.82);
    tongue.setAttribute('rx', w * 0.32);
    tongue.setAttribute('ry', Math.max(1, h * 0.28));
    mouthGroup.setAttribute('opacity', Math.min(1, o * 6));
  }

  function setLids(c) { // c: 0 open .. 1 closed
    for (var i = 0; i < lids.length; i++) {
      var l = lids[i];
      if (c <= 0.02) { l.g.style.visibility = 'hidden'; continue; }
      l.g.style.visibility = 'visible';
      l.g.setAttribute('transform', 'translate(' + l.x + ' ' + l.top + ') scale(1 ' + c + ')');
    }
  }

  function scheduleBlink() {
    clearTimeout(blinkTimer);
    blinkTimer = setTimeout(function () {
      api.blink();
      if (Math.random() < 0.18) doubleBlink = true;
      scheduleBlink();
    }, 2500 + Math.random() * 3500);
  }

  function frame(now) {
    rafId = requestAnimationFrame(frame);
    var t = (now - started) / 1000;

    // Blink: 150 ms total, close then reopen.
    if (blinkT0 >= 0) {
      var p = (now - blinkT0) / 150;
      if (p >= 1) {
        blinkT0 = -1; setLids(0);
        if (doubleBlink) { doubleBlink = false; setTimeout(function () { api.blink(); }, 90); }
      } else {
        setLids(p < 0.5 ? p * 2 : (1 - p) * 2);
      }
    }

    // Mouth
    if (mouthManual !== null) {
      mouthTarget = mouthManual;
    } else if (talking) {
      if (now >= nextFlap) {
        var r = Math.random();
        mouthTarget = r < 0.16 ? 0.05 : 0.3 + Math.random() * 0.7;
        nextFlap = now + 1000 / (8 + Math.random() * 4) * (0.8 + Math.random() * 0.5);
      }
      if (boundaryKick > 0) { mouthTarget = 1; boundaryKick = 0; nextFlap = now + 90; }
    } else {
      mouthTarget = 0;
    }
    var k = mouthManual !== null ? 1 : 0.5;
    mouthCur += (mouthTarget - mouthCur) * k;
    setMouthShape(mouthCur);

    // Head bob / breathing
    var tx = 0, ty = 0, rot = 0, sc = 1;
    if (!reduceMotion) {
      if (talking) {
        ty = Math.sin(t * 9.5) * 2.2 + Math.sin(t * 3.1) * 1.2;
        rot = Math.sin(t * 2.3) * 1.2 + Math.sin(t * 5.7) * 0.4;
        tx = Math.sin(t * 2.9) * 1.5;
      } else {
        sc = 1 + Math.sin(t * 1.7) * 0.004;
      }
    }
    figure.style.transform = 'translate(' + tx.toFixed(2) + 'px,' + ty.toFixed(2) + 'px) rotate(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(4) + ')';
  }

  var api = {
    init: function (stageEl) {
      if (!stageEl) return;
      try { reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}
      build(stageEl);
      started = performance.now();
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(frame);
      scheduleBlink();
      document.addEventListener('visibilitychange', function () {
        if (document.hidden) { cancelAnimationFrame(rafId); clearTimeout(blinkTimer); }
        else { cancelAnimationFrame(rafId); rafId = requestAnimationFrame(frame); scheduleBlink(); }
      });
    },
    startTalking: function () { talking = true; nextFlap = 0; },
    stopTalking: function () { talking = false; },
    /* Called from speech word-boundary events: a crisp extra mouth pulse. */
    pulse: function () { boundaryKick = 1; },
    setMouth: function (o) {
      if (o === null || o === undefined) { mouthManual = null; return; }
      mouthManual = Math.max(0, Math.min(1, +o || 0));
      mouthCur = mouthManual;
      if (mouthGroup) setMouthShape(mouthCur);
    },
    blink: function () { if (lids.length) blinkT0 = performance.now(); },
    /* Debug helper: hold the lids at a given closure 0..1. */
    _holdLids: function (c) { blinkT0 = -1; setLids(c); }
  };

  window.PierreAvatar = api;
})();
