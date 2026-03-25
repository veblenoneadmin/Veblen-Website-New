/* ============================================
   MOBILE OVERRIDES (≤ 900px)
   — Lighter assets, fewer frames, simpler animations
   — Changes here do NOT affect desktop
   ============================================ */
(function () {
  var isMobile = window.innerWidth <= 900;
  if (!isMobile) return; // Desktop — skip everything

  // Disable Lenis on mobile — use native scroll
  if (typeof lenis !== 'undefined') {
    lenis.destroy();
  }

  // Disable globe — stop Three.js rendering on mobile
  window._mobileDisableGlobe = true;

})();
