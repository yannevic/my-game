import Phaser from 'phaser'
import './style.css'

class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene')
  }

  create() {
    this.add
      .text(400, 300, 'Olá, mundo!', { fontSize: '32px', color: '#ffffff' })
      .setOrigin(0.5)
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