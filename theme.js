/* Apply the saved theme before the document is painted. */
try {
  const theme = localStorage.getItem('aicanvas-08-01:theme');
  if (theme === 'dark' || theme === 'light') document.documentElement.dataset.theme = theme;
} catch { /* The page remains usable when browser storage is unavailable. */ }
