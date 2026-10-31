import React, { useRef, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  PanResponder,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';

import { evaluate, formatResult } from '../utils/arithmetic';

/**
 * Crea un PanResponder para swipe horizontal sobre el editor.
 * Usa la capture phase para interceptar el gesto ANTES que el TextInput,
 * de modo que los deslizamientos horizontales naveguen y los toques cortos
 * sigan escribiendo/seleccionando texto normalmente.
 */
function makeEditorSwipeResponder({ onSwipeLeft, onSwipeRight, atFirst, atLast }) {
  return PanResponder.create({
    onStartShouldSetPanResponderCapture: () => false,
    onMoveShouldSetPanResponderCapture: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      // Capturar solo si el movimiento es claramente horizontal
      return Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.25;
    },
    onPanResponderGrant: (e, gestureState) => {
      gestureState._axis = 'x';
      gestureState._startTime = Date.now();
      gestureState._moved = false;
      gestureState._cancelled = false;
    },
    onPanResponderMove: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      const now = Date.now();

      if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
      if (now - gestureState._startTime > 350) {
        gestureState._cancelled = true;
        return;
      }
      if (!gestureState._moved) {
        gestureState._moved = true;
        e.preventDefault();
      } else {
        e.preventDefault();
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      if (!gestureState._moved || gestureState._cancelled) return;

      const dx = gestureState.dx;
      const elapsed = Math.max(1, Date.now() - gestureState._startTime);
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
    return makeEditorSwipeResponder({ onSwipeLeft, onSwipeRight, atFirst, atLast });
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
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
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
    </TouchableWithoutFeedback>
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
