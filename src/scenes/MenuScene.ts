import Phaser from 'phaser';
import { CONFIG } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    const cx = this.scale.width / 2;

    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 60; i++) {
      g.fillCircle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.FloatBetween(0.5, 1.5)
      );
    }

    this.add.text(cx, 180, 'SPACE SHOOTER', {
      fontFamily: 'monospace', fontSize: '32px', color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(cx, 230, '← → 이동  ·  자동 사격', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    const hiScore = localStorage.getItem('hi-score') ?? '0';
    this.add.text(cx, 280, `HI-SCORE: ${hiScore}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffff00',
    }).setOrigin(0.5);

    const playBtn = this.add.text(cx, 380, '[ PLAY ]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ff88',
      backgroundColor: '#003322',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00ff88'));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { wave: 1, score: 0, lives: CONFIG.PLAYER.LIVES });
    });

    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { wave: 1, score: 0, lives: CONFIG.PLAYER.LIVES });
    });
  }
}
