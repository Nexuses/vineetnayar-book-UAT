const root = document.documentElement;
const body = document.body;
const topbar = document.querySelector(".topbar");
const hero = document.querySelector("[data-hero]");
const movement = document.querySelector("[data-movement]");
const modal = document.getElementById("modal");

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const smootherStep = (value) => value * value * value * (value * (value * 6 - 15) + 10);

const videoModal = document.getElementById("videoModal");
const videoPlayer = document.getElementById("videoModalPlayer");
const videoSource = document.getElementById("videoModalSource");
const defaultFeaturedVideoCard = document.querySelector(".video-card.featured[data-youtube]");

function updateScroll() {
  const max = document.body.scrollHeight - window.innerHeight;
  root.style.setProperty("--scroll", max ? ((window.scrollY / max) * 100).toFixed(2) : 0);
  topbar?.classList.toggle("compact", window.scrollY > 80);

  if (hero) {
    const rect = hero.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    root.style.setProperty("--scrollHero", progress.toFixed(3));
  }

  if (movement) {
    const rect = movement.getBoundingClientRect();
    const progress = clamp(-rect.top / Math.max(1, rect.height - window.innerHeight), 0, 1);
    root.style.setProperty("--pMovement", smootherStep(progress).toFixed(3));
  }
}

window.addEventListener("scroll", updateScroll, { passive: true });
window.addEventListener("resize", updateScroll);
updateScroll();

function setCity(row) {
  document.querySelectorAll(".city-row").forEach((item) => item.classList.remove("active"));
  row.classList.add("active");
  document.getElementById("cityName").textContent = row.dataset.city;
  document.getElementById("cityDate").textContent = row.dataset.date;

  const video = document.getElementById("cityVideo");
  const source = document.getElementById("cityVideoSource");
  const deco = document.querySelector(".city-deco");
  if (video && source && row.dataset.video && source.src !== row.dataset.video) {
    source.src = row.dataset.video;
    video.load();
    video.play().catch(() => {});
  }
  if (deco) {
    if (row.dataset.image) {
      deco.setAttribute("src", row.dataset.image);
      deco.style.display = "block";
    } else {
      deco.removeAttribute("src");
      deco.style.display = "none";
    }
  }
}

document.querySelectorAll(".city-row").forEach((row) => {
  row.addEventListener("mouseenter", () => setCity(row));
  row.addEventListener("focus", () => setCity(row));
  row.addEventListener("click", () => setCity(row));
});

const initialCity = document.querySelector(".city-row.active");
if (initialCity) setCity(initialCity);

function makeDraggable(note) {
  let startX = 0;
  let startY = 0;
  let originX = 0;
  let originY = 0;
  let dragging = false;

  note.addEventListener("pointerdown", (event) => {
    const board = note.closest(".whiteboard");
    if (!board) return;
    dragging = true;
    note.setPointerCapture(event.pointerId);
    startX = event.clientX;
    startY = event.clientY;
    originX = note.offsetLeft;
    originY = note.offsetTop;
    note.style.zIndex = 50;
    note.style.cursor = "grabbing";
  });

  note.addEventListener("pointermove", (event) => {
    if (!dragging) return;
    const board = note.closest(".whiteboard");
    const maxX = Math.max(0, board.clientWidth - note.offsetWidth);
    const maxY = Math.max(0, board.clientHeight - note.offsetHeight);
    note.style.left = `${clamp(originX + event.clientX - startX, 0, maxX)}px`;
    note.style.top = `${clamp(originY + event.clientY - startY, 0, maxY)}px`;
  });

  note.addEventListener("pointerup", () => {
    dragging = false;
    note.style.zIndex = "";
    note.style.cursor = "";
  });
}

document.querySelectorAll(".sticky-note").forEach(makeDraggable);

document.getElementById("wallForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("wallText");
  const text = input.value.trim();
  if (!text) return;

  const board = document.getElementById("whiteboard");
  const note = document.createElement("div");
  note.className = "sticky-note";
  note.style.width = `${Math.min(300, Math.max(150, text.length * 8))}px`;
  note.style.minHeight = "112px";
  note.style.transform = `rotate(${-4 + Math.random() * 8}deg)`;
  note.innerHTML = `<div><span class="text">${text.replace(/[<>]/g, "")}</span><span class="author">You</span></div>`;
  board.appendChild(note);

  const maxLeft = Math.max(0, board.clientWidth - note.offsetWidth);
  const maxTop = Math.max(0, board.clientHeight - note.offsetHeight - 96);
  note.style.left = `${Math.random() * maxLeft}px`;
  note.style.top = `${Math.random() * maxTop}px`;

  makeDraggable(note);
  input.value = "";
});

const navToggle = document.querySelector("[data-nav-toggle]");
const mobileMenu = document.getElementById("mobileMenu");

function setBodyLock() {
  const anyOpen =
    mobileMenu?.classList.contains("open") ||
    modal?.classList.contains("open") ||
    videoModal?.classList.contains("open");
  body.classList.toggle("modal-open", !!anyOpen);
}

function openMobileMenu() {
  mobileMenu?.classList.add("open");
  mobileMenu?.setAttribute("aria-hidden", "false");
  navToggle?.setAttribute("aria-expanded", "true");
  setBodyLock();
}

function closeMobileMenu() {
  mobileMenu?.classList.remove("open");
  mobileMenu?.setAttribute("aria-hidden", "true");
  navToggle?.setAttribute("aria-expanded", "false");
  setBodyLock();
}

function openModal() {
  modal?.classList.add("open");
  modal?.setAttribute("aria-hidden", "false");
  setBodyLock();
}

function closeModal() {
  modal?.classList.remove("open");
  modal?.setAttribute("aria-hidden", "true");
  setBodyLock();
}

function openVideoModal(src) {
  if (!videoModal || !videoPlayer || !videoSource || !src) return;
  videoSource.src = src;
  videoPlayer.load();
  videoPlayer.play().catch(() => {});
  videoModal.classList.add("open");
  videoModal.setAttribute("aria-hidden", "false");
  setBodyLock();
}

function closeVideoModal() {
  if (!videoModal || !videoPlayer || !videoSource) return;
  videoModal.classList.remove("open");
  videoModal.setAttribute("aria-hidden", "true");
  setBodyLock();
  videoPlayer.pause();
  videoSource.src = "";
  videoPlayer.load();
}

function setFeaturedVideoCard(card) {
  document.querySelectorAll(".video-card[data-youtube]").forEach((item) => item.classList.remove("featured"));
  card.classList.add("featured");
}

document.querySelectorAll("[data-open-modal]").forEach((button) => {
  button.addEventListener("click", openModal);
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeModal);
});

document.querySelectorAll("[data-close-video-modal]").forEach((button) => {
  button.addEventListener("click", closeVideoModal);
});

modal?.addEventListener("click", (event) => {
  if (event.target === modal) closeModal();
});

videoModal?.addEventListener("click", (event) => {
  if (event.target === videoModal) closeVideoModal();
});

navToggle?.addEventListener("click", () => {
  if (mobileMenu?.classList.contains("open")) closeMobileMenu();
  else openMobileMenu();
});

document.querySelectorAll("[data-mobile-link]").forEach((link) => {
  link.addEventListener("click", closeMobileMenu);
});

const joinForm = document.getElementById("joinForm");
joinForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  if (!joinForm.checkValidity()) {
    joinForm.reportValidity();
    return;
  }
  joinForm.hidden = true;
  const success = document.getElementById("joinSuccess");
  if (success) success.hidden = false;
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeMobileMenu();
    closeModal();
    closeVideoModal();
  }
});

const mobileUI = window.matchMedia("(max-width: 820px)");

document.querySelectorAll(".video-card[data-youtube]").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    if (!mobileUI.matches) setFeaturedVideoCard(card);
  });
  card.addEventListener("focus", () => {
    if (!mobileUI.matches) setFeaturedVideoCard(card);
  });
  card.addEventListener("click", (event) => {
    if (mobileUI.matches) {
      if (event.target.closest(".play")) {
        event.stopPropagation();
        window.open(card.dataset.youtube, "_blank");
        return;
      }
      setFeaturedVideoCard(card);
      return;
    }
    window.open(card.dataset.youtube, "_blank");
  });
  card.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    if (mobileUI.matches) {
      setFeaturedVideoCard(card);
      return;
    }
    window.open(card.dataset.youtube, "_blank");
  });
});

document.querySelector(".video-grid")?.addEventListener("mouseleave", () => {
  if (mobileUI.matches || !defaultFeaturedVideoCard) return;
  setFeaturedVideoCard(defaultFeaturedVideoCard);
});

document.querySelectorAll("[data-accordion] .spark-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".spark-item");
    document.querySelectorAll("[data-accordion] .spark-item").forEach((spark) => {
      if (spark !== item) spark.classList.remove("open");
    });
    item?.classList.toggle("open");
  });
});

document.querySelectorAll("[data-manifesto] .manifesto-line").forEach((line) => {
  const activate = () => {
    document.querySelectorAll("[data-manifesto] .manifesto-line").forEach((item) => item.classList.remove("active"));
    line.classList.add("active");
  };
  line.addEventListener("mouseenter", activate);
  line.addEventListener("focus", activate);
});

document.querySelectorAll(".truth-panel").forEach((panel) => {
  panel.addEventListener("mouseenter", () => {
    document.querySelectorAll(".truth-panel").forEach((item) => item.classList.remove("active"));
    panel.classList.add("active");
  });
});

document.querySelectorAll(".magnetic").forEach((button) => {
  button.addEventListener("mousemove", (event) => {
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left - rect.width / 2;
    const y = event.clientY - rect.top - rect.height / 2;
    button.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px)`;
  });
  button.addEventListener("mouseleave", () => {
    button.style.transform = "";
  });
});

const nav = document.querySelector("[data-nav]");

window.addEventListener("pointermove", (event) => {
  root.style.setProperty("--cursor-x", `${event.clientX}px`);
  root.style.setProperty("--cursor-y", `${event.clientY}px`);

  if (nav) {
    const rect = nav.getBoundingClientRect();
    root.style.setProperty("--nav-glow-x", `${event.clientX - rect.left}px`);
    root.style.setProperty("--nav-glow-y", `${event.clientY - rect.top}px`);
  }
}, { passive: true });

const sectionLinks = Array.from(document.querySelectorAll("[data-section-link]"));
const linkedSections = sectionLinks
  .map((link) => document.getElementById(link.dataset.sectionLink))
  .filter(Boolean);

function setActiveNav() {
  const center = window.innerHeight * 0.35;
  let activeId = linkedSections[0]?.id;
  linkedSections.forEach((section) => {
    const rect = section.getBoundingClientRect();
    if (rect.top <= center && rect.bottom >= center) activeId = section.id;
  });
  sectionLinks.forEach((link) => link.classList.toggle("active", link.dataset.sectionLink === activeId));
}

window.addEventListener("scroll", setActiveNav, { passive: true });
window.addEventListener("resize", setActiveNav);
setActiveNav();

const mobileHeadingQuery = window.matchMedia("(max-width: 820px)");

function fitHandHighlights() {
  document.querySelectorAll(".hand-highlight").forEach((el) => {
    el.style.fontSize = "";
    el.removeAttribute("data-fit-size");
  });

  if (!mobileHeadingQuery.matches) return;

  document.querySelectorAll("main .hand-highlight").forEach((el) => {
    const container = el.parentElement;
    if (!container) return;

    el.style.whiteSpace = "nowrap";
    const maxWidth = container.clientWidth;
    let fontSize = parseFloat(getComputedStyle(el).fontSize) || 25;
    const minSize = 13;

    while (el.scrollWidth > maxWidth && fontSize > minSize) {
      fontSize -= 0.5;
      el.style.fontSize = `${fontSize}px`;
    }

    el.dataset.fitSize = String(fontSize);
  });
}

window.addEventListener("resize", fitHandHighlights);
mobileHeadingQuery.addEventListener("change", fitHandHighlights);
if (document.fonts?.ready) {
  document.fonts.ready.then(fitHandHighlights);
} else {
  fitHandHighlights();
}
window.addEventListener("load", fitHandHighlights);

document.querySelectorAll("[data-faq] .faq-item button").forEach((button) => {
  button.addEventListener("click", () => {
    const item = button.closest(".faq-item");
    const isOpen = item?.classList.contains("open");
    document.querySelectorAll("[data-faq] .faq-item").forEach((faq) => {
      faq.classList.remove("open");
      faq.querySelector("button")?.setAttribute("aria-expanded", "false");
    });
    if (!isOpen) {
      item?.classList.add("open");
      button.setAttribute("aria-expanded", "true");
    }
  });
});

document.querySelectorAll(".rail-card").forEach((card) => {
  card.addEventListener("mouseenter", () => {
    document.querySelectorAll(".rail-card").forEach((c) => c.classList.remove("featured"));
    card.classList.add("featured");
  });
});

document.querySelector(".experience-rail")?.addEventListener("mouseleave", () => {
  document.querySelectorAll(".rail-card").forEach((c) => c.classList.remove("featured"));
  document.querySelector(".rail-card:first-child")?.classList.add("featured");
});

document.querySelectorAll(".truth-panel, .video-card, .city-preview, .faq-item").forEach((item) => {
  item.classList.add("tilt-card");
  item.addEventListener("mousemove", (event) => {
    const rect = item.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    item.style.setProperty("--tilt-x", `${x * 4}deg`);
    item.style.setProperty("--tilt-y", `${y * -4}deg`);
  });
  item.addEventListener("mouseleave", () => {
    item.style.removeProperty("--tilt-x");
    item.style.removeProperty("--tilt-y");
  });
});
