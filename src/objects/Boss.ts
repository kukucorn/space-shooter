import Phaser from 'phaser';
import { CONFIG } from '../config';
import { calcBossNormalFireInterval, calcBossSpecialFireInterval } from '../utils/gameCalc';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public hp: number;
  public maxHp: number;
  private wave: number;
  private normalFireTimer!: Phaser.Time.TimerEvent;
  private specialFireTimer?: Phaser.Time.TimerEvent;
  private moveTween?: Phaser.Tweens.Tween;

  constructor(scene: Phaser.Scene, wave: number) {
    super(scene, CONFIG.CANVAS.WIDTH / 2, CONFIG.BOSS.SPAWN_Y, 'boss');
    this.wave = wave;
    this.maxHp = wave * CONFIG.BOSS.HP_PER_WAVE;
    this.hp = this.maxHp;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);

    this.moveTween = scene.tweens.add({
      targets: this,
      x: { from: CONFIG.BOSS.MOVE_LEFT, to: CONFIG.BOSS.MOVE_RIGHT },
      duration: CONFIG.BOSS.MOVE_DURATION,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    this.normalFireTimer = scene.time.addEvent({
      delay: calcBossNormalFireInterval(wave),
      loop: true,
      callback: () => this.emit('normalFire', this.x, this.y + 30),
    });

    this.scheduleNextSpecialFire();
  }

  private scheduleNextSpecialFire(): void {
    if (!this.active || !this.scene) return;
    const base = calcBossSpecialFireInterval(this.wave);
    const delay = Phaser.Math.Between(
      Math.floor(base * CONFIG.BOSS.SPECIAL_FIRE_RANDOM_MIN_RATIO),
      Math.floor(base * CONFIG.BOSS.SPECIAL_FIRE_RANDOM_MAX_RATIO)
    );
    this.specialFireTimer = this.scene.time.addEvent({
      delay,
      callback: () => {
        if (!this.active) return;
        this.emit('specialFire', this.x, this.y + 30);
        this.scheduleNextSpecialFire();
      },
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.body) {
      this.body.position.x = this.x - this.body.halfWidth;
      this.body.position.y = this.y - this.body.halfHeight;
    }
  }

  takeDamage(damage: number = 1): boolean {
    this.hp -= damage;
    this.scene?.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 80,
      yoyo: true,
    });
    return this.hp <= 0;
  }

  destroy(fromScene?: boolean): void {
    this.moveTween?.remove();
    this.normalFireTimer?.remove();
    this.specialFireTimer?.remove();
    super.destroy(fromScene);
  }
}
