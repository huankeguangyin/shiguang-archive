const categories = ['全部', '旅行', '观影', '游戏', '阅读', '生活', '收藏'];
const STORAGE_KEY = 'shiguang-archive-memories-v2';
const FOLDERS_KEY = 'shiguang-archive-folders-v1';
const REMINDER_KEY = 'shiguang-archive-reminders';
const YEAR_MIN = 1900;
const YEAR_MAX = 2200;
const MAX_PHOTOS = 9;
const ONBOARDING_KEY = 'shiguang-archive-onboarding-v1';
const onboardingSteps = [
  { title: '从中间的加号开始', text: '点击加号新建一条记忆，也可以在一条记忆里添加多张照片。' },
  { title: '展开同月的叠卡', text: '同一个月有多条记忆时，点击叠卡提示即可展开查看全部片段。' },
  { title: '点击卡片查看详情', text: '进入详情后可以查看完整内容，并编辑、归档或删除这段记忆。' },
  { title: '用底部导航切换', text: '时间轴、搜索、归档和设置都在底部导航中，随时可以切换。' }
];
const today = new Date();
const currentYear = Math.min(YEAR_MAX, Math.max(YEAR_MIN, today.getFullYear()));
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
const DEFAULT_FOLDERS = [
  { id: 'folder-travel', name: '旅行', category: '旅行', system: true },
  { id: 'folder-cinema', name: '观影', category: '观影', system: true },
  { id: 'folder-game', name: '游戏', category: '游戏', system: true },
  { id: 'folder-reading', name: '阅读', category: '阅读', system: true },
  { id: 'folder-life', name: '生活', category: '生活', system: true },
  { id: 'folder-collection', name: '收藏', category: '收藏', system: true }
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
  const savedPhotos = Array.isArray(memory.photos) ? memory.photos.filter(photo => typeof photo === 'string' && photo) : [];
  const photos = (savedPhotos.length ? savedPhotos : (memory.photo ? [memory.photo] : [])).slice(0, MAX_PHOTOS);
  return { archived: false, tags: [], folderId: '', photo: '', photos, ...memory, folderId: memory.folderId || '', photos, photo: photos[0] || '', date, year, month };
}
function loadMemories() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return Array.isArray(saved) ? saved.map(normalizeMemory) : seedMemories.map(normalizeMemory);
  } catch { return seedMemories.map(normalizeMemory); }
}
function persistMemories() { localStorage.setItem(STORAGE_KEY, JSON.stringify(memories)); }
function loadFolders() {
  try {
    const saved = JSON.parse(localStorage.getItem(FOLDERS_KEY) || 'null');
    const custom = Array.isArray(saved) ? saved.filter(folder => folder && folder.id && folder.name).map(folder => ({ id: String(folder.id), name: String(folder.name).trim(), category: folder.category || '', system: Boolean(folder.system) })) : [];
    const savedIds = new Set(custom.map(folder => folder.id));
    return [...DEFAULT_FOLDERS.filter(folder => !savedIds.has(folder.id)), ...custom];
  } catch { return [...DEFAULT_FOLDERS]; }
}
function persistFolders() { localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders)); }
let memories = loadMemories();
let folders = loadFolders();
let selectedYear = currentYear;
let selectedMonth = currentMonth;
let selectedCategory = '全部';
let searchCategory = '全部';
let currentMemoryId = null;
let detailOrigin = null;
let editingMemoryId = null;
let selectedArchiveFolderId = 'all';
let draftPhotos = [];
let currentDetailPhotoIndex = 0;
let detailTouchStartX = 0;
let touchStartY = 0;
let onboardingStep = 0;
let onboardingRestoreFocus = null;
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

function coverForCategory(category) {
  return category === '旅行' ? 'photo-travel' : category === '观影' ? 'photo-cinema' : category === '阅读' ? 'photo-reading' : category === '游戏' ? 'photo-game' : 'photo-city';
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[character]));
}

function photosFor(memory) {
  if (!memory) return [];
  const savedPhotos = Array.isArray(memory.photos) ? memory.photos.filter(photo => typeof photo === 'string' && photo) : [];
  return (savedPhotos.length ? savedPhotos : (memory.photo ? [memory.photo] : [])).slice(0, MAX_PHOTOS);
}

function photoCssValue(photo) {
  return `url("${String(photo).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}")`;
}

function folderForCategory(category) {
  return folders.find(folder => folder.category === category) || null;
}

function migrateArchiveFolders() {
  let changed = false;
  memories.forEach(memory => {
    if (!memory.archived || memory.folderId) return;
    const folder = folderForCategory(memory.category);
    if (folder) { memory.folderId = folder.id; changed = true; }
  });
  if (changed) persistMemories();
}

function todayInputValue() {
  const now = new Date();
  const year = Math.min(YEAR_MAX, Math.max(YEAR_MIN, now.getFullYear()));
  return [year, String(now.getMonth() + 1).padStart(2, '0'), String(now.getDate()).padStart(2, '0')].join('-');
}

function seasonName(month) {
  if (month <= 2 || month === 12) return '冬';
  if (month <= 5) return '春';
  if (month <= 8) return '夏';
  return '秋';
}

function availableYears() {
  return Array.from({ length: YEAR_MAX - YEAR_MIN + 1 }, (_, index) => YEAR_MAX - index);
}

function clampYear(value) {
  const year = Number(value);
  if (!Number.isFinite(year)) return selectedYear;
  return Math.min(YEAR_MAX, Math.max(YEAR_MIN, Math.round(year)));
}

function syncYearPicker() {
  $('#yearLabel').textContent = selectedYear;
  const input = $('#yearInput');
  const range = $('#yearRange');
  if (input) input.value = selectedYear;
  if (range) range.value = selectedYear;
  const latestButton = $('#yearLatestMemory');
  if (latestButton) {
    const latest = memories.filter(memory => !memory.archived).sort((a, b) => b.date.localeCompare(a.date))[0];
    latestButton.disabled = !latest;
    latestButton.title = latest ? `跳转到 ${latest.year} 年 ${latest.month} 月` : '暂无未归档记忆';
  }
}

function setSelectedYear(value) {
  selectedYear = clampYear(value);
  syncYearPicker();
  renderFeed();
}

function openYearPicker() {
  const picker = $('#yearPicker');
  picker.classList.remove('hidden');
  $('#yearSwitch').setAttribute('aria-expanded', 'true');
  syncYearPicker();
  window.setTimeout(() => $('#yearInput').focus(), 0);
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
  const photos = photosFor(memory);
  const coverPhoto = photos[0] || '';
  const photoClass = coverPhoto ? ' has-photo' : '';
  const photoStyle = coverPhoto ? ` style="--memory-photo: ${escapeHtml(photoCssValue(coverPhoto))}"` : '';
  const photoCount = photos.length > 1 ? `<span class="photo-count" aria-label="${photos.length} 张照片"><i data-lucide="images"></i><span>${photos.length}</span></span>` : '';
  return `<article class="memory-card ${compact ? 'compact' : ''}" tabindex="0" data-memory-id="${memory.id}" aria-label="打开${memory.title}">
    <div class="memory-cover ${memory.cover}${photoClass}"${photoStyle}><span class="memory-badge">${memory.category}</span>${photoCount}<span class="memory-spark"><i data-lucide="sparkles"></i></span></div>
    <div class="memory-content"><h3>${memory.title}</h3><div class="meta"><i data-lucide="calendar-days"></i><span>${formatDate(memory.date)}</span><span>·</span><i data-lucide="map-pin"></i><span>${memory.location}</span></div><p class="memory-description">${memory.body}</p></div>
  </article>`;
}

function animateStackLayout(feed, cards, beforeRects, expanded) {
  if (!beforeRects || window.matchMedia('(prefers-reduced-motion: reduce)').matches || typeof cards[0]?.animate !== 'function') return;
  window.requestAnimationFrame(() => {
    cards.forEach((card, index) => {
      const before = beforeRects.get(card);
      const after = card.getBoundingClientRect();
      if (!before || !after.width || !after.height) return;
      const dx = before.left - after.left;
      const dy = before.top - after.top;
      const sx = before.width / after.width;
      const sy = before.height / after.height;
      if (Math.abs(dx) < 1 && Math.abs(dy) < 1 && Math.abs(sx - 1) < .01 && Math.abs(sy - 1) < .01) return;
      card.animate([
        { transform: `translate(${dx}px, ${dy}px) scale(${sx}, ${sy})` },
        { transform: 'none' }
      ], {
        duration: 380,
        delay: Math.min(index, 8) * 30,
        easing: 'cubic-bezier(.22,.8,.3,1)',
        fill: 'both'
      });
    });
  });
}

function setStackExpanded(expanded, focus = false, animate = true) {
  const feed = $('#memoryFeed');
  if (!feed) return;
  const stacked = feed.classList.contains('stacked');
  const active = stacked && expanded;
  const cards = $$('.memory-card', feed);
  const beforeRects = animate && stacked && cards.length ? new Map(cards.map(card => [card, card.getBoundingClientRect()])) : null;
  feed.classList.toggle('expanded', active);
  feed.setAttribute('aria-expanded', String(active));
  const hint = $('#stackHint');
  if (hint) {
    hint.classList.toggle('hidden', !stacked || active);
    hint.setAttribute('aria-expanded', String(active));
    hint.setAttribute('aria-hidden', String(!stacked || active));
  }
  const toolbar = $('#stackToolbar');
  if (toolbar) {
    toolbar.classList.toggle('hidden', !active);
    toolbar.setAttribute('aria-hidden', String(!active));
    const count = $('#stackToolbarCount');
    if (count) count.textContent = `${cards.length} 个片段`;
  }
  const touch = window.matchMedia('(hover: none)').matches;
  cards.forEach((card, index) => {
    const unavailable = touch && stacked && !active && index > 0;
    card.tabIndex = unavailable ? -1 : 0;
    card.setAttribute('aria-hidden', String(unavailable));
  });
  animateStackLayout(feed, cards, beforeRects, active);
  if (focus) (active ? $('#stackCollapse') : $('#stackHint'))?.focus({ preventScroll: true });
}

function bindMemoryCards(root = document) {
  $$('[data-memory-id]', root).forEach(card => {
    const feed = card.closest('#memoryFeed');
    const expandOnMobile = () => feed?.classList.contains('stacked') && !feed.classList.contains('expanded') && window.matchMedia('(hover: none)').matches;
    const open = () => {
      if (expandOnMobile()) {
        setStackExpanded(true);
        return;
      }
      openDetail(card.dataset.memoryId, card);
    };
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
  feed.classList.toggle('stacked', list.length > 1);
  feed.classList.remove('expanded');
  feed.setAttribute('aria-expanded', 'false');
  feed.dataset.stackCount = String(list.length);
  feed.innerHTML = list.map(memory => memoryCard(memory)).join('');
  setStackExpanded(false, false, false);
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
  renderArchiveFolders();
  const archived = memories.filter(memory => memory.archived && (selectedArchiveFolderId === 'all' || (selectedArchiveFolderId === 'uncategorized' ? !memory.folderId : memory.folderId === selectedArchiveFolderId)));
  const feed = $('#archiveFeed');
  feed.innerHTML = archived.map(memory => `<div class="archive-item">${memoryCard(memory, true)}<div class="archive-item-actions"><label class="archive-folder-picker"><i data-lucide="folder"></i><span class="sr-only">将 ${escapeHtml(memory.title)} 放入文件夹</span><select class="archive-folder-select" data-folder-memory-id="${memory.id}" aria-label="将 ${escapeHtml(memory.title)} 放入文件夹"><option value="">未归类</option>${folders.map(folder => `<option value="${escapeHtml(folder.id)}" ${memory.folderId === folder.id ? 'selected' : ''}>${escapeHtml(folder.name)}</option>`).join('')}</select></label><button class="restore-btn" data-restore-id="${memory.id}"><i data-lucide="undo-2"></i><span>恢复到时间轴</span></button></div></div>`).join('');
  const hasArchived = memories.some(memory => memory.archived);
  const empty = $('#archiveEmpty');
  empty.classList.toggle('hidden', archived.length > 0);
  const emptyTitle = $('h3', empty);
  const emptyText = $('p', empty);
  if (emptyTitle && emptyText) {
    emptyTitle.textContent = hasArchived ? '这个文件夹还是空的' : '还没有归档记忆';
    emptyText.textContent = hasArchived ? '把归档卡片移动到这里，集中回看相关片段。' : '在记忆详情页选择“归档”，它们会收在这里。';
  }
  bindMemoryCards(feed);
  $$('[data-restore-id]', feed).forEach(button => button.addEventListener('click', event => { event.stopPropagation(); archiveMemory(button.dataset.restoreId); }));
  $$('[data-folder-memory-id]', feed).forEach(select => {
    ['click', 'pointerdown', 'change'].forEach(type => select.addEventListener(type, event => {
      event.stopPropagation();
    }));
    select.addEventListener('change', () => {
    const memory = memories.find(item => item.id === select.dataset.folderMemoryId);
    if (!memory) return;
    memory.folderId = select.value;
    persistMemories();
    renderArchiveFeed();
    showToast(select.value ? `已移动到“${folders.find(folder => folder.id === select.value)?.name || '文件夹'}”` : '已移出文件夹');
    });
  });
  iconRefresh();
}

function renderArchiveFolders() {
  const target = $('#archiveFolders');
  if (!target) return;
  const archived = memories.filter(memory => memory.archived);
  const items = [
    { id: 'all', name: '全部', count: archived.length, icon: 'archive' },
    ...folders.map(folder => ({ ...folder, count: archived.filter(memory => memory.folderId === folder.id).length, icon: 'folder' })),
    { id: 'uncategorized', name: '未归类', count: archived.filter(memory => !memory.folderId).length, icon: 'folder-open' }
  ];
  target.innerHTML = items.map(item => `<div class="archive-folder-item"><button class="folder-chip ${selectedArchiveFolderId === item.id ? 'active' : ''}" type="button" role="tab" aria-selected="${selectedArchiveFolderId === item.id}" data-archive-folder="${escapeHtml(item.id)}"><i data-lucide="${item.icon}"></i><span>${escapeHtml(item.name)}</span><small>${item.count}</small></button>${item.system ? '' : item.id !== 'all' && item.id !== 'uncategorized' ? `<button class="folder-delete" type="button" data-delete-folder="${escapeHtml(item.id)}" aria-label="删除文件夹${escapeHtml(item.name)}" title="删除文件夹"><i data-lucide="trash-2"></i></button>` : ''}</div>`).join('');
  $$('[data-archive-folder]', target).forEach(button => button.addEventListener('click', () => {
    selectedArchiveFolderId = button.dataset.archiveFolder;
    renderArchiveFeed();
  }));
  $$('[data-delete-folder]', target).forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    deleteFolder(button.dataset.deleteFolder);
  }));
  iconRefresh();
}

function openFolderDialog() {
  const dialog = $('#folderDialog');
  if (!dialog) return;
  dialog.classList.remove('hidden');
  dialog.setAttribute('aria-hidden', 'false');
  $('#folderDialogBackdrop').classList.remove('hidden');
  $('#folderName').value = '';
  window.setTimeout(() => $('#folderName').focus(), 0);
}

function closeFolderDialog() {
  const dialog = $('#folderDialog');
  if (!dialog) return;
  dialog.classList.add('hidden');
  dialog.setAttribute('aria-hidden', 'true');
  $('#folderDialogBackdrop').classList.add('hidden');
}

function createFolder(event) {
  event.preventDefault();
  const name = $('#folderName').value.trim();
  if (!name) return;
  if (folders.some(folder => folder.name.toLowerCase() === name.toLowerCase())) {
    showToast('已经有同名文件夹了');
    return;
  }
  const folder = { id: `folder-${Date.now()}`, name, category: '', system: false };
  folders = [...folders, folder];
  persistFolders();
  selectedArchiveFolderId = folder.id;
  closeFolderDialog();
  renderArchiveFeed();
  showToast(`已创建“${name}”文件夹`);
}

function deleteFolder(id) {
  const folder = folders.find(item => item.id === id);
  if (!folder || folder.system || !window.confirm(`删除“${folder.name}”文件夹？其中的记忆会保留并变为未归类。`)) return;
  folders = folders.filter(item => item.id !== id);
  memories.forEach(memory => { if (memory.folderId === id) memory.folderId = ''; });
  persistFolders();
  persistMemories();
  if (selectedArchiveFolderId === id) selectedArchiveFolderId = 'all';
  renderArchiveFeed();
  showToast(`已删除“${folder.name}”文件夹`);
}

function archiveMemory(id) {
  const memory = memories.find(item => item.id === id);
  if (!memory) return;
  memory.archived = !memory.archived;
  if (memory.archived && !memory.folderId) memory.folderId = folderForCategory(memory.category)?.id || '';
  persistMemories();
  renderFeed(); renderSearchResults(); renderArchiveFeed();
  detailOrigin = null;
  showScreen(memory.archived ? 'home' : 'archive');
  showToast(memory.archived ? '记忆已归档' : '记忆已恢复');
}

function updateReminderUI() {
  const row = $('#reminderSetting');
  const toggle = $('#reminderToggle');
  if (!row || !toggle) return;
  row.setAttribute('aria-pressed', String(remindersEnabled));
  toggle.classList.toggle('on', remindersEnabled);
  $('#reminderStatus').textContent = remindersEnabled ? '已开启 · 每天检查一年后的今天' : '在一年后的今天提醒我';
}

function updateDarkModeUI() {
  const row = $('#darkModeToggle');
  if (!row) return;
  const enabled = document.body.classList.contains('dark');
  row.setAttribute('aria-pressed', String(enabled));
  $('.toggle', row)?.classList.toggle('on', enabled);
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
  if (screenName !== 'detail') closeDetailMenu();
  $('#homeHeader').classList.toggle('hidden', screenName !== 'home');
  $$('.nav-item').forEach(item => item.classList.toggle('active', item.dataset.nav === screenName));
  $('#screenScroll').scrollTop = 0;
  if (screenName === 'archive') renderArchiveFeed();
}

function renderDetailGallery(memory) {
  const gallery = $('#detailGallery');
  const detailHero = $('#detailHero');
  if (!gallery || !detailHero) return;
  const photos = photosFor(memory);
  currentDetailPhotoIndex = photos.length ? Math.min(currentDetailPhotoIndex, photos.length - 1) : 0;
  const currentPhoto = photos[currentDetailPhotoIndex] || '';
  if (currentPhoto) detailHero.style.setProperty('--detail-photo', photoCssValue(currentPhoto));
  else detailHero.style.removeProperty('--detail-photo');
  if (photos.length <= 1) {
    gallery.innerHTML = '';
    return;
  }
  gallery.innerHTML = `<div class="detail-gallery-count"><i data-lucide="images"></i><span>${currentDetailPhotoIndex + 1} / ${photos.length}</span></div>
    <button class="detail-gallery-nav prev" type="button" data-gallery-step="-1" aria-label="上一张照片"><i data-lucide="chevron-left"></i></button>
    <button class="detail-gallery-nav next" type="button" data-gallery-step="1" aria-label="下一张照片"><i data-lucide="chevron-right"></i></button>
    <div class="detail-gallery-dots" role="tablist" aria-label="选择照片">${photos.map((_, index) => `<button type="button" class="detail-gallery-dot ${index === currentDetailPhotoIndex ? 'active' : ''}" data-gallery-index="${index}" role="tab" aria-label="第 ${index + 1} 张照片" aria-selected="${index === currentDetailPhotoIndex}"></button>`).join('')}</div>`;
  $$('[data-gallery-step], [data-gallery-index]', gallery).forEach(button => button.addEventListener('click', event => {
    event.stopPropagation();
    const step = button.dataset.galleryStep;
    currentDetailPhotoIndex = step ? (currentDetailPhotoIndex + Number(step) + photos.length) % photos.length : Number(button.dataset.galleryIndex);
    renderDetailGallery(memory);
    iconRefresh();
  }));
}

function updateDetail(memory) {
  currentMemoryId = memory.id;
  currentDetailPhotoIndex = 0;
  closeDetailMenu();
  const detailSheet = $('#detailSheet');
  detailSheet.classList.remove('detail-sheet-pending', 'detail-sheet-visible');
  $('#detailTags').innerHTML = memory.tags.map(tag => `<span>#${tag}</span>`).join('');
  $('#detailSheet').innerHTML = `<h2 class="detail-title" id="detailTitle">${memory.title}</h2><div class="detail-meta"><i data-lucide="calendar-days"></i><span>${formatDate(memory.date)}</span><span>·</span><i data-lucide="map-pin"></i><span>${memory.location}</span></div><p class="detail-body">${memory.body}</p><div class="ai-summary"><div class="ai-label"><i data-lucide="sparkles"></i><span>AI 整理</span></div><strong>${memory.ai}</strong></div><div class="tag-list">${memory.tags.map(tag => `<span class="tag">#${tag}</span>`).join('')}</div><button class="detail-action" id="archiveAction"><i data-lucide="${memory.archived ? 'undo-2' : 'archive'}"></i><span>${memory.archived ? '恢复到时间轴' : '归档这段记忆'}</span></button>`;
  const detailHero = $('#detailHero');
  const photos = photosFor(memory);
  detailHero.className = `detail-hero ${memory.cover}${photos.length ? ' has-photo' : ''}`;
  renderDetailGallery(memory);
  showScreen('detail'); iconRefresh();
  $('#archiveAction').addEventListener('click', () => archiveMemory(memory.id));
}

function prepareDetailSheet(entering) {
  const sheet = $('#detailSheet');
  if (!sheet) return;
  sheet.classList.remove('detail-sheet-pending', 'detail-sheet-visible');
  if (entering) sheet.classList.add('detail-sheet-pending');
}

function revealDetailSheet() {
  const sheet = $('#detailSheet');
  if (!sheet) return;
  sheet.classList.remove('detail-sheet-pending');
  sheet.classList.add('detail-sheet-visible');
  window.setTimeout(() => sheet.classList.remove('detail-sheet-visible'), 320);
}

function clearDetailTransition(sourceCard) {
  sourceCard?.classList.remove('detail-source-transitioning');
  $('#detailHero')?.classList.remove('detail-transition-target');
}

function closeDetailMenu() {
  const menu = $('#detailMenu');
  if (!menu) return;
  menu.classList.add('hidden');
  $('#detailMore')?.setAttribute('aria-expanded', 'false');
}

function openDetailMenu() {
  const memory = memories.find(item => item.id === currentMemoryId);
  const menu = $('#detailMenu');
  if (!memory || !menu) return;
  const archiveButton = $('[data-detail-action="archive"]', menu);
  if (archiveButton) {
    archiveButton.innerHTML = `<i data-lucide="${memory.archived ? 'undo-2' : 'archive'}"></i><span>${memory.archived ? '恢复' : '归档'}</span>`;
  }
  menu.classList.remove('hidden');
  $('#detailMore')?.setAttribute('aria-expanded', 'true');
  iconRefresh();
}

function animateDetailFallback(sourceCard, update) {
  const sourceCover = sourceCard?.querySelector('.memory-cover');
  const detailHero = $('#detailHero');
  if (!sourceCover || !detailHero) { update(); return; }
  const sourceRect = sourceCover.getBoundingClientRect();
  const ghost = sourceCover.cloneNode(true);
  ghost.classList.add('transition-ghost');
  ghost.setAttribute('aria-hidden', 'true');
  Object.assign(ghost.style, {
    left: `${sourceRect.left}px`,
    top: `${sourceRect.top}px`,
    width: `${sourceRect.width}px`,
    height: `${sourceRect.height}px`
  });
  sourceCard?.classList.add('detail-source-transitioning');
  document.body.appendChild(ghost);
  update();
  detailHero.classList.add('detail-transition-target');
  let revealed = false;
  const cleanup = () => {
    ghost.remove();
    clearDetailTransition(sourceCard);
  };
  const finish = () => {
    if (revealed) return;
    revealed = true;
    revealDetailSheet();
    window.setTimeout(cleanup, 280);
  };
  window.requestAnimationFrame(() => {
    const targetRect = detailHero.getBoundingClientRect();
    Object.assign(ghost.style, {
      left: `${targetRect.left}px`,
      top: `${targetRect.top}px`,
      width: `${targetRect.width}px`,
      height: `${targetRect.height}px`,
      borderRadius: '0px'
    });
    ghost.addEventListener('transitionend', finish, { once: true });
    window.setTimeout(finish, 460);
  });
}

function animateDetailIn(sourceCard, update) {
  const sourceCover = sourceCard?.querySelector('.memory-cover');
  const sourceTitle = sourceCard?.querySelector('h3');
  const detailHero = $('#detailHero');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!sourceCover || reduced) { update(); return; }
  if (typeof document.startViewTransition === 'function') {
    sourceCard?.classList.add('detail-source-transitioning');
    sourceCover.style.viewTransitionName = 'memory-media';
    if (sourceTitle) sourceTitle.style.viewTransitionName = 'memory-title';
    try {
      const transition = document.startViewTransition(() => {
        sourceCover.style.viewTransitionName = '';
        if (sourceTitle) sourceTitle.style.viewTransitionName = '';
        update();
        detailHero.style.viewTransitionName = 'memory-media';
        const detailTitle = $('#detailTitle');
        if (detailTitle) detailTitle.style.viewTransitionName = 'memory-title';
      });
      const cleanup = () => {
        sourceCover.style.viewTransitionName = '';
        if (sourceTitle) sourceTitle.style.viewTransitionName = '';
        detailHero.style.viewTransitionName = '';
        const detailTitle = $('#detailTitle');
        if (detailTitle) detailTitle.style.viewTransitionName = '';
        sourceCard?.classList.remove('detail-source-transitioning');
      };
      transition.finished.then(() => { cleanup(); revealDetailSheet(); }, () => { cleanup(); revealDetailSheet(); });
      return;
    } catch {
      sourceCover.style.viewTransitionName = '';
      if (sourceTitle) sourceTitle.style.viewTransitionName = '';
      sourceCard?.classList.remove('detail-source-transitioning');
    }
  }
  animateDetailFallback(sourceCard, update);
}

function openDetail(id, sourceCard = null) {
  const memory = memories.find(item => item.id === id);
  if (!memory) return;
  const timelineOrigin = sourceCard?.closest('#memoryFeed');
  detailOrigin = timelineOrigin ? { id, card: sourceCard } : null;
  const canAnimate = Boolean(sourceCard?.querySelector('.memory-cover')) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  animateDetailIn(sourceCard, () => {
    updateDetail(memory);
    prepareDetailSheet(canAnimate);
  });
}

function closeDetail() {
  const origin = detailOrigin;
  const sourceCover = origin?.card?.isConnected ? origin.card.querySelector('.memory-cover') : null;
  const detailHero = $('#detailHero');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!sourceCover || reduced || typeof document.startViewTransition !== 'function') {
    detailOrigin = null;
    showScreen('home');
    return;
  }
  detailHero.style.viewTransitionName = 'memory-media';
  try {
    const transition = document.startViewTransition(() => {
      detailHero.style.viewTransitionName = '';
      showScreen('home');
      sourceCover.style.viewTransitionName = 'memory-media';
    });
    const cleanup = () => {
      detailHero.style.viewTransitionName = '';
      sourceCover.style.viewTransitionName = '';
      detailOrigin = null;
    };
    transition.finished.then(cleanup, cleanup);
  } catch {
    detailHero.style.viewTransitionName = '';
    detailOrigin = null;
    showScreen('home');
  }
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

function updatePhotoPreview() {
  const preview = $('#photoPreview');
  const grid = $('#photoPreviewGrid');
  const label = $('#photoLabel');
  const hint = $('#photoHint');
  const title = $('#photoPreviewTitle');
  const previewHint = $('#photoPreviewHint');
  if (!preview || !grid || !label || !hint) return;
  const hasPhoto = draftPhotos.length > 0;
  preview.classList.toggle('hidden', !hasPhoto);
  label.textContent = hasPhoto ? '继续添加照片' : '添加照片';
  hint.textContent = hasPhoto ? `已添加 ${draftPhotos.length} / ${MAX_PHOTOS} 张，可继续选择` : `可一次选择最多 ${MAX_PHOTOS} 张照片`;
  if (title) title.textContent = `已添加 ${draftPhotos.length} 张照片`;
  if (previewHint) previewHint.textContent = '点击照片可设为封面，右上角可移除';
  grid.innerHTML = draftPhotos.map((photo, index) => `<div class="photo-thumb ${index === 0 ? 'cover' : ''}">
    <button type="button" class="photo-thumb-select" data-photo-cover="${index}" aria-label="${index === 0 ? '当前封面' : '设为封面'}"><img src="${escapeHtml(photo)}" alt="第 ${index + 1} 张照片"><span>${index === 0 ? '封面' : '设为封面'}</span></button>
    <button type="button" class="photo-thumb-remove" data-photo-remove="${index}" aria-label="移除第 ${index + 1} 张照片"><i data-lucide="x"></i></button>
  </div>`).join('');
  iconRefresh();
}

function openPhotoPicker() {
  if (draftPhotos.length >= MAX_PHOTOS) {
    showToast(`每段记忆最多添加 ${MAX_PHOTOS} 张照片`);
    return;
  }
  $('#photoInput')?.click();
}

function compressPhoto(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('photo-read-failed'));
    reader.onload = () => {
      const image = new Image();
      image.onerror = () => reject(new Error('photo-decode-failed'));
      image.onload = () => {
        const maxSize = 1280;
        const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', .82));
      };
      image.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

async function handlePhotoChange(event) {
  const files = [...(event.target.files || [])];
  if (!files.length) return;
  const invalid = files.find(file => !file.type.startsWith('image/'));
  if (invalid) {
    showToast('请选择图片文件');
    event.target.value = '';
    return;
  }
  try {
    const remaining = MAX_PHOTOS - draftPhotos.length;
    const selected = files.slice(0, remaining);
    draftPhotos = [...draftPhotos, ...(await Promise.all(selected.map(compressPhoto)))];
    updatePhotoPreview();
    showToast(files.length > remaining ? `已添加 ${remaining} 张，最多保留 ${MAX_PHOTOS} 张` : `已添加 ${selected.length} 张照片`);
  } catch {
    showToast('照片读取失败，请重试');
  } finally {
    event.target.value = '';
  }
}

function openCreate() {
  closeQuickPanel();
  editingMemoryId = null;
  draftPhotos = [];
  showScreen('create');
  $('#memoryForm').reset();
  $('#createTitle').textContent = '新建记忆';
  $('#saveMemory').textContent = '保存';
  const dateField = $('input[name="date"]');
  dateField.min = `${YEAR_MIN}-01-01`;
  dateField.max = `${YEAR_MAX}-12-31`;
  dateField.value = todayInputValue();
  $('#aiToggle').classList.add('on');
  updatePhotoPreview();
  iconRefresh();
}

function openEdit(memory) {
  if (!memory) return;
  closeDetailMenu();
  closeQuickPanel();
  editingMemoryId = memory.id;
  draftPhotos = photosFor(memory).slice(0, MAX_PHOTOS);
  showScreen('create');
  const form = $('#memoryForm');
  form.elements.title.value = memory.title;
  form.elements.body.value = memory.body;
  form.elements.date.value = memory.date;
  form.elements.location.value = memory.location;
  form.elements.category.value = memory.category;
  form.elements.tags.value = memory.tags.join(',');
  $('#createTitle').textContent = '编辑记忆';
  $('#saveMemory').textContent = '保存修改';
  $('#aiToggle').classList.add('on');
  updatePhotoPreview();
  iconRefresh();
}

function showToast(message) {
  const toast = $('#toast'); toast.textContent = message; toast.classList.add('show');
  window.clearTimeout(showToast.timer); showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 2400);
}

function onboardingWasCompleted() {
  try { return localStorage.getItem(ONBOARDING_KEY) === 'completed'; } catch { return false; }
}

function renderOnboardingStep() {
  const step = onboardingSteps[onboardingStep];
  if (!step) return;
  $('#onboardingTitle').textContent = step.title;
  $('#onboardingText').textContent = step.text;
  $('#onboardingProgress').innerHTML = onboardingSteps.map((_, index) => `<span class="onboarding-dot ${index === onboardingStep ? 'active' : ''}" aria-hidden="true"></span>`).join('');
  $('#onboardingNext').textContent = onboardingStep === onboardingSteps.length - 1 ? '开始使用' : '下一步';
}

function closeOnboarding(markCompleted = true) {
  const tour = $('#onboardingTour');
  const backdrop = $('#onboardingBackdrop');
  if (!tour || !backdrop) return;
  tour.classList.add('hidden');
  backdrop.classList.add('hidden');
  tour.setAttribute('aria-hidden', 'true');
  if (markCompleted) {
    try { localStorage.setItem(ONBOARDING_KEY, 'completed'); } catch { /* private browsing may block storage */ }
  }
  const restore = onboardingRestoreFocus;
  onboardingRestoreFocus = null;
  if (restore?.isConnected && typeof restore.focus === 'function') restore.focus({ preventScroll: true });
}

function openOnboarding() {
  const tour = $('#onboardingTour');
  const backdrop = $('#onboardingBackdrop');
  if (!tour || !backdrop || onboardingWasCompleted()) return;
  onboardingRestoreFocus = document.activeElement;
  onboardingStep = 0;
  renderOnboardingStep();
  backdrop.classList.remove('hidden');
  tour.classList.remove('hidden');
  tour.setAttribute('aria-hidden', 'false');
  window.setTimeout(() => $('#onboardingNext')?.focus(), 0);
}

function maybeShowOnboarding() {
  if (!onboardingWasCompleted()) window.setTimeout(openOnboarding, 320);
}

function saveNewMemory(event) {
  event.preventDefault();
  const form = new FormData($('#memoryForm'));
  const date = form.get('date');
  const dateParts = /^([0-9]{4})-([0-9]{2})-([0-9]{2})$/.exec(date);
  const [year, month, day] = dateParts ? dateParts.slice(1).map(Number) : [NaN, NaN, NaN];
  const dateObject = dateParts ? new Date(`${date}T00:00:00`) : null;
  if (!dateParts || !Number.isInteger(year) || year < YEAR_MIN || year > YEAR_MAX || month < 1 || month > 12 || day < 1 || day > 31 || !dateObject || dateObject.getFullYear() !== year || dateObject.getMonth() + 1 !== month || dateObject.getDate() !== day) {
    showToast(`日期年份需在 ${YEAR_MIN} 到 ${YEAR_MAX} 年之间`);
    return;
  }
  const category = form.get('category');
  const title = form.get('title').trim();
  const body = form.get('body').trim();
  const tags = form.get('tags').split(/[,，]/).map(tag => tag.trim()).filter(Boolean);
  const location = form.get('location').trim() || '未添加地点';
  const cover = coverForCategory(category);
  const photos = draftPhotos.slice(0, MAX_PHOTOS);
  const photo = photos[0] || '';
  const editedMemory = editingMemoryId && memories.find(memory => memory.id === editingMemoryId);
  if (editedMemory) {
    Object.assign(editedMemory, { title, body, category, date, location, month, year, cover, photo, photos, tags: tags.length ? tags : ['新记忆'], ai: `关于“${title}”的一段生活记录` });
  } else {
    const newMemory = { id: `memory-${Date.now()}`, title, body, category, date, location, month, year, archived: false, cover, photo, photos, tags: tags.length ? tags : ['新记忆'], ai: `关于“${title}”的一段生活记录` };
    memories = [newMemory, ...memories];
  }
  const wasEditing = Boolean(editedMemory);
  editingMemoryId = null;
  draftPhotos = [];
  persistMemories();
  selectedYear = year; selectedMonth = month; selectedCategory = '全部';
  renderMonths(); renderCategoryStrip(); renderFeed(); renderSearchResults(); renderArchiveFeed();
  if (wasEditing) {
    detailOrigin = null;
    const updated = memories.find(memory => memory.id === editedMemory.id);
    updateDetail(updated);
    showToast('记忆已更新');
  } else {
    showScreen('home'); showToast('记忆已收好');
  }
}

function deleteMemory(id) {
  const memory = memories.find(item => item.id === id);
  if (!memory || !window.confirm(`确定删除“${memory.title}”吗？删除后无法恢复。`)) return;
  memories = memories.filter(item => item.id !== id);
  persistMemories();
  currentMemoryId = null;
  detailOrigin = null;
  closeDetailMenu();
  renderMonths(); renderCategoryStrip(); renderFeed(); renderSearchResults(); renderArchiveFeed();
  showScreen('home');
  showToast('记忆已删除');
}

function bindEvents() {
  $$('[data-create]').forEach(button => button.addEventListener('click', openCreate));
  $$('[data-back-home]').forEach(button => button.addEventListener('click', () => {
    if ($('#detailScreen').classList.contains('active')) closeDetail(); else showScreen('home');
  }));
  $('#searchOpen').addEventListener('click', () => { showScreen('search'); $('#searchInput').focus(); });
  $('#quickOpen').addEventListener('click', openQuickPanel);
  $('#quickClose').addEventListener('click', closeQuickPanel);
  $('#quickBackdrop').addEventListener('click', closeQuickPanel);
  $('#folderCreate').addEventListener('click', openFolderDialog);
  $('#folderDialogClose').addEventListener('click', closeFolderDialog);
  $('#folderDialogCancel').addEventListener('click', closeFolderDialog);
  $('#folderDialogBackdrop').addEventListener('click', closeFolderDialog);
  $('#onboardingNext').addEventListener('click', () => {
    if (onboardingStep >= onboardingSteps.length - 1) { closeOnboarding(); return; }
    onboardingStep += 1;
    renderOnboardingStep();
  });
  $('#onboardingSkip').addEventListener('click', () => closeOnboarding());
  $('#onboardingClose').addEventListener('click', () => closeOnboarding());
  $('#onboardingBackdrop').addEventListener('click', () => closeOnboarding());
  $('#folderForm').addEventListener('submit', createFolder);
  $('#memoryForm').addEventListener('submit', saveNewMemory);
  $('#saveMemory').addEventListener('click', () => $('#memoryForm').requestSubmit());
  $('#photoPick').addEventListener('click', openPhotoPicker);
  $('#photoInput').addEventListener('change', handlePhotoChange);
  $('#photoPreviewGrid').addEventListener('click', event => {
    const removeButton = event.target.closest('[data-photo-remove]');
    const coverButton = event.target.closest('[data-photo-cover]');
    if (removeButton) {
      draftPhotos.splice(Number(removeButton.dataset.photoRemove), 1);
      updatePhotoPreview();
      return;
    }
    if (coverButton) {
      const index = Number(coverButton.dataset.photoCover);
      if (index > 0) draftPhotos = [draftPhotos[index], ...draftPhotos.filter((_, photoIndex) => photoIndex !== index)];
      updatePhotoPreview();
    }
  });
  $('#emptyCreate').addEventListener('click', openCreate);
  $('#searchInput').addEventListener('input', renderSearchResults);
  $('#searchClear').addEventListener('click', () => { $('#searchInput').value = ''; renderSearchResults(); $('#searchInput').focus(); });
  $('#voiceRecord').addEventListener('click', () => showToast('正在聆听……语音转文字将在下一版接入'));
  $('#photoRecord').addEventListener('click', () => { openCreate(); openPhotoPicker(); });
  $('#placeRecord').addEventListener('click', () => showToast('地点选择器已打开'));
  $('#quickAi').addEventListener('click', () => showToast('AI 正在整理你的记忆……'));
  $('#detailMore').addEventListener('click', event => {
    event.stopPropagation();
    const menu = $('#detailMenu');
    if (menu.classList.contains('hidden')) openDetailMenu(); else closeDetailMenu();
  });
  $('#detailMenu').addEventListener('click', event => {
    event.stopPropagation();
    const action = event.target.closest('[data-detail-action]')?.dataset.detailAction;
    const memory = memories.find(item => item.id === currentMemoryId);
    if (!action || !memory) return;
    if (action === 'edit') openEdit(memory);
    if (action === 'archive') archiveMemory(memory.id);
    if (action === 'delete') deleteMemory(memory.id);
  });
  $('#yearSwitch').addEventListener('click', () => {
    const picker = $('#yearPicker');
    if (picker.classList.contains('hidden')) openYearPicker(); else closeYearPicker();
  });
  $('#yearPickerClose').addEventListener('click', closeYearPicker);
  $('#yearPrev').addEventListener('click', () => setSelectedYear(selectedYear - 1));
  $('#yearNext').addEventListener('click', () => setSelectedYear(selectedYear + 1));
  $('#yearInput').addEventListener('input', event => {
    if (!/^\d{4}$/.test(event.target.value)) return;
    setSelectedYear(event.target.value);
  });
  $('#yearInput').addEventListener('blur', event => {
    event.target.value = selectedYear;
  });
  $('#yearRange').addEventListener('input', event => setSelectedYear(event.target.value));
  $('#yearCurrent').addEventListener('click', () => { setSelectedYear(currentYear); closeYearPicker(); });
  $('#yearLatestMemory').addEventListener('click', () => {
    const latest = memories.filter(memory => !memory.archived).sort((a, b) => b.date.localeCompare(a.date))[0];
    if (!latest) return;
    selectedYear = clampYear(latest.year);
    selectedMonth = latest.month;
    selectedCategory = '全部';
    syncYearPicker(); renderMonths(); renderCategoryStrip(); renderFeed(); closeYearPicker();
  });
  $('#stackHint').addEventListener('click', event => { event.stopPropagation(); setStackExpanded(true, true); });
  $('#stackCollapse').addEventListener('click', event => { event.stopPropagation(); setStackExpanded(false, true); });
  document.addEventListener('click', event => {
    const picker = $('#yearPicker');
    if (!picker.classList.contains('hidden') && !picker.contains(event.target) && !$('#yearSwitch').contains(event.target)) closeYearPicker();
    const menu = $('#detailMenu');
    if (menu && !menu.classList.contains('hidden') && !menu.contains(event.target) && !$('#detailMore').contains(event.target)) closeDetailMenu();
  });
  $('#reminderSetting').addEventListener('click', () => {
    remindersEnabled = !remindersEnabled;
    localStorage.setItem(REMINDER_KEY, String(remindersEnabled));
    updateReminderUI();
    showToast(remindersEnabled ? '记忆提醒已开启' : '记忆提醒已关闭');
    if (remindersEnabled) checkMemoryReminder();
  });
  $('#aiToggle').addEventListener('click', event => event.currentTarget.classList.toggle('on'));
  $('#darkModeToggle').addEventListener('click', () => { document.body.classList.toggle('dark'); updateDarkModeUI(); showToast(document.body.classList.contains('dark') ? '已切换到深色模式' : '已切换到浅色模式'); });
  $('#detailHero').addEventListener('touchstart', event => { detailTouchStartX = event.touches[0]?.clientX || 0; }, { passive: true });
  $('#detailHero').addEventListener('touchend', event => {
    const delta = (event.changedTouches[0]?.clientX || 0) - detailTouchStartX;
    if (Math.abs(delta) < 45) return;
    const memory = memories.find(item => item.id === currentMemoryId);
    const photos = photosFor(memory);
    if (photos.length < 2) return;
    currentDetailPhotoIndex = (currentDetailPhotoIndex + (delta < 0 ? 1 : -1) + photos.length) % photos.length;
    renderDetailGallery(memory);
    iconRefresh();
  }, { passive: true });
  $$('[data-nav]').forEach(button => button.addEventListener('click', () => { const name = button.dataset.nav; showScreen(name === 'home' ? 'home' : name); if (name === 'search') { renderSearchCategories(); renderSearchResults(); } }));
  const stage = $('.phone-stage');
  stage.addEventListener('touchstart', event => { touchStartY = event.touches[0].clientY; }, { passive: true });
  stage.addEventListener('touchend', event => { const delta = event.changedTouches[0].clientY - touchStartY; if (touchStartY < 110 && delta > 60 && $('#homeScreen').classList.contains('active')) openQuickPanel(); }, { passive: true });
  window.addEventListener('keydown', event => {
    if (!$('#onboardingTour').classList.contains('hidden')) {
      if (event.key === 'Escape') { event.preventDefault(); closeOnboarding(); }
      return;
    }
    if ($('#detailScreen').classList.contains('active') && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) {
      const memory = memories.find(item => item.id === currentMemoryId);
      const photos = photosFor(memory);
      if (photos.length > 1) {
        currentDetailPhotoIndex = (currentDetailPhotoIndex + (event.key === 'ArrowRight' ? 1 : -1) + photos.length) % photos.length;
        renderDetailGallery(memory);
        iconRefresh();
        event.preventDefault();
      }
      return;
    }
    if (event.key !== 'Escape') return;
    if (!$('#yearPicker').classList.contains('hidden')) { closeYearPicker(); return; }
    if (!$('#detailMenu').classList.contains('hidden')) { closeDetailMenu(); return; }
    if (!$('#folderDialog').classList.contains('hidden')) { closeFolderDialog(); return; }
    if ($('#detailScreen').classList.contains('active')) { closeDetail(); return; }
    closeQuickPanel(); showScreen('home');
  });
}

migrateArchiveFolders();
renderMonths(); renderCategoryStrip(); renderSearchCategories(); renderFeed(); renderArchiveFeed(); updateReminderUI(); updateDarkModeUI(); bindEvents(); iconRefresh(); checkMemoryReminder();
maybeShowOnboarding();
