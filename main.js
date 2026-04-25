/* ============================================
   O'GRADY DEVELOPMENT COMPANY
   Shared JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

  // --- Scroll-based header background ---
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 60) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    }, { passive: true });
  }

  // --- Mobile menu toggle ---
  const toggle = document.querySelector('.mobile-toggle');
  const mobileMenu = document.querySelector('.mobile-menu');
  if (toggle && mobileMenu) {
    toggle.addEventListener('click', function() {
      mobileMenu.classList.toggle('open');
      document.body.style.overflow = mobileMenu.classList.contains('open') ? 'hidden' : '';
      // Animate hamburger
      const spans = toggle.querySelectorAll('span');
      if (mobileMenu.classList.contains('open')) {
        spans[0].style.transform = 'rotate(45deg) translateY(8px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translateY(-8px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
    // Close menu on link click
    mobileMenu.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        mobileMenu.classList.remove('open');
        document.body.style.overflow = '';
        const spans = toggle.querySelectorAll('span');
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      });
    });
  }

  // --- Scroll-triggered animations ---
  const animElements = document.querySelectorAll('.animate-in');
  if (animElements.length > 0) {
    const observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    animElements.forEach(function(el) { observer.observe(el); });
  }

  // --- Community tabs (homepage) ---
  const tabs = document.querySelectorAll('.community-tab');
  const panels = document.querySelectorAll('.community-panel');
  if (tabs.length > 0 && panels.length > 0) {
    tabs.forEach(function(tab, i) {
      tab.addEventListener('click', function() {
        tabs.forEach(function(t) { t.classList.remove('active'); });
        panels.forEach(function(p) { p.style.display = 'none'; });
        tab.classList.add('active');
        if (panels[i]) panels[i].style.display = 'grid';
      });
    });
  }

  // --- Gallery lightbox ---
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const galleryItems = document.querySelectorAll('.gallery-trigger');
  let currentGalleryIndex = 0;
  const gallerySrcs = [];

  if (lightbox && galleryItems.length > 0) {
    galleryItems.forEach(function(item, i) {
      gallerySrcs.push(item.getAttribute('data-full') || item.querySelector('img').src);
      item.addEventListener('click', function() {
        currentGalleryIndex = i;
        lightboxImg.src = gallerySrcs[i];
        lightbox.classList.add('open');
        document.body.style.overflow = 'hidden';
      });
    });

    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
    });

    const prevBtn = lightbox.querySelector('.lightbox-prev');
    const nextBtn = lightbox.querySelector('.lightbox-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentGalleryIndex = (currentGalleryIndex - 1 + gallerySrcs.length) % gallerySrcs.length;
        lightboxImg.src = gallerySrcs[currentGalleryIndex];
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        currentGalleryIndex = (currentGalleryIndex + 1) % gallerySrcs.length;
        lightboxImg.src = gallerySrcs[currentGalleryIndex];
      });
    }

    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (!lightbox.classList.contains('open')) return;
      if (e.key === 'Escape') {
        lightbox.classList.remove('open');
        document.body.style.overflow = '';
      }
      if (e.key === 'ArrowLeft') {
        currentGalleryIndex = (currentGalleryIndex - 1 + gallerySrcs.length) % gallerySrcs.length;
        lightboxImg.src = gallerySrcs[currentGalleryIndex];
      }
      if (e.key === 'ArrowRight') {
        currentGalleryIndex = (currentGalleryIndex + 1) % gallerySrcs.length;
        lightboxImg.src = gallerySrcs[currentGalleryIndex];
      }
    });
  }

  // --- FAQ accordion ---
  const faqQuestions = document.querySelectorAll('.faq-question');
  faqQuestions.forEach(function(q) {
    q.addEventListener('click', function() {
      const answer = q.nextElementSibling;
      const toggleIcon = q.querySelector('.faq-toggle');
      const isOpen = answer.classList.contains('open');

      // Close all
      document.querySelectorAll('.faq-answer').forEach(function(a) { a.classList.remove('open'); });
      document.querySelectorAll('.faq-toggle').forEach(function(t) { t.textContent = '+'; t.style.transform = 'none'; });

      if (!isOpen) {
        answer.classList.add('open');
        if (toggleIcon) {
          toggleIcon.textContent = '−';
          toggleIcon.style.transform = 'rotate(180deg)';
        }
      }
    });
  });

});
