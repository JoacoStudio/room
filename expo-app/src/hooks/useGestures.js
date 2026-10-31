import { PanResponder } from 'react-native';

/**
 * useGestures: maneja swipes horizontales y verticales con PanResponder.
 * Devuelve dos objetos PanResponder: uno para el editor (swipe horizontal)
 * y otro para la barra inferior (swipe vertical / fallback horizontal).
 *
 * Callbacks:
 *  - onSwipeHorizontal(dx, canGo, navigate)  -> dx: delta X, canGo: booleano, navigate: fn(direction)
 *  - onVerticalPull(dy, onCreate, onSheet)   -> dy: delta Y, callbacks
 *  - onTopPull(dy, onCreate)                 -> desde zona superior
 */

export function useSwipeHorizontal({ onNavigate, thresholdPct = 0.25, minPx = 120, velocityThreshold = 0.45 }) {
  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: (e, gestureState) => {
      gestureState._startX = 0;
      gestureState._startTime = Date.now();
      gestureState._axis = null;
      gestureState._moved = false;
      gestureState._cancelled = false;
      gestureState._offset = 0;
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
        gestureState._axis = Math.abs(dx) > Math.abs(dy) * 1.25 ? 'x' : 'y';
        if (gestureState._axis !== 'x') return;
        gestureState._moved = true;
      }

      if (gestureState._axis !== 'x') return;

      gestureState._offset = dx;
      e.preventDefault();
    },
    onPanResponderRelease: (e, gestureState) => {
      if (gestureState._axis !== 'x' || !gestureState._moved || gestureState._cancelled) return;

      const dx = gestureState.dx;
      const elapsed = Math.max(1, Date.now() - gestureState._startTime);
      const _velocity = Math.abs(dx) / elapsed;

      // No conocemos el ancho aquí, lo pasamos desde el componente via onNavigate
      // onNavigate recibe (dx, width, atFirst, atLast)
      if (typeof onNavigate === 'function') {
        onNavigate(dx, gestureState);
      }
    },
    onPanResponderTerminate: (e, gestureState) => {
      gestureState._cancelled = true;
    },
    onPanResponderTerminationRequest: () => false,
  });

  return panResponder;
}

export function useSwipeVertical({ onPullDown, onPullUp, onHorizontalSwipe }) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: (e, gestureState) => {
      gestureState._axis = null;
      gestureState._moved = false;
    },
    onPanResponderMove: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;

      if (gestureState._axis === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        gestureState._axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
        gestureState._moved = true;
      }

      if (gestureState._axis === 'y') {
        e.preventDefault();
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;
      const elapsed = Math.max(1, Date.now() - (gestureState._startTime || Date.now()));
      const velocity = Math.abs(dy) / elapsed;

      if (gestureState._axis === 'x' && Math.abs(dx) > 40) {
        if (typeof onHorizontalSwipe === 'function') onHorizontalSwipe(dx);
        return;
      }

      if (gestureState._axis === 'y' && (Math.abs(dy) > 40 || velocity > 0.4)) {
        if (dy < 0 && typeof onPullUp === 'function') onPullUp();
        else if (dy > 0 && typeof onPullDown === 'function') onPullDown();
      }
    },
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => false,
  });
}

export function useTopZoneSwipe({ onPullDown }) {
  return PanResponder.create({
    onStartShouldSetPanResponder: () => false,
    onMoveShouldSetPanResponder: (e, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: (e, gestureState) => {
      gestureState._axis = null;
      gestureState._moved = false;
    },
    onPanResponderMove: (e, gestureState) => {
      const dx = gestureState.dx;
      const dy = gestureState.dy;

      if (gestureState._axis === null) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        gestureState._axis = Math.abs(dy) > Math.abs(dx) ? 'y' : 'x';
        gestureState._moved = true;
      }

      if (gestureState._axis === 'y') {
        e.preventDefault();
      }
    },
    onPanResponderRelease: (e, gestureState) => {
      const dy = gestureState.dy;
      const elapsed = Math.max(1, Date.now() - (gestureState._startTime || Date.now()));
      const velocity = Math.abs(dy) / elapsed;

      if (gestureState._axis === 'y' && (dy > 50 || (dy > 30 && velocity > 0.4))) {
        if (typeof onPullDown === 'function') onPullDown();
      }
    },
    onPanResponderTerminate: () => {},
    onPanResponderTerminationRequest: () => false,
  });
}
