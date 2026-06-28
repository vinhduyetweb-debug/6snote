(function () {
  'use strict';

  const APP_VERSION = '1.2.0';
  const STORAGE_KEY = 'wisdom_notebook_records_v1';
  const SETTINGS_KEY = 'wisdom_notebook_settings_v1';
  const DRAFT_KEY = 'wisdom_notebook_draft_v1';
  const BACKUP_KEY = 'wisdom_notebook_last_backup_v1';
  const QUIZ_KEY = 'wisdom_notebook_quiz_v1';

  const CATEGORY = {
    idea: { label: 'Ý tưởng', icon: '💡' },
    lesson: { label: 'Bài học', icon: '📚' },
    prompt: { label: 'Prompt AI', icon: '🤖' },
    framework: { label: 'Framework', icon: '🧩' },
    book: { label: 'Sách / Tài liệu', icon: '📖' },
    video: { label: 'Video / Podcast', icon: '🎬' },
    checklist: { label: 'Checklist', icon: '✅' },
    quote: { label: 'Trích dẫn', icon: '💬' },
    skill: { label: 'Kỹ năng', icon: '🛠️' },
    link: { label: 'Link / Video', icon: '🔗' },
    other: { label: 'Khác', icon: '🧠' }
  };

  const STATE_COPY = {
    EMPTY: {
      className: 'empty',
      mission: 'Lưu 1 kiến thức đáng dùng lại.',
      explain: 'Chưa có dữ liệu học tập. Hãy bắt đầu bằng một bài học nhỏ.',
      slogan: 'Một dòng hôm nay, một kho báu ngày mai.'
    },
    READY: {
      className: 'ready',
      mission: 'Chưng cất mục mới nhất thành bài học.',
      explain: 'Kho tri thức đã sẵn sàng. Hãy biến ghi chú thành thứ dùng lại được.',
      slogan: 'Không chỉ ghi nhớ. Phải dùng được.'
    },
    DONE: {
      className: 'done',
      mission: 'Giữ nhịp. Ôn một thẻ hoặc áp dụng một việc nhỏ.',
      explain: 'Hôm nay đã có hoạt động học tập. Chuỗi học đang được giữ.',
      slogan: 'Một ngày có học là một ngày không trôi mất.'
    },
    REVIEW_NEEDED: {
      className: 'review',
      mission: 'Ôn các thẻ đến hạn trước khi ghi thêm.',
      explain: 'Có flashcard đến hạn. Ôn ngắn giúp trí nhớ bền hơn.',
      slogan: 'Tri thức không ôn sẽ ngủ quên.'
    },
    ACTION_NEEDED: {
      className: 'action',
      mission: 'Chọn 1 hành động sinh ra từ tri thức và làm ngay.',
      explain: 'Có bài học chưa được áp dụng. Đây là lúc biến biết thành làm.',
      slogan: 'Biết mà chưa làm thì vẫn là ghi chú.'
    },
    OFFLINE: {
      className: 'ready',
      mission: 'Đang offline: vẫn ghi, vẫn học, vẫn lưu cục bộ.',
      explain: 'Không có mạng nhưng app vẫn hoạt động trong trình duyệt này.',
      slogan: 'Không mạng vẫn ghi, không mất vẫn nhớ.'
    },
    WARNING: {
      className: 'warning',
      mission: 'Xuất JSON ngay để giữ bản sao dữ liệu.',
      explain: 'Trình duyệt có thể không lưu được dữ liệu. Hãy backup thủ công.',
      slogan: 'Dữ liệu quý phải có bản sao.'
    }
  };

  const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120];
  const STOP_WORDS = new Set('và là của có cho trong một những các với được khi này đó thì vào để hoặc từ như hơn sẽ đã đang vì trên dưới nếu cũng rất nhưng không cần nên phải bởi về mình tôi bạn chúng ta mỗi ngày càng thật việc điều kiến thức học tập ghi chú app'.split(' '));

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
    selectedNoteId: '',
    quiz: null,
    settings: {
      theme: 'dark',
      activityDates: []
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  function init() {
    cacheElements();
    loadSettings();
    applyTheme();
    populateCategoryFilter();
    loadNotes();
    restoreDraft();
    bindEvents();
    renderNetwork();
    renderAll();
    registerServiceWorker();
    toast('Learning Pro đã sẵn sàng.');
  }

  function cacheElements() {
    Object.assign(els, {
      app: $('#app'),
      themeToggle: $('#themeToggle'),
      networkPill: $('#networkPill'),
      networkText: $('#networkText'),
      stateBadge: $('#stateBadge'),
      dailyMission: $('#dailyMission'),
      stateExplain: $('#stateExplain'),
      stateSlogan: $('#stateSlogan'),
      learningScore: $('#learningScore'),
      metricTotal: $('#metricTotal'),
      metricDue: $('#metricDue'),
      metricActions: $('#metricActions'),
      metricStreak: $('#metricStreak'),
      metricMastery: $('#metricMastery'),
      startReview: $('#startReview'),
      openCommand: $('#openCommand'),
      todayLabel: $('#todayLabel'),
      mainFocus: $('#mainFocus'),
      doMainFocus: $('#doMainFocus'),
      dueFocus: $('#dueFocus'),
      actionFocus: $('#actionFocus'),
      todayFeed: $('#todayFeed'),
      noteForm: $('#noteForm'),
      noteId: $('#noteId'),
      noteTitle: $('#noteTitle'),
      noteContent: $('#noteContent'),
      noteMode: $('#noteMode'),
      noteCategory: $('#noteCategory'),
      notePriority: $('#notePriority'),
      noteTarget: $('#noteTarget'),
      noteTags: $('#noteTags'),
      noteSource: $('#noteSource'),
      noteAction: $('#noteAction'),
      saveButton: $('#saveButton'),
      savePlainButton: $('#savePlainButton'),
      fillTemplate: $('#fillTemplate'),
      clearForm: $('#clearForm'),
      cancelEdit: $('#cancelEdit'),
      draftStatus: $('#draftStatus'),
      searchInput: $('#searchInput'),
      categoryFilter: $('#categoryFilter'),
      statusFilter: $('#statusFilter'),
      sortSelect: $('#sortSelect'),
      tagBar: $('#tagBar'),
      resultCount: $('#resultCount'),
      libraryList: $('#libraryList'),
      studioContent: $('#studioContent'),
      distillLatest: $('#distillLatest'),
      reviewCount: $('#reviewCount'),
      reviewDeck: $('#reviewDeck'),
      newQuiz: $('#newQuiz'),
      quizBox: $('#quizBox'),
      actionCount: $('#actionCount'),
      actionBoard: $('#actionBoard'),
      seedStarter: $('#seedStarter'),
      pathBoard: $('#pathBoard'),
      mapCount: $('#mapCount'),
      knowledgeMap: $('#knowledgeMap'),
      exportJson: $('#exportJson'),
      importButton: $('#importButton'),
      importFile: $('#importFile'),
      resetData: $('#resetData'),
      readerDialog: $('#readerDialog'),
      readerTitle: $('#readerTitle'),
      readerBody: $('#readerBody'),
      closeReader: $('#closeReader'),
      toast: $('#toast')
    });
  }

  function bindEvents() {
    window.addEventListener('online', renderNetwork);
    window.addEventListener('offline', renderNetwork);

    els.themeToggle.addEventListener('click', toggleTheme);
    els.startReview.addEventListener('click', () => setView('review'));
    els.openCommand.addEventListener('click', () => setView('today'));
    els.doMainFocus.addEventListener('click', handleMainFocus);

    els.noteForm.addEventListener('submit', (event) => handleSave(event, true));
    els.savePlainButton.addEventListener('click', (event) => handleSave(event, false));
    els.fillTemplate.addEventListener('click', fillLearningTemplate);
    els.clearForm.addEventListener('click', () => clearForm({ keepDraft: false }));
    els.cancelEdit.addEventListener('click', cancelEdit);
    els.distillLatest.addEventListener('click', distillLatest);

    [els.noteTitle, els.noteContent, els.noteMode, els.noteCategory, els.notePriority, els.noteTarget, els.noteTags, els.noteSource, els.noteAction].forEach((el) => {
      el.addEventListener('input', saveDraft);
      el.addEventListener('change', saveDraft);
    });

    $$('.nav-tab').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.view));
    });

    els.searchInput.addEventListener('input', () => {
      state.search = els.searchInput.value.trim();
      saveSettings();
      renderLibrary();
    });
    els.categoryFilter.addEventListener('change', () => {
      state.category = els.categoryFilter.value;
      state.activeTag = '';
      saveSettings();
      renderLibrary();
      renderTagBar();
    });
    els.statusFilter.addEventListener('change', () => {
      state.status = els.statusFilter.value;
      saveSettings();
      renderLibrary();
    });
    els.sortSelect.addEventListener('change', () => {
      state.sort = els.sortSelect.value;
      saveSettings();
      renderLibrary();
    });

    els.tagBar.addEventListener('click', handleTagClick);
    els.libraryList.addEventListener('click', handleCardAction);
    els.studioContent.addEventListener('click', handleStudioAction);
    els.reviewDeck.addEventListener('click', handleReviewAction);
    els.quizBox.addEventListener('click', handleQuizAction);
    els.actionBoard.addEventListener('click', handleActionBoard);
    els.pathBoard.addEventListener('click', handlePathAction);
    els.newQuiz.addEventListener('click', buildQuiz);
    els.seedStarter.addEventListener('click', seedStarterPack);

    els.exportJson.addEventListener('click', exportJson);
    els.importButton.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importJson);
    els.resetData.addEventListener('click', resetData);
    els.closeReader.addEventListener('click', () => els.readerDialog.close());
  }

  function populateCategoryFilter() {
    Object.entries(CATEGORY).forEach(([key, item]) => {
      const option = document.createElement('option');
      option.value = key;
      option.textContent = `${item.icon} ${item.label}`;
      els.categoryFilter.appendChild(option);
    });
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      state.settings = { ...state.settings, ...saved };
      state.view = saved.view || state.view;
      state.search = saved.search || '';
      state.category = saved.category || 'all';
      state.status = saved.status || 'active';
      state.sort = saved.sort || 'updated_desc';
      state.activeTag = saved.activeTag || '';
      state.selectedNoteId = saved.selectedNoteId || '';
      state.quiz = JSON.parse(localStorage.getItem(QUIZ_KEY) || 'null');
    } catch (error) {
      console.warn('Không đọc được settings:', error);
    }
  }

  function saveSettings() {
    const payload = {
      ...state.settings,
      view: state.view,
      search: state.search,
      category: state.category,
      status: state.status,
      sort: state.sort,
      activeTag: state.activeTag,
      selectedNoteId: state.selectedNoteId
    };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(payload));
  }

  function loadNotes() {
    try {
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      state.notes = Array.isArray(raw) ? raw.map(normalizeNote).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : [];
    } catch (error) {
      console.warn('Không đọc được dữ liệu:', error);
      state.notes = [];
    }
  }

  function saveNotes() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
    localStorage.setItem(BACKUP_KEY, new Date().toISOString());
  }

  function normalizeNote(note) {
    const now = new Date().toISOString();
    const category = CATEGORY[note.category] ? note.category : (note.category === 'link' ? 'video' : 'other');
    const tags = Array.isArray(note.tags) ? note.tags : parseTags(note.tags || '');
    const distill = note.distill || note.ai || null;
    const cards = Array.isArray(note.cards) ? note.cards.map(normalizeCard) : (distill && Array.isArray(distill.flashcards) ? distill.flashcards.map((card) => normalizeCard(card)) : []);
    const generatedActions = Array.isArray(note.generatedActions) ? note.generatedActions.map(normalizeAction) : buildGeneratedActions(note).map(normalizeAction);
    return {
      id: note.id || createId(),
      title: String(note.title || 'Tri thức chưa đặt tên').slice(0, 150),
      content: String(note.content || ''),
      mode: note.mode || 'deep',
      category,
      priority: note.priority || 'medium',
      target: note.target || 'apply',
      tags,
      source: note.source || '',
      action: note.action || '',
      actionDone: Boolean(note.actionDone),
      favorite: Boolean(note.favorite),
      archived: Boolean(note.archived),
      stage: note.stage || (distill ? 'distilled' : 'raw'),
      reads: Number(note.reads || 0),
      openedAt: note.openedAt || '',
      reviewLevel: Number(note.reviewLevel || 0),
      nextReview: note.nextReview || now,
      distill,
      cards,
      generatedActions,
      createdAt: note.createdAt || now,
      updatedAt: note.updatedAt || note.createdAt || now
    };
  }

  function normalizeCard(card) {
    return {
      id: card.id || createId(),
      q: String(card.q || card.question || 'Câu hỏi ôn tập'),
      a: String(card.a || card.answer || 'Câu trả lời'),
      level: clamp(Number(card.level || 0), 0, 7),
      dueAt: card.dueAt || card.nextReview || new Date().toISOString(),
      lastReviewed: card.lastReviewed || '',
      lapses: Number(card.lapses || 0)
    };
  }

  function normalizeAction(action) {
    if (typeof action === 'string') {
      return { id: createId(), text: action, done: false, createdAt: new Date().toISOString(), doneAt: '' };
    }
    return {
      id: action.id || createId(),
      text: String(action.text || action.title || 'Hành động áp dụng'),
      done: Boolean(action.done),
      createdAt: action.createdAt || new Date().toISOString(),
      doneAt: action.doneAt || ''
    };
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft) return;
      els.noteTitle.value = draft.title || '';
      els.noteContent.value = draft.content || '';
      els.noteMode.value = draft.mode || 'deep';
      els.noteCategory.value = draft.category || 'idea';
      els.notePriority.value = draft.priority || 'high';
      els.noteTarget.value = draft.target || 'apply';
      els.noteTags.value = draft.tags || '';
      els.noteSource.value = draft.source || '';
      els.noteAction.value = draft.action || '';
      if (draft.title || draft.content) els.draftStatus.textContent = 'Đã khôi phục nháp';
    } catch (error) {
      console.warn('Không khôi phục được nháp:', error);
    }
  }

  function saveDraft() {
    const draft = readForm();
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...draft, savedAt: new Date().toISOString() }));
    els.draftStatus.textContent = draft.title || draft.content ? 'Đã giữ nháp' : 'Draft an toàn';
  }

  function readForm() {
    return {
      id: els.noteId.value,
      title: els.noteTitle.value.trim(),
      content: els.noteContent.value.trim(),
      mode: els.noteMode.value,
      category: els.noteCategory.value,
      priority: els.notePriority.value,
      target: els.noteTarget.value,
      tags: els.noteTags.value.trim(),
      source: els.noteSource.value.trim(),
      action: els.noteAction.value.trim()
    };
  }

  function handleSave(event, shouldDistill) {
    event.preventDefault();
    const form = readForm();
    if (!form.title) return toast('Cần nhập tiêu đề.');
    if (!form.content && !form.action && !form.source) return toast('Cần nhập nội dung, nguồn hoặc hành động.');

    const now = new Date().toISOString();
    let note;
    if (form.id) {
      note = state.notes.find((item) => item.id === form.id);
      if (!note) return toast('Không tìm thấy mục đang sửa.');
      Object.assign(note, {
        title: form.title,
        content: form.content,
        mode: form.mode,
        category: form.category,
        priority: form.priority,
        target: form.target,
        tags: parseTags(form.tags),
        source: form.source,
        action: form.action,
        updatedAt: now
      });
    } else {
      note = normalizeNote({
        id: createId(),
        title: form.title,
        content: form.content,
        mode: form.mode,
        category: form.category,
        priority: form.priority,
        target: form.target,
        tags: parseTags(form.tags),
        source: form.source,
        action: form.action,
        createdAt: now,
        updatedAt: now
      });
      state.notes.unshift(note);
    }

    if (shouldDistill) applyDistill(note);
    markActivity();
    saveNotes();
    clearForm({ keepDraft: false });
    state.selectedNoteId = note.id;
    setView(shouldDistill ? 'studio' : 'library');
    toast(shouldDistill ? 'Đã lưu và tạo bài học.' : 'Đã lưu ghi chú.');
  }

  function applyDistill(note) {
    const result = distillNote(note);
    note.distill = result;
    note.cards = mergeCards(note.cards, result.flashcards);
    note.generatedActions = mergeActions(note.generatedActions, result.actions);
    note.stage = 'distilled';
    note.nextReview = new Date().toISOString();
    note.updatedAt = new Date().toISOString();
    if (result.tags.length) note.tags = unique([...note.tags, ...result.tags]).slice(0, 14);
  }

  function mergeCards(oldCards, newCards) {
    const old = Array.isArray(oldCards) ? oldCards : [];
    const seen = new Set(old.map((card) => normalizeText(card.q)));
    const merged = [...old];
    newCards.forEach((card) => {
      if (!seen.has(normalizeText(card.q))) merged.push(normalizeCard(card));
    });
    return merged.slice(0, 18);
  }

  function mergeActions(oldActions, newActions) {
    const old = Array.isArray(oldActions) ? oldActions : [];
    const seen = new Set(old.map((item) => normalizeText(item.text)));
    const merged = [...old];
    newActions.forEach((text) => {
      const key = normalizeText(text);
      if (key && !seen.has(key)) merged.push(normalizeAction(text));
    });
    return merged.slice(0, 12);
  }

  function distillLatest() {
    if (!state.notes.length) return toast('Chưa có mục nào để chưng cất.');
    const note = state.notes[0];
    applyDistill(note);
    state.selectedNoteId = note.id;
    markActivity();
    saveNotes();
    setView('studio');
    toast('Đã chưng cất mục mới nhất.');
  }

  function buildGeneratedActions(note) {
    const actions = [];
    if (note.action) actions.push(note.action);
    if (note.distill && Array.isArray(note.distill.actions)) actions.push(...note.distill.actions);
    return unique(actions).slice(0, 8);
  }

  function distillNote(note) {
    const title = note.title || '';
    const content = `${title}. ${note.content || ''}`.trim();
    const sentences = splitSentences(content);
    const words = extractWords(content);
    const frequency = words.reduce((acc, word) => {
      acc[word] = (acc[word] || 0) + 1;
      return acc;
    }, {});
    const concepts = Object.entries(frequency)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi'))
      .map(([word]) => word)
      .filter((word) => word.length >= 3)
      .slice(0, 10);

    const scored = sentences.map((sentence, index) => {
      const scoreWords = extractWords(sentence).reduce((sum, word) => sum + (frequency[word] || 0), 0);
      const keywordBoost = /(quan trọng|cốt lõi|bài học|kết luận|nguyên tắc|framework|quy trình|cần|nên|phải|áp dụng|ví dụ|lưu ý)/i.test(sentence) ? 8 : 0;
      const earlyBoost = index < 3 ? 3 : 0;
      return { sentence, score: scoreWords + keywordBoost + earlyBoost, index };
    });

    const summary = scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 4)
      .sort((a, b) => a.index - b.index)
      .map((item) => item.sentence);

    const lessons = sentences
      .filter((sentence) => /(bài học|rút ra|nguyên tắc|cốt lõi|quan trọng|nên|cần|phải|tránh|ưu tiên|thành công|thất bại|kỷ luật)/i.test(sentence))
      .slice(0, 5);

    const actions = sentences
      .filter((sentence) => /(áp dụng|làm|thử|triển khai|kiểm tra|xây|viết|đọc|học|thực hành|review|soạn|tạo)/i.test(sentence))
      .map(cleanAction)
      .filter(Boolean)
      .slice(0, 5);

    if (note.action) actions.unshift(note.action);
    if (!actions.length) actions.push(`Áp dụng 1 ý từ “${title}” vào một việc thật trong hôm nay.`);

    const questions = buildQuestions(title, concepts, summary, note.target);
    const flashcards = buildFlashcards(title, concepts, summary, lessons, actions);
    const suggestedTags = concepts.slice(0, 5);
    const insight = buildInsight(note, summary, lessons, actions);

    return {
      createdAt: new Date().toISOString(),
      summary: summary.length ? summary : [content.slice(0, 220) || 'Chưa đủ nội dung để rút tóm tắt.'],
      lessons: lessons.length ? lessons : summary.slice(0, 3),
      actions: unique(actions).slice(0, 6),
      concepts,
      questions,
      flashcards,
      tags: suggestedTags,
      insight
    };
  }

  function cleanAction(sentence) {
    return sentence.replace(/^[-*•\d.\s]+/, '').trim().slice(0, 180);
  }

  function buildQuestions(title, concepts, summary, target) {
    const list = [];
    list.push(`Ý chính nhất của “${title}” là gì?`);
    if (concepts[0]) list.push(`Khái niệm “${concepts[0]}” liên quan gì đến bài học này?`);
    if (target === 'apply') list.push('Có thể áp dụng bài học này vào việc thật nào trong 24 giờ tới?');
    if (target === 'teach') list.push('Nếu phải dạy lại cho người khác trong 2 phút, sẽ nói theo cấu trúc nào?');
    if (summary[0]) list.push('Câu nào trong nội dung gốc đáng nhớ nhất và vì sao?');
    return unique(list).slice(0, 6);
  }

  function buildFlashcards(title, concepts, summary, lessons, actions) {
    const cards = [];
    const now = new Date().toISOString();
    cards.push({ id: createId(), q: `Một câu tóm tắt “${title}” là gì?`, a: summary[0] || title, level: 0, dueAt: now });
    concepts.slice(0, 4).forEach((concept) => {
      cards.push({ id: createId(), q: `Giải thích ngắn khái niệm: ${concept}`, a: findSentenceWith(summary.concat(lessons), concept) || `Liên hệ “${concept}” với ghi chú “${title}”.`, level: 0, dueAt: now });
    });
    if (lessons[0]) cards.push({ id: createId(), q: 'Bài học thực tế rút ra là gì?', a: lessons[0], level: 0, dueAt: now });
    if (actions[0]) cards.push({ id: createId(), q: 'Hành động nhỏ để áp dụng bài học này là gì?', a: actions[0], level: 0, dueAt: now });
    return cards.slice(0, 7);
  }

  function buildInsight(note, summary, lessons, actions) {
    const depth = note.content.length > 700 ? 'sâu' : note.content.length > 250 ? 'vừa' : 'nhanh';
    const reuse = note.priority === 'high' ? 'ưu tiên ôn lại sớm' : 'lưu để tra cứu khi cần';
    const apply = actions.length ? 'đã có hướng áp dụng' : 'cần tự đặt một hành động nhỏ';
    return `Mức đọc: ${depth}. Giá trị dùng lại: ${reuse}. Trạng thái: ${apply}.`;
  }

  function setView(view) {
    const allowedViews = new Set(['today', 'capture', 'library', 'studio', 'review', 'quiz', 'actions', 'paths', 'map']);
    if (!allowedViews.has(view)) view = 'today';
    state.view = view;
    saveSettings();
    $$('.nav-tab').forEach((button) => button.classList.toggle('active', button.dataset.view === view));
    $$('.view').forEach((panel) => panel.classList.toggle('active-view', panel.dataset.panel === view));
    if (view === 'capture') document.getElementById('capture').scrollIntoView({ behavior: 'smooth', block: 'start' });
    renderCurrentView();
  }

  function renderAll() {
    els.searchInput.value = state.search;
    els.categoryFilter.value = state.category;
    els.statusFilter.value = state.status;
    els.sortSelect.value = state.sort;
    setView(state.view);
    renderState();
    renderMetrics();
    renderTagBar();
    renderCurrentView();
  }

  function renderCurrentView() {
    renderState();
    renderMetrics();
    if (state.view === 'today') renderToday();
    if (state.view === 'library') renderLibrary();
    if (state.view === 'studio') renderStudio();
    if (state.view === 'review') renderReview();
    if (state.view === 'quiz') renderQuiz();
    if (state.view === 'actions') renderActions();
    if (state.view === 'paths') renderPaths();
    if (state.view === 'map') renderMap();
    if (state.view === 'capture') renderTagBar();
  }

  function renderNetwork() {
    const online = navigator.onLine;
    els.networkPill.classList.toggle('offline', !online);
    els.networkText.textContent = online ? 'Online' : 'Offline';
    renderState();
  }

  function renderState() {
    const storageOk = testStorage();
    const due = getDueCards().length;
    const actions = getOpenActions().length;
    const todayActive = hasActivityToday();
    let key = 'READY';
    if (!storageOk) key = 'WARNING';
    else if (!navigator.onLine) key = 'OFFLINE';
    else if (!state.notes.length) key = 'EMPTY';
    else if (due > 0) key = 'REVIEW_NEEDED';
    else if (actions > 0) key = 'ACTION_NEEDED';
    else if (todayActive) key = 'DONE';

    const copy = STATE_COPY[key];
    els.stateBadge.textContent = key;
    els.stateBadge.className = `state-badge ${copy.className}`;
    els.dailyMission.textContent = copy.mission;
    els.stateExplain.textContent = copy.explain;
    els.stateSlogan.textContent = copy.slogan;
    const score = learningScore();
    els.learningScore.textContent = String(score);
    document.querySelector('.progress-ring')?.style.setProperty('--score', score);
  }

  function renderMetrics() {
    const total = state.notes.length;
    const due = getDueCards().length;
    const actions = getOpenActions().length;
    const streak = computeStreak();
    const mastery = total ? Math.round(state.notes.reduce((sum, note) => sum + noteMastery(note), 0) / total) : 0;
    els.metricTotal.textContent = total;
    els.metricDue.textContent = due;
    els.metricActions.textContent = actions;
    els.metricStreak.textContent = streak;
    els.metricMastery.textContent = `${mastery}%`;
  }

  function renderToday() {
    const dueCards = getDueCards();
    const openActions = getOpenActions();
    const rawNotes = state.notes.filter((note) => !note.archived && !note.distill).slice(0, 3);
    els.todayLabel.textContent = hasActivityToday() ? 'Đã giữ nhịp hôm nay' : 'Chưa có hoạt động hôm nay';
    els.mainFocus.textContent = dueCards.length
      ? `Ôn ${dueCards.length} flashcard đến hạn.`
      : openActions.length
        ? 'Làm 1 hành động áp dụng từ tri thức đã lưu.'
        : rawNotes.length
          ? 'Chưng cất ghi chú thô thành bài học.'
          : 'Ghi 1 kiến thức mới và tạo flashcard.';
    els.dueFocus.textContent = `${dueCards.length} thẻ`;
    els.actionFocus.textContent = `${openActions.length} việc`;

    const html = [];
    if (!state.notes.length) {
      html.push(emptyBlock('Chưa có dữ liệu', 'Bắt đầu bằng cách ghi một bài học, prompt, ý tưởng hoặc đoạn sách đáng nhớ.', 'Ghi kiến thức mới', 'capture'));
    } else {
      if (dueCards.length) html.push(feedItem('🧠 Ôn tập đến hạn', `Có ${dueCards.length} thẻ cần ôn. Ưu tiên ôn trước khi nạp thêm kiến thức mới.`, 'Ôn ngay', 'review'));
      if (openActions.length) html.push(feedItem('⚡ Tri thức cần áp dụng', `Có ${openActions.length} hành động đang mở. Chọn một việc nhỏ và hoàn thành.`, 'Xem hành động', 'actions'));
      if (rawNotes.length) html.push(feedItem('🧪 Cần chưng cất', `${rawNotes.length} ghi chú còn thô. Chưng cất để có summary, lessons, cards và quiz.`, 'Vào Studio', 'studio'));
      html.push(...state.notes.slice(0, 4).map((note) => `
        <article class="feed-item">
          <div class="card-top">
            <div>
              <p class="label">${escapeHtml(categoryText(note))} · ${formatDate(note.updatedAt)}</p>
              <h3>${escapeHtml(note.title)}</h3>
              <p class="muted">${escapeHtml((note.distill?.insight || note.content || 'Chưa có nội dung').slice(0, 190))}</p>
            </div>
            <button class="small-action" data-action="read" data-id="${note.id}">Đọc</button>
          </div>
        </article>`));
    }
    els.todayFeed.innerHTML = html.join('');
    els.todayFeed.querySelectorAll('[data-go]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.go)));
    els.todayFeed.querySelectorAll('[data-action="read"]').forEach((button) => button.addEventListener('click', () => openReader(button.dataset.id)));
  }

  function feedItem(title, text, button, view) {
    return `
      <article class="feed-item">
        <h3>${escapeHtml(title)}</h3>
        <p class="muted">${escapeHtml(text)}</p>
        <button class="button secondary" type="button" data-go="${view}">${escapeHtml(button)}</button>
      </article>`;
  }

  function emptyBlock(title, text, button, view) {
    return `
      <div class="empty-state">
        <div>
          <h3>${escapeHtml(title)}</h3>
          <p>${escapeHtml(text)}</p>
          <button class="button primary" type="button" data-go="${view}">${escapeHtml(button)}</button>
        </div>
      </div>`;
  }

  function handleMainFocus() {
    if (getDueCards().length) return setView('review');
    if (getOpenActions().length) return setView('actions');
    if (state.notes.some((note) => !note.distill)) return setView('studio');
    return setView('capture');
  }

  function renderTagBar() {
    const tags = tagStats().slice(0, 18);
    const chips = [
      `<button class="tag-chip ${state.activeTag ? '' : 'active'}" type="button" data-tag="">Tất cả</button>`,
      ...tags.map((item) => `<button class="tag-chip ${state.activeTag === item.tag ? 'active' : ''}" type="button" data-tag="${escapeAttr(item.tag)}">#${escapeHtml(item.tag)} <small>${item.count}</small></button>`)
    ];
    els.tagBar.innerHTML = chips.join('');
  }

  function handleTagClick(event) {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.activeTag = button.dataset.tag;
    state.view = 'library';
    saveSettings();
    setView('library');
    renderTagBar();
  }

  function renderLibrary() {
    const list = filteredNotes();
    els.resultCount.textContent = `${list.length} mục`;
    if (!list.length) {
      els.libraryList.innerHTML = `<div class="empty-state"><div><h3>Chưa có mục phù hợp</h3><p>Hãy đổi bộ lọc hoặc ghi một kiến thức mới.</p></div></div>`;
      return;
    }
    els.libraryList.innerHTML = list.map(renderNoteCard).join('');
  }

  function renderNoteCard(note) {
    const mastery = noteMastery(note);
    const cardCount = note.cards.length;
    const actionCount = noteOpenActions(note).length;
    const summary = note.distill?.summary?.[0] || note.content || 'Chưa có nội dung.';
    return `
      <article class="note-card ${note.favorite ? 'featured' : ''}" data-id="${note.id}">
        <div class="card-top">
          <div>
            <p class="label">${escapeHtml(categoryText(note))} · ${escapeHtml(priorityText(note.priority))}</p>
            <h3 class="card-title">${escapeHtml(note.title)}</h3>
          </div>
          <button class="small-action ${note.favorite ? 'done' : ''}" data-action="favorite" data-id="${note.id}" title="Yêu thích">${note.favorite ? '★' : '☆'}</button>
        </div>
        <p class="card-content">${escapeHtml(summary)}</p>
        <div class="card-meta">
          <span class="status-chip">${note.distill ? 'Đã chưng cất' : 'Ghi chú thô'}</span>
          <span class="status-chip">${cardCount} card</span>
          <span class="status-chip">${actionCount} việc</span>
        </div>
        <div class="mastery-bar" title="Mastery ${mastery}%"><span style="--w:${mastery}%"></span></div>
        <div class="card-tags">${note.tags.slice(0, 6).map((tag) => `<span>#${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="card-actions">
          <button class="small-action" data-action="read" data-id="${note.id}">Đọc</button>
          <button class="small-action" data-action="studio" data-id="${note.id}">Studio</button>
          <button class="small-action" data-action="edit" data-id="${note.id}">Sửa</button>
          <button class="small-action" data-action="copy" data-id="${note.id}">Copy</button>
          <button class="small-action warn" data-action="archive" data-id="${note.id}">${note.archived ? 'Khôi phục' : 'Lưu trữ'}</button>
          <button class="small-action danger" data-action="delete" data-id="${note.id}">Xóa</button>
        </div>
      </article>`;
  }

  function handleCardAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const id = button.dataset.id;
    const action = button.dataset.action;
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    if (action === 'favorite') note.favorite = !note.favorite;
    if (action === 'archive') note.archived = !note.archived;
    if (action === 'delete') {
      if (!confirm('Xóa vĩnh viễn mục này?')) return;
      state.notes = state.notes.filter((item) => item.id !== id);
      toast('Đã xóa.');
    }
    if (action === 'copy') copyNote(note);
    if (action === 'edit') startEdit(note);
    if (action === 'read') openReader(id);
    if (action === 'studio') {
      state.selectedNoteId = id;
      saveSettings();
      setView('studio');
    }
    note.updatedAt = new Date().toISOString();
    saveNotes();
    renderAll();
  }

  function renderStudio() {
    const note = getSelectedNote();
    if (!note) {
      els.studioContent.innerHTML = `<div><h3>Chưa có tri thức để chưng cất</h3><p>Ghi một kiến thức mới để Studio tạo summary, bài học, flashcard và hành động.</p></div>`;
      els.studioContent.classList.add('empty-state');
      return;
    }
    if (!note.distill) applyDistill(note);
    saveNotes();
    els.studioContent.classList.remove('empty-state');
    const distill = note.distill;
    els.studioContent.innerHTML = `
      <article class="distill-box">
        <div class="card-top">
          <div>
            <p class="label">${escapeHtml(categoryText(note))} · ${formatDate(note.updatedAt)}</p>
            <h3>${escapeHtml(note.title)}</h3>
            <p class="muted">${escapeHtml(distill.insight || '')}</p>
          </div>
          <div class="card-actions">
            <button class="small-action" data-action="redistill" data-id="${note.id}">Chưng cất lại</button>
            <button class="small-action" data-action="reader" data-id="${note.id}">Reading Room</button>
          </div>
        </div>
      </article>
      <div class="distill-grid">
        ${distillBox('Ý chính', distill.summary)}
        ${distillBox('Bài học rút ra', distill.lessons)}
        ${distillBox('Hành động áp dụng', distill.actions)}
        ${distillBox('Câu hỏi tự học', distill.questions)}
      </div>
      <article class="distill-box">
        <h3>Khái niệm trọng tâm</h3>
        <div class="tag-bar">${distill.concepts.map((concept) => `<span class="tag-chip">#${escapeHtml(concept)}</span>`).join('')}</div>
      </article>
      <article class="distill-box">
        <div class="section-head compact"><h3>Flashcard được tạo</h3><span class="mini-badge">${note.cards.length} thẻ</span></div>
        <div class="card-list">${note.cards.slice(0, 8).map((card) => `<div class="flashcard"><p class="label">Level ${card.level}</p><div class="flash-question">${escapeHtml(card.q)}</div><div class="flash-answer">${escapeHtml(card.a)}</div></div>`).join('')}</div>
      </article>`;
  }

  function distillBox(title, items) {
    const list = Array.isArray(items) && items.length ? items : ['Chưa có dữ liệu.'];
    return `<article class="distill-box"><h3>${escapeHtml(title)}</h3><ul>${list.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></article>`;
  }

  function handleStudioAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const note = state.notes.find((item) => item.id === button.dataset.id);
    if (!note) return;
    if (button.dataset.action === 'redistill') {
      applyDistill(note);
      markActivity();
      saveNotes();
      renderStudio();
      toast('Đã chưng cất lại.');
    }
    if (button.dataset.action === 'reader') openReader(note.id);
  }

  function renderReview() {
    const due = getDueCards();
    els.reviewCount.textContent = `${due.length} thẻ đến hạn`;
    if (!due.length) {
      els.reviewDeck.innerHTML = `<div class="empty-state"><div><h3>Không có thẻ đến hạn</h3><p>Rất tốt. Có thể ghi thêm kiến thức mới hoặc làm quiz tự chọn.</p></div></div>`;
      return;
    }
    els.reviewDeck.innerHTML = due.slice(0, 12).map(({ note, card }) => `
      <article class="flashcard" data-note-id="${note.id}" data-card-id="${card.id}">
        <p class="label">${escapeHtml(note.title)} · Level ${card.level}</p>
        <div class="flash-question">${escapeHtml(card.q)}</div>
        <details><summary class="button secondary">Hiện đáp án</summary><div class="flash-answer">${escapeHtml(card.a)}</div></details>
        <div class="review-actions">
          <button class="button ghost" data-grade="again" data-note-id="${note.id}" data-card-id="${card.id}">Quên</button>
          <button class="button secondary" data-grade="good" data-note-id="${note.id}" data-card-id="${card.id}">Nhớ</button>
          <button class="button primary" data-grade="easy" data-note-id="${note.id}" data-card-id="${card.id}">Rất chắc</button>
        </div>
      </article>`).join('');
  }

  function handleReviewAction(event) {
    const button = event.target.closest('[data-grade]');
    if (!button) return;
    const note = state.notes.find((item) => item.id === button.dataset.noteId);
    const card = note?.cards.find((item) => item.id === button.dataset.cardId);
    if (!note || !card) return;
    const grade = button.dataset.grade;
    if (grade === 'again') {
      card.level = Math.max(0, card.level - 1);
      card.lapses += 1;
      card.dueAt = addDays(1);
    } else if (grade === 'good') {
      card.level = Math.min(7, card.level + 1);
      card.dueAt = addDays(REVIEW_INTERVALS[card.level] || 30);
    } else {
      card.level = Math.min(7, card.level + 2);
      card.dueAt = addDays(REVIEW_INTERVALS[card.level] || 60);
    }
    card.lastReviewed = new Date().toISOString();
    note.updatedAt = new Date().toISOString();
    markActivity();
    saveNotes();
    renderAll();
    toast('Đã cập nhật lịch ôn.');
  }

  function renderQuiz() {
    if (!state.quiz) buildQuiz(false);
    if (!state.quiz) {
      els.quizBox.innerHTML = `<div><h3>Chưa có flashcard để tạo quiz</h3><p>Hãy ghi và chưng cất ít nhất một kiến thức.</p></div>`;
      els.quizBox.classList.add('empty-state');
      return;
    }
    els.quizBox.classList.remove('empty-state');
    els.quizBox.innerHTML = `
      <article class="flashcard">
        <p class="label">Quiz từ: ${escapeHtml(state.quiz.noteTitle)}</p>
        <div class="flash-question">${escapeHtml(state.quiz.question)}</div>
        <div class="studio-content">
          ${state.quiz.choices.map((choice, index) => `<button class="quiz-choice" data-index="${index}">${escapeHtml(choice)}</button>`).join('')}
        </div>
        <p id="quizResult" class="muted"></p>
      </article>`;
  }

  function buildQuiz(showToast = true) {
    const cards = getAllCards();
    if (!cards.length) {
      state.quiz = null;
      localStorage.removeItem(QUIZ_KEY);
      if (showToast) toast('Chưa có flashcard để tạo quiz.');
      return;
    }
    const target = cards[Math.floor(Math.random() * cards.length)];
    const others = shuffle(cards.filter((item) => item.card.id !== target.card.id).map((item) => item.card.a)).slice(0, 3);
    const choices = shuffle(unique([target.card.a, ...others]).slice(0, 4));
    state.quiz = {
      noteId: target.note.id,
      cardId: target.card.id,
      noteTitle: target.note.title,
      question: target.card.q,
      answer: target.card.a,
      choices
    };
    localStorage.setItem(QUIZ_KEY, JSON.stringify(state.quiz));
    renderQuiz();
    if (showToast) toast('Đã tạo quiz mới.');
  }

  function handleQuizAction(event) {
    const button = event.target.closest('[data-index]');
    if (!button || !state.quiz) return;
    const choice = state.quiz.choices[Number(button.dataset.index)];
    const ok = normalizeText(choice) === normalizeText(state.quiz.answer);
    $$('.quiz-choice').forEach((item) => {
      const value = state.quiz.choices[Number(item.dataset.index)];
      item.classList.toggle('correct', normalizeText(value) === normalizeText(state.quiz.answer));
      if (item === button && !ok) item.classList.add('wrong');
    });
    const result = $('#quizResult');
    result.textContent = ok ? 'Đúng. Hãy tự diễn giải lại bằng lời của mình.' : `Chưa đúng. Đáp án đúng: ${state.quiz.answer}`;
    if (ok) markActivity();
    const note = state.notes.find((item) => item.id === state.quiz.noteId);
    const card = note?.cards.find((item) => item.id === state.quiz.cardId);
    if (card) {
      card.level = ok ? Math.min(7, card.level + 1) : Math.max(0, card.level - 1);
      card.lastReviewed = new Date().toISOString();
      card.dueAt = ok ? addDays(REVIEW_INTERVALS[card.level] || 14) : addDays(1);
      saveNotes();
      renderMetrics();
    }
  }

  function renderActions() {
    const actions = getOpenActions(true);
    els.actionCount.textContent = `${actions.length} việc`;
    if (!actions.length) {
      els.actionBoard.innerHTML = `<div class="empty-state"><div><h3>Không còn hành động mở</h3><p>Rất tốt. Hãy ghi thêm tri thức hoặc tạo hành động mới từ Studio.</p></div></div>`;
      return;
    }
    els.actionBoard.innerHTML = actions.map(({ note, action, type }) => `
      <article class="action-item">
        <p class="label">${escapeHtml(note.title)}</p>
        <h3>${escapeHtml(action.text)}</h3>
        <p class="muted">${escapeHtml(note.distill?.insight || categoryText(note))}</p>
        <div class="card-actions">
          <button class="button primary" data-action="done" data-note-id="${note.id}" data-action-id="${action.id}" data-type="${type}">Đánh dấu xong</button>
          <button class="button ghost" data-action="read" data-note-id="${note.id}">Đọc nguồn</button>
        </div>
      </article>`).join('');
  }

  function handleActionBoard(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const note = state.notes.find((item) => item.id === button.dataset.noteId);
    if (!note) return;
    if (button.dataset.action === 'read') return openReader(note.id);
    if (button.dataset.action === 'done') {
      if (button.dataset.type === 'manual') {
        note.actionDone = true;
      } else {
        const action = note.generatedActions.find((item) => item.id === button.dataset.actionId);
        if (action) {
          action.done = true;
          action.doneAt = new Date().toISOString();
        }
      }
      note.updatedAt = new Date().toISOString();
      markActivity();
      saveNotes();
      renderAll();
      toast('Đã biến tri thức thành hành động.');
    }
  }

  function renderPaths() {
    const paths = tagStats().slice(0, 12).map((tag) => buildPath(tag.tag));
    if (!paths.length) {
      els.pathBoard.innerHTML = `<div class="empty-state"><div><h3>Chưa có lộ trình</h3><p>Thêm tag cho ghi chú để app tự tạo lộ trình học: AI, tài chính, tiếng Anh, marketing...</p></div></div>`;
      return;
    }
    els.pathBoard.innerHTML = paths.map((path) => `
      <article class="path-card">
        <p class="label">#${escapeHtml(path.tag)}</p>
        <h3>${escapeHtml(path.title)}</h3>
        <p class="muted">${path.notes} ghi chú · ${path.cards} flashcard · ${path.due} cần ôn · ${path.actions} việc mở</p>
        <div class="path-meter"><span style="--w:${path.progress}%"></span></div>
        <strong>${path.progress}% hoàn thiện</strong>
        <button class="button secondary" data-tag="${escapeAttr(path.tag)}">Mở lộ trình</button>
      </article>`).join('');
  }

  function handlePathAction(event) {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.activeTag = button.dataset.tag;
    state.view = 'library';
    saveSettings();
    setView('library');
    renderTagBar();
  }

  function buildPath(tag) {
    const notes = state.notes.filter((note) => !note.archived && note.tags.includes(tag));
    const cards = notes.reduce((sum, note) => sum + note.cards.length, 0);
    const due = getDueCards().filter((item) => item.note.tags.includes(tag)).length;
    const actions = notes.reduce((sum, note) => sum + noteOpenActions(note).length, 0);
    const distilled = notes.filter((note) => note.distill).length;
    const progress = notes.length ? Math.round(((distilled / notes.length) * 35) + average(notes.map(noteMastery)) * 0.45 + (actions ? 0 : 20)) : 0;
    return {
      tag,
      title: learningPathTitle(tag),
      notes: notes.length,
      cards,
      due,
      actions,
      progress: clamp(progress, 0, 100)
    };
  }

  function learningPathTitle(tag) {
    const clean = tag.replace(/[-_]/g, ' ');
    return `Lộ trình ${clean.charAt(0).toUpperCase()}${clean.slice(1)}`;
  }

  function renderMap() {
    const tags = tagStats();
    els.mapCount.textContent = `${tags.length} tag`;
    if (!tags.length) {
      els.knowledgeMap.innerHTML = `<div class="empty-state"><div><h3>Bản đồ đang trống</h3><p>Khi Lão thêm tag, app sẽ cho thấy mảng nào đang học nhiều, mảng nào còn hổng.</p></div></div>`;
      return;
    }
    els.knowledgeMap.innerHTML = tags.slice(0, 30).map((item) => {
      const path = buildPath(item.tag);
      return `<article class="map-card">
        <p class="label">#${escapeHtml(item.tag)}</p>
        <strong>${item.count} mục</strong>
        <p class="muted">Mastery ${path.progress}% · ${path.due} cần ôn · ${path.actions} việc mở</p>
        <div class="path-meter"><span style="--w:${path.progress}%"></span></div>
      </article>`;
    }).join('');
  }

  function openReader(id) {
    const note = state.notes.find((item) => item.id === id);
    if (!note) return;
    note.reads += 1;
    note.openedAt = new Date().toISOString();
    saveNotes();
    els.readerTitle.textContent = note.title;
    els.readerBody.innerHTML = `
      <div class="reader-section">
        <p class="label">${escapeHtml(categoryText(note))} · ${formatDate(note.createdAt)}</p>
        <pre class="reader-text">${escapeHtml(note.content || 'Không có nội dung gốc.')}</pre>
        ${safeUrl(note.source) ? `<p><a class="button secondary" href="${escapeAttr(safeUrl(note.source))}" target="_blank" rel="noopener">Mở nguồn</a></p>` : ''}
      </div>
      ${note.distill ? `
      <div class="distill-grid">
        ${distillBox('Ý chính', note.distill.summary)}
        ${distillBox('Bài học', note.distill.lessons)}
        ${distillBox('Hành động', note.distill.actions)}
        ${distillBox('Câu hỏi', note.distill.questions)}
      </div>` : '<div class="reader-section"><p>Ghi chú này chưa được chưng cất.</p></div>'}
    `;
    els.readerDialog.showModal();
  }

  function startEdit(note) {
    state.editingId = note.id;
    els.noteId.value = note.id;
    els.noteTitle.value = note.title;
    els.noteContent.value = note.content;
    els.noteMode.value = note.mode;
    els.noteCategory.value = note.category;
    els.notePriority.value = note.priority;
    els.noteTarget.value = note.target;
    els.noteTags.value = note.tags.join(', ');
    els.noteSource.value = note.source;
    els.noteAction.value = note.action;
    els.saveButton.textContent = 'Cập nhật & chưng cất lại';
    els.cancelEdit.classList.remove('hidden');
    setView('capture');
    toast('Đang sửa ghi chú.');
  }

  function cancelEdit() {
    state.editingId = '';
    clearForm({ keepDraft: false });
  }

  function clearForm({ keepDraft }) {
    els.noteForm.reset();
    els.noteId.value = '';
    els.noteMode.value = 'deep';
    els.noteCategory.value = 'idea';
    els.notePriority.value = 'high';
    els.noteTarget.value = 'apply';
    els.saveButton.textContent = 'Lưu & tạo bài học';
    els.cancelEdit.classList.add('hidden');
    els.draftStatus.textContent = 'Draft an toàn';
    state.editingId = '';
    if (!keepDraft) localStorage.removeItem(DRAFT_KEY);
  }

  function fillLearningTemplate() {
    if (els.noteContent.value.trim() && !confirm('Thay nội dung hiện tại bằng mẫu học nhanh?')) return;
    els.noteTitle.value = 'Bài học mới cần chưng cất';
    els.noteContent.value = [
      'Nguồn học:',
      '- ',
      '',
      'Ý chính mình vừa hiểu:',
      '- ',
      '',
      'Điểm quan trọng / nguyên tắc:',
      '- ',
      '',
      'Ví dụ thực tế:',
      '- ',
      '',
      'Câu hỏi còn thắc mắc:',
      '- ',
      '',
      'Cách áp dụng trong 24 giờ tới:',
      '- '
    ].join('\n');
    els.noteTags.value = 'học tập, cần ôn';
    els.noteAction.value = 'Viết lại bài học này bằng lời của mình và áp dụng vào 1 việc nhỏ.';
    saveDraft();
    toast('Đã nạp mẫu học nhanh.');
  }

  function copyNote(note) {
    const text = noteToMarkdown(note);
    navigator.clipboard?.writeText(text).then(() => toast('Đã copy ghi chú.')).catch(() => toast('Không copy được tự động.'));
  }

  function noteToMarkdown(note) {
    const distill = note.distill;
    return [
      `# ${note.title}`,
      '',
      `Loại: ${categoryText(note)}`,
      `Tag: ${note.tags.map((tag) => `#${tag}`).join(' ')}`,
      note.source ? `Nguồn: ${note.source}` : '',
      '',
      '## Nội dung gốc',
      note.content || '',
      '',
      distill ? '## Ý chính\n' + distill.summary.map((item) => `- ${item}`).join('\n') : '',
      distill ? '\n## Bài học\n' + distill.lessons.map((item) => `- ${item}`).join('\n') : '',
      distill ? '\n## Hành động\n' + distill.actions.map((item) => `- ${item}`).join('\n') : ''
    ].filter(Boolean).join('\n');
  }

  function filteredNotes() {
    const search = normalizeText(state.search);
    const priorityRank = { high: 3, medium: 2, low: 1 };
    return state.notes
      .filter((note) => {
        if (state.category !== 'all' && note.category !== state.category) return false;
        if (state.status === 'active' && note.archived) return false;
        if (state.status === 'archived' && !note.archived) return false;
        if (state.status === 'favorite' && !note.favorite) return false;
        if (state.status === 'distilled' && !note.distill) return false;
        if (state.activeTag && !note.tags.includes(state.activeTag)) return false;
        if (!search) return true;
        const haystack = normalizeText([note.title, note.content, note.tags.join(' '), note.action, note.distill?.summary?.join(' '), note.distill?.lessons?.join(' ')].filter(Boolean).join(' '));
        return haystack.includes(search);
      })
      .sort((a, b) => {
        if (state.sort === 'created_desc') return b.createdAt.localeCompare(a.createdAt);
        if (state.sort === 'review_due') return (a.nextReview || '').localeCompare(b.nextReview || '');
        if (state.sort === 'mastery_asc') return noteMastery(a) - noteMastery(b);
        if (state.sort === 'priority_desc') return priorityRank[b.priority] - priorityRank[a.priority];
        if (state.sort === 'title_asc') return a.title.localeCompare(b.title, 'vi');
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }

  function getSelectedNote() {
    return state.notes.find((note) => note.id === state.selectedNoteId) || state.notes[0] || null;
  }

  function getAllCards() {
    return state.notes
      .filter((note) => !note.archived)
      .flatMap((note) => note.cards.map((card) => ({ note, card })));
  }

  function getDueCards() {
    const now = Date.now();
    return getAllCards().filter(({ card }) => new Date(card.dueAt || 0).getTime() <= now);
  }

  function noteOpenActions(note) {
    const actions = [];
    if (note.action && !note.actionDone) actions.push({ note, action: { id: 'manual', text: note.action, done: false }, type: 'manual' });
    note.generatedActions.forEach((action) => {
      if (!action.done) actions.push({ note, action, type: 'generated' });
    });
    return actions;
  }

  function getOpenActions() {
    return state.notes.filter((note) => !note.archived).flatMap(noteOpenActions);
  }

  function tagStats() {
    const map = new Map();
    state.notes.filter((note) => !note.archived).forEach((note) => {
      note.tags.forEach((tag) => {
        map.set(tag, (map.get(tag) || 0) + 1);
      });
    });
    return Array.from(map.entries()).map(([tag, count]) => ({ tag, count })).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'vi'));
  }

  function noteMastery(note) {
    if (!note.cards.length) return note.distill ? 20 : 0;
    const max = note.cards.length * 7;
    const current = note.cards.reduce((sum, card) => sum + card.level, 0);
    return Math.round((current / max) * 100);
  }

  function learningScore() {
    const total = state.notes.length;
    const distilled = state.notes.filter((note) => note.distill).length;
    const due = getDueCards().length;
    const actions = getOpenActions().length;
    const streak = computeStreak();
    const mastery = total ? average(state.notes.map(noteMastery)) : 0;
    return clamp(Math.round(total * 4 + distilled * 7 + mastery * 0.38 + streak * 6 - due * 2 - actions), 0, 100);
  }

  function markActivity() {
    const key = todayKey();
    const dates = new Set(state.settings.activityDates || []);
    dates.add(key);
    state.settings.activityDates = Array.from(dates).sort();
    saveSettings();
  }

  function hasActivityToday() {
    return (state.settings.activityDates || []).includes(todayKey());
  }

  function computeStreak() {
    const dates = new Set(state.settings.activityDates || []);
    let streak = 0;
    const cursor = new Date();
    while (dates.has(toDateKey(cursor))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }
    return streak;
  }

  function seedStarterPack() {
    if (state.notes.length && !confirm('Nạp thêm bộ mẫu học tập? Dữ liệu hiện có vẫn được giữ.')) return;
    const now = new Date().toISOString();
    const samples = [
      {
        title: 'Cách học kiến thức mới không bị trôi',
        content: 'Nguyên tắc quan trọng: không chỉ lưu thông tin. Cần biến thông tin thành ý chính, bài học, câu hỏi ôn tập và hành động nhỏ trong 24 giờ. Nếu không ôn lại, kiến thức sẽ ngủ quên. Nếu không áp dụng, kiến thức chỉ là ghi chú đẹp.',
        category: 'lesson', priority: 'high', target: 'apply', tags: ['học tập', 'second brain'], action: 'Chọn 1 ghi chú cũ và biến thành flashcard.'
      },
      {
        title: 'Framework Capture → Distill → Practice → Apply',
        content: 'Capture là thu gom kiến thức thô. Distill là rút ý chính và bài học. Practice là ôn tập bằng flashcard hoặc quiz. Apply là đưa bài học vào việc thật. Vòng lặp này giúp ghi chú trở thành năng lực.',
        category: 'framework', priority: 'high', target: 'teach', tags: ['framework', 'học tập'], action: 'Dùng framework này cho bài học tiếp theo.'
      },
      {
        title: 'Prompt tự học một chủ đề mới',
        content: 'Hãy giải thích chủ đề này như dạy cho người mới bắt đầu. Sau đó tạo ví dụ thực tế, 5 câu hỏi kiểm tra, 3 lỗi thường gặp và một kế hoạch thực hành 7 ngày.',
        category: 'prompt', priority: 'medium', target: 'apply', tags: ['prompt ai', 'học tập'], action: 'Thử prompt này với một chủ đề đang học.'
      }
    ].map((item) => {
      const note = normalizeNote({ ...item, id: createId(), createdAt: now, updatedAt: now });
      applyDistill(note);
      return note;
    });
    state.notes = [...samples, ...state.notes];
    markActivity();
    saveNotes();
    renderAll();
    toast('Đã nạp bộ mẫu học tập.');
  }

  function exportJson() {
    const payload = {
      app: 'Sổ Thông Thái Learning Pro',
      version: APP_VERSION,
      schema: 2,
      exportedAt: new Date().toISOString(),
      storageKey: STORAGE_KEY,
      settings: state.settings,
      records: state.notes
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wisdom-notebook-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Đã xuất JSON backup.');
  }

  function importJson(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const records = Array.isArray(parsed) ? parsed : (parsed.records || parsed.notes || []);
        if (!Array.isArray(records)) throw new Error('JSON không có records hợp lệ.');
        const imported = records.map(normalizeNote);
        const byId = new Map(state.notes.map((note) => [note.id, note]));
        imported.forEach((note) => byId.set(note.id, note));
        state.notes = Array.from(byId.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
        if (parsed.settings?.activityDates) state.settings.activityDates = unique([...(state.settings.activityDates || []), ...parsed.settings.activityDates]);
        saveNotes();
        saveSettings();
        renderAll();
        toast(`Đã nhập ${imported.length} mục.`);
      } catch (error) {
        toast(`Import lỗi: ${error.message}`);
      } finally {
        els.importFile.value = '';
      }
    };
    reader.readAsText(file);
  }

  function resetData() {
    const first = confirm('Reset toàn bộ Sổ Thông Thái trên trình duyệt này?');
    if (!first) return;
    const second = prompt('Gõ RESET để xác nhận xóa dữ liệu cục bộ.');
    if (second !== 'RESET') return toast('Đã hủy reset.');
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(DRAFT_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(QUIZ_KEY);
    state.notes = [];
    state.quiz = null;
    renderAll();
    toast('Đã reset dữ liệu.');
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme === 'light' ? 'light' : 'dark';
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch((error) => console.warn('Service worker lỗi:', error));
    }
  }

  function testStorage() {
    try {
      const key = '__wisdom_test__';
      localStorage.setItem(key, '1');
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      return false;
    }
  }

  function parseTags(input) {
    return unique(String(input || '')
      .split(/[#,;\n]/)
      .map((tag) => normalizeTag(tag))
      .filter(Boolean))
      .slice(0, 16);
  }

  function normalizeTag(tag) {
    return String(tag || '').trim().toLowerCase().replace(/\s+/g, ' ').replace(/^#/, '').slice(0, 42);
  }

  function splitSentences(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .split(/(?<=[.!?。！？])\s+|\n+/)
      .map((sentence) => sentence.replace(/^[-*•\d.\s]+/, '').trim())
      .filter((sentence) => sentence.length > 18)
      .slice(0, 80);
  }

  function extractWords(text) {
    return normalizeText(text)
      .split(/[^a-z0-9à-ỹ]+/i)
      .map((word) => word.trim())
      .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
  }

  function findSentenceWith(sentences, word) {
    const key = normalizeText(word);
    return sentences.find((sentence) => normalizeText(sentence).includes(key));
  }

  function categoryText(note) {
    const item = CATEGORY[note.category] || CATEGORY.other;
    return `${item.icon} ${item.label}`;
  }

  function priorityText(priority) {
    return priority === 'high' ? 'Ưu tiên cao' : priority === 'low' ? 'Tham khảo' : 'Ưu tiên vừa';
  }

  function formatDate(value) {
    if (!value) return '';
    return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(value));
  }

  function addDays(days) {
    const date = new Date();
    date.setDate(date.getDate() + Number(days || 0));
    return date.toISOString();
  }

  function todayKey() {
    return toDateKey(new Date());
  }

  function toDateKey(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  function createId() {
    if (crypto?.randomUUID) return crypto.randomUUID();
    return `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }

  function unique(items) {
    return Array.from(new Set(items.filter(Boolean)));
  }

  function average(numbers) {
    const valid = numbers.filter((number) => Number.isFinite(number));
    return valid.length ? valid.reduce((sum, number) => sum + number, 0) / valid.length : 0;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function shuffle(items) {
    return [...items].sort(() => Math.random() - 0.5);
  }

  function normalizeText(text) {
    return String(text || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9à-ỹ\s]/gi, ' ').replace(/\s+/g, ' ').trim();
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function safeUrl(value) {
    const url = String(value || '').trim();
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return '';
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }
})();
