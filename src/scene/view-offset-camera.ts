import { ICEPerspectiveCamera } from 'ice3';

export type ProjectionOffset = readonly [number, number];

export class ICEViewOffsetCamera extends ICEPerspectiveCamera {
  private projectionOffset: ProjectionOffset = [0, 0];

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
