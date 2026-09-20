'use strict';

document.addEventListener('DOMContentLoaded', () => {
  initHamburger();
  initScrollReveal();
  initStatCounters();
});

function initHamburger() {
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.getElementById('navLinks');

  if (!hamburger || !navLinks) {
    return;
  }

  hamburger.addEventListener('click', () => {
    const isOpen = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', isOpen);
    hamburger.setAttribute('aria-expanded', String(isOpen));
  });

  navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    });
  });

  document.addEventListener('click', (event) => {
    if (!hamburger.contains(event.target) && !navLinks.contains(event.target)) {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
      hamburger.setAttribute('aria-expanded', 'false');
    }
  });
}

function initScrollReveal() {
  const cards = document.querySelectorAll('.card, .mv-card, .team-card, .stat__num, .appointment-card, .appointments-empty');

  if (!cards.length || !('IntersectionObserver' in window)) {
    return;
  }

  cards.forEach((card) => {
    card.style.opacity = '0';
    card.style.transform = 'translateY(28px)';
    card.style.transition = 'opacity 0.55s ease, transform 0.55s ease';
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      const siblings = Array.from(entry.target.parentElement?.children ?? []);
      const index = siblings.indexOf(entry.target);
      const delay = Math.min(index * 80, 320);

      window.setTimeout(() => {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }, delay);

      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12 });

  cards.forEach((card) => observer.observe(card));
}

function initStatCounters() {
  const statNumbers = document.querySelectorAll('.stat__num');

  if (!statNumbers.length || !('IntersectionObserver' in window)) {
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      observer.unobserve(entry.target);

      const element = entry.target;
      const rawText = element.textContent ?? '';
      const match = rawText.match(/[\d,.]+/);

      if (!match) {
        return;
      }

      const suffix = rawText.replace(match[0], '');
      const targetValue = Number.parseFloat(match[0].replace(/,/g, ''));
      const isFloat = match[0].includes('.');
      const duration = 1400;
      const start = performance.now();

      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = 1 - Math.pow(1 - progress, 3);
        const currentValue = targetValue * easedProgress;

        if (isFloat) {
          element.textContent = `${currentValue.toFixed(1)}${suffix}`;
        } else if (targetValue >= 1000) {
          element.textContent = `${Math.floor(currentValue).toLocaleString('en-IN')}${suffix}`;
        } else {
          element.textContent = `${Math.floor(currentValue)}${suffix}`;
        }

        if (progress < 1) {
          window.requestAnimationFrame(tick);
        }
      }

      window.requestAnimationFrame(tick);
    });
  }, { threshold: 0.5 });

  statNumbers.forEach((statNumber) => observer.observe(statNumber));
}
