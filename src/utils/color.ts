/** Convert a 0-1 channel value to a 2-digit hex string */
function channelToHex(c: number): string {
  return Math.round(c * 255)
    .toString(16)
    .padStart(2, "0");
}

/** Convert Figma RGB color to hex string (e.g. "#ff0000") */
export function rgbToHex(color: RGB | RGBA): string {
  return `#${channelToHex(color.r)}${channelToHex(color.g)}${channelToHex(color.b)}`;
}

/**
 * Convert hex color + opacity to an rgba() or hex string.
 * Returns hex if fully opaque, otherwise rgba().
 */
export function colorToCSS(color: RGB | RGBA, opacity = 1): string {
  const hex = rgbToHex(color);
  const finalOpacity = "a" in color ? color.a * opacity : opacity;

  if (finalOpacity >= 1) {
    return `'${hex}'`;
  }

  const rVal = parseInt(hex.slice(1, 3), 16);
  const gVal = parseInt(hex.slice(3, 5), 16);
  const bVal = parseInt(hex.slice(5, 7), 16);
  return `'rgba(${rVal}, ${gVal}, ${bVal}, ${r(finalOpacity)})'`;
}

/** Round helper (re-export for convenience) */
function r(v: number): number {
  return Math.round(v * 1000) / 1000;
}
