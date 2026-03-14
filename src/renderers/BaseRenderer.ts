import { CodeBuilder } from "../core/CodeBuilder";
import { Dimensions, Offset } from "../core/types";
import { FillPainter } from "../painters/FillPainter";
import { StrokePainter } from "../painters/StrokePainter";
import { EffectPainter } from "../painters/EffectPainter";
import { r, getElementPosition, degToRad } from "../utils/math";
import { getImageBase64 } from "../utils/image";
import { Emitter } from "../emitters/Emitter";
import type { CanvasCodeGenerator } from "../core/CanvasCodeGenerator";

let globalImgCounter = 0;
export function resetImgCounter() { globalImgCounter = 0; }

const PLACEHOLDER_IMAGE =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAIAAACQkWg2AAAAHUlEQVR4nGOYiQOcwQEYRjXQRAMuCVwGjWqgiQYALxwXnxai3sIAAAAASUVORK5CYII=";

export abstract class BaseRenderer {
  protected node: SceneNode;
  protected builder: CodeBuilder;
  protected generator: CanvasCodeGenerator;
  protected offset: Offset;
  protected emitter: Emitter;

  constructor(
    node: SceneNode,
    builder: CodeBuilder,
    generator: CanvasCodeGenerator,
    offset: Offset,
    emitter: Emitter
  ) {
    this.node = node;
    this.builder = builder;
    this.generator = generator;
    this.offset = offset;
    this.emitter = emitter;
  }

  async render(): Promise<void> {
    if (!this.node.visible) return;

    const dims = this.getDimensions();
    const shapePath = this.getShapePath(dims);
    const needsTransform = this.hasRotation();
    const hasEffects = this.hasEffects();
    const needsSave = needsTransform || hasEffects || this.hasOpacity();

    this.builder.blank().comment(`${this.node.type}: "${this.node.name}"`);

    if (needsSave) {
      this.builder.line(`ctx.save();`);
    }

    if (needsTransform) this.applyRotation(dims);
    if (this.hasOpacity()) this.applyOpacity();

    let effectState = { hasShadow: false, hasBlur: false };
    if (hasEffects) {
      effectState = EffectPainter.applyEffects(
        this.builder,
        (this.node as any).effects
      );
    }

    if (this.hasBlendMode()) this.applyBlendMode();

    await this.renderFills(dims, shapePath);

    // Reset effects after fills — shadows shouldn't apply to strokes
    if (effectState.hasShadow || effectState.hasBlur) {
      EffectPainter.resetEffects(this.builder, effectState);
    }

    this.renderStrokes(dims, shapePath);
    await this.renderChildren(dims);

    if (needsSave) {
      this.builder.line(`ctx.restore();`);
    }
  }

  protected abstract getShapePath(dims: Dimensions): string;
  protected abstract getDimensions(): Dimensions;
  protected async renderChildren(_dims: Dimensions): Promise<void> {}

  protected hasRotation(): boolean {
    return "rotation" in this.node && (this.node as any).rotation !== 0;
  }

  protected hasEffects(): boolean {
    return (
      "effects" in this.node &&
      Array.isArray((this.node as any).effects) &&
      (this.node as any).effects.length > 0
    );
  }

  protected hasOpacity(): boolean {
    return "opacity" in this.node && (this.node as any).opacity < 1;
  }

  protected hasBlendMode(): boolean {
    return (
      "blendMode" in this.node &&
      (this.node as any).blendMode !== "NORMAL" &&
      (this.node as any).blendMode !== "PASS_THROUGH"
    );
  }

  protected applyRotation(dims: Dimensions): void {
    const angle = (this.node as any).rotation as number;
    const cx = r(dims.x + dims.width / 2);
    const cy = r(dims.y + dims.height / 2);
    const rad = r(degToRad(-angle)); // Figma uses counter-clockwise

    this.builder
      .line(`ctx.translate(${cx}, ${cy});`)
      .line(`ctx.rotate(${rad});`)
      .line(`ctx.translate(${-cx}, ${-cy});`);
  }

  protected applyOpacity(): void {
    const opacity = (this.node as any).opacity as number;
    this.builder.line(`ctx.globalAlpha = ${r(opacity)};`);
  }

  protected applyBlendMode(): void {
    const blendMode = (this.node as any).blendMode as string;
    const canvasBlend = figmaBlendToCanvas(blendMode);
    if (canvasBlend) {
      this.builder.line(`ctx.globalCompositeOperation = '${canvasBlend}';`);
    }
  }

  protected async renderFills(
    dims: Dimensions,
    shapePath: string
  ): Promise<void> {
    const node = this.node as any;
    if (!node.fills || !Array.isArray(node.fills)) return;

    const fills = (node.fills as ReadonlyArray<Paint>).filter(
      (f) => f.visible !== false
    );

    for (const fill of fills) {
      if (fill.type === "IMAGE" && "imageHash" in fill) {
        const hash = (fill as any).imageHash as string;
        if (hash) {
          const base64 = await this.resolveImageBase64(hash);
          const varName = `img_${this.node.name.replace(/\W/g, "_")}_${globalImgCounter++}`;
          await FillPainter.image(
            this.builder,
            fill,
            dims,
            shapePath,
            base64,
            varName,
            this.emitter
          );
        }
      } else {
        FillPainter.paint(this.builder, fill, dims, shapePath, this.emitter);
      }
    }
  }

  protected renderStrokes(dims: Dimensions, shapePath: string): void {
    const node = this.node as any;
    if (!node.strokes || !Array.isArray(node.strokes)) return;

    const strokes = (node.strokes as ReadonlyArray<Paint>).filter(
      (s) => s.visible !== false
    );
    if (strokes.length === 0) return;

    const weight = node.strokeWeight ?? 1;
    const alignment = node.strokeAlign ?? "CENTER";

    for (const stroke of strokes) {
      StrokePainter.paint(
        this.builder,
        stroke,
        dims,
        shapePath,
        weight,
        alignment
      );
    }
  }

  private async resolveImageBase64(hash: string): Promise<string> {
    const opts = this.generator.options;
    if (opts.usePlaceholderImages) return PLACEHOLDER_IMAGE;

    if (opts.imageSizeLimitKB > 0) {
      const image = figma.getImageByHash(hash);
      if (image) {
        const bytes = await image.getBytesAsync();
        const sizeKB = bytes.length / 1024;
        if (sizeKB > opts.imageSizeLimitKB) return PLACEHOLDER_IMAGE;
      }
    }

    return getImageBase64(hash);
  }

  protected getAbsolutePosition(): { x: number; y: number } {
    const pos = getElementPosition(this.node as any);
    return {
      x: r(pos.x + this.offset.x),
      y: r(pos.y + this.offset.y),
    };
  }

  protected getCornerRadius(): number | number[] {
    const node = this.node as any;
    if ("cornerRadius" in node && node.cornerRadius !== figma.mixed) {
      return node.cornerRadius ?? 0;
    }
    if (
      "topLeftRadius" in node &&
      "topRightRadius" in node &&
      "bottomRightRadius" in node &&
      "bottomLeftRadius" in node
    ) {
      return [
        node.topLeftRadius ?? 0,
        node.topRightRadius ?? 0,
        node.bottomRightRadius ?? 0,
        node.bottomLeftRadius ?? 0,
      ];
    }
    return 0;
  }
}

function figmaBlendToCanvas(mode: string): string | null {
  const map: Record<string, string> = {
    MULTIPLY: "multiply",
    SCREEN: "screen",
    OVERLAY: "overlay",
    DARKEN: "darken",
    LIGHTEN: "lighten",
    COLOR_DODGE: "color-dodge",
    COLOR_BURN: "color-burn",
    HARD_LIGHT: "hard-light",
    SOFT_LIGHT: "soft-light",
    DIFFERENCE: "difference",
    EXCLUSION: "exclusion",
    HUE: "hue",
    SATURATION: "saturation",
    COLOR: "color",
    LUMINOSITY: "luminosity",
  };
  return map[mode] ?? null;
}
