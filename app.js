(function () {
  'use strict';

  const APP_VERSION = '1.1.0';
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
    framework: { label: 'Framework', icon: '🧩' },
    other: { label: 'Khác', icon: '🧠' }
  };

  const STATE_COPY = {
    EMPTY: {
      explain: 'Chưa có tri thức nào. Hãy lưu một ý tưởng đáng dùng lại.',
      slogan: 'Một dòng hôm nay, một kho báu ngày mai.'
    },
    READY: {
      explain: 'Sổ đã có dữ liệu. Hãy chưng cất tri thức thành hành động.',
      slogan: 'Không chỉ ghi nhớ. Phải dùng được.'
    },
    DONE: {
      explain: 'Hôm nay đã có tri thức mới. Nhịp học đang được giữ.',
      slogan: 'Ghi ít nhưng đúng, nhớ lâu và dùng được.'
    },
    REVIEW_NEEDED: {
      explain: 'Có thẻ đến hạn ôn hoặc lâu chưa ghi mới.',
      slogan: 'Tri thức không ôn sẽ ngủ quên.'
    },
    ACTION_NEEDED: {
      explain: 'Có tri thức đã sinh hành động nhưng chưa làm.',
      slogan: 'Biết mà chưa làm thì vẫn là ghi chú.'
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

  const REVIEW_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30, 60];
  const STOP_WORDS = new Set('và là của có cho trong một những các với được khi này đó thì vào để hoặc từ như hơn sẽ đã đang vì trên dưới nếu cũng rất nhưng không cần nên'.split(' '));

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));

  const els = {};
  const state = {
    notes: [],
    search: '',
    category: 'all',
    status: 'active',
    sort: 'updated_desc',
    activeTag: '',
    view: 'today',
    editingId: '',
    saveMode: 'distill'
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
    toast('Knowledge OS đã sẵn sàng.');
  }

  function cacheElements() {
    Object.assign(els, {
      networkPill: $('#networkPill'),
      networkText: $('#networkText'),
      stateBadge: $('#stateBadge'),
      stateExplain: $('#stateExplain'),
      stateSlogan: $('#stateSlogan'),
      exportJson: $('#exportJson'),
      quickDistill: $('#quickDistill'),
      noteForm: $('#noteForm'),
      noteId: $('#noteId'),
      noteTitle: $('#noteTitle'),
      noteContent: $('#noteContent'),
      noteCategory: $('#noteCategory'),
      notePriority: $('#notePriority'),
      noteTags: $('#noteTags'),
      noteSource: $('#noteSource'),
      noteAction: $('#noteAction'),
      saveButton: $('#saveButton'),
      savePlainButton: $('#savePlainButton'),
      clearForm: $('#clearForm'),
      cancelEdit: $('#cancelEdit'),
      draftStatus: $('#draftStatus'),
      searchInput: $('#searchInput'),
      categoryFilter: $('#categoryFilter'),
      statusFilter: $('#statusFilter'),
      sortSelect: $('#sortSelect'),
      tagBar: $('#tagBar'),
      workbench: $('#workbench'),
      resultCount: $('#resultCount'),
      viewHint: $('#viewHint'),
      metricTotal: $('#metricTotal'),
      metricDue: $('#metricDue'),
      metricActions: $('#metricActions'),
      metricCards: $('#metricCards'),
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

    els.noteForm.addEventListener('submit', (event) => handleSave(event, true));
    els.savePlainButton.addEventListener('click', (event) => handleSave(event, false));
    els.clearForm.addEventListener('click', () => clearForm({ keepDraft: false }));
    els.cancelEdit.addEventListener('click', cancelEdit);
    els.exportJson.addEventListener('click', exportJson);
    els.quickDistill.addEventListener('click', distillLatest);
    els.importButton.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importJson);
    els.resetData.addEventListener('click', resetData);

    [els.noteTitle, els.noteContent, els.noteCategory, els.notePriority, els.noteTags, els.noteSource, els.noteAction].forEach((el) => {
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

    $$('.tab').forEach((button) => {
      button.addEventListener('click', () => {
        state.view = button.dataset.view;
        saveSettings();
        renderAll();
      });
    });

    els.workbench.addEventListener('click', handleWorkbenchAction);
    els.tagBar.addEventListener('click', handleTagClick);
  }

  function loadSettings() {
    const settings = safeRead(SETTINGS_KEY, {});
    state.search = settings.search || '';
    state.category = settings.category || 'all';
    state.status = settings.status || 'active';
    state.sort = settings.sort || 'updated_desc';
    state.activeTag = settings.activeTag || '';
    state.view = settings.view || 'today';

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
      view: state.view,
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

    const note = {
      id: String(item.id || makeId()),
      schemaVersion: 2,
      title: title || 'Ghi chú chưa đặt tên',
      content,
      category: CATEGORY[item.category] ? item.category : 'other',
      priority: ['low', 'medium', 'high'].includes(item.priority) ? item.priority : 'medium',
      tags: Array.isArray(item.tags) ? item.tags.map(cleanTag).filter(Boolean).slice(0, 16) : parseTags(item.tags || ''),
      source: String(item.source || '').trim(),
      favorite: Boolean(item.favorite),
      archived: Boolean(item.archived),
      createdAt: item.createdAt || now,
      updatedAt: item.updatedAt || now,
      distilledAt: item.distilledAt || '',
      summary: String(item.summary || '').trim(),
      lesson: String(item.lesson || '').trim(),
      actionText: String(item.actionText || item.action || '').trim(),
      actionDone: Boolean(item.actionDone),
      flashcards: Array.isArray(item.flashcards) ? item.flashcards.map(normalizeCard).filter(Boolean).slice(0, 8) : [],
      reviewLevel: Number.isFinite(Number(item.reviewLevel)) ? clamp(Number(item.reviewLevel), 0, 6) : 0,
      lastReviewedAt: item.lastReviewedAt || '',
      nextReviewAt: item.nextReviewAt || '',
      links: Array.isArray(item.links) ? item.links.map(String).slice(0, 20) : []
    };

    if (!note.summary && item.insight && typeof item.insight === 'object') {
      note.summary = String(item.insight.summary || '').trim();
      note.lesson = String(item.insight.lesson || '').trim();
    }
    if (!note.nextReviewAt) note.nextReviewAt = addDays(note.createdAt, 1);
    return note;
  }

  function normalizeCard(card) {
    if (!card || typeof card !== 'object') return null;
    const q = String(card.q || card.question || '').trim();
    const a = String(card.a || card.answer || '').trim();
    if (!q || !a) return null;
    return { q, a };
  }

  function handleSave(event, shouldDistill) {
    event.preventDefault();
    const now = new Date().toISOString();
    const title = els.noteTitle.value.trim();
    const content = els.noteContent.value.trim();

    if (!title) {
      toast('Cần có tiêu đề để lưu cho dễ tìm lại.');
      els.noteTitle.focus();
      return;
    }

    const base = {
      title,
      content,
      category: els.noteCategory.value,
      priority: els.notePriority.value,
      tags: parseTags(els.noteTags.value),
      source: els.noteSource.value.trim(),
      actionText: els.noteAction.value.trim(),
      actionDone: false,
      updatedAt: now
    };

    const insight = shouldDistill ? buildInsight(base) : {};
    const payload = { ...base, ...insight };

    if (state.editingId) {
      const index = state.notes.findIndex((note) => note.id === state.editingId);
      if (index < 0) {
        toast('Không tìm thấy ghi chú đang sửa.');
        cancelEdit();
        return;
      }
      const old = state.notes[index];
      state.notes[index] = normalizeNote({
        ...old,
        ...payload,
        flashcards: shouldDistill ? payload.flashcards : old.flashcards,
        reviewLevel: shouldDistill ? 0 : old.reviewLevel,
        nextReviewAt: shouldDistill ? addDays(now, 1) : old.nextReviewAt
      });
      persistNotes();
      toast(shouldDistill ? 'Đã cập nhật và chưng cất lại.' : 'Đã cập nhật tri thức.');
    } else {
      state.notes.unshift(normalizeNote({
        id: makeId(),
        ...payload,
        favorite: false,
        archived: false,
        createdAt: now,
        nextReviewAt: shouldDistill ? addDays(now, 1) : addDays(now, 2)
      }));
      persistNotes();
      toast(shouldDistill ? 'Đã lưu, rút ý chính và tạo thẻ ôn tập.' : 'Đã lưu vào Sổ Thông Thái.');
    }

    localStorage.removeItem(DRAFT_KEY);
    clearForm({ keepDraft: false });
    state.view = shouldDistill ? 'today' : state.view;
    saveSettings();
    renderAll();
  }

  function buildInsight(note) {
    const text = [note.title, note.content].join('\n').trim();
    const sentences = splitSentences(text);
    const topSentences = rankSentences(sentences).slice(0, 3);
    const summary = topSentences.join(' ');
    const lesson = makeLesson(note, topSentences);
    const generatedTags = inferTags(text).filter((tag) => !note.tags.includes(tag)).slice(0, 5);
    const tags = unique([...note.tags, ...generatedTags]).slice(0, 16);
    const actionText = note.actionText || inferAction(note, topSentences);
    const flashcards = makeFlashcards(note, topSentences, tags).slice(0, 4);
    const now = new Date().toISOString();

    return {
      tags,
      summary: summary || note.content.slice(0, 220),
      lesson,
      actionText,
      actionDone: false,
      flashcards,
      reviewLevel: 0,
      lastReviewedAt: '',
      nextReviewAt: addDays(now, 1),
      distilledAt: now
    };
  }

  function splitSentences(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .split(/(?<=[.!?。！？])\s+|\n+/)
      .map((s) => s.trim().replace(/^[-*•\d.)\s]+/, ''))
      .filter((s) => s.length > 12)
      .slice(0, 24);
  }

  function rankSentences(sentences) {
    const keywords = ['quan trọng', 'bài học', 'cần', 'nên', 'không', 'mục tiêu', 'kết quả', 'hành động', 'framework', 'checklist', 'ai', 'tài chính', 'tri thức'];
    return sentences.slice().sort((a, b) => scoreSentence(b) - scoreSentence(a));

    function scoreSentence(s) {
      const lower = normalizeText(s);
      let score = Math.min(s.length, 180) / 22;
      keywords.forEach((kw) => { if (lower.includes(kw)) score += 3; });
      if (/\d/.test(s)) score += 1.5;
      if (s.includes(':')) score += 1;
      return score;
    }
  }

  function inferTags(text) {
    const explicit = (String(text || '').match(/#[\p{L}\p{N}_-]+/gu) || []).map((x) => cleanTag(x.slice(1)));
    const words = normalizeText(text)
      .replace(/https?:\/\/\S+/g, ' ')
      .split(/[^\p{L}\p{N}]+/u)
      .map(cleanTag)
      .filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
    const counts = new Map();
    words.forEach((word) => counts.set(word, (counts.get(word) || 0) + 1));
    const frequent = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
      .slice(0, 8)
      .map(([word]) => word);
    return unique([...explicit, ...frequent]).slice(0, 8);
  }

  function makeLesson(note, sentences) {
    if (note.category === 'prompt') return 'Bài học: prompt tốt phải có bối cảnh, vai trò, đầu ra mong muốn và tiêu chí kiểm tra.';
    if (note.category === 'checklist') return 'Bài học: checklist chỉ có giá trị khi biến thành quy trình lặp lại được.';
    if (note.category === 'quote') return 'Bài học: câu hay cần gắn với một hành vi cụ thể, không chỉ đọc cho cảm xúc.';
    const base = sentences[0] || note.content || note.title;
    return `Bài học: ${trimText(base, 180)}`;
  }

  function inferAction(note, sentences) {
    if (note.category === 'prompt') return 'Dùng prompt này thử với một tài liệu thật và lưu kết quả.';
    if (note.category === 'link') return 'Xem lại nguồn, rút 3 ý chính và quyết định có lưu thành checklist không.';
    if (note.category === 'book') return 'Rút 1 đoạn áp dụng được trong tuần này.';
    if (note.category === 'checklist') return 'Chạy thử checklist này một lần trong thực tế.';
    const base = sentences.find((s) => normalizeText(s).includes('nên') || normalizeText(s).includes('cần')) || sentences[0];
    return base ? `Làm thử: ${trimText(base, 140)}` : 'Chọn một hành động nhỏ để áp dụng tri thức này trong hôm nay.';
  }

  function makeFlashcards(note, sentences, tags) {
    const cards = [];
    cards.push({ q: `Ý chính của "${trimText(note.title, 70)}" là gì?`, a: trimText(sentences[0] || note.content || note.title, 220) });
    if (note.actionText) cards.push({ q: 'Tri thức này nên biến thành hành động nào?', a: note.actionText });
    if (tags.length) cards.push({ q: 'Ghi chú này thuộc những tag nào?', a: tags.slice(0, 5).map((tag) => `#${tag}`).join(', ') });
    if (sentences[1]) cards.push({ q: 'Bài học phụ cần nhớ là gì?', a: trimText(sentences[1], 220) });
    return cards;
  }

  function distillLatest() {
    const note = state.notes.find((item) => !item.archived);
    if (!note) {
      toast('Chưa có ghi chú để chưng cất.');
      return;
    }
    Object.assign(note, buildInsight(note));
    note.updatedAt = new Date().toISOString();
    persistNotes();
    state.view = 'today';
    renderAll();
    toast('Đã chưng cất mục mới nhất.');
  }

  function persistNotes(showWarning = true) {
    const ok = writeJson(STORAGE_KEY, state.notes);
    if (!ok && showWarning) updateState('WARNING');
    return ok;
  }

  function renderAll() {
    activateTabs();
    renderDashboard();
    renderTags();
    renderWorkbench();
    renderState();
  }

  function activateTabs() {
    $$('.tab').forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
  }

  function renderDashboard() {
    const active = state.notes.filter((note) => !note.archived);
    const due = active.filter(isDueForReview);
    const actions = active.filter((note) => note.actionText && !note.actionDone);
    const cards = active.reduce((sum, note) => sum + note.flashcards.length, 0);

    els.metricTotal.textContent = active.length;
    els.metricDue.textContent = due.length;
    els.metricActions.textContent = actions.length;
    els.metricCards.textContent = cards;
    els.dailyNudge.textContent = makeDailyNudge(active, due, actions);
  }

  function renderTags() {
    const counts = new Map();
    state.notes.filter((note) => !note.archived).forEach((note) => {
      note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1));
    });
    const tags = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .slice(0, 18);

    if (!tags.length) {
      els.tagBar.innerHTML = '';
      return;
    }

    els.tagBar.innerHTML = [
      `<button class="tag-chip ${state.activeTag ? '' : 'active'}" type="button" data-tag="">Tất cả tag</button>`,
      ...tags.map(([tag, count]) => `<button class="tag-chip ${state.activeTag === tag ? 'active' : ''}" type="button" data-tag="${escapeAttr(tag)}">#${escapeHtml(tag)} · ${count}</button>`)
    ].join('');
  }

  function renderWorkbench() {
    const notes = getFilteredNotes();
    const data = selectViewData(notes);
    els.resultCount.textContent = `${data.count} mục`;
    els.viewHint.textContent = data.hint;
    els.workbench.innerHTML = data.html;
  }

  function selectViewData(notes) {
    if (state.view === 'review') return renderReviewView(notes);
    if (state.view === 'cards') return renderCardsView(notes);
    if (state.view === 'actions') return renderActionsView(notes);
    if (state.view === 'map') return renderMapView(notes);
    if (state.view === 'today') return renderTodayView(notes);
    return renderKnowledgeView(notes);
  }

  function renderTodayView(notes) {
    const today = todayKey();
    const todayNotes = notes.filter((note) => note.createdAt.slice(0, 10) === today || note.updatedAt.slice(0, 10) === today);
    const due = notes.filter(isDueForReview).slice(0, 3);
    const actions = notes.filter((note) => note.actionText && !note.actionDone).slice(0, 3);
    const latest = todayNotes.length ? todayNotes : notes.slice(0, 4);
    const sections = [];

    if (due.length) sections.push(`<h3>📚 Cần ôn hôm nay</h3>${due.map(renderReviewCard).join('')}`);
    if (actions.length) sections.push(`<h3>⚡ Hành động mở</h3>${actions.map(renderActionCard).join('')}`);
    sections.push(`<h3>🧠 Tri thức gần đây</h3>${latest.length ? latest.map(renderNoteCard).join('') : renderEmpty('Sổ đang trống. Ghi một điều nhỏ trước đã.')}`);

    return { count: due.length + actions.length + latest.length, hint: 'Hôm nay: ôn thứ đến hạn, làm một hành động, rồi ghi thêm một bài học.', html: sections.join('') };
  }

  function renderKnowledgeView(notes) {
    const html = notes.length ? notes.map(renderNoteCard).join('') : renderEmpty('Không tìm thấy ghi chú phù hợp. Hãy bỏ lọc hoặc thử từ khóa khác.');
    return { count: notes.length, hint: 'Kho tri thức: nơi tìm lại ý tưởng, bài học, prompt và nguồn đáng dùng.', html };
  }

  function renderReviewView(notes) {
    const due = notes.filter(isDueForReview).sort((a, b) => new Date(a.nextReviewAt) - new Date(b.nextReviewAt));
    const html = due.length ? due.map(renderReviewCard).join('') : renderEmpty('Không có thẻ đến hạn. Sổ đang nhẹ đầu.');
    return { count: due.length, hint: 'Ôn tập nhẹ: bấm “Đã nhớ” để đẩy lịch ôn ra xa hơn.', html };
  }

  function renderCardsView(notes) {
    const cards = [];
    notes.forEach((note) => note.flashcards.forEach((card, index) => cards.push({ note, card, index })));
    const html = cards.length ? `<div class="card-grid">${cards.map(renderFlashcard).join('')}</div>` : renderEmpty('Chưa có flashcard. Hãy bấm “Chưng cất” trên một ghi chú.');
    return { count: cards.length, hint: 'Flashcard: dùng để tự hỏi lại thay vì chỉ đọc lại.', html };
  }

  function renderActionsView(notes) {
    const actions = notes.filter((note) => note.actionText).sort((a, b) => Number(a.actionDone) - Number(b.actionDone));
    const html = actions.length ? actions.map(renderActionCard).join('') : renderEmpty('Chưa có hành động nào. Khi lưu ghi chú, hãy thêm “việc muốn làm”.');
    return { count: actions.length, hint: 'Hành động: nơi biến tri thức thành việc thật.', html };
  }

  function renderMapView(notes) {
    const counts = new Map();
    notes.filter((note) => !note.archived).forEach((note) => note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    const rows = Array.from(counts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24);
    const max = rows.reduce((m, row) => Math.max(m, row[1]), 1);
    const html = rows.length ? `<div class="tag-map-grid">${rows.map(([tag, count]) => `<article class="tag-map-card tag-row"><strong>#${escapeHtml(tag)}</strong><div class="tag-meter"><span style="--w:${Math.round((count / max) * 100)}%"></span></div><span>${count}</span></article>`).join('')}</div>` : renderEmpty('Chưa đủ tag để vẽ bản đồ tri thức.');
    return { count: rows.length, hint: 'Bản đồ tag: nhìn xem tri thức của Lão đang dày ở mảng nào.', html };
  }

  function renderNoteCard(note) {
    const cat = CATEGORY[note.category] || CATEGORY.other;
    const tags = note.tags.length ? `<div class="note-tags">${note.tags.map((tag) => `<span class="note-tag">#${escapeHtml(tag)}</span>`).join('')}</div>` : '';
    const source = note.source ? `<a class="note-tag" href="${escapeAttr(note.source)}" target="_blank" rel="noopener noreferrer">Mở nguồn</a>` : '';
    const insight = renderInsight(note);
    const content = note.content ? escapeHtml(trimText(note.content, 420)) : '<span class="muted">Không có nội dung chi tiết.</span>';

    return `
      <article class="note-card ${note.archived ? 'archived' : ''}" data-id="${escapeAttr(note.id)}">
        <div class="note-top">
          <div>
            <h3>${note.favorite ? '⭐ ' : ''}${escapeHtml(note.title)}</h3>
            <div class="note-meta">
              <span>${cat.icon} ${cat.label}</span><span>·</span><span>${priorityLabel(note.priority)}</span><span>·</span><span>Sửa ${formatDate(note.updatedAt)}</span>
            </div>
          </div>
          <div class="note-actions">
            <button class="icon-btn" type="button" data-action="distill">Chưng cất</button>
            <button class="icon-btn" type="button" data-action="favorite">${note.favorite ? '★' : '☆'}</button>
            <button class="icon-btn" type="button" data-action="copy">Copy</button>
            <button class="icon-btn" type="button" data-action="edit">Sửa</button>
            <button class="icon-btn" type="button" data-action="archive">${note.archived ? 'Mở lại' : 'Ẩn'}</button>
            <button class="icon-btn dangerish" type="button" data-action="delete">Xóa</button>
          </div>
        </div>
        <p class="note-content">${content}</p>
        ${insight}
        <div class="note-meta">${source}<span>Tạo ${formatDate(note.createdAt)}</span><span>Ôn: ${note.nextReviewAt ? formatDate(note.nextReviewAt) : 'chưa đặt'}</span></div>
        ${tags}
      </article>`;
  }

  function renderInsight(note) {
    const parts = [];
    if (note.summary) parts.push(`<div class="insight-mini"><p class="label">Ý chính</p><p>${escapeHtml(note.summary)}</p></div>`);
    if (note.lesson) parts.push(`<div class="insight-mini lesson"><p class="label">Bài học</p><p>${escapeHtml(note.lesson)}</p></div>`);
    if (note.actionText) parts.push(`<div class="insight-mini action"><p class="label">Hành động</p><p>${note.actionDone ? '✅ ' : ''}${escapeHtml(note.actionText)}</p></div>`);
    return parts.length ? `<div class="insight-box">${parts.join('')}</div>` : '';
  }

  function renderReviewCard(note) {
    const progress = Math.round((note.reviewLevel / 6) * 100);
    const firstCard = note.flashcards[0];
    return `
      <article class="review-card" data-id="${escapeAttr(note.id)}">
        <h3>📚 ${escapeHtml(note.title)}</h3>
        <p class="muted">${firstCard ? escapeHtml(firstCard.q) : escapeHtml(note.summary || trimText(note.content, 160))}</p>
        ${firstCard ? `<div class="insight-mini"><p class="label">Đáp án gợi ý</p><p>${escapeHtml(firstCard.a)}</p></div>` : ''}
        <div class="progress-row"><div class="memory-level"><span style="--w:${progress}%"></span></div><span>Cấp nhớ ${note.reviewLevel}/6 · hạn ${formatDate(note.nextReviewAt)}</span></div>
        <div class="compact-actions">
          <button class="icon-btn" type="button" data-action="review-hard">Khó nhớ</button>
          <button class="icon-btn" type="button" data-action="review-ok">Đã nhớ</button>
          <button class="icon-btn" type="button" data-action="edit">Sửa</button>
        </div>
      </article>`;
  }

  function renderFlashcard(item) {
    return `
      <article class="flashcard" data-id="${escapeAttr(item.note.id)}">
        <strong>Q: ${escapeHtml(item.card.q)}</strong>
        <p>A: ${escapeHtml(item.card.a)}</p>
        <div class="note-meta"><span>${escapeHtml(item.note.title)}</span></div>
      </article>`;
  }

  function renderActionCard(note) {
    return `
      <article class="action-card ${note.actionDone ? 'done' : ''}" data-id="${escapeAttr(note.id)}">
        <p class="label">${note.actionDone ? 'Đã xong' : 'Việc cần làm'}</p>
        <h3>${note.actionDone ? '✅ ' : '⚡ '}${escapeHtml(note.actionText || 'Chưa có nội dung hành động')}</h3>
        <p class="muted">Từ ghi chú: ${escapeHtml(note.title)}</p>
        <div class="compact-actions">
          <button class="icon-btn" type="button" data-action="toggle-action">${note.actionDone ? 'Mở lại' : 'Đánh dấu xong'}</button>
          <button class="icon-btn" type="button" data-action="copy-action">Copy việc</button>
          <button class="icon-btn" type="button" data-action="edit">Sửa</button>
        </div>
      </article>`;
  }

  function renderEmpty(message) {
    return `
      <div class="empty-box">
        <h3>📘 Chưa có gì để hiển thị</h3>
        <p class="muted">${escapeHtml(message)}</p>
        <a class="button primary" href="#capture">+ Ghi tri thức</a>
      </div>`;
  }

  function renderState() {
    if (!navigator.onLine) return updateState('OFFLINE');
    const active = state.notes.filter((note) => !note.archived);
    if (!active.length) return updateState('EMPTY');
    const today = todayKey();
    const todayCount = active.filter((note) => note.createdAt.slice(0, 10) === today).length;
    const dueCount = active.filter(isDueForReview).length;
    const actionsCount = active.filter((note) => note.actionText && !note.actionDone).length;
    if (dueCount > 0) return updateState('REVIEW_NEEDED');
    if (actionsCount > 0) return updateState('ACTION_NEEDED');
    if (todayCount > 0) return updateState('DONE');
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
    const query = normalizeText(state.search);
    return state.notes.filter((note) => {
      if (state.status === 'active' && note.archived) return false;
      if (state.status === 'archived' && !note.archived) return false;
      if (state.status === 'favorite' && !note.favorite) return false;
      if (state.category !== 'all' && note.category !== state.category) return false;
      if (state.activeTag && !note.tags.includes(state.activeTag)) return false;
      if (!query) return true;
      const haystack = normalizeText([note.title, note.content, note.category, note.priority, note.tags.join(' '), note.source, note.summary, note.lesson, note.actionText].join(' '));
      return haystack.includes(query);
    }).sort(sortNotes);
  }

  function sortNotes(a, b) {
    if (state.sort === 'created_desc') return new Date(b.createdAt) - new Date(a.createdAt);
    if (state.sort === 'title_asc') return a.title.localeCompare(b.title, 'vi');
    if (state.sort === 'review_due') return new Date(a.nextReviewAt || '2999-01-01') - new Date(b.nextReviewAt || '2999-01-01');
    if (state.sort === 'priority_desc') return priorityScore(b.priority) - priorityScore(a.priority) || new Date(b.updatedAt) - new Date(a.updatedAt);
    return new Date(b.updatedAt) - new Date(a.updatedAt);
  }

  function handleWorkbenchAction(event) {
    const button = event.target.closest('[data-action]');
    const card = event.target.closest('[data-id]');
    if (!button || !card) return;
    const note = state.notes.find((item) => item.id === card.dataset.id);
    if (!note) return;

    const action = button.dataset.action;
    if (action === 'distill') distillNote(note.id);
    if (action === 'favorite') toggleFavorite(note.id);
    if (action === 'copy') copyNote(note);
    if (action === 'edit') editNote(note);
    if (action === 'archive') toggleArchive(note.id);
    if (action === 'delete') deleteNote(note.id);
    if (action === 'review-ok') reviewNote(note.id, true);
    if (action === 'review-hard') reviewNote(note.id, false);
    if (action === 'toggle-action') toggleAction(note.id);
    if (action === 'copy-action') copyText(note.actionText || '', 'Đã copy việc cần làm.');
  }

  function handleTagClick(event) {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.activeTag = button.dataset.tag || '';
    state.view = 'knowledge';
    saveSettings();
    renderAll();
  }

  function distillNote(id) {
    const note = findNote(id);
    if (!note) return;
    Object.assign(note, buildInsight(note));
    note.updatedAt = new Date().toISOString();
    persistNotes();
    renderAll();
    toast('Đã chưng cất ghi chú.');
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

  function toggleAction(id) {
    const note = findNote(id);
    if (!note) return;
    note.actionDone = !note.actionDone;
    note.updatedAt = new Date().toISOString();
    persistNotes();
    renderAll();
    toast(note.actionDone ? 'Đã chốt hành động.' : 'Đã mở lại hành động.');
  }

  function reviewNote(id, remembered) {
    const note = findNote(id);
    if (!note) return;
    note.reviewLevel = remembered ? clamp(note.reviewLevel + 1, 1, 6) : 0;
    note.lastReviewedAt = new Date().toISOString();
    note.nextReviewAt = addDays(note.lastReviewedAt, REVIEW_INTERVAL_DAYS[note.reviewLevel] || 1);
    note.updatedAt = note.lastReviewedAt;
    persistNotes();
    renderAll();
    toast(remembered ? 'Đã nhớ. Lịch ôn được đẩy xa hơn.' : 'Đã hạ cấp nhớ. Mai ôn lại.');
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
    els.noteAction.value = note.actionText;
    els.saveButton.textContent = 'Cập nhật & chưng cất';
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
    els.noteAction.value = '';
    els.saveButton.textContent = 'Lưu & chưng cất';
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
      actionText: els.noteAction.value,
      updatedAt: new Date().toISOString()
    };
    const hasDraft = [draft.title, draft.content, draft.tags, draft.source, draft.actionText].some((value) => String(value || '').trim());
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
    els.noteAction.value = draft.actionText || '';
    els.draftStatus.textContent = 'Đã phục hồi nháp';
  }

  function copyNote(note) {
    const text = [
      `# ${note.title}`,
      note.summary ? `\nÝ chính: ${note.summary}` : '',
      note.lesson ? `\nBài học: ${note.lesson}` : '',
      note.actionText ? `\nHành động: ${note.actionText}` : '',
      note.tags.length ? `\nTag: ${note.tags.map((tag) => `#${tag}`).join(' ')}` : '',
      note.source ? `\nNguồn: ${note.source}` : '',
      note.content ? `\n---\n${note.content}` : ''
    ].filter(Boolean).join('\n');
    copyText(text, 'Đã copy tri thức.');
  }

  function copyText(text, successMessage) {
    if (!text) {
      toast('Không có nội dung để copy.');
      return;
    }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => toast(successMessage)).catch(() => fallbackCopy(text, successMessage));
    } else {
      fallbackCopy(text, successMessage);
    }
  }

  function fallbackCopy(text, successMessage) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      toast(successMessage);
    } catch (error) {
      toast('Không copy được, hãy chọn thủ công.');
    } finally {
      textarea.remove();
    }
  }

  function exportJson() {
    const payload = {
      app: 'Sổ Thông Thái Knowledge OS',
      version: APP_VERSION,
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      records: state.notes,
      settings: safeRead(SETTINGS_KEY, {})
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const date = new Date().toISOString().slice(0, 10);
    const link = document.createElement('a');
    link.href = url;
    link.download = `so-thong-thai-knowledge-os-backup-${date}.json`;
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
        if (!records.length) throw new Error('Không tìm thấy records');
        const incoming = records.map(normalizeNote).filter(Boolean);
        const map = new Map(state.notes.map((note) => [note.id, note]));
        incoming.forEach((note) => map.set(note.id, { ...(map.get(note.id) || {}), ...note }));
        state.notes = Array.from(map.values()).map(normalizeNote).filter(Boolean).sort(sortNotes);
        persistNotes();
        renderAll();
        toast(`Đã nhập ${incoming.length} ghi chú.`);
      } catch (error) {
        toast('File JSON không hợp lệ.');
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    const first = window.confirm('Reset toàn bộ Sổ Thông Thái trên thiết bị này?');
    if (!first) return;
    const second = window.confirm('Xác nhận lần 2: dữ liệu local sẽ bị xóa. Nên xuất JSON trước.');
    if (!second) return;
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(SETTINGS_KEY);
    state.notes = [];
    state.search = '';
    state.category = 'all';
    state.status = 'active';
    state.sort = 'updated_desc';
    state.activeTag = '';
    state.view = 'today';
    loadSettings();
    clearForm({ keepDraft: false });
    renderAll();
    toast('Đã reset dữ liệu local.');
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
      navigator.serviceWorker.register('service-worker.js').catch(() => {
        toast('Service worker chưa đăng ký được. App vẫn dùng được khi online.');
      });
    });
  }

  function findNote(id) {
    return state.notes.find((note) => note.id === id);
  }

  function isDueForReview(note) {
    if (note.archived) return false;
    if (!note.flashcards.length && !note.summary) return false;
    return new Date(note.nextReviewAt || note.createdAt) <= new Date(endOfToday());
  }

  function makeDailyNudge(active, due, actions) {
    if (!active.length) return 'Ghi một điều Lão vừa học được. Đừng để tri thức trôi mất.';
    if (due.length) return `Có ${due.length} mục đến hạn ôn. Ôn trước, ghi sau.`;
    if (actions.length) return `Có ${actions.length} hành động mở. Làm một việc nhỏ để tri thức có kết quả.`;
    const topTag = topTags(active)[0];
    if (topTag) return `Mảng đang dày nhất: #${topTag[0]}. Hãy bổ sung một bài học sâu hơn.`;
    return 'Hôm nay chỉ cần thêm một ghi chú có thể dùng lại.';
  }

  function topTags(notes) {
    const counts = new Map();
    notes.forEach((note) => note.tags.forEach((tag) => counts.set(tag, (counts.get(tag) || 0) + 1)));
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }

  function safeRead(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw);
    } catch (error) {
      return fallback;
    }
  }

  function writeJson(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      return false;
    }
  }

  function makeId() {
    if (crypto && crypto.randomUUID) return crypto.randomUUID();
    return `wn_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function parseTags(value) {
    return unique(String(value || '').split(/[#,;\n]+/).map(cleanTag).filter(Boolean)).slice(0, 16);
  }

  function cleanTag(value) {
    return normalizeText(value).replace(/[^\p{L}\p{N}_-]+/gu, '').slice(0, 32);
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFC').trim();
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function priorityLabel(value) {
    if (value === 'high') return 'Dùng lại cao';
    if (value === 'low') return 'Dùng lại thấp';
    return 'Dùng lại vừa';
  }

  function priorityScore(value) {
    if (value === 'high') return 3;
    if (value === 'medium') return 2;
    return 1;
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function endOfToday() {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }

  function addDays(dateLike, days) {
    const d = dateLike ? new Date(dateLike) : new Date();
    d.setDate(d.getDate() + Number(days || 0));
    return d.toISOString();
  }

  function formatDate(value) {
    if (!value) return 'chưa có';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'không rõ';
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: '2-digit' });
  }

  function trimText(value, max) {
    const text = String(value || '').trim();
    if (text.length <= max) return text;
    return `${text.slice(0, max - 1).trim()}…`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/`/g, '&#096;');
  }

  let toastTimer = null;
  function toast(message) {
    if (!els.toast) return;
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => els.toast.classList.remove('show'), 2300);
  }
})();
