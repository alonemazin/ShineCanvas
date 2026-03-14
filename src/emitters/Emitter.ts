import { CodeBuilder } from "../core/CodeBuilder";

/**
 * Interface for canvas code output strategies.
 * Each emitter wraps the drawing code in platform-specific boilerplate.
 */
export interface Emitter {
  /** Generate initialization code (canvas setup, context creation) */
  emitInit(
    builder: CodeBuilder,
    width: number,
    height: number,
    name: string
  ): void;

  /** Generate closing code (end of script, file export, etc.) */
  emitClose(builder: CodeBuilder): void;

  /**
   * Generate code to load an image from base64 data.
   * Returns the variable name that holds the loaded image.
   * HTML uses async img.onload, Node uses await loadImage().
   */
  emitImageLoad(
    builder: CodeBuilder,
    varName: string,
    base64: string
  ): void;

  /** Whether image loading is async (affects code structure) */
  readonly isAsync: boolean;
}
