import Phaser from 'phaser'
import './style.css'

const VELOCIDADE = 80 // pixels por segundo

class MainScene extends Phaser.Scene {
  private jogador!: Phaser.GameObjects.Container
  private corpo!: Phaser.GameObjects.Sprite
  private cabelo!: Phaser.GameObjects.Sprite
  private larguraMapa = 0
  private alturaMapa = 0
  private setas!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }

  constructor() {
    super('MainScene')
  }

  preload() {
    this.load.image('tiles', 'assets/tilesets/spr_tileset_sunnysideworld_16px.png')
    this.load.tilemapTiledJSON('mapa', 'assets/maps/mapa.json')

    // Personagem: cada tira tem quadros de 96x64
    const quadro = { frameWidth: 96, frameHeight: 64 }
    this.load.spritesheet('corpo_idle', 'assets/characters/human/base_idle_strip9.png', quadro)
    this.load.spritesheet('corpo_walk', 'assets/characters/human/base_walk_strip8.png', quadro)
    this.load.spritesheet('cabelo_idle', 'assets/characters/human/shorthair_idle_strip9.png', quadro)
    this.load.spritesheet('cabelo_walk', 'assets/characters/human/shorthair_walk_strip8.png', quadro)
  }

  create() {
    const mapa = this.make.tilemap({ key: 'mapa' })
    const tileset = mapa.addTilesetImage('sunnyside', 'tiles')

    if (!tileset) {
      console.error('Tileset "sunnyside" não encontrado no mapa')
      return
    }

    mapa.createLayer('chao', tileset)
    mapa.createLayer('decoracao_fundo', tileset)
    mapa.createLayer('decoracao', tileset)

    const colisao = mapa.createLayer('colisao', tileset)
    colisao?.setVisible(false)

    // Animações
    this.anims.create({
      key: 'corpo-idle',
      frames: this.anims.generateFrameNumbers('corpo_idle', { start: 0, end: 8 }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: 'cabelo-idle',
      frames: this.anims.generateFrameNumbers('cabelo_idle', { start: 0, end: 8 }),
      frameRate: 8,
      repeat: -1,
    })
    this.anims.create({
      key: 'corpo-walk',
      frames: this.anims.generateFrameNumbers('corpo_walk', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    })
    this.anims.create({
      key: 'cabelo-walk',
      frames: this.anims.generateFrameNumbers('cabelo_walk', { start: 0, end: 7 }),
      frameRate: 10,
      repeat: -1,
    })

    // Personagem: corpo e cabelo dentro de um container (se mexem juntos)
    this.corpo = this.add.sprite(0, 0, 'corpo_idle')
    this.cabelo = this.add.sprite(0, 0, 'cabelo_idle')
    this.corpo.play('corpo-idle')
    this.cabelo.play('cabelo-idle')
    this.jogador = this.add.container(mapa.widthInPixels / 2, mapa.heightInPixels / 2, [
      this.corpo,
      this.cabelo,
    ])

    // Câmera: zoom, limites do mapa e seguindo o jogador
    const camera = this.cameras.main
    this.larguraMapa = mapa.widthInPixels
    this.alturaMapa = mapa.heightInPixels
    camera.setZoom(3)
    camera.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels)
    camera.startFollow(this.jogador, true)

    // Teclas: setas e WASD
    const teclado = this.input.keyboard!
    this.setas = teclado.createCursorKeys()
    this.wasd = teclado.addKeys('W,A,S,D') as typeof this.wasd
  }

  update(_tempo: number, delta: number) {
    let dx = 0
    let dy = 0
    if (this.setas.left.isDown || this.wasd.A.isDown) dx -= 1
    if (this.setas.right.isDown || this.wasd.D.isDown) dx += 1
    if (this.setas.up.isDown || this.wasd.W.isDown) dy -= 1
    if (this.setas.down.isDown || this.wasd.S.isDown) dy += 1

    if (dx !== 0 || dy !== 0) {
      const direcao = new Phaser.Math.Vector2(dx, dy).normalize()
      const passo = VELOCIDADE * (delta / 1000)
      this.jogador.x += direcao.x * passo
      this.jogador.y += direcao.y * passo
      // Não deixa o personagem sair do mapa (margem de 8 px)
      this.jogador.x = Phaser.Math.Clamp(this.jogador.x, 8, this.larguraMapa - 8)
      this.jogador.y = Phaser.Math.Clamp(this.jogador.y, 8, this.alturaMapa - 8)

      if (dx !== 0) {
        this.corpo.setFlipX(dx < 0)
        this.cabelo.setFlipX(dx < 0)
      }

      this.corpo.play('corpo-walk', true)
      this.cabelo.play('cabelo-walk', true)
    } else {
      this.corpo.play('corpo-idle', true)
      this.cabelo.play('cabelo-idle', true)
    }
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