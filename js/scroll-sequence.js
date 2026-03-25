/* ============================================
   Results accordion + Services reveal animations
   ============================================ */
(function () {
  function init() {
    // ---- Services auto-scroll seamless loop ----
    var scrollInner = document.querySelector('.services-scroll-inner');
    if (scrollInner) {
      // Get all original items (first 10)
      var allItems = scrollInner.querySelectorAll('li');
      var originalCount = allItems.length / 2;
      // Measure height of original set
      var totalH = 0;
      for (var s = 0; s < originalCount; s++) {
        totalH += allItems[s].offsetHeight + parseFloat(getComputedStyle(allItems[s]).paddingTop) + parseFloat(getComputedStyle(allItems[s]).paddingBottom);
      }
      // Set animation duration based on height for consistent speed
      var speed = 30; // pixels per second
      var duration = totalH / speed;
      scrollInner.style.animation = 'none';
      scrollInner.offsetHeight; // force reflow
      scrollInner.style.animation = 'servicesScroll ' + duration + 's linear infinite';
    }

    // ---- Contact floating shapes ----
    var shapes = document.querySelectorAll('.elegant-shape');
    if (shapes.length) {
      var contactObs = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting) {
          for (var s = 0; s < shapes.length; s++) {
            shapes[s].style.animationPlayState = 'running';
          }
          // Add continuous float after entry
          setTimeout(function () {
            for (var s = 0; s < shapes.length; s++) {
              shapes[s].style.animation = 'shapeHover 12s ease-in-out infinite';
              shapes[s].style.opacity = '1';
            }
          }, 2800);
          contactObs.disconnect();
        }
      }, { threshold: 0.1 });
      var contactSec = document.getElementById('contact-section');
      if (contactSec) contactObs.observe(contactSec);
      // Pause until in view
      for (var s = 0; s < shapes.length; s++) {
        shapes[s].style.animationPlayState = 'paused';
      }
    }

    // ---- About word-by-word reveal ----
    var aboutBody = document.querySelector('.about-body');
    if (aboutBody) {
      var text = aboutBody.textContent.trim();
      aboutBody.innerHTML = '';
      var chars = [];
      var allWords = text.split(/\s+/);
      for (var w = 0; w < allWords.length; w++) {
        for (var c = 0; c < allWords[w].length; c++) {
          var span = document.createElement('span');
          span.className = 'sc';
          span.textContent = allWords[w][c];
          aboutBody.appendChild(span);
          chars.push(span);
        }
        if (w < allWords.length - 1) aboutBody.appendChild(document.createTextNode(' '));
      }
      var words = chars;
      var aboutSection = document.getElementById('scene-scroll-text');

      function revealWords() {
        if (!aboutSection) return;
        var rect = aboutSection.getBoundingClientRect();
        var winH = window.innerHeight;
        if (rect.top >= winH || rect.bottom <= 0) return;
        var p = (winH - rect.top) / (winH + aboutSection.offsetHeight);
        p = p < 0 ? 0 : p > 1 ? 1 : p;
        var adjusted = (p - 0.15) / 0.3;
        var revealP = adjusted < 0 ? 0 : adjusted > 1 ? 1 : adjusted;
        var count = Math.floor(revealP * words.length);
        for (var i = 0; i < words.length; i++) {
          if (i < count) words[i].classList.add('revealed');
          else words[i].classList.remove('revealed');
        }
      }

      window.addEventListener('scroll', revealWords, { passive: true });
      if (typeof lenis !== 'undefined') { lenis.on('scroll', revealWords); }
      else {
        var chk = setInterval(function () {
          if (typeof lenis !== 'undefined') { lenis.on('scroll', revealWords); clearInterval(chk); }
        }, 100);
        setTimeout(function () { clearInterval(chk); }, 3000);
      }
      revealWords();
    }

    // ---- Results accordion ----
    var items = document.querySelectorAll('.results-item');
    var imgs = document.querySelectorAll('.results-image');
    for (var a = 0; a < items.length; a++) {
      (function (item) {
        var header = item.querySelector('.results-item-header');
        if (!header) return;
        header.addEventListener('click', function () {
          var wasActive = item.classList.contains('active');
          var idx = item.getAttribute('data-results-idx');
          for (var b = 0; b < items.length; b++) items[b].classList.remove('active');
          for (var c = 0; c < imgs.length; c++) imgs[c].classList.remove('active');
          if (!wasActive) {
            item.classList.add('active');
            var t = document.querySelector('[data-results-img="' + idx + '"]');
            if (t) t.classList.add('active');
          }
        });
      })(items[a]);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
