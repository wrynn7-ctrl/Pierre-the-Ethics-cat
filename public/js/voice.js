/* Speech synthesis with a French accent when possible, plus mute. window.PierreVoice */
(function () {
  'use strict';

  var synth = null;
  try { synth = window.speechSynthesis || null; } catch (e) {}
  var supported = !!(synth && window.SpeechSynthesisUtterance);

  var MUTE_KEY = 'pierre.muted';
  var muted = false;
  try { muted = localStorage.getItem(MUTE_KEY) === '1'; } catch (e) {}

  var voices = [];
  function loadVoices() { try { voices = synth.getVoices() || []; } catch (e) { voices = []; } }
  if (supported) {
    loadVoices();
    if (synth.addEventListener) synth.addEventListener('voiceschanged', loadVoices);
    else synth.onvoiceschanged = loadVoices;
  }

  function pickVoice() {
    if (!voices.length) loadVoices();
    var fr = voices.filter(function (v) { return /^fr/i.test(v.lang); });
    if (fr.length) {
      var best = fr.filter(function (v) { return /^fr[-_]FR/i.test(v.lang); })[0];
      var named = fr.filter(function (v) { return /thomas|google|daniel|male/i.test(v.name); })[0];
      return named || best || fr[0];
    }
    var en = voices.filter(function (v) { return /^en/i.test(v.lang); });
    return en.filter(function (v) { return /^en[-_]GB/i.test(v.lang); })[0] || en[0] || null;
  }

  var current = null; // { text, opts, finished, timers, lastChar, native }

  function estimate(chars) { return Math.min(Math.max(chars, 1) * 70, 30000); }

  function clearCurrent(c) {
    if (!c) return;
    c.finished = true;
    clearTimeout(c.estTimer); clearTimeout(c.watchdog); clearInterval(c.keepAlive); clearTimeout(c.cap);
  }

  function finish(c) {
    if (!c || c.finished) return;
    clearCurrent(c);
    if (current === c) current = null;
    if (c.opts.onend) { try { c.opts.onend(); } catch (e) { console.error(e); } }
  }

  function startEstimated(c, fromChar) {
    c.native = false;
    clearTimeout(c.estTimer);
    c.estTimer = setTimeout(function () { finish(c); }, estimate(c.text.length - (fromChar || 0)));
  }

  function startNative(c) {
    var u = new SpeechSynthesisUtterance(c.text);
    var v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'fr-FR'; }
    u.rate = 0.95; u.pitch = 1.15; u.volume = 1;
    c.native = true;
    c.utter = u; // keep a reference (Chrome can garbage-collect utterances)
    u.onstart = function () {
      if (c.finished) return;
      if (!c.started) { c.started = true; if (c.opts.onstart) { try { c.opts.onstart(); } catch (e) { console.error(e); } } }
      clearTimeout(c.watchdog);
    };
    u.onboundary = function (ev) {
      if (c.finished) return;
      c.lastChar = ev.charIndex || 0;
      if (c.opts.onboundary) { try { c.opts.onboundary(ev); } catch (e) { console.error(e); } }
    };
    u.onend = function () { if (c.native) finish(c); };
    u.onerror = function () { if (c.native && !c.finished) { startEstimated(c, c.lastChar); } };
    // Chrome stalls long utterances; nudging pause/resume keeps it going.
    c.keepAlive = setInterval(function () {
      if (c.finished || !c.native) return;
      try { if (synth.speaking && !synth.paused) { synth.pause(); synth.resume(); } } catch (e) {}
    }, 10000);
    // If nothing starts (blocked autoplay, no voices), fall back to a timed mouth.
    c.watchdog = setTimeout(function () {
      if (c.finished || c.started) return;
      try { synth.cancel(); } catch (e) {}
      c.started = true;
      if (c.opts.onstart) { try { c.opts.onstart(); } catch (e) { console.error(e); } }
      startEstimated(c, 0);
    }, 2500);
    // Hard cap so the UI can never hang.
    c.cap = setTimeout(function () { try { synth.cancel(); } catch (e) {} finish(c); }, estimate(c.text.length) * 2.5 + 8000);
    try { synth.cancel(); synth.speak(u); } catch (e) { clearTimeout(c.watchdog); startEstimated(c, 0); c.started = true; if (c.opts.onstart) c.opts.onstart(); }
  }

  var api = {
    supported: supported,
    isMuted: function () { return muted; },
    setMuted: function (m) {
      muted = !!m;
      try { localStorage.setItem(MUTE_KEY, muted ? '1' : '0'); } catch (e) {}
      if (muted && current && current.native) {
        // Silence immediately; the mouth keeps going for the rest of the line.
        var c = current;
        c.native = false;
        clearInterval(c.keepAlive); clearTimeout(c.watchdog);
        try { synth.cancel(); } catch (e) {}
        if (!c.started) { c.started = true; if (c.opts.onstart) c.opts.onstart(); }
        startEstimated(c, c.lastChar || 0);
      }
    },
    speak: function (text, opts) {
      api.cancel();
      text = String(text || '');
      var c = { text: text, opts: opts || {}, finished: false, started: false, lastChar: 0, native: false };
      current = c;
      if (muted || !supported) {
        c.started = true;
        if (c.opts.onstart) { try { c.opts.onstart(); } catch (e) { console.error(e); } }
        startEstimated(c, 0);
      } else {
        startNative(c);
      }
    },
    /* Stops everything without calling onend. */
    cancel: function () {
      var c = current; current = null;
      clearCurrent(c);
      if (supported) { try { synth.cancel(); } catch (e) {} }
    }
  };

  window.PierreVoice = api;
})();
