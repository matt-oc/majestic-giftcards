const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const path = require('path');
const fs = require('fs');
const downloadsFolder = require('downloads-folder');
let win
let cardList

let sqlanywhere = require('sqlanywhere');
let conn = sqlanywhere.createConnection();
let conn_params = {
  Host: '192.168.1.180',
  UserId: 'DBA',
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

app.disableHardwareAcceleration();

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();

  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
})

ipcMain.on('card-list-print', () => {
  let data = ""
  cardList.forEach(function(card) {
    data += JSON.stringify(card, null, 2) + "\n"
  });
  fs.writeFile(downloadsFolder() + '/gift-card-list.txt', data, function(err) {
    if (err) throw err;
  });
});

ipcMain.on('card-input', (event, args) => {
  conn.connect(conn_params, function(err) {
    if (err) {
      win.webContents.send('failure');
      console.log(err);
      return;
    } else {
      conn.exec('SELECT STARTDATE, LASTVISIT, CARDNUM, AMOUNTDUE, COMPANYNAME FROM Member WHERE CARDNUM=' + args, function(err, result) {
        if (err) {
          win.webContents.send('failure');
          console.log(err);
          return;
        } else {
          win.webContents.send('card', result);
          console.log(result);
          conn.disconnect();
        }
      })
    }
  });
});

function getAllCards() {
  conn.connect(conn_params, function(err) {
    if (err) {
      win.webContents.send('failure');
      console.log(err);
      return;
    } else {
      conn.exec('SELECT STARTDATE, LASTVISIT, CARDNUM, AMOUNTDUE, COMPANYNAME FROM Member ORDER BY MEMCODE DESC', function(err, result) {
        if (err) {
          win.webContents.send('failure');
          console.log(err);
          return;
        } else {
          win.webContents.send('allCards', result);
          cardList = result;
          console.log(result);
          conn.disconnect();
        }
      })
    }
  });
}
