import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { WaveCompleteScene } from './scenes/WaveCompleteScene';
import { UpgradeChoiceScene } from './scenes/UpgradeChoiceScene';
import { GameOverScene } from './scenes/GameOverScene';
import { CONFIG } from './config';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: CONFIG.CANVAS.WIDTH,
  height: CONFIG.CANVAS.HEIGHT,
  backgroundColor: '#0a0a1a',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  scene: [BootScene, MenuScene, GameScene, WaveCompleteScene, UpgradeChoiceScene, GameOverScene],
};

new Phaser.Game(config);
