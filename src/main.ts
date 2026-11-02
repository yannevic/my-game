import Phaser from 'phaser'
import './style.css'

const VELOCIDADE = 80 // pixels por segundo
// Altura dos sprites em relação à caixinha de colisão.
// Número MAIOR = desenho mais para BAIXO. Número MENOR = desenho mais para CIMA.
const DESLOCAMENTO_Y = -2

class MainScene extends Phaser.Scene {
  private jogador!: Phaser.GameObjects.Container
  private corpoFisico!: Phaser.Physics.Arcade.Body
  private corpo!: Phaser.GameObjects.Sprite
  private cabelo!: Phaser.GameObjects.Sprite
  private setas!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private npcs: { nome: string; mensagem: string; x: number; y: number }[] = []
  private npcPerto: { nome: string; mensagem: string; x: number; y: number } | null = null
  private teclaE!: Phaser.Input.Keyboard.Key
  private dialogoAberto = false
  private caixaEl!: HTMLElement
  private nomeEl!: HTMLElement
  private textoEl!: HTMLElement
  private teclaEspaco!: Phaser.Input.Keyboard.Key
  private teclaEnter!: Phaser.Input.Keyboard.Key
  private dica!: Phaser.GameObjects.Container
  private icones: Phaser.GameObjects.Image[] = []

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
    this.load.image('exclamacao', 'assets/cozy-ui/exclamacao.png')
    this.load.image('tecla', 'assets/cozy-ui/tecla.png')
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

    // Colisão por tiles: todo tile pintado bloqueia (-1 = vazio)
    const colisao = mapa.createLayer('colisao', tileset)
    colisao?.setCollisionByExclusion([-1])
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

    // Personagem: sprites um pouco acima do ponto (y = -10) para os pés ficarem na caixinha
        this.corpo = this.add.sprite(0, DESLOCAMENTO_Y, 'corpo_idle')
    this.cabelo = this.add.sprite(0, DESLOCAMENTO_Y, 'cabelo_idle')
    this.corpo.play('corpo-idle')
    this.cabelo.play('cabelo-idle')
    this.jogador = this.add.container(mapa.widthInPixels / 2, mapa.heightInPixels / 2, [
      this.corpo,
      this.cabelo,
    ])

    // Corpo físico: caixinha de 10x8 (o container precisa de tamanho antes)
    this.jogador.setSize(10, 8)
    this.physics.add.existing(this.jogador)
    this.corpoFisico = this.jogador.body as Phaser.Physics.Arcade.Body
    this.corpoFisico.setCollideWorldBounds(true)

    // Limites do mundo = tamanho do mapa
    this.physics.world.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels)

    // Colisão com os tiles
    if (colisao) {
      this.physics.add.collider(this.jogador, colisao)
    }

      // Colisão com os retângulos: paredes estáticas e invisíveis
    const paredes = this.physics.add.staticGroup()
    const objetos = mapa.getObjectLayer('colisao_objetos')?.objects ?? []
  
    for (const obj of objetos) {
      const largura = obj.width ?? 0
      const altura = obj.height ?? 0
      const centroX = (obj.x ?? 0) + largura / 2
      const centroY = (obj.y ?? 0) + altura / 2
      // Imagem invisível (usa a textura 'tiles' só para ter um corpo), esticada para o tamanho do retângulo
      const parede = paredes.create(centroX, centroY, 'tiles') as Phaser.Physics.Arcade.Sprite
      parede.setVisible(false)
      parede.setDisplaySize(largura, altura)
      parede.refreshBody()
    }
    this.physics.add.collider(this.jogador, paredes)

        // NPCs: personagens parados, lidos da camada "npcs" do Tiled
    const pontosNpc = mapa.getObjectLayer('npcs')?.objects ?? []
    const npcsFisicos = this.physics.add.staticGroup()
    for (const ponto of pontosNpc) {
      const x = ponto.x ?? 0
      const y = ponto.y ?? 0
      const mensagem =
        (ponto.properties as { name: string; value: string }[] | undefined)?.find(
          (p) => p.name === 'mensagem',
        )?.value ?? ''

      // Desenho do personagem (corpo + cabelo), parado
      this.add.sprite(x, y + DESLOCAMENTO_Y, 'corpo_idle').play('corpo-idle')
      this.add.sprite(x, y + DESLOCAMENTO_Y, 'cabelo_idle').play('cabelo-idle')

      // Caixa de colisão invisível, do mesmo tamanho da do jogador (10x8)
      const caixa = npcsFisicos.create(x, y, 'tiles') as Phaser.Physics.Arcade.Sprite
      caixa.setVisible(false)
      caixa.setDisplaySize(10, 8)
      caixa.refreshBody()

            // "!" fixo em cima de cada NPC
      this.icones.push(this.add.image(x, y - 12, 'exclamacao').setScale(0.15).setOrigin(0.5, 1).setDepth(10))

      this.npcs.push({ nome: ponto.name, mensagem, x, y })
    }
    this.physics.add.collider(this.jogador, npcsFisicos)
    console.log('NPCs encontrados:', this.npcs)

    // Câmera: zoom, limites do mapa e seguindo o jogador
    const camera = this.cameras.main
    camera.setZoom(3)
    camera.setBounds(0, 0, mapa.widthInPixels, mapa.heightInPixels)
    camera.startFollow(this.jogador, true)

    // Teclas: setas e WASD
    const teclado = this.input.keyboard!
    this.setas = teclado.createCursorKeys()
    this.wasd = teclado.addKeys('W,A,S,D') as typeof this.wasd
        // Tecla E para falar com o NPC
    this.teclaE = teclado.addKey('E')

        this.teclaEspaco = teclado.addKey('SPACE')
    this.teclaEnter = teclado.addKey('ENTER')

    // Caixa de diálogo (HTML, definida no index.html)
    this.caixaEl = document.getElementById('caixa-dialogo')!
    this.nomeEl = this.caixaEl.querySelector('.nome')!
    this.textoEl = this.caixaEl.querySelector('.texto')!
      
       // Aviso "E / Interagir": botão em cima, palavra embaixo (texto desenhado grande e encolhido, para ficar nítido)
    this.textures.get('tecla').setFilter(Phaser.Textures.FilterMode.LINEAR)
    const botao = this.add.image(0, -8, 'tecla').setOrigin(0.5, 1).setDisplaySize(8, 8)
    const letra = this.add
      .text(0, -12.5, 'E', { fontFamily: 'Fredoka', fontStyle: '500', fontSize: '18px', color: '#5a4a45' })
      .setOrigin(0.5)
      .setScale(1 / 3)
    const rotulo = this.add
      .text(0, 0, 'Interagir', {
        fontFamily: 'Fredoka',
        fontStyle: '500',
        fontSize: '15px',
        color: '#ffffff',
        stroke: '#5a4a45',
        strokeThickness: 4,
      })
      .setOrigin(0.5, 1)
      .setScale(1 / 3)
    this.dica = this.add.container(0, 0, [botao, letra, rotulo]).setDepth(20).setVisible(false)

    
  }

    private abrirDialogo(nome: string, mensagem: string) {
    this.dialogoAberto = true
    this.nomeEl.textContent = nome
    this.textoEl.textContent = mensagem
    this.caixaEl.classList.add('aberta')
    // Descarta teclas apertadas antes, para a caixa não fechar sozinha
    Phaser.Input.Keyboard.JustDown(this.teclaEspaco)
    Phaser.Input.Keyboard.JustDown(this.teclaEnter)
  }

  private fecharDialogo() {
    this.dialogoAberto = false
    this.caixaEl.classList.remove('aberta')
  }

  update() {
        // Caixa aberta: personagem parado; E, Espaço ou Enter fecham
    if (this.dialogoAberto) {
      this.corpoFisico.setVelocity(0, 0)
      this.corpo.play('corpo-idle', true)
      this.cabelo.play('cabelo-idle', true)
      if (
        Phaser.Input.Keyboard.JustDown(this.teclaE) ||
        Phaser.Input.Keyboard.JustDown(this.teclaEspaco) ||
        Phaser.Input.Keyboard.JustDown(this.teclaEnter)
      ) {
        this.fecharDialogo()
      }
      return
    }
    let dx = 0
    let dy = 0
    if (this.setas.left.isDown || this.wasd.A.isDown) dx -= 1
    if (this.setas.right.isDown || this.wasd.D.isDown) dx += 1
    if (this.setas.up.isDown || this.wasd.W.isDown) dy -= 1
    if (this.setas.down.isDown || this.wasd.S.isDown) dy += 1

    if (dx !== 0 || dy !== 0) {
      // normalize: mesma velocidade em todas as direções
      const direcao = new Phaser.Math.Vector2(dx, dy).normalize()
      this.corpoFisico.setVelocity(direcao.x * VELOCIDADE, direcao.y * VELOCIDADE)

      if (dx !== 0) {
        this.corpo.setFlipX(dx < 0)
        this.cabelo.setFlipX(dx < 0)
      }

      this.corpo.play('corpo-walk', true)
      this.cabelo.play('cabelo-walk', true)
    } else {
      this.corpoFisico.setVelocity(0, 0)
      this.corpo.play('corpo-idle', true)
      this.cabelo.play('cabelo-idle', true)
    }

        // Procura o NPC mais próximo dentro do alcance
    const ALCANCE = 24
    this.npcPerto = null
    let menorDistancia = ALCANCE
    for (const npc of this.npcs) {
      const distancia = Phaser.Math.Distance.Between(this.jogador.x, this.jogador.y, npc.x, npc.y)
      if (distancia < menorDistancia) {
        menorDistancia = distancia
        this.npcPerto = npc
      }
    }
        // Apertou E perto de um NPC: abre a caixa de diálogo
    if (Phaser.Input.Keyboard.JustDown(this.teclaE) && this.npcPerto) {
      this.abrirDialogo(this.npcPerto.nome, this.npcPerto.mensagem)
    }

    // Perto de um NPC: o aviso substitui o "!". Longe: o "!" volta
    this.npcs.forEach((npc, i) => {
      this.icones[i].setVisible(npc !== this.npcPerto)
    })
    this.dica.setVisible(this.npcPerto !== null && !this.dialogoAberto)
    if (this.npcPerto) {
      this.dica.setPosition(this.npcPerto.x, this.npcPerto.y - 12)
    }
  }
}

// Espera a fonte carregar antes de iniciar o jogo
document.fonts.load('500 9px Fredoka').then(() => {
  new Phaser.Game({
    type: Phaser.AUTO,
    scale: {
      mode: Phaser.Scale.RESIZE, // o jogo ocupa a janela inteira
      width: '100%',
      height: '100%',
    },
    parent: 'game',
    backgroundColor: '#5aa469',
    pixelArt: true,
    physics: {
      default: 'arcade',
      arcade: { debug: true }, // mostra as caixas de colisão (voltar para false no fim)
    },
    scene: [MainScene],
  })
})