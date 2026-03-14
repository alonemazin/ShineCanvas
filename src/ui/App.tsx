import React, { useState } from "react";
import { SelectionInfo } from "@/components/SelectionInfo";
import { CanvasPreview } from "@/components/CanvasPreview";
import { CodeView } from "@/components/CodeView";
import { usePluginMessages } from "@/hooks/usePluginMessages";
import { CanvasType } from "../core/types";

const ShineCanvasLogo: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 260 247" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path opacity="0.999" fillRule="evenodd" clipRule="evenodd" d="M97.3819 0C119.118 0 140.854 0 162.59 0C158.239 14.011 153.868 28.0171 149.476 42.0183C148.209 46.9617 146.259 51.6006 143.626 55.9352C138.736 63.8785 132.414 70.38 124.662 75.4389C119.63 78.6913 114.284 81.3007 108.623 83.2672C96.6536 87.3613 84.427 90.3828 71.9428 92.3332C53.9047 95.126 35.762 96.5417 17.5148 96.5819C25.9856 97.9006 34.3558 99.7072 42.6253 102.001C51.6752 104.556 60.396 107.968 68.7875 112.238C73.5079 114.818 77.9338 117.829 82.0658 121.271C83.0078 122.118 83.9064 123.011 84.761 123.947C84.7393 123.969 84.7169 123.992 84.6952 124.014C89.8146 129.11 94.2076 134.764 97.8749 140.975C99.329 143.898 100.446 146.954 101.227 150.142C103.332 158.764 104.055 167.506 103.397 176.37C102.99 182.33 102.114 188.218 100.767 194.034C100.092 194.122 99.402 194.167 98.6966 194.167C82.6522 193.742 67.3578 190.095 52.8141 183.228C30.4478 172.238 15.0331 154.853 6.57001 131.073C3.14572 121.229 0.998397 111.104 0.128048 100.697C-0.380841 91.2901 0.62709 82.0568 3.15183 72.9968C3.95647 70.5111 4.72334 68.0134 5.45253 65.5031C10.9898 49.2369 20.0501 35.3981 32.6337 23.9866C44.3008 13.7774 57.6887 6.86357 72.7973 3.24504C80.8951 1.32826 89.0902 0.246556 97.3819 0Z" fill="currentColor"/>
    <path opacity="0.999" fillRule="evenodd" clipRule="evenodd" d="M158.318 52.7236C174.698 52.8352 190.342 56.3256 205.252 63.1948C228.443 74.2881 244.296 92.1412 252.811 116.755C256.21 126.759 258.27 137.041 258.99 147.599C259.325 156.532 258.296 165.297 255.9 173.894C255.096 176.38 254.329 178.878 253.6 181.388C248.062 197.654 239.002 211.493 226.419 222.904C214.439 233.373 200.678 240.376 185.137 243.914C177.41 245.669 169.587 246.65 161.67 246.858C139.934 246.891 118.198 246.902 96.4619 246.891C100.813 232.88 105.184 218.874 109.576 204.873C110.843 199.93 112.794 195.29 115.426 190.956C120.316 183.012 126.638 176.511 134.391 171.452C139.481 168.16 144.893 165.527 150.627 163.557C161.325 159.909 172.236 157.121 183.363 155.193C199.817 152.416 216.382 150.832 233.058 150.443C235.884 150.383 238.711 150.339 241.538 150.309C231.447 148.777 221.521 146.502 211.76 143.485C204.039 141.05 196.59 137.949 189.41 134.184C185.471 131.947 181.725 129.426 178.17 126.624C176.794 125.492 175.501 124.265 174.291 122.944C174.313 122.922 174.335 122.899 174.357 122.877C169.077 117.617 164.574 111.763 160.849 105.313C158.838 100.823 157.435 96.139 156.642 91.2627C155.119 81.9558 155.032 72.6335 156.379 63.2951C156.863 59.7389 157.509 56.2152 158.318 52.7236Z" fill="currentColor"/>
  </svg>
);

const App: React.FC = () => {
  const [canvasType, setCanvasType] = useState<CanvasType>("html");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const {
    selectedNode,
    generatedCode,
    previewCode,
    isGenerating,
    isPreviewLoading,
    error,
    autoPreview,
    usePlaceholderImages,
    imageSizeLimitKB,
    generate,
    setAutoPreview,
    setUsePlaceholderImages,
    setImageSizeLimitKB,
  } = usePluginMessages();

  const handleGenerate = () => {
    if (!selectedNode) return;
    generate(selectedNode.id, canvasType);
  };

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* ── Main Panel ── */}
      <main className="flex-1 flex flex-col p-8 gap-6 overflow-y-auto">
        {/* Header */}
        <header className="flex justify-between items-center w-full">
          <div className="flex items-center gap-3">
            <ShineCanvasLogo className="w-7 h-7 text-foreground" />
            <h1 className="text-3xl font-medium tracking-tight">
              ShineCanvas
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase text-foreground/50">
            <span>Figma</span>
            <span className="text-foreground/30">→</span>
            <span className="text-foreground/80 font-medium">Canvas</span>
          </div>
        </header>

        {/* Selection info */}
        <SelectionInfo node={selectedNode} />

        {/* Canvas preview */}
        <CanvasPreview code={previewCode} isLoading={isPreviewLoading} />

        {/* Code output */}
        <CodeView code={generatedCode} />
      </main>

      {/* ── Sidebar ── */}
      <aside className="w-[300px] border-l border-border flex flex-col p-8 bg-background">
        <div className="flex flex-col gap-8 flex-1 overflow-y-auto">
          {/* Preferences */}
          <div className="space-y-4">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 font-semibold">
              Preferences
            </h3>
            <CheckboxRow
              checked={autoPreview}
              onChange={setAutoPreview}
              label="Auto preview on selection"
            />
          </div>

          {/* Export Target */}
          <div className="space-y-4">
            <h3 className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 font-semibold">
              Export Target
            </h3>
            <div className="flex flex-col border border-border rounded-2xl p-1 gap-1">
              <TargetButton
                active={canvasType === "html"}
                onClick={() => setCanvasType("html")}
                label="HTML Canvas"
              />
              <TargetButton
                active={canvasType === "node"}
                onClick={() => setCanvasType("node")}
                label="Node Canvas"
              />
            </div>
          </div>

          {/* Options (collapsible) */}
          <div className="space-y-4">
            <button
              className="flex items-center justify-between w-full group"
              onClick={() => setOptionsOpen(!optionsOpen)}
            >
              <h3 className="text-[10px] tracking-[0.2em] uppercase text-foreground/40 font-semibold group-hover:text-foreground/60 transition-colors">
                Options
              </h3>
              <svg
                className={`w-3 h-3 text-foreground/40 transition-transform ${optionsOpen ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {optionsOpen && (
              <div className="flex flex-col gap-4">
                <CheckboxRow
                  checked={usePlaceholderImages}
                  onChange={setUsePlaceholderImages}
                  label="Use placeholder images"
                />
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-foreground/50">
                    Image size limit
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      value={imageSizeLimitKB}
                      onChange={(e) =>
                        setImageSizeLimitKB(
                          Math.max(0, Number(e.target.value) || 0)
                        )
                      }
                      className="w-20 h-8 px-2.5 text-xs rounded-lg border border-border bg-transparent text-foreground focus:outline-none focus:border-foreground/30 transition-colors"
                    />
                    <span className="text-xs text-foreground/40">KB</span>
                  </div>
                  <span className="text-[10px] text-foreground/30">
                    0 = no limit. Larger images use placeholder.
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions — pinned to bottom */}
        <div className="flex flex-col gap-3 pt-6 mt-auto border-t border-border">
          {/* Error */}
          {error && (
            <div className="rounded-xl bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
              {error}
            </div>
          )}

          <button
            className="w-full py-4 bg-foreground hover:bg-[#e2decf] text-background rounded-2xl flex items-center justify-center gap-3 text-lg font-medium transition-all shadow-lg active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
            onClick={handleGenerate}
            disabled={!selectedNode || isGenerating}
          >
            {isGenerating ? (
              <>
                <LoadingSpinner />
                Generating...
              </>
            ) : (
              <>
                <SparkleIcon />
                Generate
              </>
            )}
          </button>

          <button
            className="w-full text-xs text-foreground/40 hover:text-foreground/70 flex items-center justify-center gap-2 transition-colors"
            onClick={() => window.open("https://github.com/alonemazin/ShineCanvas")}
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Star us on GitHub
          </button>
        </div>
      </aside>
    </div>
  );
};

/* ── Reusable sub-components ── */

function CheckboxRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 cursor-pointer group">
      <div className="relative flex items-center justify-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <div className="w-5 h-5 rounded-md bg-transparent border border-foreground/30 peer-checked:bg-foreground peer-checked:border-foreground transition-all group-hover:border-foreground/60" />
        <svg
          className="absolute w-3 h-3 text-background opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={3}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <span className="text-base text-foreground/70 group-hover:text-foreground transition-colors">
        {label}
      </span>
    </label>
  );
}

function TargetButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      className={`w-full px-5 py-3 text-sm rounded-xl transition-all text-left flex justify-between items-center ${
        active
          ? "bg-foreground text-background"
          : "text-foreground/60 hover:text-foreground hover:bg-foreground/5"
      }`}
      onClick={onClick}
    >
      {label}
      {active && (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
        </svg>
      )}
    </button>
  );
}

function SparkleIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 256 256">
      <path d="M208,144a15.78,15.78,0,0,1-10.42,14.94l-51.65,19-19,51.61a15.92,15.92,0,0,1-29.88,0L78.07,178l-51.65-19a15.92,15.92,0,0,1,0-29.88l51.65-19,19-51.61a15.92,15.92,0,0,1,29.88,0l19,51.65,51.61,19A15.78,15.78,0,0,1,208,144ZM152,48h16V64a8,8,0,0,0,16,0V48h16a8,8,0,0,0,0-16H184V16a8,8,0,0,0-16,0V32H152a8,8,0,0,0,0,16Zm88,32h-8V72a8,8,0,0,0-16,0v8h-8a8,8,0,0,0,0,16h8v8a8,8,0,0,0,16,0V96h8a8,8,0,0,0,0-16Z" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export default App;
