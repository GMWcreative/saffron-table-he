const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => [...context.querySelectorAll(selector)];

const menuButton = $('.menu-toggle');
const mainNav = $('.main-nav');

const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const isWebContext = location.protocol === 'http:' || location.protocol === 'https:';

let navigationLockHash = '';
let navigationLockTimer;

/*
 * The social journal is now a static four-card layout.
 * This also stops an old marquee track if its markup or CSS
 * is still present while updating the project.
 */
$$('.social-marquee-track').forEach((track) => {
  track.style.setProperty('animation', 'none', 'important');
  track.style.setProperty('transform', 'none', 'important');
  track.style.removeProperty('will-change');
});

if (isWebContext) {
  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = 'manifest.webmanifest';
  document.head.append(manifest);
}

const setActiveNavigation = (hash) => {
  $$('.main-nav a[href^="#"], .mobile-dock a[href^="#"]').forEach((item) => {
    item.classList.toggle('active', item.hash === hash);
  });
};

const lockNavigationOn = (hash) => {
  navigationLockHash = hash;
  clearTimeout(navigationLockTimer);

  const releaseNavigationLock = () => {
    if (navigationLockHash !== hash) return;

    navigationLockHash = '';
    setActiveNavigation(hash);
  };

  if ('onscrollend' in window) {
    addEventListener('scrollend', releaseNavigationLock, { once: true });
  }

  navigationLockTimer = setTimeout(
    releaseNavigationLock,
    prefersReducedMotion.matches ? 100 : 2600
  );
};

$$('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const hash = link.getAttribute('href');
    if (!hash || hash === '#') return;

    const target = $(hash);
    if (!target) return;

    event.preventDefault();

    const headerOffset = hash === '#top' ? 0 : 104;
    const top = hash === '#top'
      ? 0
      : target.getBoundingClientRect().top + scrollY - headerOffset;

    lockNavigationOn(hash);
    setActiveNavigation(hash);

    window.scrollTo({
      top,
      behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
    });

    if (isWebContext) {
      history.pushState(null, '', hash);
    }
  });
});

menuButton?.addEventListener('click', () => {
  const isOpen = menuButton.getAttribute('aria-expanded') === 'true';

  menuButton.setAttribute('aria-expanded', String(!isOpen));
  mainNav?.classList.toggle('open', !isOpen);
});

$$('.main-nav a').forEach((link) => {
  link.addEventListener('click', () => {
    mainNav?.classList.remove('open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

const revealElements = () => {
  $$('.reveal').forEach((element) => {
    if (element.getBoundingClientRect().top < innerHeight * 0.88) {
      element.classList.add('visible');
    }
  });
};

addEventListener('scroll', revealElements, { passive: true });
revealElements();

const productCards = $$('.product-card');
const categoryButtons = $$('.categories button');
const searchInput = $('.search input');
const searchButton = $('.search button');

const filterProducts = ({ category = 'all', query = '' } = {}) => {
  const normalizedQuery = query.trim().toLocaleLowerCase('he');

  productCards.forEach((card) => {
    const matchesCategory =
      category === 'all' || card.dataset.category === category;

    const matchesQuery =
      !normalizedQuery ||
      card.textContent.toLocaleLowerCase('he').includes(normalizedQuery);

    card.hidden = !(matchesCategory && matchesQuery);
  });
};

categoryButtons.forEach((button) => {
  button.addEventListener('click', () => {
    categoryButtons.forEach((item) => item.classList.remove('active'));
    button.classList.add('active');

    filterProducts({
      category: button.dataset.filter,
      query: searchInput?.value || ''
    });
  });
});

const runSearch = () => {
  if (!searchInput) return;

  categoryButtons.forEach((item) => {
    item.classList.toggle('active', item.dataset.filter === 'all');
  });

  filterProducts({ query: searchInput.value });

  $('#menu')?.scrollIntoView({
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth',
    block: 'start'
  });
};

searchInput?.addEventListener('input', () => {
  filterProducts({ query: searchInput.value });
});

searchInput?.addEventListener('keydown', (event) => {
  if (event.key === 'Enter') runSearch();
});

searchButton?.addEventListener('click', runSearch);

const toast = $('.toast');
let toastTimer;

const showToast = (message) => {
  if (!toast) return;

  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');

  toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 1800);
};

$$('[data-add]').forEach((button) => {
  button.addEventListener('click', () => {
    const originalText = button.textContent;

    button.textContent = 'נוסף ✓';
    showToast('המנה נוספה להזמנה');

    setTimeout(() => {
      button.textContent = originalText;
    }, 1800);
  });
});

const testimonials = $$('.testimonial-track article');
const testimonialTrack = $('[data-track]');
const reviewCurrent = $('[data-review-current]');

let testimonialIndex = 1;
let testimonialTimer;

const selectTestimonial = (nextIndex) => {
  if (!testimonials.length) return;

  testimonialIndex =
    (nextIndex + testimonials.length) % testimonials.length;

  testimonials.forEach((card, index) => {
    card.classList.toggle('active', index === testimonialIndex);
  });

  if (reviewCurrent) {
    reviewCurrent.textContent =
      String(testimonialIndex + 1).padStart(2, '0');
  }

  const activeCard = testimonials[testimonialIndex];
  if (!activeCard || !testimonialTrack) return;

  const trackRect = testimonialTrack.getBoundingClientRect();
  const cardRect = activeCard.getBoundingClientRect();

  const horizontalDelta =
    cardRect.left -
    trackRect.left -
    (trackRect.width - cardRect.width) / 2;

  testimonialTrack.scrollBy({
    left: horizontalDelta,
    behavior: prefersReducedMotion.matches ? 'auto' : 'smooth'
  });
};

$('[data-next]')?.addEventListener('click', () => {
  selectTestimonial(testimonialIndex + 1);
});

$('[data-prev]')?.addEventListener('click', () => {
  selectTestimonial(testimonialIndex - 1);
});

const testimonialSection = $('.testimonials');

const startTestimonialAutoplay = () => {
  if (prefersReducedMotion.matches || !testimonials.length) return;

  clearInterval(testimonialTimer);

  testimonialTimer = setInterval(() => {
    selectTestimonial(testimonialIndex + 1);
  }, 5600);
};

const stopTestimonialAutoplay = () => {
  clearInterval(testimonialTimer);
};

testimonialSection?.addEventListener(
  'pointerenter',
  stopTestimonialAutoplay
);

testimonialSection?.addEventListener(
  'pointerleave',
  startTestimonialAutoplay
);

testimonialSection?.addEventListener(
  'focusin',
  stopTestimonialAutoplay
);

testimonialSection?.addEventListener(
  'focusout',
  startTestimonialAutoplay
);

startTestimonialAutoplay();

const videoModal = $('.video-modal');

$('[data-video]')?.addEventListener('click', () => {
  videoModal?.showModal();
});

$('.video-modal > button')?.addEventListener('click', () => {
  videoModal?.close();
});

$('[data-close-modal]')?.addEventListener('click', () => {
  videoModal?.close();
});

videoModal?.addEventListener('click', (event) => {
  if (event.target === videoModal) {
    videoModal.close();
  }
});

const socialSection = $('.social-studio');
const socialCallToAction = $('.social-cta');

$$('[data-platform]').forEach((button) => {
  button.addEventListener('click', () => {
    const platform = button.dataset.platform;

    $$('[data-platform]').forEach((item) => {
      const isActive = item === button;

      item.classList.toggle('active', isActive);
      item.setAttribute('aria-pressed', String(isActive));
    });

    if (socialSection) {
      socialSection.dataset.platform = platform;
    }

    if (socialCallToAction) {
      socialCallToAction.href = platform === 'tiktok'
        ? 'https://www.tiktok.com/'
        : 'https://www.instagram.com/';

      socialCallToAction.firstChild.textContent =
        platform === 'tiktok'
          ? 'עברו ל־TikTok '
          : 'עקבו אחרי הסיפור ';
    }
  });
});

$$('[data-reel]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.stopPropagation();

    const card = button.closest('[data-reel-card]');
    if (!card) return;

    const wasPlaying = card.classList.contains('is-playing');

    $$('[data-reel-card]').forEach((item) => {
      item.classList.remove('is-playing');

      $('[data-reel]', item)?.setAttribute(
        'aria-pressed',
        'false'
      );
    });

    if (!wasPlaying) {
      card.classList.add('is-playing');
      button.setAttribute('aria-pressed', 'true');
      showToast('Reel הופעל במצב תצוגה');
    }
  });
});

$$('[data-reel-card]').forEach((card) => {
  card.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;

    event.preventDefault();
    $('[data-reel]', card)?.click();
  });
});

const sections = $$('main section[id]');

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting || navigationLockHash) return;

        setActiveNavigation(`#${entry.target.id}`);
      });
    },
    {
      rootMargin: '-35% 0px -55%',
      threshold: 0
    }
  );

  sections.forEach((section) => observer.observe(section));
}

addEventListener(
  'scroll',
  () => {
    if (scrollY > 120 || navigationLockHash) return;
    setActiveNavigation('#top');
  },
  { passive: true }
);

$('.footer-search')?.addEventListener('submit', (event) => {
  event.preventDefault();
  event.currentTarget.reset();
  showToast('נרשמתם בהצלחה');
});

if (isWebContext && isSecureContext && 'serviceWorker' in navigator) {
  addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}