# Phaser Space Shooter Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Phaser 3 + TypeScript + Vite로 레트로 픽셀 아트 스타일의 웨이브 클리어 슈팅 게임을 처음부터 구현한다.

**Architecture:** 5개 Scene(Boot→Menu→Game→WaveComplete→GameOver)과 5개 오브젝트 클래스(Player, Enemy, Bullet, Boss, Powerup)로 구성. 적 편대 이동은 Arcade Physics 대신 수동 위치 업데이트. 씬 간 데이터는 `scene.start(key, data)`로 전달. 모든 스프라이트는 Phaser `Graphics.generateTexture()`로 생성(에셋 파일 없음).

**Tech Stack:** Phaser 3, TypeScript, Vite, Vitest (순수 로직 함수 테스트)

---

## Chunk 1: Project Scaffolding & Configuration

### Task 1: Vite + TypeScript 프로젝트 초기화

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.ts`

- [ ] **Step 1: Vite vanilla-ts 프로젝트 생성**

```bash
cd /Users/kukucorn/Documents/games
npm create vite@latest . -- --template vanilla-ts
# 덮어쓰기 확인 메시지 → y
```

Expected: `package.json`, `index.html`, `src/main.ts`, `src/counter.ts`, `tsconfig.json` 등 생성됨

- [ ] **Step 2: 불필요한 템플릿 파일 삭제**

```bash
rm src/counter.ts src/typescript.svg src/style.css public/vite.svg
```

- [ ] **Step 3: Phaser와 Vitest 설치**

```bash
npm install
npm install phaser
npm install --save-dev vitest
```

- [ ] **Step 4: `package.json` 스크립트에 test 추가**

`package.json`의 `"scripts"` 섹션에 `"test": "vitest run"` 추가:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview",
  "test": "vitest run"
}
```

- [ ] **Step 5: `tsconfig.json` target을 ES2020으로 수정**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "module": "ESNext",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"]
}
```

- [ ] **Step 6: `index.html` 업데이트**

```html
<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Space Shooter</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #000; display: flex; justify-content: center; align-items: center; height: 100vh; }
    </style>
  </head>
  <body>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 7: `.gitignore` 먼저 생성 후 커밋**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.superpowers/
EOF
git init
git add .gitignore package.json package-lock.json tsconfig.json vite.config.ts index.html src/main.ts
git commit -m "chore: initialize Vite TypeScript project with Phaser"
```

---

### Task 2: config.ts + gameCalc.ts + Vitest 설정

**Files:**
- Create: `src/config.ts`
- Create: `src/utils/gameCalc.ts`
- Create: `vitest.config.ts`
- Create: `tests/gameCalc.test.ts`

- [ ] **Step 1: `vitest.config.ts` 작성**

```typescript
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
```

- [ ] **Step 2: `src/config.ts` 작성**

```typescript
export const CONFIG = {
  CANVAS: { WIDTH: 480, HEIGHT: 640 },
  PLAYER: { SPEED: 200, FIRE_INTERVAL: 500, LIVES: 3, INVINCIBLE_DURATION: 1500 },
  ENEMY: {
    BASE_SPEED: 60,
    SPEED_SCALE_PER_WAVE: 1.1,
    FEW_REMAINING_THRESHOLD: 5,
    FEW_REMAINING_SPEED_BONUS: 1.3,
    BASE_FIRE_INTERVAL: 3000,
    FIRE_INTERVAL_REDUCTION_PER_WAVE: 200,
    MIN_FIRE_INTERVAL: 500,
    DROP_STEP: 20,
    COLS: 5,
    ROWS: 3,
    LEFT_WALL: 20,
    RIGHT_WALL: 460,
  },
  BULLET: { PLAYER_SPEED: -400, ENEMY_SPEED: 250 },
  BOSS: {
    HP_PER_WAVE: 100,
    NORMAL_FIRE_INTERVAL: 1500,
    SPECIAL_FIRE_INTERVAL: 5000,
    SPAWN_Y: 80,
  },
  POWERUP: { DROP_CHANCE: 0.2, FALL_SPEED: 150, MULTISHOT_DURATION: 10000 },
  SCORE: { ENEMY: 100, BOSS: 1000, WAVE_BONUS_MULTIPLIER: 100 },
} as const;
```

- [ ] **Step 3: 테스트 먼저 작성 (TDD)**

```bash
mkdir -p tests
```

`tests/gameCalc.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { calcFleetSpeed, calcFireInterval } from '../src/utils/gameCalc';

describe('calcFleetSpeed', () => {
  it('wave 1에서 기본 속도(60)를 반환', () => {
    expect(calcFleetSpeed(1)).toBeCloseTo(60);
  });
  it('wave 2에서 10% 증가한 속도를 반환', () => {
    expect(calcFleetSpeed(2)).toBeCloseTo(66);
  });
  it('wave 5에서 누적 증가 속도를 반환', () => {
    expect(calcFleetSpeed(5)).toBeCloseTo(60 * Math.pow(1.1, 4));
  });
});

describe('calcFireInterval', () => {
  it('wave 1에서 기본 간격(3000ms)을 반환', () => {
    expect(calcFireInterval(1)).toBe(3000);
  });
  it('wave 2에서 200ms 감소한 간격을 반환', () => {
    expect(calcFireInterval(2)).toBe(2800);
  });
  it('높은 웨이브에서 최소값(500ms)을 반환', () => {
    expect(calcFireInterval(100)).toBe(500);
  });
  it('최소값이 정확히 되는 웨이브 계산', () => {
    // wave 13 → 3000 - 200*12 = 600 > 500
    // wave 14 → 3000 - 200*13 = 400 → clamped to 500
    expect(calcFireInterval(14)).toBe(500);
  });
});
```

- [ ] **Step 4: 테스트 실행 → 실패 확인**

```bash
npm test
```

Expected: FAIL (gameCalc 모듈 없음)

- [ ] **Step 5: `src/utils/gameCalc.ts` 구현**

```typescript
import { CONFIG } from '../config';

export function calcFleetSpeed(wave: number): number {
  return CONFIG.ENEMY.BASE_SPEED * Math.pow(CONFIG.ENEMY.SPEED_SCALE_PER_WAVE, wave - 1);
}

export function calcFireInterval(wave: number): number {
  return Math.max(
    CONFIG.ENEMY.BASE_FIRE_INTERVAL - CONFIG.ENEMY.FIRE_INTERVAL_REDUCTION_PER_WAVE * (wave - 1),
    CONFIG.ENEMY.MIN_FIRE_INTERVAL
  );
}
```

- [ ] **Step 6: 테스트 실행 → 통과 확인**

```bash
npm test
```

Expected: 모든 테스트 PASS

- [ ] **Step 7: 커밋**

```bash
git add src/config.ts src/utils/gameCalc.ts tests/gameCalc.test.ts vitest.config.ts
git commit -m "feat: add game config constants and calc utilities with tests"
```

---

### Task 3: 텍스처 생성 유틸 + BootScene + main.ts

**Files:**
- Create: `src/utils/createTextures.ts`
- Create: `src/scenes/BootScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: `src/utils/createTextures.ts` 작성**

```typescript
export function createTextures(scene: Phaser.Scene): void {
  // 플레이어 (위를 향한 삼각형, 28×28)
  const pg = scene.make.graphics({ add: false });
  pg.fillStyle(0x00ff88);
  pg.fillTriangle(14, 0, 28, 28, 0, 28);
  pg.generateTexture('player', 28, 28);
  pg.destroy();

  // 적 (인베이더 모양, 24×18)
  const eg = scene.make.graphics({ add: false });
  eg.fillStyle(0xff4444);
  eg.fillRect(4, 0, 16, 10);
  eg.fillRect(0, 4, 24, 6);
  eg.fillRect(2, 10, 6, 8);
  eg.fillRect(16, 10, 6, 8);
  eg.generateTexture('enemy', 24, 18);
  eg.destroy();

  // 플레이어 총알 (3×10, 노란색)
  const bpg = scene.make.graphics({ add: false });
  bpg.fillStyle(0xffff00);
  bpg.fillRect(0, 0, 3, 10);
  bpg.generateTexture('bullet-player', 3, 10);
  bpg.destroy();

  // 적 총알 (3×8, 주황색)
  const beg = scene.make.graphics({ add: false });
  beg.fillStyle(0xff6600);
  beg.fillRect(0, 0, 3, 8);
  beg.generateTexture('bullet-enemy', 3, 8);
  beg.destroy();

  // 보스 (60×52, 분홍색)
  const bog = scene.make.graphics({ add: false });
  bog.fillStyle(0xff0088);
  bog.fillRect(10, 0, 40, 10);
  bog.fillRect(0, 10, 60, 28);
  bog.fillRect(8, 38, 10, 14);
  bog.fillRect(42, 38, 10, 14);
  bog.generateTexture('boss', 60, 52);
  bog.destroy();

  // 파워업: 멀티샷 (24×24, 하늘색 원)
  const mpg = scene.make.graphics({ add: false });
  mpg.fillStyle(0x00ccff);
  mpg.fillCircle(12, 12, 12);
  mpg.generateTexture('powerup-multishot', 24, 24);
  mpg.destroy();

  // 파워업: 방어막 (24×24, 금색 원)
  const spg = scene.make.graphics({ add: false });
  spg.fillStyle(0xffcc00);
  spg.fillCircle(12, 12, 12);
  spg.generateTexture('powerup-shield', 24, 24);
  spg.destroy();
}
```

- [ ] **Step 2: `src/scenes/BootScene.ts` 작성**

```typescript
import { createTextures } from '../utils/createTextures';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  create(): void {
    createTextures(this);
    this.scene.start('MenuScene');
  }
}
```

- [ ] **Step 3: `src/main.ts` 작성 (Phaser 게임 설정)**

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { CONFIG } from './config';

// 다른 씬들은 Task 별로 추가됨
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
  scene: [BootScene],
};

new Phaser.Game(config);
```

- [ ] **Step 4: 개발 서버 실행 → 검증**

```bash
npm run dev
```

브라우저에서 `http://localhost:5173` 열기.
Expected: 480×640 검은 캔버스가 화면 중앙에 표시됨. 콘솔 에러 없음. (BootScene이 MenuScene으로 전환 시도 → 씬 없어서 에러 발생 가능 → 다음 Task에서 해결)

- [ ] **Step 5: 커밋**

```bash
git add src/utils/createTextures.ts src/scenes/BootScene.ts src/main.ts
git commit -m "feat: add texture generation, BootScene, and Phaser game bootstrap"
```

---

## Chunk 2: Game Objects

### Task 4: Bullet 클래스

**Files:**
- Create: `src/objects/Bullet.ts`

- [ ] **Step 1: `src/objects/Bullet.ts` 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/objects/Bullet.ts
git commit -m "feat: add Bullet class with up/down direction"
```

---

### Task 5: Player 클래스

**Files:**
- Create: `src/objects/Player.ts`

- [ ] **Step 1: `src/objects/Player.ts` 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/objects/Player.ts
git commit -m "feat: add Player class with movement, auto-fire, invincibility, shield"
```

---

### Task 6: Enemy 클래스

**Files:**
- Create: `src/objects/Enemy.ts`

- [ ] **Step 1: `src/objects/Enemy.ts` 작성**

```typescript
import Phaser from 'phaser';

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'enemy');
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setImmovable(true);
    this.setVelocity(0, 0);
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/objects/Enemy.ts
git commit -m "feat: add Enemy class"
```

---

### Task 7: Powerup 클래스

**Files:**
- Create: `src/objects/Powerup.ts`

- [ ] **Step 1: `src/objects/Powerup.ts` 작성**

```typescript
import Phaser from 'phaser';
import { CONFIG } from '../config';

export type PowerupType = 'multishot' | 'shield';

export class Powerup extends Phaser.Physics.Arcade.Sprite {
  public powerupType: PowerupType;

  constructor(scene: Phaser.Scene, x: number, y: number, type: PowerupType) {
    super(scene, x, y, `powerup-${type}`);
    this.powerupType = type;
    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setVelocityY(CONFIG.POWERUP.FALL_SPEED);
  }

  preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);
    if (this.y > CONFIG.CANVAS.HEIGHT + 20) {
      this.destroy();
    }
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add src/objects/Powerup.ts
git commit -m "feat: add Powerup class"
```

---

### Task 8: Boss 클래스

**Files:**
- Create: `src/objects/Boss.ts`

- [ ] **Step 1: `src/objects/Boss.ts` 작성**

```typescript
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
```

- [ ] **Step 2: 커밋**

```bash
git add src/objects/Boss.ts
git commit -m "feat: add Boss class with normal and special fire timers"
```

---

## Chunk 3: GameScene 코어 루프

### Task 9: GameScene 스캐폴드 + HUD

**Files:**
- Create: `src/scenes/GameScene.ts`
- Modify: `src/main.ts` (씬 목록에 GameScene 추가)

- [ ] **Step 1: `src/scenes/GameScene.ts` 기본 구조 작성**

```typescript
import Phaser from 'phaser';
import { Player } from '../objects/Player';
import { Enemy } from '../objects/Enemy';
import { Bullet } from '../objects/Bullet';
import { Boss } from '../objects/Boss';
import { Powerup, PowerupType } from '../objects/Powerup';
import { CONFIG } from '../config';
import { calcFleetSpeed, calcFireInterval } from '../utils/gameCalc';

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
  private multishotActive: boolean = false;
  private multishotTimer?: Phaser.Time.TimerEvent;

  private fleetDirection: number = 1;
  private enemyFireTimer?: Phaser.Time.TimerEvent;

  // HUD
  private scoreText!: Phaser.GameObjects.Text;
  private waveText!: Phaser.GameObjects.Text;
  private livesText!: Phaser.GameObjects.Text;
  private hiScoreText!: Phaser.GameObjects.Text;
  private powerupText!: Phaser.GameObjects.Text;
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
    this.multishotActive = false;
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
  }

  update(_time: number, delta: number): void {
    if (this.waveClearing) return;
    if (!this.isBossWave) {
      this.updateEnemyFleet(delta);
      this.checkWaveComplete();
    } else if (this.boss?.active) {
      this.checkWaveComplete();
    }
  }

  // --- Background ---

  private createBackground(): void {
    const g = this.add.graphics();
    // 별 50개 랜덤 배치
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
    if (this.multishotActive) {
      const angles = [-15, 0, 15];
      for (const angle of angles) {
        const rad = Phaser.Math.DegToRad(angle);
        const b = new Bullet(this, x, y, 'up');
        const baseSpeed = CONFIG.BULLET.PLAYER_SPEED;
        b.setVelocity(Math.sin(rad) * Math.abs(baseSpeed), baseSpeed * Math.cos(rad));
        this.playerBullets.add(b);
      }
    } else {
      const b = new Bullet(this, x, y, 'up');
      this.playerBullets.add(b);
    }
  }

  // --- HUD ---

  private createHUD(): void {
    const hiScore = parseInt(localStorage.getItem('hi-score') ?? '0', 10);
    const style = { fontFamily: 'monospace', fontSize: '14px', color: '#00ff88' };
    const waveStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#ffff00' };
    const livesStyle = { fontFamily: 'monospace', fontSize: '14px', color: '#ff4444' };

    this.scoreText = this.add.text(8, 8, `SCORE: ${this.score}`, style).setDepth(10);
    this.waveText = this.add.text(CONFIG.CANVAS.WIDTH / 2, 8, `WAVE ${this.wave}`, waveStyle).setOrigin(0.5, 0).setDepth(10);
    this.livesText = this.add.text(CONFIG.CANVAS.WIDTH - 8, 8, '♥'.repeat(this.lives), livesStyle).setOrigin(1, 0).setDepth(10);
    this.hiScoreText = this.add.text(CONFIG.CANVAS.WIDTH - 8, CONFIG.CANVAS.HEIGHT - 20, `HI: ${hiScore}`, { fontFamily: 'monospace', fontSize: '12px', color: '#888888' }).setOrigin(1, 0).setDepth(10);
    this.powerupText = this.add.text(8, CONFIG.CANVAS.HEIGHT - 20, '', { fontFamily: 'monospace', fontSize: '12px', color: '#00ccff' }).setDepth(10);
  }

  private updateHUD(): void {
    this.scoreText.setText(`SCORE: ${this.score}`);
    this.livesText.setText('♥'.repeat(Math.max(0, this.lives)));
  }

  // --- placeholder stubs (구현은 이후 Task에서) ---

  private spawnEnemyGrid(): void { /* Task 10 */ }
  private startEnemyFireTimer(): void { /* Task 12 */ }
  private updateEnemyFleet(_delta: number): void { /* Task 10 */ }
  private spawnBoss(): void { /* Task 15 */ }
  private setupCollisions(): void { /* Task 11 */ }
  private checkWaveComplete(): void { /* Task 13 */ }
  private triggerGameOver(): void { /* Task 11 */ }
}
```

- [ ] **Step 2: `src/main.ts`에 GameScene 추가**

```typescript
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { GameScene } from './scenes/GameScene';
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
  scene: [BootScene, GameScene],
};

new Phaser.Game(config);
```

- [ ] **Step 3: BootScene이 GameScene으로 전환하도록 임시 수정**

`src/scenes/BootScene.ts`의 `create()` 안에서:
```typescript
this.scene.start('GameScene');
```

- [ ] **Step 4: 개발 서버 재시작 → HUD 검증**

```bash
npm run dev
```

Expected: 별이 뿌려진 우주 배경 + 플레이어 삼각형 하단 표시 + HUD 텍스트(SCORE, WAVE, 목숨♥) 상단 표시. 방향키로 좌우 이동 가능. 총알 발사(노란 점이 위로 날아감).

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameScene.ts src/scenes/BootScene.ts src/main.ts
git commit -m "feat: add GameScene scaffold with HUD, player, and groups"
```

---

### Task 10: 적 그리드 스폰 + 편대 이동

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: `spawnEnemyGrid()` 구현**

`GameScene` 안의 `spawnEnemyGrid()` stub을 아래로 교체:

```typescript
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
```

- [ ] **Step 2: `updateEnemyFleet()` 구현**

```typescript
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
      // 하단 도달 체크
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
```

- [ ] **Step 3: 개발 서버에서 검증**

Expected: 15마리 적이 격자 배치, 좌우로 이동, 벽 닿으면 한 줄 내려오며 방향 전환. 화면 아래 도달하면 목숨 감소.

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement enemy grid spawn and fleet movement"
```

---

### Task 11: 플레이어 총알 ↔ 적 충돌 + 파워업 드롭

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: `setupCollisions()`에 총알-적 오버랩 등록**

```typescript
private setupCollisions(): void {
  this.physics.add.overlap(
    this.playerBullets,
    this.enemies,
    this.onPlayerBulletHitEnemy as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
    undefined,
    this
  );
  // 적 총알 ↔ 플레이어 (Task 12에서 추가)
  // 파워업 ↔ 플레이어 (Task 14에서 추가)
}
```

- [ ] **Step 2: `onPlayerBulletHitEnemy()` 핸들러 추가**

```typescript
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
    const type: PowerupType = Math.random() < 0.5 ? 'multishot' : 'shield';
    const p = new Powerup(this, x, y, type);
    this.powerups.add(p);
  }
}
```

- [ ] **Step 3: `triggerGameOver()` 스텁 추가 (씬 연결 전 임시)**

```typescript
private triggerGameOver(): void {
  this.waveClearing = true;
  this.player.destroy();
  this.time.delayedCall(500, () => {
    // Task 18에서 GameOverScene 연결
    this.scene.restart({ wave: 1, score: 0, lives: CONFIG.PLAYER.LIVES });
  });
}
```

- [ ] **Step 4: 개발 서버에서 검증**

Expected: 총알이 적에게 닿으면 둘 다 사라지고 점수 100 증가. 가끔 파워업(하늘색/금색 원)이 낙하함.

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add bullet-enemy collision, score, and powerup drop"
```

---

### Task 12: 적 발사 + 적 총알 ↔ 플레이어 충돌

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: `startEnemyFireTimer()` 구현**

```typescript
private startEnemyFireTimer(): void {
  const interval = calcFireInterval(this.wave);
  this.enemyFireTimer = this.time.addEvent({
    delay: interval,
    loop: true,
    callback: () => {
      const active = this.enemies.getChildren().filter(e => e.active) as Enemy[];
      if (active.length === 0) return;
      const shooter = active[Phaser.Math.Between(0, active.length - 1)];
      const b = new Bullet(this, shooter.x, shooter.y + 12, 'down');
      this.enemyBullets.add(b);
    },
  });
}
```

- [ ] **Step 2: `create()` 안에서 적 총알-플레이어 오버랩 직접 등록**

> 주의: `setupCollisions()`는 `create()` 실행 시 단 한 번 호출되고 끝난다. 그 메서드 본문을 나중에 수정해도 이미 실행된 코드에는 반영되지 않는다. 새 overlap은 반드시 `create()` 안에서 직접 등록해야 런타임에 적용된다.

`create()` 메서드의 `this.setupCollisions();` 호출 바로 뒤에 추가:

```typescript
// create() 안, this.setupCollisions(); 다음 줄:
this.physics.add.overlap(
  this.enemyBullets,
  this.player,
  this.onEnemyBulletHitPlayer as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  undefined,
  this
);
```

- [ ] **Step 3: `onEnemyBulletHitPlayer()` 핸들러 추가**

```typescript
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
```

- [ ] **Step 4: 개발 서버에서 검증**

Expected: 적이 랜덤으로 주황색 총알 발사. 총알이 플레이어에게 닿으면 목숨 감소 + 깜빡임 무적. 목숨 0 → 재시작.

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add enemy fire timer and player hit detection"
```

---

## Chunk 4: 웨이브 완료 + 파워업 효과 + 보스

### Task 13: 웨이브 완료 감지 + WaveCompleteScene 스텁

**Files:**
- Modify: `src/scenes/GameScene.ts`
- Create: `src/scenes/WaveCompleteScene.ts`
- Modify: `src/main.ts`

- [ ] **Step 1: `checkWaveComplete()` 구현**

```typescript
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
```

- [ ] **Step 2: `src/scenes/WaveCompleteScene.ts` 작성**

```typescript
import Phaser from 'phaser';

interface WaveData {
  wave: number;
  score: number;
  bonus: number;
  lives: number;
}

export class WaveCompleteScene extends Phaser.Scene {
  private waveData!: WaveData;

  constructor() {
    super('WaveCompleteScene');
  }

  init(data: WaveData): void {
    this.waveData = data;
  }

  create(): void {
    const { wave, score, bonus, lives } = this.waveData;
    const cx = this.scale.width / 2;
    const cy = this.scale.height / 2;

    this.add.text(cx, cy - 60, `WAVE ${wave} CLEAR!`, {
      fontFamily: 'monospace', fontSize: '28px', color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(cx, cy, `+${bonus} BONUS`, {
      fontFamily: 'monospace', fontSize: '20px', color: '#ffff00',
    }).setOrigin(0.5);

    const countdownText = this.add.text(cx, cy + 60, 'NEXT WAVE IN 3...', {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    let count = 3;
    this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        count--;
        if (count > 0) {
          countdownText.setText(`NEXT WAVE IN ${count}...`);
        } else {
          this.scene.start('GameScene', {
            wave: wave + 1,
            score,
            lives,
          });
        }
      },
    });
  }
}
```

- [ ] **Step 3: `src/main.ts`에 WaveCompleteScene 추가**

```typescript
import { WaveCompleteScene } from './scenes/WaveCompleteScene';
// scene 배열에 WaveCompleteScene 추가:
scene: [BootScene, GameScene, WaveCompleteScene],
```

- [ ] **Step 4: 개발 서버에서 검증**

Expected: 모든 적 처치 → "WAVE 1 CLEAR!" 화면 + 보너스 점수 표시 → 3초 카운트다운 → Wave 2 시작 (적 이동 속도 증가).

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameScene.ts src/scenes/WaveCompleteScene.ts src/main.ts
git commit -m "feat: add wave completion detection and WaveCompleteScene"
```

---

### Task 14: 파워업 효과 (멀티샷, 방어막)

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: `setupCollisions()`에 파워업-플레이어 오버랩 추가**

`setupCollisions()` 안에 추가:

```typescript
this.physics.add.overlap(
  this.powerups,
  this.player,
  this.onPlayerGetPowerup as Phaser.Types.Physics.Arcade.ArcadePhysicsCallback,
  undefined,
  this
);
```

- [ ] **Step 2: `onPlayerGetPowerup()` 핸들러 추가**

```typescript
private onPlayerGetPowerup(
  _playerObj: Phaser.GameObjects.GameObject,
  powerupObj: Phaser.GameObjects.GameObject
): void {
  const p = powerupObj as Powerup;
  if (p.powerupType === 'multishot') {
    this.activateMultishot();
  } else {
    this.activateShield();
  }
  p.destroy();
}

private activateMultishot(): void {
  this.multishotActive = true;
  this.multishotTimer?.remove();
  let remaining = CONFIG.POWERUP.MULTISHOT_DURATION / 1000;
  this.powerupText.setText(`⚡ MULTI-SHOT ${remaining}s`);

  this.multishotTimer = this.time.addEvent({
    delay: 1000,
    repeat: CONFIG.POWERUP.MULTISHOT_DURATION / 1000 - 1,
    callback: () => {
      remaining--;
      if (remaining > 0) {
        this.powerupText.setText(`⚡ MULTI-SHOT ${remaining}s`);
      } else {
        this.multishotActive = false;
        this.powerupText.setText('');
      }
    },
  });
}

private activateShield(): void {
  if (this.player.hasShield) return;
  this.player.activateShield();
  this.powerupText.setText('🛡 SHIELD');
}
```

- [ ] **Step 3: 개발 서버에서 검증**

Expected: 하늘색 파워업 획득 → 3방향 총알 발사 + 화면 하단에 "⚡ MULTI-SHOT Xs" 표시. 금색 파워업 획득 → 플레이어 금색 테두리, 다음 피격 1회 무효.

- [ ] **Step 4: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: implement multishot and shield powerup effects"
```

---

### Task 15: 보스 웨이브

**Files:**
- Modify: `src/scenes/GameScene.ts`

- [ ] **Step 1: `spawnBoss()` 구현**

```typescript
private spawnBoss(): void {
  this.boss = new Boss(this, this.wave);

  this.boss.on('normalFire', (x: number, y: number) => {
    const b = new Bullet(this, x, y, 'down');
    this.enemyBullets.add(b);
  });

  this.boss.on('specialFire', (x: number, y: number) => {
    const angles = [-40, -20, 0, 20, 40];
    for (const angle of angles) {
      const rad = Phaser.Math.DegToRad(angle);
      const b = new Bullet(this, x, y, 'down');
      b.setVelocity(
        Math.sin(rad) * CONFIG.BULLET.ENEMY_SPEED,
        Math.cos(rad) * CONFIG.BULLET.ENEMY_SPEED
      );
      this.enemyBullets.add(b);
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
  bulletObj: Phaser.GameObjects.GameObject,
  _bossObj: Phaser.GameObjects.GameObject
): void {
  bulletObj.destroy();
  if (!this.boss) return;

  const isDead = this.boss.takeDamage();
  this.updateBossHpBar();

  if (isDead) {
    this.score += CONFIG.SCORE.BOSS;
    this.updateHUD();
    // 파워업 2개 확정 드롭
    const p1 = new Powerup(this, this.boss.x - 20, this.boss.y, 'multishot');
    const p2 = new Powerup(this, this.boss.x + 20, this.boss.y, 'shield');
    this.powerups.add(p1);
    this.powerups.add(p2);
    this.boss.destroy();
    this.bossHpBar?.destroy();
    this.bossHpBarBg?.destroy();
  }
}
```

- [ ] **Step 2: 개발 서버에서 보스 웨이브 검증**

Wave 5에 도달하도록 플레이. Expected: 격자 없이 보스 단독 등장 + HP 바 표시. 일반 공격(1방향) + 특수 공격(5방향 산탄). 처치 시 파워업 2개 드롭 + 점수 1000 증가 + WaveCompleteScene 전환.

- [ ] **Step 3: 커밋**

```bash
git add src/scenes/GameScene.ts
git commit -m "feat: add boss wave with HP bar, normal/special fire, and drop"
```

---

## Chunk 5: UI 씬 + 최종 연결

### Task 16: MenuScene

**Files:**
- Create: `src/scenes/MenuScene.ts`
- Modify: `src/main.ts`
- Modify: `src/scenes/BootScene.ts` (MenuScene으로 원복)

- [ ] **Step 1: `src/scenes/MenuScene.ts` 작성**

```typescript
import Phaser from 'phaser';
import { CONFIG } from '../config';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create(): void {
    const cx = this.scale.width / 2;

    // 별 배경
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 0.5);
    for (let i = 0; i < 60; i++) {
      g.fillCircle(
        Phaser.Math.Between(0, this.scale.width),
        Phaser.Math.Between(0, this.scale.height),
        Phaser.Math.FloatBetween(0.5, 1.5)
      );
    }

    this.add.text(cx, 180, 'SPACE SHOOTER', {
      fontFamily: 'monospace', fontSize: '32px', color: '#00ff88',
    }).setOrigin(0.5);

    this.add.text(cx, 230, '← → 이동  ·  자동 사격', {
      fontFamily: 'monospace', fontSize: '14px', color: '#888888',
    }).setOrigin(0.5);

    const hiScore = localStorage.getItem('hi-score') ?? '0';
    this.add.text(cx, 280, `HI-SCORE: ${hiScore}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#ffff00',
    }).setOrigin(0.5);

    const playBtn = this.add.text(cx, 380, '[ PLAY ]', {
      fontFamily: 'monospace', fontSize: '24px', color: '#00ff88',
      backgroundColor: '#003322',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00ff88'));
    playBtn.on('pointerdown', () => {
      this.scene.start('GameScene', { wave: 1, score: 0, lives: CONFIG.PLAYER.LIVES });
    });

    // 스페이스바로도 시작
    this.input.keyboard!.once('keydown-SPACE', () => {
      this.scene.start('GameScene', { wave: 1, score: 0, lives: CONFIG.PLAYER.LIVES });
    });
  }
}
```

- [ ] **Step 2: `BootScene.ts` 원복 (GameScene → MenuScene)**

```typescript
this.scene.start('MenuScene');
```

- [ ] **Step 3: `src/main.ts`에 MenuScene 추가**

```typescript
import { MenuScene } from './scenes/MenuScene';
// scene 배열:
scene: [BootScene, MenuScene, GameScene, WaveCompleteScene],
```

- [ ] **Step 4: 개발 서버 검증**

Expected: 타이틀 화면 표시 → PLAY 클릭 또는 스페이스바 → 게임 시작. MenuScene에서 최고점 표시.

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/MenuScene.ts src/scenes/BootScene.ts src/main.ts
git commit -m "feat: add MenuScene with PLAY button and hi-score display"
```

---

### Task 17: GameOverScene + Hi-Score 저장

**Files:**
- Create: `src/scenes/GameOverScene.ts`
- Modify: `src/scenes/GameScene.ts` (`triggerGameOver` 업데이트)
- Modify: `src/main.ts`

- [ ] **Step 1: `src/scenes/GameOverScene.ts` 작성**

```typescript
import Phaser from 'phaser';

interface GameOverData {
  wave: number;
  score: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data: GameOverData): void {
    const prev = parseInt(localStorage.getItem('hi-score') ?? '0', 10);
    if (data.score > prev) {
      localStorage.setItem('hi-score', String(data.score));
    }
    this.data.set('gameData', data);
    this.data.set('isNewHi', data.score > prev);
  }

  create(): void {
    const { wave, score } = this.data.get('gameData') as GameOverData;
    const isNewHi = this.data.get('isNewHi') as boolean;
    const cx = this.scale.width / 2;

    this.add.text(cx, 180, 'GAME OVER', {
      fontFamily: 'monospace', fontSize: '36px', color: '#ff4444',
    }).setOrigin(0.5);

    this.add.text(cx, 250, `SCORE: ${score}`, {
      fontFamily: 'monospace', fontSize: '22px', color: '#ffffff',
    }).setOrigin(0.5);

    this.add.text(cx, 290, `WAVE: ${wave}`, {
      fontFamily: 'monospace', fontSize: '16px', color: '#888888',
    }).setOrigin(0.5);

    if (isNewHi) {
      this.add.text(cx, 330, '★ NEW HI-SCORE! ★', {
        fontFamily: 'monospace', fontSize: '18px', color: '#ffff00',
      }).setOrigin(0.5);
    }

    const playBtn = this.add.text(cx, 420, '[ PLAY AGAIN ]', {
      fontFamily: 'monospace', fontSize: '20px', color: '#00ff88',
      backgroundColor: '#003322',
      padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });

    playBtn.on('pointerover', () => playBtn.setColor('#ffffff'));
    playBtn.on('pointerout', () => playBtn.setColor('#00ff88'));
    playBtn.on('pointerdown', () => this.scene.start('MenuScene'));
  }
}
```

- [ ] **Step 2: `GameScene.triggerGameOver()` 실제 씬 전환으로 업데이트**

```typescript
private triggerGameOver(): void {
  this.waveClearing = true;
  this.enemyFireTimer?.remove();
  this.player.setActive(false).setVisible(false);
  this.time.delayedCall(500, () => {
    this.scene.start('GameOverScene', { wave: this.wave, score: this.score });
  });
}
```

- [ ] **Step 3: `src/main.ts`에 GameOverScene 추가**

```typescript
import { GameOverScene } from './scenes/GameOverScene';
// scene 배열:
scene: [BootScene, MenuScene, GameScene, WaveCompleteScene, GameOverScene],
```

- [ ] **Step 4: 개발 서버에서 전체 플로우 검증**

Expected:
1. MenuScene 시작 → PLAY → GameScene
2. 적에게 3번 피격 → "GAME OVER" 화면 → 점수/웨이브 표시 → 최고점 경신 시 "★ NEW HI-SCORE! ★"
3. PLAY AGAIN → MenuScene (최고점 반영됨)
4. 웨이브 클리어 → WaveCompleteScene → 다음 웨이브

- [ ] **Step 5: 커밋**

```bash
git add src/scenes/GameOverScene.ts src/scenes/GameScene.ts src/main.ts
git commit -m "feat: add GameOverScene with hi-score persistence and full scene wiring"
```

---

### Task 18: 최종 빌드 검증

**Files:** (없음 — 검증 전용 Task)

- [ ] **Step 1: TypeScript 빌드 에러 확인**

```bash
npx tsc --noEmit
```

Expected: 에러 없음

- [ ] **Step 2: 프로덕션 빌드**

```bash
npm run build
```

Expected: `dist/` 폴더 생성, 에러 없음

- [ ] **Step 3: 빌드 결과물 미리보기**

```bash
npm run preview
```

브라우저에서 빌드된 게임 실행 확인. 전체 동작 체크:
- MenuScene 표시, PLAY 클릭으로 게임 시작
- 플레이어 좌우 이동 / 자동 총알 발사
- 적 격자 이동, 벽에서 방향 전환
- 총알이 적에게 맞으면 제거 + 점수 증가
- 적 총알 발사
- 피격 시 무적 + 깜빡임
- 목숨 0 → GameOverScene
- 전 적 제거 → WaveCompleteScene → 다음 웨이브
- Wave 5 → 보스 등장 + HP 바
- 파워업 획득 효과 (멀티샷/방어막)
- 최고점 localStorage 저장
