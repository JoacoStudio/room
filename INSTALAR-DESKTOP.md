# Room - App de Escritorio

Tienes dos formas de usar Room como aplicación de escritorio en Windows:

---

## Opción 1: Acceso directo rápido (sin instalar nada)

Haz doble clic en **`Room.bat`**. Esto abrirá la aplicación en una ventana de navegador sin barra de direcciones ni pestañas, pareciéndose a una app de escritorio nativa.

Para dejarlo siempre a mano en el escritorio:
1. Haz clic derecho sobre `Room.bat`
2. Selecciona **"Enviar a" > "Escritorio (crear acceso directo)"**

---

## Opción 2: App real con Electron (.exe)

Si quieres un ejecutable independiente que no dependa del navegador instalado:

### Requisitos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior)

### Pasos
1. Abre una terminal en la carpeta del proyecto:
   ```powershell
   cd C:\Users\jotag\Todo\notas-minimalista\electron
   ```
2. Instala dependencias:
   ```powershell
   npm install
   ```
3. Inicia la app en modo desarrollo:
   ```powershell
   npm start
   ```
4. Para generar el instalador de Windows:
   ```powershell
   npm run dist
   ```

Esto creará un instalador en la carpeta `electron/dist/` que puedes instalar como cualquier programa de Windows.

---

### Atajos de teclado de Room

| Combinación | Acción |
|-------------|--------|
| Alt + N | Nueva nota |
| Alt + B | Eliminar nota actual |
| Alt + ← | Nota anterior |
| Alt + → | Siguiente nota |
| Alt + Q | Pantalla completa |
| Alt + D | Exportar nota (.txt) |
| Alt + R | Modo lectura / escritura |
| Alt + X | Ayuda de atajos |

Tus notas se guardan automáticamente en el navegador (`localStorage`).
