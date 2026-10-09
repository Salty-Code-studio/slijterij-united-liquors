/* motion.js — layout helpers: horizontal rails for long grids, and FAQ tabs.
   (Decorative motion was removed on request; it will be added by hand.) */
(() => {
  /* Long grids become one-screen horizontal rails with arrows */
  const railable = document.querySelectorAll('.ck-grid, .mk-grid, .cats');
  railable.forEach((g) => {
    g.classList.add('rail');
    const wrap = document.createElement('div'); wrap.className = 'rail-wrap';
    g.parentNode.insertBefore(wrap, g); wrap.appendChild(g);
    const nav = document.createElement('div'); nav.className = 'rail-nav';
    nav.innerHTML = '<button type="button" class="rail-btn" data-dir="-1" aria-label="Previous">←</button><button type="button" class="rail-btn" data-dir="1" aria-label="Next">→</button>';
    wrap.appendChild(nav);
    const sync = () => {
      const max = g.scrollWidth - g.clientWidth - 2;
      nav.hidden = max <= 0;
      nav.children[0].disabled = g.scrollLeft <= 2;
      nav.children[1].disabled = g.scrollLeft >= max;
    };
    nav.addEventListener('click', (e) => {
      const b = e.target.closest('.rail-btn'); if (!b) return;
      g.scrollBy({ left: +b.dataset.dir * g.clientWidth * 0.9, behavior: 'smooth' });
    });
    g.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync); sync();
  });

  /* FAQ topic tabs + one-open-at-a-time accordion */
  const tabs = document.querySelectorAll('[data-faq-tab]');
  tabs.forEach((t) => t.addEventListener('click', () => {
    tabs.forEach((x) => { const on = x === t; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
    document.querySelectorAll('[data-faq-panel]').forEach((p) => p.classList.toggle('is-active', p.dataset.faqPanel === t.dataset.faqTab));
  }));
  document.querySelectorAll('.faq-group details').forEach((d) => d.addEventListener('toggle', () => {
    if (d.open) d.parentElement.querySelectorAll('details[open]').forEach((o) => { if (o !== d) o.open = false; });
  }));
  // deep link to a topic, e.g. /faq/#faq-delivery
  const h = location.hash.replace('#faq-', '');
  const pre = h && document.querySelector(`[data-faq-tab="${h}"]`); if (pre) pre.click();
})();
