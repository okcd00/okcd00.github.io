'use strict';
(() => {
  const button = document.querySelector('.back-to-top');
  if (!button || button.dataset.enhanced) return;
  button.dataset.enhanced = 'true';
  const storageKey = 'dian.backToTop.position.v1';
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let position = null;
  let gesture = null;
  let suppressClick = false;
  let frame = 0;
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey));
    if (saved && [saved.x, saved.y].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) position = saved;
  } catch (_) { /* Storage is optional, including in private browsing. */ }

  const clamp = (n, min, max) => Math.max(min, Math.min(n, max));
  function bounds() {
    const view = window.visualViewport;
    const style = getComputedStyle(button);
    const safe = side => parseFloat(style.getPropertyValue('--safe-' + side)) || 0;
    const left = (view?.offsetLeft || 0) + safe('left') + 12;
    const safeTop = (view?.offsetTop || 0) + safe('top') + 12;
    let top = safeTop;
    const header = document.querySelector('.site-header')?.getBoundingClientRect();
    if (header && header.top <= top && header.bottom > top) top = header.bottom + 12;
    const width = view?.width || document.documentElement.clientWidth;
    const height = view?.height || window.innerHeight;
    const bottom = Math.max(safeTop, (view?.offsetTop || 0) + height - safe('bottom') - 12 - button.offsetHeight);
    return { left, top: Math.min(top, bottom), right: Math.max(left, (view?.offsetLeft || 0) + width - safe('right') - 12 - button.offsetWidth), bottom };
  }
  function place(x, y, area = bounds()) {
    button.style.left = clamp(x, area.left, area.right) + 'px';
    button.style.top = clamp(y, area.top, area.bottom) + 'px';
    button.style.right = 'auto';
    button.style.bottom = 'auto';
  }
  function layout() {
    const area = bounds();
    const p = position || { x: 1, y: 1 };
    place(area.left + p.x * (area.right - area.left), area.top + p.y * (area.bottom - area.top) - (position ? 0 : 12), area);
  }
  function savePosition() {
    const area = bounds();
    const rect = button.getBoundingClientRect();
    position = { x: clamp((rect.left - area.left) / Math.max(1, area.right - area.left), 0, 1), y: clamp((rect.top - area.top) / Math.max(1, area.bottom - area.top), 0, 1) };
    try { sessionStorage.setItem(storageKey, JSON.stringify(position)); } catch (_) { /* Optional. */ }
  }
  function cancelGesture() {
    if (!gesture) return;
    const id = gesture.id;
    gesture = null;
    suppressClick = true;
    delete button.dataset.dragging;
    if (button.hasPointerCapture(id)) button.releasePointerCapture(id);
    if (!button.hidden) layout();
  }
  function update() {
    frame = 0;
    const show = window.scrollY > Math.min(400, window.innerHeight * 0.6);
    if (!show && gesture) cancelGesture();
    button.hidden = !show;
    if (show && !gesture) layout();
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(update); }
  button.addEventListener('pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || gesture) return;
    const rect = button.getBoundingClientRect();
    gesture = { id: event.pointerId, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, dragged: false, threshold: event.pointerType === 'mouse' ? 6 : 10 };
    suppressClick = false;
    button.setPointerCapture(event.pointerId);
  });
  button.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
    if (!gesture.dragged && Math.hypot(dx, dy) < gesture.threshold) return;
    gesture.dragged = true;
    suppressClick = true;
    button.dataset.dragging = 'true';
    place(gesture.left + dx, gesture.top + dy);
  });
  button.addEventListener('pointerup', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (gesture.dragged) savePosition();
    gesture = null;
    delete button.dataset.dragging;
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
  });
  button.addEventListener('pointercancel', cancelGesture);
  button.addEventListener('lostpointercapture', cancelGesture);
  window.addEventListener('blur', cancelGesture);
  button.addEventListener('click', event => {
    // A native keyboard/assistive click has detail 0 and remains available after a drag.
    if (suppressClick && event.detail !== 0) { event.preventDefault(); return; }
    cancelGesture();
    const main = document.getElementById('main');
    if (main) {
      const temporaryTabindex = !main.hasAttribute('tabindex');
      if (temporaryTabindex) main.setAttribute('tabindex', '-1');
      main.focus({ preventScroll: true });
      if (temporaryTabindex) main.addEventListener('blur', () => main.removeAttribute('tabindex'), { once: true });
    }
    window.scrollTo({ top: 0, left: window.scrollX, behavior: reducedMotion.matches ? 'instant' : 'smooth' });
  });
  button.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const steps = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    if (event.key === 'Escape') {
      event.preventDefault(); cancelGesture(); position = null;
      try { sessionStorage.removeItem(storageKey); } catch (_) { /* Optional. */ }
      layout();
    } else if (steps[event.key]) {
      event.preventDefault(); cancelGesture();
      const rect = button.getBoundingClientRect(), step = event.shiftKey ? 48 : 16;
      place(rect.left + steps[event.key][0] * step, rect.top + steps[event.key][1] * step);
      savePosition();
    }
  });
  function resized() { cancelGesture(); schedule(); }
  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', resized, { passive: true });
  window.addEventListener('pageshow', schedule);
  window.visualViewport?.addEventListener('resize', resized, { passive: true });
  window.visualViewport?.addEventListener('scroll', schedule, { passive: true });
  update();
})();
