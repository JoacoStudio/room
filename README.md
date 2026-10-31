# Room

Organizador de notas minimalista. Blanco y negro, sin botones en la nota: teclado en desktop y gestos en mobile.

## Estructura

```
Room/
├── index.html          # Entrada principal
├── style.css           # Estilos (B/N, minimalista)
├── script.js           # Lógica de notas y atajos
├── src/
│   └── Ic.ico          # Icono de la app
├── Room.bat            # Acceso rápido Windows
├── Room.ps1            # Abre y posiciona la ventana
├── INSTALAR-DESKTOP.md # Instrucciones de instalación
└── README.md           # Este archivo
```

## Atajos de teclado

| Combinación | Acción |
|-------------|--------|
| Alt + N | Nueva nota |
| Alt + B | Eliminar nota actual |
| Alt + ← | Nota anterior |
| Alt + → | Siguiente nota |
| Alt + Q | Pantalla completa |
| Alt + D | Exportar nota actual (.txt) |
| Alt + E | Exportar todas las notas (.json) |
| Alt + I | Importar notas desde archivo |
| Alt + R | Modo lectura / escritura |
| Alt + O | Tema: claro / oscuro / sistema |
| Alt + 2 | Hub de estadísticas |
| Alt + X | Ayuda de atajos |

## Gestos en mobile

En pantallas táctiles Room cambia a un modo sin botones visibles. La nota ocupa la pantalla y la barra inferior muestra la posición (`2 / 5`) y un handle fino.

| Gesto | Acción |
|-------|--------|
| Deslizar ← sobre la nota o la barra | Siguiente nota |
| Deslizar → sobre la nota o la barra | Nota anterior |
| Deslizar ↓ desde el borde superior | Nueva nota |
| Deslizar ↑ desde la barra inferior | Abrir acciones |
| Tocar el handle de la barra | Abrir acciones |
| Deslizar la hoja hacia abajo | Cerrarla |

La hoja de acciones concentra lo destructivo o poco frecuente: **eliminar** (con deshacer durante 5 s), **exportar**, **importar**, **solo lectura** y **ayuda**. Los gestos solo se activan con el dedo; con mouse o teclado se mantienen los atajos de siempre. Si mantenés el dedo quieto antes de mover, el gesto se cancela para no interferir con la selección de texto.

> Las notas se guardan en el `localStorage` de cada navegador. No se sincronizan automáticamente entre desktop y mobile.

## Operaciones aritméticas

Room lee automáticamente las expresiones que escribís en la nota. Al terminar una línea con `=`, el resultado se calcula y se inserta en el texto.

| Escribís | Resultado |
|----------|-----------|
| `2 + 3 =` | `2 + 3 = 5` |
| `(10 + 5) / 3 =` | `(10 + 5) / 3 = 5` |
| `2 ^ 8 =` | `2 ^ 8 = 256` |
| `√ 16 =` | `√ 16 = 4` |
| `17 % 5 =` | `17 % 5 = 2` |

Operaciones soportadas: `+`, `-`, `*`, `/`, `%` (módulo), `^` (potencia) y `√` (raíz cuadrada), con paréntesis `()` para agrupar. Si lo que escribís antes de `=` no es una expresión válida, se deja tal cual.

## Cómo usar

1. Abre `index.html` directamente en el navegador, o
2. Ejecuta `Room.bat` para abrir en modo aplicación (sin barra de direcciones), o
3. Usa el acceso directo `Room.lnk` en tu escritorio.

## Persistencia de datos

Las notas se guardan automáticamente en `localStorage` del navegador cada vez que dejas de escribir por 800 ms.

Para respaldar tus notas:
- **Alt + E** descarga un archivo `.json` con todas tus notas.
- **Alt + I** importa notas desde un archivo `.json` o `.txt` previamente exportado.

Recomendación: exporta tu respaldo periódicamente, especialmente antes de borrar el caché del navegador o cambiar de equipo.

## Accesibilidad

- El área de escritura tiene etiqueta ARIA para lectores de pantalla.
- Los mensajes de estado (guardado, importación, errores) se anuncian mediante región `aria-live`.
- El modo oscuro se activa automáticamente entre las 20:00 y las 08:00.
