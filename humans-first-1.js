(function () {
  const root = document.querySelector("[data-hf-book]");
  if (!root) return;

  const track = root.querySelector("#hf-track");
  const stage = root.querySelector(".hf-stage");
  const bookScene = root.querySelector("#hf-bookScene");
  const book = root.querySelector("#hf-book");
  const circle = root.querySelector("#hf-circle");
  const cover = root.querySelector("#hf-cover");
  const blocksWrap = root.querySelector("#hf-blocks");
  const cta = root.querySelector("#hf-cta");
  const heroCap = root.querySelector("#hf-heroCap");
  const cue = root.querySelector("#hf-cue");
  const tapHint = root.querySelector("#hf-tapHint");
  const copyEl = root.querySelector(".hf-copy");
  const panels = [...root.querySelectorAll(".hf-panel")];
  const turn = root.querySelector("#hf-turn");
  const pageBase = root.querySelector("#hf-pageBase");
  const pageTurn = root.querySelector("#hf-pageTurn");

  if (!track || !stage || !bookScene || !book || !circle || !cover || !blocksWrap || !cta || !pageBase || !pageTurn || !turn) {
    return;
  }

  const mobileQuery = window.matchMedia("(max-width: 820px)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const pages = [
    { image: "assets/figma/trust-book1.png", alt: "Trust" },
    { image: "assets/figma/empower-book2.png", alt: "Empower" },
    { image: "assets/figma/aplify-book3.png", alt: "Amplify" },
    { image: "assets/figma/reimagine-book4.png", alt: "Reimagine" },
  ];

  pages.forEach((page) => {
    const preload = new Image();
    preload.src = page.image;
  });

  function renderPage(el, i) {
    const page = pages[i];
    if (!page || !el) return;

    if (el.dataset.pageIdx === String(i)) return;

    el.dataset.pageIdx = String(i);
    el.classList.add("hf-page-image");
    el.innerHTML = `<img class="hf-page-img" src="${page.image}" alt="${page.alt}" decoding="async" />`;
  }

  const lerp = (a, b, t) => a + (b - a) * t;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  let blocksOpen = false;
  let scrollProgress = 0;
  let mx = 0;
  let my = 0;
  let running = false;
  let wasPassed = false;

  let mobileStep = 0;
  let mobileProgress = 0;
  let mobileAnimating = false;
  let mobileAnimRaf = 0;

  const MOBILE_FLIP_MS = reducedMotion ? 0 : 720;

  function isMobile() {
    return mobileQuery.matches;
  }

  function setCtaLabel(label) {
    cta.textContent = "";
    const dot = document.createElement("span");
    dot.className = "dot";
    cta.appendChild(dot);
    cta.appendChild(document.createTextNode(label));
  }

  function toggleBlocks() {
    if (scrollProgress > 0.1 || isMobile()) return;
    blocksOpen = !blocksOpen;
    blocksWrap.classList.toggle("open", blocksOpen);
    setCtaLabel(blocksOpen ? "Close" : "What it is");
  }

  function getStickyTop() {
    const value = getComputedStyle(document.documentElement).getPropertyValue("--header").trim();
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : 76;
  }

  function getStageHeight() {
    return window.innerHeight - getStickyTop();
  }

  function updateCopyWidth(xPct) {
    if (!copyEl || isMobile()) {
      if (copyEl) copyEl.style.maxWidth = "";
      return;
    }

    const stageH = getStageHeight();
    const radius = Math.min(stageH * 0.37, 340);
    const styles = getComputedStyle(copyEl);
    const padLeft = parseFloat(styles.paddingLeft) || 0;
    const padRight = parseFloat(styles.paddingRight) || 0;
    const stagePadLeft = parseFloat(getComputedStyle(stage).paddingLeft) || 0;
    const innerW = stage.clientWidth - stagePadLeft * 2;
    const bookCenterX = stagePadLeft + innerW * 0.5 + (xPct / 100) * innerW;
    const maxW = Math.round(bookCenterX - radius - 48);
    const clamped = Math.max(280, Math.min(maxW, innerW * 0.46));
    copyEl.style.maxWidth = `${clamped + padLeft + padRight}px`;
  }

  function progressForMobileStep(step) {
    if (step <= 0) return 0;
    if (step === 1) return 0.2;
    const idx = step - 1;
    const readP = (idx + 0.92) / pages.length;
    return 0.16 + 0.84 * readP;
  }

  function updateTapHint(step) {
    if (!tapHint) return;
    if (!isMobile()) {
      tapHint.hidden = true;
      tapHint.setAttribute("aria-hidden", "true");
      return;
    }
    tapHint.hidden = false;
    tapHint.removeAttribute("aria-hidden");
    tapHint.textContent =
      step <= 0 ? "Tap the book to open" : step >= pages.length ? "Tap to start again" : "Tap to turn the page";
  }

  function applyFrame(p, mobileMode = false) {
    if (p > 0.06 && blocksOpen) {
      blocksOpen = false;
      blocksWrap.classList.remove("open");
      setCtaLabel("What it is");
    }

    const introT = easeInOut(clamp(p / 0.18));
    const xPct = mobileMode ? 0 : lerp(0, 26, introT);
    const yVh = mobileMode ? 0 : lerp(-9, 0, introT);
    const scale = lerp(mobileMode ? 0.88 : 0.78, 1, introT);
    const circleScale = scale;

    if (mobileMode) {
      bookScene.style.transform = `translate(-50%, -50%) scale(${scale})`;
      circle.style.transform = `scale(${circleScale})`;
    } else {
      bookScene.style.transform = `translate(calc(-50% + ${xPct}vw), calc(-50% + ${yVh}vh)) scale(${scale})`;
      circle.style.transform = `translate(calc(-50% + ${xPct}vw), calc(-50% + ${yVh}vh)) scale(${circleScale})`;
    }

    updateCopyWidth(xPct);

    const heroFade = mobileMode ? (mobileStep <= 0 ? 1 : 1 - clamp(p / 0.12)) : 1 - clamp(p / 0.1);
    if (heroCap) {
      heroCap.style.opacity = heroFade;
      heroCap.style.transform = mobileMode ? "none" : `translateX(-50%) translateY(${-p * 40}px)`;
    }
    if (cue) cue.style.opacity = heroFade;
    if (tapHint && mobileMode) tapHint.style.opacity = mobileStep <= 0 ? 1 : 0.72;

    cta.style.opacity = heroFade;
    cta.style.pointerEvents = p > 0.05 ? "none" : "auto";

    const baseRotY = lerp(-16, -20, introT);
    book.style.transform = mobileMode
      ? `rotateY(${baseRotY}deg)`
      : `rotateY(${baseRotY + mx * 12}deg) rotateX(${6 - my * 9}deg)`;

    const openF = easeInOut(clamp((p - 0.06) / 0.14));
    const coverOpen = openF > 0.02;
    cover.style.transform = `translateZ(20px) rotateY(${-openF * 168}deg)`;
    cover.style.boxShadow = `${14 * (1 - openF)}px 22px 44px rgba(0,0,0,${0.28 * (1 - openF) + 0.04})`;

    pageBase.classList.toggle("show", coverOpen);

    const readP = clamp((p - 0.16) / (1 - 0.16));
    const pageCount = pages.length;
    const seg = readP * pageCount;
    const idx = Math.min(pageCount - 1, Math.floor(seg));
    const within = seg - idx;
    const flipStart = 0.22;
    const isFlipping = coverOpen && within > flipStart && idx < pageCount - 1 && p < 0.995;
    const flipProgress = isFlipping
      ? easeInOut(clamp((within - flipStart) / (1 - flipStart)))
      : 0;
    const panelIdx = !coverOpen ? 0 : isFlipping && flipProgress > 0.5 ? idx + 1 : idx;

    panels.forEach((pl, i) => pl.classList.toggle("active", i === panelIdx && coverOpen));

    if (!coverOpen) {
      turn.style.opacity = 0;
      turn.style.transform = "translateZ(17px) rotateY(0deg)";
      pageBase.dataset.pageIdx = "";
      renderPage(pageBase, 0);
    } else if (isFlipping) {
      renderPage(pageTurn, idx);
      turn.style.opacity = 1;
      turn.style.transform = `translateZ(18px) rotateY(${-flipProgress * 172}deg)`;
      turn.style.boxShadow = `inset ${18 * (1 - flipProgress)}px 0 24px -16px rgba(0,0,0,0.24), 2px 0 8px rgba(0,0,0,0.08)`;
      renderPage(pageBase, idx + 1);
    } else {
      turn.style.opacity = 0;
      turn.style.transform = "translateZ(17px) rotateY(0deg)";
      turn.style.boxShadow = "inset 18px 0 24px -16px rgba(0,0,0,0.24), 2px 0 8px rgba(0,0,0,0.08)";
      pageTurn.dataset.pageIdx = "";
      renderPage(pageBase, idx);
    }
  }

  function animateMobileToStep(targetStep) {
    const nextStep = clamp(targetStep, 0, pages.length);
    const fromP = mobileProgress;
    const toP = progressForMobileStep(nextStep);

    mobileStep = nextStep;
    updateTapHint(nextStep);

    if (MOBILE_FLIP_MS === 0) {
      mobileProgress = toP;
      applyFrame(mobileProgress, true);
      return;
    }

    mobileAnimating = true;
    const start = performance.now();

    const tick = (now) => {
      const t = clamp((now - start) / MOBILE_FLIP_MS);
      const eased = easeInOut(t);
      mobileProgress = lerp(fromP, toP, eased);
      applyFrame(mobileProgress, true);

      if (t < 1) {
        mobileAnimRaf = requestAnimationFrame(tick);
      } else {
        mobileProgress = toP;
        applyFrame(mobileProgress, true);
        mobileAnimating = false;
      }
    };

    cancelAnimationFrame(mobileAnimRaf);
    mobileAnimRaf = requestAnimationFrame(tick);
  }

  function advanceMobile() {
    if (mobileAnimating) return;
    if (mobileStep < pages.length) {
      animateMobileToStep(mobileStep + 1);
      return;
    }
    resetMobile();
  }

  function resetMobile() {
    cancelAnimationFrame(mobileAnimRaf);
    mobileAnimating = false;
    mobileStep = 0;
    mobileProgress = 0;
    applyFrame(0, true);
    updateTapHint(0);
  }

  function updatePinState() {
    if (isMobile()) {
      stage.classList.remove("is-pinned", "is-ended", "is-passed");
      return;
    }

    const stickyTop = getStickyTop();
    const stageHeight = getStageHeight();
    const rect = track.getBoundingClientRect();
    const scrollable = track.offsetHeight - stageHeight;
    const pinRelease = stickyTop + stageHeight;
    const passed = rect.bottom <= stickyTop;
    const beforePin = rect.top > stickyTop;
    const pinning = !passed && !beforePin && rect.bottom > pinRelease;

    stage.classList.toggle("is-passed", passed);
    stage.classList.toggle("is-pinned", pinning);
    stage.classList.toggle("is-ended", !passed && !beforePin && !pinning);

    if (passed) {
      scrollProgress = 1;
    } else if (beforePin) {
      scrollProgress = 0;
    } else if (pinning) {
      scrollProgress = scrollable > 0 ? clamp((stickyTop - rect.top) / scrollable) : 0;
    } else {
      scrollProgress = 1;
    }

    if (passed && !wasPassed) {
      window.dispatchEvent(new CustomEvent("hf-book-complete"));
    }
    wasPassed = passed;
  }

  function onScroll() {
    updatePinState();

    if (isMobile()) {
      running = false;
      return;
    }

    const rect = track.getBoundingClientRect();
    const inView = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inView && !running) {
      running = true;
      requestAnimationFrame(render);
    }
    if (!inView) {
      running = false;
    }
  }

  function render() {
    if (isMobile()) return;

    applyFrame(scrollProgress, false);

    const rect = track.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      requestAnimationFrame(render);
    } else {
      running = false;
    }
  }

  function onMobileModeChange() {
    cancelAnimationFrame(mobileAnimRaf);
    mobileAnimating = false;

    if (isMobile()) {
      running = false;
      resetMobile();
      book.setAttribute("role", "button");
      book.setAttribute("aria-label", "Open and flip through the book");
      book.tabIndex = 0;
      return;
    }

    book.removeAttribute("role");
    book.removeAttribute("aria-label");
    book.tabIndex = -1;
    if (tapHint) tapHint.hidden = true;
    scrollProgress = 0;
    onScroll();
    if (!reducedMotion) {
      running = true;
      requestAnimationFrame(render);
    }
  }

  cta.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBlocks();
  });

  book.addEventListener("click", () => {
    if (isMobile()) {
      advanceMobile();
      return;
    }
    if (scrollProgress < 0.1) toggleBlocks();
  });

  book.addEventListener("keydown", (e) => {
    if (!isMobile()) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      advanceMobile();
    }
  });

  let touchStartX = 0;
  book.addEventListener(
    "touchstart",
    (e) => {
      if (!isMobile()) return;
      touchStartX = e.touches[0].clientX;
    },
    { passive: true }
  );

  book.addEventListener(
    "touchend",
    (e) => {
      if (!isMobile() || mobileAnimating) return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) advanceMobile();
      else if (mobileStep > 0) animateMobileToStep(mobileStep - 1);
    },
    { passive: true }
  );

  root.addEventListener("mousemove", (e) => {
    if (isMobile()) return;
    const r = book.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    mx = clamp((e.clientX - cx) / (window.innerWidth / 2), -1, 1);
    my = clamp((e.clientY - cy) / (window.innerHeight / 2), -1, 1);
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  mobileQuery.addEventListener("change", onMobileModeChange);

  renderPage(pageBase, 0);
  setCtaLabel("What it is");
  onScroll();
  onMobileModeChange();

  if (!reducedMotion && !isMobile()) {
    running = true;
    requestAnimationFrame(render);
  } else if (reducedMotion && !isMobile()) {
    pageBase.classList.add("show");
    panels.forEach((pl, i) => pl.classList.toggle("active", i === 0));
    if (heroCap) heroCap.style.opacity = "1";
    if (cue) cue.style.opacity = "1";
    cta.style.opacity = "1";
  }
})();
