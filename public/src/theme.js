// theme.js — Saha Defteri kimliğiyle site tek aydınlık temaya geçti.
// Eski koyu/açık toggle kaldırıldı; bu modül geriye kalan sayfalardaki
// (blog.html, hr.html, projects.html) toggle düğmesini gizler ve eski
// localStorage tercihinin karanlık temayı geri getirmesini engeller.

const STORAGE_KEY = 'portfolio-theme';

document.documentElement.classList.add('theme-light');

try {
  localStorage.setItem(STORAGE_KEY, 'light');
} catch (e) {
  /* storage kapalıysa da tema zaten aydınlık */
}

document.addEventListener('DOMContentLoaded', () => {
  const btn = document.getElementById('theme-toggle');
  if (btn) btn.hidden = true;
});
