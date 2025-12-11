import Phaser from 'phaser';
import { Howl } from 'howler';

const HEX_CODES = ['A9', '1F', '4B', '8C', 'EE', '7D', '21', '3C', 'F1', '6E'];
const WORD_BANK = ['CIPHER', 'VECTOR', 'PIXEL', 'HYPER', 'NEON', 'LASER', 'SCRIPT', 'HACK', 'GATE', 'STACK'];

export default class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
    this.layerConfig = [];
    this.currentLayer = 1;
    this.hints = 3;
    this.seenTutorial = {};
    this.puzzleContainer = null;
    this.physicsObjects = [];
  }

  init(data) {
    this.currentLayer = data.layer || 1;
    this.hints = data.hints ?? 3;
    this.seenTutorial = data.seenTutorial || {};
  }

  create() {
    this.layerConfig = [
      {
        type: 'codebreaker',
        name: 'Codebreaker Grid',
        quip: 'Declan: "Hex tiles hum like neon honey."',
        tutorial:
          'Click tiles in the order shown under "Target Pattern" (numbers read left-to-right, top-to-bottom). A wrong click resets the sequence, so follow the pattern carefully.'
      },
      {
        type: 'logicWires',
        name: 'Logic Wires',
        quip: 'Declan: "Reroute the datastream. The mainframe loves symmetry."',
        tutorial: 'Connect each input node to one output. Drag from left nodes to right nodes to light them all.'
      },
      {
        type: 'password',
        name: 'Password Brute Logic',
        quip: 'Declan: "Brute force? More like polite force."',
        tutorial: 'Type a guess. The console will tell you how many letters are correct and placed right. You have limited attempts!'
      },
      {
        type: 'firewall',
        name: 'Firewall Maze',
        quip: 'Declan: "Slip the packet through moving firewalls."',
        tutorial: 'Use arrow keys or WASD to move the glowing packet to the goal without hitting the firewalls.'
      },
      {
        type: 'pattern',
        name: 'Pattern Decryption',
        quip: 'Declan: "Listen close. The mainframe speaks in melody."',
        tutorial: 'Watch and listen. Repeat the sequence by clicking the nodes. Each round adds a new beat.'
      }
    ];

    this.events.on('use-hint', () => this.provideHint());

    this.scene.launch('UIScene');
    this.startLayer();
  }

  startLayer() {
    if (this.currentLayer > this.layerConfig.length) {
      this.scene.stop('UIScene');
      this.scene.start('EndScene');
      return;
    }
    const { width, height } = this.scale;
    if (this.puzzleContainer) this.puzzleContainer.destroy(true);
    this.physicsObjects.forEach((obj) => obj.destroy());
    this.physicsObjects = [];
    this.puzzleContainer = this.add.container(width / 2, height / 2);
    const layerInfo = this.layerConfig[this.currentLayer - 1];
    this.events.emit('layer-updated', {
      layer: this.currentLayer,
      total: this.layerConfig.length,
      quip: layerInfo.quip,
      name: layerInfo.name,
      hints: this.hints,
    });

    if (!this.seenTutorial[layerInfo.type]) {
      this.events.emit('show-tutorial', { text: layerInfo.tutorial });
      this.seenTutorial[layerInfo.type] = true;
      this.saveProgress();
    }

    switch (layerInfo.type) {
      case 'codebreaker':
        this.createCodebreaker();
        break;
      case 'logicWires':
        this.createLogicWires();
        break;
      case 'password':
        this.createPasswordPuzzle();
        break;
      case 'firewall':
        this.createFirewallMaze();
        break;
      case 'pattern':
        this.createPatternPuzzle();
        break;
      default:
        break;
    }
  }

  saveProgress() {
    const data = {
      layer: this.currentLayer,
      hints: this.hints,
      seenTutorial: this.seenTutorial,
    };
    localStorage.setItem('declan-progress', JSON.stringify(data));
  }

  clearPuzzle() {
    if (this.puzzleContainer) {
      this.puzzleContainer.destroy(true);
      this.puzzleContainer = null;
    }
  }

  handleSuccess() {
    this.sound.play('success');
    this.cameras.main.flash(200, 105, 255, 140);
    this.currentLayer += 1;
    this.saveProgress();
    this.time.delayedCall(400, () => this.startLayer());
  }

  handleFailure() {
    this.sound.play('error');
    this.cameras.main.shake(150, 0.005);
  }

  provideHint() {
    if (this.hints <= 0) return;
    this.hints -= 1;
    this.events.emit('hint-update', { hints: this.hints });
    if (this.activeHint) {
      this.activeHint();
      this.activeHint = null;
    }
    this.saveProgress();
  }

  // Puzzle 1: Codebreaker Grid
  createCodebreaker() {
    const gridSize = Math.min(4, 3 + Math.floor((this.currentLayer - 1) / 2));
    const tileSize = 80;
    const startX = -((gridSize - 1) * tileSize) / 2;
    const startY = -((gridSize - 1) * tileSize) / 2;

    const totalTiles = gridSize * gridSize;
    const targetLength = Math.min(totalTiles, 3 + this.currentLayer);
    const pool = Phaser.Utils.Array.Shuffle([...Array(totalTiles).keys()]);
    const targetPattern = pool.slice(0, targetLength);

    const preview = this.add.text(0, -tileSize * gridSize * 0.65, `Target Pattern: ${targetPattern.map((n) => n + 1).join(' → ')}`, {
      fontFamily: 'Share Tech Mono',
      fontSize: '18px',
      color: '#8df757',
    }).setOrigin(0.5);
    this.puzzleContainer.add(preview);

    const helperText = this.add.text(0, preview.y + 28, 'Tiles are numbered left-to-right, top-to-bottom. Click each hex in the pattern order; a wrong tile resets your sequence.', {
      fontFamily: 'Share Tech Mono',
      fontSize: '14px',
      color: '#e7ecff',
      align: 'center',
      wordWrap: { width: tileSize * gridSize + 40 },
    }).setOrigin(0.5);
    this.puzzleContainer.add(helperText);

    const selections = [];

    const tiles = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const index = y * gridSize + x;
        const tile = this.add.rectangle(startX + x * tileSize, startY + y * tileSize, tileSize - 8, tileSize - 8, 0x1a2336, 0.9)
          .setStrokeStyle(2, 0x57f7ff, 0.6)
          .setInteractive({ useHandCursor: true })
          .on('pointerup', () => handleClick(index, tile));
        const label = this.add.text(tile.x, tile.y, HEX_CODES[index % HEX_CODES.length], {
          fontFamily: 'Share Tech Mono',
          fontSize: '16px',
          color: '#e7ecff',
        }).setOrigin(0.5);
        const indexLabel = this.add.text(tile.x - tileSize * 0.38, tile.y + tileSize * 0.32, index + 1, {
          fontFamily: 'Share Tech Mono',
          fontSize: '12px',
          color: '#57f7ff',
        }).setOrigin(0.5);
        this.puzzleContainer.add(tile);
        this.puzzleContainer.add(label);
        this.puzzleContainer.add(indexLabel);
        tiles.push(tile);
      }
    }

    const handleClick = (index, tile) => {
      if (selections.includes(index)) return;
      this.sound.play('click');
      selections.push(index);
      tile.setFillStyle(0x57f7ff, 0.8);
      tile.setScale(1.05);
      this.tweens.add({ targets: tile, scale: 1, duration: 200 });

      if (selections.length === targetPattern.length) {
        if (selections.every((value, idx) => value === targetPattern[idx])) {
          this.handleSuccess();
        } else {
          selections.splice(0, selections.length);
          tiles.forEach((t) => t.setFillStyle(0x1a2336, 0.9));
          this.handleFailure();
        }
      }
    };

    this.activeHint = () => {
      const nextIndex = targetPattern[selections.length];
      const pulseTile = tiles[nextIndex];
      this.tweens.add({ targets: pulseTile, alpha: 0.3, duration: 140, yoyo: true, repeat: 4 });
    };
  }

  // Puzzle 2: Logic Wires
  createLogicWires() {
    const inputs = 3 + Math.floor((this.currentLayer - 1) / 2);
    const outputs = inputs;
    const spacing = 60;
    const leftX = -150;
    const rightX = 150;

    const mapping = Phaser.Utils.Array.Shuffle([...Array(inputs).keys()]);
    const connections = new Map();
    const graphics = this.add.graphics();
    this.puzzleContainer.add(graphics);

    const inputNodes = [];
    const outputNodes = [];

    for (let i = 0; i < inputs; i++) {
      const node = this.add.circle(leftX, (-((inputs - 1) * spacing) / 2) + i * spacing, 14, 0x57f7ff);
      node.setInteractive({ useHandCursor: true });
      node.index = i;
      this.puzzleContainer.add(node);
      inputNodes.push(node);
    }

    for (let i = 0; i < outputs; i++) {
      const node = this.add.circle(rightX, (-((outputs - 1) * spacing) / 2) + i * spacing, 14, 0xf58af7);
      node.setInteractive({ useHandCursor: true });
      node.index = i;
      this.puzzleContainer.add(node);
      outputNodes.push(node);
    }

    let activeInput = null;

    const redraw = () => {
      graphics.clear();
      graphics.lineStyle(2, 0x8df757, 0.8);
      connections.forEach((inputIdx, outputIdx) => {
        const start = inputNodes[inputIdx];
        const end = outputNodes[outputIdx];
        graphics.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, end.x, end.y));
      });
      if (activeInput !== null) {
        const start = inputNodes[activeInput];
        const pointer = this.input.activePointer;
        graphics.lineStyle(1, 0xffffff, 0.6);
        graphics.strokeLineShape(new Phaser.Geom.Line(start.x, start.y, pointer.x - this.cameras.main.centerX, pointer.y - this.cameras.main.centerY));
      }
    };

    inputNodes.forEach((node) => {
      node.on('pointerdown', () => {
        activeInput = node.index;
      });
    });

    outputNodes.forEach((node) => {
      node.on('pointerup', () => {
        if (activeInput !== null) {
          connections.set(node.index, activeInput);
          this.sound.play('click');
          activeInput = null;
          redraw();
          checkSolved();
        }
      });
    });

    this.input.on('pointermove', redraw);
    redraw();

    const checkSolved = () => {
      if (connections.size !== outputs) return;
      const success = mapping.every((inputIdx, outputIdx) => connections.get(outputIdx) === inputIdx);
      success ? this.handleSuccess() : this.handleFailure();
    };

    this.activeHint = () => {
      const nextOutput = mapping.findIndex((inputIdx, idx) => connections.get(idx) !== inputIdx);
      if (nextOutput >= 0) {
        const targetInput = mapping[nextOutput];
        const glow = this.add.rectangle(0, 0, 320, 200, 0xffffff, 0.06);
        this.puzzleContainer.add(glow);
        this.time.delayedCall(600, () => glow.destroy());
        this.tweens.add({ targets: [inputNodes[targetInput], outputNodes[nextOutput]], scale: 1.2, duration: 120, yoyo: true, repeat: 2 });
      }
    };
  }

  // Puzzle 3: Password logic
  createPasswordPuzzle() {
    const wordLength = Math.min(6, 4 + Math.floor((this.currentLayer - 1) / 2));
    const candidates = WORD_BANK.filter((w) => w.length === wordLength);
    const secret = Phaser.Utils.Array.GetRandom(candidates.length ? candidates : WORD_BANK);
    const maxAttempts = 6;
    let attempts = 0;

    const consoleBg = this.add.rectangle(0, 0, 420, 260, 0x0b1020, 0.8).setStrokeStyle(2, 0x57f7ff, 0.4);
    this.puzzleContainer.add(consoleBg);

    const header = this.add.text(0, -100, 'Password Console', { fontFamily: 'Share Tech Mono', fontSize: '20px', color: '#8df757' }).setOrigin(0.5);
    this.puzzleContainer.add(header);

    const log = this.add.text(-190, -60, 'Enter code word:', { fontFamily: 'Share Tech Mono', fontSize: '16px', color: '#e7ecff', align: 'left', wordWrap: { width: 380 } });
    log.setOrigin(0, 0);
    this.puzzleContainer.add(log);

    const input = this.add.dom(0, 60, 'input', 'width:220px; height:32px; font-size:18px; font-family:Share Tech Mono; background:#050608; color:#8df757; border:2px solid #57f7ff; text-align:center;');
    input.node.setAttribute('maxlength', wordLength);
    this.puzzleContainer.add(input);

    const submit = this.add.text(0, 110, 'Commit Guess', { fontFamily: 'Share Tech Mono', fontSize: '18px', padding: { x: 12, y: 8 }, backgroundColor: '#8df757', color: '#0b1020' })
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerup', () => handleGuess());
    this.puzzleContainer.add(submit);

    const feedbackLines = [];

    const handleGuess = () => {
      const guess = input.node.value.toUpperCase();
      if (!guess || guess.length !== wordLength) {
        this.handleFailure();
        return;
      }
      attempts += 1;
      const correctPositions = guess.split('').filter((c, i) => c === secret[i]).length;
      const correctLetters = guess.split('').filter((c) => secret.includes(c)).length;
      feedbackLines.push(`${attempts}. ${guess} → ${correctLetters} correct, ${correctPositions} placed`);
      log.setText(`Enter code word:\n${feedbackLines.join('\n')}`);
      input.node.value = '';
      this.sound.play('click');

      if (guess === secret) {
        this.handleSuccess();
      } else if (attempts >= maxAttempts) {
        this.handleFailure();
        attempts = 0;
        feedbackLines.length = 0;
        log.setText('Enter code word:');
      }
    };

    this.activeHint = () => {
      const revealIndex = Phaser.Math.Between(0, wordLength - 1);
      const letter = secret[revealIndex];
      feedbackLines.push(`Hint: position ${revealIndex + 1} is '${letter}'`);
      log.setText(`Enter code word:\n${feedbackLines.join('\n')}`);
    };
  }

  // Puzzle 4: Firewall Maze
  createFirewallMaze() {
    const playArea = this.add.rectangle(0, 0, 520, 320, 0x0b1020, 0.6).setStrokeStyle(2, 0x57f7ff, 0.4);
    this.puzzleContainer.add(playArea);

    const cx = this.puzzleContainer.x;
    const cy = this.puzzleContainer.y;

    const player = this.add.circle(cx - 220, cy, 10, 0x8df757);
    this.physics.add.existing(player);
    player.body.setAllowGravity(false);

    const goal = this.add.rectangle(cx + 230, cy, 30, 30, 0x57f7ff, 0.5);
    this.physics.add.existing(goal, true);
    this.puzzleContainer.add(goal);

    const firewalls = this.physics.add.group({ immovable: true, allowGravity: false });
    const rows = 3 + Math.floor((this.currentLayer - 1) / 2);
    for (let i = 0; i < rows; i++) {
      const wallShape = this.add.rectangle(cx + Phaser.Math.Between(-100, 100), cy - 120 + i * 80, 380, 16, 0xf58af7, 0.6);
      this.physics.add.existing(wallShape, true);
      wallShape.body.setAllowGravity(false);
      wallShape.body.setImmovable(true);
      wallShape.speed = (i % 2 === 0 ? 1 : -1) * (60 + i * 10);
      wallShape.yoyoTop = wallShape.y - 30;
      wallShape.yoyoBottom = wallShape.y + 30;
      firewalls.add(wallShape);
      this.puzzleContainer.add(wallShape);
      this.physicsObjects.push(wallShape);
    }

    this.physicsObjects.push(player, goal);

    const cursors = this.input.keyboard.createCursorKeys();
    const wasd = this.input.keyboard.addKeys({
      up: Phaser.Input.Keyboard.KeyCodes.W,
      down: Phaser.Input.Keyboard.KeyCodes.S,
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
    });

    this.physics.add.overlap(player, firewalls, () => {
      this.handleFailure();
      player.setPosition(-220, 0);
    });
    this.physics.add.overlap(player, goal, () => this.handleSuccess(), undefined, this);

    this.time.addEvent({
      loop: true,
      delay: 16,
      callback: () => {
        firewalls.children.each((wall) => {
          wall.y += (wall.speed * 16) / 1000;
          if (wall.y < wall.yoyoTop || wall.y > wall.yoyoBottom) wall.speed *= -1;
        });
        const speed = 140;
        player.body.setVelocity(0);
        if (cursors.left.isDown || wasd.left.isDown) player.body.setVelocityX(-speed);
        if (cursors.right.isDown || wasd.right.isDown) player.body.setVelocityX(speed);
        if (cursors.up.isDown || wasd.up.isDown) player.body.setVelocityY(-speed);
        if (cursors.down.isDown || wasd.down.isDown) player.body.setVelocityY(speed);
      },
    });

    this.activeHint = () => {
      this.tweens.add({ targets: goal, alpha: 0.2, duration: 120, yoyo: true, repeat: 4 });
    };
  }

  // Puzzle 5: Pattern Decryption
  createPatternPuzzle() {
    const nodes = [];
    const positions = [
      { x: -140, y: -60 },
      { x: 0, y: -120 },
      { x: 140, y: -60 },
      { x: -80, y: 80 },
      { x: 80, y: 80 },
    ];
    const sequence = [];
    let playerTurn = false;
    let inputIndex = 0;
    const goalLength = 3 + this.currentLayer;

    const beep = new Howl({ src: ['assets/audio/tech-success.wav'], volume: 0.4 });

    positions.forEach((pos, idx) => {
      const node = this.add.circle(pos.x, pos.y, 28, 0x1a2336).setStrokeStyle(3, 0x57f7ff, 0.8);
      node.index = idx;
      node.setInteractive({ useHandCursor: true });
      node.on('pointerup', () => {
        if (!playerTurn) return;
        flashNode(node);
        beep.play();
        if (idx === sequence[inputIndex]) {
          inputIndex += 1;
          if (inputIndex === sequence.length) {
            playerTurn = false;
            this.time.delayedCall(300, () => playRound());
          }
        } else {
          this.handleFailure();
          playerTurn = false;
          inputIndex = 0;
          this.time.delayedCall(300, () => playRound(true));
        }
      });
      this.puzzleContainer.add(node);
      nodes.push(node);
    });

    const flashNode = (node) => {
      this.tweens.add({ targets: node, alpha: 0.3, duration: 140, yoyo: true });
    };

    const playRound = (repeat = false) => {
      if (!repeat) sequence.push(Phaser.Math.Between(0, nodes.length - 1));
      if (sequence.length > goalLength) {
        this.handleSuccess();
        return;
      }
      playerTurn = false;
      inputIndex = 0;
      sequence.forEach((val, idx) => {
        this.time.delayedCall(500 + idx * 450, () => {
          const node = nodes[val];
          flashNode(node);
          beep.play();
          if (idx === sequence.length - 1) {
            this.time.delayedCall(400, () => {
              playerTurn = true;
            });
          }
        });
      });
    };

    playRound();

    this.activeHint = () => {
      const hintVal = sequence[sequence.length - 1];
      const node = nodes[hintVal];
      flashNode(node);
    };
  }
}
