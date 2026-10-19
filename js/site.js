/* Achu & Lekshmi — behaviour for the 2026-10-18 redesign.
   Gate doors, scroll scenes, slow auto-scroll, films, event chapters and the RSVP (unchanged from v2). */
(function () {
  'use strict';

  const C = window.WEDDING_CONFIG;
  const T = window.WEDDING_T;

  const EVENTS = [
    { day: '05', time: '11:00 AM – 12:00 PM', venue: 'Lavilla Lake Resort & Restaurant', address: 'madathil, junction, Chavara, Thekkumbhagam, Keralam 691319', q: 'Lavilla Lake Resort and Restaurant, Chavara, Kerala 691319', dir: 'https://maps.app.goo.gl/TDjA4dVLYH3GLAB19', dates: '20261205T053000Z/20261205T063000Z', loc: 'Lavilla Lake Resort and Restaurant, madathil, junction, Chavara, Thekkumbhagam, Keralam 691319' },
    { day: '06', time: '4:00 – 8:00 PM', venue: 'Meva Convention Centre', address: 'Near, Palachira - Karathala -Thettikulam Rd, Junction, Varkala, Keralam 695143', q: 'Meva Convention Centre, Varkala, Kerala 695143', dir: 'https://maps.app.goo.gl/mXn6vLCf3r7qYpwQ9', dates: '20261206T103000Z/20261206T143000Z', loc: 'Meva Convention Centre, Near, Palachira - Karathala -Thettikulam Rd, Junction, Varkala, Keralam 695143' }
  ];
  const ROMAN = ['I', 'II'];
  const WEDDING_AT = new Date('2026-12-05T11:00:00+05:30').getTime();
  const CANT_COME = 3;
  const KEY_RSVP = 'wedding-rsvp-v2', KEY_ID = 'wedding-rsvp-id';
  const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const clamp01 = v => v < 0 ? 0 : v > 1 ? 1 : v;
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const newId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);

  // English only since 2026-10-19 (browser auto-translation broke the Malayalam toggle); ?lang= links are ignored.
  const state = {
    lang: 'en',
    maps: [false, false],
    name: '', phone: '', guests: 4, attend: 0, note: '',
    errors: {}, sendError: '', sending: false, sent: null
  };
  try { const s = JSON.parse(store.get(KEY_RSVP) || 'null'); if (s && s.name) state.sent = s; } catch (e) {}
  let rsvpId = store.get(KEY_ID);
  if (!rsvpId) { rsvpId = newId(); store.set(KEY_ID, rsvpId); }

  const L = () => T[state.lang];
  const names = () => C.NAMES[state.lang];

  /* ---------- Text ---------- */
  function applyLang() {
    const t = L(), n = names();
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    $$('[data-name]').forEach(el => { el.textContent = n[el.dataset.name]; });
    renderCountdownLabels();
    renderEvents();
    renderCredits();
    renderRsvp();
    renderAuto();
    if (typeof renderMusic === 'function' && musicBtn) renderMusic();
  }

  /* ---------- Countdown ---------- */
  const cd = $('#countdown');
  cd.innerHTML = [0, 1, 2, 3].map(() => '<div class="cd-cell"><div class="cd-v">00</div><div class="cd-l"></div></div>').join('');
  const cdV = $$('.cd-v', cd), cdL = $$('.cd-l', cd);
  function renderCountdownLabels() { L().units.forEach((u, i) => { cdL[i].textContent = u; }); }
  function tick() {
    const diff = Math.max(0, WEDDING_AT - Date.now());
    const pad = n => String(n).padStart(2, '0');
    const vals = [String(Math.floor(diff / 864e5)), pad(Math.floor(diff / 36e5) % 24), pad(Math.floor(diff / 6e4) % 60), pad(Math.floor(diff / 1e3) % 60)];
    vals.forEach((v, i) => { if (cdV[i].textContent !== v) cdV[i].textContent = v; });
  }
  tick();
  setInterval(tick, 1000);

  /* ---------- Event chapters ---------- */
  const calUrl = (text, dates, loc) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${dates}&ctz=Asia/Kolkata&location=${encodeURIComponent(loc)}`;
  const mapEmbed = q => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
  const mapFrame = ev => `<iframe src="${esc(mapEmbed(ev.q))}" loading="lazy" title="${esc(ev.venue)} map" referrerpolicy="no-referrer-when-downgrade"></iframe>`;
  const eventsEl = $('#events');

  function renderEvents() {
    const t = L(), en = C.NAMES.en, couple = `${en.groom} & ${en.bride}`;
    eventsEl.innerHTML = EVENTS.map((ev, i) => `
      <article class="event${state.maps[i] ? ' map-open' : ''}" data-event="${i}" data-reveal>
        <div class="event-ch">${esc(t.chapter)} ${ROMAN[i]}</div>
        <h3 class="event-title">${esc(t.ev[i])}</h3>
        <div class="date-row">
          <div class="day">${ev.day}</div>
          <div><div class="month">${esc(t.month)}</div><div class="weekday">${esc(t.wd[i])}</div></div>
        </div>
        <div class="ev-grid">
          <div><div class="label">${esc(t.time)}</div><div class="time">${esc(ev.time)}</div></div>
          <div><div class="label">${esc(t.venue)}</div><div class="venue">${esc(ev.venue)}</div><div class="address">${esc(ev.address)}</div></div>
        </div>
        <div class="actions">
          <a class="btn-dir" href="${esc(ev.dir)}" target="_blank" rel="noopener">${esc(t.directions)}</a>
          <div class="action-pair">
            <button class="btn-line" type="button" data-map="${i}" aria-expanded="${state.maps[i]}">${esc(state.maps[i] ? t.hideMap : t.viewMap)}</button>
            <a class="btn-line" href="${esc(calUrl(`${T.en.ev[i]} · ${couple}`, ev.dates, ev.loc))}" target="_blank" rel="noopener">${esc(t.calendar)}</a>
          </div>
        </div>
        <div class="map-wrap"><div><div class="map">${state.maps[i] ? mapFrame(ev) : ''}</div></div></div>
      </article>`).join('');
    if (revealReady) $$('[data-reveal]', eventsEl).forEach(el => el.classList.add('in'));
    else $$('[data-reveal]', eventsEl).forEach(el => io && io.observe(el));
  }

  eventsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-map]'); if (!b) return;
    const i = Number(b.dataset.map), card = $(`[data-event="${i}"]`, eventsEl);
    state.maps[i] = !state.maps[i];
    card.classList.toggle('map-open', state.maps[i]);
    b.setAttribute('aria-expanded', String(state.maps[i]));
    b.textContent = state.maps[i] ? L().hideMap : L().viewMap;
    const m = $('.map', card);
    if (state.maps[i]) m.innerHTML = mapFrame(EVENTS[i]);
    else setTimeout(() => { if (!state.maps[i]) m.innerHTML = ''; }, 650);
  });

  /* ---------- Invitation letters: ?side=bride / ?side=groom puts that family's letter first ---------- */
  const side = new URLSearchParams(location.search).get('side');
  if (side === 'bride' || side === 'groom') {
    const grid = $('#letterGrid'), mine = $(`.letter[data-side="${side}"]`, grid);
    grid.prepend(mine); mine.classList.add('mine');
  }

  /* ---------- Credits ---------- */
  function renderCredits() {
    $('#credits').innerHTML = L().cr.map(([k, v]) =>
      `<div class="credit${revealReady ? ' in' : ''}" data-reveal><div class="ck">${esc(k)}</div><div class="cv">${esc(v)}</div></div>`).join('');
    if (!revealReady) $$('#credits [data-reveal]').forEach(el => io && io.observe(el));
  }

  /* ---------- RSVP (same behaviour and payload as before) ---------- */
  const form = $('#rsvpForm'), thanks = $('#thanks');
  const fName = $('#fName'), fPhone = $('#fPhone'), fNote = $('#fNote'), fWebsite = $('#fWebsite');
  const errName = $('#errName'), errPhone = $('#errPhone'), sendErr = $('#sendErr'), sendBtn = $('#sendBtn');
  const optsEl = $('#attendOpts'), guestsRow = $('#guestsRow'), guestsCount = $('#guestsCount');
  const guestsDec = $('#guestsDec'), guestsInc = $('#guestsInc');

  function setErr(el, input, msg) {
    el.textContent = msg || ''; el.hidden = !msg;
    if (input) { input.classList.toggle('invalid', !!msg); input.setAttribute('aria-invalid', msg ? 'true' : 'false'); }
  }

  function renderRsvp() {
    const t = L();
    if (state.sent) {
      form.hidden = true; thanks.hidden = false;
      const s = state.sent;
      $('#thanksHead').textContent = `${t.thanks}, ${s.name}`;
      $('#thanksSummary').textContent = s.attend === CANT_COME
        ? (t.msg[CANT_COME] || '')
        : `${t.msg[s.attend] || ''} · ${s.guests} ${s.guests === 1 ? t.guest1 : t.guestN}`;
      return;
    }
    form.hidden = false; thanks.hidden = true;
    optsEl.innerHTML = t.att.map((label, i) =>
      `<button class="opt" type="button" data-attend="${i}" aria-pressed="${i === state.attend}">${esc(label)}</button>`).join('');
    const off = state.attend === CANT_COME;
    guestsRow.classList.toggle('off', off);
    guestsDec.disabled = off || state.sending; guestsInc.disabled = off || state.sending;
    guestsCount.textContent = String(state.guests);
    setErr(errName, fName, state.errors.name);
    setErr(errPhone, fPhone, state.errors.phone);
    const connected = !!(C.RSVP_URL || '').trim();
    setErr(sendErr, null, connected ? state.sendError : t.notConnected);
    sendBtn.textContent = state.sending ? t.sending : t.send;
    sendBtn.disabled = state.sending || !connected;
  }

  // an error clears as soon as the guest starts correcting that field
  fName.addEventListener('input', () => { state.name = fName.value; if (state.errors.name) { delete state.errors.name; setErr(errName, fName, ''); } });
  fPhone.addEventListener('input', () => { state.phone = fPhone.value; if (state.errors.phone) { delete state.errors.phone; setErr(errPhone, fPhone, ''); } });
  fNote.addEventListener('input', () => { state.note = fNote.value; });
  optsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-attend]'); if (!b || state.sending) return;
    state.attend = Number(b.dataset.attend); renderRsvp();
  });
  guestsDec.addEventListener('click', () => { state.guests = Math.max(1, state.guests - 1); renderRsvp(); });
  guestsInc.addEventListener('click', () => { state.guests = Math.min(15, state.guests + 1); renderRsvp(); });
  $('#editBtn').addEventListener('click', () => {
    const s = state.sent || {};
    Object.assign(state, { name: s.name || '', phone: s.phone || '', attend: s.attend || 0, guests: s.guests || 4, note: s.note || '', sent: null, errors: {}, sendError: '' });
    fName.value = state.name; fPhone.value = state.phone; fNote.value = state.note;
    renderRsvp();
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (state.sending) return;
    const t = L(), errors = {};
    const name = state.name.trim(), digits = state.phone.replace(/\D/g, '');
    if (!name) errors.name = t.errName;
    if (digits.length < 10 || digits.length > 15) errors.phone = t.errPhone;
    state.errors = errors; state.sendError = '';
    if (Object.keys(errors).length) { renderRsvp(); (errors.name ? fName : fPhone).focus(); return; }
    const url = (C.RSVP_URL || '').trim();
    if (!url) { renderRsvp(); return; }

    const guests = state.attend === CANT_COME ? 0 : state.guests;
    const payload = { rsvpId, name, phone: state.phone.trim(), attend: state.attend, guests, note: state.note.trim(), lang: state.lang, website: fWebsite.value };
    state.sending = true; renderRsvp();
    let result = null;
    try {
      const ctrl = new AbortController(), to = setTimeout(() => ctrl.abort(), 20000);
      // text/plain keeps this a "simple" request (no CORS preflight), which Apps Script cannot answer.
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload), redirect: 'follow', signal: ctrl.signal });
      clearTimeout(to);
      result = await res.json();
    } catch (err) { result = null; }
    state.sending = false;

    // Only a confirmed {ok:true} from the Sheet counts as sent.
    if (result && result.ok === true) {
      state.sent = { name, phone: payload.phone, guests, attend: state.attend, note: payload.note, at: new Date().toISOString() };
      store.set(KEY_RSVP, JSON.stringify(state.sent));
    } else if (result && result.error === 'name') state.errors = { name: t.errName };
    else if (result && result.error === 'phone') state.errors = { phone: t.errPhone };
    else state.sendError = t.errSend;
    renderRsvp();
  });

  /* ---------- Reveal on scroll ---------- */
  let revealReady = false;
  const io = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
  }), { threshold: 0.14, rootMargin: '0px 0px -6% 0px' }) : null;

  /* ---------- Scroll scenes: hero arch, mural strips, parallax, progress ---------- */
  const root = document.documentElement;
  const hero = $('.hero'), heroStage = $('.hero-stage');
  const scrubs = $$('[data-scrub]').map(el => ({ el, ins: $$(':scope > .mural-side, :scope > .feather', el), last: '' }));
  const bar = $('#progressBar');
  let vh = innerHeight, queued = false, lastH = '';
  function scene() {
    queued = false;
    vh = innerHeight;
    const hr = hero.getBoundingClientRect();
    const travel = Math.max(1, hr.height - heroStage.offsetHeight);
    const h = clamp01(-hr.top / (travel * 0.82));
    const hv = h.toFixed(3);
    if (hv !== lastH) { lastH = hv; heroStage.style.setProperty('--h', hv); heroStage.style.setProperty('--h2', clamp01((h - 0.62) / 0.38).toFixed(3)); }
    for (const s of scrubs) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -vh || r.top > vh * 2) continue;
      const v = clamp01((vh - r.top) / (vh * 0.55)).toFixed(3);
      if (v === s.last) continue;
      s.last = v;
      for (const t of s.ins) t.style.setProperty('--in', v);
    }
    const max = Math.max(1, root.scrollHeight - vh);
    bar.style.transform = `scaleX(${clamp01(scrollY / max).toFixed(4)})`;
  }
  const queue = () => { if (!queued) { queued = true; requestAnimationFrame(scene); } };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('resize', queue);

  /* ---------- Films ---------- */
  const heroFilm = $('#heroFilm');
  function play(v) { if (!v || reduceMotion) return; v.muted = true; v.defaultMuted = true; const p = v.play(); if (p && p.catch) p.catch(() => {}); }
  if (reduceMotion) { heroFilm.removeAttribute('autoplay'); heroFilm.pause(); }
  else play(heroFilm);
  const filmIo = 'IntersectionObserver' in window ? new IntersectionObserver(es => es.forEach(en => {
    const v = en.target;
    if (en.isIntersecting) { if (v.preload === 'none') { v.preload = 'auto'; v.load(); } play(v); } else v.pause();
  }), { threshold: 0.25 }) : null;
  $$('[data-inview-play]').forEach(v => filmIo ? filmIo.observe(v) : play(v));

  /* ---------- Slow auto-scroll after the invitation opens ---------- */
  const autoBtn = $('#autoBtn'), autoLabel = $('#autoLabel'), rsvpEl = $('#rsvp');
  const auto = { on: false, done: false, raf: 0, last: 0, y: 0, dwellUntil: 0, dwelt: new Set() };
  const SPEED = () => Math.max(100, Math.min(175, innerHeight * 0.16)); // px per second
  const dwellAt = $$('main > section:not(.hero), .event, .letter');
  function renderAuto() {
    if (autoBtn.hidden) return;
    const t = L();
    autoBtn.dataset.state = auto.done ? 'done' : auto.on ? 'on' : 'paused';
    autoLabel.textContent = auto.on ? t.autoPause : t.autoPlay;
    autoBtn.setAttribute('aria-pressed', String(auto.on));
  }
  function stepAuto(now) {
    if (!auto.on) return;
    const dt = Math.min(0.05, (now - auto.last) / 1000); auto.last = now;
    // stop where the RSVP form begins — guests take it from there
    const stopAt = rsvpEl.getBoundingClientRect().top + scrollY - Math.round(innerHeight * 0.12);
    if (scrollY >= stopAt - 1) { finishAuto(); return; }
    if (now < auto.dwellUntil) { auto.raf = requestAnimationFrame(stepAuto); return; }
    for (const el of dwellAt) {
      if (auto.dwelt.has(el)) continue;
      const top = el.getBoundingClientRect().top;
      if (top <= innerHeight * 0.16 && top > -innerHeight * 0.5) { auto.dwelt.add(el); auto.dwellUntil = now + 800; break; }
    }
    // the guest moved the page some other way (scrollbar, find-in-page…) → hand it over
    if (Math.abs(scrollY - auto.set) > 4) { pauseAuto(); return; }
    auto.y = Math.min(stopAt, auto.y + SPEED() * dt);
    auto.set = Math.round(auto.y);
    window.scrollTo(0, auto.set);
    auto.raf = requestAnimationFrame(stepAuto);
  }
  function startAuto() {
    if (reduceMotion || auto.done) return;
    autoBtn.hidden = false;
    auto.on = true; auto.y = scrollY; auto.set = Math.round(scrollY); auto.last = performance.now();
    cancelAnimationFrame(auto.raf); auto.raf = requestAnimationFrame(stepAuto);
    renderAuto();
  }
  function pauseAuto() { if (!auto.on) return; auto.on = false; cancelAnimationFrame(auto.raf); renderAuto(); }
  function finishAuto() { auto.on = false; auto.done = true; cancelAnimationFrame(auto.raf); renderAuto(); }
  autoBtn.addEventListener('click', () => {
    if (auto.on) pauseAuto();
    else { auto.done = false; auto.dwelt = new Set(); startAuto(); }
  });
  // any hand on the page takes over from the auto-scroll
  ['wheel', 'touchstart', 'keydown', 'pointerdown'].forEach(type => addEventListener(type, e => {
    if (e.target && e.target.closest && e.target.closest('#autoBtn, #musicBtn')) return;
    pauseAuto();
  }, { passive: true }));

  /* ---------- Music: the couple's trance track + a soft chime as the doors open ----------
     Web Audio (sample-accurate loop, fades) — browsers allow sound only after a tap, so it starts on "Open". */
  const MUSIC_URL = 'assets/v2/audio/marriage-trance-v1.mp3', CHIME_URL = 'assets/v2/audio/door-chime-v1.mp3';
  const KEY_MUSIC = 'wedding-music', VOL = 0.24; // the track is ~5 dB louder than the old piano loop
  const musicBtn = $('#musicBtn');
  const music = { ctx: null, gain: null, buf: null, chime: null, src: null, on: false, failed: false, loading: null, bytes: null };
  const wantMusic = () => store.get(KEY_MUSIC) !== 'off';
  function prefetchMusic() {
    if (music.bytes) return;
    const get = u => fetch(u).then(r => r.ok ? r.arrayBuffer() : null).catch(() => null);
    music.bytes = [get(MUSIC_URL), get(CHIME_URL)];
  }
  function decode(ctx, p) {
    return p.then(ab => ab ? new Promise(res => { try { ctx.decodeAudioData(ab, res, () => res(null)); } catch (e) { res(null); } }) : null);
  }
  function ensureCtx() {
    if (music.ctx) return music.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {} // iPhone: play even on silent
    const ctx = new AC();
    ctx.onstatechange = () => renderMusic();
    music.ctx = ctx; music.gain = ctx.createGain(); music.gain.gain.value = 0; music.gain.connect(ctx.destination);
    prefetchMusic();
    music.loading = Promise.all([decode(ctx, music.bytes[0]), decode(ctx, music.bytes[1])]).then(([m, c]) => { music.buf = m; music.chime = c; });
    return ctx;
  }
  // MP3 adds a few ms of encoder silence at both ends — loop between the real first and last samples
  function loopPoints(b) {
    const d = b.getChannelData(0), th = 2e-4;
    let a = 0; while (a < 4096 && Math.abs(d[a]) < th) a++;
    let z = d.length - 1; while (z > d.length - 8192 && Math.abs(d[z]) < th) z--;
    return [a / b.sampleRate, (z + 1) / b.sampleRate];
  }
  function ramp(to, secs) {
    const g = music.gain.gain, now = music.ctx.currentTime;
    g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(to, now + secs);
  }
  function startMusic() {                      // call from a tap
    const ctx = ensureCtx(); if (!ctx) { music.failed = true; renderMusic(); return; }
    if (ctx.state !== 'running') ctx.resume();
    music.on = true; renderMusic();
    music.loading.then(() => {
      if (!music.buf) { music.on = false; music.failed = true; renderMusic(); return; }
      if (!music.on) return;
      if (!music.src) {
        const s = ctx.createBufferSource(), [a, z] = loopPoints(music.buf);
        s.buffer = music.buf; s.loop = true; s.loopStart = a; s.loopEnd = z;
        s.connect(music.gain); s.start(0, a); music.src = s;
      }
      ramp(VOL, 2.5); renderMusic();
    });
  }
  function stopMusic() {
    music.on = false; renderMusic();
    if (!music.ctx) return;
    ramp(0, 0.6);
    setTimeout(() => { if (!music.on && music.ctx.state === 'running') music.ctx.suspend(); }, 700);
  }
  function playChime() {
    const ctx = ensureCtx(); if (!ctx) return;
    music.loading.then(() => {
      if (!music.chime) return;
      const s = ctx.createBufferSource(), g = ctx.createGain();
      s.buffer = music.chime; g.gain.value = 0.5; s.connect(g); g.connect(ctx.destination); s.start();
    });
  }
  function renderMusic() {
    const playing = music.on && !!music.src && (!music.ctx || music.ctx.state === 'running');
    musicBtn.dataset.state = music.failed ? 'failed' : playing ? 'playing' : music.on ? 'loading' : 'off';
    musicBtn.setAttribute('aria-pressed', String(music.on));
    musicBtn.setAttribute('aria-label', L().music);
    musicBtn.title = L().music;
    if (music.ctx) musicBtn.dataset.ctx = music.ctx.state;
    if (music.buf) musicBtn.dataset.dur = music.buf.duration.toFixed(1);
  }
  musicBtn.addEventListener('click', () => {
    if (music.on) { stopMusic(); store.set(KEY_MUSIC, 'off'); }
    else { music.failed = false; startMusic(); store.set(KEY_MUSIC, 'on'); }
  });
  ['touchend', 'pointerup', 'click', 'keydown'].forEach(type => addEventListener(type, () => {
    if (music.on && music.ctx && music.ctx.state !== 'running' && !document.hidden) music.ctx.resume().then(renderMusic, () => {});
  }, { passive: true }));
  document.addEventListener('visibilitychange', () => {
    if (!music.ctx || !music.on) return;
    if (document.hidden) music.ctx.suspend(); else music.ctx.resume();
  });
  setTimeout(prefetchMusic, 1500);

  /* ---------- Gate ---------- */
  const gate = $('#gate');
  let opened = false;
  function entered() {
    root.classList.add('entered');
    setTimeout(startAuto, 1300);
  }
  function openGate() {
    if (opened) return;
    opened = true;
    gate.classList.add('opening');
    if (wantMusic()) { startMusic(); playChime(); }
    document.body.style.overflow = '';
    play(heroFilm);
    entered();
    setTimeout(() => gate.remove(), reduceMotion ? 50 : 1800);
  }
  if (C.SHOW_INTRO === false || scrollY > 10) { gate.remove(); opened = true; entered(); }
  else {
    document.body.style.overflow = 'hidden';
    $$('[data-open]', gate).forEach(b => b.addEventListener('click', openGate));
  }

  /* ---------- Start ---------- */
  applyLang();
  if (io) $$('[data-reveal]').forEach(el => io.observe(el));
  else $$('[data-reveal]').forEach(el => el.classList.add('in'));
  revealReady = true;
  scene();
})();
