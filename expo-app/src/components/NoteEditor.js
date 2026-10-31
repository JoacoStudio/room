import React, { useRef, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';

import { evaluate, formatResult } from '../utils/arithmetic';

/**
 * Crea un PanResponder para el editor de notas.
 *
 * Reglas:
 * - Toque corto (< 10px): NO captura, va al TextInput (escribir / seleccionar)
 * - Swipe horizontal (izquierda/derecha): navega entre notas
 * - Swipe hacia abajo: cierra el teclado
 * - Swipe hacia arriba: se deja al texto (scroll)
 */
function makeEditorSwipeResponder({
  onSwipeLeft,
  onSwipeRight,
  onCloseKeyboard,
  atFirst,
  atLast,
}) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      return Math.abs(dx) > 10 || Math.abs(dy) > 10;
    },
    onPanResponderGrant: (e, gestureState) => {
      gestureState._axis = null;
      gestureState._startTime = Date.now();
      gestureState._moved = false;
      gestureState._cancelled = false;
    },
    onPanResponderMove: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      const now = Date.now();

      if (gestureState._axis === null) {
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
        if (now - gestureState._startTime > 350) {
          gestureState._cancelled = true;
          return;
        }
        gestureState._axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
        gestureState._moved = true;
      }

      if (gestureState._axis === 'x' || (gestureState._axis === 'y' && dy > 0)) {
        e.preventDefault();
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (!gestureState._moved || gestureState._cancelled) return;

      const dx = gestureState.dx;
      const dy = gestureState.dy;
      const elapsed = Math.max(1, Date.now() - gestureState._startTime);

      if (gestureState._axis === 'x') {
        const velocity = Math.abs(dx) / elapsed;
        const minPx = 120;
        const thresholdPct = 0.25;
        const velocityThreshold = 0.45;
        const width = 300;
        const passed =
          Math.abs(dx) > Math.min(minPx, width * thresholdPct) || velocity > velocityThreshold;

        if (dx < 0) {
          if (passed && !atLast && typeof onSwipeLeft === 'function') {
            onSwipeLeft();
          }
        } else if (dx > 0) {
          if (passed && !atFirst && typeof onSwipeRight === 'function') {
            onSwipeRight();
          }
        }
      } else if (gestureState._axis === 'y' && dy > 0) {
        const velocity = Math.abs(dy) / elapsed;
        const passedY = Math.abs(dy) > 60 || velocity > 0.4;
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
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.editorWrap} {...swipeResponder.panHandlers}>
        <TextInput
          ref={inputRef}
          style={styles.editor}
          value={note}
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
    </KeyboardAvoidingView>
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
