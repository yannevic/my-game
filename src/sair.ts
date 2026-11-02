// Botão Sair do menu: abre a janelinha; "Sim" fecha o jogo de verdade (Electron)
declare global {
  interface Window {
    api?: { winClose: () => void }
  }
}

const janela = document.getElementById('confirmar')!
const abrir = () => janela.classList.add('aberta')
const fechar = () => janela.classList.remove('aberta')

document.getElementById('btn-sair')!.addEventListener('click', abrir)
document.getElementById('btn-sair-nao')!.addEventListener('click', fechar)
document.getElementById('btn-sair-sim')!.addEventListener('click', () => {
  window.api?.winClose()
})

// Esc = "Não"
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') fechar()
})

export {}