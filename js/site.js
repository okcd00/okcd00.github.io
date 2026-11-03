'use strict';
// Core navigation and reading work without JavaScript or external services.
document.querySelectorAll('.site-nav a').forEach(link => {
  if (link.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('.site-main img').forEach(img => {
  function fallback() {
    if (img.dataset.failed) return;
    img.dataset.failed = 'true';
    const existing = img.closest('a');
    const link = existing || document.createElement('a');
    link.className = 'image-fallback'; if (!existing) link.href = img.src;
    link.textContent = (img.alt || 'Illustration') + ' — image unavailable; open original';
    if (!existing) img.replaceWith(link);
  }
  img.addEventListener('error', fallback);
  if (img.complete && img.naturalWidth === 0) fallback();
});
document.querySelector('.load-comments')?.addEventListener('click', function () {
  this.disabled = true;
  const status = document.querySelector('.comment-status');
  status.textContent = 'Connecting to Disqus…';
  const script = document.createElement('script');
  script.src = 'https://okcd00.disqus.com/embed.js'; script.async = true;
  script.onerror = () => { status.textContent = 'Comments could not load. Please try again later or contact me by email.'; this.disabled = false; script.remove(); };
  script.onload = () => { status.textContent = 'Disqus loaded. If comments are unavailable, please use the email link below.'; this.hidden = true; };
  document.head.append(script);
});

// Preserve the existing visitor-map account; history remains with RevolverMaps.
const globe = document.querySelector('.visitor-globe');
if (globe) {
  const status = globe.querySelector('.globe-status');
  const script = document.createElement('script');
  script.src = 'https://rf.revolvermaps.com/0/0/6.js?i=5mihyim0z76&m=7&c=66ccff&cr1=ff0000&f=arial&l=0&lx=200&ly=-20&hi=10';
  script.async = true;
  script.onerror = () => { status.textContent = '访客地球仪服务暂时无法连接，原访客 ID 已保留。'; };
  script.onload = () => { status.textContent = '访客记录由 RevolverMaps 提供。'; };
  globe.append(script);
}

// Connected particles, inspired by the original hustcc canvas-nest (MIT).
// One instance; no overwritten global handlers; pause when hidden/reduced motion.
(() => {
  if (document.querySelector('#connected-background')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const canvas = document.createElement('canvas');
  canvas.id = 'connected-background'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.prepend(canvas);
  let width = 0, height = 0, frame = 0, previous = 0, points = [];
  const mouse = {x: null, y: null};
  function resize() {
    width = document.documentElement.clientWidth; height = innerHeight;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = width * ratio; canvas.height = height * ratio;
    canvas.style.width = width + 'px'; canvas.style.height = height + 'px';
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = coarse.matches || width < 680 ? 22 : 65;
    points = Array.from({length: count}, () => ({x: Math.random()*width, y: Math.random()*height, vx: Math.random()-.5, vy: Math.random()-.5}));
  }
  function draw(now) {
    frame = 0;
    if (motion.matches || document.hidden) return;
    const step = Math.min((now-previous)/16.7 || 1, 2); previous = now;
    ctx.clearRect(0, 0, width, height);
    points.forEach((p, i) => {
      p.x += p.vx * step; p.y += p.vy * step;
      if(p.x < 0 || p.x > width) p.vx *= -1;
      if(p.y < 0 || p.y > height) p.vy *= -1;
      ctx.fillStyle = 'rgba(18,107,90,.35)'; ctx.fillRect(p.x,p.y,1.5,1.5);
      const near = points.slice(i+1);
      if (mouse.x !== null) near.push(mouse);
      near.forEach(q => {
        const distance = Math.hypot(p.x-q.x, p.y-q.y), limit = q === mouse ? 170 : 125;
        if (distance >= limit) return;
        ctx.strokeStyle = `rgba(18,107,90,${.35*(1-distance/limit)})`;
        ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(p.x,p.y); ctx.lineTo(q.x,q.y); ctx.stroke();
      });
    });
    frame = requestAnimationFrame(draw);
  }
  function sync() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previous = 0;
    ctx.clearRect(0,0,width,height);
    if (!motion.matches && !document.hidden) frame = requestAnimationFrame(draw);
  }
  addEventListener('resize', resize, {passive:true});
  addEventListener('pointermove', e => { if(e.pointerType !== 'touch') { mouse.x=e.clientX; mouse.y=e.clientY; } }, {passive:true});
  document.addEventListener('pointerleave', () => { mouse.x=null; mouse.y=null; });
  document.addEventListener('visibilitychange', sync);
  motion.addEventListener('change', sync);
  resize(); sync();
})();
