const note = document.getElementById('note');
const clock = document.getElementById('clock');
const modeIndicator = document.getElementById('modeIndicator');
const fileInput = document.getElementById('fileInput');
const splashOverlay = document.getElementById('splashOverlay');
const helpToggle = document.getElementById('help-toggle');
const helpPanel = document.getElementById('help-panel');
const helpNotesList = document.getElementById('help-notes-list');
const helpNotesEmpty = document.getElementById('help-notes-empty');

const STORAGE_KEY = 'minimalist_notes';
const ACTIVE_KEY = 'room_active_index';
const THEME_KEY = 'room_theme';
const THEMES = ['dark', 'light'];

let notes = [];
let activeIndex = 0;
let typingTimer = null;
let saveTimer = null;
let modeTimer = null;
let isReadOnly = false;
let clockInterval = null;
let currentTheme = 'light';
let fontSize = 22;

const isCoarse = window.matchMedia('(pointer: coarse)').matches;
if (isCoarse) fontSize = 20;

/* ---------- Persistencia local (localStorage) ---------- */

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
  } catch (e) {}
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

/* ---------- Reloj ---------- */

function updateClock() {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, '0');
  const m = String(now.getMinutes()).padStart(2, '0');
  const s = String(now.getSeconds()).padStart(2, '0');
  clock.textContent = `${h}:${m}:${s}`;
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

/* ---------- Tema ---------- */

function applyTheme(theme) {
  currentTheme = theme;
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {}

  document.body.classList.remove('dark-mode');

  if (theme === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

function toggleTheme() {
  const idx = THEMES.indexOf(currentTheme);
  const next = THEMES[(idx + 1) % THEMES.length];
  applyTheme(next);
  const labels = { dark: 'oscuro', light: 'claro' };
  showModeIndicator(`Modo: ${labels[next]}`);
}

function showModeIndicator(text) {
  clearTimeout(modeTimer);
  clock.style.opacity = '0';
  setTimeout(() => {
    clock.style.display = 'none';
  }, 300);

  modeIndicator.textContent = text;
  modeIndicator.style.display = 'block';
  modeIndicator.offsetHeight; // forzar reflow
  modeIndicator.style.opacity = '1';

  modeTimer = setTimeout(() => {
    modeIndicator.style.opacity = '0';
    setTimeout(() => {
      modeIndicator.style.display = 'none';
      clock.style.display = 'block';
      clock.style.opacity = '1';
    }, 300);
  }, 2000);
}

function showShortcutIndicator(text) {
  clearTimeout(modeTimer);
  clock.style.opacity = '0';
  setTimeout(() => { clock.style.display = 'none'; }, 300);

  modeIndicator.textContent = text;
  modeIndicator.style.display = 'block';
  modeIndicator.offsetHeight; // forzar reflow
  modeIndicator.style.opacity = '1';

  modeTimer = setTimeout(() => {
    modeIndicator.style.opacity = '0';
    setTimeout(() => {
      modeIndicator.style.display = 'none';
      clock.style.display = 'block';
      clock.style.opacity = '1';
    }, 300);
  }, 2000);
}

/* ---------- Tamaño de letra ---------- */

function applyFontSize() {
  note.style.fontSize = fontSize + 'px';
  try {
    localStorage.setItem('room_font_size', String(fontSize));
  } catch (e) {}
}

function increaseFontSize() {
  if (fontSize < 32) {
    fontSize += 2;
    applyFontSize();
    showShortcutIndicator('Tamaño ' + fontSize + 'px');
  }
}

function decreaseFontSize() {
  if (fontSize > 16) {
    fontSize -= 2;
    applyFontSize();
    showShortcutIndicator('Tamaño ' + fontSize + 'px');
  }
}

/* ---------- Panel de ayuda (clic en ralla) ---------- */

function openHelpPanel() {
  helpPanel.classList.add('open');
  helpToggle.setAttribute('aria-expanded', 'true');
  renderHelpNotes();
}

function closeHelpPanel() {
  helpPanel.classList.remove('open');
  helpToggle.setAttribute('aria-expanded', 'false');
}

function toggleHelpPanel() {
  if (helpPanel.classList.contains('open')) {
    closeHelpPanel();
  } else {
    openHelpPanel();
  }
}

helpToggle.addEventListener('click', (e) => {
  e.preventDefault();
  e.stopPropagation();
  toggleHelpPanel();
});

const backdrop = helpPanel.querySelector('.help-panel-backdrop');
if (backdrop) {
  backdrop.addEventListener('click', () => {
    closeHelpPanel();
  });
}

/* ---------- Panel: lista de notas ---------- */

function renderHelpNotes() {
  helpNotesList.innerHTML = '';

  if (notes.length === 0) {
    helpNotesEmpty.style.display = 'block';
    return;
  }

  helpNotesEmpty.style.display = 'none';

  notes.forEach((n, index) => {
    const item = document.createElement('li');
    item.className = 'help-note-item' + (index === activeIndex ? ' active' : '');
    item.setAttribute('role', 'button');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', `Nota ${index + 1}`);

    const lineas = (n.body || '').split('\n');
    const titleText = lineas[0] || 'Sin título';
    const cuerpoRestante = lineas.slice(1).join(' ').trim();

    const title = document.createElement('div');
    title.className = 'help-note-title';
    title.textContent = titleText;

    const preview = document.createElement('div');
    preview.className = 'help-note-preview';
    preview.textContent = cuerpoRestante ? cuerpoRestante.slice(0, 60) + (cuerpoRestante.length > 60 ? '…' : '') : '';

    item.appendChild(title);
    item.appendChild(preview);

    item.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      selectHelpNote(index);
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        selectHelpNote(index);
      }
    });

    helpNotesList.appendChild(item);
  });
}

function selectHelpNote(index) {
  if (index < 0 || index >= notes.length) return;
  loadNote(index, true);
  closeHelpPanel();
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
  const trimmed = val.trimEnd();

  if (!trimmed.endsWith('=')) return;

  const lines = val.split('\n');
  const lastIdx = lines.length - 1;
  const lastLine = lines[lastIdx];
  const expr = lastLine.trimEnd().slice(0, -1).trim();

  if (!expr) return;

  try {
    const result = evaluate(expr);
    const formatted = formatResult(result);
    lines[lastIdx] = lastLine.replace(/=\s*$/, `= ${formatted}`);
    note.value = lines.join('\n');
    note.setSelectionRange(note.value.length, note.value.length);
  } catch (err) {
    // No es una expresión aritmética válida: se deja tal cual
  }
}

/* ---------- Import / Export ---------- */

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

function exportOneNote() {
  const text = note.value || '';
  const filename = `nota-${Date.now()}.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, filename);
}

function exportAllNotes() {
  const data = JSON.stringify(notes, null, 2);
  const filename = `room-respaldo-${Date.now()}.json`;
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  downloadBlob(blob, filename);
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
          loadNote(0);
        }
      } else {
        notes.push({
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, '') || 'Sin título',
          body: content,
          updated: Date.now()
        });
        saveNotes();
        loadNote(notes.length - 1);
      }
    } catch (err) {}
    fileInput.value = '';
  };
  reader.readAsText(file);
});

/* ---------- Navegación de notas ---------- */

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
  }
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
  saveTimer = setTimeout(saveActive, 400);
}

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
}

function deleteNote() {
  saveActive();
  if (notes.length === 0) return;
  notes.splice(activeIndex, 1);
  saveNotes();
  if (notes.length === 0) {
    notes.push({ id: Date.now().toString(), title: '', body: '', updated: Date.now() });
    saveNotes();
    activeIndex = 0;
  } else if (activeIndex >= notes.length) {
    activeIndex = notes.length - 1;
  }
  loadNote(activeIndex, true);
}

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
  note.focus();
}

/* ---------- Atajos de teclado (sin UI visible) ---------- */

document.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();

  if (key === 'escape' && helpPanel.classList.contains('open')) {
    e.preventDefault();
    closeHelpPanel();
    return;
  }

  if (e.altKey && key === 'n') {
    e.preventDefault();
    createNote();
    showShortcutIndicator('Nueva nota');
    return;
  }

  if (e.altKey && key === 'b') {
    e.preventDefault();
    deleteNote();
    showShortcutIndicator('Eliminar nota');
    return;
  }

  if (e.altKey && (key === 'arrowleft' || key === 'left')) {
    e.preventDefault();
    goPrev();
    showShortcutIndicator('Nota anterior');
    return;
  }

  if (e.altKey && (key === 'arrowright' || key === 'right')) {
    e.preventDefault();
    goNext();
    showShortcutIndicator('Siguiente nota');
    return;
  }

  if (e.altKey && key === 'q') {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      showShortcutIndicator('Pantalla completa');
    } else {
      document.exitFullscreen();
      showShortcutIndicator('Ventana normal');
    }
    return;
  }

  if (e.altKey && key === 'd') {
    e.preventDefault();
    exportOneNote();
    showShortcutIndicator('Exportar nota');
    return;
  }

  if (e.altKey && key === 'e') {
    e.preventDefault();
    exportAllNotes();
    showShortcutIndicator('Exportar todas');
    return;
  }

  if (e.altKey && key === 'i') {
    e.preventDefault();
    importNotes();
    showShortcutIndicator('Importar notas');
    return;
  }

  if (e.altKey && key === 'r') {
    e.preventDefault();
    toggleReadOnly();
    showShortcutIndicator(isReadOnly ? 'Solo lectura' : 'Edición');
    return;
  }

  if (e.altKey && key === 'o') {
    e.preventDefault();
    toggleTheme();
    return;
  }

  if (e.altKey && key === 'backspace') {
    e.preventDefault();
    if (!isCoarse) window.close();
    showShortcutIndicator('Cerrar');
  }

  if (e.altKey && key === 'v') {
    e.preventDefault();
    toggleHelpPanel();
    showShortcutIndicator(helpPanel.classList.contains('open') ? 'Notas' : 'Cerrado');
  }

  if (e.altKey && (key === '+' || key === '=')) {
    e.preventDefault();
    increaseFontSize();
    return;
  }

  if (e.altKey && key === '-') {
    e.preventDefault();
    decreaseFontSize();
    return;
  }
});

/* ---------- Eventos de la nota ---------- */

note.addEventListener('focus', () => {
  clearTimeout(modeTimer);
  clock.style.opacity = '0';
  setTimeout(() => { clock.style.display = 'none'; }, 300);
  modeIndicator.style.opacity = '0';
  setTimeout(() => { modeIndicator.style.display = 'none'; }, 300);
  closeHelpPanel();
});

note.addEventListener('input', () => {
  debouncedSave();
  checkArithmetic();
});

note.addEventListener('blur', () => {
  saveActive();
  clock.style.display = 'block';
  clock.style.opacity = '1';
  modeIndicator.style.display = 'none';
  modeIndicator.style.opacity = '0';
});

/* ---------- Ciclo de vida ---------- */

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    saveActive();
    stopClock();
  } else {
    startClock();
  }
});

window.addEventListener('beforeunload', saveActive);

startClock();

try {
  const saved = localStorage.getItem(THEME_KEY);
  if (saved && THEMES.includes(saved)) {
    applyTheme(saved);
  } else {
    applyTheme('light');
  }
} catch (e) {}

try {
  const savedSize = localStorage.getItem('room_font_size');
  if (savedSize) {
    fontSize = parseInt(savedSize, 10);
    if (isNaN(fontSize) || fontSize < 16 || fontSize > 32) {
      fontSize = isCoarse ? 20 : 22;
    }
  }
  applyFontSize();
} catch (e) {}

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

setTimeout(hideSplash, 1500);

loadNotes();
loadNote(getSavedIndex(), true);

window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  hideSplash();
});
