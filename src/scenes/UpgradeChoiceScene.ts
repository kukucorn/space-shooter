import Phaser from 'phaser';
import { PermanentUpgrades } from './GameScene';

interface UpgradeData {
  wave: number;
  score: number;
  lives: number;
  upgrades: PermanentUpgrades;
}

type UpgradeKey = 'multishot' | 'power' | 'shield';

interface Option {
  key: UpgradeKey;
  icon: string;
  title: string;
  desc: string;
  color: string;
}

const OPTIONS: Option[] = [
  { key: 'multishot', icon: '⚡', title: 'MULTI-SHOT', desc: '항상 3발 발사', color: '#ffff00' },
  { key: 'power',     icon: '+',  title: 'POWER SHOT', desc: '데미지 2배', color: '#44ff44' },
  { key: 'shield',    icon: '🛡', title: 'AUTO SHIELD', desc: '소진 후 3초 재생', color: '#00ccff' },
];

export class UpgradeChoiceScene extends Phaser.Scene {
  private upgradeData!: UpgradeData;

  constructor() {
    super('UpgradeChoiceScene');
  }

  init(data: UpgradeData): void {
    this.upgradeData = data;
  }

  create(): void {
    const { wave, score, lives, upgrades } = this.upgradeData;
    const cx = this.scale.width / 2;

    this.add.graphics()
      .fillStyle(0xffffff, 0.4)
      .fillRect(0, 0, this.scale.width, this.scale.height)
      .clear();

    this.add.text(cx, 80, 'BOSS DEFEATED!', {
      fontFamily: 'monospace', fontSize: '28px', color: '#ffff00',
    }).setOrigin(0.5);

    this.add.text(cx, 130, `SCORE: ${score}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 180, 'CHOOSE UPGRADE', {
      fontFamily: 'monospace', fontSize: '18px', color: '#aaaaaa',
    }).setOrigin(0.5);

    OPTIONS.forEach((opt, i) => {
      const y = 260 + i * 100;
      const owned = upgrades[opt.key];
      this.makeButton(cx, y, opt, owned, () => this.choose(opt.key, wave, score, lives, upgrades));
    });
  }

  private makeButton(
    x: number,
    y: number,
    opt: Option,
    owned: boolean,
    onClick: () => void
  ): void {
    const w = 380;
    const h = 80;

    const bg = this.add.graphics();
    const drawBg = (highlight: boolean) => {
      bg.clear();
      bg.lineStyle(2, owned ? 0x666666 : Phaser.Display.Color.HexStringToColor(opt.color).color, highlight ? 1 : 0.7);
      bg.fillStyle(0x000000, owned ? 0.6 : 0.8);
      bg.fillRect(x - w / 2, y - h / 2, w, h);
      bg.strokeRect(x - w / 2, y - h / 2, w, h);
    };
    drawBg(false);

    const titleColor = owned ? '#666666' : opt.color;
    const title = this.add.text(x - w / 2 + 20, y - 14, `${opt.icon}  ${opt.title}`, {
      fontFamily: 'monospace', fontSize: '20px', color: titleColor,
    }).setOrigin(0, 0.5);

    this.add.text(x - w / 2 + 20, y + 14, owned ? '이미 보유 중' : opt.desc, {
      fontFamily: 'monospace', fontSize: '12px', color: owned ? '#666666' : '#aaaaaa',
    }).setOrigin(0, 0.5);

    const hit = this.add.rectangle(x, y, w, h, 0x000000, 0)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: !owned });

    if (!owned) {
      hit.on('pointerover', () => { drawBg(true); title.setColor('#ffffff'); });
      hit.on('pointerout',  () => { drawBg(false); title.setColor(titleColor); });
      hit.on('pointerdown', onClick);
    }
  }

  private choose(
    key: UpgradeKey,
    wave: number,
    score: number,
    lives: number,
    upgrades: PermanentUpgrades
  ): void {
    const next: PermanentUpgrades = { ...upgrades, [key]: true };
    this.scene.start('GameScene', {
      wave: wave + 1,
      score,
      lives,
      upgrades: next,
    });
  }
}
