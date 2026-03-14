import { r } from "./math";

/**
 * Figma's gradientTransform is a 2×3 affine matrix [[a, c, e], [b, d, f]].
 *
 * It represents a mapping FROM normalized element space TO gradient space.
 * To get actual handle positions in element space, we INVERT the matrix
 * and multiply by the identity handle positions for each gradient type.
 *
 * Identity handle positions (in gradient space, before any transform):
 *   Linear:         (0, 0.5), (1, 0.5), (0, 1)
 *   Radial/Diamond: (0.5, 0.5), (1, 0.5), (0.5, 1)
 *   Angular:        (0.5, 0.5), (1, 0.5), (0.5, 1)
 */

// ── Matrix helpers ──────────────────────────────────────────────

interface Matrix3x3 {
  m: number[][];
}

/** Convert Figma 2×3 to 3×3 matrix */
function toMatrix3(t: ReadonlyArray<ReadonlyArray<number>>): Matrix3x3 {
  return {
    m: [
      [t[0][0], t[0][1], t[0][2]],
      [t[1][0], t[1][1], t[1][2]],
      [0, 0, 1],
    ],
  };
}

/** Invert a 3×3 matrix */
function invertMatrix3(mat: Matrix3x3): Matrix3x3 {
  const m = mat.m;
  const det =
    m[0][0] * (m[1][1] * m[2][2] - m[1][2] * m[2][1]) -
    m[0][1] * (m[1][0] * m[2][2] - m[1][2] * m[2][0]) +
    m[0][2] * (m[1][0] * m[2][1] - m[1][1] * m[2][0]);

  if (Math.abs(det) < 1e-10) {
    return { m: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] };
  }

  const invDet = 1 / det;
  return {
    m: [
      [
        (m[1][1] * m[2][2] - m[1][2] * m[2][1]) * invDet,
        (m[0][2] * m[2][1] - m[0][1] * m[2][2]) * invDet,
        (m[0][1] * m[1][2] - m[0][2] * m[1][1]) * invDet,
      ],
      [
        (m[1][2] * m[2][0] - m[1][0] * m[2][2]) * invDet,
        (m[0][0] * m[2][2] - m[0][2] * m[2][0]) * invDet,
        (m[0][2] * m[1][0] - m[0][0] * m[1][2]) * invDet,
      ],
      [
        (m[1][0] * m[2][1] - m[1][1] * m[2][0]) * invDet,
        (m[0][1] * m[2][0] - m[0][0] * m[2][1]) * invDet,
        (m[0][0] * m[1][1] - m[0][1] * m[1][0]) * invDet,
      ],
    ],
  };
}

/** Multiply 3×3 matrix by a column vector [x, y, 1] */
function transformPoint(
  mat: Matrix3x3,
  x: number,
  y: number
): { x: number; y: number } {
  const m = mat.m;
  return {
    x: m[0][0] * x + m[0][1] * y + m[0][2],
    y: m[1][0] * x + m[1][1] * y + m[1][2],
  };
}

// ── Gradient converters ─────────────────────────────────────────

/**
 * Convert Figma's gradient transform to handle positions in element pixels.
 * Works by inverting the transform and multiplying by identity handle points.
 */
function getHandlePositions(
  transform: ReadonlyArray<ReadonlyArray<number>>,
  width: number,
  height: number,
  identityPoints: Array<{ x: number; y: number }>
): Array<{ x: number; y: number }> {
  const inv = invertMatrix3(toMatrix3(transform));
  return identityPoints.map((pt) => {
    const p = transformPoint(inv, pt.x, pt.y);
    return { x: p.x * width, y: p.y * height };
  });
}

/**
 * Linear gradient: extract start and end points in element pixels.
 * Identity handles: start (0, 0.5), end (1, 0.5)
 */
export function linearGradientPoints(
  transform: ReadonlyArray<ReadonlyArray<number>>,
  x: number,
  y: number,
  width: number,
  height: number
): { x0: number; y0: number; x1: number; y1: number } {
  const handles = getHandlePositions(transform, width, height, [
    { x: 0, y: 0.5 },
    { x: 1, y: 0.5 },
  ]);

  return {
    x0: r(handles[0].x + x),
    y0: r(handles[0].y + y),
    x1: r(handles[1].x + x),
    y1: r(handles[1].y + y),
  };
}

/**
 * Radial gradient: extract center, radii, and rotation in element pixels.
 * Identity handles: center (0.5, 0.5), radiusX (1, 0.5), radiusY (0.5, 1)
 */
export function radialGradientParams(
  transform: ReadonlyArray<ReadonlyArray<number>>,
  width: number,
  height: number
): {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
} {
  const handles = getHandlePositions(transform, width, height, [
    { x: 0.5, y: 0.5 }, // center
    { x: 1, y: 0.5 },   // radiusX handle
    { x: 0.5, y: 1 },   // radiusY handle
  ]);

  const [center, rxPt, ryPt] = handles;
  const rx = Math.sqrt(
    (rxPt.x - center.x) ** 2 + (rxPt.y - center.y) ** 2
  );
  const ry = Math.sqrt(
    (ryPt.x - center.x) ** 2 + (ryPt.y - center.y) ** 2
  );
  const angle = Math.atan2(rxPt.y - center.y, rxPt.x - center.x);

  return { cx: center.x, cy: center.y, rx, ry, angle };
}

/**
 * Angular (conic) gradient: extract center and start angle.
 * Identity handles: center (0.5, 0.5), end (1, 0.5)
 *
 * The "end" handle defines the direction of gradient position 0.
 * Canvas createConicGradient measures startAngle from the positive x-axis.
 */
export function angularGradientParams(
  transform: ReadonlyArray<ReadonlyArray<number>>,
  width: number,
  height: number
): { cx: number; cy: number; angle: number } {
  const handles = getHandlePositions(transform, width, height, [
    { x: 0.5, y: 0.5 }, // center
    { x: 1, y: 0.5 },   // end handle (gradient position 0 direction)
  ]);

  const [center, endPt] = handles;
  // The angle from center to end handle gives the start direction.
  const angle = Math.atan2(endPt.y - center.y, endPt.x - center.x);

  return { cx: center.x, cy: center.y, angle };
}

/**
 * Diamond gradient: extract center, radii, and rotation.
 * Same identity handles as radial: center (0.5, 0.5), rx (1, 0.5), ry (0.5, 1)
 */
export function diamondGradientParams(
  transform: ReadonlyArray<ReadonlyArray<number>>,
  width: number,
  height: number
): {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  angle: number;
} {
  // Same geometry as radial
  return radialGradientParams(transform, width, height);
}

