const { app, BrowserWindow, globalShortcut, Tray, nativeImage } = require('electron');
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
    icon: path.join(__dirname, 'src', 'Ic.ico'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  // index.html es el núcleo web compartido en src/ (raíz del proyecto)
  const indexPath = path.join(__dirname, '..', 'src', 'index.html');
  win.loadFile(indexPath);

  win.on('close', (e) => {
    // En Windows, al cerrar la ventana no salimos de la app:
    // solo la ocultamos para que el atajo Alt+| siga funcionando desde cualquier lugar.
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
  if (win) {
    if (win.isMinimized()) win.restore();
    win.show();
    win.focus();
  } else {
    createWindow();
  }
}

function createTray() {
  const iconPath = path.join(__dirname, 'src', 'Ic.ico');
  const icon = nativeImage.createFromPath(iconPath);

  tray = new Tray(icon);
  tray.setToolTip('Room');

  const contextMenu = require('electron').Menu.buildFromTemplate([
    {
      label: 'Mostrar Room',
      click: toggleWindow,
      accelerator: 'Alt+|'
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

  // Atajo global: Alt + |  (funciona desde cualquier lugar de Windows)
  const registered = globalShortcut.register('Alt+|', toggleWindow);
  if (!registered) {
    console.log('[Room] No se pudo registrar el atajo Alt+|');
  } else {
    console.log('[Room] Atajo global registrado: Alt+|');
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
    // No salimos: mantenemos la app en segundo plano para que Alt+| siga funcionando.
    // Usá el ícono de bandeja > Salir para cerrar completamente.
  }
});
