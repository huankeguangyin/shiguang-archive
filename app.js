const categories = ['全部', '旅行', '观影', '阅读', '生活', '收藏'];
const STORAGE_KEY = 'shiguang-archive-memories-v2';
const REMINDER_KEY = 'shiguang-archive-reminders';
const MIN_YEAR = 1800;
const MAX_YEAR = 2200;
const today = new Date();
const currentYear = today.getFullYear();
const currentMonth = today.getMonth() + 1;
const months = [
  { value: 1, label: '1月', name: '1 月的记忆' },
  { value: 2, label: '2月', name: '2 月的记忆' },
  { value: 3, label: '3月', name: '3 月的记忆' },
  { value: 4, label: '4月', name: '4 月的记忆' },
  { value: 5, label: '5月', name: '5 月的记忆' },
  { value: 6, label: '6月', name: '6 月的记忆' },
  { value: 7, label: '7月', name: '7 月的记忆' },
  { value: 8, label: '8月', name: '8 月的记忆' },
  { value: 9, label: '9月', name: '9 月的记忆' },
  { value: 10, label: '10月', name: '10 月的记忆' },
  { value: 11, label: '11月', name: '11 月的记忆' },
  { value: 12, label: '12月', name: '12 月的记忆' }
];
const seedMemories = [
  { id: 'kyoto', title: '京都春日', category: '旅行', date: '2025-04-18', location: '日本京都', month: 4, year: 2025, cover: 'photo-travel', body: '鸭川边的风很轻，走到黄昏时，刚好看见远处的山被夕阳染成金色。', tags: ['春日', '散步', '旅行'], ai: '在京都鸭川度过的春日黄昏', archived: false },
  { id: 'dark', title: '看完《暗黑》', category: '观影', date: '2025-04-25', location: '家中', month: 4, year: 2025, cover: 'photo-cinema', body: '时间不是一条直线，而是一个没有出口的圆。看完之后，脑子里一直在回响这句话。', tags: ['电视剧', '悬疑'], ai: '一部关于时间循环与家族命运的悬疑剧观后感', archived: false },
  { id: 'walk', title: '周末散步', category: '生活', date: '2025-04-27', location: '上海', month: 4, year: 2025, cover: 'photo-city', body: '没有目的地地走了很久，买到一束不太整齐但很喜欢的花。', tags: ['周末', '散步'], ai: '在上海度过的一个没有目的地的周末下午', archived: false },
  { id: 'book', title: '读完《悉达多》', category: '阅读', date: '2025-03-12', location: '咖啡馆', month: 3, year: 2025, cover: 'photo-reading', body: '有些答案不是被找到的，而是在生活里慢慢长出来的。', tags: ['读书', '摘录'], ai: '关于自我寻找与生命体验的阅读记录', archived: false }
];
function normalizeMemory(memory) {
  const date = memory.date || `${memory.year || currentYear}-${String(memory.month || 1).padStart(2, '0')}-01`;
  const [year, month] = date.split('-').map(Number);
  return { archived: false, tags: [], ...memory, date, year, month };
}
function loadMemories() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(saved) ? saved.map(normalizeMemory) : seedMemories.map(normalizeMemory);
  } catch { return seedMemories.map(normalizeMemory); }
}
function persistMemories() { localStorage.setItem(STORAGE_KEY, JSON.stringify(memories)); }
let memories = loadMemories();
let selectedYear = currentYear;
let selectedMonth = currentMonth;
let selectedCategory = '全部';
let searchCategory = '全部';
let currentMemoryId = null;
let touchStartY = 0;
let remindersEnabled = localStorage.getItem(REMINDER_KEY) === 'true';
const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function iconRefresh() {
  if (window.lucide) window.lucide.createIcons();
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-');
  return `${year}.${month}.${day}`;
}

function todayInputValue() {
  const now = new Date();
  return [now.getFullYear(), String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

function seasonName(month) {
  if (month <= 2 || month === 12) return '冬';
  if (month <= 5) return '春';
  if (month <= 8) return '夏';
  return '秋';
}

function clampYear(year) {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Number(year) || currentYear));
}

function renderYearPicker() {
  const input = $('#yearInput');
  const range = $('#yearRange');
  if (!input || !range) return;
  input.value = selectedYear;
  range.value = selectedYear;
  $$('[data-year-jump]').forEach(button => {
    const value = button.dataset.yearJump === 'current' ? currentYear : Number(button.dataset.yearJump);
    button.classList.toggle('active', value === selectedYear);
  });
}

function setSelectedYear(year) {
  selectedYear = clampYear(year);
  renderYearPicker();
  renderFeed();
}

function openYearPicker() {
  $('#yearPicker').classList.remove('hidden');
  $('#yearSwitch').setAttribute('aria-expanded', 'true');
  renderYearPicker();
}

function closeYearPicker() {
  $('#yearPicker').classList.add('hidden');
  $('#yearSwitch').setAttribute('aria-expanded', 'false');
}

function renderMonths() {
  const ruler = $('#monthRuler');
  ruler.innerHTML = '<div class="ruler-line"></div>';
  months.forEach(month => {
    const button = document.createElement('button');
    button.className = `month-chip ${month.value === selectedMonth ? 'selected' : ''}`;
    button.setAttribute('role', 'tab');
    button.setAttribute('aria-selected', month.value === selectedMonth ? 'true' : 'false');
    button.innerHTML = `<span>${month.label}</span><span class="tick"></span>`;
    button.addEventListener('click', () => {
      selectedMonth = month.value;
      selectedCategory = '全部';
      renderMonths(); renderCategoryStrip(); renderFeed();
      button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    });
    ruler.appendChild(button);
  });
  requestAnimationFrame(() => $('.month-chip.selected', ruler)?.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' }));
  iconRefresh();
}

function renderCategoryStrip() {
  const target = $('#categoryStrip');
  target.innerHTML = categories.map(category => `<button class="category-pill ${selectedCategory === category ? 'active' : ''}" data-category="${category}" role="tab" aria-selected="${selectedCategory === category}">${category}</button>`).join('');
  $$('.category-pill', target).forEach(button => button.addEventListener('click', () => {
    selectedCategory = button.dataset.category;
    renderCategoryStrip(); renderFeed();
  }));
}

function visibleMemories() {
  return memories.filter(memory => !memory.archived && memory.year === selectedYear && memory.month === selectedMonth && (selectedCategory === '全部' || memory.category === selectedCategory));
}

function memoryCard(memory, compact = false) {
  return `<article class="memory-card ${compact ? 'compact' : ''}" tabindex="0" data-memory-id="${memory.id}" aria-label="打开${memory.title}">
    <div class="memory-cover ${memory.cover}"><span class="memory-badge">${memory.category}</span><span class="memory-spark"><i data-lucide="sparkles"></i></span></div>
    <div class="memory-content"><h3>${memory.title}</h3><div class="meta"><i data-lucide="calendar-days"></i><span>${formatDate(memory.date)}</span><span>·</span><i data-lucide="map-pin"></i><span>${memory.location}</span></div><p class="memory-description">${memory.body}</p></div>
  </article>`;
}

function bindMemoryCards(root = document) {
  $$('[data-memory-id]', root).forEach(card => {
    const open = () => openDetail(card.dataset.memoryId);
    card.addEventListener('click', open);
    card.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); open(); } });
  });
}

function renderFeed() {
  const feed = $('#memoryFeed');
  const list = visibleMemories();
  $('#currentYearLabel').textContent = selectedYear;
  $('#currentSeasonLabel').textContent = seasonName(selectedMonth);
  $('#yearLabel').textContent = selectedYear;
  $('#monthSummaryLabel').textContent = `${selectedYear} 年 ${selectedMonth} 月`;
  $('#monthTitle').textContent = months.find(m => m.value === selectedMonth).name;
  $('#memoryCount').textContent = `${list.length} 个片段`;
  feed.innerHTML = list.map(memory => memoryCard(memory)).join('');
  $('#emptyState').classList.toggle('hidden', list.length > 0);
  bindMemoryCards(feed); iconRefresh();
}

function renderSearchCategories() {
  const target = $('#searchCategories');
  target.innerHTML = categories.map(category => `<button class="category-pill ${searchCategory === category ? 'active' : ''}" data-search-category="${category}" role="tab" aria-selected="${searchCategory === category}">${category}</button>`).join('');
  $$('[data-search-category]', target).forEach(button => button.addEventListener('click', () => { searchCategory = button.dataset.searchCategory; renderSearchCategories(); renderSearchResults(); }));
}

function renderSearchResults() {
  const query = $('#searchInput').value.trim().toLowerCase();
  const results = memories.filter(memory => {
    if (memory.archived) return false;
    const matchesCategory = searchCategory === '全部' || memory.category === searchCategory;
    const haystack = `${memory.title} ${memory.location} ${memory.category} ${memory.body} ${memory.tags.join(' ')}`.toLowerCase();
    return matchesCategory && (!query || haystack.includes(query));
  });
  $('#searchResultMeta').textContent = query ? `找到 ${results.length} 条相关记忆` : `${results.length} 条生活记忆`;
  $('#searchFeed').innerHTML = results.length ? results.map(memory => memoryCard(memory, true)).join('') : '<div class="empty-state"><div class="empty-mark">⌕</div><h3>没有找到这段记忆</h3><p>换个关键词，或者把它重新写进生活里。</p></div>';
  bindMemoryCards($('#searchFeed')); iconRefresh();
  $('#searchClear').classList.toggle('hidden', !query);
}

function renderArchiveFeed() {
  const archived = memories.filter(memory => memory.archived);
  const feed = $('#archiveFeed');
  feed.innerHTML = archived.map(memory => `<div class="archive-item">${memoryCard(memory, true)}<button class="restore-btn" data-restore-id="${memory.id}"><i data-lucide="undo-2"></i><span>恢复到时间轴</span></button></div>`).join('');
  $('#archiveEmpty').classList.toggle('hidden', archived.length > 0);
  bindMemoryCards(feed);
  $$('[data-restore-id]', feed).forEach(button => button.addEventListener('click', event => { event.stopPropagation(); archiveMemory(button.dataset.restoreId); }));
  iconRefresh();
}

function archiveMemory(id) {
  const memory = memories.find(item => item.id === id);
  if (!memory) return;
  memory.archived = !memory.archived;
  persistMemories();
  renderFeed(); renderSearchResults(); renderArchiveFeed();
  showScreen(memory.archived ? 'home' : 'archive');
  showToast(memory.archived ? '记忆已归档' : '记忆已恢复');
}

function updateReminderUI() {
  const row = $('#reminderSetting');
  const toggle = $('#reminderToggle');
  if (!row || !toggle) return;
  row.setAttribute('aria-pressed', String(remindersEnabled));
  toggle.classList.toggle('on', remindersEnabled);
  $('#reminderStatus').textContent = remindersEnabled ? '已开启 · 每天检查一年前的今天' : '在一年前的今天提醒我';
}

function checkMemoryReminder() {
  if (!remindersEnabled) return;
  const monthDay = todayInputValue().slice(5);
  const match = memories.find(memory => !memory.archived && memory.year === currentYear - 1 && memory.date.slice(5) === monthDay);
  if (match) window.setTimeout(() => showToast(`一年前的今天：${match.title}`), 700);
}

function showScreen(screenName) {
  $$('.screen').forEach(screen => screen.classList.remove('active'));
  const screen = $(`#${screenName}Screen`);
  if (screen) screen.classList.add('active');
  $('#homeHeader').classList.toggle('hidden', screenName !== 'home');
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.nav === screenName));
  $('#screenScroll').scrollTop = 0;
  if (screenName === 'archive') renderArchiveFeed();
}

function openDetail(id) {
  const memory = memories.find(item => item.id === id);
  if (!memory) return;
  currentMemoryId = id;
  $('#detailTags').innerHTML = memory.tags.map(tag => `<span>#${tag}</span>`).join('');
  $('#detailSheet').innerHTML = `<h2 class="detail-title">${memory.title}</h2><div class="detail-meta"><i data-lucide="calendar-days"></i><span>${formatDate(memory.date)}</span><span>·</span><i data-lucide="map-pin"></i><span>${memory.location}</span></div><p class="detail-body">${memory.body}</p><div class="ai-summary"><div class="ai-label"><i data-lucide="sparkles"></i><span>AI 整理</span></div><strong>${memory.ai}</strong></div><div class="tag-list">${memory.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div><button class="detail-action" id="archiveAction"><i data-lucide="${memory.archived ? 'undo-2' : 'archive'}"></i><span>${memory.archived ? '恢复到时间轴' : '归档这段记忆'}</span></button>`;
  $('#detailHero').className = `detail-hero ${memory.cover}`;
  showScreen('detail'); iconRefresh();
  $('#archiveAction').addEventListener('click', () => archiveMemory(memory.id));
}

function openQuickPanel() {
  $('#quickPanel').classList.add('open');
  $('#quickPanel').setAttribute('aria-hidden', 'false');
  $('#quickBackdrop').classList.remove('hidden');
}

function closeQuickPanel() {
  $('#quickPanel').classList.remove('open');
  $('#quickPanel').setAttribute('aria-hidden', 'true');
  $('#quickBackdrop').classList.add('hidden');
}

function openCreate() {
  closeQuickPanel();
  showScreen('create');
  $('#memoryForm').reset();
  $('input[name="date"]').value = todayInputValue();
  $('#aiToggle').classList.add('on');
  iconRefresh();
}

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function saveNewMemory(event) {
  event.preventDefault();
  const form = new FormData($('#memoryForm'));
  const date = form.get('date');
  const [year, month] = date.split('-').map(Number);
  const category = form.get('category');
  const title = form.get('title').trim();
  const body = form.get('body').trim();
  const tags = form.get('tags').split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
  const newMemory = { id: `memory-${Date.now()}`, title, body, category, date, location: form.get('location').trim() || '未添加地点', month, year, archived: false, cover: category === '旅行' ? 'photo-travel' : category === '观影' ? 'photo-cinema' : category === '阅读' ? 'photo-reading' : 'photo-city', tags: tags.length ? tags : ['新记忆'], ai: `关于“${title}”的一段生活记录` };
  memories = [newMemory, ...memories];
  persistMemories();
  selectedYear = year; selectedMonth = month; selectedCategory = '全部';
  renderMonths(); renderCategoryStrip(); renderFeed();
  showScreen('home'); showToast('记忆已收好');
}

function bindEvents() {
  $$('[data-create]').forEach(button => button.addEventListener('click', openCreate));
  $$('[data-back-home]').forEach(button => button.addEventListener('click', () => showScreen('home')));
  $('#searchOpen').addEventListener('click', () => { showScreen('search'); $('#searchInput').focus(); });
  $('#quickOpen').addEventListener('click', openQuickPanel);
  $('#quickClose').addEventListener('click', closeQuickPanel);
  $('#quickBackdrop').addEventListener('click', closeQuickPanel);
  $('#memoryForm').addEventListener('submit', saveNewMemory);
  $('#saveMemory').addEventListener('click', () => $('#memoryForm').requestSubmit());
  $('#emptyCreate').addEventListener('click', openCreate);
  $('#searchInput').addEventListener('input', renderSearchResults);
  $('#searchClear').addEventListener('click', () => { $('#searchInput').value = ''; renderSearchResults(); $('#searchInput').focus(); });
  $('#photoPick').addEventListener('click', () => showToast('照片入口已准备好，原型暂用本地预览'));
  $('#voiceRecord').addEventListener('click', () => showToast('正在聆听……语音转文字将在下一版接入'));
  $('#photoRecord').addEventListener('click', () => showToast('可以从相册选择一张照片'));
  $('#placeRecord').addEventListener('click', () => showToast('地点选择器已打开'));
  $('#quickAi').addEventListener('click', () => showToast('AI 正在整理你的记忆……'));
  $('#detailMore').addEventListener('click', () => showToast('更多操作：编辑、归档、删除'));
  $('#yearSwitch').addEventListener('click', () => {
    const years = availableYears();
    const next = years[(years.indexOf(selectedYear) + 1) % years.length];
    selectedYear = next; renderFeed();
  });
  $('#reminderSetting').addEventListener('click', () => {
    remindersEnabled = !remindersEnabled;
    localStorage.setItem(REMINDER_KEY, String(remindersEnabled));
    updateReminderUI();
    showToast(remindersEnabled ? '记忆提醒已开启' : '记忆提醒已关闭');
    if (remindersEnabled) checkMemoryReminder();
  });
  $('#archiveSetting').addEventListener('click', () => { renderArchiveFeed(); showScreen('archive'); });
  $('#aiToggle').addEventListener('click', event => event.currentTarget.classList.toggle('on'));
  $('#darkModeToggle').addEventListener('click', () => { document.body.classList.toggle('dark'); showToast(document.body.classList.contains('dark') ? '已切换到深色模式' : '已切换到浅色模式'); });
  $$('[data-nav]').forEach(button => button.addEventListener('click', () => { const name = button.dataset.nav; showScreen(name === 'home' ? 'home' : name); if (name === 'search') { renderSearchCategories(); renderSearchResults(); } }));
  const stage = $('.phone-stage');
  stage.addEventListener('touchstart', event => { touchStartY = event.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', event => { const delta = event.changedTouches[0].clientY - touchStartY; if (touchStartY < 110 && delta > 60 && $('#homeScreen').classList.contains('active')) openQuickPanel(); }, { passive: true });
  window.addEventListener('keydown', event => { if (event.key === 'Escape') { closeQuickPanel(); showScreen('home'); } });
}

renderMonths(); renderCategoryStrip(); renderSearchCategories(); renderFeed(); renderArchiveFeed(); updateReminderUI(); bindEvents(); iconRefresh(); checkMemoryReminder();
