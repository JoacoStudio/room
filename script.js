const note = document.getElementById('note');
const hint = document.getElementById('hint');
const helpOverlay = document.getElementById('helpOverlay');
const clock = document.getElementById('clock');
const splashOverlay = document.getElementById('splashOverlay');
const fileInput = document.getElementById('fileInput');

const STORAGE_KEY = 'minimalist_notes';
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
  HELP: 'x'
};

// ⚠️ CONFIGURACIÓN DE SUPABASE
// Reemplaza con la URL real de tu proyecto Supabase.
// Puedes encontrarla en: https://app.supabase.com/project/_/settings/general
const SUPABASE_URL = 'https://TU_PROYECTO.supabase.co';

// ⚠️ ADVERTENCIA DE SEGURIDAD
// NUNCA subas claves reales a GitHub. Usa la "anon key" pública de Supabase.
// Obtén tu clave en: https://app.supabase.com/project/_/settings/api
const SUPABASE_KEY = 'TU_SUPABASE_ANON_KEY_AQUI';

let supabase = null;

function initSupabase() {
  try {
    if (!window.supabase || !SUPABASE_URL || SUPABASE_URL.includes('TU_PROYECTO') || SUPABASE_KEY.includes('TU_SUPABASE')) {
      return;
    }
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  } catch (e) {
    console.error('Error inicializando Supabase:', e);
    supabase = null;
  }
}

async function syncToSupabase() {
  if (!supabase) return;
  try {
    await supabase
      .from('notes')
      .upsert(notes.map(n => ({
        id: n.id,
        title: n.title || '',
        body: n.body || '',
        updated: n.updated,
        updated_at: new Date(n.updated || Date.now()).toISOString()
      })));
  } catch (e) {
    console.error('Error sincronizando con Supabase:', e);
  }
}

async function loadFromSupabase() {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error('Error cargando desde Supabase:', e);
    return [];
  }
}

function mergeRemoteNotes(remoteNotes) {
  if (!remoteNotes || remoteNotes.length === 0) return false;
  const remoteById = {};
  remoteNotes.forEach(n => { remoteById[n.id] = n; });

  let changed = false;
  notes.forEach(n => {
    if (remoteById[n.id]) {
      const remote = remoteById[n.id];
      const remoteUpdated = new Date(remote.updated || remote.updated_at || 0).getTime();
      const localUpdated = new Date(n.updated || 0).getTime();
      if (remoteUpdated > localUpdated) {
        n.body = remote.body || n.body;
        n.title = remote.title || n.title;
        n.updated = remoteUpdated;
        changed = true;
      }
      delete remoteById[n.id];
    }
  });

  Object.values(remoteById).forEach(n => {
    notes.push({
      id: n.id,
      title: n.title || '',
      body: n.body || '',
      updated: new Date(n.updated || n.updated_at || Date.now()).getTime()
    });
    changed = true;
  });

  return changed;
}

let notes = [];
let activeIndex = 0;
let hintTimer = null;
let typingTimer = null;
let saveTimer = null;
let isReadOnly = false;
let clockInterval = null;
let supabaseReady = false;

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

  if (supabase) {
    loadFromSupabase().then(remoteNotes => {
      if (remoteNotes && remoteNotes.length > 0) {
        const changed = mergeRemoteNotes(remoteNotes);
        if (changed) {
          saveNotes();
          loadNote(activeIndex >= notes.length ? notes.length - 1 : activeIndex);
        }
      }
      supabaseReady = true;
    }).catch(() => {
      supabaseReady = true;
    });
  } else {
    supabaseReady = true;
  }
}

function saveNotes() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
  } catch (e) {
    showStatus('No se pudo guardar en almacenamiento local', 'error');
  }
  if (supabase && supabaseReady) {
    syncToSupabase();
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

const hour = new Date().getHours();
if (hour >= 20 || hour < 8) {
  document.body.classList.add('dark-mode');
}

startClock();

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    stopClock();
  } else {
    startClock();
  }
});

function loadNote(index) {
  if (index < 0 || index >= notes.length) return;
  activeIndex = index;
  note.value = notes[activeIndex].body || '';
  note.readOnly = isReadOnly;
  note.focus();
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

function showShortcutHint() {
  const total = notes.length;
  const current = activeIndex + 1;
  const readOnlyText = isReadOnly ? '  ·  Solo lectura' : '';
  hint.textContent = `Nota ${current} de ${total}  ·  Alt+N nueva  ·  Alt+B eliminar  ·  Alt+← → cambiar  ·  Alt+Q pantalla  ·  Alt+D exportar  ·  Alt+E exportar todo  ·  Alt+I importar  ·  Alt+R lectura${readOnlyText}`;
  hint.style.opacity = '1';
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    hint.style.opacity = '0';
  }, 5000);
}

function showTypingStats() {
  const text = note.value || '';
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const chars = text.length;
  hint.textContent = `${words} palabras · ${chars} caracteres`;
  hint.style.opacity = '1';
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    hint.style.opacity = '0';
  }, 5000);
}

function showStatus(text, type = 'info') {
  hint.textContent = text;
  hint.style.opacity = '1';
  clearTimeout(hintTimer);
  hintTimer = setTimeout(() => {
    hint.style.opacity = '0';
  }, 5000);
}

function exportOneNote() {
  const text = note.value || '';
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nota-${Date.now()}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showShortcutHint();
}

function exportAllNotes() {
  const data = JSON.stringify(notes, null, 2);
  const blob = new Blob([data], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `room-respaldo-${Date.now()}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showShortcutHint();
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
          notes = imported.map(n => ({
            id: n.id || Date.now().toString(),
            title: n.title || '',
            body: n.body || '',
            updated: n.updated || Date.now()
          }));
          saveNotes();
          activeIndex = 0;
          loadNote(0);
          showStatus(`${notes.length} notas importadas`);
        } else {
          showStatus('Archivo JSON vacío o inválido', 'error');
        }
      } else {
        notes.push({
          id: Date.now().toString(),
          title: file.name.replace(/\.[^/.]+$/, '') || 'Sin título',
          body: content,
          updated: Date.now()
        });
        saveNotes();
        activeIndex = notes.length - 1;
        loadNote(activeIndex);
        showShortcutHint();
      }
    } catch (err) {
      showStatus('Error al importar el archivo', 'error');
    }
  };
  reader.readAsText(file);
});

note.addEventListener('input', () => {
  debouncedSave();
  clearTimeout(typingTimer);
  typingTimer = setTimeout(showTypingStats, 2000);
});

note.addEventListener('blur', saveActive);

document.addEventListener('keydown', (e) => {
  if (e.altKey && e.key === KEYS.NEW) {
    e.preventDefault();
    const newNote = { id: Date.now().toString(), title: '', body: '', updated: Date.now() };
    notes.push(newNote);
    saveNotes();
    activeIndex = notes.length - 1;
    note.value = '';
    note.focus();
    showShortcutHint();
  }

  if (e.altKey && e.key === KEYS.DELETE) {
    e.preventDefault();
    saveActive();
    notes.splice(activeIndex, 1);
    saveNotes();
    if (notes.length === 0) {
      notes.push({ id: Date.now().toString(), title: '', body: '', updated: Date.now() });
      saveNotes();
      activeIndex = 0;
    } else if (activeIndex >= notes.length) {
      activeIndex = notes.length - 1;
    }
    loadNote(activeIndex);
  }

  if (e.altKey && (e.key === KEYS.PREV || e.key === KEYS.NEXT)) {
    e.preventDefault();
    if (e.key === KEYS.PREV) {
      loadNote(activeIndex > 0 ? activeIndex - 1 : notes.length - 1);
    } else {
      loadNote(activeIndex < notes.length - 1 ? activeIndex + 1 : 0);
    }
  }

  if (e.altKey && e.key === KEYS.FULLSCREEN) {
    e.preventDefault();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  if (e.altKey && e.key === KEYS.EXPORT_ONE) {
    e.preventDefault();
    exportOneNote();
  }

  if (e.altKey && e.key === KEYS.EXPORT_ALL) {
    e.preventDefault();
    exportAllNotes();
  }

  if (e.altKey && e.key === KEYS.IMPORT) {
    e.preventDefault();
    importNotes();
  }

  if (e.altKey && e.key === KEYS.READONLY) {
    e.preventDefault();
    isReadOnly = !isReadOnly;
    note.readOnly = isReadOnly;
    note.focus();
    showShortcutHint();
  }

  if (e.altKey && e.key === KEYS.HELP) {
    e.preventDefault();
    const isVisible = helpOverlay.style.display === 'flex';
    helpOverlay.style.display = isVisible ? 'none' : 'flex';
    if (!isVisible) {
      note.blur();
    } else {
      note.focus();
    }
  }

  if (helpOverlay.style.display === 'flex' && !e.altKey) {
    e.preventDefault();
    helpOverlay.style.display = 'none';
    note.focus();
  }
});

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

// Inicializar todo con protección contra errores
function initApp() {
  try {
    initSupabase();
    loadNotes();
    loadNote(0);
  } catch (e) {
    console.error('Error inicializando app:', e);
  }
}

// Siempre ocultar el splash después de 2.5 segundos, pase lo que pase
setTimeout(hideSplash, 2500);

initApp();

// También ocultar splash si hay algún error global
window.addEventListener('error', (e) => {
  console.error('Error global:', e.error);
  hideSplash();
});
