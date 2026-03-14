/** Round to 2 decimal places for cleaner output */
export function r(v: number): number {
  return Math.round(v * 100) / 100;
}

/** Round to 6 decimal places — used for angles and transform values */
export function rp(v: number): number {
  return Math.round(v * 1000000) / 1000000;
}

/** Convert degrees to radians */
export function degToRad(degrees: number): number {
  return (degrees * Math.PI) / 180;
}

/** Extract position from relativeTransform matrix (handles rotation) */
export function getPositionFromTransform(transform: Transform): {
  x: number;
  y: number;
} {
  return {
    x: transform[0][2],
    y: transform[1][2],
  };
}

/**
 * Get element position, accounting for rotation.
 * When rotated, Figma's x/y differ from the transform translation.
 */
export function getElementPosition(
  node: SceneNode & { relativeTransform: Transform }
): { x: number; y: number } {
  if ("rotation" in node && node.rotation !== 0) {
    return getPositionFromTransform(node.relativeTransform);
  }
  return { x: node.x, y: node.y };
}
