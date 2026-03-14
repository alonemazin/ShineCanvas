import { useEffect, useCallback, useState, useRef } from "react";
import { CanvasType, GenerateOptions, NodeInfo, UIMessage } from "../../core/types";

export interface PluginState {
  selectedNode: NodeInfo | null;
  generatedCode: string;
  previewCode: string;
  isGenerating: boolean;
  isPreviewLoading: boolean;
  error: string | null;
  autoPreview: boolean;
  usePlaceholderImages: boolean;
  imageSizeLimitKB: number;
}

const SETTING_KEY = "autoPreview";
const PLACEHOLDER_KEY = "usePlaceholderImages";
const SIZE_LIMIT_KEY = "imageSizeLimitKB";
const MIN_LOADING_MS = 500;

function postToPlugin(msg: unknown) {
  parent.postMessage({ pluginMessage: msg }, "*");
}

/**
 * Returns a function that delays a callback so that at least `minMs`
 * has elapsed since `startTime`. If enough time already passed, runs immediately.
 */
function delayFromStart(startTime: number, minMs: number, fn: () => void) {
  const elapsed = Date.now() - startTime;
  if (elapsed >= minMs) {
    fn();
  } else {
    setTimeout(fn, minMs - elapsed);
  }
}

export function usePluginMessages() {
  const [state, setState] = useState<PluginState>({
    selectedNode: null,
    generatedCode: "",
    previewCode: "",
    isGenerating: false,
    isPreviewLoading: false,
    error: null,
    autoPreview: false,
    usePlaceholderImages: false,
    imageSizeLimitKB: 512,
  });

  const autoPreviewRef = useRef(state.autoPreview);
  autoPreviewRef.current = state.autoPreview;

  const placeholderRef = useRef(state.usePlaceholderImages);
  placeholderRef.current = state.usePlaceholderImages;

  const sizeLimitRef = useRef(state.imageSizeLimitKB);
  sizeLimitRef.current = state.imageSizeLimitKB;

  // Timestamps for minimum loading duration
  const generateStartRef = useRef(0);
  const previewStartRef = useRef(0);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      const msg = event.data.pluginMessage as UIMessage;
      if (!msg) return;

      switch (msg.type) {
        case "selection-changed":
          setState((prev) => ({
            ...prev,
            selectedNode: msg.node,
            error: null,
          }));
          if (msg.node && autoPreviewRef.current) {
            previewStartRef.current = Date.now();
            setState((prev) => ({ ...prev, isPreviewLoading: true }));
            postToPlugin({
              type: "generate-preview",
              nodeId: msg.node.id,
              options: { usePlaceholderImages: placeholderRef.current, imageSizeLimitKB: sizeLimitRef.current },
            });
          }
          break;

        case "generated-code": {
          const applyGenerate = () => {
            setState((prev) => ({
              ...prev,
              generatedCode: msg.code,
              isGenerating: false,
              error: null,
            }));
          };
          delayFromStart(generateStartRef.current, MIN_LOADING_MS, applyGenerate);

          if (msg.canvasType === "html") {
            const applyPreview = () => {
              setState((prev) => ({
                ...prev,
                previewCode: msg.code,
                isPreviewLoading: false,
              }));
            };
            delayFromStart(previewStartRef.current, MIN_LOADING_MS, applyPreview);
          } else if (msg.nodeId) {
            previewStartRef.current = Date.now();
            setState((prev) => ({ ...prev, isPreviewLoading: true }));
            postToPlugin({
              type: "generate-preview",
              nodeId: msg.nodeId,
              options: { usePlaceholderImages: placeholderRef.current, imageSizeLimitKB: sizeLimitRef.current },
            });
          }
          break;
        }

        case "preview-code": {
          const applyPreview = () => {
            setState((prev) => ({
              ...prev,
              previewCode: msg.code,
              isPreviewLoading: false,
            }));
          };
          delayFromStart(previewStartRef.current, MIN_LOADING_MS, applyPreview);
          break;
        }

        case "generating":
          generateStartRef.current = Date.now();
          previewStartRef.current = Date.now();
          setState((prev) => ({
            ...prev,
            isGenerating: true,
            isPreviewLoading: true,
            error: null,
          }));
          break;

        case "setting-value":
          if (msg.key === SETTING_KEY) {
            setState((prev) => ({
              ...prev,
              autoPreview: msg.value === true,
            }));
          } else if (msg.key === PLACEHOLDER_KEY) {
            setState((prev) => ({
              ...prev,
              usePlaceholderImages: msg.value === true,
            }));
          } else if (msg.key === SIZE_LIMIT_KEY) {
            setState((prev) => ({
              ...prev,
              imageSizeLimitKB: typeof msg.value === "number" ? msg.value : prev.imageSizeLimitKB,
            }));
          }
          break;

        case "error": {
          const applyError = () => {
            setState((prev) => ({
              ...prev,
              isGenerating: false,
              isPreviewLoading: false,
              error: msg.message,
            }));
          };
          delayFromStart(generateStartRef.current, MIN_LOADING_MS, applyError);
          break;
        }
      }
    };

    window.addEventListener("message", handler);
    postToPlugin({ type: "get-setting", key: SETTING_KEY });
    postToPlugin({ type: "get-setting", key: PLACEHOLDER_KEY });
    postToPlugin({ type: "get-setting", key: SIZE_LIMIT_KEY });
    return () => window.removeEventListener("message", handler);
  }, []);

  const generate = useCallback(
    (nodeId: string, canvasType: CanvasType) => {
      generateStartRef.current = Date.now();
      previewStartRef.current = Date.now();
      setState((prev) => ({
        ...prev,
        isGenerating: true,
        isPreviewLoading: true,
        error: null,
      }));
      const options: GenerateOptions = {
        usePlaceholderImages: placeholderRef.current,
        imageSizeLimitKB: sizeLimitRef.current,
      };
      postToPlugin({ type: "generate", nodeId, canvasType, options });
    },
    []
  );

  const setAutoPreview = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, autoPreview: enabled }));
    postToPlugin({ type: "save-setting", key: SETTING_KEY, value: enabled });
  }, []);

  const setUsePlaceholderImages = useCallback((enabled: boolean) => {
    setState((prev) => ({ ...prev, usePlaceholderImages: enabled }));
    postToPlugin({ type: "save-setting", key: PLACEHOLDER_KEY, value: enabled });
  }, []);

  const setImageSizeLimitKB = useCallback((limit: number) => {
    setState((prev) => ({ ...prev, imageSizeLimitKB: limit }));
    postToPlugin({ type: "save-setting", key: SIZE_LIMIT_KEY, value: limit });
  }, []);

  const requestSelection = useCallback(() => {
    postToPlugin({ type: "get-selection" });
  }, []);

  return { ...state, generate, setAutoPreview, setUsePlaceholderImages, setImageSizeLimitKB, requestSelection };
}
