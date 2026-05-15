// i18n.js — TR/EN toggle using data-en attributes
// TR content lives in element innerHTML; EN in data-en attribute.
// On first switch to EN, TR is cached in data-tr.

function setLang(lang) {
  document.documentElement.lang = lang;
  localStorage.setItem('portfolio-lang', lang);

  document.querySelectorAll('[data-en]').forEach(el => {
    if (lang === 'en') {
      if (!el.dataset.tr) el.dataset.tr = el.innerHTML;
      el.innerHTML = el.dataset.en;
    } else {
      if (el.dataset.tr) el.innerHTML = el.dataset.tr;
    }
  });

  const btn = document.getElementById('lang-toggle');
  if (btn) btn.textContent = lang === 'tr' ? 'EN' : 'TR';
}

document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('portfolio-lang') || 'tr';
  setLang(saved);
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    setLang(document.documentElement.lang === 'tr' ? 'en' : 'tr');
  });


});
