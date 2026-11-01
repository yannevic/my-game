import Phaser from 'phaser'
import './style.css'

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  preload() {
    this.load.image('tiles', 'assets/tilesets/spr_tileset_sunnysideworld_16px.png')
    this.load.tilemapTiledJSON('mapa', 'assets/maps/mapa.json')
  }

  create() {
    // Cria o mapa a partir do JSON
    const mapa = this.make.tilemap({ key: 'mapa' })

    // Liga o nome do tileset no Tiled ('sunnyside') à imagem ('tiles')
    const tileset = mapa.addTilesetImage('sunnyside', 'tiles')

    if (!tileset) {
      console.error('Tileset "sunnyside" não encontrado no mapa')
      return
    }

    // Camadas, de baixo para cima (a ordem de criação define quem fica por cima)
    mapa.createLayer('chao', tileset)
    mapa.createLayer('decoracao_fundo', tileset)
    mapa.createLayer('decoracao', tileset)

    // Camada de colisão: criada, mas invisível para o jogador
    const colisao = mapa.createLayer('colisao', tileset)
    colisao?.setVisible(false)
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  parent: 'game',
  backgroundColor: '#5aa469',
  pixelArt: true,
  scene: [MainScene],
})