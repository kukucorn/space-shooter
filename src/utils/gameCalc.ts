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
