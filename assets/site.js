/* thomaskstrider.com. One small script for every page.
   Each page is written in its finished state, so it reads the same with this file off.
   Motion runs only when <html> carries the class "motion": the page sets it unless the visitor asked for
   less motion or the address ends in ?static=1. Only transform and opacity ever animate. */
(() => {
  const d = document, root = d.documentElement;
  const motion = root.classList.contains('motion');
  const phone = window.matchMedia('(max-width: 699px)');

  /* ── Contact: the email address is put together here, so a simple scraper cannot lift it from the page. ── */
  const mail = d.getElementById('mail');
  if (mail) mail.href = 'mailto:' + mail.dataset.a + '@' + mail.dataset.b + '.' + mail.dataset.c;

  /* ── Sections rise into view, once. Only what starts below the screen is held back. ── */
  if (motion && 'IntersectionObserver' in window) {
    const seen = new IntersectionObserver(entries => {
      for (const en of entries) if (en.isIntersecting) { en.target.classList.remove('is-waiting'); seen.unobserve(en.target); }
    }, { rootMargin: '0px 0px -8% 0px' });
    const first = new IntersectionObserver(entries => {
      for (const en of entries) {
        first.unobserve(en.target);
        if (!en.isIntersecting && en.boundingClientRect.top > 0) { en.target.classList.add('is-waiting'); seen.observe(en.target); }
      }
    });
    d.querySelectorAll('.rise').forEach(el => first.observe(el));
  }

  /* ── In progress: the section is built only when all four of its pictures load. ── */
  const slot = d.getElementById('progress-data'), about = d.getElementById('contact');   // the shelf goes in just above the contact block
  if (slot && about) {
    let data = null;
    try { data = JSON.parse(slot.textContent); } catch (e) { data = null; }
    const list = data && Array.isArray(data.builds) ? data.builds : [];
    if (list.length === 4 && list.every(b => b && b.name && b.line && b.image)) {
      Promise.all(list.map(b => new Promise((ok, no) => { const im = new Image(); im.onload = () => ok(im); im.onerror = no; im.src = b.image; })))
        .then(() => {
          const el = (tag, cls, text) => { const n = d.createElement(tag); if (cls) n.className = cls; if (text) n.textContent = text; return n; };
          const sec = el('section', 'progress'); sec.id = 'progress';
          const inner = el('div', 'progress-in');
          // A heading is its real words beside its letters drawn as artwork (build/letters.py makes the artwork).
          const lettered = (tag, cls, words, art) => {
            const n = el(tag, cls);
            if (!art) { n.textContent = words; return n; }
            const w = el('span', 'sr', words), a = el('span', 'art'); a.setAttribute('aria-hidden', 'true'); a.innerHTML = art;
            n.append(w, a); return n;
          };
          const h = lettered('h2', 'head', data.headline, data.headlineArt); h.id = 'progress-h'; sec.setAttribute('aria-labelledby', 'progress-h');
          const row = el('div', 'hung');
          for (const b of list) {
            const fig = el('figure', 'hang');
            const im = d.createElement('img'); im.src = b.image; im.alt = b.name; im.loading = 'lazy'; im.decoding = 'async';
            fig.append(im, lettered('h3', 'hang-name', b.name, b.nameArt));
            if (b.kind) fig.append(el('p', 'kind', b.kind));
            fig.append(el('p', 'hang-line', b.line));
            row.append(fig);
          }
          inner.append(h, row); sec.append(inner);
          about.parentNode.insertBefore(sec, about);
        })
        .catch(() => {});   // a picture is missing: the section stays off the page
    }
  }

  /* ── The builds ── */
  const stage = d.getElementById('builds'), lineup = d.getElementById('lineup');
  if (!stage || !lineup) return;
  const wins = [...lineup.querySelectorAll('.win')];
  const dots = [...d.querySelectorAll('#dots .dot')];
  const n = wins.length, half = 2;
  // The ring: left to right as the builds stand at rest, with the one on stage in the middle.
  const ring = wins.slice().sort((a, b) => Number(a.dataset.pos) - Number(b.dataset.pos));
  let on = ring.find(w => w.dataset.pos === '0') || ring[0];

  // Where each window sits in the phone row. Measured when the row changes size, never inside a click.
  let lefts = new Map();
  const measure = () => { lefts = new Map(ring.map(w => [w, w.offsetLeft - (lineup.clientWidth - w.offsetWidth) / 2])); };
  const slide = (win, smooth) => { if (lefts.has(win)) lineup.scrollTo({ left: lefts.get(win), behavior: smooth && motion ? 'smooth' : 'instant' }); };

  function bring(win) {
    if (win === on) return;
    const at = ring.indexOf(win);
    ring.forEach((w, i) => {
      let p = i - at;
      if (p > n / 2) p -= n;
      if (p < -n / 2) p += n;
      const next = Math.abs(p) > half ? 'off' : String(p), was = Number(w.dataset.pos);
      // A window that would cross the whole stage goes round the back instead.
      if (motion && !phone.matches && Number.isFinite(was) && next !== 'off' && Math.abs(p - was) > half) {
        w.classList.add('is-wrap');
        setTimeout(() => w.classList.remove('is-wrap'), 480);
      }
      w.dataset.pos = next;
    });
    on = win;
    stage.dataset.on = win.dataset.build;
    dots.forEach(dot => dot.setAttribute('aria-pressed', String(dot.dataset.build === win.dataset.build)));
  }

  // It plays once: each build steps forward in turn, and it ends where it began.
  let timer = 0, steps = 0;
  const stop = () => { clearTimeout(timer); timer = 0; steps = n; };
  const step = () => {
    if (steps >= n) return;
    steps++;
    const next = ring[(ring.indexOf(on) + 1) % n];
    if (phone.matches) slide(next, true); else bring(next);
    timer = setTimeout(step, 2600);
  };

  // A click on a window behind brings it forward. On a phone the row is swiped instead.
  lineup.addEventListener('click', e => {
    if (phone.matches) return;
    const box = e.target.closest('.win-box');
    if (!box) return;
    stop();
    bring(box.parentNode);
  });
  dots.forEach(dot => dot.addEventListener('click', () => {
    stop();
    const win = wins.find(w => w.dataset.build === dot.dataset.build);
    if (!win) return;
    if (phone.matches) slide(win, true); else bring(win);
  }));
  ['pointerdown', 'touchstart', 'wheel', 'keydown'].forEach(type => lineup.addEventListener(type, stop, { passive: true }));

  // The phone row opens on the build on stage, and stays on it when the row changes size.
  const settle = () => { measure(); if (phone.matches) slide(on, false); };
  settle();
  if ('ResizeObserver' in window) new ResizeObserver(settle).observe(lineup);

  if ('IntersectionObserver' in window) {
    // Phone: the window swiped to the middle is the one on stage.
    const mid = new IntersectionObserver(entries => {
      if (!phone.matches) return;
      for (const en of entries) if (en.isIntersecting) bring(en.target);
    }, { root: lineup, rootMargin: '0px -45% 0px -45%', threshold: 0 });
    wins.forEach(w => mid.observe(w));

    // The windows' pictures load just before the section arrives. A browser's own lazy loading waits too
    // long for pictures that sit off to the side of a row.
    const near = new IntersectionObserver(entries => {
      if (!entries.some(en => en.isIntersecting)) return;
      near.disconnect();
      lineup.querySelectorAll('img[loading="lazy"]').forEach(im => { im.loading = 'eager'; });
    }, { rootMargin: '45% 0px' });
    near.observe(stage);

    // The section plays when most of it is on the screen.
    if (motion) {
      const play = new IntersectionObserver(entries => {
        if (!entries.some(en => en.isIntersecting)) return;
        play.disconnect();
        timer = setTimeout(step, 1400);
      }, { threshold: 0.55 });
      play.observe(lineup);
    }
  }
})();
