import { listarSlots, type Save } from './save'
import { abrirCriacao } from './criar'

const lista = document.querySelector('#slots .lista')!

const CANTOS = '<i class="c c1"></i><i class="c c2"></i><i class="c c3"></i><i class="c c4"></i>'

function formatarTempo(segundos: number) {
  const h = Math.floor(segundos / 3600)
  const m = Math.floor((segundos % 3600) / 60)
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}min` : `${m}min`
}

function formatarData(ms: number) {
  return new Date(ms).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  })
}

// 5 corações, cada um vale 20 de vida; com 10 a 19 sobra meio coração
function coracoes(vida: number) {
  let html = ''
  for (let i = 0; i < 5; i++) {
    const pontos = vida - i * 20
    const tipo = pontos >= 20 ? 'cheio' : pontos >= 10 ? 'meio' : 'vazio'
    html += `<img src="/assets/cozy-ui/coracao_${tipo}.png" alt="" />`
  }
  return html
}

function criarSlotVazio(indice: number) {
  const slot = document.createElement('div')
  slot.className = 'slot vazio'
  slot.dataset.indice = String(indice)
  slot.innerHTML = `${CANTOS}<img class="mais" src="/assets/cozy-ui/mais.png" alt="" />`
  return slot
}

function criarSlotCheio(indice: number, save: Save) {
  const slot = document.createElement('div')
  slot.className = 'slot cheio'
  slot.dataset.indice = String(indice)
    slot.innerHTML = `
    ${CANTOS}
    <div class="info">
      <div class="topo">
        <div class="nome"></div>
        <div class="data">${formatarData(save.ultimaVez)}</div>
      </div>
            <div class="stats">
        <div class="esq">
          <div class="linha"><img src="/assets/cozy-ui/moeda.png" alt="" />${save.ouro}</div>
          <div class="linha"><img src="/assets/icones/relogio.png" alt="" />${formatarTempo(save.tempoJogado)}</div>
        </div>
        <div class="linha vida">${coracoes(save.vida)}</div>
      </div>
    </div>
    <div class="acoes">
      <button class="mini copiar" title="Copiar"><img src="/assets/icones/copiar.png" alt="" /></button>
      <button class="mini excluir" title="Excluir"><img src="/assets/icones/lixeira.png" alt="" /></button>
    </div>`
  // O nome é digitado por mim, então entra como texto (nunca como HTML)
  slot.querySelector('.nome')!.textContent = save.nome
  return slot
}

export function renderizarSlots() {
  lista.innerHTML = ''
  listarSlots().forEach((save, i) => {
    lista.appendChild(save ? criarSlotCheio(i, save) : criarSlotVazio(i))
  })
}

renderizarSlots()

// Clicar num slot vazio abre a criação do save
lista.addEventListener('click', (e) => {
  const slot = (e.target as HTMLElement).closest('.slot.vazio') as HTMLElement | null
  if (slot) abrirCriacao(Number(slot.dataset.indice), renderizarSlots)
})