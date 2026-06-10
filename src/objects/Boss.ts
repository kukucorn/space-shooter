import Phaser from 'phaser';
import { CONFIG } from '../config';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  private normalFireTimer!: Phaser.Time.TimerEvent;
  private specialFireTimer!: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, wave: number) {
    super(scene, CONFIG.CANVAS.WIDTH / 2, CONFIG.BOSS.SPAWN_Y, 'boss');
    this.maxHp = wave * CONFIG.BOSS.HP_PER_WAVE;
    this.hp = this.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);

    this.normalFireTimer = scene.time.addEvent({
      delay: CONFIG.BOSS.NORMAL_FIRE_INTERVAL,
      loop: true,
      callback: () => this.emit('normalFire', this.x, this.y + 30),
    });

    this.specialFireTimer = scene.time.addEvent({
      delay: CONFIG.BOSS.SPECIAL_FIRE_INTERVAL,
      loop: true,
      callback: () => this.emit('specialFire', this.x, this.y + 30),
    });
  }

  takeDamage(): boolean {
    this.hp -= 1;
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
    });
    return this.hp <= 0;
  }

  destroy(fromScene?: boolean): void {
    this.normalFireTimer?.remove();
    this.specialFireTimer?.remove();
    super.destroy(fromScene);
  }
}
