import Phaser from 'phaser';
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
