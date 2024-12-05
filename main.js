const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const path = require('path');
let win

const createWindow = () => {
  win = new BrowserWindow({
    show: false,
    width: 1500,
    height: 1050,
    resizable: false,
    autoHideMenuBar: true,
    fullscreenable: true,
    fullscreen: false,
    maximizable: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true
    }
  })
  win.loadFile('index.html')
  win.webContents.once('did-finish-load', function() {
    win.show();
    win.webContents.send('appVersion', app.getVersion());
  });
}


app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();

  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})
