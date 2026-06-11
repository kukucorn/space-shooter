import Phaser from 'phaser';

interface GameOverData {
  wave: number;
  score: number;
  victory?: boolean;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData): void {
    const prev = parseInt(localStorage.getItem('hi-score') ?? '0', 10);
    if (data.score > prev) {
      localStorage.setItem('hi-score', String(data.score));
    }
    this.data.set('gameData', data);
    this.data.set('isNewHi', data.score > prev);
  }

  create(): void {
    const { wave, score, victory } = this.data.get('gameData') as GameOverData;
    const isNewHi = this.data.get('isNewHi') as boolean;
    const cx = this.scale.width / 2;

    this.add.text(cx, 180, victory ? 'VICTORY!' : 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '36px',
      color: victory ? '#ffff00' : '#ff4444',
    }).setOrigin(0.5);

    this.add.text(cx, 250, `SCORE: ${score}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 290, `WAVE: ${wave}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    if (isNewHi) {
      this.add.text(cx, 330, '★ NEW HI-SCORE! ★', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffff00',
      }).setOrigin(0.5);
    }

    const playBtn = this.add.text(cx, 420, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace', fontSize: '20px', color: '#00ff88',
      backgroundColor: '#003322',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00ff88'));
    playBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
