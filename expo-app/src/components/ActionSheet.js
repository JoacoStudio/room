import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

export default function ActionSheet({
  visible,
  onClose,
  isReadOnly,
  onAction,
}) {
  const readonlyLabel = isReadOnly ? 'Desactivar solo lectura' : 'Activar solo lectura';

  const items = [
    { label: 'Nueva nota', action: 'new' },
    { label: 'Eliminar nota', action: 'delete' },
    { label: 'Exportar nota', action: 'export-one' },
    { label: 'Exportar todas', action: 'export-all' },
    { label: 'Importar', action: 'import' },
    { label: readonlyLabel, action: 'readonly' },
    { label: 'Ayuda', action: 'help' },
  ];

  return (
    <Modal visible={visible} transparent animation="fade" onRequestClose={onClose}>
      <View style={styles.backdrop} onPress={onClose} />
      <View style={styles.panel}>
        <View style={styles.handle} />
        <Text style={styles.title}>Acciones</Text>
        <View style={styles.actions}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.action}
              style={[styles.item, item.action === 'delete' && styles.itemDestructive]}
              onPress={() => { onClose(); onAction(item.action); }}
            >
              <Text style={styles.itemText}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 24,
    maxHeight: '80%',
    borderTopWidth: 1,
    borderTopColor: '#000000',
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#000000',
    opacity: 0.22,
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#666666',
    textAlign: 'center',
    marginBottom: 8,
  },
  actions: {},
  item: {
    borderBottomWidth: 1,
    borderBottomColor: '#e6e6e6',
    paddingVertical: 15,
    paddingHorizontal: 4,
  },
  itemDestructive: {},
  itemText: {
    color: '#000000',
    fontSize: 16,
    textAlign: 'left',
  },
});
