'use strict';
// Core navigation and reading work without JavaScript or external services.
document.querySelectorAll('.site-nav a').forEach(link => {
  if (link.pathname.replace(/index\.html$/, '') === location.pathname.replace(/index\.html$/, '')) link.setAttribute('aria-current', 'page');
});
document.querySelectorAll('.content img').forEach(img => {
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
