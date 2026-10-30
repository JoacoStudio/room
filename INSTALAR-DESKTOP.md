# Room - App de Escritorio

Room corre en el navegador y no necesita instalación. En Windows puedes abrirla como una ventana de aplicación, sin barra de direcciones ni pestañas.

---

## Acceso directo rápido

Haz doble clic en **`Room.bat`**. Esto abrirá Room con Chrome (o Edge, si no está Chrome) en modo aplicación, pareciéndose a una app de escritorio nativa.

Para dejarlo siempre a mano en el escritorio:
1. Haz clic derecho sobre `Room.bat`
2. Selecciona **"Enviar a" > "Escritorio (crear acceso directo)"**

La ventana se abre centrada horizontalmente y en la zona superior de la pantalla. Para cambiar el tamaño o la altura inicial, editá las variables `WIN_W`, `WIN_H` y `WIN_TOP` al principio de `Room.bat`.

---

## Atajos de teclado de Room

| Combinación | Acción |
|-------------|--------|
| Alt + N | Nueva nota |
| Alt + B | Eliminar nota actual |
| Alt + ← | Nota anterior |
| Alt + → | Siguiente nota |
| Alt + Q | Pantalla completa |
| Alt + D | Exportar nota (.txt) |
| Alt + E | Exportar todas las notas (.json) |
| Alt + I | Importar notas desde archivo |
| Alt + R | Modo lectura / escritura |
| Alt + X | Ayuda de atajos |

Tus notas se guardan automáticamente en el navegador (`localStorage`).
