import { CodeBuilder } from "../core/CodeBuilder";
import { Dimensions } from "../core/types";
import { colorToCSS } from "../utils/color";
import {
  linearGradientPoints,
  radialGradientParams,
  angularGradientParams,
  diamondGradientParams,
} from "../utils/gradient";
import { r, rp } from "../utils/math";
import { Emitter } from "../emitters/Emitter";

let gradCounter = 0;
export function resetGradCounter() { gradCounter = 0; }

export class FillPainter {
  static paint(
    builder: CodeBuilder,
    paint: Paint,
    dims: Dimensions,
    shapePath: string,
    emitter: Emitter
  ): void {
    if (!paint.visible) return;

    const opacity = paint.opacity ?? 1;

    switch (paint.type) {
      case "SOLID":
        FillPainter.solid(builder, paint as SolidPaint, dims, shapePath, opacity);
        break;
      case "GRADIENT_LINEAR":
        FillPainter.linearGradient(
          builder, paint as GradientPaint, dims, shapePath, opacity
        );
        break;
      case "GRADIENT_RADIAL":
        FillPainter.radialGradient(
          builder, paint as GradientPaint, dims, shapePath, opacity
        );
        break;
      case "GRADIENT_ANGULAR":
        FillPainter.angularGradient(
          builder, paint as GradientPaint, dims, shapePath, opacity
        );
        break;
      case "GRADIENT_DIAMOND":
        FillPainter.diamondGradient(
          builder, paint as GradientPaint, dims, shapePath, opacity
        );
        break;
      case "IMAGE":
        break;
    }
  }

  static solid(
    builder: CodeBuilder,
    paint: SolidPaint,
    dims: Dimensions,
    shapePath: string,
    opacity: number
  ): void {
    builder
      .line(`ctx.fillStyle = ${colorToCSS(paint.color, opacity)};`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.fill();`);
  }

  static linearGradient(
    builder: CodeBuilder,
    paint: GradientPaint,
    dims: Dimensions,
    shapePath: string,
    opacity: number
  ): void {
    const { x, y, width, height } = dims;
    const { x0, y0, x1, y1 } = linearGradientPoints(
      paint.gradientTransform, x, y, width, height
    );

    const gv = `grad${gradCounter++}`;
    builder.line(
      `const ${gv} = ctx.createLinearGradient(${x0}, ${y0}, ${x1}, ${y1});`
    );

    for (const stop of paint.gradientStops) {
      const color = colorToCSS(stop.color, opacity * (stop.color.a ?? 1));
      builder.line(`${gv}.addColorStop(${r(stop.position)}, ${color});`);
    }

    builder
      .line(`ctx.fillStyle = ${gv};`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.fill();`);
  }

  /** Clip + translate/rotate/scale to emulate elliptical radial gradients via unit circle */
  static radialGradient(
    builder: CodeBuilder,
    paint: GradientPaint,
    dims: Dimensions,
    shapePath: string,
    opacity: number
  ): void {
    const { x, y, width, height } = dims;
    const { cx, cy, rx, ry, angle } = radialGradientParams(
      paint.gradientTransform, width, height
    );

    builder
      .line(`ctx.save();`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.clip();`);

    builder
      .line(`ctx.translate(${rp(cx + x)}, ${rp(cy + y)});`)
      .line(`ctx.rotate(${rp(angle)});`)
      .line(`ctx.scale(${rp(rx)}, ${rp(ry)});`);

    const gvr = `grad${gradCounter++}`;
    builder.line(
      `const ${gvr} = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);`
    );

    for (const stop of paint.gradientStops) {
      const color = colorToCSS(stop.color, opacity * (stop.color.a ?? 1));
      builder.line(`${gvr}.addColorStop(${r(stop.position)}, ${color});`);
    }

    builder
      .line(`ctx.fillStyle = ${gvr};`)
      .line(`ctx.fillRect(-1, -1, 2, 2);`)
      .line(`ctx.restore();`);
  }

  static angularGradient(
    builder: CodeBuilder,
    paint: GradientPaint,
    dims: Dimensions,
    shapePath: string,
    opacity: number
  ): void {
    const { x, y, width, height } = dims;
    const { cx, cy, angle } = angularGradientParams(
      paint.gradientTransform, width, height
    );

    const gvc = `grad${gradCounter++}`;
    builder.line(
      `const ${gvc} = ctx.createConicGradient(${rp(angle)}, ${rp(cx + x)}, ${rp(cy + y)});`
    );

    for (const stop of paint.gradientStops) {
      const color = colorToCSS(stop.color, opacity * (stop.color.a ?? 1));
      builder.line(`${gvc}.addColorStop(${r(stop.position)}, ${color});`);
    }

    builder
      .line(`ctx.fillStyle = ${gvc};`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.fill();`);
  }

  /** Decompose diamond gradient into 4 triangular quadrants with linear gradients */
  static diamondGradient(
    builder: CodeBuilder,
    paint: GradientPaint,
    dims: Dimensions,
    shapePath: string,
    opacity: number
  ): void {
    const { x, y, width, height } = dims;
    const { cx, cy, rx, ry, angle } = diamondGradientParams(
      paint.gradientTransform, width, height
    );

    builder
      .line(`ctx.save();`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.clip();`);

    builder
      .line(`ctx.translate(${rp(cx + x)}, ${rp(cy + y)});`)
      .line(`ctx.rotate(${rp(angle)});`)
      .line(`ctx.scale(${rp(rx)}, ${rp(ry)});`);

    const stopEntries: string[] = [];
    for (const stop of paint.gradientStops) {
      const color = colorToCSS(stop.color, opacity * (stop.color.a ?? 1));
      stopEntries.push(`[${r(stop.position)}, ${color}]`);
    }

    const quadrants: Array<{
      verts: [number, number][];
      end: [number, number];
    }> = [
      { verts: [[0, 0], [2, 0], [0, -2]], end: [0.5, -0.5] },   // top-right
      { verts: [[0, 0], [0, 2], [2, 0]], end: [0.5, 0.5] },     // bottom-right
      { verts: [[0, 0], [-2, 0], [0, 2]], end: [-0.5, 0.5] },   // bottom-left
      { verts: [[0, 0], [0, -2], [-2, 0]], end: [-0.5, -0.5] }, // top-left
    ];

    for (const q of quadrants) {
      builder.line(`ctx.save();`);
      builder.line(`ctx.beginPath();`);
      builder.line(
        `ctx.moveTo(${q.verts[0][0]}, ${q.verts[0][1]});`
      );
      builder.line(
        `ctx.lineTo(${q.verts[1][0]}, ${q.verts[1][1]});`
      );
      builder.line(
        `ctx.lineTo(${q.verts[2][0]}, ${q.verts[2][1]});`
      );
      builder.line(`ctx.closePath();`);
      builder.line(`ctx.clip();`);

      const gvd = `grad${gradCounter++}`;
      builder.line(
        `const ${gvd} = ctx.createLinearGradient(0, 0, ${q.end[0]}, ${q.end[1]});`
      );

      for (const entry of stopEntries) {
        builder.line(`${gvd}.addColorStop(${entry.slice(1, -1)});`);
      }

      builder
        .line(`ctx.fillStyle = ${gvd};`)
        .line(`ctx.fillRect(-2, -2, 4, 4);`)
        .line(`ctx.restore();`);
    }

    builder.line(`ctx.restore();`);
  }

  static async image(
    builder: CodeBuilder,
    paint: Paint,
    dims: Dimensions,
    shapePath: string,
    imageBase64: string,
    varName: string,
    emitter: Emitter
  ): Promise<void> {
    const { x, y, width, height, cornerRadius } = dims;
    const hasRadius =
      cornerRadius !== 0 &&
      !(Array.isArray(cornerRadius) && cornerRadius.every((r) => r === 0));

    emitter.emitImageLoad(builder, varName, imageBase64);
    builder.indent();

    if (hasRadius) {
      builder
        .line(`ctx.save();`)
        .line(`ctx.beginPath();`)
        .lines(shapePath.split("\n"))
        .line(`ctx.clip();`);
    }

    builder.line(
      `ctx.drawImage(${varName}, ${r(x)}, ${r(y)}, ${r(width)}, ${r(height)});`
    );

    if (hasRadius) {
      builder.line(`ctx.restore();`);
    }

    if (!emitter.isAsync) {
      builder.dedent().line(`};`);
    } else {
      builder.dedent();
    }
  }
}
