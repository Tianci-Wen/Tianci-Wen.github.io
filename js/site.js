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

  const starBadges = [...document.querySelectorAll("[data-github-stars][data-repo]")];
  if (starBadges.length) {
    const cacheKey = "tw-github-stars-v1";
    const cacheTtl = 12 * 60 * 60 * 1000;
    let starCache = {};

    try {
      starCache = JSON.parse(localStorage.getItem(cacheKey) || "{}");
    } catch {
      starCache = {};
    }

    const renderStars = (repo, display, exactCount) => {
      starBadges
        .filter((badge) => badge.dataset.repo === repo)
        .forEach((badge) => {
          const value = badge.querySelector("[data-star-count]");
          if (value) value.textContent = display;
          badge.title = exactCount
            ? `${exactCount.toLocaleString("en-US")} GitHub stars`
            : `${display} GitHub stars`;
        });
    };

    const persistCache = () => {
      try {
        localStorage.setItem(cacheKey, JSON.stringify(starCache));
      } catch {
        // The server-rendered fallback remains when storage is unavailable.
      }
    };

    const compactCount = (count) => new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1
    }).format(count).toLowerCase();

    const fetchJson = async (url, options = {}) => {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 8000);
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
          ...options
        });
        if (!response.ok) return null;
        return await response.json();
      } catch {
        return null;
      } finally {
        window.clearTimeout(timeout);
      }
    };

    const refreshStars = async (repo) => {
      const shieldData = await fetchJson(`https://img.shields.io/github/stars/${repo}.json`);
      const shieldValue = String(shieldData?.message || "").trim().toLowerCase();

      if (/^\d[\d,.]*[km]?$/.test(shieldValue)) {
        starCache[repo] = { display: shieldValue, updatedAt: Date.now() };
        renderStars(repo, shieldValue);
        persistCache();
        return;
      }

      const githubData = await fetchJson(`https://api.github.com/repos/${repo}`, {
        headers: { Accept: "application/vnd.github+json" }
      });
      const exactCount = githubData?.stargazers_count;
      if (!Number.isFinite(exactCount)) return;

      const display = compactCount(exactCount);
      starCache[repo] = { display, exactCount, updatedAt: Date.now() };
      renderStars(repo, display, exactCount);
      persistCache();
    };

    [...new Set(starBadges.map((badge) => badge.dataset.repo))].forEach((repo) => {
      const cached = starCache[repo];
      if (cached?.display) {
        renderStars(repo, cached.display, cached.exactCount);
      }
      if (!Number.isFinite(cached?.updatedAt) || Date.now() - cached.updatedAt > cacheTtl) {
        refreshStars(repo);
      }
    });
  }
})();
