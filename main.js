const {
  app,
  BrowserWindow,
  ipcMain
} = require('electron');
const path = require('path');
const fs = require('fs');
//const downloadsFolder = require('downloads-folder');
let downloadsFolder = process.env.USERPROFILE + "/Downloads";
let win;
let cardList;
let currentCard = [];
let lastMemcode = 0;

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
      devTools: false
    }
  })
  win.loadFile('index.html')
  win.webContents.once('did-finish-load', function() {
    win.show();
    getLastMemcode();
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

ipcMain.on('card-list-download', () => {
  downloadList();
});

ipcMain.on('get-all-cards', () => {
  getAllCards();
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
          currentCard = result;
          console.log(result);
          conn.disconnect();
        }
      })
    }
  });
});

ipcMain.on('update-balance', (event, args) => {
  let cardNumber = args[0];
  let editAmount = args[1];
  let cardOwner = args[2];
  let operator = args[3];

  console.log(args.toString());

  if (currentCard.length == 0) {
    let issueDate = generateDatabaseDateTime(new Date());
    let anniversary = issueDate;
    let expDate = "2999-12-31 12:59:59.000";
    let fName = "Gift";
    let lName = "Card";
    let isActive = 1;

    conn.connect(conn_params, function(err) {
      if (err) {
        win.webContents.send('failure');
        console.log(err);
        return;
      } else {
        conn.exec('INSERT INTO Member (MEMCODE, FIRSTNAME, LASTNAME, STARTDATE, EXPDATE, ANNIVER, CARDNUM, ISACTIVE, AMOUNTDUE, COMPANYNAME) VALUES (?,?,?,?,?,?,?,?,?,?)', [(lastMemcode + 1), fName, lName, issueDate, expDate, anniversary, cardNumber, isActive, (-editAmount), cardOwner], function(err, affectedRows) {
          if (err) {
            win.webContents.send('failure');
            console.log(err);
            conn.disconnect();
            return;
          } else {
            console.log(affectedRows);
            conn.commit();
            if (affectedRows > 0) {
              win.webContents.send('success');
              conn.disconnect(function(err) {
                if (err) {
                  console.log(err);
                } else {
                  setTimeout(function() {
                    updateAllCardsList();
                  }, 2000);
                }
              });
            }
            conn.disconnect();
          }
        })
      }
    });

  } else {
    let balance = currentCard[0].AMOUNTDUE;

    if (operator == 'plus') {
      balance = parseFloat((parseFloat(balance) - parseFloat(editAmount)).toFixed(2));
    } else {
      balance = parseFloat((parseFloat(balance) + parseFloat(editAmount)).toFixed(2));
    }

    conn.connect(conn_params, function(err) {
      if (err) {
        win.webContents.send('failure');
        console.log(err);
        return;
      } else {
        conn.exec('UPDATE Member SET COMPANYNAME = ?, AMOUNTDUE = ? WHERE CARDNUM = ?', [cardOwner, balance, cardNumber], function(err, affectedRows) {
          if (err) {
            win.webContents.send('failure');
            conn.disconnect();
            console.log(err);
            return;
          } else {
            console.log(affectedRows);
            conn.commit();
            if (affectedRows > 0) {
              win.webContents.send('success');
              conn.disconnect(function(err) {
                if (err) {
                  console.log(err);
                } else {
                  setTimeout(function() {
                    updateAllCardsList();
                  }, 2000);
                }
              });
            } else {
              conn.disconnect();
            }
          }
        })
      }
    });
  }
});

function generateDatabaseDateTime(date) {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

function getLastMemcode() {
  conn.connect(conn_params, function(err) {
    if (err) {
      win.webContents.send('failure');
      console.log(err);
      return;
    } else {
      conn.exec('SELECT TOP 1 MEMCODE FROM Member ORDER BY MEMCODE DESC', function(err, result) {
        if (err) {
          win.webContents.send('failure');
          console.log(err);
          conn.disconnect();
          return;
        } else {
          lastMemcode = result[0].MEMCODE;
          console.log("Memcode is: " + lastMemcode);
          conn.disconnect();
        }
      })
    }
  });
}

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
          conn.disconnect();
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

function updateAllCardsList() {
  conn.connect(conn_params, function(err) {
    if (err) {
      console.log(err);
      return;
    } else {
      conn.exec('SELECT STARTDATE, LASTVISIT, CARDNUM, AMOUNTDUE, COMPANYNAME FROM Member ORDER BY MEMCODE DESC', function(err, result) {
        if (err) {
          console.log(err);
          conn.disconnect();
          return;
        } else {
          cardList = result;
          console.log(result);
          downloadList();
          conn.disconnect(function(err) {
            if (err) {
              console.log(err);
            } else {
              setTimeout(function() {
                getLastMemcode();
              }, 2000);
            }
          });
        }
      })
    }
  });
}


function downloadList() {
  let data = ""
  cardList.forEach(function(card) {
    data += JSON.stringify(card, null, 2) + "\n"
  });
  fs.writeFile(downloadsFolder + '/gift-card-backup.txt', data, function(err) {
    if (err) {
      console.log(err);
      return;
    } else {
      win.webContents.send('downloadSuccess');
    }
  });
}
