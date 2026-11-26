// src/scripts/rail.ts
const links = document.querySelectorAll<HTMLElement>('[data-rail-link]');
const io = new IntersectionObserver(
  (entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      links.forEach((l) =>
        l.setAttribute('aria-current', String(l.dataset.railLink === e.target.id)),
      );
    }
  },
  { rootMargin: '-40% 0px -55% 0px' },
);
document.querySelectorAll('section[id]').forEach((s) => io.observe(s));
