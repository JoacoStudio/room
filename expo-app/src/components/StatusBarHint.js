import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';

export default function StatusBarHint({ hint, onTap, onPullUp, onPullDown, onHorizontalSwipe }) {
  return null; // Se renderiza dentro del layout principal con los gestos vinculados
}

export function StatusBarHandle({ onTap }) {
  return (
    <TouchableOpacity style={styles.handleContainer} onPress={onTap}>
      <View style={styles.handle} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.22,
  },
});
