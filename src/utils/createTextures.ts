export function createTextures(scene: Phaser.Scene): void {
  // 플레이어 (위를 향한 삼각형, 28×28)
  const pg = scene.add.graphics();
  pg.fillStyle(0x00ff88);
  pg.fillTriangle(14, 0, 28, 28, 0, 28);
  pg.generateTexture('player', 28, 28);
  pg.destroy();

  // 적 (인베이더 모양, 24×18)
  const eg = scene.add.graphics();
  eg.fillStyle(0xff4444);
  eg.fillRect(4, 0, 16, 10);
  eg.fillRect(0, 4, 24, 6);
  eg.fillRect(2, 10, 6, 8);
  eg.fillRect(16, 10, 6, 8);
  eg.generateTexture('enemy', 24, 18);
  eg.destroy();

  // 플레이어 총알 (3×10, 노란색)
  const bpg = scene.add.graphics();
  bpg.fillStyle(0xffff00);
  bpg.fillRect(0, 0, 3, 10);
  bpg.generateTexture('bullet-player', 3, 10);
  bpg.destroy();

  // 적 총알 (3×8, 주황색)
  const beg = scene.add.graphics();
  beg.fillStyle(0xff6600);
  beg.fillRect(0, 0, 3, 8);
  beg.generateTexture('bullet-enemy', 3, 8);
  beg.destroy();

  // 보스 (60×52, 분홍색)
  const bog = scene.add.graphics();
  bog.fillStyle(0xff0088);
  bog.fillRect(10, 0, 40, 10);
  bog.fillRect(0, 10, 60, 28);
  bog.fillRect(8, 38, 10, 14);
  bog.fillRect(42, 38, 10, 14);
  bog.generateTexture('boss', 60, 52);
  bog.destroy();

  // 파워업: 멀티샷 (24×24, 노란색 원)
  const mpg = scene.add.graphics();
  mpg.fillStyle(0xffff00);
  mpg.fillCircle(12, 12, 12);
  mpg.generateTexture('powerup-multishot', 24, 24);
  mpg.destroy();

  // 파워업: 방어막 (24×24, 하늘색 원)
  const spg = scene.add.graphics();
  spg.fillStyle(0x00ccff);
  spg.fillCircle(12, 12, 12);
  spg.generateTexture('powerup-shield', 24, 24);
  spg.destroy();

  // 파워업: 목숨 (24×24, 빨간색 하트)
  const hpg = scene.add.graphics();
  hpg.fillStyle(0xff3355);
  hpg.fillCircle(8, 9, 5);
  hpg.fillCircle(16, 9, 5);
  hpg.fillTriangle(3, 11, 21, 11, 12, 22);
  hpg.generateTexture('powerup-heart', 24, 24);
  hpg.destroy();

  // 파워업: 총알 강화 (24×24, 초록색 원)
  const ppg = scene.add.graphics();
  ppg.fillStyle(0x44ff44);
  ppg.fillCircle(12, 12, 12);
  ppg.fillStyle(0xffffff);
  ppg.fillRect(11, 6, 2, 12);
  ppg.fillRect(6, 11, 12, 2);
  ppg.generateTexture('powerup-power', 24, 24);
  ppg.destroy();
}
