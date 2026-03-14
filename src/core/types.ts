export type CanvasType = "html" | "node";

export interface Dimensions {
  x: number;
  y: number;
  width: number;
  height: number;
  cornerRadius: number | number[];
}

export interface Offset {
  x: number;
  y: number;
}

export interface NodeInfo {
  id: string;
  name: string;
  type: string;
  width: number;
  height: number;
}

export interface GenerateOptions {
  usePlaceholderImages: boolean;
  /** 0 = no limit. Images larger than this use the placeholder instead. */
  imageSizeLimitKB: number;
}

export type PluginMessage =
  | { type: "generate"; nodeId: string; canvasType: CanvasType; options?: GenerateOptions }
  | { type: "generate-preview"; nodeId: string; options?: GenerateOptions }
  | { type: "get-selection" }
  | { type: "get-setting"; key: string }
  | { type: "save-setting"; key: string; value: unknown };

export type UIMessage =
  | { type: "generated-code"; code: string; canvasType: CanvasType; nodeId: string }
  | { type: "preview-code"; code: string }
  | { type: "selection-changed"; node: NodeInfo | null }
  | { type: "generating" }
  | { type: "setting-value"; key: string; value: unknown }
  | { type: "error"; message: string };
