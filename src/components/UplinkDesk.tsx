import { useState, useRef, useEffect, DragEvent, ChangeEvent } from "react";
import { 
  Upload, 
  Sparkles, 
  Cpu, 
  Volume2, 
  Copy, 
  Check, 
  Loader2, 
  AlertTriangle,
  Image as ImageIcon,
  Code
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { CaptionGenerationResponse, CaptionHistoryEntry } from "../types";

interface UplinkDeskProps {
  onSaveHistory: (entry: CaptionHistoryEntry) => void;
}

export default function UplinkDesk({ onSaveHistory }: UplinkDeskProps) {
  const [image, setImage] = useState<string | null>(null);
  const [capturing, setCapturing] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>("");
  const [response, setResponse] = useState<CaptionGenerationResponse | null>(null);
  const [copied, setCopied] = useState<boolean>(false);
  const [isDictated, setIsDictated] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Loading animation sequence labels
  useEffect(() => {
    if (!capturing) return;

    const steps = [
      "Accessing local model pathway...",
      "Reading local viy_gpt2_caption_model.pkl tensor parameters...",
      "Decoding visual features via transformer blocks...",
      "Formulating descriptive language tokens..."
    ];

    let currentIdx = 0;
    setLoadingStep(steps[0]);

    const interval = setInterval(() => {
      if (currentIdx < steps.length - 1) {
        currentIdx++;
        setLoadingStep(steps[currentIdx]);
      }
    }, 1100);

    return () => clearInterval(interval);
  }, [capturing]);

  // Read upload files
  const processFile = (file: File) => {
    if (!file.type.match("image.*")) {
      alert("Invalid format! Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === "string") {
        setImage(e.target.result);
        setResponse(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const triggerUpload = () => {
    fileInputRef.current?.click();
  };

  const handleGenerateCaption = async () => {
    if (!image) return;

    setCapturing(true);
    setResponse(null);

    try {
      const BACKEND_URL = (import.meta as any).env?.VITE_BACKEND_URL || "";
      const endpoint = BACKEND_URL ? `${BACKEND_URL.replace(/\/$/, "")}/generate-caption` : "/api/generate-caption";

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image }),
      });

      const contentType = res.headers.get("content-type") || "";
      let data: CaptionGenerationResponse;
      if (contentType.includes("application/json")) {
        data = await res.json();
      } else {
        const text = await res.text();
        throw new Error(`Invalid JSON response from server: ${text.substring(0,200)}`);
      }
      setResponse(data);

      if (data.success && data.caption) {
        onSaveHistory({
          id: Math.random().toString(36).substring(4),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          image_base64: image,
          caption: data.caption,
          source: data.source,
          execution_time_ms: data.execution_time_ms,
        });
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      setResponse({
        success: false,
        source: "pickle",
        error: `Prediction endpoint communication error: ${msg}`,
      });
    } finally {
      setCapturing(false);
      setLoadingStep("");
    }
  };

  const handleSpeak = () => {
    if (!response?.caption) return;
    const utterance = new SpeechSynthesisUtterance(response.caption);
    utterance.onstart = () => setIsDictated(true);
    utterance.onend = () => setIsDictated(false);
    utterance.onerror = () => setIsDictated(false);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  };

  const handleCopy = () => {
    if (!response?.caption) return;
    navigator.clipboard.writeText(response.caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearImage = () => {
    setImage(null);
    setResponse(null);
  };

  return (
    <div id="uplink-grid-layout" className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch flex-1">
      
      {/* Upload Zone & Guide Panel (Left) */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        
        {/* Workspace image interface packaging */}
        <div className="bg-slate-900/45 border border-white/5 rounded-xl p-5 flex flex-col justify-between flex-1 min-h-[340px]">
          <div className="flex items-center justify-between mb-3 shrink-0">
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5 font-mono">
              <ImageIcon className="w-3.5 h-3.5 text-blue-400" />
              Image Workbench
            </span>
            {image && (
              <button 
                id="workspace-clear-image"
                onClick={clearImage} 
                className="text-[10px] font-bold text-red-400 hover:text-red-300 transition cursor-pointer font-mono uppercase"
              >
                Clear Image
              </button>
            )}
          </div>

          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            accept="image/*" 
            className="hidden" 
          />

          {!image ? (
            <div 
              id="upload-dropzone-interactive"
              ref={dropZoneRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={triggerUpload}
              className="flex-1 min-h-[220px] rounded-xl border border-dashed border-white/10 bg-slate-950/20 hover:bg-slate-950/40 hover:border-blue-500/30 flex flex-col items-center justify-center p-6 text-center cursor-pointer transition-all duration-300 group"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center shadow-md mb-3 group-hover:scale-105 transition-transform duration-300">
                <Upload className="w-4 h-4 text-blue-400" />
              </div>
              <p className="text-xs font-semibold text-slate-200 group-hover:text-blue-300 transition">
                Select or drop image here to analyze
              </p>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-normal font-sans">
                Supports standard formats (PNG, JPG, WEBP).
              </p>
            </div>
          ) : (
            <div id="image-loaded-preview-workspace" className="flex-1 flex flex-col justify-between gap-4">
              <div className="flex-1 relative flex items-center justify-center bg-slate-950/50 rounded-xl overflow-hidden border border-white/5 min-h-[220px]">
                <img 
                  src={image} 
                  alt="Workspace upload thumbnail preview" 
                  className="max-h-[240px] max-w-full object-contain relative z-10 rounded-lg select-none" 
                />
              </div>

              <div className="shrink-0">
                <button
                  id="process-inference-action"
                  onClick={handleGenerateCaption}
                  disabled={capturing}
                  className="w-full bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:bg-slate-850 disabled:text-slate-500 text-white font-bold text-xs py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-lg select-none transition-all hover:scale-[1.002] uppercase tracking-wider font-mono text-center"
                >
                  {capturing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                      <span>Computing tokens...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white animate-pulse" />
                      <span>Compute Caption</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* outputs (Right) */}
      <div className="lg:col-span-5 flex flex-col justify-between">
        
        {/* Caption results output card */}
        <div id="caption-output-card" className="bg-slate-900/45 border border-white/5 rounded-xl p-5 flex flex-col justify-between flex-1 min-h-[340px]">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold font-mono flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                Caption Token Output
              </span>
              
              <AnimatePresence>
                {response && (
                  <motion.span 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[8px] font-mono tracking-wider font-bold ${
                      response.success 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                        : "bg-red-500/10 text-red-400 border border-red-500/20"
                    }`}
                  >
                    {response.success ? "Ready" : "Offline"}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence mode="wait">
              {capturing && (
                <motion.div
                  key="capturing-view"
                  initial={{ opacity: 0, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -3 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <div className="space-y-4 w-full flex flex-col items-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                    <div className="space-y-1">
                      <p className="font-bold text-xs text-slate-200 uppercase tracking-wide font-mono">Running Local Inference</p>
                      <p className="text-[10px] text-slate-400 font-mono animate-pulse min-h-[16px]">
                        {loadingStep}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}

              {!capturing && !response && (
                <motion.div
                  key="prompt-view"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-12 text-center"
                >
                  <Sparkles className="w-6 h-6 text-slate-600 mb-2" />
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest font-mono">Awaiting workspace image</p>
                  <p className="text-[10px] text-slate-500 max-w-[220px] mt-1 leading-normal font-sans">
                    Insert an image inside the workspace on the left, then click "Compute Caption" to generate text descriptions.
                  </p>
                </motion.div>
              )}

              {!capturing && response && (
                <motion.div
                  key="result-view"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  {/* Generated Caption output display */}
                  {response.success ? (
                    <div className="space-y-4">
                      <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5 relative overflow-hidden">
                        <p className="text-xs md:text-sm text-slate-200 font-light leading-relaxed select-all italic text-left">
                          "{response.caption}"
                        </p>
                      </div>

                      {/* Speaking narration and copy controls */}
                      <div className="flex items-center gap-2">
                        <button
                          id="speak-narrator-action"
                          onClick={handleSpeak}
                          className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer transition font-mono ${
                            isDictated 
                              ? "bg-blue-600/20 border-blue-500 text-blue-300" 
                              : "bg-slate-950 border-white/5 text-slate-300 hover:bg-slate-900 hover:text-white"
                          }`}
                        >
                          <Volume2 className={`w-3.5 h-3.5 ${isDictated ? "animate-pulse" : ""}`} />
                          <span>{isDictated ? "Reading..." : "Read Aloud"}</span>
                        </button>
                        
                        <button
                          id="copy-text-action"
                          onClick={handleCopy}
                          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 border border-white/5 bg-slate-950 hover:bg-slate-900 rounded-lg text-[9px] font-bold uppercase tracking-wider text-slate-300 cursor-pointer transition font-mono"
                        >
                          {copied ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy Text</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-red-950/20 border border-red-500/25 rounded-xl p-4 space-y-2">
                      <div className="flex gap-2">
                        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        <span className="font-bold text-[10px] text-red-300 uppercase tracking-wider font-mono">Inference Glitch</span>
                      </div>
                      
                      <p className="text-[10px] text-red-300 font-mono leading-relaxed bg-black/40 p-2 rounded border border-red-500/15 overflow-x-auto whitespace-pre-wrap max-h-[140px] text-left">
                        {response.error}
                      </p>
                    </div>
                  )}

                  {/* Hardware execution speed stats */}
                  {response.success && (
                    <div className="bg-slate-950/30 rounded-xl p-4 border border-white/5 space-y-2 text-left">
                      <div className="grid grid-cols-2 gap-4 text-[10px] font-mono leading-relaxed">
                        <div>
                          <p className="text-slate-500 uppercase tracking-widest font-bold"></p>
                          <p className="font-semibold text-slate-300 mt-0.5">
                          </p>
                        </div>
                        <div>
                          <p className="text-slate-500 uppercase tracking-widest font-bold">Token Speed</p>
                          <p className="font-semibold text-slate-300 mt-0.5">
                            {response.execution_time_ms ? `${response.execution_time_ms} ms` : "N/A"}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="border-t border-white/5 pt-3.5 mt-5 flex items-center justify-between text-[9px] text-slate-500 font-mono">
            <span className="flex items-center gap-1.5">
              <Code className="w-3.5 h-3.5 text-slate-600" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
