/* Progressive enhancement: links remain native without JS or motion support. */
(() => {
  'use strict';
  const key = 'category-book-entry-v1';
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  let layer = null, source = null, visibility = "", timer = null, release = null, pending = false;
  function reset() {
    clearTimeout(timer); clearTimeout(release);
    if (layer) layer.remove();
    if (source) source.style.visibility = visibility;
    source = null;
    layer = null; pending = false;
  }
  function enter() {
    let entry;
    try { entry = JSON.parse(sessionStorage.getItem(key)); sessionStorage.removeItem(key); } catch (_) { return; }
    if (!entry || entry.path !== location.pathname || Date.now() - entry.time > 15000 || reduced()) return;
    const main = document.querySelector('main');
    if (main && main.animate) main.animate([
      {opacity: .25, transform: 'translateY(8px)'},
      {opacity: 1, transform: 'translateY(0)'}
    ], {duration: 300, easing: 'ease-out'});
  }
  window.addEventListener('pageshow', reset);
  window.addEventListener('pagehide', reset);
  enter();
  document.addEventListener('click', event => {
    const book = event.target.closest && event.target.closest('a.category-book');
    if (!book || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.altKey || event.shiftKey || book.download || (book.target && book.target !== '_self') || reduced() || !Element.prototype.animate) return;
    const url = new URL(book.href, location.href);
    if (url.origin !== location.origin) return;
    // Repeated clicks may choose a different book; discard the old pending trip.
    reset();
    const rect = book.getBoundingClientRect();
    const color = getComputedStyle(book).getPropertyValue('--book').trim();
    layer = document.createElement('div');
    layer.className = 'book-flight'; layer.setAttribute('aria-hidden', 'true');
    const paper = document.createElement('div'); paper.className = 'book-flight-paper';
    const cover = document.createElement('div'); cover.className = 'book-flight-cover';
    cover.textContent = book.querySelector('.book-title').textContent;
    layer.append(paper, cover);
    Object.assign(layer.style, {left: rect.left+'px', top: rect.top+'px', width: rect.width+'px', height: rect.height+'px'});
    layer.style.setProperty('--book', color);
    document.body.append(layer);
    const width = Math.min(320, innerWidth * .64), height = Math.min(360, innerHeight * .58);
    const x = (innerWidth - width)/2 - rect.left, y = (innerHeight - height)/2 - rect.top;
    try {
      layer.animate([
        {transform:'translate(0,0) scale(1)', width:rect.width+'px',height:rect.height+'px',offset:0},
        {transform:'translate(0,-24px) scale(1.06)', width:rect.width+'px',height:rect.height+'px',offset:.28},
        {transform:`translate(${x}px,${y}px) scale(1)`,width:width+'px',height:height+'px',offset:1}
      ], {duration:420,easing:'cubic-bezier(.22,.7,.2,1)',fill:'forwards'});
      cover.animate([{transform:'rotateY(0deg)',offset:0},{transform:'rotateY(0deg)',offset:.4},{transform:'rotateY(-135deg)',offset:1}], {duration:420,easing:'ease-in-out',fill:'forwards'});
    } catch (_) { reset(); return; }
    source = book; visibility = book.style.visibility; book.style.visibility = "hidden";
    event.preventDefault(); pending = true;
    timer = setTimeout(() => {
      try { sessionStorage.setItem(key, JSON.stringify({path:url.pathname,time:Date.now()})); } catch (_) {}
      location.assign(url.href);
      // Never leave a slow or failed navigation hidden behind an overlay.
      release = setTimeout(reset, 700);
    }, 420);
  });
  document.addEventListener('keydown', event => {
    if (pending && event.key === 'Escape') reset();
  });
})();
