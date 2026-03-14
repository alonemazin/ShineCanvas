# ShineCanvas

<p align="center">
  <img src="https://github.com/alonemazin/ShineCanvas/blob/master/docs/shinecanvas-banner.png?raw=true" alt="ShineCanvas Banner" width="600">
</p>

This project aims to create a Figma plugin that converts Figma frames and elements into Canvas drawing code, targeting both HTML5 Canvas APIs (for web pages) and [Node Canvas](https://github.com/Automattic/node-canvas) for server-side rendering in Node.js. The focus is on generating pixel-perfect, 1:1 Canvas code that matches your Figma designs, whether you want to render graphics in the browser or on the server.

> **Note:** ShineCanvas is a work in progress. Some features may not achieve perfect visual fidelity yet, and ongoing improvements are planned to close any remaining gaps with Figma's rendering.

Contributions, suggestions, and bug reports are welcomed! PRs and feedback are highly encouraged.

## Features

- Supports both HTML5 canvas and Node canvas
- Handles standard shapes (rectangles, ellipses, polygons, stars, lines)
- Text rendering support (with future improvements for fidelity)
- Fills, strokes, gradients, and visual effects
- Live preview of generated canvas code

## Installation

1. Clone this repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Build the plugin:
   ```bash
   npm run build
   ```
4. In Figma, go to Plugins → Development → Import plugin from manifest.
5. Select the `manifest.json` file from this project.

## License

Licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
