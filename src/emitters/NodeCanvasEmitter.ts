import { CodeBuilder } from "../core/CodeBuilder";
import { Emitter } from "./Emitter";

export class NodeCanvasEmitter implements Emitter {
  readonly isAsync = true;

  emitInit(
    builder: CodeBuilder,
    width: number,
    height: number,
    name: string
  ): void {
    builder
      .line(`const { createCanvas, loadImage } = require('canvas');`)
      .line(`const fs = require('fs');`)
      .blank()
      .line(`const canvas = createCanvas(${width}, ${height});`)
      .line(`const ctx = canvas.getContext('2d');`)
      .blank()
      .comment(`${name}`)
      .line(`(async () => {`)
      .indent();
  }

  emitClose(builder: CodeBuilder): void {
    builder
      .blank()
      .comment("Export to PNG")
      .line(`const out = fs.createWriteStream('./output.png');`)
      .line(`const stream = canvas.createPNGStream();`)
      .line(`stream.pipe(out);`)
      .line(`out.on('finish', () => console.log('PNG saved to output.png'));`)
      .dedent()
      .line(`})();`);
  }

  emitImageLoad(
    builder: CodeBuilder,
    varName: string,
    base64: string
  ): void {
    builder.line(
      `const ${varName} = await loadImage('${base64}');`
    );
  }
}
