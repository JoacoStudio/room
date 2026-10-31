import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';

export default function HelpModal({ visible, onClose }) {
  return (
    <Modal visible={visible} transparent={true} onRequestClose={onClose} animation="fade">
      <View style={styles.backdrop} onPress={onClose} />
      <View style={styles.card}>
        <Text style={styles.title}>Atajos</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Teclado</Text>
          {[
            ['Alt + N', 'Nueva nota'],
            ['Alt + B', 'Eliminar nota actual'],
            ['Alt + ←', 'Nota anterior'],
            ['Alt + →', 'Siguiente nota'],
            ['Alt + Q', 'Pantalla completa'],
            ['Alt + D', 'Exportar nota (.txt)'],
            ['Alt + E', 'Exportar todas las notas (.json)'],
            ['Alt + I', 'Importar notas desde archivo'],
            ['Alt + R', 'Modo lectura / escritura'],
            ['Alt + O', 'Tema: claro / oscuro / sistema'],
            ['Alt + X', 'Esta ayuda'],
          ].map(([key, label]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.key}>{key}</Text>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestos (mobile)</Text>
          {[
            ['←', 'Siguiente nota'],
            ['→', 'Nota anterior'],
            ['↓', 'Nueva nota'],
            ['↑', 'Acciones'],
            ['Tocar', 'Escribir / mover cursor'],
            ['Mantener', 'Seleccionar texto'],
          ].map(([key, label]) => (
            <View key={key} style={styles.row}>
              <Text style={styles.key}>{key}</Text>
              <Text style={styles.label}>{label}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.close} onPress={onClose}>
          <Text style={styles.closeText}>Toca para cerrar</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#000000',
    width: '85%',
    maxWidth: 560,
    padding: 32,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 20,
  },
  section: {
    width: '100%',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#666666',
    marginBottom: 8,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  key: {
    width: 96,
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
  },
  close: {
    marginTop: 12,
  },
  closeText: {
    fontSize: 13,
    color: '#666666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
