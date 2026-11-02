import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Com "type": "module" o __dirname não existe, então criamos ele aqui
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// true = o jogo abre em tela cheia (F11 alterna entre tela cheia e janela)
const COMECAR_EM_TELA_CHEIA = true

function criarJanela() {
  const janela = new BrowserWindow({
    width: 1280,
    height: 720,
    fullscreen: COMECAR_EM_TELA_CHEIA,
    autoHideMenuBar: true,
    backgroundColor: '#222222',
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // F11 alterna entre tela cheia e janela
  janela.webContents.on('before-input-event', (event, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') {
      janela.setFullScreen(!janela.isFullScreen())
      event.preventDefault()
    }
  })

  // Botão Sair do jogo (usado na próxima etapa)
  ipcMain.on('win-close', () => janela.close())

  if (process.env.VITE_DEV_SERVER_URL) {
    janela.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    janela.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  criarJanela()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) criarJanela()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})