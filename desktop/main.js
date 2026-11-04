const { app, BrowserWindow, globalShortcut, Tray, nativeImage, ipcMain, clipboard, Notification } = require('electron');
const path = require('path');
const fs = require('fs');

let win = null;
let tray = null;
let isQuitting = false;
let lastClipboardText = '';
const PENDING_FILE = path.join(__dirname, 'clipboard_notes.json');
const clipboardInterval = null;

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

  // index.html está en la misma carpeta (desktop/)
  const indexPath = path.join(__dirname, 'index.html');
  win.loadFile(indexPath);

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
      win.showInactive(); // restaurar sin animación de entrada ni robo de foco
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
  createWindow();

  // Atajo global único (funciona desde cualquier lugar de Windows)
  const registeredZ = globalShortcut.register('Alt+Z', toggleWindow);
  if (!registeredZ) {
    console.log('[Room] No se pudo registrar el atajo Alt+Z');
  } else {
    console.log('[Room] Atajo global registrado: Alt+Z');
  }

  createTray();

  // Monitoreo de portapapeles cada 3 segundos
  const clipboardInterval = setInterval(() => {
    try {
      const text = clipboard.readText();
      console.log('[Room] Monitoreando portapapeles:', text ? text.length + ' chars' : 'vacío');

      if (text && text.length > 50 && text !== lastClipboardText) {
        console.log('[Room] Portapapeles detectado (>50 chars):', text.substring(0, 100));
        lastClipboardText = text;

        const notification = new Notification({
          title: 'Room - Texto detectado',
          body: text.length > 100 ? text.substring(0, 100) + '...' : text,
          icon: path.join(__dirname, 'Ic.ico')
        });

        notification.on('click', () => {
          console.log('[Room] Usuario hizo clic en notificación');
          savePendingNote(text);
          if (win) {
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
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // No salemos: mantenemos la app en segundo plano para que Alt+Z siga funcionando.
    // Usá el ícono de bandeja > Salir para cerrar completamente.
  }
});

// IPC: controles de ventana desde el renderer (puntos superiores en desktop)
// VALIDACIÓN DE SEGURIDAD: solo acepta mensajes del webContents de Room
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
