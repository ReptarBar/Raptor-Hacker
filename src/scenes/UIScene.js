import Phaser from 'phaser';

export default class UIScene extends Phaser.Scene {
  constructor() {
    super('UIScene');
    this.layerText = null;
    this.quipText = null;
    this.hintText = null;
    this.tutorial = null;
  }

  create() {
    const { width } = this.scale;
    const gameScene = this.scene.get('GameScene');

    this.layerText = this.add.text(16, 12, 'Security Layer 1 of 5', {
      fontFamily: 'Share Tech Mono',
      fontSize: '18px',
      color: '#8df757',
    });

    this.quipText = this.add.text(16, 38, 'Declan is warming up.', {
      fontFamily: 'Share Tech Mono',
      fontSize: '15px',
      color: '#e7ecff',
    });

    const portrait = this.add.image(width - 70, 42, 'portrait').setScale(0.55);
    portrait.setTint(0x8df757);

    const hintButton = this.add.text(width - 180, 20, 'Hint', {
      fontFamily: 'Share Tech Mono',
      fontSize: '16px',
      backgroundColor: '#1ef2f2',
      color: '#0b1020',
      padding: { x: 10, y: 6 },
    })
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => gameScene.events.emit('use-hint'));

    this.hintText = this.add.text(width - 180, 50, 'Hints left: 3', {
      fontFamily: 'Share Tech Mono',
      fontSize: '14px',
      color: '#e7ecff',
    });

    gameScene.events.on('layer-updated', (payload) => {
      this.layerText.setText(`Security Layer ${payload.layer} of ${payload.total}`);
      this.quipText.setText(`${payload.name}: ${payload.quip}`);
      this.hintText.setText(`Hints left: ${payload.hints}`);
    });

    gameScene.events.on('hint-update', ({ hints }) => this.hintText.setText(`Hints left: ${hints}`));

    gameScene.events.on('show-tutorial', ({ text }) => this.showTutorial(text));
  }

  showTutorial(text) {
    if (this.tutorial) this.tutorial.destroy();
    const { width, height } = this.scale;
    const panel = this.add.container(width / 2, height - 110);
    const bg = this.add.rectangle(0, 0, width * 0.86, 120, 0x0b1020, 0.78).setStrokeStyle(2, 0x57f7ff, 0.6);
    const label = this.add.text(0, 0, text, {
      fontFamily: 'Share Tech Mono',
      fontSize: '16px',
      color: '#e7ecff',
      wordWrap: { width: width * 0.8 },
      align: 'center',
    }).setOrigin(0.5);
    panel.add([bg, label]);
    this.tutorial = panel;
    this.time.delayedCall(5000, () => panel.destroy());
  }
}
