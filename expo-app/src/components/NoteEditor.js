import React, { useRef, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  PanResponder,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';

import { evaluate, formatResult } from '../utils/arithmetic';

/**
 * Crea un PanResponder para el editor de notas.
 * El responder vive en un View envolvente alrededor del TextInput.
 * Toques cortos (< 14px) dejan que el TextInput maneje el evento (escribir / seleccionar).
 * Swipes horizontales navegan entre notas. Swipe hacia abajo cierra el teclado.
 */
function makeEditorSwipeResponder({
  onSwipeLeft,
  onSwipeRight,
  onCloseKeyboard,
  atFirst,
  atLast,
}) {
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const axisRef = useRef(null);

  return PanResponder.create({
    onStartShouldSetPanResponder: (e, gs) => false,
    onMoveShouldSetPanResponder: (e, gs) => {
      const dx = Math.abs(gs.dx);
      const dy = Math.abs(gs.dy);
      return dx > 14 || dy > 14;
    },
    onPanResponderGrant: (e, gs) => {
      startRef.current = { x: 0, y: 0, time: Date.now() };
      axisRef.current = null;
      gs._axis = null;
      gs._moved = false;
      gs._startTime = Date.now();
      gs._cancelled = false;
    },
    onPanResponderMove: (e, gs) => {
      const dx = gs.dx;
      const dy = gs.dy;
      const now = Date.now();

      if (gs._axis === null) {
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
        if (now - gs._startTime > 350) {
          gs._cancelled = true;
          return;
        }
        gs._axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        gs._moved = true;
      }

      if (gs._axis === 'x') {
        e.preventDefault();
      }
    },
    onPanResponderRelease: (e, gs) => {
      if (!gs._moved || gs._cancelled) return;

      const dx = gs.dx;
      const dy = gs.dy;
      const elapsed = Math.max(1, Date.now() - gs._startTime);

      if (gs._axis === 'x') {
        const velocity = Math.abs(dx) / elapsed;
        const minPx = 120;
        const thresholdPct = 0.25;
        const velocityThreshold = 0.45;
        const width = 300;
        const passed =
          Math.abs(dx) > Math.min(minPx, width * thresholdPct) ||
          velocity > velocityThreshold;

        if (dx < 0) {
          if (passed && !atLast && typeof onSwipeLeft === 'function') {
            onSwipeLeft();
          }
        } else if (dx > 0) {
          if (passed && !atFirst && typeof onSwipeRight === 'function') {
            onSwipeRight();
          }
        }
      } else if (gs._axis === 'y' && dy > 0) {
        const velocityY = Math.abs(dy) / elapsed;
        const passedY = Math.abs(dy) > 60 || velocityY > 0.4;
        if (passedY && typeof onCloseKeyboard === 'function') {
          onCloseKeyboard();
        }
      }
    },
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => false,
  });
}

export default function NoteEditor({
  note,
  onChange,
  readOnly,
  onSwipeLeft,
  onSwipeRight,
  atFirst,
  atLast,
}) {
  const inputRef = useRef(null);
  const { height: windowHeight } = useWindowDimensions();

  const swipeResponder = useMemo(() => {
    return makeEditorSwipeResponder({
      onSwipeLeft,
      onSwipeRight,
      onCloseKeyboard: () => Keyboard.dismiss(),
      atFirst,
      atLast,
    });
  }, [onSwipeLeft, onSwipeRight, atFirst, atLast]);

  const checkArithmetic = useCallback((text) => {
    if (!text) return;
    const lines = text.split('\n');
    const lastLine = lines[lines.length - 1];
    const trimmed = lastLine.trimEnd();

    if (!trimmed.endsWith('=')) return;

    const expr = trimmed.slice(0, -1).trim();
    if (!expr) return;

    try {
      const result = evaluate(expr);
      const formatted = formatResult(result);
      const newLines = [...lines];
      newLines[newLines.length - 1] = lastLine.replace(/=\s*$/, `= ${formatted}`);
      onChange(newLines.join('\n'));
    } catch (_err) {
      // No es expresión válida: se deja tal cual
    }
  }, [onChange]);

  const handleChangeText = useCallback((text) => {
    onChange(text);
    checkArithmetic(text);
  }, [onChange, checkArithmetic]);

  return (
    <View style={styles.container}>
      <View
        style={[styles.editorWrap, { maxHeight: Math.round(windowHeight * 0.6) }]}
        {...swipeResponder.panHandlers}
      >
        <TextInput
          ref={inputRef}
          style={styles.editor}
          value={note || ''}
          onChangeText={handleChangeText}
          editable={!readOnly}
          multiline
          numberOfLines={24}
          spellCheck={false}
          autoCapitalize="none"
          autoCorrect={false}
          placeholder="Escribe aquí..."
          placeholderTextColor="#999999"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  editorWrap: {
    flex: 1,
  },
  editor: {
    flex: 1,
    fontSize: 20,
    color: '#000000',
    backgroundColor: 'transparent',
    padding: 16,
    textAlignVertical: 'top',
  },
});
