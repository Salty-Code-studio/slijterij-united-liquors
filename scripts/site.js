/* site.js — shared behaviour for every page:
   header state, mobile menu, reveal-on-scroll, open/closed status,
   and review/cocktail rows. */
(() => {
  document.documentElement.classList.add('js');

  /* Header gets a glass background once the page scrolls */
  const hdr = document.querySelector('.hdr');
  const onScroll = () => hdr && hdr.classList.toggle('is-scrolled', window.scrollY > 24);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* Mobile menu */
  const menu = document.getElementById('menu');
  document.addEventListener('click', (e) => {
    if (!menu) return;
    if (e.target.closest('[data-menu-open]')) { menu.classList.add('is-open'); document.body.style.overflow = 'hidden'; }
    else if (e.target.closest('[data-menu-close]') || (menu.classList.contains('is-open') && e.target.closest('#menu a'))) {
      menu.classList.remove('is-open'); document.body.style.overflow = '';
    }
  });

  /* Reveal on scroll — content is visible without JS (the .js class gates the hidden state) */
  const items = document.querySelectorAll('.rv');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    items.forEach((el) => io.observe(el));
    // Safety net: never leave content hidden
    setTimeout(() => items.forEach((el) => el.classList.add('is-in')), 2500);
  } else {
    items.forEach((el) => el.classList.add('is-in'));
  }

  /* Open now / closed — daily 11:00–22:00 Amsterdam time */
  function renderOpen() {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const h = now.getHours() + now.getMinutes() / 60;
    const open = h >= 11 && h < 22;
    const nl = document.documentElement.lang === 'nl';
    document.querySelectorAll('[data-open-status]').forEach((el) => {
      el.innerHTML = `<span class="open-dot${open ? '' : ' is-closed'}"></span>` +
        (open ? (nl ? 'Nu open · tot 22:00' : 'Open now · until 22:00')
              : (nl ? 'Gesloten · open om 11:00' : 'Closed · opens 11:00'));
    });
  }
  document.addEventListener('DOMContentLoaded', renderOpen);
  window.addEventListener('langchange', renderOpen);

  /* Footer year */
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });

})();

/* Review row arrows */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-rev]'); if (!b) return;
  const row = document.querySelector('.rev-row'); if (!row) return;
  row.scrollBy({ left: (b.dataset.rev === 'next' ? 1 : -1) * Math.min(360, row.clientWidth * .9), behavior: 'smooth' });
});

/* Review marquee: drifts on its own, pauses on hover/touch so people can scroll by hand. */
(() => {
  const wrap = document.querySelector('[data-marquee]');
  if (!wrap) return;
  const row = wrap.querySelector('.rev-row');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Duplicate cards once so the loop is seamless
  [...row.children].forEach((c) => { const k = c.cloneNode(true); k.setAttribute('aria-hidden', 'true'); row.appendChild(k); });
  let paused = reduce, last = 0, pos = 0;
  const half = () => row.scrollWidth / 2;
  const pause = () => { paused = true; };
  const resume = () => { if (!reduce) { paused = false; pos = row.scrollLeft; } };
  wrap.addEventListener('pointerenter', pause);
  wrap.addEventListener('pointerleave', resume);
  wrap.addEventListener('touchstart', pause, { passive: true });
  wrap.addEventListener('touchend', () => setTimeout(resume, 2500), { passive: true });
  wrap.addEventListener('focusin', pause);
  wrap.addEventListener('focusout', resume);
  function tick(t) {
    const dt = last ? Math.min(t - last, 120) : 16; last = t;
    if (!paused && !document.hidden) {
      pos += dt * 0.035; // ~35px per second
      if (pos >= half()) pos -= half();
      row.scrollLeft = pos;
    } else if (row.scrollLeft >= half()) { row.scrollLeft -= half(); }
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
  window.addEventListener('langchange', () => {
    // keep clones in sync with the chosen language
    const cards = [...row.children]; const n = cards.length / 2;
    for (let i = 0; i < n; i++) cards[n + i].innerHTML = cards[i].innerHTML;
  });
})();

/* Cocktail row arrows */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ck-scroll]'); if (!b) return;
  const row = document.querySelector('[data-ck-row]'); if (!row) return;
  const card = row.querySelector('.ck'); const step = card ? card.getBoundingClientRect().width + 16 : 260;
  row.scrollBy({ left: (b.dataset.ckScroll === 'next' ? 1 : -1) * step * 2, behavior: 'smooth' });
});

/* Drinks switch: Cocktails / Mixed drinks / Mocktails in one row */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ck-kind]'); if (!b) return;
  const sw = b.parentElement;
  sw.querySelectorAll('[data-ck-kind]').forEach((x) => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
  const scope = b.closest('section') || document;
  const row = scope.querySelector('[data-ck-row]'); if (!row) return;
  row.querySelectorAll('[data-kind]').forEach((c) => { c.hidden = c.dataset.kind !== b.dataset.ckKind; });
  row.scrollLeft = 0;
  row.dispatchEvent(new Event('scroll'));
});
/* Swap the drinks heading + intro to match the chosen tab */
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-ck-kind]'); if (!b) return;
  (b.closest('section') || document).querySelectorAll('[data-copy]').forEach((c) => { c.hidden = c.dataset.copy !== b.dataset.ckKind; });
});
/* Homepage FAQ: one answer open at a time */
document.querySelectorAll('.home-faq__list details').forEach((d) => d.addEventListener('toggle', () => {
  if (d.open) d.parentElement.querySelectorAll('details[open]').forEach((o) => { if (o !== d) o.open = false; });
}));

/* Hero: keep the neon glow lined up with the real shop sign in the photo (object-fit: cover math) */
(() => {
  const box = document.querySelector('[data-neon]'); if (!box) return;
  const img = box.querySelector('img');
  // positions in the 1672×941 source photo
  const SIGN = { text: [877, 133, 780, 64] }; // in the 1352px-wide hero photo
  const place = () => {
    const W = img.naturalWidth || 1352, H = img.naturalHeight || 941;
    const bw = box.clientWidth, bh = box.clientHeight;
    const s = Math.max(bw / W, bh / H);
    const ox = (bw - W * s) * 0.70, oy = (bh - H * s) * 0.30; // matches object-position: 70% 30%
    const k = W / 1352;
    const set = (el, x, y, w, h) => { el.style.left = (ox + x * k * s) + 'px'; el.style.top = (oy + y * k * s) + 'px'; el.style.width = (w * k * s) + 'px'; el.style.height = (h * k * s) + 'px'; };
    set(box.querySelector('.neon--text'), SIGN.text[0], SIGN.text[1], SIGN.text[2], SIGN.text[3]);
  };
  if (img.complete) place(); else img.addEventListener('load', place);
  addEventListener('resize', place);
})();

/* /cocktails/#mocktails opens straight on the Mocktails tab */
document.addEventListener('DOMContentLoaded', () => {
  if (location.hash === '#mocktails') { const t = document.querySelector('#mocktails [data-ck-kind="mocktail"]'); if (t) t.click(); }
});
/* Big faint word behind the drinks grid follows the chosen tab (and language) */
(() => {
  const set = () => {
    const w = document.querySelector('[data-bigword]'); if (!w) return;
    const active = w.closest('section').querySelector('[data-ck-kind].is-active');
    if (active) w.textContent = active.textContent.trim();
  };
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ck-kind]')) setTimeout(set, 0); });
  window.addEventListener('langchange', () => setTimeout(set, 0));
  document.addEventListener('DOMContentLoaded', set);
})();
/* Fit the big word to the full page width (edge to edge), for every tab/language */
(() => {
  const fit = () => {
    const w = document.querySelector('[data-bigword]'); if (!w) return;
    const sec = w.closest('section');
    w.style.fontSize = '100px';
    const target = document.documentElement.clientWidth * 0.98;
    const size = 100 * target / w.scrollWidth;
    w.style.fontSize = size + 'px';
    sec.style.setProperty('--bw', size + 'px');
  };
  document.addEventListener('DOMContentLoaded', () => { (document.fonts ? document.fonts.ready : Promise.resolve()).then(fit); });
  window.addEventListener('resize', fit);
  document.addEventListener('click', (e) => { if (e.target.closest('[data-ck-kind]')) setTimeout(fit, 10); });
  window.addEventListener('langchange', () => setTimeout(fit, 10));
})();

/* Collection: the category bar works as tabs, one group visible at a time */
(() => {
  const links = [...document.querySelectorAll('[data-jump]')]; if (!links.length) return;
  const groups = links.map((a) => document.getElementById(a.dataset.jump)).filter(Boolean);
  const bar = document.querySelector('.cat-jump');
  const show = (id, scroll) => {
    links.forEach((a) => { const on = a.dataset.jump === id; a.classList.toggle('is-active', on); a.setAttribute('aria-selected', on); });
    groups.forEach((g) => { g.hidden = g.id !== id; if (!g.hidden) g.querySelectorAll('.rv').forEach((el) => el.classList.add('is-in')); });
    if (scroll && bar) { const top = bar.getBoundingClientRect().top + scrollY - 113; if (scrollY > top) scrollTo({ top, behavior: 'smooth' }); }
  };
  links.forEach((a) => { a.setAttribute('role', 'tab'); a.addEventListener('click', (e) => {
    e.preventDefault(); show(a.dataset.jump, true); history.replaceState(null, '', '#' + a.dataset.jump);
  }); });
  const fromHash = () => {
    const t = location.hash && document.getElementById(location.hash.slice(1));
    const g = t && groups.find((x) => x === t || x.contains(t));
    show(g ? g.id : groups[0].id, false);
    if (t && g && t !== g) setTimeout(() => t.scrollIntoView({ block: 'center' }), 60);
  };
  fromHash(); window.addEventListener('hashchange', fromHash);
})();

/* Reviews: drag with the mouse, or swipe/scroll sideways, while hovering */
(() => {
  const wrap = document.querySelector('[data-marquee]'); if (!wrap) return;
  const row = wrap.querySelector('.rev-row');
  const half = () => row.scrollWidth / 2;
  const wrapAround = () => { if (row.scrollLeft <= 0) row.scrollLeft += half(); else if (row.scrollLeft >= half()) row.scrollLeft -= half(); };
  row.addEventListener('scroll', wrapAround, { passive: true });
  let down = false, startX = 0, startL = 0, moved = false;
  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return;
    down = true; moved = false; startX = e.clientX; startL = row.scrollLeft;
    row.classList.add('is-dragging');
  });
  window.addEventListener('pointermove', (e) => {
    if (!down) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 3) moved = true;
    row.scrollLeft = startL - dx; e.preventDefault();
  });
  window.addEventListener('pointerup', () => { if (!down) return; down = false; row.classList.remove('is-dragging'); });
  row.addEventListener('click', (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
  row.addEventListener('dragstart', (e) => e.preventDefault());
})();

/* Home hero: place the text inside the shop's archway (maps photo pixels through object-fit: cover) */
(() => {
  const hero = document.querySelector('[data-arch]'); if (!hero) return;
  const img = hero.querySelector('.hero-sun__bg img'), box = hero.querySelector('.hero-arch__text');
  const ARCH = { x: 64, y: 140, w: 768, h: 760 }; // text area centred on the archway in the 1672×941 photo
  const POS = { x: 0, y: 0 };                      // matches object-position below (top, so the sign stays visible)
  const place = () => {
    if (innerWidth < 980) { box.removeAttribute('style'); hero.classList.remove('is-arched'); return; }
    const W = img.naturalWidth || 1672, H = img.naturalHeight || 941;
    const bg = img.getBoundingClientRect(), hr = hero.getBoundingClientRect();
    const s = Math.max(bg.width / W, bg.height / H);
    const ox = bg.left - hr.left + (bg.width - W * s) * POS.x, oy = bg.top - hr.top + (bg.height - H * s) * POS.y;
    const top = Math.max(oy + ARCH.y * s, bg.top - hr.top + 12);
    const bottom = Math.min(oy + (ARCH.y + ARCH.h) * s, hr.height - 16, innerHeight - hr.top - scrollY - 16); // stay inside the hero and the first screen
    box.style.left = (ox + ARCH.x * s) + 'px'; box.style.top = top + 'px';
    box.style.width = (ARCH.w * s) + 'px'; box.style.height = Math.max(bottom - top, 0) + 'px';
    hero.classList.add('is-arched');
  };
  if (img.complete) place(); else img.addEventListener('load', place);
  addEventListener('resize', place);
})();

/* Home hero: short walk-in video (street -> sign -> door -> inside) that settles on the storefront photo.
   Desktop only, skipped for reduced motion; plays once, then fades to the still. */
(() => {
  const v = document.querySelector('.hero-walkin'); if (!v) return;
  if (innerWidth < 980 || matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator.connection && navigator.connection.saveData)) { v.remove(); return; }
  v.src = v.dataset.src;
  v.addEventListener('canplay', () => v.classList.add('is-on'), { once: true });
  v.addEventListener('ended', () => { v.classList.add('is-done'); setTimeout(() => v.remove(), 900); });
  v.muted = true; v.autoplay = true;
  const go = () => { const p = v.play(); if (p && p.catch) p.catch((e) => { window.__walkinErr = e && e.name; }); };
  go(); v.addEventListener('canplay', go, { once: true });
})();
