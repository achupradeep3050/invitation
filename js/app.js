/* Achu & Lekshmi — behaviour, ported from the Claude Design prototype (Wedding Invitation v2). */
(function () {
  'use strict';

  const C = window.WEDDING_CONFIG;
  const T = window.WEDDING_T;

  const EVENTS = [
    { day: '03', time: '9:00 – 10:00 AM', venue: 'Guruvayur', address: 'Guruvayur, Thrissur, Kerala', q: 'Guruvayur Sri Krishna Temple', dir: 'https://www.google.com/maps/search/?api=1&query=Guruvayur+Sri+Krishna+Temple', dates: '20261203T033000Z/20261203T043000Z', loc: 'Guruvayur, Kerala' },
    { day: '05', time: '11:00 AM – 12:00 PM', venue: 'Lavilla Lake Resort & Restaurant', address: 'madathil, junction, Chavara, Thekkumbhagam, Keralam 691319', q: 'Lavilla Lake Resort and Restaurant, Chavara, Kerala 691319', dir: 'https://maps.app.goo.gl/TDjA4dVLYH3GLAB19', dates: '20261205T053000Z/20261205T063000Z', loc: 'Lavilla Lake Resort and Restaurant, madathil, junction, Chavara, Thekkumbhagam, Keralam 691319' },
    { day: '06', time: '4:00 – 8:00 PM', venue: 'Meva Convention Centre', address: 'Near, Palachira - Karathala -Thettikulam Rd, Junction, Varkala, Keralam 695143', q: 'Meva Convention Centre, Varkala, Kerala 695143', dir: 'https://maps.app.goo.gl/mXn6vLCf3r7qYpwQ9', dates: '20261206T103000Z/20261206T143000Z', loc: 'Meva Convention Centre, Near, Palachira - Karathala -Thettikulam Rd, Junction, Varkala, Keralam 695143' }
  ];
  const ROMAN = ['I', 'II', 'III'];
  const WEDDING_AT = new Date('2026-12-05T11:00:00+05:30').getTime();
  const CANT_COME = 3;
  const FILTERS = {
    'Watercolor': 'url(#watercolor) saturate(.92) brightness(1.03)',
    'Oil painting': 'url(#oil) saturate(1.15) contrast(1.05)',
    'Film grade': 'sepia(.3) contrast(1.1) saturate(.85)',
    'Original': 'none'
  };
  const KEY_LANG = 'wedding-lang', KEY_RSVP = 'wedding-rsvp-v2', KEY_ID = 'wedding-rsvp-id';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  const newId = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 12);

  const state = {
    lang: store.get(KEY_LANG) === 'ml' ? 'ml' : 'en',
    flips: [false, false, false],
    name: '', phone: '', guests: 2, attend: 0, note: '',
    errors: {}, sendError: '', sending: false, sent: null
  };
  try { const s = JSON.parse(store.get(KEY_RSVP) || 'null'); if (s && s.name) state.sent = s; } catch (e) {}
  let rsvpId = store.get(KEY_ID);
  if (!rsvpId) { rsvpId = newId(); store.set(KEY_ID, rsvpId); }

  const L = () => T[state.lang];
  const names = () => C.NAMES[state.lang];

  document.documentElement.style.setProperty('--photo-filter', FILTERS[C.PHOTO_STYLE] || 'none');

  /* ---------- Language ---------- */
  function applyLang() {
    const t = L(), n = names();
    document.documentElement.lang = state.lang;
    $$('[data-i18n]').forEach(el => { const v = t[el.dataset.i18n]; if (typeof v === 'string') el.textContent = v; });
    $$('[data-name]').forEach(el => { el.textContent = n[el.dataset.name]; });
    renderCountdownLabels();
    renderEvents();
    renderCredits();
    renderRsvp();
  }
  $('#langToggle').addEventListener('click', () => {
    state.lang = state.lang === 'ml' ? 'en' : 'ml';
    store.set(KEY_LANG, state.lang);
    applyLang();
  });

  /* ---------- Intro ---------- */
  const intro = $('#intro');
  let opening = false;
  const introTimers = [];
  function finishIntro() { intro.remove(); document.body.style.overflow = ''; }
  function openInvitation() {
    if (opening) return;
    opening = true;
    introTimers.forEach(clearTimeout);
    intro.dataset.stage = '3';
    intro.classList.add('opening');
    setTimeout(finishIntro, 1500);
  }
  if (C.SHOW_INTRO === false) finishIntro();
  else {
    document.body.style.overflow = 'hidden';
    [300, 2600, 4600].forEach((ms, i) => introTimers.push(setTimeout(() => { if (!opening) intro.dataset.stage = String(i + 1); }, ms)));
    $$('[data-open]', intro).forEach(b => b.addEventListener('click', openInvitation));
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

  /* ---------- Event chapters (flip cards) ---------- */
  const calUrl = (text, dates, loc) => `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(text)}&dates=${dates}&ctz=Asia/Kolkata&location=${encodeURIComponent(loc)}`;
  const mapEmbed = q => `https://maps.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
  const eventsEl = $('#events');

  function renderEvents() {
    const t = L(), en = C.NAMES.en, couple = `${en.groom} & ${en.bride}`;
    eventsEl.innerHTML = EVENTS.map((ev, i) => `
      <section class="event" data-screen-label="0${i + 4} ${esc(T.en.ev[i])}">
        <div class="event-head" data-reveal>
          <div class="eyebrow">${esc(t.chapter)} ${ROMAN[i]}</div>
          <h2 class="event-title">${esc(t.ev[i])}</h2>
        </div>
        <div class="card-wrap" data-reveal>
          <div class="card${i % 2 ? ' odd' : ''}${state.flips[i] ? ' flipped' : ''}" data-card="${i}">
            <div class="face front" ${state.flips[i] ? 'aria-hidden="true"' : ''}>
              <div class="card-band"></div>
              <div class="card-body">
                <div class="date-row">
                  <div class="day">${ev.day}</div>
                  <div class="date-meta">
                    <div class="month">${esc(t.month)}</div>
                    <div class="weekday">${esc(t.wd[i])}</div>
                  </div>
                </div>
                <div class="time-row"><div class="label">${esc(t.time)}</div><div class="time">${esc(ev.time)}</div></div>
                <div class="label venue-label">${esc(t.venue)}</div>
                <div class="venue">${esc(ev.venue)}</div>
                <div class="address">${esc(ev.address)}</div>
                <div class="actions">
                  <a class="btn-dir" href="${esc(ev.dir)}" target="_blank" rel="noopener">${esc(t.directions)}</a>
                  <div class="action-pair">
                    <button class="btn-line" type="button" data-flip="${i}">${esc(t.viewMap)}</button>
                    <a class="btn-line" href="${esc(calUrl(`${T.en.ev[i]} · ${couple}`, ev.dates, ev.loc))}" target="_blank" rel="noopener">${esc(t.calendar)}</a>
                  </div>
                </div>
              </div>
            </div>
            <div class="face back" ${state.flips[i] ? '' : 'aria-hidden="true"'}>
              <div class="back-head">
                <div class="back-venue">${esc(ev.venue)}</div>
                <button class="btn-back" type="button" data-flip="${i}">${esc(t.back)}</button>
              </div>
              <div class="map">${state.flips[i] ? mapFrame(ev) : ''}</div>
              <a class="btn-maps" href="${esc(ev.dir)}" target="_blank" rel="noopener">${esc(t.openMaps)}</a>
            </div>
          </div>
        </div>
      </section>`).join('');
    if (revealReady) $$('[data-reveal]', eventsEl).forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }
  const mapFrame = ev => `<iframe src="${esc(mapEmbed(ev.q))}" loading="lazy" title="${esc(ev.venue)} map" referrerpolicy="no-referrer-when-downgrade"></iframe>`;

  eventsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-flip]'); if (!b) return;
    const i = Number(b.dataset.flip), card = $(`[data-card="${i}"]`, eventsEl);
    state.flips[i] = !state.flips[i];
    card.classList.toggle('flipped', state.flips[i]);
    $('.front', card).toggleAttribute('aria-hidden', state.flips[i]);
    $('.back', card).toggleAttribute('aria-hidden', !state.flips[i]);
    $('.map', card).innerHTML = state.flips[i] ? mapFrame(EVENTS[i]) : '';
  });

  /* ---------- Credits ---------- */
  function renderCredits() {
    $('#credits').innerHTML = L().cr.map(([k, v]) =>
      `<div class="credit" data-reveal><div class="ck">${esc(k)}</div><div class="cv">${esc(v)}</div></div>`).join('');
    if (revealReady) $$('#credits [data-reveal]').forEach(el => { el.style.opacity = 1; el.style.transform = 'none'; });
  }

  /* ---------- RSVP ---------- */
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

  fName.addEventListener('input', () => { state.name = fName.value; });
  fPhone.addEventListener('input', () => { state.phone = fPhone.value; });
  fNote.addEventListener('input', () => { state.note = fNote.value; });
  optsEl.addEventListener('click', e => {
    const b = e.target.closest('[data-attend]'); if (!b || state.sending) return;
    state.attend = Number(b.dataset.attend); renderRsvp();
  });
  guestsDec.addEventListener('click', () => { state.guests = Math.max(1, state.guests - 1); renderRsvp(); });
  guestsInc.addEventListener('click', () => { state.guests = Math.min(15, state.guests + 1); renderRsvp(); });
  $('#editBtn').addEventListener('click', () => {
    const s = state.sent || {};
    Object.assign(state, { name: s.name || '', phone: s.phone || '', attend: s.attend || 0, guests: s.guests || 2, note: s.note || '', sent: null, errors: {}, sendError: '' });
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

  /* ---------- Motion: grain, portrait tilt, carousel, lamp ---------- */
  const grain = $('#grain'), portrait = $('#portrait'), carousel = $('#carousel'), stage = $('#carStage');
  grain.style.backgroundImage = `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='220' height='220'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.8' numOctaves='2' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>")`;
  let rot = 0, vel = 0.12, drag = null, px = 0, py = 0, gf = -1, three = null;
  addEventListener('pointermove', e => { px = (e.clientX / innerWidth) * 2 - 1; py = (e.clientY / innerHeight) * 2 - 1; });
  addEventListener('deviceorientation', e => { if (e.gamma != null) { px = Math.max(-1, Math.min(1, e.gamma / 30)); py = Math.max(-1, Math.min(1, (e.beta - 45) / 30)); } });

  stage.addEventListener('pointerdown', e => { drag = { x: e.clientX, r: rot }; if (stage.setPointerCapture) stage.setPointerCapture(e.pointerId); });
  stage.addEventListener('pointermove', e => { if (!drag) return; const nr = drag.r + (e.clientX - drag.x) * 0.35; vel = nr - rot; rot = nr; });
  const endDrag = () => { drag = null; };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  (function loop() {
    requestAnimationFrame(loop);
    const t = performance.now() / 1000;
    if (!drag) { rot += vel; vel += (0.12 - vel) * 0.02; }
    carousel.style.transform = `translateZ(-230px) rotateY(${rot}deg)`;
    const r = portrait.getBoundingClientRect(), off = (r.top + r.height / 2) / innerHeight - 0.5;
    portrait.style.transform = `rotateY(${px * 10 + Math.sin(t * .6) * 3}deg) rotateX(${-py * 8 + off * 16}deg)`;
    const f = Math.floor(t * 16);
    if (f !== gf) { gf = f; grain.style.backgroundPosition = `${Math.random() * 220}px ${Math.random() * 220}px`; }
    if (three) three(t);
  })();

  async function initThree() {
    let THREE;
    try { THREE = await import('https://unpkg.com/three@0.160.0/build/three.module.js'); } catch (e) { return; }
    const canvas = $('#lamp');
    let renderer;
    try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true }); } catch (e) { return; }
    renderer.setPixelRatio(Math.min(2, devicePixelRatio));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100); camera.position.set(0, 1.35, 8.4); camera.lookAt(0, 1.15, 0);
    const es = new THREE.Scene(); es.background = new THREE.Color(0x140503);
    const panel = (c, x, y, z, s) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.lookAt(0, 0, 0); es.add(m); };
    panel(new THREE.Color(6, 4.4, 2.6), 0, 6, 2, 5); panel(new THREE.Color(3.4, 1.6, .7), -6, 1, 3, 4); panel(new THREE.Color(2.6, 2, 1.5), 5, -1, 4, 3); panel(new THREE.Color(1.2, .3, .2), 0, -5, -4, 6);
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(es, 0.04).texture;
    const brass = new THREE.MeshStandardMaterial({ color: 0xdca94a, metalness: 1, roughness: 0.24 });
    const prof = [[0,0],[1.0,0],[1.02,.06],[.92,.13],[.62,.2],[.4,.3],[.24,.42],[.18,.55],[.26,.62],[.26,.68],[.16,.74],[.12,.95],[.13,1.3],[.2,1.35],[.2,1.4],[.12,1.45],[.11,1.85],[.2,1.9],[.2,1.95],[.12,2.0],[.12,2.12],[.22,2.2],[.5,2.27],[.86,2.33],[.96,2.4],[.94,2.45],[.84,2.44],[.5,2.39],[.2,2.38],[.1,2.44],[.1,2.62],[.18,2.68],[.2,2.76],[.12,2.84],[.06,2.98],[.02,3.1],[0,3.12]]
      .map(([x, y]) => new THREE.Vector2(x * 0.72, y * 0.72));
    const lamp = new THREE.Mesh(new THREE.LatheGeometry(prof, 96), brass);
    const group = new THREE.Group(); group.add(lamp); scene.add(group);
    const gc = document.createElement('canvas'); gc.width = gc.height = 64; const gx = gc.getContext('2d');
    const grd = gx.createRadialGradient(32, 32, 0, 32, 32, 32); grd.addColorStop(0, 'rgba(255,230,160,1)'); grd.addColorStop(.3, 'rgba(255,160,60,.55)'); grd.addColorStop(1, 'rgba(255,120,30,0)'); gx.fillStyle = grd; gx.fillRect(0, 0, 64, 64);
    const glowTex = new THREE.CanvasTexture(gc);
    const flames = [];
    const flameMat = new THREE.MeshBasicMaterial({ color: 0xffd27a });
    for (let i = 0; i < 5; i++) {
      const a = i / 5 * Math.PI * 2, r = 0.62, y = 2.43 * 0.72 + 0.02;
      const f = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), flameMat); f.position.set(Math.cos(a) * r, y + 0.09, Math.sin(a) * r); f.scale.set(1, 2.6, 1);
      const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true }));
      s.position.copy(f.position); s.position.y += 0.04; s.scale.setScalar(0.55);
      group.add(f); group.add(s); flames.push({ f, s, ph: Math.random() * 10 });
    }
    const flameLight = new THREE.PointLight(0xffa850, 6, 6, 1.6); flameLight.position.set(0, 2.1, 0.4); scene.add(flameLight);
    const N = 500, pos = new Float32Array(N * 3), sp = new Float32Array(N);
    for (let i = 0; i < N; i++) { pos[i * 3] = (Math.random() - .5) * 8; pos[i * 3 + 1] = Math.random() * 4 - .6; pos[i * 3 + 2] = (Math.random() - .5) * 4; sp[i] = .1 + Math.random() * .3; }
    const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    scene.add(new THREE.Points(pg, new THREE.PointsMaterial({ color: 0xf1c776, size: 0.03, transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false })));
    const resize = () => { const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); };
    new ResizeObserver(resize).observe(canvas); resize();
    let ry = 0;
    three = t => {
      const sc = Math.min(1, scrollY / innerHeight);
      ry += ((t * 0.25 + px * 0.5) - ry) * 0.05;
      group.rotation.y = ry; group.rotation.x = py * 0.08 + sc * 0.25; group.position.y = Math.sin(t * 0.8) * 0.04 - sc * 0.4;
      flames.forEach(({ f, s, ph }) => { const k = 1 + Math.sin(t * 9 + ph) * .12 + Math.sin(t * 23 + ph) * .06; f.scale.set(1, 2.6 * k, 1); s.scale.setScalar(0.55 * k); });
      flameLight.intensity = 6 + Math.sin(t * 11) * 0.8 + Math.sin(t * 27) * 0.4;
      const a = pg.attributes.position.array;
      for (let i = 0; i < N; i++) { a[i * 3 + 1] += sp[i] * 0.005; if (a[i * 3 + 1] > 3.6) a[i * 3 + 1] = -.6; }
      pg.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };
  }

  /* ---------- Scroll reveal ---------- */
  let revealReady = false;
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { en.target.style.opacity = 1; en.target.style.transform = 'none'; io.unobserve(en.target); }
  }), { threshold: 0.12 });

  applyLang();
  setTimeout(() => {
    $$('[data-reveal]').forEach(el => {
      el.style.opacity = 0; el.style.transform = 'translateY(36px)';
      el.style.transition = 'opacity 1.1s ease, transform 1.1s cubic-bezier(.2,.7,.2,1)';
      io.observe(el);
    });
    revealReady = true;
  }, 60);
  initThree();
})();
