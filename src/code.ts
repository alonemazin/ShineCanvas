import { CanvasCodeGenerator } from "./core/CanvasCodeGenerator";
import { PluginMessage, NodeInfo } from "./core/types";

figma.showUI(__html__, { width: 720, height: 620, themeColors: true });

// ── Selection tracking ──────────────────────────────────────────

function getNodeInfo(node: SceneNode): NodeInfo {
  return {
    id: node.id,
    name: node.name,
    type: node.type,
    width: Math.round((node as any).width ?? 0),
    height: Math.round((node as any).height ?? 0),
  };
}

function sendSelection(): void {
  const selection = figma.currentPage.selection;
  if (selection.length === 1) {
    figma.ui.postMessage({
      type: "selection-changed",
      node: getNodeInfo(selection[0]),
    });
  } else {
    figma.ui.postMessage({ type: "selection-changed", node: null });
  }
}

// Send initial selection
sendSelection();

// Listen for selection changes
figma.on("selectionchange", sendSelection);

// ── Message handling ────────────────────────────────────────────

figma.ui.onmessage = async (msg: PluginMessage) => {
  switch (msg.type) {
    case "generate": {
      const node = figma.getNodeById(msg.nodeId) as SceneNode | null;
      if (!node) {
        figma.ui.postMessage({
          type: "error",
          message: "Selected node not found.",
        });
        return;
      }

      figma.ui.postMessage({ type: "generating" });

      try {
        const generator = new CanvasCodeGenerator(msg.canvasType, msg.options);
        const code = await generator.generate(node);
        figma.ui.postMessage({ type: "generated-code", code, canvasType: msg.canvasType, nodeId: msg.nodeId });
      } catch (err) {
        figma.ui.postMessage({
          type: "error",
          message: `Generation failed: ${err instanceof Error ? err.message : String(err)}`,
        });
      }
      break;
    }

    case "generate-preview": {
      const node = figma.getNodeById(msg.nodeId) as SceneNode | null;
      if (!node) return;

      try {
        const generator = new CanvasCodeGenerator("html", msg.options);
        const code = await generator.generate(node);
        figma.ui.postMessage({ type: "preview-code", code });
      } catch {
        // Silently ignore preview errors — don't disrupt the UI
      }
      break;
    }

    case "get-setting": {
      const value = await figma.clientStorage.getAsync(msg.key);
      figma.ui.postMessage({ type: "setting-value", key: msg.key, value });
      break;
    }

    case "save-setting": {
      await figma.clientStorage.setAsync(msg.key, msg.value);
      break;
    }

    case "get-selection":
      sendSelection();
      break;
  }
};
