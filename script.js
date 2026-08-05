/* =========================================================================
   Birthday Surprise — script.js
   Implemented so far: the floating background (ambient photos + hearts),
   the YES/NO balloon interaction, and the compliment system. Confetti,
   music, the gift-open flow and the final message are separate features,
   built in later passes.
   ========================================================================= */

(function () {
  'use strict';

  /* -----------------------------------------------------------------------
     Photo manifest
     To add more photos later: drop the file into /photos and add its
     filename here. Nothing else needs to change — every photo listed is
     used exactly once, so there's no risk of accidental duplicates.
     ----------------------------------------------------------------------- */
  var PHOTOS_DIR = 'photos/';

  var PHOTO_FILENAMES = [
    'WhatsApp Image 2026-08-05 at 14.20.18.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.19.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.21 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.21 (2).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.21.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.22 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.22.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.23 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.23 (2).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.23.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.24 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.24 (2).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.24.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.25 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.25.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.26 (1).jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.26.jpeg',
    'WhatsApp Image 2026-08-05 at 14.20.27.jpeg'
  ];

  /* The four pink shades already defined in style.css — read at runtime
     (see getCssColor) rather than re-typed here, so the palette can only
     ever live in one place. */
  var HEART_SHADE_VARS = ['--pink-200', '--pink-300', '--pink-400', '--pink-500'];

  /* Breakpoints mirror the media queries already in style.css (section 11),
     so "mobile / tablet / desktop" means the same thing in both files. */
  var BREAKPOINT_TABLET = 600;
  var BREAKPOINT_DESKTOP = 1024;

  /* How far a placement has to stay from the center card, and from the
     screen edges, measured in pixels. */
  var CARD_SAFE_PADDING = 44;
  var PHOTO_EDGE_MARGIN = 16;

  /* Bounded retry counts for placement — keeps a hard, predictable cost
     even in the worst case instead of ever looping indefinitely. */
  var PHOTO_CELL_ATTEMPTS = 12;
  var PHOTO_FALLBACK_ATTEMPTS = 20;
  var HEART_PLACEMENT_ATTEMPTS = 15;

  /* Entrance animation timing. */
  var PHOTO_ENTRANCE_DURATION_MS = 750;
  var PHOTO_ENTRANCE_STAGGER_MS = 450;
  var HEART_ENTRANCE_DURATION_MS = 650;
  var HEART_ENTRANCE_STAGGER_MS = 900;

  /* -----------------------------------------------------------------------
     Small random / math helpers
     ----------------------------------------------------------------------- */
  function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
  }

  function randomInt(min, max) {
    return Math.round(randomFloat(min, max));
  }

  function pickRandom(list) {
    return list[randomInt(0, list.length - 1)];
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  /* Fisher-Yates — used so photos claim grid cells in a random order
     rather than always filling the viewport top-left to bottom-right. */
  function shuffle(list) {
    for (var i = list.length - 1; i > 0; i--) {
      var j = randomInt(0, i);
      var temp = list[i];
      list[i] = list[j];
      list[j] = temp;
    }
    return list;
  }

  /* Reads a color straight from style.css's :root custom properties, so
     "shades of pink" is defined once and shared by CSS and JS alike. */
  function getCssColor(varName) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  }

  /* -----------------------------------------------------------------------
     Responsive tuning
     Computed once at load from the current viewport width. This is a
     single, full-page experience rather than a resizable app surface, so
     re-measuring on every resize isn't worth the added complexity here.
     ----------------------------------------------------------------------- */
  function getHeartCount() {
    var width = window.innerWidth;
    if (width < BREAKPOINT_TABLET) return 60;
    if (width < BREAKPOINT_DESKTOP) return 90;
    return 120;
  }

  function getPhotoSizeRange() {
    var width = window.innerWidth;
    if (width < BREAKPOINT_TABLET) return { min: 48, max: 92 };
    if (width < BREAKPOINT_DESKTOP) return { min: 64, max: 116 };
    return { min: 84, max: 150 };
  }

  /* -----------------------------------------------------------------------
     Placement geometry
     Rectangles are plain {left, top, right, bottom} objects in viewport
     pixels — the same coordinate space `position: fixed` elements use.
     ----------------------------------------------------------------------- */
  function rectFromBox(x, y, size) {
    return { left: x, top: y, right: x + size, bottom: y + size };
  }

  function rectsOverlap(a, b) {
    return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
  }

  /* The padded bounding box of #main-card, in viewport pixels. Measured
     once at init — nothing floating is placed inside it, so it never
     spawns behind or on top of the card's content. */
  function getCardExclusionRect() {
    var card = document.getElementById('main-card');
    if (!card) return null;

    var rect = card.getBoundingClientRect();
    return {
      left: rect.left - CARD_SAFE_PADDING,
      top: rect.top - CARD_SAFE_PADDING,
      right: rect.right + CARD_SAFE_PADDING,
      bottom: rect.bottom + CARD_SAFE_PADDING
    };
  }

  /* Splits the viewport into as many roughly-square cells as there are
     photos (aspect-matched to the viewport) so one photo lands per cell —
     a natural, evenly-spread layout instead of pure random placement,
     which tends to cluster and leave gaps. */
  function buildDistributionCells(count, viewportW, viewportH) {
    var cols = Math.max(1, Math.round(Math.sqrt(count * (viewportW / viewportH))));
    var rows = Math.max(1, Math.ceil(count / cols));
    var cellW = viewportW / cols;
    var cellH = viewportH / rows;
    var cells = [];

    for (var row = 0; row < rows; row++) {
      for (var col = 0; col < cols; col++) {
        cells.push({
          left: col * cellW,
          top: row * cellH,
          right: (col + 1) * cellW,
          bottom: (row + 1) * cellH
        });
      }
    }

    return shuffle(cells);
  }

  /* Finds a spot for one photo that (a) stays fully on-screen with a
     margin, (b) never overlaps the center card, and (c) never overlaps a
     photo already placed. Tries the assigned grid cell first for even
     coverage, then falls back to the whole viewport if that cell is too
     cramped (e.g. very small screens with many photos). Bounded attempts
     guarantee this always terminates, even if a perfect spot can't be found. */
  function findPhotoPosition(size, cell, viewportW, viewportH, exclusionRect, placedRects) {
    var maxX = viewportW - PHOTO_EDGE_MARGIN - size;
    var maxY = viewportH - PHOTO_EDGE_MARGIN - size;
    var attempt, x, y, rect;

    for (attempt = 0; attempt < PHOTO_CELL_ATTEMPTS; attempt++) {
      x = clamp(randomFloat(cell.left, Math.max(cell.left, cell.right - size)), PHOTO_EDGE_MARGIN, maxX);
      y = clamp(randomFloat(cell.top, Math.max(cell.top, cell.bottom - size)), PHOTO_EDGE_MARGIN, maxY);
      rect = rectFromBox(x, y, size);

      if (exclusionRect && rectsOverlap(rect, exclusionRect)) continue;
      if (placedRects.some(function (placed) { return rectsOverlap(rect, placed); })) continue;
      return { x: x, y: y, rect: rect };
    }

    for (attempt = 0; attempt < PHOTO_FALLBACK_ATTEMPTS; attempt++) {
      x = clamp(randomFloat(PHOTO_EDGE_MARGIN, maxX), PHOTO_EDGE_MARGIN, maxX);
      y = clamp(randomFloat(PHOTO_EDGE_MARGIN, maxY), PHOTO_EDGE_MARGIN, maxY);
      rect = rectFromBox(x, y, size);

      if (exclusionRect && rectsOverlap(rect, exclusionRect)) continue;
      if (placedRects.some(function (placed) { return rectsOverlap(rect, placed); })) continue;
      return { x: x, y: y, rect: rect };
    }

    /* Last resort: accept the final candidate. With 18 photos this path
       is effectively unreachable, but it keeps behavior predictable
       instead of ever leaving a photo unplaced. */
    return { x: x, y: y, rect: rect };
  }

  /* Same idea for a heart, minus the mutual-overlap check — with up to
     120 small, low-opacity hearts, overlapping each other is expected and
     looks natural; only the center card is off-limits. */
  function findHeartPosition(size, viewportW, viewportH, exclusionRect) {
    var maxX = viewportW - size;
    var maxY = viewportH - size;
    var x, y, rect;

    for (var attempt = 0; attempt < HEART_PLACEMENT_ATTEMPTS; attempt++) {
      x = clamp(randomFloat(0, maxX), 0, maxX);
      y = clamp(randomFloat(0, maxY), 0, maxY);

      if (!exclusionRect) return { x: x, y: y };

      rect = rectFromBox(x, y, size);
      if (!rectsOverlap(rect, exclusionRect)) return { x: x, y: y };
    }

    return { x: x, y: y };
  }

  /* -----------------------------------------------------------------------
     Entrance animation
     Every element fades in from opacity 0 with a small random stagger.
     Photos also grow in from a slightly smaller scale — safe because
     @keyframes photoDrift never touches `scale`. Hearts skip the scale
     grow-in: @keyframes heartFloat already animates `scale` continuously,
     so a running heart animation would immediately override (and hide)
     any transition placed on that same property. Opacity is untouched by
     both keyframe animations, so it's always safe to transition on either.
     ----------------------------------------------------------------------- */
  function prepareEntrance(el, delayMs, durationMs, withScale) {
    el.style.opacity = '0';
    if (withScale) el.style.scale = '0.72';

    el.style.transition = 'opacity ' + durationMs + 'ms var(--ease-elegant) ' + delayMs + 'ms' +
      (withScale ? ', scale ' + durationMs + 'ms var(--ease-elegant) ' + delayMs + 'ms' : '');
  }

  function playEntrance(entry) {
    entry.el.style.opacity = entry.opacity;
    if (entry.withScale) entry.el.style.scale = '1';
  }

  /* Two nested frames guarantee the browser has painted the "opacity: 0"
     starting state before the target values are applied, so the change is
     always transitioned rather than sometimes jumping straight to the end
     state (a single frame isn't reliably enough for style flushing). */
  function revealEntrances(entries) {
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        entries.forEach(playEntrance);
      });
    });
  }

  /* -----------------------------------------------------------------------
     Floating photos
     Sizing, position, timing and drift are all randomized per element via
     inline custom properties; the actual motion is defined once by the
     .floating-photo / @keyframes photoDrift rules in style.css.
     ----------------------------------------------------------------------- */
  function createFloatingPhoto(filename, index, sizeRange, cell, viewportW, viewportH, exclusionRect, placedRects) {
    var img = document.createElement('img');
    img.className = 'floating-photo';
    img.src = PHOTOS_DIR + encodeURIComponent(filename);
    img.alt = '';
    img.decoding = 'async';

    var size = randomInt(sizeRange.min, sizeRange.max);
    var duration = randomFloat(18, 34);
    var opacity = randomFloat(0.34, 0.5).toFixed(2);

    var placement = findPhotoPosition(size, cell, viewportW, viewportH, exclusionRect, placedRects);
    placedRects.push(placement.rect);

    img.style.setProperty('--size', size + 'px');
    img.style.setProperty('--start-top', placement.y.toFixed(1) + 'px');
    img.style.setProperty('--start-left', placement.x.toFixed(1) + 'px');
    img.style.setProperty('--opacity', opacity);
    img.style.setProperty('--duration', duration.toFixed(2) + 's');

    /* A negative delay starts each photo already partway through its
       drift, so the very first frame already looks organic instead of
       every photo launching from the same pose in lockstep. */
    img.style.setProperty('--delay', (-randomFloat(0, duration)).toFixed(2) + 's');

    img.style.setProperty('--x1', randomFloat(-40, 40).toFixed(1) + 'px');
    img.style.setProperty('--y1', randomFloat(-60, -10).toFixed(1) + 'px');
    img.style.setProperty('--x2', randomFloat(-40, 40).toFixed(1) + 'px');
    img.style.setProperty('--y2', randomFloat(-70, -20).toFixed(1) + 'px');
    img.style.setProperty('--x3', randomFloat(-40, 40).toFixed(1) + 'px');
    img.style.setProperty('--y3', randomFloat(-50, -5).toFixed(1) + 'px');

    img.style.setProperty('--r0', randomFloat(-6, 6).toFixed(1) + 'deg');
    img.style.setProperty('--r1', randomFloat(-6, 6).toFixed(1) + 'deg');
    img.style.setProperty('--r2', randomFloat(-6, 6).toFixed(1) + 'deg');
    img.style.setProperty('--r3', randomFloat(-6, 6).toFixed(1) + 'deg');

    var delayMs = Math.round(randomFloat(0, PHOTO_ENTRANCE_STAGGER_MS));
    prepareEntrance(img, delayMs, PHOTO_ENTRANCE_DURATION_MS, true);

    return { el: img, opacity: opacity, withScale: true };
  }

  function initFloatingPhotos() {
    var container = document.getElementById('floating-bg');
    if (!container) return;

    var viewportW = window.innerWidth;
    var viewportH = window.innerHeight;
    var sizeRange = getPhotoSizeRange();
    var exclusionRect = getCardExclusionRect();
    var cells = buildDistributionCells(PHOTO_FILENAMES.length, viewportW, viewportH);
    var placedRects = [];
    var entries = [];

    var fragment = document.createDocumentFragment();
    PHOTO_FILENAMES.forEach(function (filename, index) {
      var cell = cells[index % cells.length];
      var entry = createFloatingPhoto(filename, index, sizeRange, cell, viewportW, viewportH, exclusionRect, placedRects);
      entries.push(entry);
      fragment.appendChild(entry.el);
    });
    container.appendChild(fragment);

    revealEntrances(entries);
  }

  /* -----------------------------------------------------------------------
     Floating hearts
     Plain <div>s — the heart shape itself comes from the .heart CSS rule
     (two circles plus a rotated square), so JS only has to hand each one
     randomized position, size, color, opacity and timing.
     ----------------------------------------------------------------------- */
  function createFloatingHeart(colors, viewportW, viewportH, exclusionRect) {
    var heart = document.createElement('div');
    heart.className = 'heart';

    var duration = randomFloat(6, 14);
    var opacity = randomFloat(0.25, 0.65).toFixed(2);
    var size = randomInt(8, 22);

    var placement = findHeartPosition(size, viewportW, viewportH, exclusionRect);

    heart.style.setProperty('--top', placement.y.toFixed(1) + 'px');
    heart.style.setProperty('--left', placement.x.toFixed(1) + 'px');
    heart.style.setProperty('--size', size + 'px');
    heart.style.setProperty('--opacity', opacity);
    heart.style.setProperty('--duration', duration.toFixed(2) + 's');
    heart.style.setProperty('--delay', (-randomFloat(0, duration)).toFixed(2) + 's');
    heart.style.setProperty('--dx', randomFloat(-30, 30).toFixed(1) + 'px');
    heart.style.setProperty('--dy', randomFloat(-50, -20).toFixed(1) + 'px');
    heart.style.setProperty('--heart-color', pickRandom(colors));

    var delayMs = Math.round(randomFloat(0, HEART_ENTRANCE_STAGGER_MS));
    prepareEntrance(heart, delayMs, HEART_ENTRANCE_DURATION_MS, false);

    return { el: heart, opacity: opacity, withScale: false };
  }

  function initFloatingHearts() {
    var container = document.getElementById('hearts-bg');
    if (!container) return;

    var viewportW = window.innerWidth;
    var viewportH = window.innerHeight;
    var colors = HEART_SHADE_VARS.map(getCssColor);
    var exclusionRect = getCardExclusionRect();
    var heartCount = getHeartCount();
    var entries = [];

    var fragment = document.createDocumentFragment();
    for (var i = 0; i < heartCount; i++) {
      var entry = createFloatingHeart(colors, viewportW, viewportH, exclusionRect);
      entries.push(entry);
      fragment.appendChild(entry.el);
    }
    container.appendChild(fragment);

    revealEntrances(entries);
  }

  /* =========================================================================
     Balloon interaction
     YES pops, disables itself, and fades the question stage into the
     compliment stage — then hands off to the compliment system (see below)
     to display the first compliment. NO dodges every mouse/touch attempt,
     shrinking and working through its message list, then dissolves into
     hearts — at which point YES gets a gentle, encouraging glow.
     ========================================================================= */

  var STAGE_FADE_OUT_MS = 320;
  var YES_POP_DURATION_MS = 480;
  var YES_EMPHASIS_SCALE = 1.12;

  var NO_BALLOON_EDGE_MARGIN = 12;
  var NO_BALLOON_TARGET_PADDING = 18; /* keep-clear buffer around the YES balloon */
  var NO_BALLOON_PLACEMENT_ATTEMPTS = 24;
  var NO_BALLOON_MIN_JUMP_ATTEMPTS = 14; /* subset of attempts that also prefer a real jump, not a nudge */
  var NO_BALLOON_MIN_JUMP_DISTANCE = 140;
  var NO_BALLOON_MOVE_MS = 360; /* small safety margin over the .is-escaping 0.35s transition */
  var NO_BALLOON_SHRINK_STEP = 0.1;
  var NO_BALLOON_MIN_SCALE = 0.5; /* five messages x 0.1 lands exactly on this floor */
  var NO_BALLOON_FINAL_MESSAGE_HOLD_MS = 1000;
  var NO_BALLOON_DISSOLVE_MS = 620; /* safety margin over the balloonDissolve 0.6s animation */
  var NO_BALLOON_BURST_HEART_COUNT = 12;
  var NO_BALLOON_BURST_CLEANUP_MS = 950; /* safety margin over the heartBurst 0.9s animation */

  var prefersReducedMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* -----------------------------------------------------------------------
     Stage transitions
     The incoming stage's fade-in already comes for free from the existing
     .stage:not([hidden]) { animation: stageFadeIn ... } rule in style.css —
     only the outgoing stage's fade-out needs to be driven from here.
     ----------------------------------------------------------------------- */
  function fadeOutStage(el, onComplete) {
    el.style.transition = 'opacity ' + STAGE_FADE_OUT_MS + 'ms ease, translate ' + STAGE_FADE_OUT_MS + 'ms ease';
    el.style.opacity = '1';
    el.style.translate = '0 0';
    void el.offsetWidth; /* commit the starting values before animating away, or the transition never plays */

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        el.style.opacity = '0';
        el.style.translate = '0 -10px';
      });
    });

    window.setTimeout(onComplete, STAGE_FADE_OUT_MS);
  }

  function switchStage(fromEl, toEl, onSwitched) {
    fadeOutStage(fromEl, function () {
      fromEl.hidden = true;
      fromEl.style.transition = '';
      fromEl.style.opacity = '';
      fromEl.style.translate = '';
      toEl.hidden = false;
      if (onSwitched) onSwitched();
    });
  }

  /* -----------------------------------------------------------------------
     Shared glow pulse
     `filter` is untouched by every existing balloon/button rule (they all
     use box-shadow), so a drop-shadow glow layers on top instead of
     fighting existing shading. Web Animations API keeps this pulse out of
     style.css entirely; skipped in favor of a static glow under reduced
     motion. Used both to nudge YES once NO is gone, and to draw the eye to
     the gift button once it's revealed.
     ----------------------------------------------------------------------- */
  function pulseGlow(el, lowColor, highColor, durationMs) {
    if (prefersReducedMotion || !el.animate) {
      el.style.filter = 'drop-shadow(0 0 16px ' + highColor + ') drop-shadow(0 0 30px ' + lowColor + ')';
      return;
    }

    el.animate(
      [
        { filter: 'drop-shadow(0 0 8px ' + lowColor + ') drop-shadow(0 0 18px ' + lowColor + ')' },
        { filter: 'drop-shadow(0 0 20px ' + highColor + ') drop-shadow(0 0 38px ' + highColor + ')' }
      ],
      { duration: durationMs, iterations: Infinity, direction: 'alternate', easing: 'ease-in-out' }
    );
  }

  /* -----------------------------------------------------------------------
     YES balloon
     ----------------------------------------------------------------------- */
  function emphasizeYesBalloon(yesBalloon) {
    var rect = yesBalloon.getBoundingClientRect();

    yesBalloon.style.width = rect.width + 'px';
    yesBalloon.style.height = rect.height + 'px';
    yesBalloon.style.transition = 'width 0.6s var(--ease-elegant), height 0.6s var(--ease-elegant)';
    void yesBalloon.offsetWidth;

    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        yesBalloon.style.width = (rect.width * YES_EMPHASIS_SCALE) + 'px';
        yesBalloon.style.height = (rect.height * YES_EMPHASIS_SCALE) + 'px';
      });
    });

    pulseGlow(yesBalloon, 'rgba(255, 111, 165, 0.45)', 'rgba(255, 111, 165, 0.85)', 2600);
  }

  /* onComplimentStageReady fires once the compliment stage is actually
     visible, so the compliment system can reveal the first compliment at
     exactly the right moment — kept as a plain callback rather than a
     direct call so this function doesn't need to know the compliment
     system exists. */
  function initYesBalloon(onComplimentStageReady) {
    var yesBalloon = document.getElementById('yes-balloon');
    var questionStage = document.getElementById('question-stage');
    var complimentStage = document.getElementById('compliment-stage');
    if (!yesBalloon || !questionStage || !complimentStage) return;

    var answered = false;

    yesBalloon.addEventListener('click', function () {
      if (answered) return;
      answered = true;

      yesBalloon.disabled = true;
      yesBalloon.classList.add('is-popping');

      window.setTimeout(function () {
        switchStage(questionStage, complimentStage, onComplimentStageReady);
      }, YES_POP_DURATION_MS);
    });
  }

  /* -----------------------------------------------------------------------
     NO balloon — placement helpers
     Reuses the existing rectsOverlap/clamp/randomFloat helpers and the
     existing getCardExclusionRect(), so "stay off the card" is defined in
     exactly one place for photos, hearts and this balloon alike.
     ----------------------------------------------------------------------- */
  function getNoBalloonExclusionRects(yesBalloon) {
    var rects = [];
    var cardRect = getCardExclusionRect();
    if (cardRect) rects.push(cardRect);

    var yesRect = yesBalloon.getBoundingClientRect();
    rects.push({
      left: yesRect.left - NO_BALLOON_TARGET_PADDING,
      top: yesRect.top - NO_BALLOON_TARGET_PADDING,
      right: yesRect.right + NO_BALLOON_TARGET_PADDING,
      bottom: yesRect.bottom + NO_BALLOON_TARGET_PADDING
    });

    return rects;
  }

  /* Finds a spot that (a) stays fully on-screen, (b) never overlaps the
     card or the YES balloon, and (c) preferably lands far enough from the
     current spot to read as a real "escape" rather than a tiny nudge. */
  function findNoBalloonPosition(width, height, viewportW, viewportH, exclusionRects, currentCenter) {
    var maxX = Math.max(NO_BALLOON_EDGE_MARGIN, viewportW - NO_BALLOON_EDGE_MARGIN - width);
    var maxY = Math.max(NO_BALLOON_EDGE_MARGIN, viewportH - NO_BALLOON_EDGE_MARGIN - height);
    var firstSafeSpot = null;

    for (var attempt = 0; attempt < NO_BALLOON_PLACEMENT_ATTEMPTS; attempt++) {
      var x = randomFloat(NO_BALLOON_EDGE_MARGIN, maxX);
      var y = randomFloat(NO_BALLOON_EDGE_MARGIN, maxY);
      var rect = { left: x, top: y, right: x + width, bottom: y + height };

      var collides = exclusionRects.some(function (excluded) { return rectsOverlap(rect, excluded); });
      if (collides) continue;

      if (!firstSafeSpot) firstSafeSpot = { x: x, y: y };
      if (attempt >= NO_BALLOON_MIN_JUMP_ATTEMPTS) return firstSafeSpot;

      var centerX = x + width / 2;
      var centerY = y + height / 2;
      var distance = Math.hypot(centerX - currentCenter.x, centerY - currentCenter.y);
      if (distance >= NO_BALLOON_MIN_JUMP_DISTANCE) return { x: x, y: y };
    }

    return firstSafeSpot || {
      x: clamp(randomFloat(NO_BALLOON_EDGE_MARGIN, maxX), NO_BALLOON_EDGE_MARGIN, maxX),
      y: clamp(randomFloat(NO_BALLOON_EDGE_MARGIN, maxY), NO_BALLOON_EDGE_MARGIN, maxY)
    };
  }

  /* Spawns a short-lived burst of .heart.is-burst elements (see the
     heartBurst keyframes in style.css) at the NO balloon's last position. */
  function spawnHeartBurst(sourceEl) {
    var container = document.getElementById('hearts-bg');
    if (!container) return;

    var rect = sourceEl.getBoundingClientRect();
    var centerX = rect.left + rect.width / 2;
    var centerY = rect.top + rect.height / 2;
    var colors = HEART_SHADE_VARS.map(getCssColor);
    var fragment = document.createDocumentFragment();
    var burstEls = [];

    for (var i = 0; i < NO_BALLOON_BURST_HEART_COUNT; i++) {
      var heart = document.createElement('div');
      heart.className = 'heart is-burst';
      var size = randomInt(10, 20);

      heart.style.setProperty('--top', (centerY - size / 2).toFixed(1) + 'px');
      heart.style.setProperty('--left', (centerX - size / 2).toFixed(1) + 'px');
      heart.style.setProperty('--size', size + 'px');
      heart.style.setProperty('--opacity', randomFloat(0.5, 0.85).toFixed(2));
      heart.style.setProperty('--heart-color', pickRandom(colors));
      heart.style.setProperty('--dx', randomFloat(-70, 70).toFixed(1) + 'px');
      heart.style.setProperty('--dy', randomFloat(-110, -50).toFixed(1) + 'px');

      fragment.appendChild(heart);
      burstEls.push(heart);
    }

    container.appendChild(fragment);

    window.setTimeout(function () {
      burstEls.forEach(function (heart) {
        if (heart.parentNode) heart.parentNode.removeChild(heart);
      });
    }, NO_BALLOON_BURST_CLEANUP_MS);
  }

  /* -----------------------------------------------------------------------
     NO balloon — interaction
     ----------------------------------------------------------------------- */
  function initNoBalloonInteraction() {
    var noBalloon = document.getElementById('no-balloon');
    var yesBalloon = document.getElementById('yes-balloon');
    if (!noBalloon || !yesBalloon) return;

    var noResponses = (window.BirthdayData && window.BirthdayData.noResponses) || [];
    var baseRect = null; /* the balloon's true, unscaled size — captured on the first escape */
    var currentX = 0;
    var currentY = 0; /* tracked ourselves rather than re-read via getBoundingClientRect, since that can reflect a mid-transition frame */
    var escapeCount = 0;
    var isBusy = false; /* debounces rapid re-triggers while a move is still in flight */
    var finished = false;
    var removed = false;

    /* CSS `scale` is a paint-time visual effect — it does not shrink the
       element's layout box. Bounds/overlap math must reserve the full,
       unscaled footprint (baseRect), or a shrunken balloon can still be
       positioned close enough to an edge that its un-shrunk layout box
       (and therefore its fixed-position containment) pokes off-screen. */
    function currentScale() {
      return Math.max(NO_BALLOON_MIN_SCALE, 1 - escapeCount * NO_BALLOON_SHRINK_STEP);
    }

    /* Switches the balloon from normal flex flow to position: fixed at the
       exact spot it already occupies, so the very first escape animates
       from there instead of visually jumping. */
    function anchorAtCurrentPosition() {
      var rect = noBalloon.getBoundingClientRect();
      currentX = rect.left;
      currentY = rect.top;
      noBalloon.style.top = currentY.toFixed(1) + 'px';
      noBalloon.style.left = currentX.toFixed(1) + 'px';
      noBalloon.classList.add('is-escaping');
      void noBalloon.offsetWidth; /* commit that starting spot before relocate() changes it */
    }

    function relocate() {
      var viewportW = window.innerWidth;
      var viewportH = window.innerHeight;
      var scale = currentScale();
      var exclusionRects = getNoBalloonExclusionRects(yesBalloon);
      var currentCenter = { x: currentX + baseRect.width / 2, y: currentY + baseRect.height / 2 };
      var position = findNoBalloonPosition(baseRect.width, baseRect.height, viewportW, viewportH, exclusionRects, currentCenter);

      currentX = position.x;
      currentY = position.y;

      noBalloon.style.top = currentY.toFixed(1) + 'px';
      noBalloon.style.left = currentX.toFixed(1) + 'px';
      noBalloon.style.setProperty('--no-scale', scale.toFixed(2));
    }

    function removeNoBalloon() {
      if (removed) return;
      removed = true;

      if (noBalloon.parentNode) noBalloon.parentNode.removeChild(noBalloon);
      emphasizeYesBalloon(yesBalloon);
    }

    function dissolve() {
      finished = true;

      spawnHeartBurst(noBalloon);
      noBalloon.classList.add('is-dissolving');

      var cleanupTimer = window.setTimeout(removeNoBalloon, NO_BALLOON_DISSOLVE_MS);
      noBalloon.addEventListener('animationend', function () {
        window.clearTimeout(cleanupTimer);
        removeNoBalloon();
      }, { once: true });
    }

    function escape(event) {
      if (finished || isBusy) return;
      if (event && event.cancelable) event.preventDefault();

      if (!baseRect) {
        baseRect = noBalloon.getBoundingClientRect();
        anchorAtCurrentPosition();
        noBalloon.style.padding = '0 14%'; /* room for wrapped message text inside the oval */
      }

      isBusy = true;
      escapeCount++;

      var message = noResponses[escapeCount - 1] || '';
      noBalloon.textContent = message;
      noBalloon.style.fontSize = Math.max(0.6, 1.05 - message.length * 0.013).toFixed(2) + 'rem';

      relocate();

      window.setTimeout(function () {
        isBusy = false;
        if (escapeCount >= noResponses.length) {
          window.setTimeout(dissolve, NO_BALLOON_FINAL_MESSAGE_HOLD_MS);
        }
      }, NO_BALLOON_MOVE_MS);
    }

    noBalloon.addEventListener('mouseenter', escape);
    noBalloon.addEventListener('touchstart', escape, { passive: false });
    noBalloon.addEventListener('click', escape);
  }

  /* =========================================================================
     Compliment system
     Shows one compliment at a time from window.BirthdayData.compliments,
     drawn from a shuffled queue so nothing repeats until every compliment
     has been shown once. After 10 have been viewed, the gift stage is
     revealed alongside the compliment stage — the Next button stays live,
     the gift button gets a glow. Confetti, music, the gift-open flow and
     the final message are not implemented here.
     ========================================================================= */

  var COMPLIMENT_FADE_MS = 260;
  var GIFT_REVEAL_THRESHOLD = 10;
  var GIFT_REVEAL_DELAY_MS = 400; /* small pause after the 10th compliment lands before the gift appears */

  /* Fades the current text out, swaps it, then fades the new text in. On
     the very first call there's nothing rendered yet to fade out (the
     paragraph starts blank), so that half is simply imperceptible — every
     call after that has a real "before" frame to animate from. */
  function displayComplimentText(el, text) {
    el.style.transition = 'opacity ' + COMPLIMENT_FADE_MS + 'ms ease, translate ' + COMPLIMENT_FADE_MS + 'ms ease';
    el.style.opacity = '0';
    el.style.translate = '0 10px';

    window.setTimeout(function () {
      el.textContent = text;
      void el.offsetWidth; /* commit the blank/hidden state before fading the new text in */
      el.style.opacity = '1';
      el.style.translate = '0 0';
    }, COMPLIMENT_FADE_MS);
  }

  function initComplimentSystem() {
    var complimentTextEl = document.getElementById('compliment-text');
    var complimentCounterEl = document.getElementById('compliment-counter');
    var nextBtn = document.getElementById('next-compliment-btn');
    var giftStage = document.getElementById('gift-stage');
    var openGiftBtn = document.getElementById('open-gift-btn');
    var compliments = (window.BirthdayData && window.BirthdayData.compliments) || [];

    if (!complimentTextEl || !complimentCounterEl || !nextBtn || !compliments.length) {
      return { start: function () {} };
    }

    nextBtn.textContent = 'Next Compliment ❤️';
    if (openGiftBtn) openGiftBtn.textContent = 'Open Your Birthday Gift 🎁';

    var queue = []; /* shuffled pool still left to show before any repeat */
    var lastShown = null;
    var viewedCount = 0;
    var giftRevealed = false;

    /* Fresh shuffle of all 100 whenever the queue runs dry, with a small
       guard against the new shuffle's first pop landing on the exact
       compliment that was just shown. */
    function refillQueue() {
      queue = shuffle(compliments.slice());
      if (lastShown && queue.length > 1 && queue[queue.length - 1] === lastShown) {
        var swapIndex = randomInt(0, queue.length - 2);
        var top = queue[queue.length - 1];
        queue[queue.length - 1] = queue[swapIndex];
        queue[swapIndex] = top;
      }
    }

    function nextComplimentText() {
      if (queue.length === 0) refillQueue();
      lastShown = queue.pop();
      return lastShown;
    }

    function revealGiftStage() {
      if (!giftStage) return;
      giftStage.hidden = false; /* free entrance animation from .stage:not([hidden]) in style.css */
      if (openGiftBtn) pulseGlow(openGiftBtn, 'rgba(255, 111, 165, 0.4)', 'rgba(255, 111, 165, 0.8)', 2200);
    }

    function showNext() {
      var text = nextComplimentText();
      viewedCount++;

      displayComplimentText(complimentTextEl, text);
      complimentCounterEl.textContent = viewedCount + ' / ' + compliments.length;

      if (viewedCount >= GIFT_REVEAL_THRESHOLD && !giftRevealed) {
        giftRevealed = true;
        window.setTimeout(revealGiftStage, GIFT_REVEAL_DELAY_MS);
      }
    }

    nextBtn.addEventListener('click', showNext);

    return { start: showNext };
  }

  function initBalloonInteraction() {
    var complimentSystem = initComplimentSystem();
    initYesBalloon(complimentSystem.start);
    initNoBalloonInteraction();
  }

  /* -----------------------------------------------------------------------
     Init
     Photos and hearts render inside #floating-bg / #hearts-bg — both are
     fixed, pointer-events: none, and layered beneath #main-card by
     z-index (see style.css) — so no matter where an element lands, it can
     never visually cover or intercept clicks meant for the center card.
     Balloon interaction is wired up the same pass, independent of the
     floating background.
     ----------------------------------------------------------------------- */
  document.addEventListener('DOMContentLoaded', function () {
    initFloatingPhotos();
    initFloatingHearts();
    initBalloonInteraction();
  });
})();
