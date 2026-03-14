import { BaseRenderer } from "./BaseRenderer";
import { Dimensions, Offset } from "../core/types";
import { r } from "../utils/math";

/**
 * Renders FRAME, COMPONENT, and INSTANCE nodes.
 * These are containers that can have their own fills/strokes,
 * clipping, and recursive children.
 */
export class FrameRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as FrameNode;
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

  protected async renderChildren(dims: Dimensions): Promise<void> {
    const node = this.node as FrameNode;
    if (!("children" in node) || node.children.length === 0) return;

    const clipsContent = node.clipsContent;

    if (clipsContent) {
      this.builder
        .line(`ctx.save();`)
        .line(`ctx.beginPath();`)
        .line(this.getShapePath(dims))
        .line(`ctx.clip();`);
    }

    // Children are positioned relative to the frame
    const childOffset: Offset = { x: dims.x, y: dims.y };

    for (const child of node.children) {
      await this.generator.renderNode(child, this.builder, childOffset);
    }

    if (clipsContent) {
      this.builder.line(`ctx.restore();`);
    }
  }
}
