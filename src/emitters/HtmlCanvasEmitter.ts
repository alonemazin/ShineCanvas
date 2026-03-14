import { CodeBuilder } from "../core/CodeBuilder";
import { Emitter } from "./Emitter";

export class HtmlCanvasEmitter implements Emitter {
  readonly isAsync = false;

  emitInit(
    builder: CodeBuilder,
    width: number,
    height: number,
    name: string
  ): void {
    builder
      .raw("<!DOCTYPE html>")
      .raw(`<html>`)
      .raw("<head>")
      .raw(`  <title>${name}</title>`)
      .raw("</head>")
      .raw("<body>")
      .raw(`  <canvas id="canvas" width="${width}" height="${height}"></canvas>`)
      .raw("  <script>")
      .setIndentLevel(2)
      .line(`const canvas = document.getElementById('canvas');`)
      .line(`const ctx = canvas.getContext('2d');`)
      .blank();
  }

  emitClose(builder: CodeBuilder): void {
    builder.setIndentLevel(0).raw("  </script>").raw("</body>").raw("</html>");
  }

  emitImageLoad(
    builder: CodeBuilder,
    varName: string,
    base64: string
  ): void {
    builder
      .line(`const ${varName} = new Image();`)
      .line(`${varName}.src = '${base64}';`)
      .line(`${varName}.onload = () => {`);
  }
}
