import Phaser from 'phaser';
import { CONFIG } from '../config';

export class Player extends Phaser.Physics.Arcade.Sprite {
  private cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyA: Phaser.Input.Keyboard.Key;
  private keyD: Phaser.Input.Keyboard.Key;
  private fireTimer!: Phaser.Time.TimerEvent;
  private shieldRing?: Phaser.GameObjects.Graphics;
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

    let dx = 0;
    if (this.cursors.left.isDown || this.keyA.isDown) {
      dx = -CONFIG.PLAYER.SPEED * (delta / 1000);
    } else if (this.cursors.right.isDown || this.keyD.isDown) {
      dx = CONFIG.PLAYER.SPEED * (delta / 1000);
    }

    if (dx !== 0) {
      const halfWidth = this.width / 2;
      const minX = halfWidth;
      const maxX = CONFIG.CANVAS.WIDTH - halfWidth;
      this.x = Phaser.Math.Clamp(this.x + dx, minX, maxX);
      this.body?.reset(this.x, this.y);
    }

    if (this.shieldRing) {
      this.shieldRing.x = this.x;
      this.shieldRing.y = this.y;
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
    if (this.shieldRing) return;
    const ring = this.scene.add.graphics();
    ring.lineStyle(2, 0x00ccff, 0.9);
    ring.strokeCircle(0, 0, 22);
    ring.lineStyle(1, 0x00ccff, 0.4);
    ring.strokeCircle(0, 0, 26);
    ring.x = this.x;
    ring.y = this.y;
    ring.setDepth(this.depth - 1);
    this.shieldRing = ring;

    this.scene.tweens.add({
      targets: ring,
      alpha: { from: 1, to: 0.4 },
      duration: 600,
      yoyo: true,
      repeat: -1,
    });
  }

  consumeShield(): void {
    this.hasShield = false;
    this.shieldRing?.destroy();
    this.shieldRing = undefined;
  }

  destroy(fromScene?: boolean): void {
    this.fireTimer?.remove();
    this.shieldRing?.destroy();
    this.scene?.input?.keyboard?.removeKey(this.keyA);
    this.scene?.input?.keyboard?.removeKey(this.keyD);
    super.destroy(fromScene);
  }
}
