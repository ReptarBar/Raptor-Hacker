import Phaser from 'phaser';

export default class EndScene extends Phaser.Scene {
  constructor() {
    super('EndScene');
  }

  create() {
    const { width, height } = this.scale;
    this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.75);

    this.add.text(width / 2, height * 0.32, 'ACCESS GRANTED', {
      fontFamily: 'Press Start 2P',
      fontSize: '26px',
      color: '#8df757',
      stroke: '#1ef2f2',
      strokeThickness: 4,
    }).setOrigin(0.5);

    const lines = [
      'The core shimmers and resolves into a classroom-sized holodeck.',
      'Declan laughs. The "mainframe" was a puzzle gauntlet testing his focus.',
      'A message scrolls across the air: "Welcome to the academy, Kid Hacker."',
    ];

    const story = this.add.text(width / 2, height * 0.46, lines.join('\n'), {
      fontFamily: 'Share Tech Mono',
      fontSize: '18px',
      color: '#e7ecff',
      align: 'center',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.76, 'Press SPACE to reboot the sim', {
      fontFamily: 'Share Tech Mono',
      fontSize: '16px',
      color: '#57f7ff',
    }).setOrigin(0.5);

    this.input.keyboard.once('keydown-SPACE', () => {
      localStorage.removeItem('declan-progress');
      this.scene.start('MenuScene');
    });
  }
}
