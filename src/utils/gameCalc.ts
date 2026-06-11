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

export function calcEnemyBulletSpeed(wave: number): number {
  return Math.min(
    CONFIG.BULLET.ENEMY_SPEED * Math.pow(CONFIG.BULLET.ENEMY_SPEED_SCALE_PER_WAVE, wave - 1),
    CONFIG.BULLET.ENEMY_MAX_SPEED
  );
}

export function calcShooterCount(wave: number): number {
  return Math.min(
    1 + Math.floor((wave - 1) / CONFIG.ENEMY.SHOOTER_INCREASE_EVERY_WAVES),
    CONFIG.ENEMY.MAX_SHOOTERS
  );
}

export function calcBossNormalFireInterval(wave: number): number {
  return Math.max(
    CONFIG.BOSS.NORMAL_FIRE_INTERVAL - CONFIG.BOSS.NORMAL_FIRE_REDUCTION_PER_WAVE * Math.max(0, wave - 5),
    CONFIG.BOSS.MIN_NORMAL_FIRE_INTERVAL
  );
}

export function calcBossSpecialFireInterval(wave: number): number {
  return Math.max(
    CONFIG.BOSS.SPECIAL_FIRE_INTERVAL - CONFIG.BOSS.SPECIAL_FIRE_REDUCTION_PER_WAVE * Math.max(0, wave - 5),
    CONFIG.BOSS.MIN_SPECIAL_FIRE_INTERVAL
  );
}
