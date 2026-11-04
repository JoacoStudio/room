const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  toggleFullscreen: () => ipcRenderer.send('window-fullscreen'),
  clipboardAPI: {
    getPendingNotes: () => ipcRenderer.invoke('clipboard-get-pending'),
    clearPendingNotes: () => ipcRenderer.invoke('clipboard-clear-pending'),
    checkPendingNotes: () => ipcRenderer.invoke('clipboard-check-pending'),
    onClipboardNote: (callback) => ipcRenderer.on('clipboard-note-detected', (event, note) => callback(note))
  }
});
