import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    this.load.svg('portrait', 'assets/images/declan-portrait.svg', { scale: 1 });
    this.load.svg('glow-tile', 'assets/images/glow-tile.svg', { scale: 1 });
    this.load.audio('bgm', 'assets/audio/tech-bgm.wav');
    this.load.audio('click', 'assets/audio/tech-click.wav');
    this.load.audio('success', 'assets/audio/tech-success.wav');
    this.load.audio('error', 'assets/audio/tech-error.wav');
  }

  create() {
    this.scene.start('MenuScene');
  }
}
