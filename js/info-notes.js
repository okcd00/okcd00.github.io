'use strict';
// Contextual info disclosures. Native details keeps click, touch, Enter and Space
// available without JavaScript. Enhancement adds viewport positioning and dismissal.
(() => {
  const notes = [...document.querySelectorAll('details.info-note')];
  if (!notes.length) return;
  let active = null;
  const viewport = () => {
    const v = window.visualViewport;
    return { left: v?.offsetLeft || 0, top: v?.offsetTop || 0,
      width: v?.width || document.documentElement.clientWidth,
      height: v?.height || window.innerHeight };
  };
  function position(note) {
    if (!note?.open) return;
    const trigger = note.querySelector('.info-trigger');
    const panel = note.querySelector('.info-panel');
    const v = viewport(), margin = 12, gap = 8;
    panel.style.maxWidth = Math.max(1, v.width - margin * 2) + 'px';
    panel.style.maxHeight = Math.max(1, v.height - margin * 2) + 'px';
    const anchor = trigger.getBoundingClientRect(), box = panel.getBoundingClientRect();
    const minLeft = v.left + margin, maxLeft = v.left + v.width - margin - box.width;
    const minTop = v.top + margin, maxTop = v.top + v.height - margin - box.height;
    panel.style.left = Math.max(minLeft, Math.min(anchor.left, maxLeft)) + 'px';
    const below = anchor.bottom + gap;
    const preferred = below <= maxTop ? below : anchor.top - gap - box.height;
    panel.style.top = Math.max(minTop, Math.min(preferred, maxTop)) + 'px';
  }
  function close(note, restoreFocus = false) {
    if (!note) return;
    note.open = false;
    note.querySelector('.info-trigger').setAttribute('aria-expanded', 'false');
    if (active === note) active = null;
    if (restoreFocus) note.querySelector('.info-trigger').focus({ preventScroll: true });
  }
  function sync(note) {
    note.querySelector('.info-trigger').setAttribute('aria-expanded', String(note.open));
    if (!note.open) { if (active === note) active = null; return; }
    if (active && active !== note) close(active);
    active = note;
    position(note);
  }
  notes.forEach(note => {
    const trigger = note.querySelector('.info-trigger');
    note.dataset.enhanced = 'true';
    trigger.setAttribute('aria-expanded', String(note.open));
    trigger.addEventListener('click', event => {
      event.preventDefault();
      note.open = !note.open;
      sync(note);
    });
    note.addEventListener('toggle', () => sync(note));
    note.addEventListener('focusout', event => {
      if (event.relatedTarget && !note.contains(event.relatedTarget)) close(note);
    });
    if (note.open) sync(note);
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && active) {
      event.preventDefault();
      close(active, true);
    }
  });
  document.addEventListener('pointerdown', event => {
    if (active && !active.contains(event.target)) close(active);
  });
  document.addEventListener('scroll', event => {
    if (active && !active.querySelector('.info-panel').contains(event.target)) close(active);
  }, { passive: true, capture: true });
  window.addEventListener('resize', () => position(active), { passive: true });
  window.visualViewport?.addEventListener('resize', () => position(active), { passive: true });
  window.visualViewport?.addEventListener('scroll', () => position(active), { passive: true });
})();

// First view favors the newest verified work, not the first historical year.
// Only the chart's own scroll offsets change; deep links and history retain control.
(() => {
  document.querySelectorAll('.flow-viewport').forEach(view => {
    let interacted = false;
    ['pointerdown', 'wheel', 'keydown', 'focusin'].forEach(type =>
      view.addEventListener(type, () => { interacted = true; }, { once: true, passive: true }));
    requestAnimationFrame(() => {
      const navigation = performance.getEntriesByType?.('navigation')[0];
      if (interacted || navigation?.type === 'back_forward' || view.scrollLeft || view.scrollTop) return;
      let target;
      try { target = document.getElementById(decodeURIComponent(location.hash.slice(1))); } catch { /* Malformed hash: no chart target. */ }
      if (target && view.contains(target)) return;
      const items = [...view.querySelectorAll('.flow-item[data-end-year]')];
      if (!items.length) return;
      const latest = items.reduce((best, item) =>
        Number(item.dataset.endYear) > Number(best.dataset.endYear) ||
        (item.dataset.endYear === best.dataset.endYear && item.offsetTop > best.offsetTop) ? item : best);
      const axisHeight = view.querySelector('.flow-axis')?.offsetHeight || 47;
      const labelWidth = view.querySelector('.flow-track-label')?.offsetWidth || 140;
      const maxLeft = Math.max(0, view.scrollWidth - view.clientWidth);
      // The sticky track label must not cover the latest item on a phone.
      view.scrollLeft = Math.max(0, Math.min(maxLeft, latest.id === 'flow-current' ? latest.offsetLeft - (view.clientWidth - latest.offsetWidth) / 2 : latest.offsetLeft - labelWidth - 16));
      const room = Math.max(0, view.clientHeight - axisHeight - latest.offsetHeight);
      view.scrollTop = Math.max(0, Math.min(view.scrollHeight - view.clientHeight,
        latest.offsetTop - axisHeight - room * .45));
    });
  });
})();
