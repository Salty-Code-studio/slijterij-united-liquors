/* cocktails.js — opens the "what you'll need" panel for a cocktail.
   All panel content lives in the HTML (indexable); this only shows the
   right panel inside a <dialog> and keeps the URL hash in sync (#negroni). */
(() => {
  const dialog = document.getElementById('ck-dialog');
  if (!dialog) return;
  const panels = dialog.querySelectorAll('.ck-panel');

  function openCocktail(id, push) {
    const panel = dialog.querySelector(`.ck-panel[data-id="${id}"]`);
    if (!panel) return;
    panels.forEach((p) => p.classList.toggle('is-active', p === panel));
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
    if (push) history.replaceState(null, '', '#' + id);
  }

  function closeCocktail() {
    if (dialog.open) dialog.close();
  }

  // Browse to the previous / next drink without closing
  const order = [...panels].map((p) => p.dataset.id);
  const nav = document.createElement('div'); nav.className = 'ck-dialog__nav';
  nav.innerHTML = '<button type="button" data-ck-step="-1" aria-label="Previous drink">←</button><button type="button" data-ck-step="1" aria-label="Next drink">→</button>';
  dialog.appendChild(nav);
  const step = (d) => {
    const cur = dialog.querySelector('.ck-panel.is-active'); if (!cur) return;
    const i = order.indexOf(cur.dataset.id);
    openCocktail(order[(i + d + order.length) % order.length], true);
  };
  nav.addEventListener('click', (e) => { const b = e.target.closest('[data-ck-step]'); if (b) step(+b.dataset.ckStep); });
  dialog.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });

  dialog.addEventListener('close', () => {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  });

  // Click on the backdrop (outside the dialog box) closes it
  dialog.addEventListener('click', (e) => { if (e.target === dialog) closeCocktail(); });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('[data-cocktail]');
    if (card) { e.preventDefault(); openCocktail(card.dataset.cocktail, true); }
    if (e.target.closest('[data-ck-close]')) closeCocktail();
  });

  // Deep link: /cocktails/#negroni
  const fromHash = () => { const id = location.hash.slice(1); if (id) openCocktail(id, false); };
  window.addEventListener('hashchange', fromHash);
  document.addEventListener('DOMContentLoaded', fromHash);
})();

/* "Come and get them": turn the same dialog box into a map + shop info */
(() => {
  const dialog = document.getElementById('ck-dialog');
  if (!dialog) return;
  const WA = 'https://wa.me/31651240045?text=';
  const DIR = 'https://www.google.com/maps/dir/?api=1&origin=Amsterdam+Centraal&destination=Slijterij+United+Liquors,+Hekelveld+4,+1012+SN+Amsterdam&travelmode=walking';
  const EMBED = 'https://maps.google.com/maps?q=Slijterij+United+Liquors,+Hekelveld+4,+1012+SN+Amsterdam&z=16&output=embed';
  const nl = () => document.documentElement.lang === 'nl';
  const openNow = () => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
    const h = now.getHours() + now.getMinutes() / 60;
    return h >= 11 && h < 22;
  };
  let view = null;
  function show(drink) {
    const o = openNow(), n = nl();
    const status = o ? (n ? 'Nu open · tot 22:00' : 'Open now · until 22:00') : (n ? 'Gesloten · open om 11:00' : 'Closed · opens 11:00');
    const ask = encodeURIComponent((n ? `Hoi! Kunnen jullie de flessen voor een ${drink} apart zetten? Ik kom ze ophalen.` : `Hi! Could you put the bottles for a ${drink} aside? I'll come and pick them up.`));
    view = view || Object.assign(document.createElement('div'), { className: 'ck-visit' });
    view.innerHTML = `
      <div class="ck-visit__map"><iframe src="${EMBED}" title="Map: Slijterij United Liquors, Hekelveld 4" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="ck-visit__info">
        <p class="eyebrow">${n ? 'Kom ze halen' : 'Come and get them'}</p>
        <h2 class="display">Hekelveld 4</h2>
        <p class="ck-visit__status"><span class="open-dot${o ? '' : ' is-closed'}"></span>${status}</p>
        <ul class="ck-visit__facts">
          <li><strong>${n ? 'Adres' : 'Address'}</strong><span>Hekelveld 4, 1012 SN Amsterdam</span></li>
          <li><strong>${n ? 'Open' : 'Hours'}</strong><span>${n ? 'Elke dag 11:00 – 22:00' : 'Every day 11:00 – 22:00'}</span></li>
          <li><strong>${n ? 'Route' : 'Getting here'}</strong><span>${n ? '2 minuten lopen van Amsterdam Centraal (uitgang Westzijde)' : '2 minutes’ walk from Amsterdam Centraal (Westside exit)'}</span></li>
        </ul>
        <div class="ck-visit__cta">
          <a class="btn btn--solid ck-visit__dir" href="${DIR}" target="_blank" rel="noopener">${n ? 'Route in Google Maps' : 'Directions in Google Maps'} ↗</a>
          <a class="btn btn--solid" href="${WA}${ask}" target="_blank" rel="noopener">${n ? 'Laat ze apart zetten' : 'Ask us to put them aside'}</a>
          <button class="ck-visit__back" type="button" data-ck-back>← ${n ? 'Terug naar' : 'Back to'} ${drink}</button>
        </div>
      </div>`;
    dialog.querySelector('.ck-dialog__body').appendChild(view);
    dialog.classList.add('is-visit');
  }
  function hide() { dialog.classList.remove('is-visit'); }
  dialog.addEventListener('click', (e) => {
    const go = e.target.closest('.ck-panel__cta a[href="/slijterij-united-liquors/visit/"]');
    if (go) {
      e.preventDefault();
      const p = go.closest('.ck-panel'); const name = p ? (p.querySelector('h2')?.textContent || '').trim() : '';
      show(name || (nl() ? 'je drankje' : 'your drink'));
    }
    if (e.target.closest('[data-ck-back]')) hide();
  });
  dialog.addEventListener('close', hide);
  // browsing to another drink also returns to the drink view
  dialog.addEventListener('click', (e) => { if (e.target.closest('[data-ck-step]')) hide(); });
})();
