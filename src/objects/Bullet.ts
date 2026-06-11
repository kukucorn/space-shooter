import Phaser from 'phaser';
import { CONFIG } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  public readonly direction: 'up' | 'down';
  public damage: number = 1;

  constructor(scene: Phaser.Scene, x: number, y: number, direction: 'up' | 'down') {
    const key = direction === 'up' ? 'bullet-player' : 'bullet-enemy';
    super(scene, x, y, key);
    this.direction = direction;
    scene.add.existing(this);
    scene.physics.add.existing(this);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.y < -20 || this.y > CONFIG.CANVAS.HEIGHT + 20) {
      this.destroy();
    }
  }
}
