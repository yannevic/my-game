import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  winClose: () => ipcRenderer.send('win-close'),
})