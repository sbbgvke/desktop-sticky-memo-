const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('desktopMemo', {
  closeWindow: () => ipcRenderer.send('desktop-memo:close'),
  startDrag: (point) => ipcRenderer.send('desktop-memo:drag-start', point),
  moveDrag: (point) => ipcRenderer.send('desktop-memo:drag-move', point),
  endDrag: () => ipcRenderer.send('desktop-memo:drag-end'),
  onCollapsedChange: (callback) => {
    const handler = (_event, state) => callback(state);
    ipcRenderer.on('desktop-memo:collapsed-change', handler);
    return () => ipcRenderer.removeListener('desktop-memo:collapsed-change', handler);
  },
});
