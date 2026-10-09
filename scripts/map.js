/* map.js
   ───────
   Delivery-radius map for the Delivery section. Renders a real
   OpenStreetMap (no API key) of the shop's surroundings, desaturated to
   match the brand business-card map, with an orange delivery-radius circle
   and a pin on the shop. Non-interactive — it's a schematic illustration. */
(function () {
  const SHOP = [52.3778102, 4.8955388]; // Hekelveld 4, Amsterdam
  const RADIUS_M = 1400;                 // approx central-Amsterdam delivery reach

  function init() {
    const el = document.getElementById('delivery-map');
    if (!el || typeof L === 'undefined') return;

    const map = L.map(el, {
      center: SHOP,
      zoom: 14,
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      tap: false,
      touchZoom: false,
    });

    map.attributionControl.setPrefix(false);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap',
    }).addTo(map);

    // Delivery radius
    L.circle(SHOP, {
      radius: RADIUS_M,
      color: '#D6B36E',
      weight: 2,
      dashArray: '6 5',
      fillColor: '#D6B36E',
      fillOpacity: 0.10,
    }).addTo(map);

    // Shop pin — orange dot with white ring (matches the brand card)
    L.marker(SHOP, {
      interactive: false,
      icon: L.divIcon({
        className: 'delivery-pin',
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      }),
    }).addTo(map);

    // Fit the circle nicely in the frame, then lock.
    map.fitBounds(L.latLng(SHOP).toBounds(RADIUS_M * 2.4), { padding: [4, 4] });
    setTimeout(() => map.invalidateSize(), 200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

/* Visit map: walking route from Amsterdam Centraal to the shop (approximate). */
(function () {
  const SHOP = [52.3778102, 4.8955388];
  const CS = [52.37905, 4.89995];
  function init() {
    const el = document.getElementById('visit-map');
    if (!el || typeof L === 'undefined') return;
    const map = L.map(el, { zoomControl: false, scrollWheelZoom: false, dragging: !L.Browser.mobile, tap: false });
    map.attributionControl.setPrefix(false);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© OpenStreetMap' }).addTo(map);
    const route = [CS, [52.37895, 4.8985], [52.37862, 4.89705], [52.3782, 4.8962], SHOP];
    L.polyline(route, { color: '#B06A22', weight: 5, opacity: .9, dashArray: '2 10', lineCap: 'round' }).addTo(map);
    const pin = (ll, label, cls) => L.marker(ll, { interactive: false, icon: L.divIcon({ className: 'map-pin ' + cls, html: '<i></i><span>' + label + '</span>', iconSize: [0, 0] }) }).addTo(map);
    pin(CS, 'Amsterdam Centraal', 'map-pin--cs');
    pin(SHOP, '★ United Liquors', 'map-pin--shop');
    map.fitBounds(L.latLngBounds(route), { padding: [90, 90] }); map.setZoom(Math.min(map.getZoom(), 16));
    setTimeout(() => map.invalidateSize(), 250);
    // Click (not drag) anywhere on the map → walking directions in Google Maps
    const GMAPS = 'https://www.google.com/maps/dir/?api=1&origin=Amsterdam+Centraal&destination=Slijterij+United+Liquors,+Hekelveld+4,+1012+SN+Amsterdam&travelmode=walking';
    map.on('click', () => window.open(GMAPS, '_blank', 'noopener'));
    el.classList.add('is-linked');
    const a = document.createElement('a');
    a.className = 'map-open'; a.href = GMAPS; a.target = '_blank'; a.rel = 'noopener';
    const nl = document.documentElement.lang === 'nl';
    a.innerHTML = '<span data-en="Open in Google Maps" data-nl="Open in Google Maps">Open in Google Maps</span> ↗';
    el.appendChild(a);
    L.DomEvent.disableClickPropagation(a);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
