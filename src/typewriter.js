const phrases = {
  tr: [
    "Gerçekten çalışan YZ inşa ediyorum.",
    "Yeni teknolojileri takip ediyorum.",
    "Sürekli kendimi geliştiriyorum.",
    "Akademik makaleleri inceliyorum."
  ],
  en: [
    "Building AI that actually ships.",
    "Following cutting-edge tech.",
    "Continuously learning new things.",
    "Exploring academic literature."
  ]
};

let phraseIndex = 0;
let charIndex = 0;
let isDeleting = false;
let typeElement;

function typeLoop() {
  const currentLang = localStorage.getItem('portfolio-lang') || 'tr';
  const currentPhrases = phrases[currentLang] || phrases['tr'];
  
  if (phraseIndex >= currentPhrases.length) {
    phraseIndex = 0;
  }
  
  let currentText = currentPhrases[phraseIndex];
  
  // Safe bounds check in case language switches mid-typing
  if (charIndex > currentText.length) {
    charIndex = currentText.length;
  }
  
  if (isDeleting) {
    charIndex--;
  } else {
    charIndex++;
  }
  
  // Create HTML representation safely (could use innerHTML if adding tags, but textContent is safer for pure text)
  typeElement.textContent = currentText.substring(0, charIndex);
  
  let typeSpeed = isDeleting ? 30 : 60;
  
  if (!isDeleting && charIndex === currentText.length) {
    typeSpeed = 2500; // Pause at the end of typing a phrase
    isDeleting = true;
  } else if (isDeleting && charIndex === 0) {
    isDeleting = false;
    phraseIndex = (phraseIndex + 1) % currentPhrases.length;
    typeSpeed = 400; // Pause before typing next phrase
  }
  
  setTimeout(typeLoop, typeSpeed);
}

document.addEventListener('DOMContentLoaded', () => {
  typeElement = document.getElementById('typewriter-text');
  if (!typeElement) return;

  // Honor reduced-motion: show the first phrase statically, no typing loop.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const lang = localStorage.getItem('portfolio-lang') || 'tr';
    typeElement.textContent = (phrases[lang] || phrases.tr)[0];
    return;
  }

  // Start typing after a short delay
  setTimeout(typeLoop, 500);
});
