'use strict';
function updateTheme(theme) {
  document.documentElement.dataset.theme = theme;
  document.querySelectorAll('[data-theme-set]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme)));
  document.querySelector('meta[name="theme-color"]').content = theme === 'dark' ? '#171a20' : '#ffffff';
}
updateTheme(document.documentElement.dataset.theme);
document.querySelectorAll('[data-theme-set]').forEach(button => button.addEventListener('click', () => {
  updateTheme(button.dataset.themeSet);
  try { localStorage.setItem('aicanvas-08-01:theme', button.dataset.themeSet); }
  catch { /* Theme still works for this page when persistent storage is blocked. */ }
}));
