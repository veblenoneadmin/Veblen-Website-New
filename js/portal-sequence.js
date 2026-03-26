(function () {
  var isMobileDevice = window.matchMedia('(pointer: coarse)').matches || window.innerWidth <= 768;
  var TOTAL = isMobileDevice ? 751 : 1001, images = [], loaded = 0, ready = false, current = -1;
  var frameEl, canvas, ctx, W, H;
  var visible = false;
  var canvasVisible = false;
  var videoEnded = false;

  // Burst playback state
  var targetFrame = 0;
  var displayFrame = 0;
  var burstRunning = false;
  var FRAMES_PER_RAF = 25; // play 25 frames per animation frame for fast burst

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

  function showFrame() {
    if (!visible) { frameEl.style.opacity = '1'; visible = true; }
  }

  function hideFrame() {
    if (visible) { frameEl.style.opacity = '0'; visible = false; }
  }

  function showCanvas() {
    if (!canvasVisible) {
      canvas.style.opacity = '1'; canvasVisible = true;
      var b = document.querySelector('.portal-bridge');
      if (b) b.style.visibility = 'visible';
    }
  }

  function hideCanvas() {
    if (canvasVisible) { canvas.style.opacity = '0'; canvasVisible = false; }
  }

  // Burst loop — plays multiple frames per rAF toward target
  function burstLoop() {
    if (!ready) { burstRunning = false; return; }

    var remaining = targetFrame - displayFrame;

    if (Math.abs(remaining) < 0.5) {
      displayFrame = targetFrame;
      drawFrame(Math.round(displayFrame));
      burstRunning = false;
      return;
    }

    // Advance multiple frames per rAF for video-speed burst
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

  function updateTarget() {
    if (!ready) return;

    var section = document.getElementById('scene-door-portal');
    if (!section) return;

    var rect = section.getBoundingClientRect();
    var sectionH = section.offsetHeight;
    var winH = window.innerHeight;
    var inPortal = rect.top < winH && rect.bottom > 0;

    if (!videoEnded) {
      if (!inPortal) {
        hideFrame();
        hideCanvas();
        if (rect.top >= winH) {
          var words = document.querySelectorAll('.hero-word-el');
          for (var j = 0; j < words.length; j++) {
            words[j].style.transform = '';
            words[j].style.opacity = '1';
          }
        }
        return;
      }
      showCanvas();
      var scrolled = -rect.top;
      var maxScroll = sectionH - winH;
      var p = maxScroll > 0 ? scrolled / maxScroll : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      targetFrame = p * (TOTAL - 1);
      startBurst();
    } else {
      var scrollY = window.scrollY || window.pageYOffset;
      var heroEl = document.getElementById('scene-hero');
      var heroH = heroEl ? heroEl.offsetHeight : winH;
      var maxScroll = heroH + sectionH - winH;
      var p = maxScroll > 0 ? scrollY / maxScroll : 0;
      p = p < 0 ? 0 : p > 1 ? 1 : p;
      targetFrame = p * (TOTAL - 1);

      if (targetFrame < 0.5) {
        showFrame();
        hideCanvas();
      } else {
        // Draw first before showing to prevent blank flash
        drawFrame(Math.round(displayFrame > 0 ? displayFrame : targetFrame));
        hideFrame();
        showCanvas();
        startBurst();
      }

      if (rect.bottom <= 0) {
        hideFrame();
        hideCanvas();
        return;
      }
    }

    // Hero text — scale from viewport center (ease-in, starts slow)
    var eased = p * p;
    var scale = 1 + eased * 3;

    if (!updateTarget._heroWords) {
      var hwOwn = document.getElementById('hw-own');
      var hwThe = document.getElementById('hw-the');
      var hwMarket = document.getElementById('hw-market');
      var hwTagline = document.querySelector('.hero-tagline');
      if (hwOwn && hwThe && hwMarket) {
        var cx = window.innerWidth / 2;
        var cy = window.innerHeight / 2;
        var els = [hwOwn, hwThe, hwMarket];
        if (hwTagline) els.push(hwTagline);
        updateTarget._heroWords = els;
        updateTarget._heroOrigins = [];
        for (var w = 0; w < els.length; w++) {
          var r = els[w].getBoundingClientRect();
          updateTarget._heroOrigins.push({
            x: cx - r.left,
            y: cy - r.top
          });
        }
      }
    }

    if (updateTarget._heroWords) {
      for (var w = 0; w < updateTarget._heroWords.length; w++) {
        var el = updateTarget._heroWords[w];
        var o = updateTarget._heroOrigins[w];
        el.style.transformOrigin = o.x + 'px ' + o.y + 'px';
        el.style.transform = 'scale(' + scale + ')';
        el.style.opacity = '1';
      }
    }

    // Scroll hint stays visible throughout
  }

  function sizeCanvas() {
    W = canvas.clientWidth;
    H = canvas.clientHeight;
    canvas.width = W;
    canvas.height = H;
    current = -1;
  }

  function init() {
    frameEl = document.getElementById('portal-frame');
    canvas = document.getElementById('portal-canvas');
    if (!frameEl || !canvas) return;
    ctx = canvas.getContext('2d');

    sizeCanvas();
    window.addEventListener('resize', function () {
      sizeCanvas();
      if (ready) updateTarget();
    });

    // Preload all frames as Image objects
    for (var i = 0; i < TOTAL; i++) {
      (function (idx) {
        var img = new Image();
        if (isMobileDevice) {
          var num = String(30 + idx).padStart(4, '0');
          img.src = 'assets/door.mobile/' + num + '.webp';
        } else {
          var num = 8174 + idx;
          img.src = 'assets/sequence-2/door3/inside0010' + num + '.webp';
        }
        img.onload = function () {
          if (++loaded === TOTAL) { ready = true; updateTarget(); }
        };
        images[idx] = img;
      })(i);
    }

    // When intro ends, show frame 0 via img (perfect alignment)
    window.addEventListener('portal-show', function () {
      videoEnded = true;
      if (ready) {
        frameEl.src = images[0].src;
        showFrame();
        displayFrame = 0;
        targetFrame = 0;
      }
    });

    // Listen to scroll
    window.addEventListener('scroll', updateTarget, { passive: true });
    if (typeof lenis !== 'undefined') {
      lenis.on('scroll', updateTarget);
    } else {
      var check = setInterval(function () {
        if (typeof lenis !== 'undefined') {
          lenis.on('scroll', updateTarget);
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
