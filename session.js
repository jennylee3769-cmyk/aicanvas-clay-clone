'use strict';
// 모바일 목차(details) 높이 동기화 — 목차가 없는 회차에서도 안전하게 동작한다.
const menu = document.querySelector('.mobile-menu');
if (menu) {
  const mobile = matchMedia('(max-width: 1023px)');
  function syncMenu() { menu.open = !mobile.matches; }
  syncMenu();
  mobile.addEventListener('change', syncMenu);
  menu.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
    if (mobile.matches) menu.open = false;
  }));
}
