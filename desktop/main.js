const { app, BrowserWindow, globalShortcut, Tray, nativeImage, ipcMain } = require('electron');
const path = require('path');

let win = null;
let tray = null;
let isQuitting = false;

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
