const BASE64_CHARS =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

/** Encode a Uint8Array to a base64 string */
export function uint8ArrayToBase64(bytes: Uint8Array): string {
  let result = "";
  const len = bytes.length;

  for (let i = 0; i < len; i += 3) {
    const b0 = bytes[i];
    const b1 = i + 1 < len ? bytes[i + 1] : 0;
    const b2 = i + 2 < len ? bytes[i + 2] : 0;

    result += BASE64_CHARS[(b0 >> 2) & 0x3f];
    result += BASE64_CHARS[((b0 << 4) | (b1 >> 4)) & 0x3f];
    result += i + 1 < len ? BASE64_CHARS[((b1 << 2) | (b2 >> 6)) & 0x3f] : "=";
    result += i + 2 < len ? BASE64_CHARS[b2 & 0x3f] : "=";
  }

  return result;
}

/**
 * Get base64 data URI from a Figma image hash.
 * Must be called from the plugin sandbox (has access to figma API).
 */
export async function getImageBase64(imageHash: string): Promise<string> {
  const image = figma.getImageByHash(imageHash);
  if (!image) throw new Error(`Image not found: ${imageHash}`);

  const bytes = await image.getBytesAsync();
  const base64 = uint8ArrayToBase64(bytes);
  return `data:image/png;base64,${base64}`;
}
