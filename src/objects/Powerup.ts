import Phaser from 'phaser';
import { CONFIG } from '../config';

export type PowerupType = 'multishot' | 'shield' | 'heart' | 'power';

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  public powerupType: PowerupType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerupType) {
    super(scene, x, y, `powerup-${type}`);
    this.powerupType = type;
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.y > CONFIG.CANVAS.HEIGHT + 20) {
      this.destroy();
    }
  }
}
