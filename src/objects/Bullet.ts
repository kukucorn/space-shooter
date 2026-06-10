import Phaser from 'phaser';
import { CONFIG } from '../config';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number, direction: 'up' | 'down') {
    const key = direction === 'up' ? 'bullet-player' : 'bullet-enemy';
    super(scene, x, y, key);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const speed = direction === 'up' ? CONFIG.BULLET.PLAYER_SPEED : CONFIG.BULLET.ENEMY_SPEED;
    this.setVelocityY(speed);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.y < -20 || this.y > CONFIG.CANVAS.HEIGHT + 20) {
      this.destroy();
    }
  }
}
