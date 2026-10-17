/* Wires the page together: disclaimer, chat, brain choice, talking. */
(function () {
  'use strict';

  var $ = function (id) { return document.getElementById(id); };
  var dialog = $('disclaimer'), accept = $('accept'), app = $('app');
  var messages = $('messages'), form = $('composer'), input = $('question'), sendBtn = $('send');
  var muteBtn = $('mute'), chips = $('chips'), stage = $('stage');

  var mode = 'jokes';
  var history = [];
  var busy = false, accepted = false, typeTimer = null;

  var Avatar = window.PierreAvatar, Voice = window.PierreVoice, Jokes = window.PierreJokes;

  // ---- Avatar ----
  if (Avatar) Avatar.init(stage);

  // ---- Config (silently falls back to jokes) ----
  (function loadConfig() {
    if (!window.fetch) return;
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 4000);
    fetch('/api/config', { cache: 'no-store', signal: ctl ? ctl.signal : undefined })
      .then(function (r) { if (!r.ok) throw new Error('no config'); return r.json(); })
      .then(function (j) { if (j && j.mode === 'ai') mode = 'ai'; })
      .catch(function () { mode = 'jokes'; })
      .then(function () { clearTimeout(t); });
  })();

  // ---- Mute ----
  function renderMute() {
    var m = Voice ? Voice.isMuted() : true;
    muteBtn.setAttribute('aria-pressed', m ? 'true' : 'false');
    muteBtn.setAttribute('aria-label', m ? "Unmute Pierre's voice" : "Mute Pierre's voice");
    muteBtn.classList.toggle('is-muted', m);
    muteBtn.title = m ? 'Voice is off' : 'Voice is on';
  }
  muteBtn.addEventListener('click', function () {
    if (Voice) Voice.setMuted(!Voice.isMuted());
    renderMute();
  });
  renderMute();

  // ---- Disclaimer ----
  function openDisclaimer() {
    if (typeof dialog.showModal === 'function') {
      try { dialog.showModal(); } catch (e) { dialog.setAttribute('open', ''); }
    } else {
      dialog.setAttribute('open', '');
      dialog.setAttribute('role', 'dialog');
      dialog.setAttribute('aria-modal', 'true');
    }
    accept.focus();
  }
  dialog.addEventListener('cancel', function (e) { e.preventDefault(); }); // Escape does not dismiss
  dialog.addEventListener('keydown', function (e) { // minimal focus trap (single control)
    if (e.key === 'Tab') { e.preventDefault(); accept.focus(); }
    if (e.key === 'Escape') e.preventDefault();
  });
  accept.addEventListener('click', function () {
    if (typeof dialog.close === 'function' && dialog.open) dialog.close();
    dialog.removeAttribute('open');
    accepted = true;
    app.removeAttribute('inert');
    greet();
  });

  // ---- Messages ----
  function scrollDown() { messages.scrollTop = messages.scrollHeight; }

  function addUser(text) {
    var row = document.createElement('div');
    row.className = 'msg msg-user';
    var b = document.createElement('div');
    b.className = 'bubble';
    b.textContent = text;
    row.appendChild(b);
    messages.appendChild(row);
    scrollDown();
  }

  function addPierreShell() {
    var row = document.createElement('div');
    row.className = 'msg msg-pierre';
    var who = document.createElement('span');
    who.className = 'who';
    who.textContent = 'Pierre';
    var b = document.createElement('div');
    b.className = 'bubble';
    row.appendChild(who); row.appendChild(b);
    messages.appendChild(row);
    scrollDown();
    return b;
  }

  function addPondering() {
    var b = addPierreShell();
    b.parentNode.classList.add('is-pondering');
    b.innerHTML = '<span class="pondering">Pierre is pondering<span class="dots" aria-hidden="true"><i>.</i><i>.</i><i>.</i></span></span>';
    return b.parentNode;
  }

  function setBusy(v) {
    busy = v;
    input.disabled = v || !accepted;
    sendBtn.disabled = v || !accepted;
    form.classList.toggle('is-busy', v);
    app.setAttribute('aria-busy', v ? 'true' : 'false');
  }

  /* Pierre says `text`: types it out while the voice and mouth run. */
  function say(text, done) {
    var bubble = addPierreShell();
    // Screen readers get the whole line at once; the typed copy is hidden from them.
    var sr = document.createElement('span'); sr.className = 'sr-only'; sr.textContent = text;
    var vis = document.createElement('span'); vis.setAttribute('aria-hidden', 'true');
    var caret = document.createElement('span'); caret.className = 'caret'; caret.setAttribute('aria-hidden', 'true');
    bubble.appendChild(sr); bubble.appendChild(vis); bubble.appendChild(caret);

    var i = 0, ended = false, typed = false, finished = false;
    var reduce = false;
    try { reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) {}

    function maybeFinish() {
      if (finished || !ended || !typed) return;
      finished = true;
      if (Avatar) Avatar.stopTalking();
      caret.remove();
      history.push({ role: 'assistant', content: text });
      history = history.slice(-10);
      done && done();
    }
    function typeStep() {
      var step = text.length > 220 ? 2 : 1;
      i = Math.min(text.length, i + step);
      vis.textContent = text.slice(0, i);
      scrollDown();
      if (i >= text.length) { typed = true; maybeFinish(); return; }
      var ch = text.charAt(i - 1);
      var delay = 52 + Math.random() * 18 + (/[,;]/.test(ch) ? 110 : /[.!?…]/.test(ch) ? 200 : 0);
      typeTimer = setTimeout(typeStep, delay);
    }

    var onstart = function () {
      if (Avatar) Avatar.startTalking();
      clearTimeout(typeTimer);
      typeStep();
    };
    var onend = function () {
      ended = true;
      // Speech is over: reveal anything left and settle.
      clearTimeout(typeTimer);
      i = text.length; vis.textContent = text; typed = true;
      maybeFinish();
    };
    if (Voice) {
      Voice.speak(text, {
        onstart: onstart,
        onboundary: function () { if (Avatar && Avatar.pulse) Avatar.pulse(); },
        onend: onend
      });
    } else {
      onstart(); setTimeout(onend, Math.min(text.length * 70, 20000));
    }
    if (reduce) { /* mouth still animates; text pacing is unchanged */ }
  }

  function greet() {
    setBusy(true);
    var g = (Jokes && Jokes.greeting) ? Jokes.greeting() : 'Bonjour, mon ami. I am Pierre. Ask me an ethical question.';
    say(g, function () {
      setBusy(false);
      chips.hidden = false;
      input.focus();
    });
  }

  // ---- Brains ----
  function jokesAnswer(q) {
    try { return Jokes.answer(q); } catch (e) { console.error(e); }
    return 'Zut alors, my thoughts have tangled in the yarn. Ask me again, mon ami.';
  }

  function aiAnswer(q, hist) {
    var ctl = window.AbortController ? new AbortController() : null;
    var t = setTimeout(function () { if (ctl) ctl.abort(); }, 25000);
    return fetch('/api/ask', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ question: q, history: hist }),
      signal: ctl ? ctl.signal : undefined
    }).then(function (r) {
      if (!r.ok) throw new Error('ask failed ' + r.status);
      return r.json();
    }).then(function (j) {
      if (!j || typeof j.answer !== 'string' || !j.answer.trim()) throw new Error('bad answer');
      return j.answer.trim();
    }).then(function (a) { clearTimeout(t); return a; }, function (e) { clearTimeout(t); throw e; });
  }

  function think(q, hist) {
    var delay = 700 + Math.random() * 700;
    var wait = new Promise(function (res) { setTimeout(res, delay); });
    var brain = mode === 'ai'
      ? aiAnswer(q, hist).catch(function () { return jokesAnswer(q); })
      : Promise.resolve(jokesAnswer(q));
    return Promise.all([brain, wait]).then(function (r) { return r[0]; });
  }

  // ---- Asking ----
  function ask(q) {
    q = (q || '').trim().slice(0, 500);
    if (!q || busy || !accepted) return;
    chips.hidden = true;
    input.value = '';
    setBusy(true);
    var hist = history.slice(-10);
    history.push({ role: 'user', content: q });
    history = history.slice(-10);
    addUser(q);
    var p = addPondering();
    think(q, hist).then(function (answer) {
      p.remove();
      say(answer, function () { setBusy(false); input.focus(); });
    });
  }

  form.addEventListener('submit', function (e) { e.preventDefault(); ask(input.value); });
  chips.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('.chip');
    if (c) ask(c.textContent);
  });

  setBusy(true);
  input.disabled = true;
  openDisclaimer();
})();
