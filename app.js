(function () {
  'use strict';

  const APP_VERSION = '1.3.0';
  const DB_NAME = 'wisdom_notebook_db_v13';
  const DB_VERSION = 1;
  const RECORD_STORE = 'records';
  const META_STORE = 'meta';
  const PUBLIC_DATA_URL = 'data/wisdom-public.json';
  const LEGACY_RECORDS_KEY = 'wisdom_notebook_records_v1';
  const SETTINGS_KEY = 'wisdom_notebook_settings_v1';
  const DRAFT_KEY = 'wisdom_notebook_draft_v1';
  const DAILY_PICK_KEY = 'wisdom_notebook_daily_pick_v1';
  const QUIZ_KEY = 'wisdom_notebook_quiz_v1';
  const REVIEW_INTERVALS = [0, 1, 3, 7, 14, 30, 60, 120];
  const STOP_WORDS = new Set('và là của có cho trong một những các với được khi này đó thì vào để hoặc từ như hơn sẽ đã đang vì trên dưới nếu cũng rất nhưng không cần nên phải bởi về mình tôi bạn chúng ta mỗi ngày càng thật việc điều kiến thức học tập ghi chú app bằng hoặc tại được'.split(' '));

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
    finance: { label: 'Tài chính', icon: '💰' },
    other: { label: 'Khác', icon: '🧠' }
  };

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => Array.from(document.querySelectorAll(selector));
  const todayKey = () => formatDateKey(new Date());

  const els = {};
  const state = {
    db: null,
    records: [],
    view: 'today',
    selectedId: '',
    dailyPickId: '',
    search: '',
    source: 'all',
    track: 'all',
    status: 'active',
    sort: 'updated_desc',
    activeTag: '',
    quiz: null,
    publicMeta: {
      status: 'LOCAL_ONLY',
      version: '',
      syncedAt: '',
      source: PUBLIC_DATA_URL,
      message: 'Chưa đồng bộ kho chung.',
      log: []
    },
    settings: {
      theme: 'dark',
      activityDates: [],
      migratedLegacy: false
    }
  };

  document.addEventListener('DOMContentLoaded', init);

  async function init() {
    cacheElements();
    bindEvents();
    loadSettings();
    applyTheme();
    tickCalendar();
    setInterval(tickCalendar, 1000);
    renderNetwork();

    try {
      state.db = await openDatabase();
      await loadMeta();
      await migrateLegacyRecords();
      state.records = await getAllRecords();
      await syncPublicLibrary({ silent: true });
      state.records = await getAllRecords();
      pickDailyNote({ allowToast: false });
      restoreDraft();
      registerServiceWorker();
      renderAll();
      toast('Public Learning Library Pro đã sẵn sàng.');
    } catch (error) {
      console.error(error);
      toast('Lỗi khởi động dữ liệu. Hãy thử tải lại app.');
      renderAll();
    }
  }

  function cacheElements() {
    Object.assign(els, {
      app: $('#app'),
      themeToggle: $('#themeToggle'),
      networkPill: $('#networkPill'),
      networkText: $('#networkText'),
      solarDate: $('#solarDate'),
      clockText: $('#clockText'),
      lunarDate: $('#lunarDate'),
      lunarYearText: $('#lunarYearText'),
      contextSlogan: $('#contextSlogan'),
      sloganContext: $('#sloganContext'),
      learnToday: $('#learnToday'),
      syncNowHero: $('#syncNowHero'),
      captureNow: $('#captureNow'),
      stateBadge: $('#stateBadge'),
      dailyPickTitle: $('#dailyPickTitle'),
      dailyPickSummary: $('#dailyPickSummary'),
      openDailyPick: $('#openDailyPick'),
      skipDailyPick: $('#skipDailyPick'),
      stateSlogan: $('#stateSlogan'),
      metricPublic: $('#metricPublic'),
      metricLocal: $('#metricLocal'),
      metricDue: $('#metricDue'),
      metricActions: $('#metricActions'),
      metricStreak: $('#metricStreak'),
      metricTags: $('#metricTags'),
      todayLabel: $('#todayLabel'),
      mainFocus: $('#mainFocus'),
      doMainFocus: $('#doMainFocus'),
      dueFocus: $('#dueFocus'),
      syncFocus: $('#syncFocus'),
      todayFeed: $('#todayFeed'),
      searchInput: $('#searchInput'),
      sourceFilter: $('#sourceFilter'),
      trackFilter: $('#trackFilter'),
      statusFilter: $('#statusFilter'),
      sortSelect: $('#sortSelect'),
      tagBar: $('#tagBar'),
      resultCount: $('#resultCount'),
      libraryList: $('#libraryList'),
      readerContent: $('#readerContent'),
      noteForm: $('#noteForm'),
      noteId: $('#noteId'),
      noteTitle: $('#noteTitle'),
      noteTrack: $('#noteTrack'),
      noteContent: $('#noteContent'),
      noteCategory: $('#noteCategory'),
      noteLevel: $('#noteLevel'),
      noteTarget: $('#noteTarget'),
      noteTags: $('#noteTags'),
      noteSource: $('#noteSource'),
      noteAction: $('#noteAction'),
      savePlainButton: $('#savePlainButton'),
      fillTemplate: $('#fillTemplate'),
      clearForm: $('#clearForm'),
      cancelEdit: $('#cancelEdit'),
      draftStatus: $('#draftStatus'),
      reviewCount: $('#reviewCount'),
      reviewDeck: $('#reviewDeck'),
      newQuiz: $('#newQuiz'),
      quizBox: $('#quizBox'),
      actionCount: $('#actionCount'),
      actionBoard: $('#actionBoard'),
      mapCount: $('#mapCount'),
      knowledgeMap: $('#knowledgeMap'),
      syncBadge: $('#syncBadge'),
      publicSourceText: $('#publicSourceText'),
      publicVersionText: $('#publicVersionText'),
      syncTimeText: $('#syncTimeText'),
      syncNow: $('#syncNow'),
      exportJson: $('#exportJson'),
      exportJson2: $('#exportJson2'),
      importButton: $('#importButton'),
      importFile: $('#importFile'),
      resetData: $('#resetData'),
      openPublicFile: $('#openPublicFile'),
      syncLog: $('#syncLog'),
      toast: $('#toast')
    });
  }

  function bindEvents() {
    window.addEventListener('online', () => { renderNetwork(); syncPublicLibrary({ silent: true }); });
    window.addEventListener('offline', renderNetwork);
    els.themeToggle.addEventListener('click', toggleTheme);
    els.learnToday.addEventListener('click', () => openSuggestedLearning());
    els.syncNowHero.addEventListener('click', () => syncPublicLibrary({ silent: false }));
    els.captureNow.addEventListener('click', () => setView('capture'));
    els.openDailyPick.addEventListener('click', () => openRecord(state.dailyPickId));
    els.skipDailyPick.addEventListener('click', () => pickDailyNote({ allowToast: true }));
    els.doMainFocus.addEventListener('click', openSuggestedLearning);

    $$('.nav-tab').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));

    els.searchInput.addEventListener('input', () => { state.search = els.searchInput.value.trim(); saveSettings(); renderLibrary(); });
    els.sourceFilter.addEventListener('change', () => { state.source = els.sourceFilter.value; state.activeTag = ''; saveSettings(); renderAll(); });
    els.trackFilter.addEventListener('change', () => { state.track = els.trackFilter.value; state.activeTag = ''; saveSettings(); renderAll(); });
    els.statusFilter.addEventListener('change', () => { state.status = els.statusFilter.value; saveSettings(); renderLibrary(); });
    els.sortSelect.addEventListener('change', () => { state.sort = els.sortSelect.value; saveSettings(); renderLibrary(); });
    els.tagBar.addEventListener('click', handleTagClick);
    els.libraryList.addEventListener('click', handleCardAction);
    els.readerContent.addEventListener('click', handleReaderAction);
    els.reviewDeck.addEventListener('click', handleReviewAction);
    els.quizBox.addEventListener('click', handleQuizAction);
    els.actionBoard.addEventListener('change', handleActionChange);
    els.actionBoard.addEventListener('click', handleActionClick);
    els.noteForm.addEventListener('submit', (event) => handleSave(event, true));
    els.savePlainButton.addEventListener('click', (event) => handleSave(event, false));
    els.fillTemplate.addEventListener('click', fillLearningTemplate);
    els.clearForm.addEventListener('click', () => clearForm({ keepDraft: false }));
    els.cancelEdit.addEventListener('click', cancelEdit);
    [els.noteTitle, els.noteTrack, els.noteContent, els.noteCategory, els.noteLevel, els.noteTarget, els.noteTags, els.noteSource, els.noteAction].forEach((el) => {
      el.addEventListener('input', saveDraft);
      el.addEventListener('change', saveDraft);
    });
    els.newQuiz.addEventListener('click', buildQuiz);
    els.syncNow.addEventListener('click', () => syncPublicLibrary({ silent: false }));
    els.exportJson.addEventListener('click', exportJson);
    els.exportJson2.addEventListener('click', exportJson);
    els.importButton.addEventListener('click', () => els.importFile.click());
    els.importFile.addEventListener('change', importJson);
    els.resetData.addEventListener('click', resetPrivateData);
    els.openPublicFile.addEventListener('click', () => window.open(PUBLIC_DATA_URL, '_blank', 'noopener'));
  }

  function openDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(RECORD_STORE)) {
          const store = db.createObjectStore(RECORD_STORE, { keyPath: 'id' });
          store.createIndex('source', 'source', { unique: false });
          store.createIndex('updatedAt', 'updatedAt', { unique: false });
          store.createIndex('track', 'track', { unique: false });
        }
        if (!db.objectStoreNames.contains(META_STORE)) db.createObjectStore(META_STORE, { keyPath: 'key' });
      };
      request.onsuccess = () => resolve(request.result);
    });
  }

  function txStore(storeName, mode = 'readonly') {
    return state.db.transaction(storeName, mode).objectStore(storeName);
  }

  function idbRequest(request) {
    return new Promise((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  function getAllRecords() {
    return idbRequest(txStore(RECORD_STORE).getAll()).then((items) => items.map(normalizeRecord).sort(sortRecords));
  }

  function putRecord(record) {
    return idbRequest(txStore(RECORD_STORE, 'readwrite').put(normalizeRecord(record)));
  }

  function deleteRecord(id) {
    return idbRequest(txStore(RECORD_STORE, 'readwrite').delete(id));
  }

  async function putRecords(records) {
    const transaction = state.db.transaction(RECORD_STORE, 'readwrite');
    const store = transaction.objectStore(RECORD_STORE);
    records.forEach((record) => store.put(normalizeRecord(record)));
    return new Promise((resolve, reject) => {
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
  }

  async function setMeta(key, value) {
    return idbRequest(txStore(META_STORE, 'readwrite').put({ key, value }));
  }

  async function getMeta(key) {
    const item = await idbRequest(txStore(META_STORE).get(key));
    return item ? item.value : null;
  }

  async function loadMeta() {
    const publicMeta = await getMeta('publicMeta');
    if (publicMeta) state.publicMeta = { ...state.publicMeta, ...publicMeta };
  }

  async function migrateLegacyRecords() {
    if (state.settings.migratedLegacy) return;
    try {
      const raw = JSON.parse(localStorage.getItem(LEGACY_RECORDS_KEY) || '[]');
      if (Array.isArray(raw) && raw.length) {
        const migrated = raw.map((item) => normalizeRecord({ ...item, source: item.source || 'local' }));
        await putRecords(migrated);
        addSyncLog(`Đã migrate ${migrated.length} ghi chú cũ từ localStorage sang IndexedDB.`);
      }
      state.settings.migratedLegacy = true;
      saveSettings();
    } catch (error) {
      console.warn('Không migrate được dữ liệu cũ:', error);
    }
  }

  function loadSettings() {
    try {
      const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}');
      state.settings = { ...state.settings, ...saved };
      state.view = saved.view || state.view;
      state.search = saved.search || '';
      state.source = saved.source || 'all';
      state.track = saved.track || 'all';
      state.status = saved.status || 'active';
      state.sort = saved.sort || 'updated_desc';
      state.activeTag = saved.activeTag || '';
      state.selectedId = saved.selectedId || '';
      state.quiz = JSON.parse(localStorage.getItem(QUIZ_KEY) || 'null');
    } catch (error) {
      console.warn('Không đọc được settings:', error);
    }
  }

  function saveSettings() {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      ...state.settings,
      view: state.view,
      search: state.search,
      source: state.source,
      track: state.track,
      status: state.status,
      sort: state.sort,
      activeTag: state.activeTag,
      selectedId: state.selectedId
    }));
  }

  async function syncPublicLibrary({ silent }) {
    if (!navigator.onLine) {
      state.publicMeta.status = state.publicMeta.version ? 'OFFLINE' : 'LOCAL_ONLY';
      state.publicMeta.message = 'Đang offline, dùng kho public đã cache nếu có.';
      await setMeta('publicMeta', state.publicMeta);
      if (!silent) toast('Đang offline, chưa thể tải kho chung mới.');
      renderAll();
      return;
    }

    try {
      const response = await fetch(`${PUBLIC_DATA_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      validatePublicPayload(payload);
      const incoming = payload.items.map((item) => normalizePublicItem(item, payload));
      await putRecords(incoming);
      state.publicMeta = {
        status: 'SYNCED',
        version: payload.publicDataVersion,
        schemaVersion: payload.schemaVersion,
        title: payload.title || 'Wisdom Public Library',
        source: PUBLIC_DATA_URL,
        syncedAt: new Date().toISOString(),
        message: `Đã đồng bộ ${incoming.length} bài học public.`,
        log: state.publicMeta.log || []
      };
      addSyncLog(state.publicMeta.message);
      await setMeta('publicMeta', state.publicMeta);
      state.records = await getAllRecords();
      if (!state.dailyPickId) pickDailyNote({ allowToast: false });
      if (!silent) toast('Đã đồng bộ kho chung mới nhất.');
      renderAll();
    } catch (error) {
      console.warn('Sync public lỗi:', error);
      state.publicMeta.status = state.publicMeta.version ? 'SYNC_ERROR' : 'LOCAL_ONLY';
      state.publicMeta.message = `Không tải được kho chung: ${error.message}`;
      addSyncLog(state.publicMeta.message);
      await setMeta('publicMeta', state.publicMeta);
      if (!silent) toast('Không tải được kho chung. Kiểm tra file data/wisdom-public.json.');
      renderAll();
    }
  }

  function validatePublicPayload(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('JSON public không hợp lệ.');
    if (!payload.schemaVersion || !payload.publicDataVersion) throw new Error('Thiếu schemaVersion/publicDataVersion.');
    if (!Array.isArray(payload.items)) throw new Error('Thiếu mảng items.');
    const ids = new Set();
    payload.items.forEach((item) => {
      if (!item.id || !item.title || !item.summary || !item.track || !Array.isArray(item.tags)) throw new Error(`Bài public thiếu trường bắt buộc: ${item.id || 'unknown'}`);
      if (ids.has(item.id)) throw new Error(`Trùng ID public: ${item.id}`);
      ids.add(item.id);
    });
  }

  function normalizePublicItem(item, payload) {
    return normalizeRecord({
      ...item,
      source: 'public',
      publicDataVersion: payload.publicDataVersion,
      createdAt: item.createdAt || payload.updatedAt || new Date().toISOString(),
      updatedAt: payload.updatedAt || item.updatedAt || new Date().toISOString()
    });
  }

  function normalizeRecord(record) {
    const now = new Date().toISOString();
    const source = record.source === 'public' ? 'public' : 'local';
    const tags = Array.isArray(record.tags) ? record.tags : parseTags(record.tags || '');
    const flashcards = Array.isArray(record.flashcards) ? record.flashcards.map(normalizeCard) : (Array.isArray(record.cards) ? record.cards.map(normalizeCard) : []);
    const actions = Array.isArray(record.actions) ? record.actions.map(normalizeAction) : (Array.isArray(record.generatedActions) ? record.generatedActions.map(normalizeAction) : []);
    if (record.action) actions.unshift(normalizeAction(record.action));
    const quiz = Array.isArray(record.quiz) ? record.quiz.map(normalizeQuiz).filter(Boolean) : [];
    const title = String(record.title || 'Tri thức chưa đặt tên').slice(0, 180);
    return {
      id: record.id || createId(source === 'public' ? 'pub' : 'note'),
      source,
      type: record.type || 'lesson',
      category: CATEGORY[record.category] ? record.category : (record.category === 'link' ? 'video' : 'lesson'),
      level: record.level || record.priority || 'beginner',
      track: String(record.track || trackFromTags(tags) || 'Kho riêng').slice(0, 80),
      title,
      summary: String(record.summary || summarizeText(record.content || title, 180)),
      coreIdea: String(record.coreIdea || record.idea || record.distill?.coreIdea || firstSentence(record.content || title)),
      whyItMatters: String(record.whyItMatters || record.distill?.lesson || 'Bài này đáng lưu vì có thể biến thành quyết định, thói quen hoặc hành động cụ thể.'),
      mentalModel: String(record.mentalModel || record.framework || record.distill?.mentalModel || 'Capture → Distill → Practice → Apply'),
      example: String(record.example || record.distill?.example || 'Chọn một ý nhỏ trong bài và áp dụng vào công việc/học tập hôm nay.'),
      action: String(record.action || ''),
      content: String(record.content || record.body || record.summary || ''),
      sourceUrl: String(record.sourceUrl || record.sourceLink || record.source || ''),
      tags: unique(tags.map(slugify).filter(Boolean)).slice(0, 20),
      favorite: Boolean(record.favorite),
      archived: Boolean(record.archived),
      reads: Number(record.reads || 0),
      openedAt: record.openedAt || '',
      reviewLevel: Number(record.reviewLevel || 0),
      nextReview: record.nextReview || now,
      flashcards,
      quiz,
      actions: uniqueActions(actions).slice(0, 16),
      publicDataVersion: record.publicDataVersion || '',
      createdAt: record.createdAt || now,
      updatedAt: record.updatedAt || record.createdAt || now
    };
  }

  function normalizeCard(card) {
    return {
      id: card.id || createId('card'),
      q: String(card.q || card.question || 'Câu hỏi ôn tập').slice(0, 300),
      a: String(card.a || card.answer || 'Câu trả lời').slice(0, 1000),
      level: clamp(Number(card.level || 0), 0, 7),
      dueAt: card.dueAt || card.nextReview || new Date().toISOString(),
      lastReviewed: card.lastReviewed || '',
      lapses: Number(card.lapses || 0)
    };
  }

  function normalizeAction(action) {
    if (typeof action === 'string') return { id: createId('act'), text: action, done: false, createdAt: new Date().toISOString(), doneAt: '' };
    return {
      id: action.id || createId('act'),
      text: String(action.text || action.title || action.action || 'Hành động áp dụng').slice(0, 360),
      done: Boolean(action.done),
      createdAt: action.createdAt || new Date().toISOString(),
      doneAt: action.doneAt || ''
    };
  }

  function normalizeQuiz(item) {
    if (!item || !item.q) return null;
    const choices = Array.isArray(item.choices) && item.choices.length >= 2 ? item.choices.map(String) : [];
    return { id: item.id || createId('quiz'), q: String(item.q), choices, answer: String(item.answer || choices[0] || '') };
  }

  function renderAll() {
    renderNetwork();
    renderSlogan();
    renderMetrics();
    renderTabs();
    renderToday();
    renderFilters();
    renderLibrary();
    renderReader();
    renderReview();
    renderQuiz();
    renderActions();
    renderMap();
    renderSync();
  }

  function renderTabs() {
    $$('.nav-tab').forEach((button) => button.classList.toggle('active', button.dataset.view === state.view));
    $$('.view').forEach((view) => view.classList.toggle('active-view', view.dataset.panel === state.view));
  }

  function renderNetwork() {
    const online = navigator.onLine;
    els.networkPill.classList.toggle('online', online);
    els.networkText.textContent = online ? 'Online' : 'Offline';
  }

  function renderSlogan() {
    const latest = [...state.records].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))[0];
    const due = dueCards().length;
    const openActions = allActions().filter((item) => !item.action.done).length;
    let slogan = 'Ghi ít nhưng đúng, nhớ lâu và dùng được.';
    let context = 'Chưa có note gần nhất. Hãy bắt đầu bằng một kiến thức nhỏ đáng dùng lại.';
    if (latest) {
      const text = `${latest.title} ${latest.summary} ${latest.tags.join(' ')}`.toLowerCase();
      if (/tài|finance|tiền|dòng|btc|đầu tư|vốn/.test(text)) slogan = 'Dòng tiền rõ, tâm trí vững.';
      else if (/ai|prompt|chatgpt|agent|automation/.test(text)) slogan = 'Prompt hay phải đi cùng việc thật.';
      else if (/kỷ luật|habit|thói quen|trì hoãn|discipline/.test(text)) slogan = 'Kỷ luật là cây cầu giữa ý tưởng và kết quả.';
      else if (/pwa|app|sản phẩm|mvp|deploy|github|vercel/.test(text)) slogan = 'App nhỏ nhưng chạy thật, hơn ý tưởng lớn nằm im.';
      else if (/đọc|sách|học|ôn|flashcard|quiz/.test(text)) slogan = 'Học ít mà ôn đều, trí nhớ tự lớn.';
      else if (/quan hệ|gia đình|bạn bè|khách hàng/.test(text)) slogan = 'Nhớ người là giữ vốn tình nghĩa.';
      else slogan = 'Biết mà ôn được, làm được, mới là tri thức sống.';
      context = `Theo note gần nhất: ${latest.title}`;
    }
    if (due > 0) {
      slogan = 'Tri thức không ôn sẽ ngủ quên.';
      context = `Có ${due} thẻ đến hạn ôn. Ưu tiên ôn trước khi ghi thêm.`;
    } else if (openActions > 0 && latest) {
      context += ` · Còn ${openActions} hành động mở.`;
    }
    els.contextSlogan.textContent = slogan;
    els.sloganContext.textContent = context;
    els.stateSlogan.textContent = slogan;
  }

  function renderMetrics() {
    const publicCount = state.records.filter((item) => item.source === 'public').length;
    const localCount = state.records.filter((item) => item.source === 'local').length;
    const actions = allActions().filter((item) => !item.action.done).length;
    const tags = allTags().length;
    els.metricPublic.textContent = publicCount;
    els.metricLocal.textContent = localCount;
    els.metricDue.textContent = dueCards().length;
    els.metricActions.textContent = actions;
    els.metricStreak.textContent = calculateStreak();
    els.metricTags.textContent = tags;
  }

  function renderToday() {
    const due = dueCards();
    const pick = getRecord(state.dailyPickId) || suggestRecord();
    const localCount = state.records.filter((item) => item.source === 'local').length;
    const publicCount = state.records.filter((item) => item.source === 'public').length;
    const syncStatus = state.publicMeta.status || 'LOCAL_ONLY';
    els.todayLabel.textContent = due.length ? 'REVIEW_NEEDED' : (publicCount ? 'READY' : 'LOCAL_ONLY');
    els.todayLabel.className = `mini-badge ${syncStatus === 'SYNCED' ? 'synced' : 'warning'}`;
    els.stateBadge.textContent = syncStatus;
    els.stateBadge.className = `state-badge ${syncStatus === 'SYNCED' ? 'synced' : syncStatus === 'SYNC_ERROR' ? 'error' : 'warning'}`;
    els.mainFocus.textContent = due.length ? `Ôn ${Math.min(5, due.length)} flashcard đến hạn.` : (pick ? `Đọc lại: ${pick.title}` : 'Ghi 1 kiến thức mới vào kho riêng.');
    els.dueFocus.textContent = `${due.length} thẻ`;
    els.syncFocus.textContent = publicCount ? `${publicCount} bài public` : 'Chưa có dữ liệu';
    renderDailyPick();

    const feed = [];
    if (pick) feed.push(renderFeedCard('🎲 Note không lặp hôm nay', pick.title, pick.summary, [{ label: 'Mở bài', action: `data-open="${escapeAttr(pick.id)}"` }]));
    feed.push(renderFeedCard('🌐 Kho chung', state.publicMeta.message || 'Chưa đồng bộ.', `Phiên bản: ${state.publicMeta.version || 'chưa có'} · Cập nhật: ${formatDateTime(state.publicMeta.syncedAt) || 'chưa có'}`, [{ label: 'Đồng bộ', action: 'data-sync="1"' }]));
    if (!localCount) feed.push(renderFeedCard('✍️ Kho riêng trống', 'Hãy ghi kiến thức đầu tiên của Lão.', 'Kho riêng không bị ghi đè bởi kho public. Có thể export JSON để backup.', [{ label: 'Ghi ngay', action: 'data-view="capture"' }]));
    if (due.length) feed.push(renderFeedCard('🧠 Đến hạn ôn', `${due.length} thẻ cần ôn`, 'Ôn 3–5 thẻ là đủ để giữ nhịp học.', [{ label: 'Ôn ngay', action: 'data-view="review"' }]));
    els.todayFeed.innerHTML = feed.join('');
    els.todayFeed.querySelectorAll('[data-open]').forEach((button) => button.addEventListener('click', () => openRecord(button.dataset.open)));
    els.todayFeed.querySelectorAll('[data-view]').forEach((button) => button.addEventListener('click', () => setView(button.dataset.view)));
    els.todayFeed.querySelectorAll('[data-sync]').forEach((button) => button.addEventListener('click', () => syncPublicLibrary({ silent: false })));
  }

  function renderFeedCard(icon, title, summary, actions) {
    const buttons = actions.map((item) => `<button class="button small secondary" ${item.action}>${escapeHtml(item.label)}</button>`).join('');
    return `<article class="feed-card"><p class="eyebrow">${icon}</p><h3>${escapeHtml(title)}</h3><p>${escapeHtml(summary || '')}</p><div class="card-actions">${buttons}</div></article>`;
  }

  function renderDailyPick() {
    const pick = getRecord(state.dailyPickId);
    if (!pick) {
      els.dailyPickTitle.textContent = state.records.length ? 'Hôm nay đã gợi ý hết các note chưa lặp.' : 'Chưa có note để gợi ý.';
      els.dailyPickSummary.textContent = state.records.length ? 'Ngày mai app sẽ tạo vòng gợi ý mới. Hôm nay có thể dùng tìm kiếm hoặc thư viện.' : 'Đồng bộ kho chung hoặc ghi note riêng để bắt đầu.';
      return;
    }
    els.dailyPickTitle.textContent = pick.title;
    els.dailyPickSummary.textContent = `${pick.source === 'public' ? 'Kho chung' : 'Kho riêng'} · ${pick.track} · ${pick.summary}`;
  }

  function renderFilters() {
    els.searchInput.value = state.search;
    els.sourceFilter.value = state.source;
    els.statusFilter.value = state.status;
    els.sortSelect.value = state.sort;
    const tracks = unique(state.records.map((item) => item.track).filter(Boolean)).sort((a, b) => a.localeCompare(b, 'vi'));
    const current = els.trackFilter.value;
    els.trackFilter.innerHTML = '<option value="all">Tất cả</option>' + tracks.map((track) => `<option value="${escapeAttr(track)}">${escapeHtml(track)}</option>`).join('');
    els.trackFilter.value = tracks.includes(state.track) ? state.track : (current && tracks.includes(current) ? current : 'all');
    state.track = els.trackFilter.value;
    renderTagBar();
  }

  function filteredRecords() {
    const query = normalizeText(state.search);
    const now = Date.now();
    return state.records.filter((item) => {
      if (state.source !== 'all' && item.source !== state.source) return false;
      if (state.track !== 'all' && item.track !== state.track) return false;
      if (state.activeTag && !item.tags.includes(state.activeTag)) return false;
      if (state.status === 'active' && item.archived) return false;
      if (state.status === 'archived' && !item.archived) return false;
      if (state.status === 'favorite' && !item.favorite) return false;
      if (state.status === 'due' && new Date(item.nextReview).getTime() > now && !item.flashcards.some((card) => new Date(card.dueAt).getTime() <= now)) return false;
      if (!query) return true;
      const haystack = normalizeText([item.title, item.summary, item.coreIdea, item.content, item.track, item.tags.join(' '), item.actions.map((a) => a.text).join(' ')].join(' '));
      return haystack.includes(query);
    }).sort(sortRecords);
  }

  function sortRecords(a, b) {
    const sort = state.sort || 'updated_desc';
    if (sort === 'created_desc') return b.createdAt.localeCompare(a.createdAt);
    if (sort === 'review_due') return new Date(a.nextReview) - new Date(b.nextReview);
    if (sort === 'title_asc') return a.title.localeCompare(b.title, 'vi');
    if (sort === 'track_asc') return a.track.localeCompare(b.track, 'vi') || a.title.localeCompare(b.title, 'vi');
    return b.updatedAt.localeCompare(a.updatedAt);
  }

  function renderTagBar() {
    const tags = allTags().slice(0, 28);
    const chips = [`<button class="tag-chip ${!state.activeTag ? 'active' : ''}" type="button" data-tag="">Tất cả tag</button>`]
      .concat(tags.map((tag) => `<button class="tag-chip ${state.activeTag === tag ? 'active' : ''}" type="button" data-tag="${escapeAttr(tag)}">#${escapeHtml(tag)}</button>`));
    els.tagBar.innerHTML = chips.join('');
  }

  function renderLibrary() {
    const items = filteredRecords();
    els.resultCount.textContent = `${items.length} mục`;
    if (!items.length) {
      els.libraryList.innerHTML = `<div class="empty-state">Chưa có kết quả. Hãy đồng bộ kho chung, ghi note mới hoặc đổi bộ lọc.</div>`;
      return;
    }
    els.libraryList.innerHTML = items.map((item) => `
      <article class="note-card" data-id="${escapeAttr(item.id)}">
        <div class="card-meta">
          <span class="source-chip ${item.source}">${item.source === 'public' ? '🌐 Kho chung' : '✍️ Kho riêng'}</span>
          <span class="pill">${escapeHtml(item.track)}</span>
        </div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.summary)}</p>
        <div class="tag-bar">${item.tags.slice(0, 5).map((tag) => `<span class="tag-chip">#${escapeHtml(tag)}</span>`).join('')}</div>
        <div class="card-actions">
          <button class="button secondary" data-action="open">Mở</button>
          <button class="button ghost" data-action="favorite">${item.favorite ? '★ Bỏ ghim' : '☆ Ghim'}</button>
          ${item.source === 'local' ? '<button class="button ghost" data-action="edit">Sửa</button>' : '<button class="button ghost" data-action="copy-local">Lưu riêng</button>'}
          <button class="button ghost" data-action="copy">Copy</button>
        </div>
      </article>`).join('');
  }

  function renderReader() {
    const record = getRecord(state.selectedId) || getRecord(state.dailyPickId) || suggestRecord();
    if (!record) {
      els.readerContent.innerHTML = `<div class="empty-state"><h3>Chưa chọn bài học</h3><p>Vào Thư viện hoặc Đồng bộ kho chung để mở một bài.</p></div>`;
      return;
    }
    const flash = record.flashcards.slice(0, 6).map((card) => `<div class="flash-card"><strong>Q: ${escapeHtml(card.q)}</strong><p>A: ${escapeHtml(card.a)}</p></div>`).join('');
    const quiz = record.quiz.slice(0, 3).map((q) => `<li>${escapeHtml(q.q)}</li>`).join('');
    els.readerContent.innerHTML = `
      <article class="reader-hero">
        <div class="card-meta">
          <span class="source-chip ${record.source}">${record.source === 'public' ? '🌐 Kho chung' : '✍️ Kho riêng'}</span>
          <span class="pill">${escapeHtml(record.track)}</span>
          <span class="pill">${escapeHtml(record.level)}</span>
        </div>
        <h2>${escapeHtml(record.title)}</h2>
        <p>${escapeHtml(record.summary)}</p>
        <div class="form-actions">
          <button class="button primary" data-reader="read-done">Đã đọc</button>
          <button class="button secondary" data-reader="review">Ôn thẻ</button>
          ${record.source === 'public' ? '<button class="button ghost" data-reader="copy-local">Lưu vào kho riêng</button>' : '<button class="button ghost" data-reader="edit">Sửa note</button>'}
        </div>
      </article>
      <div class="reader-grid">
        <div class="reader-block">
          <h3>Ý chính</h3>
          <p>${escapeHtml(record.coreIdea)}</p>
          <h3>Vì sao quan trọng</h3>
          <p>${escapeHtml(record.whyItMatters)}</p>
          <h3>Mô hình tư duy</h3>
          <p>${escapeHtml(record.mentalModel)}</p>
          <h3>Ví dụ</h3>
          <p>${escapeHtml(record.example)}</p>
          ${record.content ? `<h3>Nội dung gốc</h3><p>${escapeHtml(record.content)}</p>` : ''}
        </div>
        <aside class="reader-block">
          <h3>Hành động áp dụng</h3>
          <ul>${record.actions.length ? record.actions.slice(0, 6).map((a) => `<li>${escapeHtml(a.text)}</li>`).join('') : `<li>${escapeHtml(record.action || 'Chọn một ý nhỏ và áp dụng hôm nay.')}</li>`}</ul>
          <h3>Flashcard</h3>
          <div class="flash-list">${flash || '<p class="muted">Chưa có flashcard.</p>'}</div>
          <h3>Quiz gợi ý</h3>
          <ul>${quiz || '<li>Chưa có quiz.</li>'}</ul>
        </aside>
      </div>`;
  }

  function renderReview() {
    const due = dueCards();
    els.reviewCount.textContent = `${due.length} thẻ đến hạn`;
    if (!due.length) {
      els.reviewDeck.innerHTML = `<div class="empty-state"><h3>Chưa có thẻ đến hạn</h3><p>Đọc một bài trong kho chung hoặc ghi note riêng để tạo thẻ mới.</p></div>`;
      return;
    }
    els.reviewDeck.innerHTML = due.slice(0, 20).map((item) => `
      <article class="review-card" data-record="${escapeAttr(item.record.id)}" data-card="${escapeAttr(item.card.id)}">
        <p class="eyebrow">${escapeHtml(item.record.title)}</p>
        <strong>${escapeHtml(item.card.q)}</strong>
        <p>${escapeHtml(item.card.a)}</p>
        <div class="card-actions">
          <button class="button ghost danger" data-review="again">Quên</button>
          <button class="button secondary" data-review="good">Nhớ</button>
          <button class="button primary" data-review="easy">Rất chắc</button>
        </div>
      </article>`).join('');
  }

  function renderQuiz() {
    if (!state.quiz) {
      els.quizBox.innerHTML = `<h3>Quiz nhanh</h3><p>App sẽ tạo câu hỏi từ flashcard trong kho chung và kho riêng.</p><button class="button primary" id="inlineQuizStart" type="button">Tạo quiz mới</button>`;
      const start = $('#inlineQuizStart');
      if (start) start.addEventListener('click', buildQuiz);
      return;
    }
    els.quizBox.innerHTML = `
      <p class="eyebrow">${escapeHtml(state.quiz.recordTitle)}</p>
      <h3>${escapeHtml(state.quiz.q)}</h3>
      ${state.quiz.choices.map((choice) => `<button class="button quiz-option" type="button" data-choice="${escapeAttr(choice)}">${escapeHtml(choice)}</button>`).join('')}
      <p id="quizResult" class="muted"></p>`;
  }

  function renderActions() {
    const items = allActions();
    els.actionCount.textContent = `${items.filter((item) => !item.action.done).length} việc mở`;
    if (!items.length) {
      els.actionBoard.innerHTML = `<div class="empty-state"><h3>Chưa có hành động</h3><p>Mỗi bài học tốt cần sinh ra ít nhất một việc làm cụ thể.</p></div>`;
      return;
    }
    els.actionBoard.innerHTML = items.map((item) => `
      <label class="action-item ${item.action.done ? 'done' : ''}" data-record="${escapeAttr(item.record.id)}" data-action-id="${escapeAttr(item.action.id)}">
        <input type="checkbox" ${item.action.done ? 'checked' : ''}>
        <span><strong>${escapeHtml(item.action.text)}</strong><br><small class="muted">${escapeHtml(item.record.title)} · ${escapeHtml(item.record.track)}</small></span>
        <button class="button ghost small" type="button" data-open-action="${escapeAttr(item.record.id)}">Mở</button>
      </label>`).join('');
  }

  function renderMap() {
    const tags = allTagsWithCounts();
    els.mapCount.textContent = `${tags.length} tag`;
    if (!tags.length) {
      els.knowledgeMap.innerHTML = `<div class="empty-state"><h3>Chưa có bản đồ</h3><p>Tag sẽ tự xuất hiện khi kho chung được đồng bộ hoặc Lão ghi note mới.</p></div>`;
      return;
    }
    const max = Math.max(...tags.map((item) => item.count));
    els.knowledgeMap.innerHTML = tags.slice(0, 40).map((item) => `
      <article class="map-item">
        <div class="section-head compact"><h3>#${escapeHtml(item.tag)}</h3><span class="mini-badge">${item.count} mục</span></div>
        <p class="muted">Public: ${item.publicCount} · Riêng: ${item.localCount} · Thẻ ôn: ${item.cards}</p>
        <div class="bar"><span style="width:${Math.round(item.count / max * 100)}%"></span></div>
      </article>`).join('');
  }

  function renderSync() {
    const meta = state.publicMeta;
    els.syncBadge.textContent = meta.status || 'LOCAL_ONLY';
    els.syncBadge.className = `mini-badge ${meta.status === 'SYNCED' ? 'synced' : meta.status === 'SYNC_ERROR' ? 'error' : 'warning'}`;
    els.publicSourceText.textContent = meta.source || PUBLIC_DATA_URL;
    els.publicVersionText.textContent = meta.version || 'Chưa đồng bộ';
    els.syncTimeText.textContent = meta.syncedAt ? `Sync lần cuối: ${formatDateTime(meta.syncedAt)}` : 'Chưa có lịch sử sync.';
    const log = (meta.log || []).slice(-8).reverse();
    els.syncLog.innerHTML = log.length ? log.map((item) => `<div class="log-item"><strong>${escapeHtml(formatDateTime(item.at))}</strong><p class="muted">${escapeHtml(item.text)}</p></div>`).join('') : `<div class="empty-state">Chưa có log đồng bộ.</div>`;
  }

  function handleTagClick(event) {
    const button = event.target.closest('[data-tag]');
    if (!button) return;
    state.activeTag = button.dataset.tag;
    saveSettings();
    renderLibrary();
    renderTagBar();
  }

  function handleCardAction(event) {
    const button = event.target.closest('[data-action]');
    if (!button) return;
    const card = event.target.closest('[data-id]');
    const record = getRecord(card.dataset.id);
    if (!record) return;
    const action = button.dataset.action;
    if (action === 'open') openRecord(record.id);
    if (action === 'favorite') toggleFavorite(record);
    if (action === 'edit') editRecord(record);
    if (action === 'copy') copyRecord(record);
    if (action === 'copy-local') copyToLocal(record);
  }

  function handleReaderAction(event) {
    const button = event.target.closest('[data-reader]');
    if (!button) return;
    const record = getRecord(state.selectedId) || getRecord(state.dailyPickId) || suggestRecord();
    if (!record) return;
    const action = button.dataset.reader;
    if (action === 'read-done') markRead(record);
    if (action === 'review') setView('review');
    if (action === 'copy-local') copyToLocal(record);
    if (action === 'edit') editRecord(record);
  }

  function handleReviewAction(event) {
    const button = event.target.closest('[data-review]');
    if (!button) return;
    const box = event.target.closest('[data-record]');
    const record = getRecord(box.dataset.record);
    if (!record) return;
    const card = record.flashcards.find((item) => item.id === box.dataset.card);
    if (!card) return;
    const mode = button.dataset.review;
    if (mode === 'again') {
      card.level = 0;
      card.lapses += 1;
    } else if (mode === 'good') {
      card.level = clamp(card.level + 1, 1, 7);
    } else {
      card.level = clamp(card.level + 2, 2, 7);
    }
    card.lastReviewed = new Date().toISOString();
    card.dueAt = addDays(new Date(), REVIEW_INTERVALS[card.level]).toISOString();
    record.nextReview = nextRecordReview(record);
    record.updatedAt = new Date().toISOString();
    markActivity();
    putRecord(record).then(reloadAndRender);
    toast('Đã cập nhật lịch ôn.');
  }

  function handleQuizAction(event) {
    const button = event.target.closest('[data-choice]');
    if (!button || !state.quiz) return;
    const correct = button.dataset.choice === state.quiz.answer;
    $$('.quiz-option').forEach((option) => option.disabled = true);
    button.classList.add(correct ? 'correct' : 'wrong');
    const result = $('#quizResult');
    result.textContent = correct ? 'Đúng. Giữ nhịp này.' : `Chưa đúng. Đáp án: ${state.quiz.answer}`;
    markActivity();
  }

  function handleActionChange(event) {
    const input = event.target.closest('input[type="checkbox"]');
    if (!input) return;
    const item = event.target.closest('[data-record]');
    const record = getRecord(item.dataset.record);
    if (!record) return;
    const action = record.actions.find((a) => a.id === item.dataset.actionId);
    if (!action) return;
    action.done = input.checked;
    action.doneAt = input.checked ? new Date().toISOString() : '';
    record.updatedAt = new Date().toISOString();
    if (input.checked) markActivity();
    putRecord(record).then(reloadAndRender);
  }

  function handleActionClick(event) {
    const button = event.target.closest('[data-open-action]');
    if (button) openRecord(button.dataset.openAction);
  }

  async function handleSave(event, shouldDistill) {
    event.preventDefault();
    const form = readForm();
    if (!form.title) return toast('Cần nhập tiêu đề.');
    if (!form.content && !form.action && !form.sourceUrl) return toast('Cần nhập nội dung, nguồn hoặc hành động.');
    const now = new Date().toISOString();
    let record = form.id ? getRecord(form.id) : null;
    if (!record) record = { id: createId('note'), source: 'local', createdAt: now };
    Object.assign(record, {
      source: 'local',
      title: form.title,
      track: form.track || 'Kho riêng',
      content: form.content,
      summary: summarizeText(form.content || form.title, 220),
      category: form.category,
      level: form.level,
      target: form.target,
      tags: parseTags(form.tags),
      sourceUrl: form.sourceUrl,
      action: form.action,
      updatedAt: now
    });
    if (shouldDistill) record = applyDistill(record);
    await putRecord(record);
    localStorage.removeItem(DRAFT_KEY);
    markActivity();
    await reloadRecords();
    state.selectedId = record.id;
    clearForm({ keepDraft: false });
    setView('reader');
    toast(shouldDistill ? 'Đã lưu và chưng cất thành bài học.' : 'Đã lưu vào kho riêng.');
  }

  function readForm() {
    return {
      id: els.noteId.value,
      title: els.noteTitle.value.trim(),
      track: els.noteTrack.value.trim(),
      content: els.noteContent.value.trim(),
      category: els.noteCategory.value,
      level: els.noteLevel.value,
      target: els.noteTarget.value,
      tags: els.noteTags.value.trim(),
      sourceUrl: els.noteSource.value.trim(),
      action: els.noteAction.value.trim()
    };
  }

  function applyDistill(record) {
    const text = `${record.title}. ${record.content}`.trim();
    const sentences = splitSentences(text);
    const words = extractWords(text);
    const concepts = topConcepts(words).slice(0, 8);
    const keySentences = sentences.slice(0, 3);
    const coreIdea = keySentences[0] || record.title;
    const why = keySentences[1] || `Ý này đáng lưu vì có thể cải thiện cách Lão học, làm hoặc ra quyết định.`;
    const example = keySentences[2] || `Ví dụ: chọn một điểm trong bài và áp dụng vào dự án/việc học trong 15 phút.`;
    const actions = [record.action, `Viết lại bài "${record.title}" bằng 5 gạch đầu dòng.`, `Áp dụng 1 ý trong bài vào một việc thật hôm nay.`].filter(Boolean);
    const flashcards = [
      { q: `Ý chính của "${record.title}" là gì?`, a: coreIdea },
      { q: `Vì sao bài "${record.title}" đáng học?`, a: why },
      { q: `Hành động nhỏ sau bài này là gì?`, a: actions[0] || 'Chọn một việc 15 phút để áp dụng.' }
    ];
    concepts.slice(0, 3).forEach((concept) => flashcards.push({ q: `Khái niệm "${concept}" trong bài gợi nhắc điều gì?`, a: `Hãy giải thích ${concept} bằng ngôn ngữ của Lão và nêu một ví dụ.` }));
    record.summary = summarizeText(keySentences.join(' ') || text, 240);
    record.coreIdea = coreIdea;
    record.whyItMatters = why;
    record.mentalModel = inferMentalModel(record, concepts);
    record.example = example;
    record.actions = uniqueActions([...(record.actions || []), ...actions.map(normalizeAction)]);
    record.flashcards = mergeCards(record.flashcards || [], flashcards.map(normalizeCard)).slice(0, 24);
    record.quiz = buildQuizFromRecord(record).slice(0, 5);
    record.nextReview = new Date().toISOString();
    record.tags = unique([...(record.tags || []), ...concepts.slice(0, 6).map(slugify)]).slice(0, 20);
    return normalizeRecord(record);
  }

  function inferMentalModel(record, concepts) {
    const text = `${record.title} ${record.content} ${concepts.join(' ')}`.toLowerCase();
    if (/thói quen|habit|kỷ luật/.test(text)) return 'Cue → Routine → Reward: đổi môi trường để đổi hành vi.';
    if (/tài|tiền|đầu tư|dòng tiền/.test(text)) return 'Cashflow → Reserve → Invest: giữ sống trước, tăng trưởng sau.';
    if (/ai|prompt|agent/.test(text)) return 'Input rõ → Ràng buộc rõ → Output dùng được.';
    if (/app|pwa|mvp|sản phẩm/.test(text)) return 'MVP → Test thật → Sửa ít → Deploy nhanh.';
    return 'Capture → Distill → Practice → Apply.';
  }

  function mergeCards(oldCards, newCards) {
    const seen = new Set((oldCards || []).map((card) => normalizeText(card.q)));
    const merged = [...(oldCards || [])];
    newCards.forEach((card) => {
      const key = normalizeText(card.q);
      if (!seen.has(key)) merged.push(card);
    });
    return merged;
  }

  function buildQuizFromRecord(record) {
    const cards = record.flashcards || [];
    return cards.slice(0, 4).map((card) => ({
      id: createId('quiz'),
      q: card.q,
      choices: shuffle([card.a, record.coreIdea, record.mentalModel, 'Chưa đủ dữ liệu để kết luận.'].filter(Boolean)).slice(0, 4),
      answer: card.a
    }));
  }

  function editRecord(record) {
    if (record.source !== 'local') return toast('Kho chung chỉ đọc. Hãy lưu riêng rồi sửa.');
    els.noteId.value = record.id;
    els.noteTitle.value = record.title;
    els.noteTrack.value = record.track;
    els.noteContent.value = record.content;
    els.noteCategory.value = record.category;
    els.noteLevel.value = record.level;
    els.noteTarget.value = record.target || 'apply';
    els.noteTags.value = record.tags.join(', ');
    els.noteSource.value = record.sourceUrl || '';
    els.noteAction.value = record.action || '';
    els.cancelEdit.classList.remove('hidden');
    setView('capture');
    toast('Đang sửa note riêng.');
  }

  function cancelEdit() {
    clearForm({ keepDraft: false });
    toast('Đã hủy sửa.');
  }

  function clearForm({ keepDraft }) {
    els.noteForm.reset();
    els.noteId.value = '';
    els.noteCategory.value = 'lesson';
    els.noteLevel.value = 'beginner';
    els.noteTarget.value = 'apply';
    els.cancelEdit.classList.add('hidden');
    els.draftStatus.textContent = 'Draft an toàn';
    if (!keepDraft) localStorage.removeItem(DRAFT_KEY);
  }

  function saveDraft() {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ ...readForm(), savedAt: new Date().toISOString() }));
    els.draftStatus.textContent = 'Đã giữ nháp';
  }

  function restoreDraft() {
    try {
      const draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
      if (!draft) return;
      els.noteId.value = draft.id || '';
      els.noteTitle.value = draft.title || '';
      els.noteTrack.value = draft.track || '';
      els.noteContent.value = draft.content || '';
      els.noteCategory.value = draft.category || 'lesson';
      els.noteLevel.value = draft.level || 'beginner';
      els.noteTarget.value = draft.target || 'apply';
      els.noteTags.value = draft.tags || '';
      els.noteSource.value = draft.sourceUrl || '';
      els.noteAction.value = draft.action || '';
      if (draft.title || draft.content) els.draftStatus.textContent = 'Đã khôi phục nháp';
    } catch (error) {
      console.warn(error);
    }
  }

  function fillLearningTemplate() {
    els.noteTitle.value = 'Bài học cần biến thành hành động';
    els.noteTrack.value = 'Tự học thông minh';
    els.noteCategory.value = 'lesson';
    els.noteContent.value = '1. Ý chính là...\n2. Vì sao quan trọng...\n3. Ví dụ thực tế...\n4. Điều cần tránh...\n5. Hành động 15 phút hôm nay...';
    els.noteTags.value = 'tu-hoc, on-tap, hanh-dong';
    els.noteAction.value = 'Viết lại bài này bằng 5 gạch đầu dòng và áp dụng 1 ý ngay hôm nay.';
    saveDraft();
    toast('Đã nạp mẫu học nhanh.');
  }

  async function toggleFavorite(record) {
    record.favorite = !record.favorite;
    record.updatedAt = new Date().toISOString();
    await putRecord(record);
    await reloadAndRender();
    toast(record.favorite ? 'Đã ghim.' : 'Đã bỏ ghim.');
  }

  async function copyToLocal(record) {
    const copy = normalizeRecord({
      ...record,
      id: createId('note'),
      source: 'local',
      title: `${record.title} · bản riêng`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    await putRecord(copy);
    state.selectedId = copy.id;
    await reloadAndRender();
    setView('reader');
    toast('Đã lưu bài public vào kho riêng.');
  }

  async function copyRecord(record) {
    const text = `${record.title}\n\n${record.summary}\n\nÝ chính: ${record.coreIdea}\n\nHành động: ${(record.actions[0] && record.actions[0].text) || record.action || ''}`;
    await navigator.clipboard.writeText(text);
    toast('Đã copy nội dung chính.');
  }

  async function markRead(record) {
    record.reads += 1;
    record.openedAt = new Date().toISOString();
    record.reviewLevel = clamp(record.reviewLevel + 1, 0, 7);
    record.nextReview = addDays(new Date(), REVIEW_INTERVALS[record.reviewLevel]).toISOString();
    record.updatedAt = new Date().toISOString();
    markActivity();
    await putRecord(record);
    await reloadAndRender();
    toast('Đã ghi nhận bài đã đọc.');
  }

  function openRecord(id) {
    const record = getRecord(id);
    if (!record) return toast('Không tìm thấy bài học.');
    state.selectedId = id;
    saveSettings();
    setView('reader');
  }

  function openSuggestedLearning() {
    const due = dueCards();
    if (due.length) return setView('review');
    const pick = getRecord(state.dailyPickId) || suggestRecord();
    if (pick) openRecord(pick.id);
    else setView('capture');
  }

  function pickDailyNote({ allowToast }) {
    const date = todayKey();
    const history = loadDailyHistory();
    if (!history[date]) history[date] = [];
    const candidates = state.records.filter((item) => !item.archived && !history[date].includes(item.id));
    if (!candidates.length) {
      state.dailyPickId = '';
      saveDailyHistory(history);
      if (allowToast) toast('Hôm nay đã gợi ý hết note chưa lặp.');
      renderAll();
      return;
    }
    const pick = weightedPick(candidates);
    state.dailyPickId = pick.id;
    history[date].push(pick.id);
    saveDailyHistory(history);
    if (allowToast) toast('Đã chọn gợi ý mới, không lặp trong ngày.');
    renderDailyPick();
    renderToday();
  }

  function loadDailyHistory() {
    try {
      const raw = JSON.parse(localStorage.getItem(DAILY_PICK_KEY) || '{}');
      const clean = {};
      Object.keys(raw).slice(-14).forEach((key) => clean[key] = Array.isArray(raw[key]) ? raw[key] : []);
      return clean;
    } catch (error) {
      return {};
    }
  }

  function saveDailyHistory(history) {
    localStorage.setItem(DAILY_PICK_KEY, JSON.stringify(history));
  }

  function weightedPick(items) {
    const sorted = [...items].sort((a, b) => {
      if (a.source !== b.source) return a.source === 'public' ? -1 : 1;
      return (a.reads || 0) - (b.reads || 0) || b.updatedAt.localeCompare(a.updatedAt);
    });
    const top = sorted.slice(0, Math.min(12, sorted.length));
    return top[Math.floor(Math.random() * top.length)];
  }

  function buildQuiz() {
    const cards = shuffle(dueCards().concat(allCards())).filter((item, index, arr) => arr.findIndex((x) => x.card.id === item.card.id) === index);
    if (!cards.length) return toast('Chưa có flashcard để tạo quiz.');
    const selected = cards[0];
    const distractors = shuffle(cards.filter((item) => item.card.a !== selected.card.a).map((item) => item.card.a)).slice(0, 3);
    state.quiz = {
      recordId: selected.record.id,
      recordTitle: selected.record.title,
      q: selected.card.q,
      answer: selected.card.a,
      choices: shuffle([selected.card.a, ...distractors]).slice(0, 4)
    };
    localStorage.setItem(QUIZ_KEY, JSON.stringify(state.quiz));
    renderQuiz();
    setView('quiz');
  }

  async function exportJson() {
    const records = await getAllRecords();
    const payload = {
      schemaVersion: 3,
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      publicMeta: state.publicMeta,
      settings: state.settings,
      records
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wisdom-notebook-v1.3-backup-${todayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast('Đã xuất JSON backup.');
  }

  async function importJson(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      const records = Array.isArray(payload) ? payload : (Array.isArray(payload.records) ? payload.records : []);
      if (!records.length) throw new Error('Không có records để nhập.');
      const normalized = records.map((item) => normalizeRecord(item));
      await putRecords(normalized);
      await reloadRecords();
      markActivity();
      renderAll();
      toast(`Đã nhập/gộp ${normalized.length} mục.`);
    } catch (error) {
      toast(`Import lỗi: ${error.message}`);
    } finally {
      event.target.value = '';
    }
  }

  async function resetPrivateData() {
    const ok = confirm('Chỉ xóa KHO RIÊNG trên thiết bị này. Kho public cache vẫn giữ. Tiếp tục?');
    if (!ok) return;
    const localRecords = state.records.filter((item) => item.source === 'local');
    for (const record of localRecords) await deleteRecord(record.id);
    localStorage.removeItem(DRAFT_KEY);
    await reloadAndRender();
    toast('Đã reset kho riêng trên thiết bị này.');
  }

  async function reloadRecords() {
    state.records = await getAllRecords();
  }

  async function reloadAndRender() {
    await reloadRecords();
    renderAll();
  }

  function setView(view) {
    state.view = view;
    saveSettings();
    renderTabs();
    renderReader();
    if (window.innerWidth < 900) window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function getRecord(id) {
    return state.records.find((item) => item.id === id);
  }

  function suggestRecord() {
    return [...state.records].filter((item) => !item.archived).sort((a, b) => (a.reads || 0) - (b.reads || 0) || b.updatedAt.localeCompare(a.updatedAt))[0];
  }

  function allCards() {
    return state.records.flatMap((record) => record.flashcards.map((card) => ({ record, card })));
  }

  function dueCards() {
    const now = Date.now();
    return allCards().filter((item) => new Date(item.card.dueAt).getTime() <= now).sort((a, b) => new Date(a.card.dueAt) - new Date(b.card.dueAt));
  }

  function allActions() {
    return state.records.flatMap((record) => record.actions.map((action) => ({ record, action }))).sort((a, b) => Number(a.action.done) - Number(b.action.done) || b.record.updatedAt.localeCompare(a.record.updatedAt));
  }

  function allTags() {
    return unique(state.records.flatMap((item) => item.tags)).sort((a, b) => a.localeCompare(b, 'vi'));
  }

  function allTagsWithCounts() {
    const map = new Map();
    state.records.forEach((record) => {
      record.tags.forEach((tag) => {
        const item = map.get(tag) || { tag, count: 0, publicCount: 0, localCount: 0, cards: 0 };
        item.count += 1;
        item.cards += record.flashcards.length;
        if (record.source === 'public') item.publicCount += 1;
        else item.localCount += 1;
        map.set(tag, item);
      });
    });
    return Array.from(map.values()).sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag, 'vi'));
  }

  function calculateStreak() {
    const dates = unique((state.settings.activityDates || []).filter(Boolean)).sort();
    let streak = 0;
    let cursor = new Date();
    while (dates.includes(formatDateKey(cursor))) {
      streak += 1;
      cursor = addDays(cursor, -1);
    }
    return streak;
  }

  function markActivity() {
    const date = todayKey();
    state.settings.activityDates = unique([...(state.settings.activityDates || []), date]).slice(-365);
    saveSettings();
  }

  function addSyncLog(text) {
    const log = state.publicMeta.log || [];
    log.push({ at: new Date().toISOString(), text });
    state.publicMeta.log = log.slice(-30);
  }

  function nextRecordReview(record) {
    const dates = record.flashcards.map((card) => card.dueAt).filter(Boolean).sort();
    return dates[0] || addDays(new Date(), 1).toISOString();
  }

  function tickCalendar() {
    const now = new Date();
    els.solarDate.textContent = new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' }).format(now);
    els.clockText.textContent = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(now);
    const lunar = convertSolar2Lunar(now.getDate(), now.getMonth() + 1, now.getFullYear(), 7);
    els.lunarDate.textContent = `${pad2(lunar[0])}/${pad2(lunar[1])}${lunar[3] ? ' nhuận' : ''}`;
    els.lunarYearText.textContent = `${canChiYear(lunar[2])} · năm âm ${lunar[2]}`;
  }

  function convertSolar2Lunar(dd, mm, yy, timeZone) {
    const dayNumber = jdFromDate(dd, mm, yy);
    const k = Math.floor((dayNumber - 2415021.076998695) / 29.530588853);
    let monthStart = getNewMoonDay(k + 1, timeZone);
    if (monthStart > dayNumber) monthStart = getNewMoonDay(k, timeZone);
    let a11 = getLunarMonth11(yy, timeZone);
    let b11 = a11;
    let lunarYear;
    if (a11 >= monthStart) {
      lunarYear = yy;
      a11 = getLunarMonth11(yy - 1, timeZone);
    } else {
      lunarYear = yy + 1;
      b11 = getLunarMonth11(yy + 1, timeZone);
    }
    const lunarDay = dayNumber - monthStart + 1;
    const diff = Math.floor((monthStart - a11) / 29);
    let lunarLeap = 0;
    let lunarMonth = diff + 11;
    if (b11 - a11 > 365) {
      const leapMonthDiff = getLeapMonthOffset(a11, timeZone);
      if (diff >= leapMonthDiff) {
        lunarMonth = diff + 10;
        if (diff === leapMonthDiff) lunarLeap = 1;
      }
    }
    if (lunarMonth > 12) lunarMonth -= 12;
    if (lunarMonth >= 11 && diff < 4) lunarYear -= 1;
    return [lunarDay, lunarMonth, lunarYear, lunarLeap];
  }

  function jdFromDate(dd, mm, yy) {
    const a = Math.floor((14 - mm) / 12);
    const y = yy + 4800 - a;
    const m = mm + 12 * a - 3;
    let jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - Math.floor(y / 100) + Math.floor(y / 400) - 32045;
    if (jd < 2299161) jd = dd + Math.floor((153 * m + 2) / 5) + 365 * y + Math.floor(y / 4) - 32083;
    return jd;
  }

  function getNewMoonDay(k, timeZone) {
    const t = k / 1236.85;
    const t2 = t * t;
    const t3 = t2 * t;
    const dr = Math.PI / 180;
    let jd1 = 2415020.75933 + 29.53058868 * k + 0.0001178 * t2 - 0.000000155 * t3;
    jd1 += 0.00033 * Math.sin((166.56 + 132.87 * t - 0.009173 * t2) * dr);
    const m = 359.2242 + 29.10535608 * k - 0.0000333 * t2 - 0.00000347 * t3;
    const mpr = 306.0253 + 385.81691806 * k + 0.0107306 * t2 + 0.00001236 * t3;
    const f = 21.2964 + 390.67050646 * k - 0.0016528 * t2 - 0.00000239 * t3;
    let c1 = (0.1734 - 0.000393 * t) * Math.sin(m * dr) + 0.0021 * Math.sin(2 * dr * m);
    c1 -= 0.4068 * Math.sin(mpr * dr) + 0.0161 * Math.sin(2 * dr * mpr);
    c1 -= 0.0004 * Math.sin(3 * dr * mpr);
    c1 += 0.0104 * Math.sin(2 * dr * f) - 0.0051 * Math.sin((m + mpr) * dr);
    c1 -= 0.0074 * Math.sin((m - mpr) * dr) + 0.0004 * Math.sin((2 * f + m) * dr);
    c1 -= 0.0004 * Math.sin((2 * f - m) * dr) - 0.0006 * Math.sin((2 * f + mpr) * dr);
    c1 += 0.0010 * Math.sin((2 * f - mpr) * dr) + 0.0005 * Math.sin((2 * mpr + m) * dr);
    const deltaT = t < -11 ? 0.001 + 0.000839 * t + 0.0002261 * t2 - 0.00000845 * t3 - 0.000000081 * t * t3 : -0.000278 + 0.000265 * t + 0.000262 * t2;
    return Math.floor(jd1 + c1 - deltaT + 0.5 + timeZone / 24);
  }

  function getSunLongitude(jdn, timeZone) {
    const t = (jdn - 2451545.5 - timeZone / 24) / 36525;
    const t2 = t * t;
    const dr = Math.PI / 180;
    const m = 357.52910 + 35999.05030 * t - 0.0001559 * t2 - 0.00000048 * t * t2;
    const l0 = 280.46645 + 36000.76983 * t + 0.0003032 * t2;
    let dl = (1.914600 - 0.004817 * t - 0.000014 * t2) * Math.sin(dr * m);
    dl += (0.019993 - 0.000101 * t) * Math.sin(2 * dr * m) + 0.000290 * Math.sin(3 * dr * m);
    let l = l0 + dl;
    l *= dr;
    l -= Math.PI * 2 * Math.floor(l / (Math.PI * 2));
    return Math.floor(l / Math.PI * 6);
  }

  function getLunarMonth11(yy, timeZone) {
    const off = jdFromDate(31, 12, yy) - 2415021;
    const k = Math.floor(off / 29.530588853);
    let nm = getNewMoonDay(k, timeZone);
    const sunLong = getSunLongitude(nm, timeZone);
    if (sunLong >= 9) nm = getNewMoonDay(k - 1, timeZone);
    return nm;
  }

  function getLeapMonthOffset(a11, timeZone) {
    const k = Math.floor((a11 - 2415021.076998695) / 29.530588853 + 0.5);
    let last = 0;
    let i = 1;
    let arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    do {
      last = arc;
      i += 1;
      arc = getSunLongitude(getNewMoonDay(k + i, timeZone), timeZone);
    } while (arc !== last && i < 14);
    return i - 1;
  }

  function canChiYear(year) {
    const can = ['Giáp', 'Ất', 'Bính', 'Đinh', 'Mậu', 'Kỷ', 'Canh', 'Tân', 'Nhâm', 'Quý'];
    const chi = ['Tý', 'Sửu', 'Dần', 'Mão', 'Thìn', 'Tỵ', 'Ngọ', 'Mùi', 'Thân', 'Dậu', 'Tuất', 'Hợi'];
    return `${can[(year + 6) % 10]} ${chi[(year + 8) % 12]}`;
  }

  function toggleTheme() {
    state.settings.theme = state.settings.theme === 'light' ? 'dark' : 'light';
    applyTheme();
    saveSettings();
  }

  function applyTheme() {
    document.documentElement.dataset.theme = state.settings.theme || 'dark';
  }

  function splitSentences(text) {
    return String(text || '').replace(/\s+/g, ' ').split(/(?<=[.!?。！？])\s+|\n+/).map((s) => s.trim()).filter(Boolean).slice(0, 24);
  }

  function firstSentence(text) {
    return splitSentences(text)[0] || String(text || '').slice(0, 180);
  }

  function summarizeText(text, max = 160) {
    const sentence = splitSentences(text).slice(0, 2).join(' ') || String(text || '');
    return sentence.length > max ? `${sentence.slice(0, max - 1)}…` : sentence;
  }

  function extractWords(text) {
    return normalizeText(text).split(' ').filter((word) => word.length >= 3 && !STOP_WORDS.has(word));
  }

  function topConcepts(words) {
    const count = {};
    words.forEach((word) => { count[word] = (count[word] || 0) + 1; });
    return Object.entries(count).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'vi')).map(([word]) => word);
  }

  function trackFromTags(tags) {
    if (tags.includes('ai') || tags.includes('prompt')) return 'Prompt AI thực chiến';
    if (tags.includes('tai-chinh') || tags.includes('dau-tu')) return 'Tài chính cá nhân';
    if (tags.includes('pwa') || tags.includes('mini-app')) return 'Mini App & PWA';
    if (tags.includes('ky-luat') || tags.includes('thoi-quen')) return 'Kỷ luật cá nhân';
    return '';
  }

  function parseTags(value) {
    if (Array.isArray(value)) return value.map(slugify).filter(Boolean);
    return String(value || '').split(/[,#;\n]+/).map(slugify).filter(Boolean);
  }

  function slugify(value) {
    return normalizeText(value).replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  }

  function normalizeText(value) {
    return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, ' ').replace(/\s+/g, ' ').trim();
  }

  function unique(arr) {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  function uniqueActions(actions) {
    const seen = new Set();
    const result = [];
    actions.map(normalizeAction).forEach((action) => {
      const key = normalizeText(action.text);
      if (!key || seen.has(key)) return;
      seen.add(key);
      result.push(action);
    });
    return result;
  }

  function shuffle(items) {
    const arr = [...items];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  function createId(prefix = 'id') {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  function formatDateKey(date) {
    const d = new Date(date);
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  }

  function formatDateTime(value) {
    if (!value) return '';
    try {
      return new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
    } catch (error) {
      return '';
    }
  }

  function pad2(value) {
    return String(value).padStart(2, '0');
  }

  function escapeHtml(value) {
    return String(value || '').replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
  }

  function escapeAttr(value) {
    return escapeHtml(value).replace(/'/g, '&#39;');
  }

  function toast(message) {
    els.toast.textContent = message;
    els.toast.classList.add('show');
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => els.toast.classList.remove('show'), 2600);
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('service-worker.js').catch((error) => console.warn('Service worker lỗi:', error));
    }
  }
})();
