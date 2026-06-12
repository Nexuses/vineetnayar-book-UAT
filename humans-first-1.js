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

  function setCtaLabel(label) {
    cta.textContent = "";
    const dot = document.createElement("span");
    dot.className = "dot";
    cta.appendChild(dot);
    cta.appendChild(document.createTextNode(label));
  }

  function toggleBlocks() {
    if (scrollProgress > 0.1) return;
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

  function updatePinState() {
    if (mobileQuery.matches) {
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
    const p = scrollProgress;

    if (p > 0.06 && blocksOpen) {
      blocksOpen = false;
      blocksWrap.classList.remove("open");
      setCtaLabel("What it is");
    }

    const introT = easeInOut(clamp(p / 0.18));
    const xPct = lerp(0, 26, introT);
    const yVh = lerp(-9, 0, introT);
    const scale = lerp(0.78, 1, introT);
    const circleScale = lerp(0.78, 1, introT);
    bookScene.style.transform = `translate(calc(-50% + ${xPct}vw), calc(-50% + ${yVh}vh)) scale(${scale})`;
    circle.style.transform = `translate(calc(-50% + ${xPct}vw), calc(-50% + ${yVh}vh)) scale(${circleScale})`;

    const heroFade = 1 - clamp(p / 0.1);
    if (heroCap) {
      heroCap.style.opacity = heroFade;
      heroCap.style.transform = `translateX(-50%) translateY(${-p * 40}px)`;
    }
    if (cue) cue.style.opacity = heroFade;
    cta.style.opacity = heroFade;
    cta.style.pointerEvents = p > 0.05 ? "none" : "auto";
    const baseRotY = lerp(-16, -20, introT);
    book.style.transform = `rotateY(${baseRotY + mx * 12}deg) rotateX(${6 - my * 9}deg)`;

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

    const rect = track.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < window.innerHeight) {
      requestAnimationFrame(render);
    } else {
      running = false;
    }
  }

  cta.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleBlocks();
  });

  book.addEventListener("click", () => {
    if (scrollProgress < 0.1) toggleBlocks();
  });

  root.addEventListener("mousemove", (e) => {
    const r = book.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    mx = clamp((e.clientX - cx) / (window.innerWidth / 2), -1, 1);
    my = clamp((e.clientY - cy) / (window.innerHeight / 2), -1, 1);
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  mobileQuery.addEventListener("change", onScroll);

  renderPage(pageBase, 0);
  setCtaLabel("What it is");
  onScroll();

  if (!reducedMotion) {
    running = true;
    requestAnimationFrame(render);
  } else {
    pageBase.classList.add("show");
    panels.forEach((pl, i) => pl.classList.toggle("active", i === 0));
    if (heroCap) heroCap.style.opacity = "1";
    if (cue) cue.style.opacity = "1";
    cta.style.opacity = "1";
  }
})();
