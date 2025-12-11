import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    const { width, height } = this.scale;

    this.add.rectangle(width / 2, height / 2, width, height, 0x050608, 0.92);

    this.add.text(width / 2, height * 0.28, 'DECLAN VS THE MAINFRAME', {
      fontFamily: 'Press Start 2P',
      fontSize: '20px',
      color: '#8df757',
      stroke: '#1ef2f2',
      strokeThickness: 4,
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.4, 'A neon gauntlet of puzzle firewalls', {
      fontFamily: 'Share Tech Mono',
      fontSize: '18px',
      color: '#e7ecff',
      align: 'center',
    }).setOrigin(0.5);

    const startButton = this.makeButton(width / 2, height * 0.58, 'Start New Run', () => this.startNewGame());
    startButton.setData('type', 'start');

    const progress = this.loadProgress();
    if (progress) {
      this.makeButton(width / 2, height * 0.68, 'Continue Run', () => this.resumeGame(progress));
      this.add.text(width / 2, height * 0.76, `Layer ${progress.layer} · ${progress.hints} hints left`, {
        fontFamily: 'Share Tech Mono',
        fontSize: '14px',
        color: '#57f7ff',
      }).setOrigin(0.5);
    }

    this.add.text(width / 2, height * 0.9, 'Press SPACE to start', {
      fontFamily: 'Share Tech Mono',
      fontSize: '14px',
      color: '#e7ecff',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => this.startNewGame());
  }

  makeButton(x, y, label, onClick) {
    const button = this.add.text(x, y, label, {
      fontFamily: 'Share Tech Mono',
      fontSize: '18px',
      backgroundColor: '#1ef2f2',
      color: '#0b1020',
      padding: { x: 12, y: 8 },
    })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => button.setStyle({ backgroundColor: '#57f7ff' }))
      .on('pointerout', () => button.setStyle({ backgroundColor: '#1ef2f2' }))
      .on('pointerup', onClick);

    return button;
  }

  startNewGame() {
    localStorage.removeItem('declan-progress');
    this.scene.start('GameScene', { layer: 1, hints: 3, seenTutorial: {} });
  }

  resumeGame(progress) {
    this.scene.start('GameScene', progress);
  }

  loadProgress() {
    try {
      const saved = localStorage.getItem('declan-progress');
      if (!saved) return null;
      const data = JSON.parse(saved);
      if (!data.layer || !data.hints) return null;
      return data;
    } catch (err) {
      return null;
    }
  }
}
