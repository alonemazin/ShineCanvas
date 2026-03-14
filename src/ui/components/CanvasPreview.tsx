import React, { useRef, useEffect, useState } from "react";

interface CanvasPreviewProps {
  code: string;
  isLoading: boolean;
}

/**
 * Scaling script injected into the preview iframe.
 * After the canvas renders, it scales down (never up) to fit
 * the iframe viewport, centered. Sends a message to the parent
 * when rendering is complete so we can hide the loading overlay.
 */
const PREVIEW_INJECT = `<style>
html, body { margin:0; padding:0; width:100%; height:100%; overflow:hidden; background:transparent; }
</style>
<script>
(function() {
  function fit() {
    var c = document.querySelector('canvas');
    if (!c) return;
    var cw = c.width, ch = c.height;
    if (cw === 0 || ch === 0) return;
    var vw = window.innerWidth, vh = window.innerHeight;
    var scale = Math.min(vw / cw, vh / ch, 1);
    c.style.position = 'absolute';
    c.style.transformOrigin = '0 0';
    c.style.transform = 'scale(' + scale + ')';
    c.style.left = ((vw - cw * scale) / 2) + 'px';
    c.style.top = ((vh - ch * scale) / 2) + 'px';
    parent.postMessage({ previewReady: true }, '*');
  }
  window.addEventListener('load', fit);
  window.addEventListener('resize', fit);
})();
</script>`;

const CHECKERBOARD: React.CSSProperties = {
  backgroundImage: [
    "linear-gradient(45deg, #252321 25%, transparent 25%)",
    "linear-gradient(-45deg, #252321 25%, transparent 25%)",
    "linear-gradient(45deg, transparent 75%, #252321 75%)",
    "linear-gradient(-45deg, transparent 75%, #252321 75%)",
  ].join(", "),
  backgroundSize: "16px 16px",
  backgroundPosition: "0 0, 0 8px, 8px -8px, -8px 0px",
  backgroundColor: "#1a1918",
};

export const CanvasPreview: React.FC<CanvasPreviewProps> = ({
  code,
  isLoading,
}) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeReady, setIframeReady] = useState(false);

  // Listen for the "previewReady" message from the iframe
  useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data?.previewReady) {
        setIframeReady(true);
      }
    };
    window.addEventListener("message", handler);
    return () => window.removeEventListener("message", handler);
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    if (!code) {
      iframe.srcdoc = "";
      setIframeReady(false);
      return;
    }

    setIframeReady(false);
    const injected = code.replace("</head>", PREVIEW_INJECT + "\n</head>");
    iframe.srcdoc = injected;
  }, [code]);

  const showSpinner = isLoading || (code && !iframeReady);

  if (!code && !isLoading) {
    return (
      <div className="w-full flex-1 min-h-[200px] rounded-[2.5rem] border border-foreground/10 bg-card flex flex-col items-center justify-center gap-4 shadow-inner">
        <div className="w-16 h-16 rounded-full border border-foreground/5 bg-foreground/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-foreground/20"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M3.75 21h16.5A2.25 2.25 0 0022.5 18.75V5.25A2.25 2.25 0 0020.25 3H3.75A2.25 2.25 0 001.5 5.25v13.5A2.25 2.25 0 003.75 21z"
            />
          </svg>
        </div>
        <p className="text-lg  text-foreground/30">
          Preview will appear here
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative flex-1 min-h-[200px] rounded-[2.5rem] border border-foreground/10 overflow-hidden"
      style={CHECKERBOARD}
    >
      <iframe
        ref={iframeRef}
        style={{
          border: "none",
          display: "block",
          width: "100%",
          height: "100%",
          opacity: iframeReady ? 1 : 0,
          transition: "opacity 0.2s ease-in",
        }}
        sandbox="allow-scripts"
        title="Canvas Preview"
      />
      {showSpinner && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
          <div className="flex flex-col items-center gap-2">
            <svg
              className="w-5 h-5 animate-spin text-foreground/50"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            <span className="text-[11px] text-foreground/50">
              {isLoading ? "Generating preview..." : "Rendering..."}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
