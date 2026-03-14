import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";

export class RectangleRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as RectangleNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: this.getCornerRadius(),
    };
  }

  protected getShapePath(dims: Dimensions): string {
    const { x, y, width, height, cornerRadius } = dims;
    if (cornerRadius === 0) {
      return `ctx.rect(${x}, ${y}, ${width}, ${height});`;
    }
    const radiusArg = Array.isArray(cornerRadius)
      ? `[${cornerRadius.map(r).join(", ")}]`
      : r(cornerRadius);
    return `ctx.roundRect(${x}, ${y}, ${width}, ${height}, ${radiusArg});`;
  }
}
