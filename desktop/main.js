const { app, BrowserWindow, globalShortcut, Tray, nativeImage, ipcMain, clipboard, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let tray = null;
let isQuitting = false;
let lastClipboardText = null; // null = no se ha leído aún (primera vez)
const PENDING_FILE = path.join(__dirname, 'clipboard_notes.json');

function readPendingNotes() {
  try {
    if (fs.existsSync(PENDING_FILE)) {
      const data = fs.readFileSync(PENDING_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {}
  return [];
}

function writePendingNotes(notes) {
  try {
    fs.writeFileSync(PENDING_FILE, JSON.stringify(notes, null, 2));
  } catch (e) {}
}

function savePendingNote(text) {
  const notes = readPendingNotes();
  notes.push({
    id: `clipboard-${Date.now()}`,
    title: 'Portapapeles',
    body: text,
    updated: Date.now(),
    source: 'clipboard'
  });
  writePendingNotes(notes);
}

function createWindow() {
  win = new BrowserWindow({
    width: 900,
    height: 700,
    minWidth: 600,
    minHeight: 500,
    title: 'Room',
    frame: false,
    icon: path.join(__dirname, 'Ic.ico'),
    backgroundThrottling: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  const indexPath = path.join(__dirname, 'index.html');
  win.loadFile(indexPath).catch((err) => {
    console.error('[Room] Error cargando index.html:', err);
  });
  win.show();

  win.on('close', (e) => {
    if (process.platform === 'win32' && !isQuitting) {
      e.preventDefault();
      win.hide();
      return;
    }
    win = null;
  });

  win.on('closed', () => {
    win = null;
  });
}

function toggleWindow() {
  console.log('[Room] toggleWindow ejecutado');
  if (win) {
    console.log('[Room] ventana existe, visible:', win.isVisible(), 'minimizada:', win.isMinimized());
    if (win.isMinimized()) {
      win.restore();
      win.showInactive();
    } else if (!win.isVisible()) {
      win.show();
    }
  } else {
    console.log('[Room] ventana no existe, creando...');
    createWindow();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'Ic.ico');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('Room');

  const contextMenu = require('electron').Menu.buildFromTemplate([
    {
      label: 'Mostrar Room',
      click: toggleWindow,
      accelerator: 'Alt+Z'
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setContextMenu(contextMenu);
  tray.on('click', toggleWindow);
}

app.whenReady().then(() => {
  try {
    console.log('[Room] Iniciando aplicación...');
    createWindow();
    console.log('[Room] Ventana creada');

    const registeredZ = globalShortcut.register('Alt+Z', toggleWindow);
    if (!registeredZ) {
      console.log('[Room] No se pudo registrar el atajo Alt+Z');
    } else {
      console.log('[Room] Atajo global registrado: Alt+Z');
    }

    createTray();

    setInterval(() => {
      try {
        const text = clipboard.readText();
        console.log('[Room] Monitoreando portapapeles:', text ? text.length + ' chars' : 'vacío');

        // Primera vez: solo guardar el valor actual sin mostrar notificación
        if (lastClipboardText === null) {
          lastClipboardText = text || '';
          console.log('[Room] Inicializando monitoreo de portapapeles (valor inicial guardado)');
          return;
        }

        if (text && text.length > 50 && text !== lastClipboardText) {
          console.log('[Room] Portapapeles detectado (>50 chars):', text.substring(0, 100));
          lastClipboardText = text;

          const notification = new Notification({
            title: 'Room - Copiaste texto',
            body: 'Haz clic para guardarlo como nota: ' + (text.length > 80 ? text.substring(0, 80) + '...' : text),
            icon: path.join(__dirname, 'Ic.ico')
          });

          notification.on('click', () => {
            console.log('[Room] Usuario hizo clic en notificación');
            savePendingNote(text);
            if (win) {
              win.webContents.send('clipboard-note-detected', {
                id: `clipboard-${Date.now()}`,
                title: 'Portapapeles',
                body: text,
                updated: Date.now()
              });
              win.show();
              win.focus();
            }
          });

          notification.show();
          console.log('[Room] Notificación mostrada');
        } else if (text && text.length <= 50) {
          console.log('[Room] Texto demasiado corto:', text.length, 'chars');
        }
      } catch (e) {
        console.error('[Room] Error monitoreando portapapeles:', e);
      }
    }, 3000);

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
      }
    });
  } catch (e) {
    console.error('[Room] Error al iniciar:', e);
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // Mantenemos la app en segundo plano para que Alt+Z siga funcionando.
  }
});

function isValidIPCRequest(event) {
  if (!event || !event.sender) return false;
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  return senderWindow === win;
}

ipcMain.on('window-minimize', (event) => {
  if (!isValidIPCRequest(event)) {
    console.warn('[Room] IPC window-minimize rechazado: origen no válido');
    return;
  }
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) senderWindow.minimize();
});

ipcMain.on('window-close', (event) => {
  if (!isValidIPCRequest(event)) {
    console.warn('[Room] IPC window-close rechazado: origen no válido');
    return;
  }
  app.quit();
});

ipcMain.on('window-fullscreen', (event) => {
  if (!isValidIPCRequest(event)) {
    console.warn('[Room] IPC window-fullscreen rechazado: origen no válido');
    return;
  }
  const senderWindow = BrowserWindow.fromWebContents(event.sender);
  if (senderWindow) {
    if (senderWindow.isFullScreen()) {
      senderWindow.setFullScreen(false);
    } else {
      senderWindow.setFullScreen(true);
    }
  }
});

ipcMain.handle('clipboard-get-pending', async () => {
  const notes = readPendingNotes();
  writePendingNotes([]);
  return notes;
});

ipcMain.handle('clipboard-clear-pending', async () => {
  writePendingNotes([]);
});

ipcMain.handle('clipboard-check-pending', async () => {
  const notes = readPendingNotes();
  writePendingNotes([]);
  return notes;
});

// ---------- IA Local: Nemotron 3.5 Super VL 120B A12B (NVIDIA NIM) ----------

async function analizarConNemotron(texto) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error('[Room IA] Falta NVIDIA_API_KEY en las variables de entorno');
    return { error: 'NVIDIA_API_KEY no configurada' };
  }

  try {
    const respuesta = await fetch('https://api.nim.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'nemotron-3.5-super-vl-120b-a12b',
        messages: [
          {
            role: 'system',
            content:
              'Eres un asistente de análisis de notas personal llamado Room. Tu trabajo es leer el contenido de una nota escrita por el usuario y emitir un "pensamiento" (reasoning) breve y claro en español. Analiza qué dice la nota, detecta temas, emociones, tareas pendientes o ideas clave, y sugiere algo útil. Sé conciso y escribe en español.',
          },
          {
            role: 'user',
            content: `Nota del usuario:\n\n${texto}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 512,
        stream: false,
      }),
    });

    if (!respuesta.ok) {
      const errorTexto = await respuesta.text();
      console.error('[Room IA] Error de API NVIDIA:', respuesta.status, errorTexto);
      return { error: `API error ${respuesta.status}` };
    }

    const datos = await respuesta.json();
    const contenido = datos.choices?.[0]?.message?.content || 'Sin respuesta de la IA';
    return { contenido };
  } catch (err) {
    console.error('[Room IA] Error conectando con NVIDIA:', err);
    return { error: err.message };
  }
}

ipcMain.handle('ai-analyze-note', async (event, texto) => {
  return await analizarConNemotron(texto);
});