import { BaseRenderer } from "./BaseRenderer";
import { Dimensions } from "../core/types";
import { r } from "../utils/math";
import { colorToCSS } from "../utils/color";
import { isRTL, fontWeightToCSS, escapeString } from "../utils/text";

/**
 * Renders TEXT nodes.
 * Handles font family, size, weight, alignment, RTL, and multi-segment text.
 */
export class TextRenderer extends BaseRenderer {
  protected getDimensions(): Dimensions {
    const pos = this.getAbsolutePosition();
    const node = this.node as TextNode;
    return {
      x: pos.x,
      y: pos.y,
      width: r(node.width),
      height: r(node.height),
      cornerRadius: 0,
    };
  }

  protected getShapePath(): string {
    return ""; // Text doesn't use shape paths
  }

  async render(): Promise<void> {
    if (!this.node.visible) return;

    const node = this.node as TextNode;
    const dims = this.getDimensions();
    const needsTransform = this.hasRotation();

    this.builder.blank().comment(`TEXT: "${node.name}"`);

    if (needsTransform || this.hasOpacity()) {
      this.builder.line(`ctx.save();`);
      if (needsTransform) this.applyRotation(dims);
      if (this.hasOpacity()) this.applyOpacity();
    }

    // Get text segments for styled ranges, or fallback to single text
    const segments = this.getTextSegments(node);

    for (const segment of segments) {
      this.renderSegment(segment, dims, node);
    }

    if (needsTransform || this.hasOpacity()) {
      this.builder.line(`ctx.restore();`);
    }
  }

  private renderSegment(
    segment: TextSegment,
    dims: Dimensions,
    node: TextNode
  ): void {
    const { text, fontFamily, fontSize, fontWeight, color, opacity } = segment;

    // Text alignment
    const align = this.getTextAlign(node);
    let textX = dims.x;
    if (align === "center") textX = dims.x + dims.width / 2;
    else if (align === "right") textX = dims.x + dims.width;

    // Text Y position (baseline at bottom of element)
    const textY = r(dims.y + dims.height - 5);

    // RTL detection
    if (isRTL(text)) {
      this.builder.line(`ctx.direction = 'rtl';`);
    }

    const escaped = escapeString(text);
    const weight = fontWeightToCSS(fontWeight);

    this.builder
      .line(`ctx.fillStyle = ${colorToCSS(color, opacity)};`)
      .line(`ctx.textAlign = '${align}';`)
      .line(`ctx.textBaseline = 'bottom';`)
      .line(`ctx.font = '${weight} ${r(fontSize)}px ${fontFamily}';`)
      .line(`ctx.fillText(\`${escaped}\`, ${r(textX)}, ${textY});`);

    if (isRTL(text)) {
      this.builder.line(`ctx.direction = 'ltr';`);
    }
  }

  private getTextAlign(node: TextNode): string {
    const align = node.textAlignHorizontal;
    switch (align) {
      case "CENTER":
        return "center";
      case "RIGHT":
        return "right";
      case "JUSTIFIED":
        return "justify";
      default:
        return "left";
    }
  }

  private getTextSegments(node: TextNode): TextSegment[] {
    // If font properties are mixed, try to get segments
    const fontName = node.fontName;
    const fontSize = node.fontSize;

    if (fontName === figma.mixed || fontSize === figma.mixed) {
      return this.getMixedSegments(node);
    }

    const fill = Array.isArray(node.fills) ? node.fills[0] : undefined;
    const color =
      fill && fill.type === "SOLID" ? (fill as SolidPaint).color : { r: 0, g: 0, b: 0 };
    const opacity = fill ? fill.opacity ?? 1 : 1;

    return [
      {
        text: node.characters,
        fontFamily: (fontName as FontName).family,
        fontSize: fontSize as number,
        fontWeight: (fontName as FontName).style,
        color,
        opacity,
      },
    ];
  }

  private getMixedSegments(node: TextNode): TextSegment[] {
    const segments: TextSegment[] = [];
    const len = node.characters.length;

    let i = 0;
    while (i < len) {
      const fontName = node.getRangeFontName(i, i + 1) as FontName;
      const fontSize = node.getRangeFontSize(i, i + 1) as number;
      const fills = node.getRangeFills(i, i + 1) as Paint[];
      const fill = fills?.[0];
      const color =
        fill && fill.type === "SOLID"
          ? (fill as SolidPaint).color
          : { r: 0, g: 0, b: 0 };
      const opacity = fill ? fill.opacity ?? 1 : 1;

      // Find the extent of this style run
      let j = i + 1;
      while (j < len) {
        const nextFont = node.getRangeFontName(j, j + 1) as FontName;
        const nextSize = node.getRangeFontSize(j, j + 1) as number;
        if (
          nextFont.family !== fontName.family ||
          nextFont.style !== fontName.style ||
          nextSize !== fontSize
        ) {
          break;
        }
        j++;
      }

      segments.push({
        text: node.characters.slice(i, j),
        fontFamily: fontName.family,
        fontSize,
        fontWeight: fontName.style,
        color,
        opacity,
      });

      i = j;
    }

    return segments;
  }
}

interface TextSegment {
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  color: RGB;
  opacity: number;
}
