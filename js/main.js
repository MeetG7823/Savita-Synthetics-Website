/* ═══════════════════════════════════════════
   SAVITA SYNTHETICS — Main JS
   ═══════════════════════════════════════════ */

/* ── 1. INTRO ANIMATION ── */
(function runIntro() {
  const overlay = document.getElementById('intro-overlay');
  const logo    = document.getElementById('intro-logo');
  const text    = document.getElementById('intro-text');

  if (sessionStorage.getItem('introPlayed')) {
    overlay.style.display = 'none';
    return;
  }

  gsap.set(logo, { opacity: 0, scale: 0.6 });
  gsap.set(text, { opacity: 0, y: 20 });

  const tl = gsap.timeline({
    onComplete: () => {
      sessionStorage.setItem('introPlayed', '1');
      gsap.to(overlay, {
        opacity: 0, duration: 0.6, ease: 'power2.inOut',
        onComplete: () => { overlay.style.display = 'none'; }
      });
    }
  });

  tl.to(logo, { opacity: 1, scale: 1, duration: 0.7, ease: 'power3.out', delay: 0.2 })
    .to(text, { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
    .to({}, { duration: 1.0 }); // hold
})();

/* ── 2. LENIS SMOOTH SCROLL ── */
let lenis;
try {
  lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
  function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
  requestAnimationFrame(raf);
} catch(e) { console.warn('Lenis not loaded', e); }

/* ── 3. AOS INIT ── */
AOS.init({ duration: 800, once: true, offset: 80, easing: 'ease-out-cubic' });

/* ── 4. GSAP SCROLL TRIGGER ── */
gsap.registerPlugin(ScrollTrigger);

/* ── 5. CUSTOM CURSOR — disabled, using native OS cursor ── */

/* ── 6. NAVBAR SCROLL ── */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

/* ── 7. MOBILE DRAWER ── */
const hamburger     = document.getElementById('hamburger');
const drawer        = document.getElementById('mobile-drawer');
const drawerOverlay = document.getElementById('drawer-overlay');
const drawerClose   = document.getElementById('drawer-close');

function openDrawer()  { drawer.classList.add('open'); drawerOverlay.classList.add('active'); document.body.style.overflow = 'hidden'; }
function closeDrawer() { drawer.classList.remove('open'); drawerOverlay.classList.remove('active'); document.body.style.overflow = ''; }

hamburger.addEventListener('click', openDrawer);
drawerClose.addEventListener('click', closeDrawer);
drawerOverlay.addEventListener('click', closeDrawer);
drawer.querySelectorAll('a').forEach(a => a.addEventListener('click', closeDrawer));

/* ── 8. HERO PARALLAX — disabled for video background ── */

/* ── 9. HEADING REVEAL (GSAP SplitText fallback with word spans) ── */
document.querySelectorAll('.reveal-heading').forEach(el => {
  const words = el.textContent.trim().split(' ');
  el.innerHTML = words.map(w => `<span class="word-wrap" style="display:inline-block;overflow:hidden;"><span class="word" style="display:inline-block;transform:translateY(100%)">${w}</span></span>`).join(' ');

  ScrollTrigger.create({
    trigger: el,
    start: 'top 85%',
    onEnter: () => {
      gsap.to(el.querySelectorAll('.word'), {
        y: 0,
        duration: 0.7,
        stagger: 0.08,
        ease: 'power3.out'
      });
    }
  });
});

/* ── 10. COUNTER ANIMATION ── */
function animateCounter(el) {
  const target = parseInt(el.dataset.target, 10);
  const duration = 1800;
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = target;
  }
  requestAnimationFrame(update);
}

const counters = document.querySelectorAll('.stat-num');
const counterObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting && !entry.target.dataset.counted) {
      entry.target.dataset.counted = '1';
      animateCounter(entry.target);
    }
  });
}, { threshold: 0.5 });
counters.forEach(c => counterObserver.observe(c));

/* ── 11. CATALOGUE FILTER ── */
const filterBtns   = document.querySelectorAll('.filter-tabs .filter-btn');
const fabricCards  = document.querySelectorAll('.fabric-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.filter;

    fabricCards.forEach(card => {
      const match = filter === 'all' || card.dataset.category === filter;
      if (match) {
        card.classList.remove('hidden');
        gsap.fromTo(card, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' });
      } else {
        gsap.to(card, {
          opacity: 0, y: 10, duration: 0.25, ease: 'power2.in',
          onComplete: () => card.classList.add('hidden')
        });
      }
    });
  });
});

/* ── 12. GALLERY FILTER ── */
const gFilterBtns = document.querySelectorAll('[data-gfilter]');
const galleryItems = document.querySelectorAll('.masonry-item');

gFilterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    gFilterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const filter = btn.dataset.gfilter;

    galleryItems.forEach(item => {
      const match = filter === 'all' || item.dataset.gcat === filter;
      if (match) {
        item.classList.remove('g-hidden');
        gsap.fromTo(item, { opacity: 0 }, { opacity: 1, duration: 0.4 });
      } else {
        gsap.to(item, { opacity: 0, duration: 0.25, onComplete: () => item.classList.add('g-hidden') });
      }
    });
  });
});

/* ── 13. LIGHTBOX ── */
const lightbox  = document.getElementById('lightbox');
const lbImg     = document.getElementById('lb-img');
const lbClose   = document.getElementById('lb-close');
const lbPrev    = document.getElementById('lb-prev');
const lbNext    = document.getElementById('lb-next');

let lbImages = [];
let lbIndex  = 0;

function buildLbImages() {
  lbImages = Array.from(document.querySelectorAll('.masonry-item:not(.g-hidden) img'));
}

function openLightbox(idx) {
  buildLbImages();
  lbIndex = idx;
  lbImg.src = lbImages[lbIndex].src;
  lbImg.alt = lbImages[lbIndex].alt;
  lightbox.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeLightbox() {
  lightbox.classList.remove('active');
  document.body.style.overflow = '';
}

document.querySelectorAll('.masonry-item').forEach((item, i) => {
  item.addEventListener('click', () => {
    buildLbImages();
    const visibleItems = Array.from(document.querySelectorAll('.masonry-item:not(.g-hidden)'));
    const visIdx = visibleItems.indexOf(item);
    openLightbox(visIdx >= 0 ? visIdx : 0);
  });
});

lbClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

lbPrev.addEventListener('click', e => {
  e.stopPropagation();
  lbIndex = (lbIndex - 1 + lbImages.length) % lbImages.length;
  lbImg.src = lbImages[lbIndex].src;
});
lbNext.addEventListener('click', e => {
  e.stopPropagation();
  lbIndex = (lbIndex + 1) % lbImages.length;
  lbImg.src = lbImages[lbIndex].src;
});

document.addEventListener('keydown', e => {
  if (!lightbox.classList.contains('active')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowLeft') lbPrev.click();
  if (e.key === 'ArrowRight') lbNext.click();
});

/* ── 14. SWIPER TESTIMONIALS ── */
new Swiper('.testimonials-swiper', {
  slidesPerView: 1,
  spaceBetween: 24,
  loop: true,
  autoplay: { delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true },
  speed: 800,
  breakpoints: {
    640:  { slidesPerView: 1 },
    768:  { slidesPerView: 2 },
    1024: { slidesPerView: 3 }
  }
});

/* ── 15. ABOUT IMAGE LIGHTBOX ── */
const aboutTrigger = document.getElementById('about-img-trigger');
if (aboutTrigger) {
  aboutTrigger.addEventListener('click', () => {
    lbImg.src = 'Images/factory1.jpeg';
    lbImg.alt = 'SAVITA SYNTHETICS Factory — Jayraj Textile Park, Surat';
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
    // Hide prev/next since it's a single standalone image
    lbPrev.style.display = 'none';
    lbNext.style.display = 'none';
  });
}

// Restore prev/next when lightbox closes
const origClose = lbClose.onclick;
lbClose.addEventListener('click', () => {
  lbPrev.style.display = '';
  lbNext.style.display = '';
});
lightbox.addEventListener('click', e => {
  if (e.target === lightbox) {
    lbPrev.style.display = '';
    lbNext.style.display = '';
  }
});

/* ── 16. CONTACT FORM ── */
document.getElementById('contact-form').addEventListener('submit', function(e) {
  e.preventDefault();
  const btn = this.querySelector('button[type="submit"]');
  btn.textContent = 'Message Sent ✓';
  btn.style.background = '#2a6e2a';
  btn.style.borderColor = '#2a6e2a';
  setTimeout(() => {
    btn.textContent = 'Send Enquiry →';
    btn.style.background = '';
    btn.style.borderColor = '';
    this.reset();
  }, 3000);
});

/* ── 16. SMOOTH ANCHOR SCROLL ── */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const target = document.querySelector(a.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    if (lenis) {
      lenis.scrollTo(target, { offset: -80, duration: 1.4 });
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});
