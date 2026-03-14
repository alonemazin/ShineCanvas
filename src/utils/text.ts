/**
 * RTL Unicode ranges for bidirectional text detection.
 * Covers Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan, Mandaic.
 */
const RTL_RANGES = [
  [0x0590, 0x05ff], // Hebrew
  [0x0600, 0x06ff], // Arabic
  [0x0700, 0x074f], // Syriac
  [0x0780, 0x07bf], // Thaana
  [0x07c0, 0x07ff], // NKo
  [0x0800, 0x083f], // Samaritan
  [0x0840, 0x085f], // Mandaic
  [0xfb50, 0xfdff], // Arabic Presentation Forms-A
  [0xfe70, 0xfeff], // Arabic Presentation Forms-B
] as const;

/** Check if text contains RTL characters */
export function isRTL(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    for (const [start, end] of RTL_RANGES) {
      if (code >= start && code <= end) return true;
    }
  }
  return false;
}

/** Map Figma font weight names to CSS numeric values */
export function fontWeightToCSS(
  style: string
): string {
  const lower = style.toLowerCase();
  if (lower.includes("thin")) return "100";
  if (lower.includes("extralight") || lower.includes("ultralight")) return "200";
  if (lower.includes("light")) return "300";
  if (lower.includes("regular") || lower.includes("normal")) return "400";
  if (lower.includes("medium")) return "500";
  if (lower.includes("semibold") || lower.includes("demibold")) return "600";
  if (lower.includes("extrabold") || lower.includes("ultrabold")) return "800";
  if (lower.includes("bold")) return "700";
  if (lower.includes("black") || lower.includes("heavy")) return "900";
  return "400";
}

/** Escape backticks and dollar signs for safe template literal embedding */
export function escapeString(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$");
}
