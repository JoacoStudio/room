import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StatusBar,
  PanResponder,
} from 'react-native';
import { Haptics } from 'expo-haptics';

import {
  loadNotes,
  saveNotes,
  getSavedIndex,
  saveActiveIndex,
} from './src/hooks/useNotes';
import { useTheme } from './src/hooks/useTheme';
import NoteEditor from './src/components/NoteEditor';
import ActionSheet from './src/components/ActionSheet';
import HelpModal from './src/components/HelpModal';
import UndoToast from './src/components/UndoToast';
import { StatusBarHandle } from './src/components/StatusBarHint';

/**
 * PanelResponder para la zona superior (swipe ↓ = nueva nota).
 */
function makeTopZoneResponder({ onPullDown }) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gs) => Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10,
    onPanResponderGrant: (e, gs) => {
      gs._axis = null;
      gs._moved = false;
      gs._startTime = Date.now();
    },
    onPanResponderMove: (e, gs) => {
      const dx = gs.dx;
      const dy = gs.dy;
      if (gs._axis === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        gs._axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
        gs._moved = true;
      }
      if (gs._axis === 'y') e.preventDefault();
    },
    onPanResponderRelease: (e, gs) => {
      const dy = gs.dy;
      const elapsed = Math.max(1, Date.now() - gs._startTime);
      const velocity = Math.abs(dy) / elapsed;
      if (gs._axis === 'y' && (dy > 50 || (dy > 30 && velocity > 0.4))) {
        if (typeof onPullDown === 'function') onPullDown();
      }
    },
  });
}

/**
 * PanResponder para la barra inferior (swipe ↑ = hoja, ↓ = nueva nota, horizontal = navegar).
 */
function makeBarResponder({
  onPullUp,
  onPullDown,
  onSwipeLeft,
  onSwipeRight,
}) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gs) => Math.abs(gs.dx) > 10 || Math.abs(gs.dy) > 10,
    onPanResponderGrant: (e, gs) => {
      gs._axis = null;
      gs._moved = false;
      gs._startTime = Date.now();
    },
    onPanResponderMove: (e, gs) => {
      const dx = gs.dx;
      const dy = gs.dy;
      if (gs._axis === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        gs._axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
        gs._moved = true;
      }
      if (gs._axis === 'y') e.preventDefault();
    },
    onPanResponderRelease: (e, gs) => {
      const dx = gs.dx;
      const dy = gs.dy;
      const elapsed = Math.max(1, Date.now() - gs._startTime);
      const velocityY = Math.abs(dy) / elapsed;
      const velocityX = Math.abs(dx) / elapsed;

      if (gs._axis === 'x' && Math.abs(dx) > 40 && velocityX > 0.45) {
        if (dx < 0) {
          onSwipeLeft();
        } else {
          onSwipeRight();
        }
        return;
      }

      if (gs._axis === 'y' && (Math.abs(dy) > 40 || velocityY > 0.4)) {
        if (dy < 0) {
          onPullUp();
        } else {
          onPullDown();
        }
      }
    },
  });
}

export default function App() {
  const [notes, setNotes] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [noteText, setNoteText] = useState('');
  const [readOnly, setReadOnly] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [undoVisible, setUndoVisible] = useState(false);
  const [deletedNote, setDeletedNote] = useState(null);
  const [deletedIndex, setDeletedIndex] = useState(-1);
  const [deletedPlaceholderId, setDeletedPlaceholderId] = useState(null);
  const [hint, setHint] = useState('');
  const [hintOpacity, setHintOpacity] = useState(1);
  const [hintTimer, setHintTimer] = useState(null);

  const { resolved } = useTheme();

  // Cargar notas y tema al iniciar
  useEffect(() => {
    let mounted = true;

    async function init() {
      const loadedNotes = await loadNotes();
      if (!mounted) return;
      setNotes(loadedNotes);
      const idx = await getSavedIndex(loadedNotes);
      if (!mounted) return;
      setActiveIndex(idx);
      if (loadedNotes.length > 0) {
        setNoteText(loadedNotes[idx].body || '');
      }
    }

    init();

    StatusBar.setBarStyle('dark-content');
    return () => { mounted = false; };
  }, []);

  // Guardar al desmontar
  useEffect(() => {
    return () => {
      if (notes[activeIndex] && !readOnly) {
        const updated = [...notes];
        updated[activeIndex] = { ...updated[activeIndex], body: noteText, updated: Date.now() };
        setNotes(updated);
        saveNotes(updated);
        saveActiveIndex(activeIndex);
      }
    };
  }, [activeIndex, noteText, readOnly, notes]);

  // Inicializar hint después de cargar notas
  useEffect(() => {
    if (notes.length === 0) return;
    const t = setTimeout(() => {
      const total = notes.length;
      const current = activeIndex + 1;
      const ro = readOnly ? ' · lectura' : '';
      setHint(`${current} / ${total} · ← → notas · ↓ nueva · ↑ acciones${ro}`);
      setHintOpacity(0.45);
    }, 0);
    return () => clearTimeout(t);
  }, [notes.length, activeIndex, readOnly]);

  const saveActive = useCallback(() => {
    if (!readOnly) {
      const updated = [...notes];
      updated[activeIndex] = { ...updated[activeIndex], body: noteText, updated: Date.now() };
      setNotes(updated);
      saveNotes(updated);
    }
  }, [noteText, readOnly, activeIndex, notes]);

  const debouncedSave = useCallback(() => {
    if (window._roomSaveTimer) clearTimeout(window._roomSaveTimer);
    window._roomSaveTimer = setTimeout(saveActive, 800);
  }, [saveActive]);

  const showTransient = useCallback((text, ms = 5000) => {
    if (hintTimer) clearTimeout(hintTimer);
    setHint(text);
    setHintOpacity(1);
    const t = setTimeout(() => {
      const total = notes.length;
      const current = activeIndex + 1;
      const ro = readOnly ? ' · lectura' : '';
      setHint(`${current} / ${total} · ← → notas · ↓ nueva · ↑ acciones${ro}`);
      setHintOpacity(0.45);
    }, ms);
    setHintTimer(t);
  }, [hintTimer, notes.length, activeIndex, readOnly]);

  const loadNote = useCallback((index) => {
    if (index < 0 || index >= notes.length) return;
    setActiveIndex(index);
    saveActiveIndex(index);
    const n = notes[index];
    setNoteText(n.body || '');
    const total = notes.length;
    const current = index + 1;
    const ro = readOnly ? ' · lectura' : '';
    setHint(`${current} / ${total} · ← → notas · ↓ nueva · ↑ acciones${ro}`);
    setHintOpacity(0.45);
  }, [notes, readOnly]);

  const createNote = useCallback(() => {
    saveActive();
    const newNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: '',
      body: '',
      updated: Date.now(),
    };
    const updated = [...notes, newNote];
    setNotes(updated);
    saveNotes(updated);
    setActiveIndex(updated.length - 1);
    setNoteText('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    showTransient('Nueva nota', 3000);
  }, [notes, saveActive, showTransient]);

  const goNext = useCallback(() => {
    saveActive();
    const next = activeIndex < notes.length - 1 ? activeIndex + 1 : 0;
    loadNote(next);
  }, [activeIndex, notes.length, saveActive, loadNote]);

  const goPrev = useCallback(() => {
    saveActive();
    const prev = activeIndex > 0 ? activeIndex - 1 : notes.length - 1;
    loadNote(prev);
  }, [activeIndex, notes.length, saveActive, loadNote]);

  const deleteNote = useCallback(() => {
    saveActive();
    if (notes.length === 0) return;
    const removed = notes.splice(activeIndex, 1)[0];
    setDeletedNote(removed);
    setDeletedIndex(activeIndex);
    const updated = [...notes];
    setNotes(updated);
    saveNotes(updated);

    if (updated.length === 0) {
      const placeholder = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        title: '',
        body: '',
        updated: Date.now(),
      };
      const withPlaceholder = [...updated, placeholder];
      setNotes(withPlaceholder);
      saveNotes(withPlaceholder);
      setDeletedPlaceholderId(placeholder.id);
      setActiveIndex(0);
      setNoteText('');
    } else if (activeIndex >= updated.length) {
      const newIdx = updated.length - 1;
      setActiveIndex(newIdx);
      setNoteText(updated[newIdx].body || '');
    }
    setUndoVisible(true);
    setTimeout(() => setUndoVisible(false), 5000);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    showTransient('Nota eliminada', 5000);
  }, [notes, activeIndex, saveActive, showTransient]);

  const undoDelete = useCallback(() => {
    if (!deletedNote) return;
    const restored = deletedNote;
    const idx = deletedIndex;
    const phId = deletedPlaceholderId;

    setUndoVisible(false);
    setDeletedNote(null);
    setDeletedIndex(-1);
    setDeletedPlaceholderId(null);

    let working = [...notes];
    if (phId) {
      const phIdx = working.findIndex((n) => n.id === phId);
      if (phIdx !== -1 && !working[phIdx].body && !working[phIdx].title) {
        working.splice(phIdx, 1);
      }
    }
    working.splice(Math.min(idx, working.length), 0, restored);
    setNotes(working);
    saveNotes(working);
    setActiveIndex(Math.min(idx, working.length - 1));
    setNoteText(working[Math.min(idx, working.length - 1)]?.body || '');
    showTransient('Nota restaurada', 3000);
  }, [deletedNote, deletedIndex, deletedPlaceholderId, notes, showTransient]);

  const toggleReadOnly = useCallback(() => {
    setReadOnly((prev) => {
      const next = !prev;
      showTransient(next ? 'Solo lectura · desliza ↑ para acciones' : 'Edición activada', 3000);
      return next;
    });
  }, [showTransient]);

  const openSheet = useCallback(() => setSheetOpen(true), []);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const handleSheetAction = useCallback((action) => {
    closeSheet();
    switch (action) {
      case 'new': createNote(); break;
      case 'delete': deleteNote(); break;
      case 'export-one': showTransient('Exportar nota', 3000); break;
      case 'export-all': showTransient('Exportar todas', 3000); break;
      case 'import': showTransient('Importar', 3000); break;
      case 'readonly': toggleReadOnly(); break;
      case 'help': setHelpOpen(true); break;
    }
  }, [closeSheet, createNote, deleteNote, toggleReadOnly, showTransient]);

  const handleSwipeLeft = useCallback(() => goNext(), [goNext]);
  const handleSwipeRight = useCallback(() => goPrev(), [goPrev]);

  const handlePullDownFromTop = useCallback(() => createNote(), [createNote]);
  const handlePullUpFromBar = useCallback(() => openSheet(), [openSheet]);
  const handlePullDownFromBar = useCallback(() => createNote(), [createNote]);

  const atFirst = activeIndex === 0;
  const atLast = activeIndex === notes.length - 1;
  const isDark = resolved === 'dark';

  const topZoneResponder = useMemo(() => {
    return makeTopZoneResponder({ onPullDown: handlePullDownFromTop });
  }, [handlePullDownFromTop]);

  const barResponder = useMemo(() => {
    return makeBarResponder({
      onPullUp: handlePullUpFromBar,
      onPullDown: handlePullDownFromBar,
      onSwipeLeft: handleSwipeLeft,
      onSwipeRight: handleSwipeRight,
    });
  }, [handlePullUpFromBar, handlePullDownFromBar, handleSwipeLeft, handleSwipeRight]);

  return (
    <View style={[isDark ? styles.dark.container : styles.light.container, { flex: 1 }]}>
      <StatusBar style={isDark ? 'light-content' : 'dark-content'} />

      {/* Zona superior */}
      <View
        style={[isDark ? styles.dark.topZone : styles.light.topZone, { height: 56 }]}
        {...topZoneResponder.panHandlers}
      />

      {/* Editor de nota */}
      <NoteEditor
        note={noteText}
        onChange={(text) => {
          setNoteText(text);
          debouncedSave();
        }}
        readOnly={readOnly}
        onSwipeLeft={handleSwipeLeft}
        onSwipeRight={handleSwipeRight}
        atFirst={atFirst}
        atLast={atLast}
      />

      {/* Barra inferior con hint y handle */}
      <View
        style={[isDark ? styles.dark.statusBar : styles.light.statusBar, { paddingBottom: 24 }]}
        {...barResponder.panHandlers}
      >
        <Text style={[isDark ? styles.dark.hint : styles.light.hint, { opacity: hintOpacity }]}>
          {hint}
        </Text>
        <StatusBarHandle onTap={openSheet} />
      </View>

      {/* Hoja de acciones */}
      <ActionSheet
        visible={sheetOpen}
        onClose={closeSheet}
        isReadOnly={readOnly}
        onAction={handleSheetAction}
      />

      {/* Ayuda */}
      <HelpModal visible={helpOpen} onClose={() => setHelpOpen(false)} />

      {/* Deshacer */}
      <UndoToast visible={undoVisible} onUndo={undoDelete} onHide={() => {}} />
    </View>
  );
}

const baseStyles = {
  container: { flex: 1 },
  topZone: {},
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
  },
  hint: {
    fontSize: 11,
    marginBottom: 4,
  },
};

const styles = {
  light: {
    ...baseStyles,
    container: { ...baseStyles.container, backgroundColor: '#ffffff' },
    hint: { ...baseStyles.hint, color: '#666666' },
  },
  dark: {
    ...baseStyles,
    container: { ...baseStyles.container, backgroundColor: '#000000' },
    hint: { ...baseStyles.hint, color: '#888888' },
  },
};
