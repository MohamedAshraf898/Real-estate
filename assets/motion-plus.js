// Extra motion: smooth scroll, custom cursor, page transitions, scroll progress, statement highlight,
// marquee, pinned horizontal gallery, card tilt and the footer wordmark. Needs GSAP; skipped for reduced motion.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ease = 'power3.out';

  // ---------- smooth scroll (Lenis) ----------
  if (window.Lenis && !reduce) {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    window.lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener('click', e => {
      const a = e.target.closest('a[href^="#"]');
      if (!a || a.getAttribute('href').length < 2) return;
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: -100 }); }
    });
  }

  // ---------- page transition curtain ----------
  const curtain = document.createElement('div');
  curtain.className = 'pt'; curtain.setAttribute('aria-hidden', 'true');
  curtain.innerHTML = '<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#E7FD55"/><path d="M16 26V14M16 18l-5-5M16 15l5-5M16 21l4-3" stroke="#2E3A26" stroke-width="1.8" stroke-linecap="round" fill="none"/></svg>';
  document.body.appendChild(curtain);
  const hasLoader = !!document.querySelector('.loader');
  if (!reduce && !hasLoader) gsap.fromTo(curtain, { clipPath: 'inset(0 0 0% 0)' }, { clipPath: 'inset(0 0 100% 0)', duration: .9, ease: 'power4.inOut', delay: .05 });
  else gsap.set(curtain, { clipPath: 'inset(0 0 100% 0)' });
  addEventListener('pageshow', e => { if (e.persisted) gsap.set(curtain, { clipPath: 'inset(0 0 100% 0)' }); });
  document.addEventListener('click', e => {
    const a = e.target.closest('a[href]');
    if (!a || reduce || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target) return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname) || (url.pathname === location.pathname && url.hash)) return;
    e.preventDefault();
    gsap.fromTo(curtain, { clipPath: 'inset(100% 0 0% 0)' }, { clipPath: 'inset(0% 0 0% 0)', duration: .6, ease: 'power4.inOut', onComplete: () => { location.href = url.href; } });
  });

  // ---------- scroll progress line ----------
  const bar = document.createElement('div'); bar.className = 'progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  gsap.to(bar, { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

  document.addEventListener('site:ready', () => {
    if (reduce) return;

    // ---------- custom cursor ----------
    if (fine && document.body.dataset.page !== 'explore') { // the 3D page keeps the normal cursor for dragging
      const c = document.createElement('div'); c.className = 'cursor'; c.innerHTML = '<span class="cursor__ring"><b></b></span><span class="cursor__dot"></span>';
      document.body.appendChild(c); document.documentElement.classList.add('has-cursor');
      const ring = c.querySelector('.cursor__ring'), dot = c.querySelector('.cursor__dot'), label = c.querySelector('b');
      const rx = gsap.quickTo(ring, 'x', { duration: .45, ease: 'power3' }), ry = gsap.quickTo(ring, 'y', { duration: .45, ease: 'power3' });
      const dx = gsap.quickTo(dot, 'x', { duration: .08 }), dy = gsap.quickTo(dot, 'y', { duration: .08 });
      addEventListener('pointermove', e => { rx(e.clientX); ry(e.clientY); dx(e.clientX); dy(e.clientY); c.classList.add('is-on'); });
      document.addEventListener('pointerleave', () => c.classList.remove('is-on'));
      document.addEventListener('pointerover', e => {
        const v = e.target.closest('[data-cursor], .card, .masonry figure, .panel__img, .hs__item, canvas');
        const l = e.target.closest('a, button, select, label, summary, [role="tab"]');
        const text = v ? (v.dataset.cursor || (v.tagName === 'CANVAS' ? 'Explore' : 'View')) : '';
        label.textContent = text;
        c.classList.toggle('is-view', !!text); c.classList.toggle('is-link', !text && !!l);
        c.classList.toggle('is-text', !!e.target.closest('input, textarea'));
      });
      addEventListener('pointerdown', () => gsap.to(ring, { scale: .85, duration: .15 }));
      addEventListener('pointerup', () => gsap.to(ring, { scale: 1, duration: .3 }));
    }

    // ---------- statement: words light up while scrolling ----------
    document.querySelectorAll('[data-scrub-text]').forEach(el => {
      el.innerHTML = el.textContent.trim().split(/\s+/).map(w => `<span class="sw">${w}</span>`).join(' ');
      gsap.fromTo(el.querySelectorAll('.sw'), { opacity: .14 }, { opacity: 1, stagger: .1, ease: 'none', scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 45%', scrub: true } });
    });

    // ---------- marquee: speed and direction follow scroll ----------
    document.querySelectorAll('.marquee').forEach(m => {
      const track = m.querySelector('.marquee__track');
      track.innerHTML += track.innerHTML; // two copies for a seamless loop
      const loop = gsap.to(track, { xPercent: -50, duration: 28, ease: 'none', repeat: -1 });
      let dir = 1;
      ScrollTrigger.create({ trigger: m, start: 'top bottom', end: 'bottom top', onUpdate: self => {
        if (self.direction !== dir) { dir = self.direction; gsap.to(loop, { timeScale: dir, duration: .4 }); }
        const v = Math.min(4, 1 + Math.abs(self.getVelocity()) / 600);
        gsap.to(loop, { timeScale: dir * v, duration: .25, overwrite: true, onComplete: () => gsap.to(loop, { timeScale: dir, duration: 1.2 }) });
      } });
    });

    // ---------- pinned horizontal gallery (desktop); native swipe on mobile ----------
    const hs = document.querySelector('.hs');
    if (hs) {
      const track = hs.querySelector('.hs__track');
      gsap.matchMedia().add('(min-width: 900px)', () => {
        const dist = () => track.scrollWidth - innerWidth + 80;
        const tween = gsap.to(track, { x: () => -dist(), ease: 'none', scrollTrigger: { trigger: hs, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, invalidateOnRefresh: true } });
        hs.querySelectorAll('.hs__item img').forEach(img => gsap.fromTo(img, { xPercent: -8 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
        hs.querySelectorAll('.hs__item figcaption').forEach(cap => gsap.from(cap, { y: 30, opacity: 0, duration: .8, ease, scrollTrigger: { trigger: cap.parentElement, containerAnimation: tween, start: 'left 75%' } }));
      });
    }

    // ---------- card tilt ----------
    if (fine) document.addEventListener('pointermove', e => {
      const card = e.target.closest('.card, .type');
      document.querySelectorAll('.is-tilt').forEach(c => { if (c !== card) { c.classList.remove('is-tilt'); gsap.to(c, { rotationX: 0, rotationY: 0, duration: .6, ease }); } });
      if (!card) return;
      const r = card.getBoundingClientRect(), px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
      card.classList.add('is-tilt');
      gsap.to(card, { rotationY: px * 6, rotationX: -py * 6, transformPerspective: 900, duration: .5, ease });
    });

    // ---------- footer wordmark ----------
    const footer = document.querySelector('.site-footer .wrap');
    if (footer) {
      const mark = document.createElement('div'); mark.className = 'footer-mark'; mark.setAttribute('aria-hidden', 'true');
      mark.innerHTML = [...(window.BRAND ? window.BRAND.name.split(' ')[0] : 'Linden')].map(ch => `<span class="w"><span>${ch}</span></span>`).join('');
      footer.appendChild(mark);
      gsap.from(mark.querySelectorAll('.w > span'), { yPercent: 110, duration: 1.2, ease, stagger: .06, scrollTrigger: { trigger: mark, start: 'top 95%', once: true } });
    }

    // ---------- small extras ----------
    document.querySelectorAll('.card__media img, .gallery__main img').forEach(img => gsap.fromTo(img, { scale: 1.15 }, { scale: 1, duration: 1.4, ease, scrollTrigger: { trigger: img, start: 'top 90%', once: true } }));
    document.querySelectorAll('.eyebrow').forEach(e => { if (!e.closest('.hero, .mm__info, .card, .type, .b3d__panel')) gsap.from(e, { x: -20, opacity: 0, duration: .8, ease, scrollTrigger: { trigger: e, start: 'top 92%', once: true } }); });
    ScrollTrigger.refresh();
  });
})();
