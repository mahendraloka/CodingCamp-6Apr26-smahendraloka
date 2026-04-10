/**
 * To-Do Life Dashboard — app.js
 * Entry point. Uses the Module Pattern.
 * Initialization order: ThemeManager first (prevents FOUC), then all others.
 */

/* ============================================================
   StorageService
   ============================================================ */
const StorageService = (() => {
  const KEYS = {
    TASKS: 'tld_tasks',
    LINKS: 'tld_links',
    THEME: 'tld_theme',
    USERNAME: 'tld_username',
    POMODORO_DURATION: 'tld_pomodoro_duration',
  };

  function isAvailable() {
    try {
      const test = '__tld_test__';
      localStorage.setItem(test, '1');
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  }

  function get(key) {
    if (!isAvailable()) return null;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function set(key, value) {
    if (!isAvailable()) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage quota exceeded or other error — silently ignore
    }
  }

  return { isAvailable, get, set, KEYS };
})();

/* ============================================================
   ThemeManager
   ============================================================ */
const ThemeManager = (() => {
  function apply(theme) {
    if (theme === 'dark') {
      document.body.classList.add('dark');
    } else {
      document.body.classList.remove('dark');
    }
    const icon = document.querySelector('.theme-toggle__icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  function save(theme) {
    StorageService.set(StorageService.KEYS.THEME, theme);
  }

  function toggle() {
    const current = document.body.classList.contains('dark') ? 'dark' : 'light';
    const next = current === 'dark' ? 'light' : 'dark';

    // Animate the toggle button icon
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.classList.add('theme-toggle--animating');
      setTimeout(() => btn.classList.remove('theme-toggle--animating'), 400);
    }

    apply(next);
    save(next);
  }

  function init() {
    const saved = StorageService.get(StorageService.KEYS.THEME);
    apply(saved === 'dark' ? 'dark' : 'light');

    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, apply, save, toggle };
})();

/* ============================================================
   GreetingWidget
   ============================================================ */
const GreetingWidget = (() => {
  const DAYS_ID = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const MONTHS_ID = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  function formatTime(date) {
    const hh = String(date.getHours()).padStart(2, '0');
    const mm = String(date.getMinutes()).padStart(2, '0');
    return `${hh}:${mm}`;
  }

  function formatDate(date) {
    const dayName = DAYS_ID[date.getDay()];
    const day = date.getDate();
    const monthName = MONTHS_ID[date.getMonth()];
    const year = date.getFullYear();
    return `${dayName}, ${day} ${monthName} ${year}`;
  }

  function getGreeting(hour) {
    if (hour >= 5 && hour <= 11) return 'Selamat Pagi';
    if (hour >= 12 && hour <= 14) return 'Selamat Siang';
    if (hour >= 15 && hour <= 17) return 'Selamat Sore';
    return 'Selamat Malam';
  }

  function saveName(name) {
    StorageService.set(StorageService.KEYS.USERNAME, name);
  }

  function render() {
    const now = new Date();

    const timeEl = document.getElementById('greeting-time');
    if (timeEl) timeEl.textContent = formatTime(now);

    const dateEl = document.getElementById('greeting-date');
    if (dateEl) dateEl.textContent = formatDate(now);

    const username = StorageService.get(StorageService.KEYS.USERNAME);
    const greeting = getGreeting(now.getHours());
    const textEl = document.getElementById('greeting-text');
    if (textEl) {
      textEl.textContent = username ? `${greeting}, ${username}` : greeting;
    }
  }

  function init() {
    render();
    setInterval(render, 1000);

    const saveBtn = document.getElementById('greeting-name-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('greeting-name-input');
        if (input && input.value.trim()) {
          saveName(input.value.trim());
          render();
          input.value = '';
        }
      });
    }
  }

  return { init, render, getGreeting, formatTime, formatDate, saveName };
})();

/* ============================================================
   FocusTimer
   ============================================================ */
const FocusTimer = (() => {
  const DEFAULT_DURATION = 25; // minutes

  const state = {
    totalSeconds: DEFAULT_DURATION * 60,
    remainingSeconds: DEFAULT_DURATION * 60,
    isRunning: false,
    intervalId: null,
  };

  // 5.1 Format seconds as MM:SS
  function formatTime(seconds) {
    const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
    const ss = String(seconds % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  // 5.2 Validate duration in range 1–120
  function validateDuration(min) {
    return Number.isInteger(min) && min >= 1 && min <= 120;
  }

  // 5.3 Save duration to StorageService
  function saveDuration(min) {
    StorageService.set(StorageService.KEYS.POMODORO_DURATION, min);
  }

  function updateDisplay() {
    const display = document.getElementById('timer-display');
    if (display) display.textContent = formatTime(state.remainingSeconds);
  }

  // 5.6 Show completion notice
  function showCompletionNotice() {
    const notice = document.getElementById('timer-completion');
    if (notice) {
      notice.classList.remove('hidden');
      setTimeout(() => notice.classList.add('hidden'), 5000);
    }
  }

  // 5.5 Tick: reduce remainingSeconds by 1, handle 00:00
  function tick() {
    if (!state.isRunning) return;
    if (state.remainingSeconds > 0) {
      state.remainingSeconds -= 1;
      updateDisplay();
    }
    if (state.remainingSeconds === 0) {
      state.isRunning = false;
      clearInterval(state.intervalId);
      state.intervalId = null;
      showCompletionNotice();
    }
  }

  // 5.4 Start countdown
  function start() {
    if (state.isRunning) return;
    if (state.remainingSeconds === 0) return;
    state.isRunning = true;
    state.intervalId = setInterval(tick, 1000);
  }

  // 5.4 Stop countdown, retain remaining time
  function stop() {
    if (!state.isRunning) return;
    state.isRunning = false;
    clearInterval(state.intervalId);
    state.intervalId = null;
  }

  // 5.4 Reset to initial duration
  function reset() {
    stop();
    state.remainingSeconds = state.totalSeconds;
    state.isRunning = false;
    updateDisplay();
    // Hide completion notice on reset
    const notice = document.getElementById('timer-completion');
    if (notice) notice.classList.add('hidden');
  }

  // 5.7 Init: load duration from storage, render display, wire up buttons
  function init() {
    const saved = StorageService.get(StorageService.KEYS.POMODORO_DURATION);
    if (saved !== null && validateDuration(saved)) {
      state.totalSeconds = saved * 60;
      state.remainingSeconds = saved * 60;
    }

    // Set duration input value
    const durationInput = document.getElementById('timer-duration-input');
    if (durationInput) durationInput.value = state.totalSeconds / 60;

    updateDisplay();

    const startBtn = document.getElementById('timer-start');
    if (startBtn) startBtn.addEventListener('click', start);

    const stopBtn = document.getElementById('timer-stop');
    if (stopBtn) stopBtn.addEventListener('click', stop);

    const resetBtn = document.getElementById('timer-reset');
    if (resetBtn) resetBtn.addEventListener('click', reset);

    const saveBtn = document.getElementById('timer-duration-save');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const input = document.getElementById('timer-duration-input');
        const errorEl = document.getElementById('timer-duration-error');
        if (!input) return;
        const min = parseInt(input.value, 10);
        if (!validateDuration(min)) {
          if (errorEl) {
            errorEl.textContent = 'Durasi harus antara 1 dan 120 menit.';
            errorEl.classList.remove('hidden');
          }
          return;
        }
        if (errorEl) errorEl.classList.add('hidden');
        saveDuration(min);
        state.totalSeconds = min * 60;
        // Apply on next session: only update remainingSeconds if not running
        if (!state.isRunning) {
          state.remainingSeconds = state.totalSeconds;
          updateDisplay();
        }
      });
    }
  }

  return { init, start, stop, reset, tick, formatTime, validateDuration, saveDuration, showCompletionNotice, _state: state };
})();

/* ============================================================
   TodoList
   ============================================================ */
const TodoList = (() => {
  const TASKS_KEY = 'tld_tasks';

  let tasks = [];

  // 6.1 Reject empty or whitespace-only strings
  function isValidText(text) {
    return typeof text === 'string' && text.trim().length > 0;
  }

  // 6.6 Count tasks not yet completed
  function getIncompleteCount() {
    return tasks.filter(t => !t.completed).length;
  }

  // 6.7 Persist current tasks array to StorageService
  function save() {
    StorageService.set(TASKS_KEY, tasks);
  }

  // 6.2 Validate, create, and store a new task
  function addTask(text) {
    if (!isValidText(text)) return;
    const task = {
      id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
      text: text.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
    };
    tasks.push(task);
    save();
    render();
  }

  // 6.3 Toggle completed status and persist
  function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.completed = !task.completed;
    save();
    render();
  }

  // 6.4 Remove task from array and persist
  function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    save();
    render();
  }

  // 6.5 Update task text and persist
  function editTask(id, newText) {
    if (!isValidText(newText)) return;
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    task.text = newText.trim();
    save();
    render();
  }

  // 6.7 Render task list and incomplete count to DOM
  function render() {
    const countEl = document.getElementById('todo-count');
    if (countEl) {
      const n = getIncompleteCount();
      countEl.textContent = `${n} belum selesai`;
    }

    const listEl = document.getElementById('todo-items');
    if (!listEl) return;

    listEl.innerHTML = '';
    tasks.forEach(task => {
      const li = document.createElement('li');
      li.className = 'todo__item' + (task.completed ? ' todo__item--done' : '');
      li.dataset.id = task.id;

      // Checkbox toggle
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = task.completed;
      checkbox.className = 'todo__checkbox';
      checkbox.setAttribute('aria-label', 'Tandai selesai');
      checkbox.addEventListener('change', () => toggleTask(task.id));

      // Text span (double-click to edit)
      const span = document.createElement('span');
      span.className = 'todo__text';
      span.textContent = task.text;
      span.addEventListener('dblclick', () => startEdit(task.id, span));

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn--small todo__delete';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', 'Hapus tugas');
      delBtn.addEventListener('click', () => deleteTask(task.id));

      li.appendChild(checkbox);
      li.appendChild(span);
      li.appendChild(delBtn);
      listEl.appendChild(li);
    });
  }

  // Inline edit helper
  function startEdit(id, span) {
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'todo__edit-input';
    input.value = span.textContent;
    span.replaceWith(input);
    input.focus();

    function commit() {
      const newText = input.value;
      if (isValidText(newText)) {
        editTask(id, newText);
      } else {
        render(); // revert
      }
    }

    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') input.blur();
      if (e.key === 'Escape') render();
    });
  }

  // 6.8 Load tasks from storage and wire up add-task UI
  function init() {
    const stored = StorageService.get(TASKS_KEY);
    tasks = Array.isArray(stored) ? stored : [];
    render();

    const addBtn = document.getElementById('todo-add');
    const input = document.getElementById('todo-input');
    const errorEl = document.getElementById('todo-input-error');

    function attemptAdd() {
      const text = input ? input.value : '';
      if (!isValidText(text)) {
        if (errorEl) {
          errorEl.textContent = 'Teks tugas tidak boleh kosong atau hanya spasi.';
          errorEl.classList.remove('hidden');
        }
        return;
      }
      if (errorEl) errorEl.classList.add('hidden');
      addTask(text);
      if (input) input.value = '';
    }

    if (addBtn) addBtn.addEventListener('click', attemptAdd);
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') attemptAdd();
      });
    }
  }

  return { init, render, addTask, toggleTask, deleteTask, editTask, isValidText, getIncompleteCount, save, _tasks: () => tasks };
})();

/* ============================================================
   QuickLinks
   ============================================================ */
const QuickLinks = (() => {
  const LINKS_KEY = 'tld_links';

  let links = [];

  // 7.1 Validate URL: must start with http:// or https://
  function isValidUrl(url) {
    return typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'));
  }

  // 7.2 Validate label: must not be empty or whitespace-only
  function isValidLabel(label) {
    return typeof label === 'string' && label.trim().length > 0;
  }

  // 7.7 Persist current links array to StorageService
  function save() {
    StorageService.set(LINKS_KEY, links);
  }

  // 7.3 Validate, create, and store a new link
  function addLink(label, url) {
    if (!isValidLabel(label) || !isValidUrl(url)) return;
    const link = {
      id: String(Date.now()) + '_' + Math.random().toString(36).slice(2, 9),
      label: label.trim(),
      url,
    };
    links.push(link);
    save();
    render();
  }

  // 7.4 Remove link from array and persist
  function deleteLink(id) {
    links = links.filter(l => l.id !== id);
    save();
    render();
  }

  // 7.5 Render link buttons with click handlers
  function render() {
    const listEl = document.getElementById('quicklinks-list');
    if (!listEl) return;

    listEl.innerHTML = '';
    links.forEach(link => {
      const item = document.createElement('div');
      item.className = 'quicklinks__item';
      item.dataset.id = link.id;

      // Link button — opens URL in new tab (req 4.2)
      const btn = document.createElement('a');
      btn.className = 'btn quicklinks__btn';
      btn.textContent = link.label;
      btn.href = link.url;
      btn.target = '_blank';
      btn.rel = 'noopener noreferrer';
      btn.setAttribute('aria-label', `Buka ${link.label}`);

      // Delete button
      const delBtn = document.createElement('button');
      delBtn.className = 'btn btn--small quicklinks__delete';
      delBtn.textContent = '✕';
      delBtn.setAttribute('aria-label', `Hapus ${link.label}`);
      delBtn.addEventListener('click', () => deleteLink(link.id));

      item.appendChild(btn);
      item.appendChild(delBtn);
      listEl.appendChild(item);
    });
  }

  // 7.6 Load links from storage and wire up add-link UI
  function init() {
    const stored = StorageService.get(LINKS_KEY);
    links = Array.isArray(stored) ? stored : [];
    render();

    const addBtn = document.getElementById('quicklinks-add');
    const labelInput = document.getElementById('quicklinks-label-input');
    const urlInput = document.getElementById('quicklinks-url-input');
    const errorEl = document.getElementById('quicklinks-error');

    function attemptAdd() {
      const label = labelInput ? labelInput.value : '';
      const url = urlInput ? urlInput.value : '';

      if (!isValidLabel(label)) {
        if (errorEl) {
          errorEl.textContent = 'Label tidak boleh kosong atau hanya spasi.';
          errorEl.classList.remove('hidden');
        }
        return;
      }
      if (!isValidUrl(url)) {
        if (errorEl) {
          errorEl.textContent = 'URL harus diawali dengan http:// atau https://';
          errorEl.classList.remove('hidden');
        }
        return;
      }
      if (errorEl) errorEl.classList.add('hidden');
      addLink(label, url);
      if (labelInput) labelInput.value = '';
      if (urlInput) urlInput.value = '';
    }

    if (addBtn) addBtn.addEventListener('click', attemptAdd);
  }

  return { init, render, addLink, deleteLink, isValidUrl, isValidLabel, save, _links: () => links };
})();

/* ============================================================
   App Initialization
   ============================================================ */
(function initApp() {
  // 1. ThemeManager first — prevents flash of unstyled content
  ThemeManager.init();

  // 2. Show storage warning if Local Storage is unavailable
  if (!StorageService.isAvailable()) {
    const warning = document.getElementById('storage-warning');
    if (warning) warning.classList.remove('hidden');
  }

  // 3. Initialize remaining modules
  GreetingWidget.init();
  FocusTimer.init();
  TodoList.init();
  QuickLinks.init();
})();
