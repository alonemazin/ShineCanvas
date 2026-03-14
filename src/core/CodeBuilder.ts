/**
 * String builder with automatic indentation management.
 * Produces clean, formatted canvas drawing code.
 */
export class CodeBuilder {
  private _lines: string[] = [];
  private indentLevel = 0;
  private indentStr: string;

  constructor(indentSize = 2) {
    this.indentStr = " ".repeat(indentSize);
  }

  /** Increase indent level */
  indent(): this {
    this.indentLevel++;
    return this;
  }

  /** Decrease indent level */
  dedent(): this {
    if (this.indentLevel > 0) this.indentLevel--;
    return this;
  }

  /** Add a line at the current indent level */
  line(code: string): this {
    const prefix = this.indentStr.repeat(this.indentLevel);
    this._lines.push(prefix + code);
    return this;
  }

  /** Add multiple lines (each indented) */
  lines(codes: string[]): this {
    for (const code of codes) {
      this.line(code);
    }
    return this;
  }

  /** Add an empty line */
  blank(): this {
    this._lines.push("");
    return this;
  }

  /** Add a comment line */
  comment(text: string): this {
    return this.line(`// ${text}`);
  }

  /** Add raw content without indentation */
  raw(content: string): this {
    this._lines.push(content);
    return this;
  }

  /** Get the current indent level */
  getIndentLevel(): number {
    return this.indentLevel;
  }

  /** Set indent level directly */
  setIndentLevel(level: number): this {
    this.indentLevel = Math.max(0, level);
    return this;
  }

  /** Build the final string */
  toString(): string {
    return this._lines.join("\n");
  }
}
