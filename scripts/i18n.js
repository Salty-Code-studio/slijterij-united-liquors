/* ============================================
   i18n — bilingual NL / EN toggle
   Swaps textContent based on data-en / data-nl
   attributes. Persists choice in localStorage.
   ============================================ */

(() => {
  const STORAGE_KEY = 'slu_lang';
  const SUPPORTED = ['en', 'nl'];
  const DEFAULT = (() => {
    // Auto-detect from browser language on first visit, default to EN.
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && SUPPORTED.includes(stored)) return stored;
    const nav = (navigator.language || 'en').toLowerCase();
    return nav.startsWith('nl') ? 'nl' : 'en';
  })();

  function applyLang(lang) {
    if (!SUPPORTED.includes(lang)) lang = 'en';

    // <html lang="…">
    document.documentElement.lang = lang;
    document.body.classList.remove('lang-en', 'lang-nl');
    document.body.classList.add('lang-' + lang);

    // Swap text contents
    document.querySelectorAll('[data-' + lang + ']').forEach((el) => {
      const txt = el.getAttribute('data-' + lang);
      // Use innerHTML when content contains <br> (we authored only safe markup)
      if (el.hasAttribute('data-i18n-html') || /<br\s*\/?>/i.test(txt)) {
        el.innerHTML = txt;
      } else {
        el.textContent = txt;
      }
    });

    // Swap input placeholders for fields that opt in
    document.querySelectorAll('[data-' + lang + '-placeholder]').forEach((el) => {
      el.setAttribute('placeholder', el.getAttribute('data-' + lang + '-placeholder'));
    });

    // Toggle button active state
    document.querySelectorAll('.lang-btn').forEach((btn) => {
      btn.classList.toggle('is-active', btn.dataset.setLang === lang);
    });

    localStorage.setItem(STORAGE_KEY, lang);

    // Notify other modules
    window.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
  }

  // Wire up clicks
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-set-lang]');
    if (btn) {
      applyLang(btn.dataset.setLang);
    }
  });

  // Initial render
  document.addEventListener('DOMContentLoaded', () => applyLang(DEFAULT));

  // Expose so other modules / debugging can use it
  window.SLU_i18n = { applyLang, getLang: () => document.body.classList.contains('lang-nl') ? 'nl' : 'en' };
})();
