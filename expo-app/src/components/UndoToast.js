import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function UndoToast({ visible, onUndo, onHide }) {
  const [mounted, setMounted] = useState(false);
  const [style, setStyle] = useState({ opacity: 0, translateY: 60 });
  const timerRef = useRef({});

  useEffect(() => {
    // Limpiar timers previos
    Object.values(timerRef.current).forEach(clearTimeout);
    timerRef.current = {};

    const apply = () => {
      if (visible) {
        setMounted(true);
        setStyle({ opacity: 0, translateY: 60 });

        timerRef.current.t1 = setTimeout(() => {
          setStyle({ opacity: 1, translateY: 0 });
        }, 10);

        timerRef.current.t2 = setTimeout(() => {
          setStyle({ opacity: 0, translateY: 60 });
          timerRef.current.t3 = setTimeout(() => {
            onHide();
            setMounted(false);
          }, 250);
        }, 5000);
      } else {
        setStyle({ opacity: 0, translateY: 60 });
        setMounted(false);
      }
    };

    timerRef.current.apply = setTimeout(apply, 0);

    return () => {
      clearTimeout(timerRef.current.apply);
      Object.values(timerRef.current).forEach(clearTimeout);
      timerRef.current = {};
    };
  }, [visible, onHide]);

  if (!visible && !mounted) return null;

  const { opacity, translateY } = style;

  return (
    <View style={[styles.container, { opacity, transform: [{ translateY }] }]}>
      <Text style={styles.text}>Nota eliminada</Text>
      <TouchableOpacity style={styles.btn} onPress={onUndo}>
        <Text style={styles.btnText}>Deshacer</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 4,
    elevation: 4,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    marginRight: 12,
  },
  btn: {
    marginLeft: 8,
  },
  btnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
});
