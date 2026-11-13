'use strict';
// Core navigation and reading work without JavaScript or external services.
document.querySelectorAll('.highlight').forEach(panel => {
  panel.tabIndex = 0;
  panel.setAttribute('role', 'region');
  panel.setAttribute('aria-label', '代码块，可横向或纵向滚动');
});
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

// Automatically load the existing visitor globe; honor browser privacy signals.
const globe = document.querySelector('.visitor-globe');
if (globe) {
  const status = globe.querySelector('.globe-status');
  const button = globe.querySelector('.load-globe');
  const mount = globe.querySelector('.globe-mount');
  const privacyRequested = navigator.globalPrivacyControl === true || navigator.doNotTrack === '1' || window.doNotTrack === '1';
  function loadGlobe() {
    if (!button || !mount || privacyRequested) return;
    if (button.disabled) return;
    button.disabled = true; button.hidden = true;
    status.textContent = '正在连接 RevolverMaps2…';
    const script = document.createElement('script');
    script.src = 'https://revolvermaps2.com/embed.js';
    script.dataset.site = 'ye2i457bak35';
    script.dataset.size = '300';
    script.dataset.theme = 'night';
    script.dataset.color = 'ffb23f';
    script.async = true;
    const timeout = setTimeout(() => {
      status.textContent = '地球仪加载较慢；可稍后刷新重试。';
    }, 15000);
    script.onerror = () => {
      clearTimeout(timeout);
      status.textContent = '访客地球仪暂时无法连接，请稍后重试。';
      script.remove(); button.disabled = false; button.hidden = false;
    };
    script.onload = () => {
      clearTimeout(timeout);
      const frame = mount.querySelector('iframe');
      if (!frame) {
        status.textContent = '地球仪未能初始化，请稍后刷新重试。';
        return;
      }
      frame.title = 'RevolverMaps2 访客地球仪';
      button.hidden = true;
      status.textContent = '访客统计由 RevolverMaps2 提供。若图像未显示，请稍后重试。';
    };
    mount.append(script);
  }
  button?.addEventListener('click', loadGlobe);
  if (privacyRequested) {
    status.textContent = '已根据浏览器隐私偏好停用访客统计。';
  } else {
    loadGlobe();
  }
}

// Galaxy stars: the original free drift and proximity-line interaction.
// Pointer position only changes connections, never star velocity or position.
// One canvas; bounded density and pixel ratio; no animation with reduced motion.
(() => {
  if (document.querySelector('#connected-background')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const coarse = matchMedia('(pointer: coarse)');
  const canvas = document.createElement('canvas');
  canvas.id = 'connected-background'; canvas.setAttribute('aria-hidden', 'true');
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  document.body.prepend(canvas);
  let width=0, height=0, frame=0, previous=0, stars=[];
  const mouse = {x:null,y:null};
  function resize() {
    width=document.documentElement.clientWidth; height=innerHeight;
    const ratio=Math.min(devicePixelRatio || 1,2);
    canvas.width=width*ratio; canvas.height=height*ratio;
    canvas.style.width=width+'px'; canvas.style.height=height+'px';
    ctx.setTransform(ratio,0,0,ratio,0,0);
    const count=coarse.matches || width<680 ? 30 : 85;
    stars=Array.from({length:count},()=>{
      const x=Math.random()*width,y=Math.random()*height;
      return {x,y,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,r:.45+Math.random()*1.2,phase:Math.random()*Math.PI*2,depth:.5+Math.random()*.5};
    });
    sync();
  }
  function paint(now,animated) {
    ctx.clearRect(0,0,width,height);
    const step=Math.min((now-previous)/16.7 || 1,2); previous=now;
    stars.forEach(star=>{
      if(animated){
        star.x+=star.vx*step; star.y+=star.vy*step;
        if(star.x<0 || star.x>width){star.vx*=-1;star.x=Math.max(0,Math.min(width,star.x));}
        if(star.y<0 || star.y>height){star.vy*=-1;star.y=Math.max(0,Math.min(height,star.y));}
      }
      const alpha=animated ? .48+.26*Math.sin(now*.00045+star.phase) : .65;
      if(star.r>1.15){
        const glow=ctx.createRadialGradient(star.x,star.y,0,star.x,star.y,star.r*5);
        glow.addColorStop(0,`rgba(153,197,255,${alpha*.35})`);glow.addColorStop(1,'rgba(153,197,255,0)');
        ctx.fillStyle=glow;ctx.beginPath();ctx.arc(star.x,star.y,star.r*5,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle=`rgba(220,234,255,${alpha})`;
      ctx.beginPath();ctx.arc(star.x,star.y,star.r,0,Math.PI*2);ctx.fill();
    });
    // As before: nearby stars connect, and nearby stars connect to the mouse.
    // No fixed home, restoring force, or mouse-driven displacement.
    if(animated){
      stars.forEach((star,i)=>{
        const neighbors=stars.slice(i+1);
        if(mouse.x!==null && !coarse.matches)neighbors.push(mouse);
        neighbors.forEach(other=>{
          const distance=Math.hypot(star.x-other.x,star.y-other.y);
          const limit=other===mouse ? 170 : 125;
          if(distance>=limit)return;
          ctx.strokeStyle=`rgba(146,179,255,${.24*(1-distance/limit)})`;
          ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(star.x,star.y);ctx.lineTo(other.x,other.y);ctx.stroke();
        });
      });
    }
  }

  function draw(now){frame=0;if(motion.matches || document.hidden)return;paint(now,true);frame=requestAnimationFrame(draw);}
  function sync(){
    if(frame)cancelAnimationFrame(frame);frame=0;previous=0;
    if(document.hidden)return;
    if(motion.matches)paint(0,false);else frame=requestAnimationFrame(draw);
  }
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove',e=>{if(e.pointerType!=='touch'){mouse.x=e.clientX;mouse.y=e.clientY;}},{passive:true});
  function release(){mouse.x=null;mouse.y=null;}
  document.addEventListener('pointerleave',release);addEventListener('blur',release);
  document.addEventListener('visibilitychange',sync);motion.addEventListener('change',sync);
  resize();
})();
