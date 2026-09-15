(() => {
  'use strict';

  const initialize = () => {
    const header = document.querySelector('.site-header');
    const menuToggle = document.querySelector('.menu-toggle');
    const navigation = document.getElementById('primary-nav');
    const backToTop = document.querySelector('.back-to-top');
    const mobileViewport = window.matchMedia('(max-width: 900px)');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const onMediaChange = (query, callback) => {
      if (query.addEventListener) query.addEventListener('change', callback);
      else query.addListener(callback);
    };

    const setMenuOpen = (open, restoreFocus = false) => {
      if (!menuToggle || !navigation) return;
      const isOpen = open && mobileViewport.matches;
      navigation.classList.toggle('is-open', isOpen);
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
      if (restoreFocus) menuToggle.focus();
    };

    if (menuToggle && navigation) {
      menuToggle.setAttribute('aria-controls', navigation.id);
      setMenuOpen(false);
      menuToggle.addEventListener('click', () => {
        setMenuOpen(menuToggle.getAttribute('aria-expanded') !== 'true');
      });
      navigation.addEventListener('click', (event) => {
        if (event.target.closest('a')) setMenuOpen(false);
      });
      document.addEventListener('click', (event) => {
        if (!navigation.contains(event.target) && !menuToggle.contains(event.target)) {
          setMenuOpen(false);
        }
      });
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menuToggle.getAttribute('aria-expanded') === 'true') {
          setMenuOpen(false, true);
        }
      });
      onMediaChange(mobileViewport, () => setMenuOpen(false));
    }

    document.querySelectorAll('[data-current-year]').forEach((element) => {
      element.textContent = String(new Date().getFullYear());
    });

    const sectionLinks = Array.from(document.querySelectorAll('.nav-link'))
      .map((link) => {
        const href = link.getAttribute('href') || '';
        const section = /^#(home|services|about|contact)$/.test(href)
          ? document.getElementById(href.slice(1))
          : null;
        return { link, section };
      })
      .filter(({ section }) => section);

    let activeSection = null;
    let framePending = false;

    const updateScrollState = () => {
      framePending = false;
      const scrollY = window.scrollY;
      header?.classList.toggle('is-scrolled', scrollY > 16);

      if (backToTop) {
        const isVisible = scrollY > 650;
        backToTop.hidden = !isVisible;
        backToTop.classList.toggle('is-visible', isVisible);
      }

      // Follow the section nearest the reading area below the fixed header.
      const readingLine = (header?.getBoundingClientRect().bottom || 0)
        + Math.min(window.innerHeight * 0.2, 160);
      let currentSection = sectionLinks[0]?.section.id;
      sectionLinks.forEach(({ section }) => {
        if (section.getBoundingClientRect().top <= readingLine) currentSection = section.id;
      });

      if (currentSection !== activeSection) {
        activeSection = currentSection;
        sectionLinks.forEach(({ link, section }) => {
          const isActive = section.id === activeSection;
          link.classList.toggle('is-active', isActive);
          if (isActive) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      }
    };

    const scheduleScrollUpdate = () => {
      if (framePending) return;
      framePending = true;
      window.requestAnimationFrame(updateScrollState);
    };

    window.addEventListener('scroll', scheduleScrollUpdate, { passive: true });
    window.addEventListener('resize', scheduleScrollUpdate, { passive: true });
    window.addEventListener('load', scheduleScrollUpdate, { once: true });
    window.addEventListener('hashchange', scheduleScrollUpdate);
    updateScrollState();

    const revealElements = Array.from(document.querySelectorAll('.reveal'));
    let revealObserver;
    const reveal = (element) => {
      element.classList.add('is-visible');
      element.classList.remove('reveal-pending');
      revealObserver?.unobserve(element);
    };
    const revealAll = () => {
      revealElements.forEach(reveal);
      revealObserver?.disconnect();
    };

    // Content stays visible by default; only offscreen content gains an entrance animation.
    if (!reducedMotion.matches && 'IntersectionObserver' in window) {
      revealObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) reveal(entry.target);
        });
      }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

      revealElements.forEach((element) => {
        if (element.getBoundingClientRect().top >= window.innerHeight) {
          element.classList.add('reveal-pending');
          revealObserver.observe(element);
        } else reveal(element);
      });
    } else revealAll();

    // Keyboard navigation must never land inside visually hidden content.
    document.addEventListener('focusin', (event) => {
      let element = event.target.closest('.reveal');
      while (element) {
        reveal(element);
        element = element.parentElement?.closest('.reveal');
      }
    });

    onMediaChange(reducedMotion, () => {
      if (reducedMotion.matches) revealAll();
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize, { once: true });
  } else initialize();
})();
