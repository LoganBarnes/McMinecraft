// deps
import { Scene, GLUtils, Camera } from 'ts-graphics';
import { vec3 } from 'gl-matrix';
// generated
import Blocks from '@/minecraft/Blocks';

class MinecraftWorld {
  private scene: Scene;
  private glUtils: GLUtils;
  private blocks: Blocks;

  constructor(gl: WebGLRenderingContext) {
    this.scene = new Scene();
    this.glUtils = new GLUtils(gl);
    this.blocks = new Blocks(this.glUtils);

    this.scene.addItemToRender(this.blocks);
  }

  public update(timeStep: number): void {
    this.scene.onUpdate(timeStep);
  }

  public render(camera: Camera): void {
    this.scene.onRender(camera);
  }

  public addBlock(position: vec3): void {
    this.blocks.addBlock(position);
  }
}

export default MinecraftWorld;
