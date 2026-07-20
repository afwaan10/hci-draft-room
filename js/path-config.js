(() => {
  'use strict';
  const script = document.currentScript || [...document.scripts].find((item) => /(?:^|\/)path-config\.js(?:\?|$)/.test(item.src));
  const scriptUrl = new URL(script?.src || 'js/path-config.js', document.baseURI);
  const rootUrl = new URL('../', scriptUrl);
  const url = (value = '') => {
    const raw = String(value || '');
    if (/^(?:[a-z]+:)?\/\//i.test(raw) || raw.startsWith('data:') || raw.startsWith('blob:') || raw.startsWith('#')) return raw;
    return new URL(raw.replace(/^\/+/, ''), rootUrl).href;
  };
  window.MOBA_HUB_PATHS = Object.freeze({ root: rootUrl.href, url });
  window.mobaHubUrl = url;
})();
