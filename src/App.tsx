import { useState, useEffect } from "react";
import { 
  Layers, 
  History, 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  Settings,
  HelpCircle
} from "lucide-react";
import { CaptionHistoryEntry } from "./types";
import UplinkDesk from "./components/UplinkDesk";

export default function App() {
  const [history, setHistory] = useState<CaptionHistoryEntry[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Retrieve previous caption operations history
  useEffect(() => {
    const cachedHistory = localStorage.getItem("bit_gpt2_captions_history");
    if (cachedHistory) {
      try {
        setHistory(JSON.parse(cachedHistory));
      } catch (err) {
        console.error("Failed to parse visual history cache:", err);
      }
    }
  }, []);

  // Save new caption entry to history
  const handleSaveHistory = (entry: CaptionHistoryEntry) => {
    const updatedHistory = [entry, ...history].slice(0, 50); // keep last 50
    setHistory(updatedHistory);
    localStorage.setItem("bit_gpt2_captions_history", JSON.stringify(updatedHistory));
  };

  // Clear single history row
  const handleDeleteHistoryRow = (id: string) => {
    const updatedHistory = history.filter((item) => item.id !== id);
    setHistory(updatedHistory);
    localStorage.setItem("bit_gpt2_captions_history", JSON.stringify(updatedHistory));
  };

  // Clear entire history
  const handleResetHistory = () => {
    if (window.confirm("Are you sure you want to delete all stored history?")) {
      setHistory([]);
      localStorage.removeItem("bit_gpt2_captions_history");
    }
  };

  // Trigger historical copy transaction
  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const lastProcessedTime = history.length > 0 ? history[0].execution_time_ms : null;

  return (
    <div id="immersive-mainframe" className="min-h-screen bg-slate-950 flex flex-col text-slate-100 selection:bg-blue-600/40 selection:text-white relative overflow-x-hidden">
      {/* Decorative ambient blur elements */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-950/20 rounded-full filter blur-[120px] pointer-events-none -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-950/20 rounded-full filter blur-[100px] pointer-events-none translate-y-1/3"></div>

      {/* Modern Mainframe Header */}
      {/* Modern Mainframe Header */}
<header
  id="mainframe-header"
  className="h-20 shrink-0 flex items-center justify-between px-6 md:px-10 border-b border-white/5 bg-slate-900/70 backdrop-blur-md sticky top-0 z-50"
>

  {/* Left Logo */}
  <div className="flex items-center">
    <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-blue-500 shadow-lg shadow-blue-500/30 flex items-center justify-center bg-white">
      <img
        src="img/logo.png"
        className="w-full h-full object-cover rounded-full"
        alt="Logo"
      />
    </div>
  </div>

  {/* Center Text */}
  <div className="absolute left-1/2 transform -translate-x-1/2 text-center leading-tight">
    
    <h1 className="text-sm md:text-xl font-extrabold tracking-wide text-blue-400 uppercase">
      Image Caption Generator
    </h1>

    <p className="text-[10px] md:text-xs text-blue-200 font-medium tracking-wide">
      for Bhutanese Cultural and Tourism Images
    </p>

  </div>

  {/* Right Status */}
  <div className="flex items-center gap-3">

    <div className="hidden sm:flex flex-col items-end">
      <span className="text-[9px] uppercase tracking-[0.25em] text-slate-500 font-mono">
        AI Powered
      </span>

      <span className="text-[11px] font-mono text-blue-300">
        Vision + NLP
      </span>
    </div>

    <div className="flex items-center gap-2">
      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>

      <span className="hidden md:block text-xs text-slate-300">
        Active
      </span>
    </div>

  </div>

</header>

      {/* Main Workspace Frame */}
      <main id="mainframe-workspace" className="flex-1 max-w-[1200px] w-full mx-auto p-4 md:p-6 flex flex-col gap-6 justify-center items-stretch">
        
        {/* Model Location & Code integration Guidance Card */}
        <div className="bg-slate-900/50 border border-white/5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            {/* <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-blue-400" />
            </div> */}
            {/* <div className="space-y-1 text-left">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">Where is the model files code pathway?</h3>
              <p className="text-[11px] text-slate-400 leading-normal">
                To run your custom model, put your <code className="bg-slate-950 px-1 py-0.5 rounded text-blue-300">bit_gpt2_caption_model.pkl</code> state dictionary at the root folder of this project. The system calls backend code in <code className="text-blue-300">/server.ts</code> to trigger visual prediction. You can edit <code className="text-blue-400">/server.ts</code> directly to customize loader logic.
              </p>
            </div> */}
          </div>
          {/* <div className="flex items-center gap-2 shrink-0 bg-slate-950/60 px-3 py-2 rounded-xl border border-white/5 font-mono text-[10px]">
            <Settings className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" />
            <span className="text-slate-300"></span>
          </div> */}
        </div>

        {/* Main interactive section carrying UplinkDesk */}
        <div className="bg-slate-900/40 rounded-2xl p-6 flex-1 flex flex-col border border-white/10 shadow-xl bg-gradient-to-b from-slate-900/30 to-slate-950/20">
          <UplinkDesk onSaveHistory={handleSaveHistory} />
        </div>

        {/* Catalog of analyzed captures */}
        <div id="history-box" className="bg-slate-900/40 rounded-2xl p-5 border border-white/10 shadow-lg">
          <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-blue-400" />
              <h2 className="text-[11px] font-bold text-slate-300 uppercase tracking-widest font-mono">
                Recent Computations ({history.length})
              </h2>
            </div>
            {history.length > 0 && (
              <button 
                id="clear-all-history"
                onClick={handleResetHistory} 
                className="text-[10px] font-semibold text-slate-400 hover:text-red-400 transition cursor-pointer font-mono uppercase tracking-wider"
              >
                Clear Catalog
              </button>
            )}
          </div>

          {history.length === 0 ? (
            <div className="text-center py-6 text-xs text-slate-500 font-mono">
              No previous photo analyses stored in this workspace session.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[180px] overflow-y-auto pr-2">
              {history.map((item) => (
                <div 
                  key={item.id} 
                  className="group/item flex gap-3 p-2.5 rounded-xl bg-slate-950/40 border border-white/5 hover:border-white/10 transition"
                >
                  <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 border border-white/5 flex items-center justify-center">
                    <img 
                      src={item.image_base64} 
                      alt="Thumbnail" 
                      className="w-full h-full object-cover group-hover/item:scale-105 transition" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-200 truncate select-all italic text-left">
                      "{item.caption}"
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono mt-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {item.timestamp}
                      </span>

                      <div className="flex items-center gap-2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleCopyText(item.caption, item.id)} 
                          title="Copy caption"
                          className="text-slate-400 hover:text-white transition cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                        <button 
                          onClick={() => handleDeleteHistoryRow(item.id)} 
                          title="Delete"
                          className="text-slate-400 hover:text-red-400 transition cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer Info */}
      <footer id="mainframe-footer" className="h-12 shrink-0 border-t border-white/5 bg-slate-950/60 backdrop-blur-md px-6 md:px-10 flex items-center justify-between text-[10px] text-slate-500 mt-auto">
        <div className="flex items-center gap-x-4 font-mono uppercase tracking-widest text-[9px]">
          <span></span>
          <span className="w-1 h-1 bg-white/15 rounded-full"></span>
          {/* <span> {lastProcessedTime ? `${lastProcessedTime}ms` : "N/A"}</span> */}
        </div>
        <div>
          <span className="font-mono text-slate-400">v4.2.0 (Offline Optimized)</span>
        </div>
      </footer>
    </div>
  );
}
