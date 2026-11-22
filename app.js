'use strict';
const sessionId = document.body.dataset.session || 'aicanvas-08-01';
const prefix = sessionId + ':';
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];
let toastTimer;
function toast(message) {
  $('#toast').textContent = message;
  $('#toast').classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 3000);
}
function read(key, fallback) {
  try { return JSON.parse(localStorage.getItem(prefix + key)) ?? fallback; }
  catch { return fallback; }
}
function write(key, value) {
  try { localStorage.setItem(prefix + key, JSON.stringify(value)); return true; }
  catch { return false; }
}
function setTheme(theme) {
  document.documentElement.dataset.theme = theme;
  $$('[data-theme-set]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.themeSet === theme)));
  $('meta[name="theme-color"]').content = theme === 'dark' ? '#000000' : '#ffffff';
}
setTheme(document.documentElement.dataset.theme);
$$('[data-theme-set]').forEach(button => button.addEventListener('click', () => {
  setTheme(button.dataset.themeSet);
  try { localStorage.setItem('aicanvas-08-01:theme', button.dataset.themeSet); }
  catch { toast('화면은 변경했지만 설정을 저장하지 못했습니다.'); }
}));
const siteNav = $('#site-nav');
const navSections = $$('#site-nav a').map(link => ({
  link,
  section: document.getElementById(link.hash.slice(1))
})).filter(item => item.section);
let navUpdatePending = false;
let previousNavLink = null;
let previousNavWidth = 0;
function updateCurrentSection() {
  navUpdatePending = false;
  // Match the anchor offset so clicked headings and scrolled headings agree.
  const readingLine = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) + 2;
  let current = null;
  navSections.forEach(item => {
    if (item.section.getBoundingClientRect().top <= readingLine) current = item.link;
  });
  navSections.forEach(({ link }) => {
    if (link === current) link.setAttribute('aria-current', 'location');
    else link.removeAttribute('aria-current');
  });
  const navWidth = siteNav.clientWidth;
  if (!current && previousNavLink) siteNav.scrollTo({ left: 0, behavior: 'instant' });
  if (current && (current !== previousNavLink || navWidth !== previousNavWidth)) {
    const bounds = siteNav.getBoundingClientRect();
    const item = current.getBoundingClientRect();
    if (item.left < bounds.left + 16 || item.right > bounds.right - 16) {
      // Move only the horizontal menu; keep the reader's vertical position.
      siteNav.scrollTo({
        left: siteNav.scrollLeft + item.left - bounds.left - (navWidth - item.width) / 2,
        behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'
      });
    }
  }
  previousNavLink = current;
  previousNavWidth = navWidth;
}
function scheduleNavUpdate() {
  if (navUpdatePending) return;
  navUpdatePending = true;
  requestAnimationFrame(updateCurrentSection);
}
window.addEventListener('scroll', scheduleNavUpdate, { passive: true });
window.addEventListener('resize', scheduleNavUpdate);
window.addEventListener('hashchange', scheduleNavUpdate);
window.addEventListener('pageshow', scheduleNavUpdate);
// Search results and expanded prompts can move sections without a scroll event.
new ResizeObserver(scheduleNavUpdate).observe($('.reading'));
scheduleNavUpdate();
const searchable = $$('[data-searchable]');
function search() {
  const query = $('#search').value.trim().toLocaleLowerCase();
  let count = 0;
  searchable.forEach(item => {
    const match = item.textContent.toLocaleLowerCase().includes(query);
    item.hidden = !match;
    if (match) count += 1;
  });
  $('#search-status').textContent = query ? `총 ${count}개 결과 · 인사이트 ${$$('.insight:not([hidden])').length} · 프롬프트 ${$$('.prompt:not([hidden])').length} · 자료 ${$$('.resource:not([hidden])').length}` : '인사이트·프롬프트·자료실에서 검색합니다.';
  $('#no-results').hidden = count !== 0;
}
$('#search').addEventListener('input', search);
$('#search-clear').addEventListener('click', () => { $('#search').value = ''; search(); $('#search').focus(); });
async function copy(text) {
  try { await navigator.clipboard.writeText(text); toast('복사했습니다. 원하는 곳에 붙여넣으세요.'); }
  catch {
    $('#copy-fallback-text').value = text;
    $('#copy-fallback').showModal();
    $('#copy-fallback-text').select();
  }
}
$$('[data-copy]').forEach(button => button.addEventListener('click', () => copy(document.getElementById(button.dataset.copy).textContent)));
$('#close-copy').addEventListener('click', () => $('#copy-fallback').close());
const prompts = $$('.prompt');
function updateExpandButton() {
  const allOpen = prompts.every(prompt => prompt.open);
  $('#expand-prompts').textContent = allOpen ? '프롬프트 모두 접기' : '프롬프트 모두 펼치기';
  $('#expand-prompts').setAttribute('aria-expanded', String(allOpen));
}
$('#expand-prompts').addEventListener('click', () => {
  const open = !prompts.every(prompt => prompt.open);
  prompts.forEach(prompt => { prompt.open = open; });
  updateExpandButton();
});
prompts.forEach(prompt => prompt.addEventListener('toggle', updateExpandButton));
const boxes = $$('[data-mission]');
const savedMissions = read('missions', []);
boxes.forEach(box => { box.checked = Array.isArray(savedMissions) && savedMissions.includes(box.dataset.mission); });
function updateMissions() {
  const selected = boxes.filter(box => box.checked).map(box => box.dataset.mission);
  boxes.forEach(box => box.closest('.mission').classList.toggle('done', box.checked));
  $('#mission-count').textContent = `${selected.length} / ${boxes.length} 완료`;
  $('#mission-progress').value = selected.length;
  return selected;
}
updateMissions();
boxes.forEach(box => box.addEventListener('change', () => {
  if (!write('missions', updateMissions())) toast('체크 상태를 저장하지 못했습니다. 브라우저 설정을 확인해 주세요.');
}));
const notes = $$('[data-note]');
const savedNotes = read('notes', {});
notes.forEach(note => {
  const value = savedNotes && typeof savedNotes === 'object' ? savedNotes[note.dataset.note] : '';
  note.value = typeof value === 'string' ? value.slice(0, 4000) : '';
  note.addEventListener('input', () => {
    const values = Object.fromEntries(notes.map(field => [field.dataset.note, field.value]));
    $('#save-status').textContent = write('notes', values) ? '이 브라우저에 저장했습니다 · 외부로 전송되지 않습니다.' : '저장하지 못했습니다. 메모 파일 받기로 보관해 주세요.';
  });
});
function notesText() {
  const labels = { why: '나의 WHY', mission: '완료한 미션', feel: '느낀 것', learn: '알게 된 것', question: '궁금한 것' };
  const title = document.body.dataset.noteTitle || 'AICANVAS 8기 1회차 · 2026.10.21';
  return title + '\n\n' + notes.map(note => `${note.dataset.label || labels[note.dataset.note]}\n${note.value.trim() || '(아직 작성하지 않음)'}`).join('\n\n');
}
$('#copy-notes').addEventListener('click', () => copy(notesText()));
$('#download-notes').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob(['\ufeff' + notesText()], { type: 'text/plain;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sessionId + '-my-notes.txt';
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  toast('메모 파일 다운로드를 시작했습니다.');
});
