const { app, BrowserWindow, Menu } = require('electron')
const path = require('path')

// 单例应用程序
if (!app.requestSingleInstanceLock()) {
  app.quit()
  return
}
app.on('second-instance', (event, argv, cwd) => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore()
    mainWindow.focus()
  } else {
    app.quit()
  }
})

require('./events')
const progressBar = require('./events/progressBar')
const trafficLight = require('./events/trafficLight')
const autoUpdate = require('./utils/autoUpdate')
const { isLinux, isMac } = require('../common/utils')

const isDev = process.env.NODE_ENV !== 'production'

/**
 * Set `__static` path to static files in production
 * https://simulatedgreg.gitbooks.io/electron-vue/content/en/using-static-assets.html
 */

let mainWindow
let winURL

if (isDev) {
  global.__static = path.join(__dirname, '../static')
  winURL = `http://localhost:9080`
} else {
  global.__static = path.join(__dirname, '/static')
  winURL = `file://${__dirname}/index.html`
}

function createWindow() {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    height: 590,
    useContentSize: true,
    width: 920,
    frame: false,
    transparent: !isLinux,
    // icon: path.join(global.__static, isWin ? 'icons/256x256.ico' : 'icons/512x512.png'),
    resizable: false,
    maximizable: false,
    fullscreenable: false,
    webPreferences: {
      // contextIsolation: true,
      webSecurity: !isDev,
      nodeIntegration: true,
    },
  })

  mainWindow.loadURL(winURL)

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // mainWindow.webContents.openDevTools()

  trafficLight(mainWindow)
  progressBar(mainWindow)
  if (!isDev) autoUpdate(mainWindow)
}

if (isMac) {
  const template = [
    {
      label: app.getName(),
      submenu: [{ label: '关于洛雪音乐', role: 'about' }, { type: 'separator' }, { label: '隐藏', role: 'hide' }, { label: '显示其他', role: 'hideothers' }, { label: '显示全部', role: 'unhide' }, { type: 'separator' }, { label: '退出', click: () => app.quit() }],
    },
    {
      label: '窗口',
      role: 'window',
      submenu: [{ label: '最小化', role: 'minimize' }, { label: '关闭', role: 'close' }],
    },
  ]

  Menu.setApplicationMenu(Menu.buildFromTemplate(template))
} else {
  Menu.setApplicationMenu(null)
}

app.on('ready', createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
