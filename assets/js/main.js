// ACLARIS — shared site behavior

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Mobile nav toggle
  const toggle = document.querySelector('.nav-toggle');
  const mobileNav = document.querySelector('.mobile-nav');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mobileNav.querySelectorAll('a').forEach(a => {
      a.addEventListener('click', () => mobileNav.classList.remove('is-open'));
    });
  }

  // Scroll progress bar
  const progressBar = document.querySelector('.scroll-progress');
  if (progressBar) {
    const updateProgress = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (window.scrollY / docHeight) * 100 : 0;
      progressBar.style.transform = 'scaleX(' + (pct / 100) + ')';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // Header shadow on scroll
  const header = document.querySelector('.site-header');
  if (header) {
    const onScroll = () => {
      header.style.boxShadow = window.scrollY > 8 ? '0 6px 20px rgba(11,33,56,0.06)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mapa do Google só depois do clique (sem requisições a terceiros no carregamento)
  document.querySelectorAll('.map-facade').forEach(box => {
    const btn = box.querySelector('[data-map-load]');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.title = box.dataset.mapTitle;
      f.src = box.dataset.mapSrc;
      f.loading = 'lazy';
      f.referrerPolicy = 'no-referrer-when-downgrade';
      box.innerHTML = '';
      box.classList.add('is-loaded');
      box.appendChild(f);
    });
  });

  // Vídeos de fundo: carregam sob demanda, respeitam reduced-motion e economia de dados,
  // e têm botão de pausa (WCAG 2.2.2). Em tela pequena ficam só no poster até o clique.
  const lazyVideos = document.querySelectorAll('video[data-lazy-video]');
  const holdBack = reduceMotion || (navigator.connection && navigator.connection.saveData) || window.matchMedia('(max-width: 768px)').matches;
  const ICON_PAUSE = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/></svg>';
  const ICON_PLAY = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false"><path d="M8 5v14l11-7z"/></svg>';
  const startVideo = (v) => {
    if (v.dataset.started) return;
    v.dataset.started = '1';
    v.querySelectorAll('source[data-src]').forEach(s => { s.src = s.dataset.src; });
    v.load();
    v.play().catch(() => {});
  };
  lazyVideos.forEach(v => {
    const host = v.parentElement;
    if (!host) return;
    v.addEventListener('lazyvideo:start', () => startVideo(v));
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'video-toggle';
    const sync = () => {
      btn.innerHTML = v.paused ? ICON_PLAY : ICON_PAUSE;
      btn.setAttribute('aria-label', v.paused ? 'Reproduzir vídeo' : 'Pausar vídeo');
    };
    btn.addEventListener('click', () => {
      if (!v.dataset.started) { startVideo(v); return; }
      if (v.paused) v.play().catch(() => {}); else v.pause();
    });
    v.addEventListener('play', sync);
    v.addEventListener('pause', sync);
    host.appendChild(btn);
    sync();
    if (holdBack) return;
    if (v.hasAttribute('data-hero')) {
      const go = () => { const run = () => startVideo(v); if (window.requestIdleCallback) window.requestIdleCallback(run, { timeout: 1500 }); else setTimeout(run, 200); };
      if (document.readyState === 'complete') go(); else window.addEventListener('load', go, { once: true });
    } else if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some(e => e.isIntersecting)) { startVideo(v); io.disconnect(); }
      }, { rootMargin: '300px 0px' });
      io.observe(v);
    } else {
      startVideo(v);
    }
  });

  // Segment photo cards — spotlight auto-cycles through each one
  const segChips = document.querySelectorAll('.segment-chip');
  if (segChips.length && !reduceMotion) {
    let segIdx = 0;
    let segVisible = true;
    if ('IntersectionObserver' in window) {
      new IntersectionObserver((es) => { segVisible = es[0].isIntersecting; }).observe(segChips[0].closest('.segment-strip') || segChips[0]);
    }
    setInterval(() => {
      if (!segVisible || document.hidden) return;
      segChips.forEach(c => c.classList.remove('is-active'));
      segChips[segIdx].classList.add('is-active');
      segIdx = (segIdx + 1) % segChips.length;
    }, 2200);
  }

  // Instrument panel readout — live-feeling data rotation
  const panelRows = document.querySelectorAll('[data-readout]');
  const readings = {
    ph: ['7.1', '7.0', '7.2', '7.1', '7.1'],
    conductividade: ['12.4', '12.1', '12.6', '12.4', '12.3'],
    capacidade: ['98.4', '98.1', '98.6', '98.3', '98.5'],
    ciclos: ['1', '1', '1', '1', '1'],
  };
  if (panelRows.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    let tick = 0;
    const panelEl = document.querySelector('.panel');
    let panelVisible = true;
    if (panelEl && 'IntersectionObserver' in window) {
      new IntersectionObserver((es) => { panelVisible = es[0].isIntersecting; }).observe(panelEl);
    }
    setInterval(() => {
      if (document.hidden || !panelVisible) return;
      tick = (tick + 1) % 5;
      panelRows.forEach(row => {
        const key = row.getAttribute('data-readout');
        if (readings[key]) row.textContent = readings[key][tick];
      });
    }, 2600);
  }

  // Job accordion: close others when one opens (optional single-open behavior)
  const jobCards = document.querySelectorAll('.job-card');
  jobCards.forEach(card => {
    card.addEventListener('toggle', () => {
      if (card.open) {
        jobCards.forEach(other => {
          if (other !== card) other.open = false;
        });
      }
    });
  });

  // Institutional home video: sound toggle
  const videoInst = document.getElementById('video-institucional');
  const soundBtn = document.getElementById('video-institucional-sound');
  if (videoInst && soundBtn) {
    soundBtn.addEventListener('click', () => {
      videoInst.dispatchEvent(new CustomEvent('lazyvideo:start'));
      const nowMuted = !videoInst.muted;
      videoInst.muted = nowMuted;
      soundBtn.setAttribute('aria-pressed', String(!nowMuted));
      soundBtn.querySelector('span').textContent = nowMuted ? 'Ativar som' : 'Desativar som';
      soundBtn.querySelector('svg').innerHTML = nowMuted
        ? '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>'
        : '<path d="M11 5 6 9H2v6h4l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18.5 6a9 9 0 0 1 0 12"/>';
    });
  }
});
