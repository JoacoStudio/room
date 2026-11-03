# Changelog — Room

## [1.0.0] — 2026-11-02

### ✨ Nueva versión estable 1.0.0

Room es un organizador de notas minimalista (blanco y negro, sin botones en la nota) que almacena **100% de los datos localmente** en `localStorage` del navegador o de Electron. No requiere servidor, no requiere cuenta, no envía datos a ningún lado.

### 🎨 Diseño (UI/UX)
- Pantalla principal basada en el diseño Figma `Design/Screen1.png`
- Área de escritura sin bordes, esquina superior izquierda
- Reloj digital centrado en la parte inferior
- Línea divisoria fina en la barra superior
- Tres puntos de control de ventana (solo Electron): cerrar, minimizar, pantalla completa
- Modo claro / oscuro (ciclo con Alt + O, sin modo sistema automático)
- Tamaño de letra ajustable (16px – 32px, pasos de 2px) con Alt + + / Alt + -

### ⌨️ Atajos de teclado
| Combinación | Acción |
|-------------|--------|
| Alt + N | Nueva nota |
| Alt + B | Eliminar nota actual |
| Alt + ← | Nota anterior |
| Alt + → | Siguiente nota |
| Alt + Q | Pantalla completa / ventana normal |
| Alt + D | Exportar nota actual (.txt) |
| Alt + E | Exportar todas las notas (.json) |
| Alt + I | Importar notas desde archivo |
| Alt + R | Modo lectura / escritura |
| Alt + O | Cambiar tema (claro ↔ oscuro) |
| Alt + + | Letra más grande |
| Alt + - | Letra más chica |
| Alt + V | Ver notas (abre panel lateral) |
| Alt + Z | Abrir Room desde cualquier lugar (solo Electron) |
| Alt + Retroceso | Cerrar ventana (solo Electron) |
| Escape | Cerrar panel de ayuda |

### 📁 Panel de notas y atajos (Alt + V)
- Se abre deslizándose desde la derecha
- **Izquierda:** lista de notas con título y vista previa del cuerpo
- **Derecha:** tabla de atajos de teclado
- Clic en una nota la carga y cierra el panel
- Escape o escribir en la nota cierra el panel

### 🚀 Inicio rápido
- Splash de carga con logo animado por partículas (Iconito.svg)
- Inicio en ~1.5 segundos
- Sin dependencias externas obligatorias (sin Supabase, sin backend)

### 💾 Almacenamiento
- **100% local** en `localStorage`
- Exportar/importar respaldos en `.json` o `.txt`
- No hay sincronización en la nube por defecto

### 🖥️ Escritorio (Electron)
- Atajo global `Alt + Z` para abrir Room desde cualquier aplicación
- Región de arrastre en la barra superior para mover la ventana
- Bandeja del sistema con menú "Mostrar Room" y "Salir"

### 🔐 Seguridad
- Política de seguridad de contenido (CSP) restringida
- Validación de origen en mensajes IPC de Electron
- `contextIsolation: true` y `nodeIntegration: false` en el renderer
- No se almacena contraseña ni se usa cifrado en esta versión (todo queda en tu equipo)
