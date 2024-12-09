const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const path = require('path');
let win

let sqlanywhere = require('sqlanywhere');
let conn = sqlanywhere.createConnection();
let conn_params = {
  Host  : '192.168.1.180',
  UserId  : 'DBA',
  Password: 'banana1'
};

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
    getAllCards();
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

function getAllCards() {
conn.connect(conn_params, function(err) {
  if (err) throw err;
  conn.exec('SELECT * FROM Member', function (err, result) {
    if (err) throw err;
    console.log(result);
    conn.disconnect();
  })
});
}
