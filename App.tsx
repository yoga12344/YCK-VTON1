
import React, { useState } from 'react';
import TryOnDemo from './components/TryOnDemo';
import { Gender } from './types';
import { Zap, ChevronRight } from 'lucide-react';

function App() {
  const [currentGender, setCurrentGender] = useState<Gender>('MEN');
  const [showStudio, setShowStudio] = useState(false);

  // Dynamic theme configurations
  const theme = {
    MEN: {
      bg: 'bg-[#020617]',
      accentBg: 'bg-cyan-500',
      accentHover: 'hover:bg-cyan-400',
      orbs: [
        'bg-cyan-500/20',
        'bg-blue-600/10',
        'bg-indigo-500/15'
      ],
      shadow: 'shadow-[0_0_50px_rgba(34,211,238,0.2)]',
      hoverShadow: 'hover:shadow-[0_0_80px_rgba(34,211,238,0.4)]',
      selection: 'selection:bg-cyan-500/30',
      pattern: 'bg-grid-tech'
    },
    WOMEN: {
      bg: 'bg-[#08020a]', // Very dark plum
      accentBg: 'bg-fuchsia-500',
      accentHover: 'hover:bg-fuchsia-400',
      orbs: [
        'bg-fuchsia-500/20',
        'bg-purple-600/15',
        'bg-rose-500/10'
      ],
      shadow: 'shadow-[0_0_50px_rgba(217,70,239,0.2)]',
      hoverShadow: 'hover:shadow-[0_0_80px_rgba(217,70,239,0.4)]',
      selection: 'selection:bg-fuchsia-500/30',
      pattern: 'bg-flow-organic'
    }
  };

  const currentTheme = theme[currentGender];

  if (!showStudio) {
    return (
      <div className={`min-h-screen ${theme.MEN.bg} text-white flex flex-col items-center justify-center p-6 text-center font-sans transition-colors duration-1000 overflow-hidden`}>
        {/* Animated Moving Background "Image" Orbs */}
        <div className={`fixed top-[10%] left-[5%] w-[600px] h-[600px] ${theme.MEN.orbs[0]} rounded-full blur-[140px] pointer-events-none animate-float-1`} />
        <div className={`fixed bottom-[15%] right-[5%] w-[700px] h-[700px] ${theme.MEN.orbs[1]} rounded-full blur-[160px] pointer-events-none animate-float-2`} />

        <div className="max-w-4xl flex flex-col items-center space-y-12 animate-in fade-in zoom-in duration-700 relative z-10">
          <h1 className="text-7xl md:text-[130px] font-black tracking-tighter leading-[0.85] select-none">
            Neural <span className="gradient-text">Try-On.</span>
          </h1>
          
          <div className="space-y-4 max-w-2xl">
            <p className="text-slate-300 text-xl md:text-2xl font-semibold tracking-tight">
              Instant AI draping for modern lifestyles.
            </p>
            <p className="text-slate-500 text-lg md:text-xl font-normal opacity-80">
              High-precision skeletal grounding. Realistic fabric physics.
            </p>
          </div>

          <div className="pt-4 w-full flex justify-center">
            <button 
              onClick={() => setShowStudio(true)}
              className={`group relative flex items-center justify-center gap-3 px-14 py-6 ${theme.MEN.accentBg} ${theme.MEN.accentHover} text-slate-950 rounded-full font-black text-xs uppercase tracking-[0.3em] transition-all ${theme.MEN.shadow} ${theme.MEN.hoverShadow} hover:scale-105 active:scale-95`}
            >
              <Zap className="w-5 h-5 fill-current" />
              Open Studio
            </button>
          </div>
        </div>

        <div className="fixed bottom-12 opacity-30 text-[9px] font-black tracking-[0.8em] uppercase text-slate-600">
          Neural Synthesis Engine • v9.0.2 • CLUSTER ACTIVE
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentTheme.bg} text-white ${currentTheme.selection} font-sans transition-colors duration-1000 relative overflow-hidden`}>
      {/* Dynamic Layered Moving "Images" (Abstract Light Fields) */}
      <div className={`fixed top-[-10%] left-[-5%] w-[800px] h-[800px] ${currentTheme.orbs[0]} rounded-full blur-[160px] pointer-events-none transition-all duration-1000 animate-float-1`} />
      <div className={`fixed bottom-[-10%] right-[-5%] w-[800px] h-[800px] ${currentTheme.orbs[1]} rounded-full blur-[180px] pointer-events-none transition-all duration-1000 animate-float-2`} />
      <div className={`fixed top-[40%] left-[30%] w-[400px] h-[400px] ${currentTheme.orbs[2]} rounded-full blur-[120px] pointer-events-none transition-all duration-1000 animate-float-3 opacity-50`} />
      
      {/* Animated Pattern Overlays */}
      <div className={`fixed inset-0 opacity-20 pointer-events-none ${currentTheme.pattern} transition-all duration-1000`}></div>
      
      {/* Cinematic Grain/Dust Overlay */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      <header className="pt-16 pb-12 flex flex-col items-center relative z-10">
        <button 
          onClick={() => setShowStudio(false)}
          className={`absolute left-6 md:left-12 top-16 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 transition-colors ${currentGender === 'MEN' ? 'hover:text-cyan-400' : 'hover:text-fuchsia-400'}`}
        >
          <ChevronRight className="w-4 h-4 rotate-180" /> Back
        </button>

        <div className="text-center space-y-3">
          <h2 className="text-4xl md:text-6xl font-black tracking-tighter uppercase">
            Neural <span className="gradient-text">Studio</span>
          </h2>
          <div className="flex items-center justify-center gap-4">
            <span className={`w-2 h-2 rounded-full animate-pulse ${currentGender === 'MEN' ? 'bg-cyan-500' : 'bg-fuchsia-500'}`} />
            <p className="text-slate-500 text-[10px] md:text-xs font-bold tracking-[0.4em] uppercase opacity-70">
              Skeletal Alignment & Grounding
            </p>
          </div>
        </div>

        <div className="mt-14 flex bg-slate-900/40 p-1.5 rounded-2xl border border-white/5 shadow-2xl backdrop-blur-xl relative">
          <button 
            onClick={() => setCurrentGender('MEN')}
            className={`px-12 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all relative z-10 ${currentGender === 'MEN' ? 'text-slate-950 bg-cyan-500 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            MEN
          </button>
          <button 
            onClick={() => setCurrentGender('WOMEN')}
            className={`px-12 py-3.5 rounded-xl text-[10px] font-black tracking-widest transition-all relative z-10 ${currentGender === 'WOMEN' ? 'text-slate-950 bg-fuchsia-500 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
          >
            WOMEN
          </button>
        </div>
      </header>

      <main className="pb-32 relative z-10">
        <TryOnDemo genderSelection={currentGender} />
      </main>

      <footer className="py-16 border-t border-white/5 opacity-20 text-center relative z-10">
        <p className="text-[9px] font-bold uppercase tracking-[0.6em] text-slate-500">
          Neural Grounding Engine • Secure Asset Pipeline • © 2025
        </p>
      </footer>
    </div>
  );
}

export default App;
