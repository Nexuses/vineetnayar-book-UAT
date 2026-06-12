function getRevealGroup(element) {
  return (
    element.closest("section") ||
    element.closest(".wall-section") ||
    element.closest(".movement-sticky") ||
    element.parentElement
  );
}

function showReveals(elements) {
  elements.forEach((element) => {
    if (element.classList.contains("on")) return;
    element.classList.add("on");
    element.style.opacity = "";
    element.style.transform = "";
  });
}

function revealInViewport() {
  document.querySelectorAll(".reveal:not(.on)").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const visible = rect.top < window.innerHeight * 0.98 && rect.bottom > 0;
    if (visible) showReveals([element]);
  });
}

function initRevealGroups() {
  const groups = new Map();

  document.querySelectorAll(".reveal").forEach((element) => {
    if (element.classList.contains("on")) return;

    const group = getRevealGroup(element);
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push(element);
  });

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const reveals = groups.get(entry.target);
        if (reveals?.length) showReveals(reveals);

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.05, rootMargin: "0px 0px 0px 0px" }
  );

  groups.forEach((reveals, group) => {
    if (!reveals.length) return;
    observer.observe(group);
  });
}

initRevealGroups();
revealInViewport();

window.addEventListener("scroll", revealInViewport, { passive: true });
window.addEventListener("resize", revealInViewport);
window.addEventListener("hf-book-complete", revealInViewport);
window.addEventListener("load", revealInViewport);
