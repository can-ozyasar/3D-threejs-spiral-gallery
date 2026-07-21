import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// ---------------------------------------------------------------------------
// Lenis smooth scrolling — wired before WebGL so the page feels smooth from
// the first interaction even while textures stream in.
// ---------------------------------------------------------------------------

const lenis = new Lenis({
  duration: 1.2,
  smoothWheel: true,
  smoothTouch: false,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

// Keep ScrollTrigger in sync with Lenis so reveals fire at the right scroll
// positions even though Lenis is interpolating wheel events.
lenis.on('scroll', ScrollTrigger.update);

function lenisRaf(time) {
  lenis.raf(time);
  requestAnimationFrame(lenisRaf);
}
requestAnimationFrame(lenisRaf);

// Handle direct hash navigation from external pages (e.g. blog.html → /#makaleler).
// Wait until the complete layout exists; calculating the target before the
// WebGL hero and images settle can leave a deep link on an empty viewport.
function restoreHashLocation() {
  if (!window.location.hash) return;
  const target = document.querySelector(window.location.hash);
  if (target) lenis.scrollTo(target, { immediate: true, offset: -96 });
}
window.addEventListener('load', () => requestAnimationFrame(restoreHashLocation), { once: true });

const projectGrid = document.querySelector('.field__grid[data-project-view]');
const projectTabs = document.querySelectorAll('[data-project-tab]');

projectTabs.forEach((tab) => {
  tab.addEventListener('click', () => {
    const nextView = tab.dataset.projectTab;
    if (!projectGrid || !nextView) return;

    projectGrid.dataset.projectView = nextView;
    projectTabs.forEach((button) => {
      const isActive = button === tab;
      button.classList.toggle('is-active', isActive);
      button.setAttribute('aria-selected', String(isActive));
    });

    ScrollTrigger.refresh();
  });
});


// ---------------------------------------------------------------------------
// Scroll reveals — slow, cinematic fade-up for every `.reveal-text` block
// below the hero. Each element gets its own ScrollTrigger so the reveals
// stagger naturally with how the user scrolls, not on a fixed clock.
//
// Project is vanilla JS, but we still wrap in `gsap.context()` so all
// triggers can be reverted as a group when Vite hot-reloads this module —
// otherwise duplicates would pile up on every save.
// ---------------------------------------------------------------------------

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const revealCtx = gsap.context(() => {
  if (prefersReducedMotion) return;
  gsap.utils.toArray('.reveal-text').forEach((el) => {
    gsap.fromTo(
      el,
      { opacity: 0, y: 50 },
      {
        opacity: 1,
        y: 0,
        duration: 1.4,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 80%',
          toggleActions: 'play none none none',
          // once it's revealed, leave it alone — feels less like a UI gimmick
          once: true,
        },
      }
    );
  });
});

// Recompute trigger positions once everything (fonts, images, WebGL) has
// fully loaded so the reveal "top 80%" lines up with the final layout.
window.addEventListener('load', () => ScrollTrigger.refresh());

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    revealCtx.revert();
  });
}
