/* ============================================
   MOBILE OVERRIDES (≤ 900px)
   — Lighter assets, fewer frames, simpler animations
   — Changes here do NOT affect desktop
   ============================================ */
(function () {
  var isMobile = window.innerWidth <= 900;
  if (!isMobile) return; // Desktop — skip everything

  // Reconfigure Lenis for mobile touch — keep it alive for smooth scrolling
  // (destroying it causes jagged scroll-driven animations)
  if (typeof lenis !== 'undefined') {
    lenis.destroy();
    // Re-create with mobile-friendly settings
    var mobileLenis = new Lenis({
      duration: 0.8,
      easing: function(t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
      touchMultiplier: 1.5,
      smoothWheel: true,
      smoothTouch: true,
      infinite: false
    });
    // Replace global reference so other scripts (portal-sequence) pick it up
    window.lenis = mobileLenis;
    // Drive the new instance
    function raf(time) {
      mobileLenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  }

  // Disable globe — stop Three.js rendering on mobile
  window._mobileDisableGlobe = true;

  // Skip logo animation on mobile — keep VEBLEN static in navbar
  // main.js hides nav-logo ~3800ms after load, so we re-apply after that
  function staticLogo() {
    var heroLogo = document.getElementById('hero-logo');
    var navLogo = document.querySelector('.nav-logo');
    if (heroLogo) heroLogo.style.display = 'none';
    if (navLogo) navLogo.style.visibility = 'visible';
  }

  // Run immediately, then again after main.js intro finishes
  staticLogo();
  setTimeout(staticLogo, 4200);

})();
