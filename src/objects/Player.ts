import Phaser from 'phaser';
import { CONFIG } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private fireTimer!: Phaser.Time.TimerEvent;
  public isInvincible: boolean = false;
  public hasShield: boolean = false;

  constructor(scene: Phaser.Scene) {
    super(scene, CONFIG.CANVAS.WIDTH / 2, 580, 'player');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.setCollideWorldBounds(true);
    this.cursors = scene.input.keyboard!.createCursorKeys();
    this.keyA = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyD = scene.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D);

    this.fireTimer = scene.time.addEvent({
      delay: CONFIG.PLAYER.FIRE_INTERVAL,
      loop: true,
      callback: () => this.emit('fire', this.x, this.y),
    });
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    if (this.cursors.left.isDown || this.keyA.isDown) {
      this.setVelocityX(-CONFIG.PLAYER.SPEED);
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      this.setVelocityX(CONFIG.PLAYER.SPEED);
    } else {
      this.setVelocityX(0);
    }
  }

  startInvincibility(): void {
    this.isInvincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: 0,
      duration: 100,
      yoyo: true,
      repeat: Math.floor(CONFIG.PLAYER.INVINCIBLE_DURATION / 200),
      onComplete: () => {
        this.isInvincible = false;
        this.setAlpha(1);
      },
    });
  }

  activateShield(): void {
    this.hasShield = true;
    this.setTint(0xffcc00);
  }

  consumeShield(): void {
    this.hasShield = false;
    this.clearTint();
  }

  destroy(fromScene?: boolean): void {
    this.fireTimer?.remove();
    this.scene.input.keyboard?.removeKey(this.keyA);
    this.scene.input.keyboard?.removeKey(this.keyD);
    super.destroy(fromScene);
  }
}
