import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'minimalist_notes';
const ACTIVE_KEY = 'room_active_index';
const THEME_KEY = 'room_theme';
const THEMES = ['auto', 'dark', 'light'];

export { STORAGE_KEY, ACTIVE_KEY, THEME_KEY, THEMES };

export function loadNotes() {
  return AsyncStorage.getItem(STORAGE_KEY).then((raw) => {
    let notes = [];
    try {
      notes = raw ? JSON.parse(raw) : [];
    } catch (_e) {
      notes = [];
    }
    if (!Array.isArray(notes) || notes.length === 0) {
      notes = [{ id: Date.now().toString(), title: '', body: '', updated: Date.now() }];
      saveNotes(notes);
    }
    return notes;
  });
}

export function saveNotes(notes) {
  return AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
}

export function getSavedIndex(notes) {
  return AsyncStorage.getItem(ACTIVE_KEY).then((raw) => {
    const value = parseInt(raw, 10);
    if (!Number.isFinite(value)) return 0;
    return Math.min(Math.max(value, 0), notes.length - 1);
  });
}

export function saveActiveIndex(index) {
  return AsyncStorage.setItem(ACTIVE_KEY, String(index));
}

export function loadTheme() {
  return AsyncStorage.getItem(THEME_KEY).then((saved) => {
    if (saved && THEMES.includes(saved)) return saved;
    return 'auto';
  });
}

export function saveTheme(theme) {
  return AsyncStorage.setItem(THEME_KEY, theme);
}

export function isNight() {
  const hour = new Date().getHours();
  return hour >= 20 || hour < 8;
}
