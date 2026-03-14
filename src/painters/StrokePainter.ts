import { CodeBuilder } from "../core/CodeBuilder";
import { Dimensions } from "../core/types";
import { colorToCSS } from "../utils/color";
import { linearGradientPoints } from "../utils/gradient";
import { r } from "../utils/math";

let strokeGradCounter = 0;
export function resetStrokeGradCounter() { strokeGradCounter = 0; }

export class StrokePainter {
  static adjustDimensions(
    dims: Dimensions,
    weight: number,
    alignment: string
  ): Dimensions {
    const half = weight / 2;
    switch (alignment) {
      case "INSIDE":
        return {
          x: dims.x + half,
          y: dims.y + half,
          width: dims.width - weight,
          height: dims.height - weight,
          cornerRadius: dims.cornerRadius,
        };
      case "OUTSIDE":
        return {
          x: dims.x - half,
          y: dims.y - half,
          width: dims.width + weight,
          height: dims.height + weight,
          cornerRadius: dims.cornerRadius,
        };
      default:
        return dims;
    }
  }

  /** Emit stroke code for a single paint */
  static paint(
    builder: CodeBuilder,
    paint: Paint,
    dims: Dimensions,
    shapePath: string,
    weight: number,
    alignment: string
  ): void {
    if (!paint.visible) return;

    const adjustedDims = StrokePainter.adjustDimensions(dims, weight, alignment);
    const opacity = paint.opacity ?? 1;

    switch (paint.type) {
      case "SOLID":
        StrokePainter.solid(
          builder,
          paint as SolidPaint,
          shapePath,
          weight,
          opacity
        );
        break;
      case "GRADIENT_LINEAR":
        StrokePainter.linearGradient(
          builder,
          paint as GradientPaint,
          adjustedDims,
          shapePath,
          weight,
          opacity
        );
        break;
    }
  }

  static solid(
    builder: CodeBuilder,
    paint: SolidPaint,
    shapePath: string,
    weight: number,
    opacity: number
  ): void {
    builder
      .line(`ctx.strokeStyle = ${colorToCSS(paint.color, opacity)};`)
      .line(`ctx.lineWidth = ${r(weight)};`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.stroke();`);
  }

  static linearGradient(
    builder: CodeBuilder,
    paint: GradientPaint,
    dims: Dimensions,
    shapePath: string,
    weight: number,
    opacity: number
  ): void {
    const { x, y, width, height } = dims;
    const transform = paint.gradientTransform;
    const { x0, y0, x1, y1 } = linearGradientPoints(
      transform,
      x,
      y,
      width,
      height
    );

    const sg = `strokeGrad${strokeGradCounter++}`;
    builder.line(
      `const ${sg} = ctx.createLinearGradient(${x0}, ${y0}, ${x1}, ${y1});`
    );

    for (const stop of paint.gradientStops) {
      const color = colorToCSS(stop.color, opacity * (stop.color.a ?? 1));
      builder.line(
        `${sg}.addColorStop(${r(stop.position)}, ${color});`
      );
    }

    builder
      .line(`ctx.strokeStyle = ${sg};`)
      .line(`ctx.lineWidth = ${r(weight)};`)
      .line(`ctx.beginPath();`)
      .lines(shapePath.split("\n"))
      .line(`ctx.stroke();`);
  }
}
