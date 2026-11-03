// Saves do jogo: 3 slots guardados no localStorage (fica salvo no PC, sem internet).
// O resto do jogo só usa as funções daqui; se um dia mudarmos onde guardar, só este arquivo muda.

const PREFIXO = 'miya-save-'
export const TOTAL_SLOTS = 3
export const VERSAO_SAVE = 1

export const CABELOS = ['bowlhair', 'curlyhair', 'longhair', 'mophair', 'shorthair', 'spikeyhair'] as const
export type Cabelo = (typeof CABELOS)[number]

export type Save = {
  versao: number
  nome: string
  cabelo: Cabelo
  criadoEm: number // data em milissegundos (Date.now())
  ultimaVez: number // última vez que jogou, também em milissegundos
  tempoJogado: number // em segundos
  ouro: number
  vida: number
}

// Lê um slot (0, 1 ou 2). Devolve null se estiver vazio ou se o dado estiver estragado.
export function lerSlot(indice: number): Save | null {
  try {
    const texto = localStorage.getItem(PREFIXO + indice)
    return texto ? (JSON.parse(texto) as Save) : null
  } catch {
    return null
  }
}

// Lista os 3 slots de uma vez: [save, null, save]
export function listarSlots(): (Save | null)[] {
  return Array.from({ length: TOTAL_SLOTS }, (_, i) => lerSlot(i))
}

export function existeAlgumSave(): boolean {
  return listarSlots().some((s) => s !== null)
}

// Grava (ou regrava) um save num slot
export function gravarSlot(indice: number, save: Save) {
  localStorage.setItem(PREFIXO + indice, JSON.stringify(save))
}

// Cria um save novo num slot, com os valores iniciais
export function criarSave(indice: number, nome: string, cabelo: Cabelo): Save {
  const agora = Date.now()
  const save: Save = {
    versao: VERSAO_SAVE,
    nome: nome.trim(),
    cabelo,
    criadoEm: agora,
    ultimaVez: agora,
    tempoJogado: 0,
    ouro: 0,
    vida: 100,
  }
  gravarSlot(indice, save)
  return save
}

export function excluirSlot(indice: number) {
  localStorage.removeItem(PREFIXO + indice)
}

// Copia um save para o primeiro slot vazio. Devolve o número do slot novo, ou null se não houver vaga.
export function copiarSlot(origem: number): number | null {
  const save = lerSlot(origem)
  if (!save) return null
  const vazio = listarSlots().findIndex((s) => s === null)
  if (vazio === -1) return null
  gravarSlot(vazio, { ...save, nome: save.nome + ' (cópia)' })
  return vazio
}