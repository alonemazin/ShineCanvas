import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";

/**
 * Renders STAR nodes by computing the star polygon path geometrically.
 *
 * Figma's StarNode has:
 * - pointCount: number of outer points
 * - innerRadius: ratio (0–1) of inner radius to outer radius
 *
 * The star is inscribed in the node's bounding box with alternating
 * outer and inner vertices.
 */
export class StarRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as StarNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(dims: Dimensions): string {
    const node = this.node as StarNode;
    const pointCount = node.pointCount ?? 5;
    const innerRatio = node.innerRadius ?? 0.382; // default star inner ratio

    const cx = dims.x + dims.width / 2;
    const cy = dims.y + dims.height / 2;
    const rx = dims.width / 2;
    const ry = dims.height / 2;
    const innerRx = rx * innerRatio;
    const innerRy = ry * innerRatio;

    const totalPoints = pointCount * 2;
    const angleStep = Math.PI / pointCount;
    // Start from top (-π/2) — Figma's default star orientation
    const startAngle = -Math.PI / 2;

    const parts: string[] = [];
    for (let i = 0; i < totalPoints; i++) {
      const angle = startAngle + i * angleStep;
      const isOuter = i % 2 === 0;
      const px = cx + (isOuter ? rx : innerRx) * Math.cos(angle);
      const py = cy + (isOuter ? ry : innerRy) * Math.sin(angle);

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
