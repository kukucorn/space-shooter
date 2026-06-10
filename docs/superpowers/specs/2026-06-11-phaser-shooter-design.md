# Phaser Space Shooter — Design Spec
Date: 2026-06-11

## Overview

Phaser 3 기반의 1인용 웨이브 클리어 슈팅 게임. 레트로 픽셀 아트 비주얼, 하단 고정 좌우 이동 조작. 학습 목적으로 Phaser의 핵심 개념(Scene, GameObject, Physics, Tween)을 자연스럽게 익힐 수 있도록 설계.

## Goals

- 최신 크롬에서 동작하는 HTML5 게임
- 뇌빼고 즐길 수 있는 캐주얼 조작 (좌우 이동 + 자동 사격)
- Node.js 백엔드 개발자가 Phaser 3를 학습하는 데 적합한 범위와 복잡도

## Non-Goals

- 멀티플레이어, 서버 연동
- 복잡한 레벨 에디터나 콘텐츠 파이프라인
- 모바일 터치 지원 (현재 범위 제외, 향후 확장 가능)

## Tech Stack

| 항목 | 선택 | 이유 |
|---|---|---|
| 게임 프레임워크 | Phaser 3 (latest stable) | 가장 널리 쓰이는 HTML5 게임 프레임워크, 문서 풍부 |
| 빌드 도구 | Vite | 빠른 HMR, Node.js 개발자 친화적 |
| 언어 | TypeScript | 타입 안전성, 자동완성 지원 |
| 저장소 | localStorage | 최고 점수 저장, 백엔드 불필요 |

## Canvas Dimensions

- **해상도**: 480 × 640 (세로형, 모바일 확장 고려)
- Phaser 게임 config에서 `width: 480, height: 640`으로 고정
- 브라우저 창 크기에 맞게 letterbox 스케일링 (`ScaleManager: FIT`)

## Project Structure

```
games/
├── src/
│   ├── scenes/
│   │   ├── BootScene.ts        # Physics 설정 후 MenuScene으로 즉시 전환
│   │   ├── MenuScene.ts        # 타이틀 화면
│   │   ├── GameScene.ts        # 메인 게임 루프 + 편대 관리 포함
│   │   ├── WaveCompleteScene.ts
│   │   └── GameOverScene.ts
│   ├── objects/
│   │   ├── Player.ts           # 플레이어 오브젝트
│   │   ├── Enemy.ts            # 적 오브젝트
│   │   ├── Bullet.ts           # 총알 (방향 인자로 플레이어/적 공용)
│   │   ├── Boss.ts             # 보스 오브젝트
│   │   └── Powerup.ts          # 파워업 아이템
│   └── config.ts               # 게임 상수 (속도, 점수, 확률 등, 아래 기본값 참조)
├── public/
│   └── assets/                 # 스프라이트, 사운드 (초기엔 도형으로 대체)
├── index.html
├── vite.config.ts
└── tsconfig.json
```

> `EnemyGroup` 별도 클래스 없음 — 15마리 고정 그리드는 `GameScene`이 `Phaser.GameObjects.Group`으로 직접 관리.  
> `BootScene`은 초기에 로드할 에셋이 없으므로 Physics/Scale 설정만 하고 즉시 `MenuScene`으로 전환.

## Scene Flow & Data Passing

```
BootScene → MenuScene → GameScene → WaveCompleteScene → GameScene (next wave)
                                  ↘ GameOverScene → MenuScene
```

**씬 간 데이터 전달 (Phaser `scene.start(key, data)` 사용):**

| 전환 | 전달 데이터 |
|---|---|
| `GameScene` → `WaveCompleteScene` | `{ wave: number, score: number, bonus: number, lives: number }` |
| `WaveCompleteScene` → `GameScene` | `{ wave: number, score: number, lives: number }` |
| `GameScene` → `GameOverScene` | `{ wave: number, score: number }` |
| `GameOverScene` → `MenuScene` | 없음 |

## Gameplay Mechanics

### Player
- 화면 하단 고정 위치 (y = 580), 좌우 이동 (←/→ 방향키 또는 A/D)
- 이동 속도: 200px/s
- **자동 사격**: 별도 입력 없이 500ms 간격으로 위쪽으로 총알 발사
- 체력: 3목숨. 피격 시 1감소, 0이 되면 게임오버
- 피격 직후 1.5초 무적 + 깜빡임 Tween (alpha 0↔1, 100ms 간격)

### Enemy Grid
- 초기 구성: 5열 × 3행 = 15마리, 상단 영역(y: 80~200)에 격자 배치
- 편대 전체가 좌우로 이동, 벽(x: 20 또는 x: 460)에 닿으면 y += 20 하강 후 방향 전환
- **기본 이동 속도**: 웨이브 1 기준 60px/s, 웨이브마다 ×1.10 증가
- **잔여 적 보너스**: 남은 적이 5마리 이하일 때 현재 속도 ×1.3 추가
- **적 발사 간격**: 웨이브 1 기준 랜덤 3,000ms, 웨이브마다 −200ms 감소, 최소 500ms
  - 매 간격마다 살아있는 적 중 랜덤 1마리가 아래 방향으로 총알 발사
- 적이 y > 620에 도달 시 목숨 1감소 + 해당 적 제거

### Bullet
`Bullet` 클래스는 생성 시 `direction: 'up' | 'down'` 인자를 받는다.
- `'up'` (플레이어 발사): 속도 −400px/s (위쪽), 화면 밖(y < 0) 도달 시 제거
- `'down'` (적 발사): 속도 +250px/s (아래쪽), 화면 밖(y > 640) 도달 시 제거

### Wave System
- 1~4웨이브: 일반 편대 클리어
- **5의 배수 웨이브**: 보스 등장 (편대 없음)
- 모든 적/보스 제거 → `GameScene`이 `WaveCompleteScene` 실행 (3초 카운트다운) → 자동으로 다음 웨이브

### Boss
- 화면 상단 중앙(x: 240, y: 80)에 단독 등장, 상단 HUD 아래 체력 바 표시
- **HP**: `wave × 100` (예: 웨이브 5 → HP 500, 웨이브 10 → HP 1000)
- **일반 공격**: 1,500ms마다 아래 방향으로 총알 1발 발사
- **특수 공격**: 5,000ms마다 5방향 산탄 발사 (정면 기준 −40°, −20°, 0°, +20°, +40°). 예고 없이 즉시 발사 (텔레그래프 없음).
- 격파 시 1,000점 + 파워업 2개 확정 드롭 (멀티샷 1 + 방어막 1)

### Power-ups
적 격추 시 20% 확률로 드롭, 플레이어가 닿으면 획득. 아래로 150px/s 속도로 낙하, 화면 밖 도달 시 제거.

| 파워업 | 효과 | 지속 시간 | 중복 획득 시 |
|---|---|---|---|
| ⚡ 멀티샷 | 3방향 동시 발사 (−15°, 0°, +15°) | 10초 | 타이머 10초로 리셋 |
| 🛡️ 방어막 | 다음 피격 1회 무효 (플레이어 테두리 표시) | 소진 시까지 | 무효 (이미 보유 시 드랍 무시) |

### Scoring
| 이벤트 | 점수 |
|---|---|
| 일반 적 격추 | 100점 |
| 보스 격추 | 1,000점 |
| 웨이브 클리어 보너스 | 웨이브 번호 × 100점 |

- localStorage 키 `hi-score`에 최고 점수 저장, 게임오버 화면에서 표시 및 경신 여부 판단

## config.ts 기본값 (주요 상수)

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
  },
  BULLET: { PLAYER_SPEED: -400, ENEMY_SPEED: 250 },
  BOSS: {
    HP_PER_WAVE: 100,
    NORMAL_FIRE_INTERVAL: 1500,
    SPECIAL_FIRE_INTERVAL: 5000,
  },
  POWERUP: { DROP_CHANCE: 0.2, FALL_SPEED: 150, MULTISHOT_DURATION: 10000 },
  SCORE: { ENEMY: 100, BOSS: 1000, WAVE_BONUS_MULTIPLIER: 100 },
};
```

## UI Layout

### 게임 화면 HUD
- **상단 바** (y: 0~30): `SCORE: XXXX` (좌) / `WAVE N` (중) / `♥ ♥ ♥` 목숨 (우)
- **보스 체력 바**: 보스 웨이브에서만 상단 바 아래에 표시 (빨간색 바, 픽셀 단위 감소)
- **하단 좌** (y: 615): 활성 파워업 아이콘 + 남은 시간 (예: `⚡ MULTI-SHOT 7s`)
- **하단 우** (y: 615): `HI: XXXX` 최고점

### WaveCompleteScene
- 데이터 수신: `{ wave, score, bonus }`
- "WAVE N CLEAR!" 텍스트 + `+BONUS점` 표시
- "NEXT WAVE IN 3..." 카운트다운, 0이 되면 `GameScene` 재시작 (다음 웨이브 데이터 전달)

### GameOverScene
- 데이터 수신: `{ wave, score }`
- 최종 점수, 도달한 웨이브 번호 표시
- localStorage `hi-score`와 비교 후 경신 시 "★ NEW HI-SCORE! ★" 표시 및 저장
- `[ PLAY AGAIN ]` 버튼 → MenuScene

## Visual Style

레트로 픽셀 아트. 어두운 우주 배경(별 파티클), 8비트 감성의 도트 스프라이트.
초기 개발 단계에서는 Phaser의 `Graphics` API로 도형(삼각형, 다각형)을 그려 스프라이트를 대체하고, 이후 실제 픽셀 아트 에셋으로 교체 가능하도록 오브젝트를 설계.

## Key Phaser Concepts Covered

이 게임을 구현하면서 자연스럽게 학습하게 되는 Phaser 3 개념들:

- **Scene 관리**: 멀티 씬 전환 (`scene.start(key, data)`), 씬 간 데이터 전달
- **GameObjects**: Graphics, Text, Group
- **Physics (Arcade)**: 충돌 감지, 오버랩 이벤트
- **Input**: Keyboard 커서키 처리
- **Tween**: 무적 시 깜빡임, UI 페이드 효과
- **Timer**: `time.addEvent`로 자동 사격 간격, 적 발사 타이밍
- **localStorage**: 점수 영속화
