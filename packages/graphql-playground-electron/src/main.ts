// TODO enable tslint
/* tslint:disable */
import {
  app,
  BrowserWindow,
  dialog,
  globalShortcut,
  ipcMain,
  Menu,
} from 'electron'
import * as electronLocalShortcut from 'electron-localshortcut'
import { autoUpdater } from 'electron-updater'
const dev = require('electron-is-dev')

const path = require('path')

const { newWindowConfig } = require('./utils')

const server = 'https://hazel-wmigqegsed.now.sh'
const feed = `${server}/update/${process.platform}/${app.getVersion()}`

function getFocusedWindow(): any | null {
  return BrowserWindow.getFocusedWindow()
}

function manuallyCheckForUpdates() {
  autoUpdater.on('update-available', () => {
    dialog.showMessageBox(
      {
        type: 'info',
        title: 'Found Updates',
        message: 'Found updates, do you want update now?',
        buttons: ['Sure', 'No'],
      },
      buttonIndex => {
        if (buttonIndex === 0) {
          autoUpdater.downloadUpdate()
        }
      },
    )
  })

  autoUpdater.on('update-not-available', () => {
    dialog.showMessageBox({
      title: 'No Updates',
      message: 'Current version is up-to-date.',
    })
  })

  autoUpdater.checkForUpdates()
}

function prevTab() {
  const focusedWindow = getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.webContents.send('Tab', 'Prev')
  }
}

function nextTab() {
  const focusedWindow = getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.webContents.send('Tab', 'Next')
  }
}

function newTab() {
  const focusedWindow = getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.webContents.send('Tab', 'New')
  }
}

function closeTab() {
  const focusedWindow = getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.webContents.send('Tab', 'Close')
  }
}

function initAutoUpdate() {
  if (dev) return

  if (process.platform === 'linux') return

  autoUpdater.on('update-downloaded', showUpdateNotification)

  autoUpdater.on('error', (event, error) => {
    dialog.showErrorBox(
      'Error: ',
      error == null ? 'unknown' : (error.stack || error).toString(),
    )
  })

  autoUpdater.checkForUpdates()
}

function showUpdateNotification(it) {
  it = it || {}
  const restartNowAction = 'Restart Now'

  const versionLabel = it.label ? `Version ${it.version}` : 'The latest version'

  dialog.showMessageBox(
    {
      type: 'info',
      title: 'Install Updates',
      message: `${versionLabel} has been downloaded and application will be quit for update...`,
    },
    () => {
      setImmediate(() => autoUpdater.quitAndInstall())
    },
  )
}

ipcMain.on('async', (event, arg) => {
  const focusedWindow = getFocusedWindow()
  if (focusedWindow) {
    focusedWindow.close()
  }
})

const windows = new Set([])

function createWindow() {
  // Create the browser window.
  const newWindow = new BrowserWindow(newWindowConfig)

  newWindow.loadURL(
    dev
      ? 'http://localhost:4040' // Dev server ran by react-scripts
      : `file://${path.join(__dirname, '/dist/index.html')}`, // Bundled application
  )

  if (dev) {
    // If dev mode install react and redux extension
    // Also open the devtools
    const {
      default: installExtension,
      REACT_DEVELOPER_TOOLS,
      REDUX_DEVTOOLS,
    } = require('electron-devtools-installer')

    installExtension(REACT_DEVELOPER_TOOLS)
      .then(name => console.log(`Added Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err))

    installExtension(REDUX_DEVTOOLS)
      .then(name => console.log(`Added Extension:  ${name}`))
      .catch(err => console.log('An error occurred: ', err))

    newWindow.webContents.openDevTools()
  }

  windows.add(newWindow)

  // Emitted when the window is closed.
  newWindow.on('closed', function() {
    if (process.platform !== 'darwin' && windows.size === 0) {
      app.quit()
    }
  })

  electronLocalShortcut.register(newWindow, 'Cmd+Shift+]', () => {
    nextTab()
  })

  electronLocalShortcut.register(newWindow, 'Cmd+Shift+[', () => {
    prevTab()
  })

  return newWindow
}

// TODO use proper typing, maybe we need to update to electron 1.7.1 as they fixed some ts definitions
// https://github.com/electron/electron/releases/tag/v1.7.1
const template: any = [
  {
    label: 'Application',
    submenu: [
      {
        label: 'About GraphQL Playground',
        selector: 'orderFrontStandardAboutPanel:',
      },
      {
        label: 'Check For Updates',
        click: () => manuallyCheckForUpdates(),
      },
      { type: 'separator' },
      {
        label: 'Quit',
        accelerator: 'Command+Q',
        click: () => app.quit(),
      },
    ],
  },
  {
    label: 'File',
    submenu: [
      {
        label: 'New window',
        accelerator: 'Cmd+N',
        click: () => {
          createWindow()
        },
      },
      {
        label: 'New Tab',
        accelerator: 'Cmd+T',
        click: () => newTab(),
      },
      { type: 'separator' },
      { label: 'Close Window', accelerator: 'Cmd+Shift+W' },
      {
        label: 'Close Tab',
        accelerator: 'Cmd+W',
        click: () => closeTab(),
      },
    ],
  },
  {
    label: 'Edit',
    submenu: [
      { label: 'Undo', accelerator: 'CmdOrCtrl+Z', selector: 'undo:' },
      { label: 'Redo', accelerator: 'Shift+CmdOrCtrl+Z', selector: 'redo:' },
      { type: 'separator' },
      { label: 'Cut', accelerator: 'CmdOrCtrl+X', selector: 'cut:' },
      { label: 'Copy', accelerator: 'CmdOrCtrl+C', selector: 'copy:' },
      { label: 'Paste', accelerator: 'CmdOrCtrl+V', selector: 'paste:' },
      {
        label: 'Select All',
        accelerator: 'CmdOrCtrl+A',
        selector: 'selectAll:',
      },
    ],
  },
  {
    label: 'Window',
    submenu: [
      {
        label: 'Next Tab',
        accelerator: 'Cmd+Alt+Right',
        click: () => nextTab(),
      },
      {
        label: 'Previous Tab',
        accelerator: 'Cmd+Alt+Left',
        click: () => prevTab(),
      },
      {
        label: 'Minimize',
        accelerator: 'Cmd+M',
        click: () => {
          const focusedWindow = getFocusedWindow()
          if (focusedWindow) {
            focusedWindow.minimize()
          }
        },
      },
      { type: 'separator' },
      { label: 'Toggle Developer Tools', role: 'toggledevtools' },
    ],
  },
]

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  createWindow()
  initAutoUpdate()

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
})

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!windows.size) {
    createWindow()
  }
})

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})
