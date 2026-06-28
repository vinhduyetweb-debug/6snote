(function () {
  'use strict';

  const APP_VERSION = '1.0.0';
  const STORAGE_KEY = 'wisdom_notebook_records_v1';
  const SETTINGS_KEY = 'wisdom_notebook_settings_v1';
  const DRAFT_KEY = 'wisdom_notebook_draft_v1';
  const BACKUP_KEY = 'wisdom_notebook_last_backup_v1';

  const CATEGORY = {
    idea: { label: 'Ý tưởng', icon: '💡' },
    lesson: { label: 'Bài học', icon: '📚' },
    prompt: { label: 'Prompt AI', icon: '🤖' },
    quote: { label: 'Trích dẫn', icon: '💬' },
    checklist: { label: 'Checklist', icon: '✅' },
    link: { label: 'Link / Video', icon: '🔗' },
    book: { label: 'Sách / Tài liệu', icon: '📖' },
    other: { label: 'Khác', icon: '🧠' }
  };

  const STATE_COPY = {
    EMPTY: {
      explain: 'Chưa có tri thức nào. Hãy lưu một ý tưởng đáng dùng lại.',
      slogan: 'Một dòng hôm nay, một kho báu ngày mai.'
    },
    READY: {
      explain: 'Sổ đã có dữ liệu. Hãy tiếp tục ghi thứ có thể dùng lại.',
      slogan: 'Ghi ít nhưng đúng, nhớ lâu và dùng được.'
    },
    DONE: {
      explain: 'Hôm nay đã có ghi chú mới. Nhịp học đang được giữ.',
      slogan: 'Mỗi ngày một mảnh, lâu ngày thành kho.'
    },
    REVIEW_NEEDED: {
      explain: 'Đã vài ngày chưa ghi mới. Nên lưu lại một bài học gần nhất.',
      slogan: 'Không ghi lại, tri thức trôi qua như gió.'
    },
    OFFLINE: {
      explain: 'Đang offline. App vẫn lưu dữ liệu trong trình duyệt này.',
      slogan: 'Không mạng vẫn ghi, không mất vẫn nhớ.'
    },
    WARNING: {
      explain: 'Trình duyệt không lưu được dữ liệu. Hãy xuất JSON nếu có thể.',
      slogan: 'Dữ liệu quý phải có bản sao.'
    }
  };

  const $ = (selector) => document.querySelector(selector);

  const els = {};
  const state = {
    notes: [],
    search: '',
    category: 'all',
    status: 'active',
    sort: 'updated_desc',
    activeTag: '',
    editingId: ''
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    loadSettings();
    loadNotes();
    restoreDraft();
    bindEvents();
    renderNetwork();
    renderAll();
    registerServiceWorker();
    toast('Sổ Thông Thái đã sẵn sàng.');
  }

  function cacheElements() {
    Object.assign(els, {
      networkPill: $('#networkPill'),
      networkText: $('#networkText'),
      stateBadge: $('#stateBadge'),
      stateExplain: $('#stateExplain'),
      stateSlogan: $('#stateSlogan'),
      exportJson: $('#exportJson'),
      toggleFocus: $('#toggleFocus'),
      noteForm: $('#noteForm'),
      noteId: $('#noteId'),
      noteTitle: $('#noteTitle'),
      noteContent: $('#noteContent'),
      noteCategory: $('#noteCategory'),
      notePriority: $('#notePriority'),
      noteTags: $('#noteTags'),
      noteSource: $('#noteSource'),
      saveButton: $('#saveButton'),
      clearForm: $('#clearForm'),
      cancelEdit: $('#cancelEdit'),
      draftStatus: $('#draftStatus'),
      searchInput: $('#searchInput'),
      categoryFilter: $('#categoryFilter'),
      statusFilter: $('#statusFilter'),
      sortSelect: $('#sortSelect'),
      tagBar: $('#tagBar'),
      noteList: $('#noteList'),
      resultCount: $('#resultCount'),
      metricTotal: $('#metricTotal'),
      metricToday: $('#metricToday'),
      metricFavorites: $('#metricFavorites'),
      metricTags: $('#metricTags'),
      dailyNudge: $('#dailyNudge'),
      importButton: $('#importButton'),
      importFile: $('#importFile'),
      resetData: $('#resetData'),
      toast: $('#toast')
    });
  }

  function bindEvents() {
    window.addEventListener('online', renderNetwork);
    window.addEventListener('offline', renderNetwork);

    els.noteForm.addEventListener('submit', handleSave);
    els.clearForm.addEventListener('click', () => clearForm({ keepDraft: false }));
    els.cancelEdit.addEventListener('click', cancelEdit);
    els.exportJson.addEventListener('click', exportJson);
    els.importButton.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importJson);
    els.resetData.addEventListener('click', resetData);
    els.toggleFocus.addEventListener('click', toggleFocusMode);

    [els.noteTitle, els.noteContent, els.noteCategory, els.notePriority, els.noteTags, els.noteSource].forEach((el) => {
      el.addEventListener('input', saveDraft);
      el.addEventListener('change', saveDraft);
    });

    els.searchInput.addEventListener('input', () => {
      state.search = els.searchInput.value.trim();
      saveSettings();
      renderAll();
    });
    els.categoryFilter.addEventListener('change', () => {
      state.category = els.categoryFilter.value;
      state.activeTag = '';
      saveSettings();
      renderAll();
    });
    els.statusFilter.addEventListener('change', () => {
      state.status = els.statusFilter.value;
      saveSettings();
      renderAll();
    });
    els.sortSelect.addEventListener('change', () => {
      state.sort = els.sortSelect.value;
      saveSettings();
      renderAll();
    });

    els.noteList.addEventListener('click', handleListAction);
    els.tagBar.addEventListener('click', handleTagClick);
  }

  function loadSettings() {
    const settings = safeRead(SETTINGS_KEY, {});
    state.search = settings.search || '';
    state.category = settings.category || 'all';
    state.status = settings.status || 'active';
    state.sort = settings.sort || 'updated_desc';
    state.activeTag = settings.activeTag || '';

    els.searchInput.value = state.search;
    els.categoryFilter.value = state.category;
    els.statusFilter.value = state.status;
    els.sortSelect.value = state.sort;
    document.body.classList.toggle('focus-mode', Boolean(settings.focusMode));
  }

  function saveSettings() {
    writeJson(SETTINGS_KEY, {
      version: APP_VERSION,
      search: state.search,
      category: state.category,
      status: state.status,
      sort: state.sort,
      activeTag: state.activeTag,
      focusMode: document.body.classList.contains('focus-mode'),
      updatedAt: new Date().toISOString()
    });
  }

  function loadNotes() {
    const raw = safeRead(STORAGE_KEY, []);
    state.notes = Array.isArray(raw) ? raw.map(normalizeNote).filter(Boolean) : [];
    persistNotes(false);
  }

  function normalizeNote(item) {
    if (!item || typeof item !== 'object') return null;
    const now = new Date().toISOString();
    const title = String(item.title || '').trim();
    const content = String(item.content || '').trim();
    if (!title && !content) return null;

    return {
      id: String(item.id || makeId()),
      schemaVersion: 1,
      title: title || 'Ghi chú chưa đặt tên',
      content,
      category: CATEGORY[item.category] ? item.category : 'other',
      priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
      tags: Array.isArray(item.tags) ? item.tags.map(cleanTag).filter(Boolean).slice(0, 12) : parseTags(item.tags || ''),
      source: String(item.source || '').trim(),
      favorite: Boolean(item.favorite),
      archived: Boolean(item.archived),
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now
    };
  }

  function handleSave(event) {
    event.preventDefault();
    const now = new Date().toISOString();
    const title = els.noteTitle.value.trim();
    const content = els.noteContent.value.trim();

    if (!title) {
      toast('Cần có tiêu đề để lưu cho dễ tìm lại.');
      els.noteTitle.focus();
      return;
    }

    const payload = {
      title,
      content,
      category: els.noteCategory.value,
      priority: els.notePriority.value,
      tags: parseTags(els.noteTags.value),
      source: els.noteSource.value.trim(),
      updatedAt: now
    };

    if (state.editingId) {
      const index = state.notes.findIndex((note) => note.id === state.editingId);
      if (index < 0) {
        toast('Không tìm thấy ghi chú đang sửa.');
        cancelEdit();
        return;
      }
      state.notes[index] = { ...state.notes[index], ...payload };
      persistNotes();
      toast('Đã cập nhật tri thức.');
    } else {
      state.notes.unshift({
        id: makeId(),
        schemaVersion: 1,
        ...payload,
        favorite: false,
        archived: false,
        createdAt: now
      });
      persistNotes();
      toast('Đã lưu vào Sổ Thông Thái.');
    }

    localStorage.removeItem(DRAFT_KEY);
    clearForm({ keepDraft: false });
    renderAll();
  }

  function persistNotes(showWarning = true) {
    const ok = writeJson(STORAGE_KEY, state.notes);
    if (!ok && showWarning) updateState('WARNING');
    return ok;
  }

  function renderAll() {
    renderDashboard();
    renderTags();
    renderList();
    renderState();
  }

  function renderDashboard() {
    const today = todayKey();
    const active = state.notes.filter((note) => !note.archived);
    const tags = new Set(active.flatMap((note) => note.tags));
    const todayCount = active.filter((note) => note.createdAt.slice(0, 10) === today).length;

    els.metricTotal.textContent = active.length;
    els.metricToday.textContent = todayCount;
    els.metricFavorites.textContent = active.filter((note) => note.favorite).length;
    els.metricTags.textContent = tags.size;

    const nudge = makeDailyNudge(active, todayCount);
    els.dailyNudge.textContent = nudge;
  }

  function renderTags() {
    const counts = new Map();
    state.notes.filter((note) => !note.archived).forEach((note) => {
      note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    const tags = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .slice(0, 16);

    if (!tags.length) {
      els.tagBar.innerHTML = '';
      return;
    }

    els.tagBar.innerHTML = [
      `<button class="tag-chip ${state.activeTag ? '' : 'active'}" type="button" data-tag="">Tất cả tag</button>`,
      ...tags.map(([tag, count]) => `<button class="tag-chip ${state.activeTag === tag ? 'active' : ''}" type="button" data-tag="${escapeAttr(tag)}">#${escapeHtml(tag)} · ${count}</button>`)
    ].join('');
  }

  function renderList() {
    const notes = getFilteredNotes();
    els.resultCount.textContent = `${notes.length} mục`;

    if (!notes.length) {
      els.noteList.innerHTML = renderEmpty();
      return;
    }

    els.noteList.innerHTML = notes.map(renderNoteCard).join('');
  }

  function renderNoteCard(note) {
    const cat = CATEGORY[note.category] || CATEGORY.other;
    const tags = note.tags.length
      ? `<div class="note-tags">${note.tags.map((tag) => `<span class="note-tag">#${escapeHtml(tag)}</span>`).join('')}</div>`
      : '';
    const source = note.source
      ? `<a class="note-tag" href="${escapeAttr(note.source)}" target="_blank" rel="noopener noreferrer">Mở nguồn</a>`
      : '';
    const content = note.content ? escapeHtml(note.content) : '<span class="muted">Không có nội dung chi tiết.</span>';

    return `
      <article class="note-card ${note.archived ? 'archived' : ''}" data-id="${escapeAttr(note.id)}">
        <div class="note-top">
          <div>
            <h3>${note.favorite ? '⭐ ' : ''}${escapeHtml(note.title)}</h3>
            <div class="note-meta">
              <span>${cat.icon} ${cat.label}</span>
              <span>·</span>
              <span>${priorityLabel(note.priority)}</span>
              <span>·</span>
              <span>Sửa ${formatDate(note.updatedAt)}</span>
            </div>
          </div>
          <div class="note-actions">
            <button class="icon-btn" type="button" data-action="favorite" title="Yêu thích">${note.favorite ? '★' : '☆'}</button>
            <button class="icon-btn" type="button" data-action="copy" title="Copy">Copy</button>
            <button class="icon-btn" type="button" data-action="edit" title="Sửa">Sửa</button>
            <button class="icon-btn" type="button" data-action="archive" title="Lưu trữ">${note.archived ? 'Mở lại' : 'Ẩn'}</button>
            <button class="icon-btn" type="button" data-action="delete" title="Xóa">Xóa</button>
          </div>
        </div>
        <p class="note-content">${content}</p>
        <div class="note-meta">
          ${source}
          <span>Tạo ${formatDate(note.createdAt)}</span>
        </div>
        ${tags}
      </article>`;
  }

  function renderEmpty() {
    const message = state.search || state.category !== 'all' || state.activeTag
      ? 'Không tìm thấy ghi chú phù hợp. Hãy bỏ lọc hoặc thử từ khóa khác.'
      : 'Sổ đang trống. Ghi một điều nhỏ trước đã.';
    return `
      <div class="empty-box">
        <h3>📘 Chưa có gì để hiển thị</h3>
        <p class="muted">${escapeHtml(message)}</p>
        <a class="button primary" href="#capture">+ Ghi tri thức đầu tiên</a>
      </div>`;
  }

  function renderState() {
    if (!navigator.onLine) {
      updateState('OFFLINE');
      return;
    }
    if (!state.notes.length) {
      updateState('EMPTY');
      return;
    }
    const active = state.notes.filter((note) => !note.archived);
    const today = todayKey();
    const todayCount = active.filter((note) => note.createdAt.slice(0, 10) === today).length;
    if (todayCount > 0) {
      updateState('DONE');
      return;
    }
    const last = active.slice().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
    if (last && daysBetween(last.createdAt, new Date().toISOString()) >= 3) {
      updateState('REVIEW_NEEDED');
      return;
    }
    updateState('READY');
  }

  function updateState(key) {
    const copy = STATE_COPY[key] || STATE_COPY.READY;
    els.stateBadge.textContent = key;
    els.stateBadge.className = `state-badge ${key.toLowerCase()}`;
    els.stateExplain.textContent = copy.explain;
    els.stateSlogan.textContent = copy.slogan;
  }

  function getFilteredNotes() {
    const query = state.search.toLowerCase();
    return state.notes.filter((note) => {
      if (state.status === 'active' && note.archived) return false;
      if (state.status === 'archived' && !note.archived) return false;
      if (state.status === 'favorite' && !note.favorite) return false;
      if (state.category !== 'all' && note.category !== state.category) return false;
      if (state.activeTag && !note.tags.includes(state.activeTag)) return false;
      if (!query) return true;
      const haystack = [note.title, note.content, note.category, note.priority, note.tags.join(' '), note.source]
        .join(' ')
        .toLowerCase();
      return haystack.includes(query);
    }).sort(sortNotes);
  }

  function sortNotes(a, b) {
    if (state.sort === 'created_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (state.sort === 'title_asc') return a.title.localeCompare(b.title, 'vi');
    if (state.sort === 'priority_desc') return priorityScore(b.priority) - priorityScore(a.priority) || new Date(b.updatedAt) - new Date(a.updatedAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }

  function handleListAction(event) {
    const button = event.target.closest('[data-action]');
    const card = event.target.closest('[data-id]');
    if (!button || !card) return;
    const note = state.notes.find((item) => item.id === card.dataset.id);
    if (!note) return;

    const action = button.dataset.action;
    if (action === 'favorite') toggleFavorite(note.id);
    if (action === 'copy') copyNote(note);
    if (action === 'edit') editNote(note);
    if (action === 'archive') toggleArchive(note.id);
    if (action === 'delete') deleteNote(note.id);
  }

  function handleTagClick(event) {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.activeTag = button.dataset.tag || '';
    saveSettings();
    renderAll();
  }

  function toggleFavorite(id) {
    const note = findNote(id);
    if (!note) return;
    note.favorite = !note.favorite;
    note.updatedAt = new Date().toISOString();
    persistNotes();
    renderAll();
    toast(note.favorite ? 'Đã đánh dấu yêu thích.' : 'Đã bỏ yêu thích.');
  }

  function toggleArchive(id) {
    const note = findNote(id);
    if (!note) return;
    note.archived = !note.archived;
    note.updatedAt = new Date().toISOString();
    persistNotes();
    renderAll();
    toast(note.archived ? 'Đã đưa vào lưu trữ.' : 'Đã mở lại ghi chú.');
  }

  function deleteNote(id) {
    const note = findNote(id);
    if (!note) return;
    const ok = window.confirm(`Xóa vĩnh viễn ghi chú "${note.title}"?`);
    if (!ok) return;
    state.notes = state.notes.filter((item) => item.id !== id);
    persistNotes();
    if (state.editingId === id) clearForm({ keepDraft: false });
    renderAll();
    toast('Đã xóa ghi chú.');
  }

  function editNote(note) {
    state.editingId = note.id;
    els.noteId.value = note.id;
    els.noteTitle.value = note.title;
    els.noteContent.value = note.content;
    els.noteCategory.value = note.category;
    els.notePriority.value = note.priority;
    els.noteTags.value = note.tags.join(', ');
    els.noteSource.value = note.source;
    els.saveButton.textContent = 'Cập nhật';
    els.cancelEdit.classList.remove('hidden');
    els.draftStatus.textContent = 'Đang sửa';
    $('#capture').scrollIntoView({ behavior: 'smooth', block: 'start' });
    els.noteTitle.focus();
  }

  function cancelEdit() {
    state.editingId = '';
    clearForm({ keepDraft: false });
    toast('Đã hủy sửa.');
  }

  function clearForm(options = {}) {
    state.editingId = '';
    els.noteForm.reset();
    els.noteId.value = '';
    els.noteCategory.value = 'idea';
    els.notePriority.value = 'medium';
    els.saveButton.textContent = 'Lưu tri thức';
    els.cancelEdit.classList.add('hidden');
    els.draftStatus.textContent = 'Draft an toàn';
    if (!options.keepDraft) localStorage.removeItem(DRAFT_KEY);
  }

  function saveDraft() {
    if (state.editingId) return;
    const draft = {
      title: els.noteTitle.value,
      content: els.noteContent.value,
      category: els.noteCategory.value,
      priority: els.notePriority.value,
      tags: els.noteTags.value,
      source: els.noteSource.value,
      updatedAt: new Date().toISOString()
    };
    const hasDraft = Object.values(draft).some((value) => String(value || '').trim() && value !== draft.updatedAt);
    if (!hasDraft) {
      localStorage.removeItem(DRAFT_KEY);
      els.draftStatus.textContent = 'Draft an toàn';
      return;
    }
    writeJson(DRAFT_KEY, draft);
    els.draftStatus.textContent = 'Đã giữ nháp';
  }

  function restoreDraft() {
    const draft = safeRead(DRAFT_KEY, null);
    if (!draft || typeof draft !== 'object') return;
    els.noteTitle.value = draft.title || '';
    els.noteContent.value = draft.content || '';
    els.noteCategory.value = CATEGORY[draft.category] ? draft.category : 'idea';
    els.notePriority.value = ['low', 'medium', 'high'].includes(draft.priority) ? draft.priority : 'medium';
    els.noteTags.value = draft.tags || '';
    els.noteSource.value = draft.source || '';
    els.draftStatus.textContent = 'Đã khôi phục nháp';
  }

  function copyNote(note) {
    const cat = CATEGORY[note.category] || CATEGORY.other;
    const text = [
      `${note.favorite ? '⭐ ' : ''}${note.title}`,
      `${cat.icon} ${cat.label} · ${priorityLabel(note.priority)}`,
      note.tags.length ? `Tags: ${note.tags.map((tag) => `#${tag}`).join(' ')}` : '',
      note.source ? `Nguồn: ${note.source}` : '',
      '',
      note.content
    ].filter(Boolean).join('\n');

    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(() => toast('Đã copy ghi chú.')).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
  }

  function fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast('Đã copy ghi chú.');
    } catch (error) {
      toast('Không copy được, hãy chọn thủ công.');
    } finally {
      textarea.remove();
    }
  }

  function exportJson() {
    const payload = {
      app: 'Sổ Thông Thái',
      version: APP_VERSION,
      exportedAt: new Date().toISOString(),
      records: state.notes,
      settings: safeRead(SETTINGS_KEY, {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `so-thong-thai-backup-${date}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    localStorage.setItem(BACKUP_KEY, payload.exportedAt);
    toast('Đã xuất JSON sao lưu.');
  }

  function importJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const payload = JSON.parse(String(reader.result || '{}'));
        const records = Array.isArray(payload.records) ? payload.records : Array.isArray(payload.notes) ? payload.notes : [];
        if (!records.length) throw new Error('File không có records.');
        const existing = new Map(state.notes.map((note) => [note.id, note]));
        let count = 0;
        records.map(normalizeNote).filter(Boolean).forEach((note) => {
          const old = existing.get(note.id);
          existing.set(note.id, old ? { ...old, ...note, updatedAt: note.updatedAt || new Date().toISOString() } : note);
          count += 1;
        });
        state.notes = Array.from(existing.values()).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        persistNotes();
        renderAll();
        toast(`Đã nhập ${count} ghi chú.`);
      } catch (error) {
        toast(error.message || 'Không nhập được file JSON.');
      } finally {
        els.importFile.value = '';
      }
    };
    reader.onerror = () => toast('Không đọc được file.');
    reader.readAsText(file);
  }

  function resetData() {
    const answer = window.prompt('Nhập XOA để reset toàn bộ Sổ Thông Thái. Nên xuất JSON trước khi reset.');
    if (answer !== 'XOA') {
      toast('Đã hủy reset.');
      return;
    }
    state.notes = [];
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(BACKUP_KEY);
    clearForm({ keepDraft: false });
    renderAll();
    toast('Đã reset dữ liệu.');
  }

  function toggleFocusMode() {
    document.body.classList.toggle('focus-mode');
    saveSettings();
    toast(document.body.classList.contains('focus-mode') ? 'Đã bật Focus Mode.' : 'Đã tắt Focus Mode.');
  }

  function renderNetwork() {
    const online = navigator.onLine;
    els.networkPill.classList.toggle('online', online);
    els.networkPill.classList.toggle('offline', !online);
    els.networkText.textContent = online ? 'Online' : 'Offline';
    renderState();
  }

  function registerServiceWorker() {
    if (!('serviceWorker' in navigator)) return;
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('./service-worker.js').catch(() => {
        console.warn('Không đăng ký được service worker.');
      });
    });
  }

  function findNote(id) {
    return state.notes.find((note) => note.id === id);
  }

  function parseTags(input) {
    if (Array.isArray(input)) return input.map(cleanTag).filter(Boolean).slice(0, 12);
    return String(input || '')
      .split(/[#,;，\n]/)
      .map(cleanTag)
      .filter(Boolean)
      .filter((tag, index, list) => list.indexOf(tag) === index)
      .slice(0, 12);
  }

  function cleanTag(tag) {
    return String(tag || '').trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-').slice(0, 32);
  }

  function makeDailyNudge(active, todayCount) {
    if (!active.length) return 'Bắt đầu bằng một ghi chú 3 dòng: điều gì, vì sao đáng nhớ, dùng lại khi nào.';
    if (todayCount > 0) return 'Hôm nay đã ghi rồi. Hãy đánh dấu ⭐ cho ghi chú quan trọng nhất.';
    const fav = active.find((note) => note.favorite);
    if (fav) return `Đọc lại ghi chú yêu thích: ${fav.title}`;
    return 'Ghi một bài học vừa học được, dù chỉ 3 dòng.';
  }

  function priorityScore(priority) {
    return { high: 3, medium: 2, low: 1 }[priority] || 2;
  }

  function priorityLabel(priority) {
    if (priority === 'high') return 'Dùng lại cao';
    if (priority === 'low') return 'Dùng lại thấp';
    return 'Dùng lại vừa';
  }

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (error) {
      console.warn(`Không đọc được ${key}:`, error);
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Không lưu được ${key}:`, error);
      toast('Không lưu được dữ liệu. Có thể bộ nhớ trình duyệt đã đầy.');
      return false;
    }
  }

  function makeId() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return `wisdom-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function daysBetween(startIso, endIso) {
    const a = new Date(startIso);
    const b = new Date(endIso);
    if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 0;
    return Math.floor((b - a) / 86400000);
  }

  function formatDate(iso) {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'không rõ ngày';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#96;');
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    window.clearTimeout(toast.timer);
    toast.timer = window.setTimeout(() => els.toast.classList.remove('show'), 2400);
  }
})();
