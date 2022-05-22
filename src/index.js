const { app, BrowserWindow } = require('electron')
const fs = require('fs')
let myWindow = null;

global.path = (process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + "/.local/share")) + "/digibytecanvas";
if (!fs.existsSync(global.path))
  fs.mkdirSync(global.path);

// only one instance
if (!app.requestSingleInstanceLock()) {
  app.quit();
  process.exit();
}

app.whenReady().then(() => {
  myWindow = new BrowserWindow({
    width: 450,
    height: 650,
    webPreferences: {
      devTools: false,
      nodeIntegration: true,
      contextIsolation: false
    },
    icon: __dirname + "\\views\\img\\icon.png",
    autoHideMenuBar: true,
    maximizable: false,
    resizable: false,
    show: false
  })
  myWindow.setAlwaysOnTop(true, 'screen');
  myWindow.loadFile(__dirname + '/views/index.html');
  myWindow.webContents.once('did-finish-load', function () { myWindow.show() });
})

app.on('second-instance', (event, commandLine, workingDirectory) => {
  if (myWindow) {
    if (myWindow.isMinimized()) myWindow.restore()
    myWindow.focus()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit()
})