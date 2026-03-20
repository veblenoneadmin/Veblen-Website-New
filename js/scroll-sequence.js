/* ============================================
   SCROLL TEXT SEQUENCE (sequence-4)
   — 471 scroll-driven frames + word-by-word text reveal
   ============================================ */
(function () {
  var TOTAL = 141;
  var images = [], loaded = 0, ready = false, current = -1;
  var canvas, ctx, W, H;
  var canvasVisible = false;
  var textVisible = false;

  // Burst playback
  var targetFrame = 0;
  var displayFrame = 0;
  var burstRunning = false;
  var FRAMES_PER_RAF = 3;

  var section, textEl, words, featuresEl;

  function drawCover(img) {
    var sc = Math.max(W / img.naturalWidth, H / img.naturalHeight);
    var dw = Math.ceil(img.naturalWidth * sc);
    var dh = Math.ceil(img.naturalHeight * sc);
    var dx = Math.floor((W - dw) / 2);
    var dy = Math.floor((H - dh) / 2);
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawFrame(idx) {
    idx = Math.max(0, Math.min(idx, TOTAL - 1));
    if (idx === current) return;
    current = idx;
    var img = images[idx];
    if (!img || !img.complete || !img.naturalWidth) return;
    ctx.clearRect(0, 0, W, H);
    drawCover(img);
  }

  function showCanvas() {
    if (!canvasVisible) { canvas.style.opacity = '1'; canvasVisible = true; }
  }
  function hideCanvas() {
    if (canvasVisible) { canvas.style.opacity = '0'; canvasVisible = false; }
  }
  function showText() {
    if (!textVisible) { textEl.style.opacity = '1'; textVisible = true; }
  }
  function hideText() {
    if (textVisible) { textEl.style.opacity = '0'; textVisible = false; }
  }

  function burstLoop() {
    if (!ready) { burstRunning = false; return; }
    var remaining = targetFrame - displayFrame;
    if (Math.abs(remaining) < 0.5) {
      displayFrame = targetFrame;
      drawFrame(Math.round(displayFrame));
      burstRunning = false;
      return;
    }
    var dir = remaining > 0 ? 1 : -1;
    var steps = Math.min(FRAMES_PER_RAF, Math.abs(Math.round(remaining)));
    for (var i = 0; i < steps; i++) {
      displayFrame += dir;
      drawFrame(Math.round(displayFrame));
    }
    if (Math.abs(targetFrame - displayFrame) > 0.5) {
      requestAnimationFrame(burstLoop);
    } else {
      displayFrame = targetFrame;
      drawFrame(Math.round(displayFrame));
      burstRunning = false;
    }
  }

  function startBurst() {
    if (!burstRunning) {
      burstRunning = true;
      requestAnimationFrame(burstLoop);
    }
  }

  function updateScroll() {
    if (!ready || !section) return;

    var rect = section.getBoundingClientRect();
    var winH = window.innerHeight;
    // Show canvas slightly early to overlap with portal canvas hiding
    var canvasInView = rect.top < winH + 100 && rect.bottom > 0;
    var inView = rect.top < winH && rect.bottom > 0;

    if (!canvasInView) {
      hideCanvas();
      hideText();
      // Reset word reveals when scrolling back up
      if (rect.top >= winH && words) {
        for (var i = 0; i < words.length; i++) {
          words[i].classList.remove('revealed');
        }
      }
      return;
    }

    showCanvas();
    // Draw frame 0 immediately if nothing drawn yet
    if (current === -1) drawFrame(0);
    if (inView) showText();

    var scrolled = winH - rect.top; // starts counting when section enters viewport
    var maxScroll = section.offsetHeight;
    var p = maxScroll > 0 ? scrolled / maxScroll : 0;
    p = p < 0 ? 0 : p > 1 ? 1 : p;

    // Drive frames — linear mapping
    targetFrame = p * (TOTAL - 1);
    startBurst();

    // Move text — starts at bottom of viewport, scrolls up
    var textTravel = window.innerHeight * 8;
    var textStart = window.innerHeight * 1.05;
    var textY = textStart - (p * textTravel);
    // Hide text until scrolling starts
    var wordsOpacity = p < 0.01 ? 0 : 1;
    var innerEl = document.getElementById('scroll-reveal-inner');
    if (innerEl) {
      innerEl.style.transform = 'translateY(' + textY + 'px)';
      innerEl.style.opacity = wordsOpacity;
    }

    // Drive word reveal — based on scroll progress
    var textP = Math.min(p / 0.12, 1);
    var revealCount = Math.floor(textP * words.length);
    for (var i = 0; i < words.length; i++) {
      if (i < revealCount) {
        words[i].classList.add('revealed');
      } else {
        words[i].classList.remove('revealed');
      }
    }

  }

  function sizeCanvas() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W;
    canvas.height = H;
    current = -1;
  }

  function wrapWords() {
    var container = document.querySelector('.scroll-reveal-words');
    if (!container) return;
    var text = container.textContent.trim();
    container.innerHTML = '';
    var allWords = text.split(/\s+/);
    for (var i = 0; i < allWords.length; i++) {
      var span = document.createElement('span');
      span.className = 'sw';
      span.textContent = allWords[i];
      container.appendChild(span);
      if (i < allWords.length - 1) {
        container.appendChild(document.createTextNode(' '));
      }
    }
    words = container.querySelectorAll('.sw');
  }

  function init() {
    canvas = document.getElementById('scroll-canvas');
    textEl = document.getElementById('scroll-reveal-text');
    featuresEl = document.getElementById('scroll-features');
    section = document.getElementById('scene-scroll-text');
    if (!canvas || !textEl || !section) return;
    ctx = canvas.getContext('2d');

    sizeCanvas();
    window.addEventListener('resize', function () {
      sizeCanvas();
      if (ready) updateScroll();
    });

    // Wrap words in spans
    wrapWords();

    // Preload frames
    for (var i = 0; i < TOTAL; i++) {
      (function (idx) {
        var num = String(idx).padStart(3, '0');
        var img = new Image();
        img.src = 'assets/sequence-6/scroll4_00108' + num + '.jpg';
        img.onload = function () {
          if (++loaded === TOTAL) { ready = true; updateScroll(); }
        };
        images[idx] = img;
      })(i);
    }

    // Listen to scroll
    window.addEventListener('scroll', updateScroll, { passive: true });
    if (typeof lenis !== 'undefined') {
      lenis.on('scroll', updateScroll);
    } else {
      var check = setInterval(function () {
        if (typeof lenis !== 'undefined') {
          lenis.on('scroll', updateScroll);
          clearInterval(check);
        }
      }, 100);
      setTimeout(function () { clearInterval(check); }, 3000);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
