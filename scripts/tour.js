/* tour.js
   ─────────
   Lazy-load Pannellum (360° viewer) on first user interaction with the
   tour section. Keeps the page light: ~140KB of JS + CSS only loads when
   someone actually wants to look around. */
(function () {
  const PANNELLUM_VERSION = '2.5.6';
  const CDN = `https://cdn.jsdelivr.net/npm/pannellum@${PANNELLUM_VERSION}/build`;
  const PANO_SRC = '/slijterij-united-liquors/assets/tour/interior-360.jpg';

  const wrap = document.getElementById('tour');
  const startBtn = document.getElementById('tour-start');
  const viewerEl = document.getElementById('tour-viewer');
  if (!wrap || !startBtn || !viewerEl) return;

  let loading = false;
  let booted = false;

  function loadAsset(tag, attrs) {
    return new Promise((resolve, reject) => {
      const el = document.createElement(tag);
      Object.assign(el, attrs);
      el.onload = resolve;
      el.onerror = reject;
      document.head.appendChild(el);
    });
  }

  async function bootTour() {
    if (booted || loading) return;
    loading = true;
    wrap.classList.add('is-loading');

    try {
      await Promise.all([
        loadAsset('link', { rel: 'stylesheet', href: `${CDN}/pannellum.css` }),
        loadAsset('script', { src: `${CDN}/pannellum.js` }),
      ]);

      const MIN_HFOV = 50;
      const MAX_HFOV = 120; // "fully zoomed out"

      const viewer = window.pannellum.viewer('tour-viewer', {
        type: 'equirectangular',
        panorama: PANO_SRC,
        autoLoad: true,
        showControls: true,
        showFullscreenCtrl: true,
        showZoomCtrl: true,
        compass: false,
        autoRotate: -2,
        autoRotateInactivityDelay: 4000,
        hfov: 100,
        minHfov: MIN_HFOV,
        maxHfov: MAX_HFOV,
        pitch: -2,
        yaw: 0,
        friction: 0.18,
        // We take over the wheel so the page can keep scrolling once the
        // panorama is fully zoomed out (see the handler below).
        mouseZoom: false,
      });

      // Wheel → zoom the panorama; but when it's already fully zoomed out,
      // let the scroll fall through to the page instead of trapping it.
      viewerEl.addEventListener('wheel', (e) => {
        const hfov = viewer.getHfov();
        const target = hfov + e.deltaY * 0.06; // down = zoom out, up = zoom in

        if (target < hfov) {
          // Zooming in — always intercept.
          viewer.setHfov(Math.max(MIN_HFOV, target), 0);
          e.preventDefault();
        } else if (hfov < MAX_HFOV - 0.5) {
          // Zooming out, but not fully out yet — consume this step.
          viewer.setHfov(Math.min(MAX_HFOV, target), 0);
          e.preventDefault();
        }
        // else: already fully zoomed out → do nothing, page scrolls normally.
      }, { passive: false });

      wrap.classList.remove('is-idle', 'is-loading');
      wrap.classList.add('is-live');
      viewerEl.setAttribute('aria-hidden', 'false');
      booted = true;
    } catch (err) {
      console.error('Pannellum failed to load', err);
      wrap.classList.remove('is-loading');
    }
  }

  // Start (or resume) the tour
  startBtn.addEventListener('click', () => {
    if (booted) { wrap.classList.add('is-live'); viewerEl.setAttribute('aria-hidden', 'false'); }
    else bootTour();
  });
  // Exit button (optional) returns to the poster
  document.querySelectorAll('[data-tour-exit]').forEach((b) => b.addEventListener('click', () => { wrap.classList.remove('is-live'); viewerEl.setAttribute('aria-hidden', 'true'); }));
  // Scroll away and back: return to the "Look inside" card
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (!en.isIntersecting && wrap.classList.contains('is-live')) { wrap.classList.remove('is-live'); viewerEl.setAttribute('aria-hidden', 'true'); } });
    }, { threshold: 0 }).observe(wrap);
  }
})();
