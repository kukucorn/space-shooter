import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Bullet } from '../objects/Bullet';
import { Boss } from '../objects/Boss';
import { Powerup, PowerupType } from '../objects/Powerup';
import { CONFIG } from '../config';
import { calcFleetSpeed, calcFireInterval, calcEnemyBulletSpeed, calcShooterCount } from '../utils/gameCalc';

interface SceneData {
  wave?: number;
  score?: number;
  lives?: number;
}

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemies!: Phaser.Physics.Arcade.Group;
  private playerBullets!: Phaser.Physics.Arcade.Group;
  private enemyBullets!: Phaser.Physics.Arcade.Group;
  private powerups!: Phaser.Physics.Arcade.Group;
  private boss?: Boss;

  private wave: number = 1;
  private score: number = 0;
  private lives: number = CONFIG.PLAYER.LIVES;
  private isBossWave: boolean = false;
  private waveClearing: boolean = false;
  private multishotLevel: number = 0;
  private multishotTimer?: Phaser.Time.TimerEvent;
  private bulletPowerActive: boolean = false;
  private bulletPowerTimer?: Phaser.Time.TimerEvent;

  private fleetDirection: number = 1;
  private enemyFireTimer?: Phaser.Time.TimerEvent;
  private bossMinionTimer?: Phaser.Time.TimerEvent;

  private scoreText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private multishotText!: Phaser.GameObjects.Text;
  private powerText!: Phaser.GameObjects.Text;
  private bossHpBarBg?: Phaser.GameObjects.Graphics;
  private bossHpBar?: Phaser.GameObjects.Graphics;

  constructor() {
    super('GameScene');
  }

  init(data: SceneData): void {
    this.wave = data.wave ?? 1;
    this.score = data.score ?? 0;
    this.lives = data.lives ?? CONFIG.PLAYER.LIVES;
    this.isBossWave = this.wave % 5 === 0;
    this.waveClearing = false;
    this.multishotLevel = 0;
    this.bulletPowerActive = false;
    this.fleetDirection = 1;
  }

  create(): void {
    this.createBackground();
    this.createGroups();
    this.createPlayer();
    this.createHUD();

    if (this.isBossWave) {
      this.spawnBoss();
    } else {
      this.spawnEnemyGrid();
      this.startEnemyFireTimer();
    }

    this.setupCollisions();
    // 적 총알 ↔ 플레이어 overlap은 setupCollisions() 후 바로 등록
    this.physics.add.overlap(
      this.enemyBullets,
      this.player,
      this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  update(_time: number, delta: number): void {
    if (this.waveClearing) return;
    if (!this.isBossWave) {
      this.updateEnemyFleet(delta);
      this.checkWaveComplete();
    } else if (this.boss?.active) {
      this.cleanupOffscreenMinions();
      this.checkWaveComplete();
    }
  }

  private cleanupOffscreenMinions(): void {
    const all = this.enemies.getChildren();
    for (const e of all) {
      const enemy = e as Enemy;
      if (enemy.active && enemy.y > CONFIG.CANVAS.HEIGHT + 20) {
        enemy.destroy();
      }
    }
  }

  // --- Background ---

  private createBackground(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.6);
    for (let i = 0; i < 50; i++) {
      const x = Phaser.Math.Between(0, CONFIG.CANVAS.WIDTH);
      const y = Phaser.Math.Between(0, CONFIG.CANVAS.HEIGHT);
      const size = Phaser.Math.FloatBetween(0.5, 1.5);
      g.fillCircle(x, y, size);
    }
  }

  // --- Groups ---

  private createGroups(): void {
    this.enemies = this.physics.add.group();
    this.playerBullets = this.physics.add.group();
    this.enemyBullets = this.physics.add.group();
    this.powerups = this.physics.add.group();
  }

  // --- Player ---

  private createPlayer(): void {
    this.player = new Player(this);
    this.player.on('fire', (x: number, y: number) => this.firePlayerBullet(x, y));
  }

  private firePlayerBullet(x: number, y: number): void {
    const angles =
      this.multishotLevel >= 2
        ? [-30, -15, 0, 15, 30]
        : this.multishotLevel === 1
          ? [-15, 0, 15]
          : [0];
    const baseSpeed = CONFIG.BULLET.PLAYER_SPEED;
    const power = this.bulletPowerActive ? 2 : 1;

    for (const angle of angles) {
      const rad = Phaser.Math.DegToRad(angle);
      const b = new Bullet(this, x, y, 'up');
      b.damage = power;
      this.playerBullets.add(b);
      if (power === 2) b.setScale(2);
      if (angle === 0) {
        b.setVelocityY(baseSpeed);
      } else {
        b.setVelocity(Math.sin(rad) * Math.abs(baseSpeed), baseSpeed * Math.cos(rad));
      }
    }
  }

  // --- Enemy Grid ---

  private spawnEnemyGrid(): void {
    const startX = 60;
    const startY = 80;
    const spacingX = 70;
    const spacingY = 50;

    for (let row = 0; row < CONFIG.ENEMY.ROWS; row++) {
      for (let col = 0; col < CONFIG.ENEMY.COLS; col++) {
        const x = startX + col * spacingX;
        const y = startY + row * spacingY;
        const enemy = new Enemy(this, x, y);
        this.enemies.add(enemy);
      }
    }
  }

  private updateEnemyFleet(delta: number): void {
    const allEnemies = this.enemies.getChildren() as Enemy[];
    const active = allEnemies.filter(e => e.active);
    if (active.length === 0) return;

    let speed = calcFleetSpeed(this.wave);
    if (active.length <= CONFIG.ENEMY.FEW_REMAINING_THRESHOLD) {
      speed *= CONFIG.ENEMY.FEW_REMAINING_SPEED_BONUS;
    }

    const dx = speed * this.fleetDirection * (delta / 1000);

    let hitWall = false;
    for (const e of active) {
      const nextX = e.x + dx;
      if (nextX <= CONFIG.ENEMY.LEFT_WALL || nextX >= CONFIG.ENEMY.RIGHT_WALL) {
        hitWall = true;
        break;
      }
    }

    if (hitWall) {
      this.fleetDirection *= -1;
      for (const e of active) {
        e.y += CONFIG.ENEMY.DROP_STEP;
        if (e.y > 620) {
          e.destroy();
          this.lives -= 1;
          this.updateHUD();
          if (this.lives <= 0) this.triggerGameOver();
        }
      }
    } else {
      for (const e of active) {
        e.x += dx;
      }
    }
  }

  private startEnemyFireTimer(): void {
    const interval = calcFireInterval(this.wave);
    const bulletSpeed = calcEnemyBulletSpeed(this.wave);
    const shooterCount = calcShooterCount(this.wave);
    this.enemyFireTimer = this.time.addEvent({
      delay: interval,
      loop: true,
      callback: () => {
        const active = this.enemies.getChildren().filter(e => e.active) as Enemy[];
        if (active.length === 0) return;
        const count = Math.min(shooterCount, active.length);
        const pool = [...active];
        for (let i = 0; i < count; i++) {
          const idx = Phaser.Math.Between(0, pool.length - 1);
          const shooter = pool.splice(idx, 1)[0];
          const b = new Bullet(this, shooter.x, shooter.y + 12, 'down');
          this.enemyBullets.add(b);
          b.setVelocityY(bulletSpeed);
        }
      },
    });
  }

  // --- Collisions ---

  private setupCollisions(): void {
    this.physics.add.overlap(
      this.playerBullets,
      this.enemies,
      this.onPlayerBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
    this.physics.add.overlap(
      this.powerups,
      this.player,
      this.onPlayerGetPowerup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );
  }

  private onPlayerBulletHitEnemy(
    bulletObj: Phaser.GameObjects.GameObject,
    enemyObj: Phaser.GameObjects.GameObject
  ): void {
    bulletObj.destroy();
    enemyObj.destroy();
    this.score += CONFIG.SCORE.ENEMY;
    this.updateHUD();
    this.tryDropPowerup((enemyObj as Enemy).x, (enemyObj as Enemy).y);
  }

  private tryDropPowerup(x: number, y: number): void {
    if (Math.random() < CONFIG.POWERUP.DROP_CHANCE) {
      const type = this.pickRandomPowerup();
      const p = new Powerup(this, x, y, type);
      this.powerups.add(p);
      p.setVelocityY(CONFIG.POWERUP.FALL_SPEED);
    }
  }

  private pickRandomPowerup(): PowerupType {
    const pool: PowerupType[] = ['multishot', 'shield', 'heart', 'power'];
    return pool[Phaser.Math.Between(0, pool.length - 1)];
  }

  private onEnemyBulletHitPlayer(
    _playerObj: Phaser.GameObjects.GameObject,
    bulletObj: Phaser.GameObjects.GameObject
  ): void {
    if (this.player.isInvincible) return;

    bulletObj.destroy();

    if (this.player.hasShield) {
      this.player.consumeShield();
      return;
    }

    this.lives -= 1;
    this.updateHUD();

    if (this.lives <= 0) {
      this.triggerGameOver();
    } else {
      this.player.startInvincibility();
    }
  }

  private onPlayerGetPowerup(
    _playerObj: Phaser.GameObjects.GameObject,
    powerupObj: Phaser.GameObjects.GameObject
  ): void {
    const p = powerupObj as Powerup;
    switch (p.powerupType) {
      case 'multishot':
        this.upgradeMultishot();
        break;
      case 'shield':
        this.activateShield();
        break;
      case 'heart':
        this.gainLife();
        break;
      case 'power':
        this.activateBulletPower();
        break;
    }
    p.destroy();
  }

  // --- Power-ups ---

  private upgradeMultishot(): void {
    this.multishotLevel = Math.min(this.multishotLevel + 1, CONFIG.POWERUP.MULTISHOT_MAX_LEVEL);
    this.multishotTimer?.remove();
    let remaining = CONFIG.POWERUP.MULTISHOT_DURATION / 1000;
    const bulletCount = this.multishotLevel * 2 + 1;
    this.multishotText.setText(`⚡ MULTI x${bulletCount} ${remaining}s`);

    this.multishotTimer = this.time.addEvent({
      delay: 1000,
      repeat: CONFIG.POWERUP.MULTISHOT_DURATION / 1000 - 1,
      callback: () => {
        remaining--;
        if (remaining > 0) {
          this.multishotText.setText(`⚡ MULTI x${bulletCount} ${remaining}s`);
        } else {
          this.multishotLevel = 0;
          this.multishotText.setText('');
        }
      },
    });
  }

  private activateShield(): void {
    if (this.player.hasShield) return;
    this.player.activateShield();
  }

  private gainLife(): void {
    if (this.lives < CONFIG.PLAYER.LIVES) {
      this.lives += 1;
      this.updateHUD();
    }
  }

  private activateBulletPower(): void {
    this.bulletPowerActive = true;
    this.bulletPowerTimer?.remove();
    let remaining = CONFIG.POWERUP.POWER_DURATION / 1000;
    this.powerText.setText(`+ POWER x2 ${remaining}s`);

    this.bulletPowerTimer = this.time.addEvent({
      delay: 1000,
      repeat: CONFIG.POWERUP.POWER_DURATION / 1000 - 1,
      callback: () => {
        remaining--;
        if (remaining > 0) {
          this.powerText.setText(`+ POWER x2 ${remaining}s`);
        } else {
          this.bulletPowerActive = false;
          this.powerText.setText('');
        }
      },
    });
  }

  // --- Boss ---

  private spawnBoss(): void {
    this.boss = new Boss(this, this.wave);
    const bulletSpeed = calcEnemyBulletSpeed(this.wave);

    this.boss.on('normalFire', (x: number, y: number) => {
      const b = new Bullet(this, x, y, 'down');
      this.enemyBullets.add(b);
      b.setVelocityY(bulletSpeed);
    });

    this.boss.on('specialFire', (x: number, y: number) => {
      const angles = [-40, -20, 0, 20, 40];
      for (const angle of angles) {
        const rad = Phaser.Math.DegToRad(angle);
        const b = new Bullet(this, x, y, 'down');
        this.enemyBullets.add(b);
        b.setVelocity(
          Math.sin(rad) * bulletSpeed,
          Math.cos(rad) * bulletSpeed
        );
      }
    });

    this.createBossHpBar();

    this.physics.add.overlap(
      this.playerBullets,
      this.boss,
      this.onPlayerBulletHitBoss as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
      undefined,
      this
    );

    this.startBossMinionTimer();
  }

  private startBossMinionTimer(): void {
    this.bossMinionTimer = this.time.addEvent({
      delay: CONFIG.BOSS.MINION_SPAWN_INTERVAL,
      loop: true,
      callback: () => {
        if (!this.boss?.active) return;
        const x = Phaser.Math.Between(60, CONFIG.CANVAS.WIDTH - 60);
        const minion = new Enemy(this, x, 50);
        this.enemies.add(minion);
        minion.setVelocityY(CONFIG.BOSS.MINION_FALL_SPEED);
      },
    });
  }

  private createBossHpBar(): void {
    this.bossHpBarBg = this.add.graphics().setDepth(10);
    this.bossHpBarBg.fillStyle(0x333333);
    this.bossHpBarBg.fillRect(20, 32, 440, 10);

    this.bossHpBar = this.add.graphics().setDepth(10);
    this.updateBossHpBar();
  }

  private updateBossHpBar(): void {
    if (!this.boss || !this.bossHpBar) return;
    this.bossHpBar.clear();
    this.bossHpBar.fillStyle(0xff0088);
    const ratio = this.boss.hp / this.boss.maxHp;
    this.bossHpBar.fillRect(20, 32, Math.floor(440 * ratio), 10);
  }

  private onPlayerBulletHitBoss(
    _bossObj: Phaser.GameObjects.GameObject,
    bulletObj: Phaser.GameObjects.GameObject
  ): void {
    if (!this.boss?.active) return;
    const bullet = bulletObj as Bullet;
    const damage = bullet.damage ?? 1;
    bullet.destroy();

    const isDead = this.boss.takeDamage(damage);
    this.updateBossHpBar();

    if (isDead) {
      this.score += CONFIG.SCORE.BOSS;
      this.updateHUD();
      const p1 = new Powerup(this, this.boss.x - 20, this.boss.y, 'multishot');
      const p2 = new Powerup(this, this.boss.x + 20, this.boss.y, 'shield');
      this.powerups.add(p1);
      this.powerups.add(p2);
      p1.setVelocityY(CONFIG.POWERUP.FALL_SPEED);
      p2.setVelocityY(CONFIG.POWERUP.FALL_SPEED);
      this.boss.destroy();
      this.bossHpBar?.destroy();
      this.bossHpBarBg?.destroy();
      this.bossMinionTimer?.remove();
    }
  }

  // --- Wave Completion ---

  private checkWaveComplete(): void {
    const allGone = this.isBossWave
      ? !this.boss?.active
      : this.enemies.countActive() === 0;

    if (allGone && !this.waveClearing) {
      this.waveClearing = true;
      this.enemyFireTimer?.remove();
      const bonus = this.wave * CONFIG.SCORE.WAVE_BONUS_MULTIPLIER;
      this.score += bonus;
      this.time.delayedCall(300, () => {
        this.scene.start('WaveCompleteScene', {
          wave: this.wave,
          score: this.score,
          bonus,
          lives: this.lives,
        });
      });
    }
  }

  // --- HUD ---

  private createHUD(): void {
    const hiScore = parseInt(localStorage.getItem('hi-score') ?? '0', 10);
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#00ff88' };
    const waveStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#ffff00' };
    const livesStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#ff4444' };

    this.scoreText = this.add.text(8, 8, `SCORE: ${this.score}`, style).setDepth(10);
    this.add.text(CONFIG.CANVAS.WIDTH / 2, 8, `WAVE ${this.wave}`, waveStyle).setOrigin(0.5, 0).setDepth(10);
    this.livesText = this.add.text(CONFIG.CANVAS.WIDTH - 8, 8, '♥'.repeat(this.lives), livesStyle).setOrigin(1, 0).setDepth(10);
    this.add.text(CONFIG.CANVAS.WIDTH - 8, CONFIG.CANVAS.HEIGHT - 20, `HI: ${hiScore}`, { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }).setOrigin(1, 0).setDepth(10);
    this.multishotText = this.add.text(8, CONFIG.CANVAS.HEIGHT - 35, '', { fontFamily: 'monospace', fontSize: '12px', color: '#ffff00' }).setDepth(10);
    this.powerText = this.add.text(8, CONFIG.CANVAS.HEIGHT - 20, '', { fontFamily: 'monospace', fontSize: '12px', color: '#44ff44' }).setDepth(10);
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText('♥'.repeat(Math.max(0, this.lives)));
  }

  // --- Game Over ---

  private triggerGameOver(): void {
    this.waveClearing = true;
    this.enemyFireTimer?.remove();
    this.player.setActive(false).setVisible(false);
    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', { wave: this.wave, score: this.score });
    });
  }
}
