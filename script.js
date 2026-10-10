(() => {
  const FRAME_COUNT = 300;
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d', { alpha: false });

  const images = new Array(FRAME_COUNT);
  const loaded = new Array(FRAME_COUNT).fill(false);

  let currentDrawnIndex = -1;
  let targetProgress = 0;
  let currentProgress = 0;
  const LERP_FACTOR = 0.09;

  // Format frame filename: ezgif-frame-001.jpg ... ezgif-frame-300.jpg
  function getFrameUrl(index) {
    const padded = String(index + 1).padStart(3, '0');
    return `ezgif-frame-${padded}.jpg`;
  }

  // Handle Retina & High-DPI displays
  function resizeCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(window.innerWidth * dpr);
    canvas.height = Math.round(window.innerHeight * dpr);

    if (currentDrawnIndex !== -1 && images[currentDrawnIndex]) {
      drawFrame(images[currentDrawnIndex]);
    }
  }

  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  // Find the closest available frame to prevent blank flicker
  function getBestLoadedIndex(targetIndex) {
    if (loaded[targetIndex] && images[targetIndex] && images[targetIndex].naturalWidth > 0) {
      return targetIndex;
    }

    for (let offset = 1; offset < FRAME_COUNT; offset++) {
      const prev = targetIndex - offset;
      if (prev >= 0 && loaded[prev] && images[prev] && images[prev].naturalWidth > 0) {
        return prev;
      }
      const next = targetIndex + offset;
      if (next < FRAME_COUNT && loaded[next] && images[next] && images[next].naturalWidth > 0) {
        return next;
      }
    }
    return -1;
  }

  // Draw frame centered with cover fit
  function drawFrame(img) {
    if (!img || !img.naturalWidth) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth;
    const ih = img.naturalHeight;

    const canvasRatio = cw / ch;
    const imgRatio = iw / ih;

    let renderW, renderH, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      renderW = cw;
      renderH = cw / imgRatio;
      offsetX = 0;
      offsetY = (ch - renderH) / 2;
    } else {
      renderH = ch;
      renderW = ch * imgRatio;
      offsetX = (cw - renderW) / 2;
      offsetY = 0;
    }

    ctx.fillStyle = '#0b070c';
    ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  // When an image finishes loading
  function onFrameLoaded(index) {
    loaded[index] = true;

    // Check if this newly loaded frame is better for current scroll progress
    const targetIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(currentProgress * (FRAME_COUNT - 1)))
    );

    const bestIndex = getBestLoadedIndex(targetIndex);
    if (bestIndex !== -1 && bestIndex !== currentDrawnIndex) {
      drawFrame(images[bestIndex]);
      currentDrawnIndex = bestIndex;
    }
  }

  // Preload all 300 frames
  function preloadImages() {
    for (let i = 0; i < FRAME_COUNT; i++) {
      const img = new Image();
      img.onload = () => onFrameLoaded(i);
      img.onerror = () => {
        console.warn('Failed loading frame', i);
      };
      img.src = getFrameUrl(i);
      images[i] = img;

      // Handle already cached images
      if (img.complete && img.naturalWidth > 0) {
        onFrameLoaded(i);
      }
    }
  }

  // Calculate current scroll progress from 0.0 to 1.0 across all browsers
  function getScrollProgress() {
    const doc = document.documentElement;
    const body = document.body;

    const scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
    const scrollHeight = Math.max(
      body.scrollHeight,
      doc.scrollHeight,
      body.offsetHeight,
      doc.offsetHeight,
      body.clientHeight,
      doc.clientHeight
    );
    const clientHeight = window.innerHeight || doc.clientHeight || 1;
    const maxScroll = scrollHeight - clientHeight;

    if (maxScroll <= 0) return 0;
    return Math.max(0, Math.min(1, scrollTop / maxScroll));
  }

  // Animation frame loop with smooth inertia interpolation
  function tick() {
    targetProgress = getScrollProgress();

    // Lerp towards target for silky smooth transition
    const diff = targetProgress - currentProgress;
    if (Math.abs(diff) < 0.0001) {
      currentProgress = targetProgress;
    } else {
      currentProgress += diff * LERP_FACTOR;
    }

    const targetIndex = Math.min(
      FRAME_COUNT - 1,
      Math.max(0, Math.round(currentProgress * (FRAME_COUNT - 1)))
    );

    const bestIndex = getBestLoadedIndex(targetIndex);
    if (bestIndex !== -1 && bestIndex !== currentDrawnIndex) {
      drawFrame(images[bestIndex]);
      currentDrawnIndex = bestIndex;
    }

    requestAnimationFrame(tick);
  }

  // Start preloading and run loop
  preloadImages();
  requestAnimationFrame(tick);
})();
