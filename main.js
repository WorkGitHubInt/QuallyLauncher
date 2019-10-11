const electron = require('electron');
const app = electron.app;
const path = require('path');

if (handleSquirrelEvent()) {
  return;
}

function handleSquirrelEvent() {
  if (process.argv.length === 1) {
    return false;
  }
  const ChildProcess = require('child_process');
  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;
    try {
      spawnedProcess = ChildProcess.spawn(command, args, { detached: true });
    } catch (error) { }
    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
    case '--squirrel-updated':
      spawnUpdate(['--createShortcut', exeName]);
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      spawnUpdate(['--removeShortcut', exeName]);
      setTimeout(app.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      app.quit();
      return true;
  }
};

const squirrelUrl = "https://botqually.ru/explorer/";

const startAutoUpdater = (squirrelUrl) => {
  // The Squirrel application will watch the provided URL
  electron.autoUpdater.setFeedURL(`${squirrelUrl}`);

  // Display a success message on successful update
  electron.autoUpdater.addListener("update-downloaded", (event, releaseNotes, releaseName) => {
    electron.dialog.showMessageBox({"message": `Новая версия ${releaseName} скачена и будет установлена после перезапуска!`, type: 'info', title : 'Проверка обновления'});
    electron.autoUpdater.quitAndInstall();
  });

  // Display an error message on update error
  electron.autoUpdater.addListener("error", (error) => {
    electron.dialog.showMessageBox({"message": "Ошибка проверки обновления: " + error, type: 'error', title : 'Проверка обновления'});
  });

  // tell squirrel to check for updates
  electron.autoUpdater.checkForUpdates();
}

app.on('ready', function (){
  startAutoUpdater(squirrelUrl)
});

const { BrowserWindow } = require('electron')
const fs = require('fs');
let win
app.on('ready', () => {
  let localVersions = {
    botQuallyVersion: '1.0',
    quallyFlashVersion: '1.0',
    accountHolderVersion: '1.0',
  };
  let userPath = app.getPath('userData');
  let userPrograms = path.join(userPath, 'Programs');
  if (!fs.existsSync(userPrograms)) {
    fs.mkdirSync(userPrograms);
    fs.mkdirSync(path.join(userPrograms, 'BotQually'));
    fs.mkdirSync(path.join(userPrograms, 'QuallyFlash'));
    fs.mkdirSync(path.join(userPrograms, 'AccountHolder'));
    fs.writeFileSync(path.join(userPrograms, 'versions.json'), JSON.stringify(localVersions), 'utf8');
    try {
      fs.unlinkSync(path.join(userPath, 'Cache'));
    } catch {
      console.log("error no folder");
    }
  }
  createWindow()
})

function createWindow() {
  win = new BrowserWindow({ width: 1050, height: 800, minWidth: 1020, minHeight: 800, icon: __dirname + '/icons/logo.ico' })
  win.loadFile('index.html')
  win.on('closed', () => {
    win = null
  });
  win.webContents.session.clearCache(() => {});
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (win === null) {
    createWindow()
  }
})