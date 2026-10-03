(function () {
  'use strict';
  var root = document.documentElement;
  var buttons = document.querySelectorAll('[data-set-theme]');
  
  var hasManualChoice = false;
  try { hasManualChoice = /^(light|dark)$/.test(localStorage.getItem('fk-theme') || ''); } catch (_) {}
  function applyTheme(theme, persist) {
    if (theme !== 'light' && theme !== 'dark') return;
    root.dataset.theme = theme;
    buttons.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.setTheme === theme));
    });
    if (persist) {
      hasManualChoice = true;
      try { localStorage.setItem('fk-theme', theme); } catch (_) {}
    }
  }
  applyTheme(root.dataset.theme || 'dark', false);
  buttons.forEach(function (button) {
    button.addEventListener('click', function () { applyTheme(button.dataset.setTheme, true); });
  });

}());
