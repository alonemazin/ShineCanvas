import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";

export class EllipseRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as EllipseNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(dims: Dimensions): string {
    const cx = r(dims.x + dims.width / 2);
    const cy = r(dims.y + dims.height / 2);
    const rx = r(dims.width / 2);
    const ry = r(dims.height / 2);
    return `ctx.ellipse(${cx}, ${cy}, ${rx}, ${ry}, 0, 0, Math.PI * 2);`;
  }
}
