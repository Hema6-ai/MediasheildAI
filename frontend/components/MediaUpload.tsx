"use client";
import { useState, useRef, DragEvent } from "react";
import { Upload, FileImage, X } from "lucide-react";

interface Props {
  onAnalyze: (file: File, platform: string) => void;
  loading: boolean;
}

const PLATFORMS = ["YouTube", "Twitter", "TikTok", "Instagram", "Unknown"];

export function MediaUpload({ onAnalyze, loading }: Props) {
  const [dragging, setDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [platform, setPlatform] = useState("Unknown");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleSubmit = () => {
    if (file) onAnalyze(file, platform);
  };

  return (
    <div className="panel soft-ring p-6 space-y-4 tilt-card">
      <h2 className="font-semibold text-white flex items-center gap-2">
        <Upload className="w-4 h-4 text-cyan-400" /> Upload Media for Analysis
      </h2>

      {/* Drop zone */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-all ${
          dragging ? "border-cyan-400 bg-cyan-500/8" : "border-white/15 hover:border-white/30"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input ref={inputRef} type="file" accept="image/*,video/*" className="hidden" onChange={handleFile} />
        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileImage className="w-8 h-8 text-cyan-400" />
            <div className="text-left">
              <p className="text-white font-medium text-sm">{file.name}</p>
              <p className="text-slate-500 text-xs">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button className="ml-2 text-slate-500 hover:text-red-400 transition-colors"
              onClick={(e) => { e.stopPropagation(); setFile(null); }}>
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div>
            <Upload className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">Drop an image or video here</p>
            <p className="text-slate-600 text-xs mt-1">or click to browse</p>
          </div>
        )}
      </div>

      {/* Platform selector */}
      <div className="flex items-center gap-3">
        <label className="text-xs text-slate-400 shrink-0">Source Platform:</label>
        <select
          value={platform}
          onChange={(e) => setPlatform(e.target.value)}
          className="flex-1 bg-white/8 border border-white/15 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500/50"
        >
          {PLATFORMS.map((p) => <option key={p} value={p} className="bg-gray-900">{p}</option>)}
        </select>
      </div>

      <button
        disabled={!file || loading}
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/40"
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Analyzing media...
          </>
        ) : "Analyze Media →"}
      </button>
    </div>
  );
}
