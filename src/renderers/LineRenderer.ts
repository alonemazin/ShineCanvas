import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";
import { colorToCSS } from "../utils/color";

/**
 * Renders LINE nodes.
 *
 * Figma LINE nodes are always horizontal in local space (width = length,
 * height = 0). Rotation/direction comes from relativeTransform.
 *
 * Instead of drawing horizontal then rotating (which compounds errors),
 * we compute the actual start/end points in parent space directly from
 * the relativeTransform matrix.
 */
export class LineRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as LineNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(dims: Dimensions): string {
    return "";
  }

  async render(): Promise<void> {
    if (!this.node.visible) return;

    const node = this.node as any;
    this.builder.blank().comment(`LINE: "${this.node.name}"`);

    // Compute actual start/end points from relativeTransform
    const { startX, startY, endX, endY } = this.getLineEndpoints();

    const needsSave = this.hasOpacity() || this.hasBlendMode();
    if (needsSave) {
      this.builder.line(`ctx.save();`);
      if (this.hasOpacity()) this.applyOpacity();
      if (this.hasBlendMode()) this.applyBlendMode();
    }

    const strokes = node.strokes
      ? (node.strokes as ReadonlyArray<Paint>).filter((s: Paint) => s.visible !== false)
      : [];
    if (strokes.length === 0) {
      if (needsSave) this.builder.line(`ctx.restore();`);
      return;
    }

    const weight = node.strokeWeight ?? 1;
    this.builder.line(`ctx.lineWidth = ${r(weight)};`);

    // Stroke cap (non-arrow)
    const strokeCap = node.strokeCap as string | undefined;
    const isArrowCap =
      strokeCap === "ARROW_LINES" || strokeCap === "ARROW_EQUILATERAL";
    if (strokeCap && !isArrowCap && strokeCap !== "NONE") {
      const capMap: Record<string, string> = { ROUND: "round", SQUARE: "square" };
      if (capMap[strokeCap]) {
        this.builder.line(`ctx.lineCap = '${capMap[strokeCap]}';`);
      }
    }

    for (const stroke of strokes) {
      if (stroke.type === "SOLID") {
        this.builder
          .line(`ctx.strokeStyle = ${colorToCSS((stroke as SolidPaint).color, stroke.opacity ?? 1)};`)
          .line(`ctx.beginPath();`)
          .line(`ctx.moveTo(${r(startX)}, ${r(startY)});`)
          .line(`ctx.lineTo(${r(endX)}, ${r(endY)});`)
          .line(`ctx.stroke();`);

        // Draw arrowhead at end
        if (isArrowCap) {
          const angle = Math.atan2(endY - startY, endX - startX);
          const arrowSize = Math.max(weight * 4, 8);
          const filled = strokeCap === "ARROW_EQUILATERAL";
          this.drawArrowhead(r(endX), r(endY), angle, arrowSize, filled);
        }
      }
    }

    if (needsSave) {
      this.builder.line(`ctx.restore();`);
    }
  }

  /**
   * Compute actual line start/end points in parent space using relativeTransform.
   *
   * LINE local space: start=(0,0), end=(width,0).
   * relativeTransform maps these to parent space:
   *   parentPoint = [[a,c,e],[b,d,f]] * [localX, localY, 1]
   */
  private getLineEndpoints(): {
    startX: number;
    startY: number;
    endX: number;
    endY: number;
  } {
    const node = this.node as any;
    const width = node.width as number;
    const transform = node.relativeTransform as
      | ReadonlyArray<ReadonlyArray<number>>
      | undefined;

    if (transform) {
      const [a, c, e] = transform[0];
      const [b, d, f] = transform[1];

      // Start point: transform * (0, 0, 1) = (e, f)
      const sx = e + this.offset.x;
      const sy = f + this.offset.y;

      // End point: transform * (width, 0, 1) = (a*width + e, b*width + f)
      const ex = a * width + e + this.offset.x;
      const ey = b * width + f + this.offset.y;

      return { startX: sx, startY: sy, endX: ex, endY: ey };
    }

    // Fallback: no rotation
    const pos = this.getAbsolutePosition();
    return {
      startX: pos.x,
      startY: pos.y,
      endX: pos.x + width,
      endY: pos.y,
    };
  }

  private drawArrowhead(
    tipX: number,
    tipY: number,
    angle: number,
    size: number,
    filled: boolean
  ): void {
    const halfAngle = Math.PI / 6; // 30 degrees
    const x1 = r(tipX - size * Math.cos(angle - halfAngle));
    const y1 = r(tipY - size * Math.sin(angle - halfAngle));
    const x2 = r(tipX - size * Math.cos(angle + halfAngle));
    const y2 = r(tipY - size * Math.sin(angle + halfAngle));

    this.builder.line(`ctx.beginPath();`);
    this.builder.line(`ctx.moveTo(${r(tipX)}, ${r(tipY)});`);
    this.builder.line(`ctx.lineTo(${x1}, ${y1});`);
    if (filled) {
      this.builder.line(`ctx.lineTo(${x2}, ${y2});`);
      this.builder.line(`ctx.closePath();`);
      this.builder.line(`ctx.fill();`);
    } else {
      this.builder.line(`ctx.moveTo(${r(tipX)}, ${r(tipY)});`);
      this.builder.line(`ctx.lineTo(${x2}, ${y2});`);
      this.builder.line(`ctx.stroke();`);
    }
  }
}
