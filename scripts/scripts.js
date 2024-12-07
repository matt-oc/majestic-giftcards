window.$ = window.jQuery = require('jquery');
const {
  ipcRenderer
} = require('electron');

ipcRenderer.on('appVersion', (event, messages) => {
  $("#version").html("Version: " + messages);
})
