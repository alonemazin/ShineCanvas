import { BaseRenderer } from "./BaseRenderer";
import { Dimensions, Offset } from "../core/types";

/**
 * Renders GROUP nodes.
 * Groups have no visual properties of their own — they only
 * serve as containers for their children.
 */
export class GroupRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    return {
      x: pos.x,
      y: pos.y,
      width: 0,
      height: 0,
      cornerRadius: 0,
    };
  }

  protected getShapePath(): string {
    return "";
  }

  async render(): Promise<void> {
    if (!this.node.visible) return;

    const node = this.node as GroupNode;
    const needsSave = this.hasOpacity() || this.hasBlendMode();

    this.builder.blank().comment(`GROUP: "${this.node.name}"`);

    if (needsSave) {
      this.builder.line(`ctx.save();`);
      if (this.hasOpacity()) this.applyOpacity();
      if (this.hasBlendMode()) this.applyBlendMode();
    }

    // Render children with the same offset (groups don't add position offset)
    for (const child of node.children) {
      await this.generator.renderNode(child, this.builder, this.offset);
    }

    if (needsSave) {
      this.builder.line(`ctx.restore();`);
    }
  }
}
