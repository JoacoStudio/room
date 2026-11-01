const note = document.getElementById('note');
const hint = document.getElementById('hint');
const helpOverlay = document.getElementById('helpOverlay');
const clock = document.getElementById('clock');
const splashOverlay = document.getElementById('splashOverlay');
const fileInput = document.getElementById('fileInput');
const statusBar = document.getElementById('statusBar');
const handleHit = document.getElementById('handleHit');
const topZone = document.getElementById('topZone');
const actionSheet = document.getElementById('actionSheet');
const sheetPanel = document.getElementById('sheetPanel');
const undoToast = document.getElementById('undoToast');
const undoBtn = document.getElementById('undoBtn');
const helpCard = document.querySelector('.help-card');
const hubOverlay = document.getElementById('hubOverlay');

const STORAGE_KEY = 'minimalist_notes';
const ACTIVE_KEY = 'room_active_index';
const THEME_KEY = 'room_theme';
const THEMES = ['auto', 'dark', 'light'];
const STATS_KEY = 'room_stats';
const KEYS = {
  NEW: 'n',
  DELETE: 'b',
  PREV: 'ArrowLeft',
  NEXT: 'ArrowRight',
  FULLSCREEN: 'q',
  EXPORT_ONE: 'd',
  EXPORT_ALL: 'e',
  IMPORT: 'i',
  READONLY: 'r',
  THEME: 'o',
  HELP: 'x',
  CLOSE: 'Backspace'
};

const isCoarse = window.matchMedia('(pointer: coarse)').matches;

let notes = [];
let activeIndex = 0;
let hintTimer = null;
let hintResetTimer = null;
let typingTimer = null;
let saveTimer = null;
let isReadOnly = false;
let clockInterval = null;
let sheetOpen = false;
let deletedNote = null;
let deletedIndex = -1;
let deletedPlaceholderId = null;
let undoTimer = null;
let isProgrammaticChange = false;
let currentTheme = 'auto';
let hubOpen = false;
let stats = {
  wordsTotal: 0,
  charsTotal: 0,
  notesCreated: 0,
  notesDeleted: 0,
  daysActive: [],
  lastActivity: null,
  lastNotes: []
};

function vibrate(ms = 10) {
  if (isCoarse && navigator.vibrate) navigator.vibrate(ms);
}

function loadNotes() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    notes = raw ? JSON.parse(raw) : [];
  } catch (e) {
    notes = [];
  }
  if (!Array.isArray(notes) || notes.length === 0) {
    notes = [{ id: Date.now().toString(), title: '', body: '', updated: Date.now() }];
    saveNotes();
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    showStatus('No se pudo guardar en almacenamiento local');
  }
}

function getSavedIndex() {
  try {
    const raw = parseInt(localStorage.getItem(ACTIVE_KEY), 10);
    if (!Number.isFinite(raw)) return 0;
    return Math.min(Math.max(raw, 0), notes.length - 1);
  } catch (e) {
    return 0;
  }
}

function updateClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  clock.textContent = `${hours}:${minutes}:${seconds}`;
}

function startClock() {
  if (clockInterval) return;
  updateClock();
  clockInterval = setInterval(updateClock, 1000);
}

function stopClock() {
  clearInterval(clockInterval);
  clockInterval = null;
}

function isNight() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 8;
}

function applyTheme(theme) {
  currentTheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}

  document.body.classList.remove('dark-mode');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  } else if (theme === 'auto' && isNight()) {
    document.body.classList.add('dark-mode');
  }

  showShortcutHint();
}

function toggleTheme() {
  const idx = THEMES.indexOf(currentTheme);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next);

  const labels = { auto: 'sistema', dark: 'oscuro', light: 'claro' };
  showTransient(`Tema: ${labels[next]}`, 3000);
}

/* ---------- Hub / Estadísticas ---------- */

function loadStats() {
  try {
    const raw = localStorage.getItem(STATS_KEY);
    if (raw) {
      stats = JSON.parse(raw);
      if (!stats.dailyWords) stats.dailyWords = {};
    } else {
      stats = {
        wordsTotal: 0,
        charsTotal: 0,
        notesCreated: 0,
        notesDeleted: 0,
        daysActive: [],
        lastActivity: null,
        dailyWords: {}
      };
    }
  } catch (e) {
    stats = {
      wordsTotal: 0,
      charsTotal: 0,
      notesCreated: 0,
      notesDeleted: 0,
      daysActive: [],
      lastActivity: null,
      dailyWords: {}
    };
  }
}

function saveStats() {
  try {
    localStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (e) {}
}

function recordTyping() {
  const text = note.value || '';
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;

  const today = new Date().toDateString();
  if (!stats.dailyWords) stats.dailyWords = {};
  stats.dailyWords[today] = words;

  if (!stats.daysActive.includes(today)) {
    stats.daysActive.push(today);
    stats.daysActive.sort();
  }

  stats.lastActivity = Date.now();
  stats.wordsTotal = Object.values(stats.dailyWords || {}).reduce((a, b) => a + b, 0);
  stats.charsTotal = Math.max(stats.charsTotal, chars);

  saveStats();
}

function recordNoteCreated() {
  stats.notesCreated++;
  saveStats();
}

function recordNoteDeleted() {
  stats.notesDeleted++;
  saveStats();
}

function getLastNotes() {
  return notes
    .slice()
    .sort((a, b) => (b.updated || 0) - (a.updated || 0))
    .slice(0, 5)
    .map((n) => n.body || '')
    .filter((t) => t.trim() !== '')
    .map((t) => (t.length > 40 ? t.slice(0, 40) + '…' : t));
}

function calculateWPM() {
  if (!stats.lastActivity) return 0;
  const now = Date.now();
  const minutes = Math.max(1, (now - stats.lastActivity) / 60000);
  return Math.round(stats.wordsTotal / minutes);
}

function renderHubStats() {
  const statsContainer = document.getElementById('hubStats');
  const notesContainer = document.getElementById('hubNotes');
  if (!statsContainer || !notesContainer) return;

  const totalWords = stats.wordsTotal;
  const totalChars = stats.charsTotal;
  const daysActive = stats.daysActive.length;
  const wpm = calculateWPM();
  const lastNotes = getLastNotes();

  let html = `
    <div class="stat-row"><span class="stat-label">Notas totales</span><span class="stat-value">${notes.length}</span></div>
    <div class="stat-row"><span class="stat-label">Palabras escritas</span><span class="stat-value">${totalWords}</span></div>
    <div class="stat-row"><span class="stat-label">Caracteres escritos</span><span class="stat-value">${totalChars}</span></div>
    <div class="stat-row"><span class="stat-label">Ritmo aproximado</span><span class="stat-value">${wpm} palabras/min</span></div>
    <div class="stat-row"><span class="stat-label">Días activos</span><span class="stat-value">${daysActive}</span></div>
    <div class="stat-row"><span class="stat-label">Notas creadas</span><span class="stat-value">${stats.notesCreated}</span></div>
    <div class="stat-row"><span class="stat-label">Notas eliminadas</span><span class="stat-value">${stats.notesDeleted}</span></div>
  `;

  statsContainer.innerHTML = html;

  let notesHtml = '<h3>Últimas notas</h3><ul>';
  if (lastNotes.length > 0) {
    lastNotes.forEach((t) => {
      notesHtml += `<li style="margin: 2px 0; font-size: 14px;">"${t}"</li>`;
    });
  } else {
    notesHtml += '<li style="color:#666666;font-size:14px;">Sin notas aún</li>';
  }
  notesHtml += '</ul>';
  notesContainer.innerHTML = notesHtml;
}

function toggleHub(force) {
  const show = typeof force === 'boolean' ? force : hubOverlay.style.display !== 'flex';
  hubOverlay.style.display = show ? 'flex' : 'none';
  hubOverlay.classList.toggle('open', show);
  document.body.classList.toggle('hub-active', show);
  hubOpen = show;
  if (show) {
    note.blur();
    renderHubStats();
    renderHubCharts();
    setupHubTabs();
  } else {
    note.focus();
  }
}

/* ---------- Hub: pestañas ---------- */

function setupHubTabs() {
  const tabs = document.querySelectorAll('.hub-tab');
  const sections = document.querySelectorAll('.hub-section');

  tabs.forEach((tab) => {
    tab.onclick = () => {
      tabs.forEach((t) => t.classList.remove('active'));
      sections.forEach((s) => s.classList.remove('active'));
      tab.classList.add('active');
      const id = 'hub' + tab.dataset.tab.charAt(0).toUpperCase() + tab.dataset.tab.slice(1);
      document.getElementById(id).classList.add('active');
      if (tab.dataset.tab === 'charts') {
        renderHubCharts();
      }
    };
  });
}

/* ---------- Hub: gráficos con Canvas ---------- */

function renderHubCharts() {
  const dailyCanvas = document.getElementById('chartDaily');
  const streakCanvas = document.getElementById('chartStreak');
  if (!dailyCanvas || !streakCanvas) return;

  const dailyCtx = dailyCanvas.getContext('2d');
  const streakCtx = streakCanvas.getContext('2d');

  dailyCtx.clearRect(0, 0, dailyCanvas.width, dailyCanvas.height);
  streakCtx.clearRect(0, 0, streakCanvas.width, streakCanvas.height);

  const dailyWords = stats.dailyWords || {};
  const dates = Object.keys(dailyWords).sort();
  const values = dates.map((d) => dailyWords[d] || 0);

  // Gráfico de barras: palabras por día
  dailyCtx.fillStyle = '#000000';
  dailyCtx.font = '12px Nunito Sans, sans-serif';
  dailyCtx.textAlign = 'center';

  if (dates.length > 0) {
    const maxVal = Math.max(...values, 1);
    const barWidth = 28;
    const gap = 12;
    const chartHeight = dailyCanvas.height - 50;

    dates.forEach((date, i) => {
      const x = 20 + i * (barWidth + gap) + barWidth / 2;
      const barHeight = (values[i] / maxVal) * chartHeight;
      const y = dailyCanvas.height - 30 - barHeight;

      dailyCtx.fillRect(x - barWidth / 2, y, barWidth, barHeight);
      dailyCtx.fillText(values[i], x, y - 6);

      const label = date.slice(5); // MM-DD
      dailyCtx.fillText(label, x, dailyCanvas.height - 14);
    });

    dailyCtx.fillText('Palabras escritas por día', dailyCanvas.width / 2, 16);
  } else {
    dailyCtx.fillText('Sin actividad aún', dailyCanvas.width / 2, dailyCanvas.height / 2);
  }

  // Gráfico: días activos (cuadrícula simple de los últimos 14 días)
  streakCtx.fillStyle = '#000000';
  streakCtx.font = '12px Nunito Sans, sans-serif';
  streakCtx.textAlign = 'center';
  streakCtx.fillText(`Días activos: ${stats.daysActive.length}`, streakCanvas.width / 2, 24);

  const cellSize = 26;
  const cellGap = 8;
  const startX = 20;
  const startY = streakCanvas.height - 80;

  const recentDays = stats.daysActive.slice(-14);
  recentDays.forEach((date, i) => {
    const x = startX + i * (cellSize + cellGap);
    const y = startY;
    streakCtx.fillStyle = '#000000';
    streakCtx.fillRect(x, y, cellSize, cellSize);
    streakCtx.fillStyle = '#ffffff';
    streakCtx.fillText(date.slice(5), x + cellSize / 2, y + cellSize / 2 + 5);
  });
}

startClock();

try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && THEMES.includes(saved)) {
    applyTheme(saved);
  } else if (isNight()) {
    applyTheme('auto');
  }
} catch (e) {
  if (isNight()) document.body.classList.add('dark-mode');
}

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveActive();
    stopClock();
  } else {
    startClock();
  }
});

window.addEventListener('beforeunload', saveActive);

function loadNote(index, focus = true) {
  if (index < 0 || index >= notes.length) return;
  activeIndex = index;
  note.value = notes[activeIndex].body || '';
  note.readOnly = isReadOnly;
  try {
    localStorage.setItem(ACTIVE_KEY, String(activeIndex));
  } catch (e) {}
  if (focus) {
    note.focus();
    if (isCoarse) {
      const end = note.value.length;
      try {
        note.setSelectionRange(end, end);
      } catch (e) {}
    }
  }
  showShortcutHint();
}

function saveActive() {
  if (notes[activeIndex] && !isReadOnly) {
    notes[activeIndex].body = note.value;
    notes[activeIndex].updated = Date.now();
    saveNotes();
  }
}

function debouncedSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveActive, 800);
}

function baseHintText() {
  const total = notes.length;
  const current = activeIndex + 1;
  const readOnlyText = isReadOnly ? (isCoarse ? ' · lectura' : '  ·  Solo lectura') : '';
  if (isCoarse) {
    return `${current} / ${total} · ← → notas · ↓ nueva · ↑ acciones${readOnlyText}`;
  }
  return `Nota ${current} de ${total}  ·  Alt+N nueva  ·  Alt+B eliminar  ·  Alt+← → cambiar  ·  Alt+Q pantalla  ·  Alt+D exportar  ·  Alt+E exportar todo  ·  Alt+I importar  ·  Alt+R lectura${readOnlyText}`;
}

function showShortcutHint() {
  hint.textContent = baseHintText();
  hint.style.opacity = '1';
  clearTimeout(hintTimer);
  clearTimeout(hintResetTimer);
  hintTimer = setTimeout(() => {
    hint.style.opacity = isCoarse ? '0.45' : '0';
  }, 5000);
}

function showTransient(text, ms = 5000) {
  hint.textContent = text;
  hint.style.opacity = '1';
  clearTimeout(hintTimer);
  clearTimeout(hintResetTimer);
  hintResetTimer = setTimeout(showShortcutHint, ms);
}

function showStatus(text) {
  showTransient(text);
}

function showTypingStats() {
  const text = note.value || '';
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  showTransient(`${words} palabras · ${chars} caracteres`, 4000);
}

/* ---------- Operaciones aritméticas ---------- */

function tokenize(expr) {
  const tokens = [];
  let i = 0;
  while (i < expr.length) {
    const c = expr[i];
    if (/\s/.test(c)) { i++; continue; }
    if (c === '√') { tokens.push('√'); i++; continue; }
    if ('+-*/%^()'.includes(c)) { tokens.push(c); i++; continue; }
    if (/\d/.test(c) || c === '.') {
      let num = '';
      while (i < expr.length && /[\d.]/.test(expr[i])) {
        num += expr[i++];
      }
      tokens.push(parseFloat(num));
      continue;
    }
    throw new Error('Carácter no válido: ' + c);
  }
  return tokens;
}

function evaluate(expr) {
  const tokens = tokenize(expr);
  let pos = 0;
  function peek() { return pos < tokens.length ? tokens[pos] : null; }
  function consume() { return tokens[pos++]; }

  function parseExpr() {
    let left = parseTerm();
    while (true) {
      const t = peek();
      if (t === '+' || t === '-') {
        consume();
        const right = parseTerm();
        left = t === '+' ? left + right : left - right;
      } else break;
    }
    return left;
  }

  function parseTerm() {
    let left = parseFactor();
    while (true) {
      const t = peek();
      if (t === '*' || t === '/' || t === '%') {
        consume();
        const right = parseFactor();
        if (t === '*') left = left * right;
        else if (t === '/') left = left / right;
        else left = left % right;
      } else break;
    }
    return left;
  }

  function parseFactor() {
    const t = peek();
    if (t === '√') {
      consume();
      return Math.sqrt(parseFactor());
    }
    return parsePower();
  }

  function parsePower() {
    let base = parseUnary();
    const t = peek();
    if (t === '^') {
      consume();
      return Math.pow(base, parsePower());
    }
    return base;
  }

  function parseUnary() {
    const t = peek();
    if (t === '+' || t === '-') {
      consume();
      return t === '+' ? parseUnary() : -parseUnary();
    }
    return parsePrimary();
  }

  function parsePrimary() {
    const t = peek();
    if (t === '(') {
      consume();
      const val = parseExpr();
      if (peek() === ')') consume();
      else throw new Error('Paréntesis no cerrado');
      return val;
    }
    if (typeof t === 'number') {
      consume();
      return t;
    }
    throw new Error('Token inesperado: ' + t);
  }

  const result = parseExpr();
  if (peek() !== null) throw new Error('Tokens sobrantes');
  if (!Number.isFinite(result)) throw new Error('Resultado no válido');
  return result;
}

function formatResult(n) {
  if (Number.isInteger(n)) return String(n);
  return n.toFixed(6).replace(/(\.\d*?[1-9])0+$/, '$1').replace(/\.$/, '');
}

function checkArithmetic() {
  const val = note.value;
  const lines = val.split('\n');
  const lastIdx = lines.length - 1;
  const lastLine = lines[lastIdx];
  const trimmed = lastLine.trimEnd();

  if (!trimmed.endsWith('=')) return;

  const expr = trimmed.slice(0, -1).trim();
  if (!expr) return;

  try {
    const result = evaluate(expr);
    const formatted = formatResult(result);
    isProgrammaticChange = true;
    lines[lastIdx] = lastLine.replace(/=\s*$/, `= ${formatted}`);
    note.value = lines.join('\n');
    note.setSelectionRange(note.value.length, note.value.length);
    isProgrammaticChange = false;
  } catch (err) {
    // No es una expresión aritmética válida: se deja tal cual
  }
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

async function shareFile(blob, filename, type) {
  if (!isCoarse || !navigator.share || !navigator.canShare) return false;
  try {
    const file = new File([blob], filename, { type });
    if (!navigator.canShare({ files: [file] })) return false;
    await navigator.share({ files: [file], title: filename });
    return true;
  } catch (err) {
    if (err && err.name === 'AbortError') return null;
    return false;
  }
}

async function exportOneNote() {
  const text = note.value || '';
  const filename = `nota-${Date.now()}.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const shared = await shareFile(blob, filename, 'text/plain');
  if (shared === null) return;
  if (!shared) downloadBlob(blob, filename);
  showStatus(shared ? 'Nota compartida' : 'Nota exportada');
}

async function exportAllNotes() {
  saveActive();
  const data = JSON.stringify(notes, null, 2);
  const filename = `room-respaldo-${Date.now()}.json`;
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  const shared = await shareFile(blob, filename, 'application/json');
  if (shared === null) return;
  if (!shared) downloadBlob(blob, filename);
  showStatus(shared ? 'Respaldo compartido' : 'Respaldo exportado');
}

function importNotes() {
  fileInput.click();
}

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    try {
      const content = ev.target.result;
      const isJson = file.name.toLowerCase().endsWith('.json');
      if (isJson) {
        const imported = JSON.parse(content);
        if (Array.isArray(imported) && imported.length > 0) {
          notes = imported.map((n) => ({
            id: n.id || Date.now().toString(),
            title: n.title || '',
            body: n.body || '',
            updated: n.updated || Date.now()
          }));
          saveNotes();
          activeIndex = 0;
          loadNote(0, !isCoarse);
          showStatus(`${notes.length} notas importadas`);
        } else {
          showStatus('Archivo JSON vacío o inválido');
        }
      } else {
        notes.push({
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, '') || 'Sin título',
          body: content,
          updated: Date.now()
        });
        saveNotes();
        loadNote(notes.length - 1, !isCoarse);
        showStatus('Nota importada');
      }
    } catch (err) {
      showStatus('Error al importar el archivo');
    }
    fileInput.value = '';
  };
  reader.readAsText(file);
});

function createNote() {
  saveActive();
  const newNote = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: '',
    body: '',
    updated: Date.now()
  };
  notes.push(newNote);
  saveNotes();
  loadNote(notes.length - 1, true);
  recordNoteCreated();
  vibrate(10);
}

function showUndo() {
  clearTimeout(undoTimer);
  undoToast.classList.add('visible');
  undoTimer = setTimeout(hideUndo, 5000);
}

function hideUndo() {
  clearTimeout(undoTimer);
  undoToast.classList.remove('visible');
  deletedNote = null;
  deletedIndex = -1;
  deletedPlaceholderId = null;
}

function deleteNote() {
  saveActive();
  if (notes.length === 0) return;
  const removed = notes.splice(activeIndex, 1)[0];
  deletedNote = removed;
  deletedIndex = activeIndex;
  deletedPlaceholderId = null;
  recordNoteDeleted();
  saveNotes();

  if (notes.length === 0) {
    const placeholder = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      body: '',
      updated: Date.now()
    };
    notes.push(placeholder);
    deletedPlaceholderId = placeholder.id;
    saveNotes();
    activeIndex = 0;
  } else if (activeIndex >= notes.length) {
    activeIndex = notes.length - 1;
  }

  loadNote(activeIndex, !isCoarse);
  showUndo();
  vibrate(20);
}

undoBtn.addEventListener('click', () => {
  if (!deletedNote) return;
  const restored = deletedNote;
  const index = deletedIndex;
  const placeholderId = deletedPlaceholderId;
  hideUndo();

  if (placeholderId) {
    const placeholderIndex = notes.findIndex((n) => n.id === placeholderId);
    if (placeholderIndex !== -1 && !notes[placeholderIndex].body && !notes[placeholderIndex].title) {
      notes.splice(placeholderIndex, 1);
    }
  }

  notes.splice(Math.min(index, notes.length), 0, restored);
  saveNotes();
  loadNote(Math.min(index, notes.length - 1), !isCoarse);
  showStatus('Nota restaurada');
});

function goNext() {
  saveActive();
  loadNote(activeIndex < notes.length - 1 ? activeIndex + 1 : 0, true);
}

function goPrev() {
  saveActive();
  loadNote(activeIndex > 0 ? activeIndex - 1 : notes.length - 1, true);
}

function toggleReadOnly() {
  isReadOnly = !isReadOnly;
  note.readOnly = isReadOnly;
  if (isCoarse) {
    if (isReadOnly) note.blur();
  } else {
    note.focus();
  }
  showStatus(isReadOnly ? 'Solo lectura · desliza ↑ para acciones' : 'Edición activada');
}

function toggleHelp(force) {
  const show = typeof force === 'boolean' ? force : helpOverlay.style.display !== 'flex';
  helpOverlay.style.display = show ? 'flex' : 'none';
  helpOverlay.setAttribute('aria-hidden', String(!show));
  if (show) {
    note.blur();
    setTimeout(() => {
      if (helpOverlay.style.display === 'flex') {
        helpCard.focus({ preventScroll: true });
      }
    }, 0);
  } else if (isCoarse) {
    handleHit.focus({ preventScroll: true });
  } else {
    note.focus();
  }
}

function openSheet() {
  if (sheetOpen) return;
  sheetOpen = true;
  note.blur();
  const readOnlyButton = actionSheet.querySelector('[data-action="readonly"]');
  if (readOnlyButton) {
    readOnlyButton.textContent = isReadOnly ? 'Desactivar solo lectura' : 'Activar solo lectura';
  }
  actionSheet.classList.add('open');
  actionSheet.setAttribute('aria-hidden', 'false');
  sheetPanel.style.transform = '';
  setTimeout(() => {
    if (sheetOpen) sheetPanel.focus({ preventScroll: true });
  }, 50);
}

function closeSheet() {
  if (!sheetOpen) return;
  sheetOpen = false;
  actionSheet.classList.remove('open');
  actionSheet.setAttribute('aria-hidden', 'true');
  sheetPanel.style.transform = '';
  sheetPanel.style.transition = '';
  if (isCoarse) {
    handleHit.focus({ preventScroll: true });
  } else {
    note.focus();
  }
}

actionSheet.addEventListener('click', (e) => {
  if (e.target.closest('[data-close]')) {
    closeSheet();
    return;
  }
  const button = e.target.closest('[data-action]');
  if (!button) return;
  const action = button.dataset.action;
  closeSheet();
  switch (action) {
    case 'new':
      createNote();
      break;
    case 'delete':
      deleteNote();
      break;
    case 'export-one':
      exportOneNote();
      break;
    case 'export-all':
      exportAllNotes();
      break;
    case 'import':
      importNotes();
      break;
    case 'readonly':
      toggleReadOnly();
      break;
    case 'help':
      toggleHelp(true);
      break;
  }
});

handleHit.addEventListener('click', openSheet);

helpOverlay.addEventListener('click', () => toggleHelp(false));

note.addEventListener('input', () => {
  if (isProgrammaticChange) return;
  debouncedSave();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(showTypingStats, 2000);
  checkArithmetic();
  recordTyping();
});

note.addEventListener('blur', saveActive);

document.addEventListener('keydown', (e) => {
  const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;

  if (e.key === 'Escape') {
    if (sheetOpen) {
      e.preventDefault();
      closeSheet();
      return;
    }
    if (helpOverlay.style.display === 'flex') {
      e.preventDefault();
      toggleHelp(false);
      return;
    }
    if (hubOverlay.style.display === 'flex') {
      e.preventDefault();
      toggleHub(false);
      return;
    }
  }

  if (hubOverlay.style.display === 'flex') return;

  if (sheetOpen) return;

  if (helpOverlay.style.display === 'flex') {
    e.preventDefault();
    toggleHelp(false);
    return;
  }

  if (e.altKey && key === KEYS.NEW) {
    e.preventDefault();
    createNote();
    return;
  }

  if (e.altKey && key === KEYS.DELETE) {
    e.preventDefault();
    deleteNote();
    return;
  }

  if (e.altKey && (key === KEYS.PREV || key === KEYS.NEXT)) {
    e.preventDefault();
    if (key === KEYS.PREV) goPrev();
    else goNext();
    return;
  }

  if (e.altKey && key === KEYS.FULLSCREEN) {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
    return;
  }

  if (e.altKey && key === KEYS.EXPORT_ONE) {
    e.preventDefault();
    exportOneNote();
    return;
  }

  if (e.altKey && key === KEYS.EXPORT_ALL) {
    e.preventDefault();
    exportAllNotes();
    return;
  }

  if (e.altKey && key === KEYS.IMPORT) {
    e.preventDefault();
    importNotes();
    return;
  }

  if (e.altKey && key === KEYS.READONLY) {
    e.preventDefault();
    toggleReadOnly();
    return;
  }

  if (e.altKey && key === KEYS.THEME) {
    e.preventDefault();
    toggleTheme();
    return;
  }

  if (e.altKey && key === '2') {
    e.preventDefault();
    toggleHub();
    return;
  }

  if (e.altKey && key === KEYS.HELP) {
    e.preventDefault();
    toggleHelp();
    return;
  }

  if (e.altKey && key === KEYS.CLOSE) {
    e.preventDefault();
    if (!isCoarse) window.close();
  }
});

/* ---------- Gestos ---------- */

function initViewport() {
  if (!window.visualViewport) return;
  const vv = window.visualViewport;
  const update = () => {
    document.documentElement.style.setProperty('--vvh', `${Math.round(vv.height)}px`);
  };
  vv.addEventListener('resize', update);
  vv.addEventListener('scroll', update);
  update();
}

function animatePage(direction, focus) {
  const width = note.clientWidth || window.innerWidth;
  note.style.transition = 'transform 170ms cubic-bezier(0.2, 0.7, 0.3, 1)';
  note.style.transform = `translateX(${-direction * width}px)`;

  setTimeout(() => {
    loadNote(activeIndex + direction, focus);
    note.style.transition = 'none';
    note.style.transform = `translateX(${direction * width}px)`;
    void note.offsetWidth;
    note.style.transition = 'transform 170ms cubic-bezier(0.2, 0.7, 0.3, 1)';
    note.style.transform = 'translateX(0)';
    setTimeout(() => {
      note.style.transition = '';
      note.style.transform = '';
    }, 190);
  }, 180);
}

function initGestures() {
  let animating = false;
  let suppressClickUntil = 0;

  document.addEventListener(
    'click',
    (e) => {
      if (performance.now() < suppressClickUntil) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );

  function navigateBySwipe(dx, focus) {
    if (animating) return false;
    const direction = dx < 0 ? 1 : -1;
    const canGo = direction === 1 ? activeIndex < notes.length - 1 : activeIndex > 0;
    if (!canGo) return false;
    animating = true;
    saveActive();
    animatePage(direction, focus);
    setTimeout(() => {
      animating = false;
    }, 380);
    return true;
  }

  /* Swipe horizontal sobre la nota */
  let swipe = null;

  note.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    if (!e.isPrimary) {
      if (swipe) {
        swipe.cancelled = true;
        note.style.transition = '';
        note.style.transform = '';
      }
      return;
    }
    if (animating) return;
    swipe = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      axis: null,
      moved: false,
      cancelled: false,
      wasEditing: document.activeElement === note
    };
  });

  note.addEventListener('pointermove', (e) => {
    if (!swipe || e.pointerId !== swipe.id || swipe.cancelled) return;
    const now = performance.now();
    const dx = e.clientX - swipe.startX;
    const dy = e.clientY - swipe.startY;

    if (!swipe.axis) {
      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      if (now - swipe.startTime > 350) {
        swipe.cancelled = true;
        return;
      }
      if (Math.abs(dx) > Math.abs(dy) * 1.25) {
        swipe.axis = 'x';
        suppressClickUntil = now + 400;
        try {
          note.setPointerCapture(e.pointerId);
        } catch (err) {}
      } else {
        swipe.axis = 'y';
        return;
      }
    }

    if (swipe.axis !== 'x') return;
    swipe.moved = true;
    if (e.cancelable) e.preventDefault();

    const atFirst = activeIndex === 0;
    const atLast = activeIndex === notes.length - 1;
    let offset = dx;
    if ((dx > 0 && atFirst) || (dx < 0 && atLast)) {
      offset = dx * 0.35;
    }
    note.style.transition = 'none';
    note.style.transform = `translateX(${offset}px)`;
  });

  const endSwipe = (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    const current = swipe;
    swipe = null;
    note.style.transition = '';
    if (current.axis !== 'x' || !current.moved || current.cancelled) {
      note.style.transform = '';
      return;
    }

    const dx = e.clientX - current.startX;
    const elapsed = Math.max(1, performance.now() - current.startTime);
    const velocity = Math.abs(dx) / elapsed;
    const width = note.clientWidth || window.innerWidth;
    const passed = Math.abs(dx) > Math.min(120, width * 0.25) || velocity > 0.45;
    const atFirst = activeIndex === 0;
    const atLast = activeIndex === notes.length - 1;
    const canGo = dx < 0 ? !atLast : !atFirst;

    if (passed && canGo) {
      navigateBySwipe(dx, current.wasEditing);
    } else {
      if (passed && !canGo) {
        showStatus(dx < 0 ? 'Última nota · desliza ↓ para crear' : 'Primera nota');
      }
      note.style.transition = 'transform 180ms cubic-bezier(0.2, 0.7, 0.3, 1)';
      note.style.transform = 'translateX(0)';
      setTimeout(() => {
        note.style.transition = '';
        note.style.transform = '';
      }, 200);
    }
  };

  note.addEventListener('pointerup', endSwipe);
  note.addEventListener('pointercancel', (e) => {
    if (!swipe || e.pointerId !== swipe.id) return;
    swipe = null;
    note.style.transition = '';
    note.style.transform = '';
  });
  note.addEventListener('contextmenu', () => {
    if (swipe) swipe.cancelled = true;
  });

  /* Swipe vertical desde la barra inferior */
  let statusGesture = null;

  statusBar.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    if (!e.isPrimary) {
      if (statusGesture) {
        statusGesture = null;
        statusBar.classList.remove('pulling');
      }
      return;
    }
    statusGesture = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      axis: null,
      moved: false
    };
  });

  statusBar.addEventListener('pointermove', (e) => {
    if (!statusGesture || e.pointerId !== statusGesture.id) return;
    const dx = e.clientX - statusGesture.startX;
    const dy = e.clientY - statusGesture.startY;

    if (!statusGesture.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      statusGesture.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      statusGesture.moved = true;
      suppressClickUntil = performance.now() + 400;
      try {
        statusBar.setPointerCapture(e.pointerId);
      } catch (err) {}
      if (statusGesture.axis === 'y') {
        statusBar.classList.add('pulling');
      }
    }

    if (statusGesture.axis !== 'y') return;
    if (e.cancelable) e.preventDefault();
    const pullText = dy < 0 ? 'Suelta para abrir acciones' : 'Suelta para crear nota';
    if (hint.textContent !== pullText) hint.textContent = pullText;
    hint.style.opacity = '1';
  });

  const endStatusGesture = (e) => {
    if (!statusGesture || e.pointerId !== statusGesture.id) return;
    const current = statusGesture;
    statusGesture = null;
    statusBar.classList.remove('pulling');
    const dx = e.clientX - current.startX;
    const dy = e.clientY - current.startY;
    const elapsed = Math.max(1, performance.now() - current.startTime);
    const velocity = Math.abs(dy) / elapsed;

    if (current.axis === 'x' && Math.abs(dx) > 40) {
      navigateBySwipe(dx, document.activeElement === note);
    } else if (current.axis === 'y' && (Math.abs(dy) > 40 || velocity > 0.4)) {
      if (dy < 0) openSheet();
      else createNote();
    } else {
      showShortcutHint();
    }
  };

  statusBar.addEventListener('pointerup', endStatusGesture);
  statusBar.addEventListener('pointercancel', () => {
    statusGesture = null;
    statusBar.classList.remove('pulling');
    showShortcutHint();
  });

  /* Swipe vertical desde arriba: nueva nota */
  let topGesture = null;

  topZone.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse') return;
    if (!e.isPrimary) {
      topGesture = null;
      return;
    }
    topGesture = {
      id: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startTime: performance.now(),
      axis: null,
      moved: false
    };
    try {
      topZone.setPointerCapture(e.pointerId);
    } catch (err) {}
  });

  topZone.addEventListener('pointermove', (e) => {
    if (!topGesture || e.pointerId !== topGesture.id) return;
    const dx = e.clientX - topGesture.startX;
    const dy = e.clientY - topGesture.startY;

    if (!topGesture.axis) {
      if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
      topGesture.axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
      topGesture.moved = true;
    }

    if (topGesture.axis !== 'y') return;
    if (e.cancelable) e.preventDefault();
    if (dy > 20) {
      const pullText = dy > 50 ? 'Suelta para crear nota' : 'Desliza ↓ para nueva nota';
      if (hint.textContent !== pullText) hint.textContent = pullText;
      hint.style.opacity = '1';
    }
  });

  const endTopGesture = (e) => {
    if (!topGesture || e.pointerId !== topGesture.id) return;
    const current = topGesture;
    topGesture = null;
    const dy = e.clientY - current.startY;
    const elapsed = Math.max(1, performance.now() - current.startTime);
    const velocity = Math.abs(dy) / elapsed;

    if (current.axis === 'y' && (dy > 50 || (dy > 30 && velocity > 0.4))) {
      createNote();
    } else {
      showShortcutHint();
    }
  };

  topZone.addEventListener('pointerup', endTopGesture);
  topZone.addEventListener('pointercancel', () => {
    topGesture = null;
    showShortcutHint();
  });

  /* Arrastrar la hoja hacia abajo para cerrarla */
  let sheetGesture = null;

  sheetPanel.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || e.pointerType === 'mouse') return;
    if (!e.target.closest('.sheet-handle, .sheet-title')) return;
    sheetGesture = {
      id: e.pointerId,
      startY: e.clientY,
      dy: 0,
      active: false
    };
  });

  sheetPanel.addEventListener('pointermove', (e) => {
    if (!sheetGesture || e.pointerId !== sheetGesture.id) return;
    const dy = e.clientY - sheetGesture.startY;
    if (!sheetGesture.active) {
      if (dy < 8) return;
      sheetGesture.active = true;
      sheetPanel.style.transition = 'none';
      try {
        sheetPanel.setPointerCapture(e.pointerId);
      } catch (err) {}
    }
    const offset = Math.max(0, dy);
    sheetGesture.dy = offset;
    sheetPanel.style.transform = `translateY(${offset}px)`;
  });

  const endSheetGesture = (e) => {
    if (!sheetGesture || e.pointerId !== sheetGesture.id) return;
    const current = sheetGesture;
    sheetGesture = null;
    if (!current.active) return;
    sheetPanel.style.transition = '';
    if (current.dy > 90) {
      closeSheet();
    } else {
      sheetPanel.style.transform = '';
    }
  };

  sheetPanel.addEventListener('pointerup', endSheetGesture);
  sheetPanel.addEventListener('pointercancel', () => {
    sheetGesture = null;
    sheetPanel.style.transition = '';
    sheetPanel.style.transform = '';
  });
}

function hideSplash() {
  try {
    splashOverlay.classList.add('hidden');
    setTimeout(() => {
      splashOverlay.style.display = 'none';
    }, 600);
  } catch (e) {
    console.error('Error ocultando splash:', e);
    splashOverlay.style.display = 'none';
  }
}

function initApp() {
  try {
    loadNotes();
    loadStats();
    loadNote(getSavedIndex(), !isCoarse);
  } catch (e) {
    console.error('Error inicializando app:', e);
  }
  initViewport();
  if (isCoarse) initGestures();
}

setTimeout(hideSplash, 2500);

initApp();

window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  hideSplash();
});
