(() => {
  "use strict";

  document.documentElement.classList.add("js");

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const progress = document.querySelector("#reading-progress");
  const menuButton = document.querySelector(".menu-toggle");
  const chapterNav = document.querySelector("#chapter-nav");
  const navLinks = [...document.querySelectorAll(".chapter-nav a")];
  const trackedSections = navLinks
    .map((link) => link.getAttribute("href")?.startsWith("#")
      ? document.querySelector(link.getAttribute("href"))
      : null)
    .filter(Boolean);

  function updateReadingProgress() {
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = documentHeight > 0 ? window.scrollY / documentHeight : 0;
    if (progress) progress.style.width = `${Math.min(100, Math.max(0, ratio * 100))}%`;
  }

  let progressQueued = false;
  window.addEventListener("scroll", () => {
    if (progressQueued) return;
    progressQueued = true;
    window.requestAnimationFrame(() => {
      updateReadingProgress();
      progressQueued = false;
    });
  }, { passive: true });
  updateReadingProgress();

  menuButton?.addEventListener("click", () => {
    const open = menuButton.getAttribute("aria-expanded") === "true";
    menuButton.setAttribute("aria-expanded", String(!open));
    chapterNav.classList.toggle("open", !open);
    menuButton.lastElementChild.textContent = open ? "+" : "−";
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      chapterNav.classList.remove("open");
      menuButton?.setAttribute("aria-expanded", "false");
      if (menuButton?.lastElementChild) menuButton.lastElementChild.textContent = "+";
    });
  });

  const revealTargets = document.querySelectorAll(".section-reveal, .poverty-shift, .bar-compare, .age-chart, .risk-scale");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealTargets.forEach((element) => element.classList.add("section-visible"));
  } else {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("section-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -7%" });
    revealTargets.forEach((element) => revealObserver.observe(element));
  }

  function formatMetric(value, decimals, suffix) {
    return `${new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value)}${suffix}`;
  }

  const metricTargets = document.querySelectorAll("[data-count]");
  const animateMetric = (element) => {
    if (element.dataset.animated === "true") return;
    element.dataset.animated = "true";
    const target = Number(element.dataset.count);
    const decimals = Number(element.dataset.decimals || 0);
    const suffix = element.dataset.suffix || "";

    if (reducedMotion) {
      element.textContent = formatMetric(target, decimals, suffix);
      return;
    }

    const duration = 1150;
    const startedAt = performance.now();
    const tick = (now) => {
      const elapsed = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - Math.pow(1 - elapsed, 3);
      element.textContent = formatMetric(target * eased, decimals, suffix);
      if (elapsed < 1) window.requestAnimationFrame(tick);
    };
    window.requestAnimationFrame(tick);
  };

  if (reducedMotion || !("IntersectionObserver" in window)) {
    metricTargets.forEach(animateMetric);
  } else {
    const metricObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateMetric(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.7 });
    metricTargets.forEach((element) => metricObserver.observe(element));
  }

  if ("IntersectionObserver" in window) {
    const currentChapterObserver = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      navLinks.forEach((link) => {
        const active = link.getAttribute("href") === `#${visible.target.id}`;
        if (active) link.setAttribute("aria-current", "true");
        else link.removeAttribute("aria-current");
      });
    }, { threshold: [0.18, 0.35, 0.55], rootMargin: "-15% 0px -58%" });
    trackedSections.forEach((section) => currentChapterObserver.observe(section));
  }

  if (!reducedMotion) {
    const parallaxElements = [...document.querySelectorAll("[data-parallax]")];
    let parallaxQueued = false;
    window.addEventListener("scroll", () => {
      if (parallaxQueued || window.scrollY > window.innerHeight * 1.4) return;
      parallaxQueued = true;
      window.requestAnimationFrame(() => {
        parallaxElements.forEach((element) => {
          const strength = Number(element.dataset.parallax || 0);
          element.style.transform = `translate3d(0, ${window.scrollY * strength}px, 0)`;
        });
        parallaxQueued = false;
      });
    }, { passive: true });
  }
})();
