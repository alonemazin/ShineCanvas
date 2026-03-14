import { CodeBuilder } from "./CodeBuilder";
import { CanvasType, GenerateOptions, Offset } from "./types";
import { Emitter } from "../emitters/Emitter";
import { HtmlCanvasEmitter } from "../emitters/HtmlCanvasEmitter";
import { NodeCanvasEmitter } from "../emitters/NodeCanvasEmitter";
import { RendererFactory } from "../renderers/RendererFactory";
import { resetGradCounter } from "../painters/FillPainter";
import { resetStrokeGradCounter } from "../painters/StrokePainter";
import { resetImgCounter } from "../renderers/BaseRenderer";
import { resetVectorPathCounter } from "../renderers/VectorRenderer";
import { r } from "../utils/math";

/**
 * Orchestrates the conversion of a Figma node tree to canvas code.
 * Entry point for the entire code generation pipeline.
 */
export class CanvasCodeGenerator {
  private emitter: Emitter;
  public options: GenerateOptions;

  constructor(canvasType: CanvasType, options?: GenerateOptions) {
    this.emitter =
      canvasType === "html" ? new HtmlCanvasEmitter() : new NodeCanvasEmitter();
    this.options = options ?? { usePlaceholderImages: false, imageSizeLimitKB: 512 };
  }

  /**
   * Generate canvas code for a Figma node and its children.
   * @param node - The root node (usually a FRAME) to convert
   * @returns Formatted canvas code string
   */
  async generate(node: SceneNode): Promise<string> {
    resetVectorPathCounter();
    resetImgCounter();
    resetGradCounter();
    resetStrokeGradCounter();
    const builder = new CodeBuilder();
    const width = r((node as any).width ?? 0);
    const height = r((node as any).height ?? 0);

    // Emit initialization boilerplate
    this.emitter.emitInit(builder, width, height, node.name);

    // Negate the root node's page position so everything draws
    // relative to (0, 0) on the canvas
    const rootOffset: Offset = { x: -node.x, y: -node.y };

    if ("children" in node) {
      const rootRenderer = RendererFactory.create(
        node,
        builder,
        this,
        rootOffset,
        this.emitter
      );
      if (rootRenderer) {
        await rootRenderer.render();
      }
    } else {
      await this.renderNode(node, builder, rootOffset);
    }

    // Emit closing boilerplate
    builder.blank();
    this.emitter.emitClose(builder);

    return builder.toString();
  }

  /**
   * Render a single node. Called by container renderers for their children.
   * This is the recursive entry point used by FrameRenderer and GroupRenderer.
   */
  async renderNode(
    node: SceneNode,
    builder: CodeBuilder,
    offset: Offset
  ): Promise<void> {
    const renderer = RendererFactory.create(
      node,
      builder,
      this,
      offset,
      this.emitter
    );
    if (renderer) {
      await renderer.render();
    }
  }
}
