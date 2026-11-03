import { criarSave } from './save'

const janela = document.getElementById('criar')!
const campo = document.getElementById('criar-nome') as HTMLInputElement
let slotAtual = 0
let aoCriar: () => void = () => {}

export function abrirCriacao(indice: number, depois: () => void) {
  slotAtual = indice
  aoCriar = depois
  campo.value = ''
  janela.classList.add('aberta')
  campo.focus()
}

function fechar() {
  janela.classList.remove('aberta')
}

function confirmar() {
  const nome = campo.value.trim()
  if (!nome) {
    campo.focus()
    return
  }
  criarSave(slotAtual, nome, 'shorthair') // cabelo fixo por enquanto
  fechar()
  aoCriar()
}

document.getElementById('criar-cancelar')!.addEventListener('click', fechar)
document.getElementById('criar-ok')!.addEventListener('click', confirmar)

// Enter cria, Esc cancela. O stopPropagation impede o Phaser de "roubar" as teclas
// (W, A, S, D, E e Espaço) enquanto você digita o nome.
campo.addEventListener('keydown', (e) => {
  e.stopPropagation()
  if (e.key === 'Enter') confirmar()
  if (e.key === 'Escape') fechar()
})