import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { FillPainter } from "../painters/FillPainter";
import { colorToCSS } from "../utils/color";
import { r } from "../utils/math";

let vectorPathCounter = 0;
export function resetVectorPathCounter() { vectorPathCounter = 0; }

export class VectorRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as VectorNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(dims: Dimensions): string {
    // Fallback rect path — only used if vectorPaths unavailable
    return `ctx.rect(${dims.x}, ${dims.y}, ${dims.width}, ${dims.height});`;
  }

  async render(): Promise<void> {
    if (!this.node.visible) return;

    const node = this.node as VectorNode;
    const dims = this.getDimensions();

    this.builder.blank().comment(`${this.node.type}: "${this.node.name}"`);

    const needsSave =
      this.hasRotation() || this.hasOpacity() || this.hasBlendMode() || this.hasEffects();

    if (needsSave) {
      this.builder.line(`ctx.save();`);
      if (this.hasRotation()) this.applyRotation(dims);
      if (this.hasOpacity()) this.applyOpacity();
      if (this.hasBlendMode()) this.applyBlendMode();
    }

    if ("vectorPaths" in node && node.vectorPaths.length > 0) {
      const allPathData = node.vectorPaths
        .map((vp) => vp.data)
        .filter(Boolean)
        .join(" ");

      if (allPathData) {
        const pathVar = `vectorPath${vectorPathCounter++}`;

        this.builder
          .line(`ctx.save();`)
          .line(`ctx.translate(${dims.x}, ${dims.y});`);

        this.builder.line(`const ${pathVar} = new Path2D(\`${allPathData}\`);`);

        await this.renderFillsWithPath(dims, pathVar);
        this.renderStrokesWithPath(node, dims, pathVar);

        this.builder.line(`ctx.restore();`);
      }
    } else {
      // Fallback: render as rectangle bounding box
      await this.renderFills(dims, this.getShapePath(dims));
      this.renderStrokes(dims, this.getShapePath(dims));
    }

    if (needsSave) {
      this.builder.line(`ctx.restore();`);
    }
  }

  private async renderFillsWithPath(dims: Dimensions, pathVar: string): Promise<void> {
    const node = this.node as any;
    if (!node.fills || !Array.isArray(node.fills)) return;

    const fills = (node.fills as ReadonlyArray<Paint>).filter(
      (f) => f.visible !== false
    );

    const localDims: Dimensions = {
      x: 0,
      y: 0,
      width: dims.width,
      height: dims.height,
      cornerRadius: 0,
    };

    for (const fill of fills) {
      if (fill.type === "IMAGE") continue;

      if (fill.type === "SOLID") {
        const opacity = fill.opacity ?? 1;
        this.builder
          .line(`ctx.fillStyle = ${colorToCSS((fill as SolidPaint).color, opacity)};`)
          .line(`ctx.fill(${pathVar});`);
      } else {
        FillPainter.paint(this.builder, fill, localDims, `ctx.fill(${pathVar});`, this.emitter);
      }
    }
  }

  private renderStrokesWithPath(node: VectorNode, dims: Dimensions, pathVar: string): void {
    const nodeAny = node as any;
    if (!nodeAny.strokes || !Array.isArray(nodeAny.strokes)) return;

    const strokes = (nodeAny.strokes as ReadonlyArray<Paint>).filter(
      (s) => s.visible !== false
    );
    if (strokes.length === 0) return;

    const weight = nodeAny.strokeWeight ?? 1;
    this.builder.line(`ctx.lineWidth = ${r(weight as number)};`);

    const strokeCap = nodeAny.strokeCap;
    const isStringCap = typeof strokeCap === "string";
    const isSimpleArrowCap =
      isStringCap &&
      (strokeCap === "ARROW_LINES" || strokeCap === "ARROW_EQUILATERAL");

    if (isStringCap && strokeCap !== "NONE" && !isSimpleArrowCap) {
      const capMap: Record<string, string> = {
        ROUND: "round",
        SQUARE: "square",
      };
      if (capMap[strokeCap]) {
        this.builder.line(`ctx.lineCap = '${capMap[strokeCap]}';`);
      }
    }

    const strokeJoin = nodeAny.strokeJoin;
    if (typeof strokeJoin === "string") {
      const joinMap: Record<string, string> = {
        ROUND: "round",
        BEVEL: "bevel",
        MITER: "miter",
      };
      if (joinMap[strokeJoin]) {
        this.builder.line(`ctx.lineJoin = '${joinMap[strokeJoin]}';`);
      }
    }

    const arrowInfo = this.detectArrowCaps(nodeAny, isSimpleArrowCap);

    for (const stroke of strokes) {
      if (stroke.type === "SOLID") {
        this.builder
          .line(`ctx.strokeStyle = ${colorToCSS((stroke as SolidPaint).color, stroke.opacity ?? 1)};`)
          .line(`ctx.stroke(${pathVar});`);

        if (arrowInfo) {
          this.renderArrowheads(nodeAny, weight as number, arrowInfo);
        }
      }
    }
  }

  private detectArrowCaps(
    node: any,
    isSimpleArrowCap: boolean
  ): { startCap: string | null; endCap: string | null } | null {
    const ARROW_CAPS = ["ARROW_LINES", "ARROW_EQUILATERAL"];

    if (isSimpleArrowCap) {
      return { startCap: node.strokeCap, endCap: node.strokeCap };
    }

    if (typeof node.strokeCap !== "string") {
      const vn = node.vectorNetwork;
      if (vn && vn.vertices && vn.vertices.length >= 2) {
        const startVtx = vn.vertices[0];
        const endVtx = vn.vertices[vn.vertices.length - 1];
        const startCap = ARROW_CAPS.includes(startVtx.strokeCap)
          ? startVtx.strokeCap
          : null;
        const endCap = ARROW_CAPS.includes(endVtx.strokeCap)
          ? endVtx.strokeCap
          : null;

        if (startCap || endCap) {
          return { startCap, endCap };
        }
      }

      if (node.name && /arrow/i.test(node.name)) {
        return { startCap: null, endCap: "ARROW_LINES" };
      }
    }

    return null;
  }

  private renderArrowheads(
    node: any,
    weight: number,
    arrowInfo: { startCap: string | null; endCap: string | null }
  ): void {
    if (!node.vectorPaths || node.vectorPaths.length === 0) return;

    const pathData = node.vectorPaths[0].data as string;
    if (!pathData) return;

    const coords = pathData.match(/-?[\d.]+/g);
    if (!coords || coords.length < 4) return;

    const arrowSize = Math.max(weight * 4, 8);

    if (arrowInfo.endCap) {
      const endX = parseFloat(coords[coords.length - 2]);
      const endY = parseFloat(coords[coords.length - 1]);
      const prevX = parseFloat(coords[coords.length - 4]);
      const prevY = parseFloat(coords[coords.length - 3]);
      const angle = Math.atan2(endY - prevY, endX - prevX);
      const filled = arrowInfo.endCap === "ARROW_EQUILATERAL";
      this.drawArrowhead(endX, endY, angle, arrowSize, filled);
    }

    if (arrowInfo.startCap) {
      const startX = parseFloat(coords[0]);
      const startY = parseFloat(coords[1]);
      const nextX = parseFloat(coords[2]);
      const nextY = parseFloat(coords[3]);
      const angle = Math.atan2(startY - nextY, startX - nextX);
      const filled = arrowInfo.startCap === "ARROW_EQUILATERAL";
      this.drawArrowhead(startX, startY, angle, arrowSize, filled);
    }
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
