import Phaser from 'phaser';

interface WaveData {
  wave: number;
  score: number;
  bonus: number;
  lives: number;
}

export class WaveCompleteScene extends Phaser.Scene {
  private waveData!: WaveData;

  constructor() {
    super('WaveCompleteScene');
  }

  init(data: WaveData): void {
    this.waveData = data;
  }

  create(): void {
    const { wave, score, bonus, lives } = this.waveData;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 60, `WAVE ${wave} CLEAR!`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(cx, cy, `+${bonus} BONUS`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffff00',
    }).setOrigin(0.5);

    const countdownText = this.add.text(cx, cy + 60, 'NEXT WAVE IN 3...', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    let count = 3;
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(`NEXT WAVE IN ${count}...`);
        } else {
          this.scene.start('GameScene', { wave: wave + 1, score, lives });
        }
      },
    });
  }
}
