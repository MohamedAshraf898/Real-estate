// GSAP motion layer. main.js calls into window.Motion when GSAP loaded; otherwise the CSS reveal fallback runs.
(function () {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('gsap');
  const ease = 'power3.out';

  // Wrap each word in a mask so it can rise into view.
  function splitWords(el) {
    if (el.dataset.split) return el.querySelectorAll('.w > span');
    el.dataset.split = '1';
    el.innerHTML = el.innerHTML.split(/(<br\s*\/?>)/).map(part => /^<br/.test(part) ? part :
      part.split(/(\s+)/).map(w => w.trim() ? `<span class="w"><span>${w}</span></span>` : w).join('')).join('');
    return el.querySelectorAll('.w > span');
  }

  function heroIntro() {
    const hero = document.querySelector('.hero');
    if (!hero) return;
    if (hero.classList.contains('hero--brand')) return brandHero(hero);
    const tl = gsap.timeline({ defaults: { ease } });
    const words = splitWords(hero.querySelector('h1'));
    if (reduce) return;
    tl.from(hero.querySelector('.hero__media img'), { scale: 1.25, duration: 2.2, ease: 'power2.out' }, 0)
      .from('.site-header__bar', { y: -90, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 0.2)
      .from(hero.querySelector('.eyebrow'), { y: 20, opacity: 0, duration: .8 }, 0.35)
      .from(words, { yPercent: 115, duration: 1.1, stagger: 0.07 }, 0.4)
      .from(hero.querySelectorAll('.lead, .scroll-cue'), { y: 40, opacity: 0, duration: 1, stagger: 0.12 }, 0.9);
    gsap.to(hero.querySelector('.hero__media'), { yPercent: 18, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
    const content = hero.querySelector('.hero__content');
    if (content) gsap.to(content, { yPercent: -12, opacity: 0.2, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  }

  // Reference-style hero: slow cross-fading photos, giant brand title rising letter by letter, leaves sweeping up on scroll.
  function brandHero(hero) {
    const title = hero.querySelector('.hero__title');
    title.querySelectorAll('.hero__line').forEach(line => { line.innerHTML = [...line.textContent].map(c => `<span class="w"><span class="ch">${c}</span></span>`).join(''); });
    const chars = title.querySelectorAll('.ch');
    const slides = [...hero.querySelectorAll('.hero__slides img')];
    const leaves = hero.querySelector('.hero__leaves');
    gsap.set(leaves, { yPercent: 72 });
    if (reduce) return;
    // photo loop: each slide slowly zooms out, then dissolves into the next
    let i = 0;
    const show = () => {
      const cur = slides[i], next = slides[(i + 1) % slides.length];
      gsap.fromTo(cur, { scale: 1.12 }, { scale: 1, duration: 7, ease: 'none' });
      gsap.delayedCall(5.6, () => { gsap.set(next, { zIndex: 1 }); gsap.set(cur, { zIndex: 0 }); gsap.to(next, { opacity: 1, duration: 1.4, ease: 'power1.inOut', onComplete: () => gsap.set(cur, { opacity: 0 }) }); i = (i + 1) % slides.length; show(); });
    };
    show();
    gsap.timeline({ defaults: { ease } })
      .from('.site-header__bar', { y: -90, opacity: 0, duration: 1, clearProps: 'transform,opacity' }, 0.1)
      .from(chars, { yPercent: 110, duration: 1.2, stagger: { each: 0.045, from: 'center' } }, 0.25)
      .from(hero.querySelectorAll('.hero__tag span'), { y: 16, opacity: 0, duration: .8, stagger: .1 }, 0.9)
      .from(leaves, { yPercent: 100, duration: 1.6, ease: 'power3.out' }, 0.6);
    // scroll: media drifts, title lifts and fades, leaves sweep up to cover the bottom
    const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true };
    gsap.to(hero.querySelector('.hero__media'), { yPercent: 22, scale: 1.06, ease: 'none', scrollTrigger: st });
    gsap.to(hero.querySelector('.hero__brand'), { yPercent: -35, opacity: 0, ease: 'none', scrollTrigger: { ...st, end: '70% top' } });
    gsap.fromTo(leaves, { yPercent: 72 }, { yPercent: -5, ease: 'none', immediateRender: false, scrollTrigger: st });
    leaves.querySelectorAll('.lf').forEach((l, n) => { if (n % 3 === 0) gsap.to(l, { rotation: '+=' + (6 + n % 7), transformOrigin: '50% 0%', duration: 2.4 + (n % 5) * .4, yoyo: true, repeat: -1, ease: 'sine.inOut' }); });
  }

  function loader(el, done) {
    const pct = el.querySelector('.loader__pct'), bar = el.querySelector('.loader__bar span'), o = { v: 0 };
    // Safety net: never keep the page hidden if animation frames are throttled.
    setTimeout(() => { if (el.isConnected) { tl.progress(1); } }, 4500);
    const tl = gsap.timeline({ onComplete: () => { document.documentElement.classList.add('loaded'); el.remove(); done && done(); } })
      .to(o, { v: 100, duration: reduce ? 0.2 : 1.4, ease: 'power2.inOut', onUpdate: () => { const v = Math.round(o.v); pct.textContent = v + '%'; bar.style.width = v + '%'; } })
      .to(el.querySelector('.loader__inner'), { y: -30, opacity: 0, duration: .5, ease: 'power2.in' })
      .to(el, { clipPath: 'inset(0 0 100% 0)', duration: reduce ? 0.2 : 0.9, ease: 'power4.inOut' }, '-=0.15')
      .add(heroIntro, '-=0.6');
  }

  // Staggered reveal for anything with .reveal; also adds .is-in for CSS-driven parts (plan bars).
  function reveal(els) {
    const list = [...els].filter(e => !e.dataset.rv);
    list.forEach(e => { e.dataset.rv = '1'; });
    const items = list.filter(e => e.classList.contains('reveal'));
    if (reduce) { list.forEach(e => e.classList.add('is-in')); gsap.set(items, { opacity: 1 }); return; }
    gsap.set(items, { opacity: 0, y: 48 });
    ScrollTrigger.batch(items, {
      start: 'top 88%', once: true,
      onEnter: b => { b.forEach(e => e.classList.add('is-in')); gsap.to(b, { opacity: 1, y: 0, duration: 1.1, ease, stagger: 0.12, overwrite: 'auto' }); },
    });
    list.filter(e => e.classList.contains('reveal-img')).forEach(box => {
      const img = box.querySelector('img');
      gsap.fromTo(box, { clipPath: 'inset(12% 8% 12% 8% round 12px)' }, { clipPath: 'inset(0% 0% 0% 0% round 12px)', duration: 1.4, ease: 'power3.inOut', scrollTrigger: { trigger: box, start: 'top 85%', once: true } });
      gsap.fromTo(img, { yPercent: -8, scale: 1.18 }, { yPercent: 8, scale: 1.08, ease: 'none', scrollTrigger: { trigger: box, start: 'top bottom', end: 'bottom top', scrub: true } });
    });
    list.filter(e => e.classList.contains('plan')).forEach(p => ScrollTrigger.create({ trigger: p, start: 'top 85%', once: true, onEnter: () => p.classList.add('is-in') }));
    ScrollTrigger.refresh();
  }

  function headings() {
    if (reduce) return;
    document.querySelectorAll('.section-head h2, .grid-2 h2, .cta h2').forEach(h => {
      const words = splitWords(h);
      gsap.from(words, { yPercent: 110, duration: 1, ease, stagger: 0.05, scrollTrigger: { trigger: h, start: 'top 88%', once: true } });
    });
  }

  function counters() {
    document.querySelectorAll('.stat b, [data-count]').forEach(el => {
      const end = parseFloat(el.textContent.replace(/,/g, '')); if (isNaN(end)) return;
      const o = { v: 0 };
      if (reduce) return;
      el.textContent = '0';
      gsap.to(o, { v: end, duration: 2, ease: 'power2.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onUpdate: () => { el.textContent = Math.round(o.v).toLocaleString('en-US'); } });
    });
  }

  function magnetic() {
    if (reduce || matchMedia('(hover: none)').matches) return;
    document.querySelectorAll('.btn--primary, .icon-btn').forEach(b => {
      const x = gsap.quickTo(b, 'x', { duration: .4, ease: 'power3' }), y = gsap.quickTo(b, 'y', { duration: .4, ease: 'power3' });
      b.addEventListener('mousemove', e => { const r = b.getBoundingClientRect(); x((e.clientX - r.left - r.width / 2) * 0.25); y((e.clientY - r.top - r.height / 2) * 0.35); });
      b.addEventListener('mouseleave', () => { x(0); y(0); });
    });
  }

  // Home: layout cards slide in from the side; amenity panel image wipes on tab change.
  function extras() {
    if (reduce) return;
    const types = document.querySelectorAll('.type');
    if (types.length) gsap.from(types, { x: 60, opacity: 0, duration: 1, ease, stagger: 0.08, scrollTrigger: { trigger: '#types', start: 'top 85%', once: true } });
    document.querySelectorAll('[role="tab"]').forEach(t => t.addEventListener('click', () => {
      const p = document.getElementById(t.getAttribute('aria-controls'));
      gsap.fromTo(p.querySelector('.panel__img'), { clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)', duration: 0.9, ease: 'power3.inOut' });
      gsap.from(p.querySelectorAll('.stack > *'), { y: 24, opacity: 0, duration: .7, stagger: .08, ease });
    }));
    document.querySelectorAll('.page-top .section-head, .page-top .crumbs').forEach(el => gsap.from(el, { y: 30, opacity: 0, duration: 1, ease, delay: .15 }));
    const footer = document.querySelector('.site-footer');
    if (footer) gsap.from(footer.querySelectorAll('.footer-top > *'), { y: 40, opacity: 0, duration: 1, ease, stagger: .1, scrollTrigger: { trigger: footer, start: 'top 90%', once: true } });
  }


  // Full-screen menu: panel drops in, links rise one by one.
  function menu(el, open) {
    gsap.killTweensOf(el);
    if (reduce) { gsap.set(el, { clipPath: open ? 'inset(0 0 0% 0)' : 'inset(0 0 100% 0)' }); return; }
    if (open) {
      gsap.timeline()
        .fromTo(el, { clipPath: 'inset(0 0 100% 0)' }, { clipPath: 'inset(0 0 0% 0)', duration: .8, ease: 'power4.inOut' })
        .from(el.querySelectorAll('.mm__nav a'), { yPercent: 60, opacity: 0, duration: .8, stagger: .07, ease, clearProps: 'all' }, '-=0.35')
        .from(el.querySelectorAll('.mm__side > *'), { y: 30, opacity: 0, duration: .7, stagger: .08, ease, clearProps: 'all' }, '-=0.6');
    } else gsap.to(el, { clipPath: 'inset(0 0 100% 0)', duration: .6, ease: 'power4.inOut' });
  }

  window.Motion = {
    loader, reveal, reduce, menu,
    start() { if (!document.querySelector('.loader')) heroIntro(); headings(); counters(); magnetic(); extras(); },
  };
})();
