import { ICEPerspectiveCamera } from 'ice3';

export type ProjectionOffset = readonly [number, number];

export interface DynamicClipPlaneOptions {
  readonly minNear: number;
  readonly maxNear: number;
  readonly nearRatio: number;
  readonly far: number;
}

export class ICEViewOffsetCamera extends ICEPerspectiveCamera {
  private projectionOffset: ProjectionOffset = [0, 0];
  private dynamicClipPlanes: DynamicClipPlaneOptions | null = null;

  setDynamicClipPlanes(options: DynamicClipPlaneOptions): this {
    if (
      !Number.isFinite(options.minNear)
      || !Number.isFinite(options.maxNear)
      || !Number.isFinite(options.nearRatio)
      || !Number.isFinite(options.far)
      || options.minNear <= 0
      || options.maxNear < options.minNear
      || options.nearRatio <= 0
      || options.far <= options.maxNear
    ) {
      throw new RangeError('Camera dynamic clip planes are invalid');
    }
    this.dynamicClipPlanes = { ...options };
    this.applyDynamicClipPlanes();
    return this;
  }

  override setPosition(
    position: Parameters<ICEPerspectiveCamera['setPosition']>[0],
  ): this {
    super.setPosition(position);
    this.applyDynamicClipPlanes();
    return this;
  }

  override setTarget(
    target: Parameters<ICEPerspectiveCamera['setTarget']>[0],
  ): this {
    super.setTarget(target);
    this.applyDynamicClipPlanes();
    return this;
  }

  setProjectionOffset(offset: ProjectionOffset): this {
    if (!offset.every(Number.isFinite)) {
      throw new RangeError('Camera projection offset must be finite');
    }
    this.projectionOffset = [offset[0], offset[1]];
    return this;
  }

  getProjectionOffset(): ProjectionOffset {
    return [this.projectionOffset[0], this.projectionOffset[1]];
  }

  private applyDynamicClipPlanes(): void {
    if (!this.dynamicClipPlanes) return;
    const position = this.getPosition();
    const target = this.getTarget();
    const distance = Math.hypot(
      position.x - target.x,
      position.y - target.y,
      position.z - target.z,
    );
    const near = Math.min(
      this.dynamicClipPlanes.maxNear,
      Math.max(
        this.dynamicClipPlanes.minNear,
        distance * this.dynamicClipPlanes.nearRatio,
      ),
    );
    this.setClipPlanes(near, this.dynamicClipPlanes.far);
  }

  override getViewProjectionMatrix(aspect: number) {
    const matrix = super.getViewProjectionMatrix(aspect);
    const [offsetX, offsetY] = this.projectionOffset;
    if (offsetX === 0 && offsetY === 0) return matrix;
    const elements = matrix.elements;
    for (let column = 0; column < 4; column += 1) {
      const offset = column * 4;
      const w = elements[offset + 3]!;
      elements[offset] = elements[offset]! + offsetX * w;
      elements[offset + 1] = elements[offset + 1]! + offsetY * w;
    }
    return matrix;
  }
}
