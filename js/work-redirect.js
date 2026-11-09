/* Keep bookmarked Work URLs useful after the content moves into About. */
(function () {
  'use strict';
  var fallback = document.querySelector('[data-work-default]');
  if (!fallback) return;
  var fragment = window.location.hash.slice(1);
  try { fragment = decodeURIComponent(fragment); } catch (_) { fragment = ''; }
  var section = document.getElementById(fragment);
  var link = section && section.querySelector('a[href]');
  var target = fragment === 'disqus_thread' ? '/about/#disqus_thread' :
    (link || fallback).getAttribute('href');
  if (target && target.indexOf('/about/') === 0) window.location.replace(target);
}());
