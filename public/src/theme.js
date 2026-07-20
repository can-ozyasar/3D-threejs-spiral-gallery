// theme.js — light / dark theme toggle with localStorage persistence.
//
// The light palette already lives in overrides.css under `html.theme-light`.
// This module is the missing wiring: it adds/removes that class and remembers
// the choice. The initial class is applied by a tiny inline <head> script on
// each page (so there is no flash of the wrong theme before this module loads).

const STORAGE_KEY = 'portfolio-theme';

// Icons show the theme you will switch TO, so the action reads clearly.
const ICONS = {
  // In dark mode → show a sun (click = go light)
  dark: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>`,
  // In light mode → show a moon (click = go dark)
  light: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>`,
};

const LABELS = {
  tr: { light: 'Koyu temaya geç', dark: 'Açık temaya geç' },
  en: { light: 'Switch to dark theme', dark: 'Switch to light theme' },
};

function currentTheme() {
  return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
}

function render() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;
  const theme = currentTheme();
  const lang = document.documentElement.lang === 'en' ? 'en' : 'tr';
  btn.innerHTML = ICONS[theme];
  btn.setAttribute('aria-label', LABELS[lang][theme]);
  btn.setAttribute('aria-pressed', String(theme === 'light'));
}

function setTheme(theme) {
  document.documentElement.classList.toggle('theme-light', theme === 'light');
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    /* storage unavailable (private mode) — theme still applies for this session */
  }
  render();
}

document.addEventListener('DOMContentLoaded', () => {
  render();
  document
    .getElementById('theme-toggle')
    ?.addEventListener('click', () =>
      setTheme(currentTheme() === 'light' ? 'dark' : 'light')
    );

  // Keep the button's aria-label in the right language when TR/EN is toggled.
  document
    .getElementById('lang-toggle')
    ?.addEventListener('click', () => setTimeout(render, 60));
});
