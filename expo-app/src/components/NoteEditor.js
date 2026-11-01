import React, { useRef, useCallback, useMemo } from 'react';
import {
  TextInput,
  View,
  StyleSheet,
  Platform,
  Keyboard,
  useWindowDimensions,
} from 'react-native';

import { evaluate, formatResult } from '../utils/arithmetic';

/**
 * Detecta gestos táctiles manualmente sobre el TextInput.
 * Permite escribir y seleccionar texto normalmente, pero detecta swipes
 * para navegar entre notas y cerrar el teclado.
 *
 * Reglas:
 * - Toque corto (< 10px): va al TextInput (escribir / seleccionar)
 * - Swipe horizontal (izquierda/derecha): navega entre notas
 * - Swipe hacia abajo: cierra el teclado
 */
function useEditorGestures({
  onSwipeLeft,
  onSwipeRight,
  onCloseKeyboard,
  atFirst,
  atLast,
}) {
  const startRef = useRef({ x: 0, y: 0, time: 0 });
  const axisRef = useRef(null); // 'x' | 'y' | null

  const onTouchStart = useCallback(
    (e) => {
      startRef.current = {
        x: e.nativeEvent.locationX,
        y: e.nativeEvent.locationY,
        time: Date.now(),
      };
      axisRef.current = null;
    },
    []
  );

  const onTouchMove = useCallback(
    (e) => {
      const dx = e.nativeEvent.locationX - startRef.current.x;
      const dy = e.nativeEvent.locationY - startRef.current.y;
      const now = Date.now();

      if (axisRef.current === null) {
        if (Math.abs(dx) < 14 && Math.abs(dy) < 14) return;
        if (now - startRef.current.time > 350) return;
        axisRef.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }

      if (axisRef.current === 'x') {
        e.preventDefault();
      }
    },
    []
  );

  const onTouchEnd = useCallback(
    (e) => {
      if (axisRef.current === null) return;

      const dx = e.nativeEvent.locationX - startRef.current.x;
      const dy = e.nativeEvent.locationY - startRef.current.y;
      const elapsed = Math.max(1, Date.now() - startRef.current.time);
      const velocity = Math.abs(dx) / elapsed;

      if (axisRef.current === 'x') {
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
      } else if (axisRef.current === 'y' && dy > 0) {
        const velocityY = Math.abs(dy) / elapsed;
        const passedY = Math.abs(dy) > 60 || velocityY > 0.4;
        if (passedY && typeof onCloseKeyboard === 'function') {
          onCloseKeyboard();
        }
      }

      axisRef.current = null;
    },
    [onSwipeLeft, onSwipeRight, onCloseKeyboard, atFirst, atLast]
  );

  return { onTouchStart, onTouchMove, onTouchEnd };
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

  const gestures = useMemo(
    () =>
      useEditorGestures({
        onSwipeLeft,
        onSwipeRight,
        onCloseKeyboard: () => Keyboard.dismiss(),
        atFirst,
        atLast,
      }),
    [onSwipeLeft, onSwipeRight, atFirst, atLast]
  );

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
    <View style={styles.container}>
      <View style={[styles.editorWrap, { maxHeight: Math.round(windowHeight * 0.6) }]}>
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
          onTouchStart={gestures.onTouchStart}
          onTouchMove={gestures.onTouchMove}
          onTouchEnd={gestures.onTouchEnd}
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
