import { CodeBuilder } from "../core/CodeBuilder";
import { Offset } from "../core/types";
import { Emitter } from "../emitters/Emitter";
import { BaseRenderer } from "./BaseRenderer";
import { RectangleRenderer } from "./RectangleRenderer";
import { EllipseRenderer } from "./EllipseRenderer";
import { FrameRenderer } from "./FrameRenderer";
import { GroupRenderer } from "./GroupRenderer";
import { TextRenderer } from "./TextRenderer";
import { LineRenderer } from "./LineRenderer";
import { VectorRenderer } from "./VectorRenderer";
import { StarRenderer } from "./StarRenderer";
import { PolygonRenderer } from "./PolygonRenderer";
import type { CanvasCodeGenerator } from "../core/CanvasCodeGenerator";

/** Map of Figma node types to renderer classes */
const RENDERER_MAP: Record<
  string,
  new (
    node: SceneNode,
    builder: CodeBuilder,
    generator: CanvasCodeGenerator,
    offset: Offset,
    emitter: Emitter
  ) => BaseRenderer
> = {
  RECTANGLE: RectangleRenderer,
  ELLIPSE: EllipseRenderer,
  FRAME: FrameRenderer,
  COMPONENT: FrameRenderer,
  INSTANCE: FrameRenderer,
  COMPONENT_SET: FrameRenderer,
  GROUP: GroupRenderer,
  TEXT: TextRenderer,
  LINE: LineRenderer,
  VECTOR: VectorRenderer,
  STAR: StarRenderer,
  POLYGON: PolygonRenderer,
  BOOLEAN_OPERATION: VectorRenderer,
};

export class RendererFactory {
  /**
   * Create the appropriate renderer for a Figma node.
   * Returns null for unsupported node types.
   */
  static create(
    node: SceneNode,
    builder: CodeBuilder,
    generator: CanvasCodeGenerator,
    offset: Offset,
    emitter: Emitter
  ): BaseRenderer | null {
    const RendererClass = RENDERER_MAP[node.type];
    if (!RendererClass) {
      builder.comment(`Unsupported node type: ${node.type} ("${node.name}")`);
      return null;
    }
    return new RendererClass(node, builder, generator, offset, emitter);
  }

  /** Check if a node type is supported */
  static isSupported(type: string): boolean {
    return type in RENDERER_MAP;
  }
}
