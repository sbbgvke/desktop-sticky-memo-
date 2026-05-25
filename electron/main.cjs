const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');

const NORMAL_WIDTH = 380;
const NORMAL_HEIGHT = 540;
const HANDLE_SHORT = 48;
const HANDLE_LONG = 96;
const EDGE_THRESHOLD = 18;
const EDGE_GAP = 10;

const dragStateByWindowId = new Map();
const windowStateById = new Map();

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getWorkArea(win) {
  return screen.getDisplayMatching(win.getBounds()).workArea;
}

function setCollapsedState(win, collapsed, edge = null) {
  windowStateById.set(win.id, { collapsed, edge });
  win.webContents.send('desktop-memo:collapsed-change', { collapsed, edge });
}

function getCollapsedState(win) {
  return windowStateById.get(win.id) || { collapsed: false, edge: null };
}

function createWindow() {
  const { workArea } = screen.getPrimaryDisplay();
  const icon = path.join(__dirname, '..', 'assets', 'icon.ico');

  const win = new BrowserWindow({
    width: NORMAL_WIDTH,
    height: NORMAL_HEIGHT,
    x: Math.max(workArea.x, workArea.x + workArea.width - NORMAL_WIDTH - 36),
    y: Math.max(workArea.y, workArea.y + 72),
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    alwaysOnTop: true,
    skipTaskbar: false,
    title: '桌面备忘录',
    icon,
    backgroundColor: '#00000000',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.setAlwaysOnTop(true, 'floating');
  win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  win.webContents.once('did-finish-load', () => setCollapsedState(win, false));
}

function collapseToEdge(win, edge) {
  const workArea = getWorkArea(win);
  const bounds = win.getBounds();
  const centerX = bounds.x + bounds.width / 2;
  const centerY = bounds.y + bounds.height / 2;

  if (edge === 'left') {
    win.setBounds({
      x: workArea.x,
      y: clamp(Math.round(centerY - HANDLE_LONG / 2), workArea.y, workArea.y + workArea.height - HANDLE_LONG),
      width: HANDLE_SHORT,
      height: HANDLE_LONG,
    });
  } else if (edge === 'right') {
    win.setBounds({
      x: workArea.x + workArea.width - HANDLE_SHORT,
      y: clamp(Math.round(centerY - HANDLE_LONG / 2), workArea.y, workArea.y + workArea.height - HANDLE_LONG),
      width: HANDLE_SHORT,
      height: HANDLE_LONG,
    });
  } else if (edge === 'top') {
    win.setBounds({
      x: clamp(Math.round(centerX - HANDLE_LONG / 2), workArea.x, workArea.x + workArea.width - HANDLE_LONG),
      y: workArea.y,
      width: HANDLE_LONG,
      height: HANDLE_SHORT,
    });
  } else if (edge === 'bottom') {
    win.setBounds({
      x: clamp(Math.round(centerX - HANDLE_LONG / 2), workArea.x, workArea.x + workArea.width - HANDLE_LONG),
      y: workArea.y + workArea.height - HANDLE_SHORT,
      width: HANDLE_LONG,
      height: HANDLE_SHORT,
    });
  }

  setCollapsedState(win, true, edge);
}

function collapseIfNearEdge(win) {
  const state = getCollapsedState(win);
  if (state.collapsed) return;

  const workArea = getWorkArea(win);
  const bounds = win.getBounds();
  const right = workArea.x + workArea.width;
  const bottom = workArea.y + workArea.height;
  const candidates = [];

  if (bounds.x <= workArea.x + EDGE_THRESHOLD) {
    candidates.push({ edge: 'left', value: Math.abs(bounds.x - workArea.x) });
  }
  if (bounds.x + bounds.width >= right - EDGE_THRESHOLD) {
    candidates.push({ edge: 'right', value: Math.abs(right - (bounds.x + bounds.width)) });
  }
  if (bounds.y <= workArea.y + EDGE_THRESHOLD) {
    candidates.push({ edge: 'top', value: Math.abs(bounds.y - workArea.y) });
  }
  if (bounds.y + bounds.height >= bottom - EDGE_THRESHOLD) {
    candidates.push({ edge: 'bottom', value: Math.abs(bottom - (bounds.y + bounds.height)) });
  }

  if (candidates.length > 0) {
    candidates.sort((a, b) => a.value - b.value);
    collapseToEdge(win, candidates[0].edge);
  }
}

function restoreFromHandle(win, point) {
  const state = getCollapsedState(win);
  const workArea = getWorkArea(win);
  let x = clamp(
    Math.round(point.screenX - NORMAL_WIDTH / 2),
    workArea.x,
    workArea.x + workArea.width - NORMAL_WIDTH,
  );
  let y = clamp(
    Math.round(point.screenY - NORMAL_HEIGHT / 2),
    workArea.y,
    workArea.y + workArea.height - NORMAL_HEIGHT,
  );

  if (state.edge === 'left') {
    x = workArea.x + EDGE_GAP;
  } else if (state.edge === 'right') {
    x = workArea.x + workArea.width - NORMAL_WIDTH - EDGE_GAP;
  } else if (state.edge === 'top') {
    y = workArea.y + EDGE_GAP;
  } else if (state.edge === 'bottom') {
    y = workArea.y + workArea.height - NORMAL_HEIGHT - EDGE_GAP;
  }

  win.setBounds({ x, y, width: NORMAL_WIDTH, height: NORMAL_HEIGHT });
  setCollapsedState(win, false);

  return {
    offsetX: point.screenX - x,
    offsetY: point.screenY - y,
  };
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.on('desktop-memo:close', (event) => {
  BrowserWindow.fromWebContents(event.sender)?.close();
});

ipcMain.on('desktop-memo:drag-start', (event, point) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const state = getCollapsedState(win);
  const dragState = state.collapsed
    ? restoreFromHandle(win, point)
    : {
        offsetX: point.screenX - win.getBounds().x,
        offsetY: point.screenY - win.getBounds().y,
      };

  dragStateByWindowId.set(win.id, dragState);
});

ipcMain.on('desktop-memo:drag-move', (event, point) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  const dragState = dragStateByWindowId.get(win.id);
  if (!dragState) return;

  win.setPosition(
    Math.round(point.screenX - dragState.offsetX),
    Math.round(point.screenY - dragState.offsetY),
    false,
  );
});

ipcMain.on('desktop-memo:drag-end', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win) return;

  dragStateByWindowId.delete(win.id);
  collapseIfNearEdge(win);
});
