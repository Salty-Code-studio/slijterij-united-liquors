/* wall.js — "Shop the wall": tap a shelf to open that category's popup. */
(() => {
  const dlg = document.getElementById('wall-dialog');
  if (!dlg) return;
  const panels = [...dlg.querySelectorAll('.wall-panel')];
  const order = panels.map((p) => p.dataset.id);
  const show = (id) => {
    panels.forEach((p) => p.classList.toggle('is-active', p.dataset.id === id));
    if (!dlg.open) dlg.showModal();
  };
  const nav = document.createElement('div'); nav.className = 'ck-dialog__nav';
  nav.innerHTML = '<button type="button" data-step="-1" aria-label="Previous shelf">←</button><button type="button" data-step="1" aria-label="Next shelf">→</button>';
  dlg.appendChild(nav);
  const step = (d) => { const cur = dlg.querySelector('.wall-panel.is-active'); const i = order.indexOf(cur.dataset.id); show(order[(i + d + order.length) % order.length]); };
  nav.addEventListener('click', (e) => { const b = e.target.closest('[data-step]'); if (b) step(+b.dataset.step); });
  dlg.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight') step(1); if (e.key === 'ArrowLeft') step(-1); });
  dlg.addEventListener('click', (e) => { if (e.target === dlg || e.target.closest('[data-wall-close]')) dlg.close(); });
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-wall]'); if (b) { e.preventDefault(); show(b.dataset.wall); } });
  // pause smooth scrolling while open
  new MutationObserver(() => { const l = window.__lenis; if (l) dlg.open ? l.stop() : l.start(); }).observe(dlg, { attributes: true, attributeFilter: ['open'] });
})();
