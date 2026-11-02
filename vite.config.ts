import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  base: './', // o instalador abre os arquivos do disco, então os caminhos precisam ser relativos
  plugins: [
    electron({
      main: { entry: 'electron/main.ts' },
      preload: { input: 'electron/preload.ts' },
    }),
  ],
})