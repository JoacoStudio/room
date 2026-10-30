# Room

Organizador de notas minimalista. Blanco y negro, sin botones, todo por teclado.

## Estructura

```
Room/
├── index.html          # Entrada principal
├── style.css           # Estilos (B/N, minimalista)
├── script.js           # Lógica de notas y atajos
├── src/
│   └── Ic.ico          # Icono de la app
├── electron/
│   ├── main.js         # Ventana Electron
│   ├── preload.js      # Puente seguro
│   └── package.json    # Configuración
├── Room.bat            # Acceso rápido Windows
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
| Alt + X | Ayuda de atajos |

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
