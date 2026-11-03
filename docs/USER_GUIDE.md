# Manual de Usuario — Room

Room es un organizador de notas minimalista. Blanco y negro. Sin botones en la nota. Todo se controla con teclado o gestos.

---

## 1. Primera pantalla

Al abrir la app verás:

- Un área de texto en la esquina superior izquierda con el placeholder *"Escribe acá.."*
- Un reloj centrado en la parte inferior
- Una línea divisoria fina debajo de la barra superior
- Una ralla vertical (3px) en el margen derecho (abre el panel de notas y atajos)

Escribe directamente. No hay botón de guardar: las notas se guardan automáticamente cada 400 ms al dejar de escribir.

---

## 2. Atajos de teclado

| Combinación | Acción |
|-------------|--------|
| `Alt + N` | Nueva nota |
| `Alt + B` | Eliminar nota actual |
| `Alt + ←` | Nota anterior |
| `Alt + →` | Siguiente nota |
| `Alt + Q` | Pantalla completa / volver a ventana normal |
| `Alt + D` | Exportar nota actual (.txt) |
| `Alt + E` | Exportar todas las notas (.json) |
| `Alt + I` | Importar notas desde archivo (.json o .txt) |
| `Alt + R` | Modo solo lectura / edición activada |
| `Alt + O` | Cambiar tema: claro ↔ oscuro |
| `Alt + +` | Letra más grande |
| `Alt + -` | Letra más chica |
| `Alt + V` | Abrir panel de notas y atajos |
| `Alt + Z` | Abrir Room desde cualquier lugar (solo escritorio Electron) |
| `Alt + Retroceso` | Cerrar ventana (solo escritorio) |
| `Escape` | Cerrar el panel de ayuda si está abierto |

---

## 3. Panel de notas y atajos (`Alt + V`)

Al presionar `Alt + V`, se despliega un panel desde la derecha con dos columnas:

### Izquierda — Notas
- Lista de todas tus notas guardadas
- Cada una muestra el título (primera línea) y una vista previa del cuerpo
- La nota activa se muestra en negrita
- Haz clic en cualquier nota para cargarla y cerrar el panel

### Derecha — Atajos
- Tabla rápida con todos los atajos de teclado

Cierra el panel presionando `Escape`, haciendo clic en el fondo semitransparente, o empezando a escribir en la nota.

---

## 4. Operaciones aritméticas

Room lee automáticamente las expresiones que escribas. Al terminar una línea con `=`, se calcula el resultado:

```
2 + 3 =      → 2 + 3 = 5
(10 + 5) / 3 = → (10 + 5) / 3 = 5
2 ^ 8 =      → 2 ^ 8 = 256
√ 16 =       → √ 16 = 4
17 % 5 =     → 17 % 5 = 2
```

Operadores soportados: `+`, `-`, `*`, `/`, `%`, `^`, `√`, paréntesis `()`.

---

## 5. Exportar e importar

### Exportar nota actual (`Alt + D`)
Descarga un archivo `.txt` con el contenido de la nota actual.

### Exportar todas las notas (`Alt + E`)
Descarga un archivo `.json` con todas tus notas (respaldo completo).

### Importar notas (`Alt + I`)
Selecciona un archivo `.json` o `.txt` previamente exportado para cargar las notas en Room.

---

## 6. Temas y tamaño de letra

### Tema (`Alt + O`)
Alterna entre modo claro y modo oscuro. No hay modo automático por defecto.

### Tamaño de letra (`Alt + +` / `Alt + -`)
Rango: 16px a 32px, en pasos de 2px. Se guarda automáticamente.

---

## 7. Escritorio (Electron)

### Atajo global
`Alt + Z` abre Room desde cualquier aplicación de Windows/macOS.

### Barra superior
- Puedes hacer clic y arrastrar desde la parte superior para mover la ventana
- Tres puntos en la esquina superior izquierda: cerrar, minimizar, pantalla completa
- Bandeja del sistema: "Mostrar Room" y "Salir"

---

## 8. Respaldos

Tus notas viven solo en tu equipo (`localStorage`). Se recomienda exportar periódicamente con `Alt + E` para no perder información si borras el caché del navegador o cambias de equipo.
