import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";

/**
 * Renders POLYGON nodes by computing a regular polygon path geometrically.
 *
 * Figma's PolygonNode has:
 * - pointCount: number of sides/vertices
 *
 * The polygon is inscribed in the node's bounding box.
 */
export class PolygonRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as PolygonNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(dims: Dimensions): string {
    const node = this.node as PolygonNode;
    const sides = node.pointCount ?? 3;

    const cx = dims.x + dims.width / 2;
    const cy = dims.y + dims.height / 2;
    const rx = dims.width / 2;
    const ry = dims.height / 2;

    const angleStep = (2 * Math.PI) / sides;
    // Start from top (-π/2) — Figma's default polygon orientation
    const startAngle = -Math.PI / 2;

    const parts: string[] = [];
    for (let i = 0; i < sides; i++) {
      const angle = startAngle + i * angleStep;
      const px = cx + rx * Math.cos(angle);
      const py = cy + ry * Math.sin(angle);

      if (i === 0) {
        parts.push(`ctx.moveTo(${r(px)}, ${r(py)});`);
      } else {
        parts.push(`ctx.lineTo(${r(px)}, ${r(py)});`);
      }
    }
    parts.push(`ctx.closePath();`);

    return parts.join("\n");
  }
}
