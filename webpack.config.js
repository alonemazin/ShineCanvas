const path = require("path");
const webpack = require("webpack");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("inline-chunk-html-plugin");

module.exports = (_, argv) => [
  // Plugin backend (code.js) — runs in Figma's main thread sandbox
  {
    entry: "./src/code.ts",
    output: {
      filename: "code.js",
      path: path.resolve(__dirname, "dist"),
    },
    target: "webworker",
    module: {
      rules: [{ test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ }],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js"],
    },
  },
  // Plugin UI (ui.html with inlined JS/CSS) — runs in an iframe
  {
    entry: "./src/ui/index.tsx",
    output: {
      filename: "ui.js",
      path: path.resolve(__dirname, "dist"),
    },
    optimization: {
      runtimeChunk: false,
      splitChunks: false,
    },
    module: {
      rules: [
        { test: /\.tsx?$/, use: "ts-loader", exclude: /node_modules/ },
        {
          test: /\.css$/,
          use: ["style-loader", "css-loader", "postcss-loader"],
        },
      ],
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".jsx"],
      alias: {
        "@": path.resolve(__dirname, "src/ui"),
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: "./src/ui/index.html",
        filename: "ui.html",
        inject: "body",
        inlineSource: ".(js|css)$",
      }),
      new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/.*/]),
    ],
  },
];
