(() => {
  document.documentElement.classList.add("js");

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const header = document.querySelector(".site-header");
  const revealItems = document.querySelectorAll(".reveal");

  const updateHeader = () => {
    header?.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  if (reduceMotion) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    document.querySelectorAll("video[autoplay]").forEach((video) => {
      video.autoplay = false;
      video.pause();
    });
  } else if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );

    revealItems.forEach((item) => observer.observe(item));

    window.setTimeout(() => {
      revealItems.forEach((item) => item.classList.add("is-visible"));
    }, 1600);
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }

  document.querySelectorAll("[data-preview-video]").forEach((video) => {
    const media = video.closest("a");
    if (!media) return;

    const playPreview = () => {
      media.classList.add("is-playing");
      video.play().catch(() => media.classList.remove("is-playing"));
    };

    const stopPreview = () => {
      media.classList.remove("is-playing");
      video.pause();
    };

    media.addEventListener("pointerenter", playPreview);
    media.addEventListener("pointerleave", stopPreview);
    media.addEventListener("focus", playPreview);
    media.addEventListener("blur", stopPreview);
  });

  const year = document.querySelector("[data-current-year]");
  if (year) year.textContent = String(new Date().getFullYear());
})();
