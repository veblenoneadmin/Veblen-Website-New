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

  // Future: swap zipper frames to mobile-optimized versions
  // e.g., load zip-mobile/ folder with 720p frames, or fewer frames
  // For now, the desktop frames will still load but mobile CSS handles layout

})();
