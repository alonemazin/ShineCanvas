import { CodeBuilder } from "../core/CodeBuilder";
import { colorToCSS } from "../utils/color";
import { r } from "../utils/math";

/**
 * Generates canvas code for Figma effects (shadows, blur).
 */
export class EffectPainter {
  /** Apply drop shadow before the fill/stroke */
  static dropShadow(builder: CodeBuilder, effect: DropShadowEffect): void {
    if (!effect.visible) return;

    builder
      .line(`ctx.shadowColor = ${colorToCSS(effect.color, effect.color.a)};`)
      .line(`ctx.shadowBlur = ${r(effect.radius)};`)
      .line(`ctx.shadowOffsetX = ${r(effect.offset.x)};`)
      .line(`ctx.shadowOffsetY = ${r(effect.offset.y)};`);
  }

  /** Reset shadow properties after drawing */
  static resetShadow(builder: CodeBuilder): void {
    builder
      .line(`ctx.shadowColor = 'transparent';`)
      .line(`ctx.shadowBlur = 0;`)
      .line(`ctx.shadowOffsetX = 0;`)
      .line(`ctx.shadowOffsetY = 0;`);
  }

  /** Apply layer blur using canvas filter */
  static blur(builder: CodeBuilder, effect: BlurEffect): void {
    if (!effect.visible) return;
    builder.line(`ctx.filter = 'blur(${r(effect.radius)}px)';`);
  }

  /** Reset filter after drawing */
  static resetFilter(builder: CodeBuilder): void {
    builder.line(`ctx.filter = 'none';`);
  }

  /**
   * Emit all effects for a node. Returns whether state was modified
   * (so the caller knows to reset).
   */
  static applyEffects(
    builder: CodeBuilder,
    effects: ReadonlyArray<Effect>
  ): { hasShadow: boolean; hasBlur: boolean } {
    let hasShadow = false;
    let hasBlur = false;

    for (const effect of effects) {
      if (!effect.visible) continue;

      switch (effect.type) {
        case "DROP_SHADOW":
          EffectPainter.dropShadow(builder, effect as DropShadowEffect);
          hasShadow = true;
          break;
        case "LAYER_BLUR":
          EffectPainter.blur(builder, effect as BlurEffect);
          hasBlur = true;
          break;
        // INNER_SHADOW and BACKGROUND_BLUR are more complex — future phase
      }
    }

    return { hasShadow, hasBlur };
  }

  /** Reset any applied effects */
  static resetEffects(
    builder: CodeBuilder,
    state: { hasShadow: boolean; hasBlur: boolean }
  ): void {
    if (state.hasShadow) EffectPainter.resetShadow(builder);
    if (state.hasBlur) EffectPainter.resetFilter(builder);
  }
}
