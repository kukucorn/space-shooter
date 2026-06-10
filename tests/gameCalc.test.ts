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
    expect(calcFireInterval(14)).toBe(500);
  });
});
