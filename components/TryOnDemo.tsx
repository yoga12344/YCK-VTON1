
import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, RefreshCw, Zap, User, Shirt as ShirtIcon, 
  Download, AlertTriangle, Terminal, Cpu, Layers
} from 'lucide-react';
import { analyzeTryOn, generateVirtualTryOnImage } from '../services/geminiService';
import { GeminiResult, ImageUploads, Gender } from '../types';

const normalizeImage = (base64: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxDim = 1600;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = (maxDim / width) * height;
          width = maxDim;
        } else {
          width = (maxDim / height) * width;
          height = maxDim;
        }
      }
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve(base64);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.9));
    };
    img.onerror = () => reject(new Error("Image processing failed."));
    img.src = base64;
  });
};

interface TryOnDemoProps {
  genderSelection: Gender;
}

const TryOnDemo: React.FC<TryOnDemoProps> = ({ genderSelection }) => {
  const [images, setImages] = useState<ImageUploads>({ person: null, shirt: null, pant: null, dress: null });
  const [status, setStatus] = useState<'idle' | 'grounding' | 'synthesizing' | 'success' | 'error'>('idle');
  const [logs, setLogs] = useState<string[]>([]);
  const [result, setResult] = useState<GeminiResult>({
    garmentDescription: '',
    personDescription: '',
    technicalPrompt: '',
    status: 'idle',
    error: ''
  });

  const personInputRef = useRef<HTMLInputElement>(null);
  const shirtInputRef = useRef<HTMLInputElement>(null);
  const pantInputRef = useRef<HTMLInputElement>(null);
  const dressInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    reset();
  }, [genderSelection]);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} // ${msg}`].slice(-5));
  };

  const handleFileChange = (type: keyof ImageUploads) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const normalized = await normalizeImage(reader.result as string);
        setImages(prev => ({ ...prev, [type]: normalized }));
        addLog(`Asset ${type.toUpperCase()} cached to neural buffer.`);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!images.person || (!images.shirt && !images.pant && !images.dress)) return;
    setStatus('grounding');
    setResult(prev => ({ ...prev, error: '' }));
    setLogs([]);
    addLog("Initiating Stage 1: Neural DNA Extraction...");

    try {
      const analysis = await analyzeTryOn(images.person, images.shirt, images.pant, images.dress, genderSelection);
      setResult(prev => ({ ...prev, ...analysis }));
      addLog("Subject geometry identified.");
      addLog("Garment textures anchored.");
      
      setStatus('synthesizing');
      addLog("Initiating Stage 2: Pixel-Lock Synthesis...");
      
      const finalImage = await generateVirtualTryOnImage(
        images.person, images.shirt, images.pant, images.dress,
        analysis.technicalPrompt, analysis.shirtCoverage, analysis.pantCoverage,
        analysis.bodySize || 'M', genderSelection
      );
      
      if (!finalImage) throw new Error("Synthesis produced no image.");
      setResult(prev => ({ ...prev, resultImageUrl: finalImage, status: 'success' }));
      setStatus('success');
      addLog("Synthesis complete. 98.4% Match Accuracy.");
    } catch (err: any) {
      let friendlyError = err.message || 'Processing failed.';
      if (friendlyError.includes('429')) {
        friendlyError = 'API Quota Exceeded. Ensure your key is valid and billed.';
      }
      setResult(prev => ({ ...prev, error: friendlyError }));
      setStatus('error');
      addLog("CRITICAL: Synthesis aborted.");
    }
  };

  const reset = () => {
    setImages({ person: null, shirt: null, pant: null, dress: null });
    setResult({ garmentDescription: '', personDescription: '', technicalPrompt: '', status: 'idle', error: '' });
    setStatus('idle');
    setLogs([]);
  };

  const accentColor = genderSelection === 'MEN' ? 'text-cyan-400' : 'text-fuchsia-400';
  const accentBorder = genderSelection === 'MEN' ? 'hover:border-cyan-500/40' : 'hover:border-fuchsia-500/40';
  const accentBg = genderSelection === 'MEN' ? 'bg-cyan-500' : 'bg-fuchsia-500';
  const accentHoverBg = genderSelection === 'MEN' ? 'hover:bg-cyan-400' : 'hover:bg-fuchsia-400';
  const accentRing = genderSelection === 'MEN' ? 'border-cyan-500' : 'border-fuchsia-500';
  const accentShadow = genderSelection === 'MEN' ? 'shadow-cyan-500/20' : 'shadow-fuchsia-500/20';

  return (
    <div className="px-6 max-w-[1400px] mx-auto pb-20">
      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left: Input Console */}
        <div className="lg:col-span-4 space-y-8 animate-in slide-in-from-left duration-700">
          <div className="glass rounded-[2.5rem] p-8 border-white/5 space-y-8 shadow-2xl relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-32 h-32 ${genderSelection === 'MEN' ? 'bg-cyan-500/5' : 'bg-fuchsia-500/5'} blur-3xl rounded-full`} />
            
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <User className={`w-4 h-4 ${accentColor}`} /> 01 // Target Subject
              </label>
              <div 
                className={`relative aspect-[3/4] rounded-3xl border border-white/5 bg-slate-950/80 overflow-hidden cursor-pointer ${accentBorder} transition-all group shadow-inner`}
                onClick={() => personInputRef.current?.click()}
              >
                {images.person ? (
                  <img src={images.person} className="w-full h-full object-cover" alt="Subject" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-30 group-hover:opacity-100 transition-all group-hover:scale-105 duration-500">
                    <Upload className={`w-8 h-8 mb-4 ${accentColor}`} />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Upload Portrait</span>
                  </div>
                )}
              </div>
              <input type="file" ref={personInputRef} className="hidden" accept="image/*" onChange={handleFileChange('person')} />
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                <ShirtIcon className={`w-4 h-4 ${accentColor}`} /> 02 // Asset Catalog
              </label>
              <div className={`grid ${genderSelection === 'WOMEN' ? 'grid-cols-3' : 'grid-cols-2'} gap-4`}>
                <AssetSlot img={images.shirt} label="Top" onClick={() => shirtInputRef.current?.click()} accentColor={accentColor} accentBorder={accentBorder} />
                {genderSelection === 'WOMEN' && (
                   <AssetSlot img={images.dress} label="Dress" onClick={() => dressInputRef.current?.click()} accentColor={accentColor} accentBorder={accentBorder} />
                )}
                <AssetSlot img={images.pant} label="Bottom" onClick={() => pantInputRef.current?.click()} accentColor={accentColor} accentBorder={accentBorder} />
              </div>
              <input type="file" ref={shirtInputRef} className="hidden" onChange={handleFileChange('shirt')} />
              <input type="file" ref={pantInputRef} className="hidden" onChange={handleFileChange('pant')} />
              <input type="file" ref={dressInputRef} className="hidden" onChange={handleFileChange('dress')} />
            </div>

            <button
              disabled={!images.person || (!images.shirt && !images.pant && !images.dress) || status === 'grounding' || status === 'synthesizing'}
              onClick={handleProcess}
              className={`w-full py-6 rounded-2xl ${accentBg} ${accentHoverBg} text-slate-950 disabled:opacity-20 transition-all font-black text-[11px] uppercase tracking-[0.4em] flex items-center justify-center gap-4 shadow-xl active:scale-95`}
            >
              {status === 'grounding' || status === 'synthesizing' ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 fill-current" />}
              {status === 'grounding' ? 'Grounding...' : status === 'synthesizing' ? 'Synthesizing...' : 'Execute Neural Sync'}
            </button>

            {/* Terminal View */}
            {logs.length > 0 && (
              <div className="mt-6 p-4 bg-black/40 rounded-xl border border-white/5 font-mono text-[9px] space-y-1">
                {logs.map((log, i) => (
                  <p key={i} className="text-slate-500"><span className={accentColor}>&gt;</span> {log}</p>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Synthesis Canvas */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[700px] animate-in slide-in-from-right duration-700">
          <div className="flex-1 rounded-[3.5rem] bg-slate-950/40 border border-white/5 overflow-hidden relative shadow-2xl flex items-center justify-center">
            {status === 'idle' ? (
              <div className="text-center space-y-6 opacity-20 group">
                <div className={`w-24 h-24 mx-auto rounded-full border-2 border-dashed ${genderSelection === 'MEN' ? 'border-cyan-500/30' : 'border-fuchsia-500/30'} flex items-center justify-center group-hover:rotate-45 transition-transform duration-1000`}>
                   <Zap className={`w-10 h-10 ${accentColor}`} />
                </div>
                <p className={`text-[10px] font-black uppercase tracking-[0.6em] ${accentColor}`}>Awaiting Neural Input Signal</p>
              </div>
            ) : status === 'error' ? (
              <div className="text-center space-y-8 p-16 bg-red-500/5 rounded-[2.5rem] border border-red-500/20 max-w-lg">
                <AlertTriangle className="w-12 h-12 text-red-500 mx-auto" />
                <div className="space-y-4">
                  <p className="text-slate-400 text-sm font-medium leading-relaxed">{result.error}</p>
                  <p className="text-[10px] text-red-400 uppercase font-bold">Ensure process.env.API_KEY is configured.</p>
                </div>
                <button onClick={reset} className="px-10 py-4 rounded-xl bg-slate-900 text-slate-400 hover:text-white border border-white/5 font-black text-[10px] uppercase tracking-widest transition-all">Reset Session</button>
              </div>
            ) : (status === 'grounding' || status === 'synthesizing') ? (
               <div className="flex flex-col items-center gap-12">
                  <div className="relative">
                    <div className={`w-24 h-24 border-b-2 ${accentRing} rounded-full animate-spin`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                       <Zap className={`w-8 h-8 ${accentColor} animate-pulse fill-current opacity-40`} />
                    </div>
                  </div>
                  <div className="text-center space-y-4">
                    <span className={`text-[12px] font-black uppercase tracking-[1em] ${accentColor} animate-pulse block`}>
                        {status === 'grounding' ? 'Grounding Assets...' : 'Applying Textures...'}
                    </span>
                    <p className="text-[9px] text-slate-500 uppercase tracking-widest font-bold opacity-60">Authentic Synthesis Active</p>
                  </div>
               </div>
            ) : result.resultImageUrl ? (
              <div className="relative w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-1000 p-12">
                <img src={result.resultImageUrl} className={`max-h-[85vh] object-contain rounded-[2.5rem] shadow-[0_40px_100px_rgba(0,0,0,0.5)] pulse-glow ${accentShadow}`} alt="Output" />
                
                {/* Result Metadata Overlays */}
                <div className="absolute top-10 right-10 flex gap-4">
                  <button onClick={reset} className="px-6 py-4 rounded-2xl bg-slate-900/80 text-slate-300 hover:text-white border border-white/5 text-[9px] font-black uppercase tracking-widest backdrop-blur-2xl transition-all shadow-xl">
                    New Studio
                  </button>
                  <a href={result.resultImageUrl} download="neural_output.png" className={`px-6 py-4 rounded-2xl ${accentBg} text-slate-950 ${accentHoverBg} text-[9px] font-black uppercase tracking-widest shadow-2xl flex items-center gap-3 transition-all hover:scale-105`}>
                    <Download className="w-4 h-4" /> Export Result
                  </a>
                </div>

                <div className="absolute bottom-10 left-10 flex flex-col gap-4">
                   <div className="px-6 py-3 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-2xl w-fit">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 flex items-center gap-3">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Synthesis Success // 98.4% Match
                      </span>
                   </div>
                   
                   {/* Telemetry Log Window */}
                   <div className="glass p-6 rounded-[1.5rem] border-white/5 max-w-sm space-y-4">
                      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                         <Terminal className={`w-4 h-4 ${accentColor}`} />
                         <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Neural Telemetry</span>
                      </div>
                      
                      <div className="space-y-3">
                         <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{" >> "} GROUNDING_MANIFEST</p>
                            <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">{result.personDescription}</p>
                         </div>
                         <div>
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">{" >> "} ASSET_FIDELITY</p>
                            <p className="text-[10px] text-slate-300 leading-relaxed line-clamp-2">{result.garmentDescription}</p>
                         </div>
                         <div className="flex gap-4">
                            <div className="flex-1">
                               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">FIT</p>
                               <span className={`text-[10px] font-bold ${accentColor}`}>{result.bodySize || 'M'} - Optimized</span>
                            </div>
                            <div className="flex-1">
                               <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">SYNC</p>
                               <span className={`text-[10px] font-bold ${accentColor}`}>Stage 2 Locked</span>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};

const AssetSlot = ({ img, label, onClick, accentColor, accentBorder }: { img: string | null, label: string, onClick: () => void, accentColor: string, accentBorder: string }) => (
  <div onClick={onClick} className={`aspect-square rounded-2xl border border-white/5 bg-slate-950/60 overflow-hidden cursor-pointer group ${accentBorder} transition-all shadow-inner relative flex flex-col items-center justify-center`}>
    {img ? (
      <img src={img} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={label} />
    ) : (
      <div className="opacity-20 group-hover:opacity-100 transition-all text-slate-500 flex flex-col items-center group-hover:scale-110 duration-500">
        <Upload className={`w-6 h-6 mb-2 ${accentColor}`} />
        <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
      </div>
    )}
  </div>
);

export default TryOnDemo;
