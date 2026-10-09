/* ============================================
   AGE GATE — 18+ verification modal
   Shown on first visit only. Choice stored in
   localStorage so returning visitors skip it.
   ============================================ */

(() => {
  const STORAGE_KEY = 'slu_age_confirmed';
  const gate = document.getElementById('age-gate');
  if (!gate) return;

  const yesBtn = document.getElementById('age-yes');
  const noBtn  = document.getElementById('age-no');

  function open() {
    gate.hidden = false;
    gate.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    // Force reflow before adding class so transition fires
    requestAnimationFrame(() => gate.classList.add('is-open'));
    // Focus the primary action for keyboard users
    setTimeout(() => yesBtn && yesBtn.focus(), 50);
  }

  function close(confirmed) {
    gate.classList.remove('is-open');
    setTimeout(() => {
      gate.hidden = true;
      gate.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }, 320);
    if (confirmed) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ confirmed: true, ts: Date.now() }));
      } catch (e) { /* private mode */ }
    }
  }

  function decline() {
    // Soft decline: redirect to a neutral page. We don't have one yet,
    // so we hide the entire site and show a static message in place.
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 18px;
        text-align: center;
        padding: 40px;
        background: #0E0B08;
        color: #fff;
        font-family: -apple-system, system-ui, sans-serif;
      ">
        <div style="font-family: monospace; font-size: 11px; letter-spacing: .25em; text-transform: uppercase; color: #FD5A02;">18+ ONLY</div>
        <h1 style="font-weight: 900; font-size: 36px; line-height: 1; max-width: 460px;">
          Come back when you're 18 or older.
        </h1>
        <p style="opacity: 0.7; max-width: 380px;">Onze website verkoopt alcoholische dranken. Drink responsibly — kom terug als je 18 of ouder bent.</p>
      </div>
    `;
  }

  // Check if already confirmed
  let confirmed = false;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      confirmed = data && data.confirmed === true;
    }
  } catch (e) { /* parse error or private mode */ }

  if (!confirmed) {
    // Open on next tick so initial paint completes first
    requestAnimationFrame(open);
  }

  yesBtn && yesBtn.addEventListener('click', () => close(true));
  noBtn  && noBtn.addEventListener('click', decline);

  // ESC does NOT close — this is a hard gate. Tab cycles within.
})();
