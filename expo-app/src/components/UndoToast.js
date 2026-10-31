import React from 'react';
import { Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';

export default function UndoToast({ visible, onUndo, onHide }) {
  const anim = Animated.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
      const timer = setTimeout(() => {
        Animated.timing(anim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }).start(() => onHide());
      }, 5000);
      return () => clearTimeout(timer);
    }
    anim.setValue(0);
  }, [visible, anim, onHide]);

  const translateY = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [60, 0],
  });
  const opacity = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  if (!visible && anim._value === 0) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <Text style={styles.text}>Nota eliminada</Text>
      <TouchableOpacity style={styles.btn} onPress={onUndo}>
        <Text style={styles.btnText}>Deshacer</Text>
      </TouchableOpacity>
    </Animated.View>
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
