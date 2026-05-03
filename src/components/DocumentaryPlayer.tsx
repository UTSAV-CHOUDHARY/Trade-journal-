import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize2, Monitor, Clapperboard, Sparkles, TrendingUp, TrendingDown, ArrowLeft, X } from 'lucide-react';
import { DocumentaryScript } from '../services/transformationService';
import { cn } from '../lib/utils';

interface DocumentaryPlayerProps {
  script: DocumentaryScript;
  onClose: () => void;
}

export const DocumentaryPlayer: React.FC<DocumentaryPlayerProps> = ({ script, onClose }) => {
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [showClosing, setShowClosing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const playerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SCENE_DURATION = 12000;

  const speakNarration = (text: string) => {
    if (!text || !window.speechSynthesis) return;
    
    // Stop any ongoing speech and clear timeouts
    window.speechSynthesis.cancel();
    if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);

    if (isMuted) {
      setIsSpeaking(false);
      return;
    }

    const speakNow = () => {
      const utterance = new SpeechSynthesisUtterance(text);
      const voices = window.speechSynthesis.getVoices();
      
      // Highly aggressive Hindi voice matching
      const hindiVoice = 
        voices.find(v => v.lang.includes('hi-IN')) || 
        voices.find(v => v.lang.includes('hi_IN')) ||
        voices.find(v => v.name.toLowerCase().includes('hindi')) ||
        voices.find(v => v.lang.startsWith('hi')) ||
        voices.find(v => v.lang.includes('IN')) ||
        voices[0];
      
      if (hindiVoice) {
        utterance.voice = hindiVoice;
        utterance.lang = hindiVoice.lang || 'hi-IN';
      } else {
        utterance.lang = 'hi-IN';
      }
      
      utterance.pitch = 1.0;
      utterance.rate = 0.9; // Slightly slower for better mobile clarity
      utterance.volume = volume;
      
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => {
        setIsSpeaking(false);
        if (isPlaying && progress >= 90) {
          // Breather before move
          setTimeout(() => {
            if (isPlaying) nextScene();
          }, 1000);
        }
      };
      utterance.onerror = (e) => {
        console.error("Speech Synthesis Error:", e);
        setIsSpeaking(false);
      };

      speechRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    };

    // Mobile fix: Browsers need a gesture context or clear queue
    speakTimeoutRef.current = setTimeout(speakNow, 100);
  };

  const kickstartAudio = () => {
    if (!window.speechSynthesis) return;

    // Direct user action context - essential for mobile unlock
    window.speechSynthesis.cancel();
    
    const silent = new SpeechSynthesisUtterance("");
    silent.volume = 0;
    window.speechSynthesis.speak(silent);
    
    setAudioInitialized(true);
    
    // Initial content narration
    const text = showClosing ? script.closingReflectionHindi : script.scenes[currentSceneIndex].narration;
    setTimeout(() => speakNarration(text), 100);
  };

  const forceAudio = () => {
    window.speechSynthesis.cancel();
    const text = showClosing ? script.closingReflectionHindi : script.scenes[currentSceneIndex].narration;
    speakNarration(text);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      playerRef.current?.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  };

  useEffect(() => {
    const handleVoicesChanged = () => {
      window.speechSynthesis.getVoices();
    };
    
    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
    // Initial call to populate voices list
    window.speechSynthesis.getVoices();

    return () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      if (speakTimeoutRef.current) clearTimeout(speakTimeoutRef.current);
      window.speechSynthesis.cancel();
    };
  }, []);

  useEffect(() => {
    if (isPlaying && audioInitialized) {
      if (showClosing) {
        speakNarration(script.closingReflectionHindi);
      } else if (script?.scenes?.[currentSceneIndex]) {
        speakNarration(script.scenes[currentSceneIndex].narration);
      }
    } else if (!isPlaying) {
      window.speechSynthesis.cancel();
    }
  }, [currentSceneIndex, isPlaying, isMuted, volume, showClosing, audioInitialized]);

  useEffect(() => {
    if (isPlaying) {
      const interval = 50;
      const steps = SCENE_DURATION / interval;
      
      timerRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            // Wait for voice to finish if sound is on
            if (!isMuted && isSpeaking) {
               return 100;
            }
            // Otherwise transition
            nextScene();
            return 0;
          }
          return prev + (100 / steps);
        });
      }, interval);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      window.speechSynthesis.cancel();
    };
  }, [isPlaying, currentSceneIndex, script.scenes.length, showClosing, isMuted, isSpeaking]);

  const nextScene = () => {
    if (!audioInitialized) setAudioInitialized(true);
    if (showClosing) return;
    if (script?.scenes && currentSceneIndex < script.scenes.length - 1) {
      setCurrentSceneIndex(i => i + 1);
      setProgress(0);
    } else if (currentSceneIndex === script.scenes.length - 1) {
      setShowClosing(true);
      setProgress(0);
    }
  };

  const prevScene = () => {
    if (!audioInitialized) setAudioInitialized(true);
    if (showClosing) {
      setShowClosing(false);
      setCurrentSceneIndex(script.scenes.length - 1);
      setProgress(0);
      return;
    }
    if (currentSceneIndex > 0) {
      setCurrentSceneIndex(i => i - 1);
      setProgress(0);
    }
  };

  if (!script || !script.scenes || script.scenes.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center">
        <div className="text-center space-y-4">
          <Clapperboard size={48} className="text-indigo-500 mx-auto animate-pulse" />
          <p className="text-white font-black uppercase tracking-widest text-xs">Awaiting Masterpiece...</p>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors uppercase text-[10px] font-bold">Close</button>
        </div>
      </div>
    );
  }

  const currentScene = script.scenes[currentSceneIndex];

  if (!currentScene) return null;

  return (
    <div ref={playerRef} className="fixed inset-0 z-[100] bg-black flex flex-col font-sans overflow-hidden">
      {/* Film Grain & Texture Overlays */}
      <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] animate-grain bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute inset-0 pointer-events-none z-[55] opacity-[0.08] pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />
      <div className="absolute inset-0 pointer-events-none z-40 opacity-20 bg-gradient-to-t from-black via-transparent to-black" />
      
      {/* Cinematic Borders (Vignette) */}
      <div className="absolute inset-0 pointer-events-none z-40 shadow-[inset_0_0_200px_rgba(0,0,0,1)]" />

      {/* Header Info */}
      <div className="absolute top-0 left-0 right-0 p-8 z-50 flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
             <div className="w-4 h-4 bg-rose-500 rounded-full animate-pulse" />
             <span className="text-white font-black text-sm uppercase tracking-[0.4em]">REC • TRADING_HISTORIC_FILM</span>
          </div>
          <h2 className="text-white/60 text-xs font-black uppercase tracking-[0.6em]">{script.title}</h2>
        </div>
        <button 
          onClick={onClose}
          className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 flex items-center justify-center text-white transition-all active:scale-90"
        >
          <X size={24} />
        </button>
      </div>

      {/* Main Visual Arena */}
      <div className="flex-1 relative flex flex-col items-center justify-center text-center p-6 md:p-20 overflow-hidden">
        <AnimatePresence mode="wait">
            <motion.div
              key={showClosing ? 'closing' : currentSceneIndex}
              initial={{ opacity: 0, scale: 1.1, filter: 'blur(20px) contrast(1.5)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px) contrast(1.1)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(20px) contrast(1.5)' }}
              transition={{ duration: 2.5, ease: [0.22, 1, 0.36, 1] }}
              className="absolute inset-0 overflow-hidden"
            >
              <div className="absolute inset-0 bg-black/50 z-10" />
              <motion.img 
                key={`${currentSceneIndex}-img`}
                initial={{ scale: 1, x: 0 }}
                animate={{ 
                  scale: [1, 1.15],
                  x: [0, currentSceneIndex % 2 === 0 ? 30 : -30],
                  y: [0, currentSceneIndex % 2 === 0 ? -10 : 10]
                }}
                transition={{ duration: 15, ease: "linear", repeat: Infinity, repeatType: "alternate" }}
                src={`https://source.unsplash.com/featured/1600x900?${encodeURIComponent((showClosing ? script.closingReflectionEnglish : currentScene.visualHint) + ',cinematic,illustration,octane-render')}`}
                alt=""
                className="w-full h-full object-cover filter brightness-[0.6] saturate-[1.1]"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://images.unsplash.com/photo-1611974717537-4d048d884871?auto=format&fit=crop&w=1600&q=80`;
                }}
              />
            </motion.div>
        </AnimatePresence>

      {/* Cinematic Cartoon Avatar (The Narrator/Man Character) */}
      <div className="absolute bottom-10 left-10 z-[60] scale-90 md:scale-125 origin-bottom-left transition-all">
         <motion.div
           initial={{ x: -200, opacity: 0 }}
           animate={{ x: 0, opacity: 1 }}
           transition={{ type: 'spring', damping: 20 }}
           className="relative"
         >
            {/* Thought/Speech Bubble for On-Screen English Context */}
            <AnimatePresence mode="wait">
              <motion.div
                key={showClosing ? 'closing-text' : currentSceneIndex}
                initial={{ opacity: 0, scale: 0.5, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5, y: 20 }}
                className="absolute -top-16 left-24 bg-white text-black font-black text-[10px] px-4 py-2 rounded-2xl rounded-bl-none shadow-2xl whitespace-nowrap border-2 border-indigo-500"
              >
                {showClosing ? "FINAL TAKEAWAY" : currentScene.onScreenText}
              </motion.div>
            </AnimatePresence>

            <div className="w-56 h-72 relative bg-gradient-to-t from-indigo-950 to-transparent rounded-b-full overflow-hidden border-2 border-white/10 shadow-[0_0_100px_rgba(79,70,229,0.2)]">
               <div className="absolute inset-0 flex items-center justify-center p-4">
                  <motion.img 
                    animate={isPlaying ? { 
                      y: [0, -5, 0],
                      scale: [1, 1.02, 1]
                    } : {}}
                    transition={{ repeat: Infinity, duration: 2 }}
                    src="https://api.dicebear.com/7.x/avataaars/svg?seed=trader-guru&baseColor=f59e0b&clothing=blazer&hair=shortHair&eyes=surprised&mouth=concerned&top=shortHair" 
                    alt="Narrator"
                    className="w-full h-full object-contain filter drop-shadow-2xl"
                  />
               </div>
               {/* Voice Visualization */}
               {(isSpeaking || (isPlaying && !isMuted)) && (
                 <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-end gap-1.5 h-10">
                   {[...Array(8)].map((_, i) => (
                     <motion.div
                       key={i}
                       animate={isSpeaking ? { 
                         height: [8, Math.random() * 30 + 10, 8],
                         backgroundColor: ['#818cf8', '#6366f1', '#818cf8']
                       } : { height: 4 }}
                       transition={{ repeat: Infinity, duration: 0.3 + Math.random() * 0.4 }}
                       className="w-1.5 bg-indigo-400 rounded-full"
                     />
                   ))}
                 </div>
               )}
            </div>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-black border border-white/20 text-white text-[9px] font-black px-4 py-1.5 rounded-full shadow-2xl tracking-widest flex items-center gap-2 whitespace-nowrap">
               <span className={cn("w-2 h-2 rounded-full", isSpeaking ? "bg-emerald-500 animate-pulse" : "bg-rose-500")} />
               {isSpeaking ? "AI NARRATOR ACTIVE" : "WAITING FOR NARRATION"}
            </div>
            {!isSpeaking && isPlaying && !isMuted && audioInitialized && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={forceAudio}
                className="absolute -bottom-16 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl hover:bg-white/20 hover:scale-105 active:scale-95 transition-all"
              >
                Sync Voice
              </motion.button>
            )}

            {!audioInitialized && (
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 className="absolute inset-0 z-[100] bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center gap-6"
               >
                 <motion.button
                   whileHover={{ scale: 1.05 }}
                   whileTap={{ scale: 0.95 }}
                   onClick={kickstartAudio}
                   className="flex flex-col items-center gap-4 group"
                 >
                   <div className="w-20 h-20 rounded-full bg-indigo-500 flex items-center justify-center animate-pulse shadow-[0_0_40px_rgba(99,102,241,0.4)] group-hover:shadow-[0_0_60px_rgba(99,102,241,0.6)] transition-all">
                     <Volume2 size={40} className="text-white" />
                   </div>
                   <div className="text-center">
                     <p className="text-white font-black text-lg tracking-widest uppercase">Tap to Play Audio</p>
                     <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1">Browser requires interaction for Narrator</p>
                   </div>
                 </motion.button>
               </motion.div>
            )}
         </motion.div>
      </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={showClosing ? 'closing' : currentSceneIndex}
            initial={{ opacity: 0, y: 60, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -60, scale: 1.1 }}
            transition={{ duration: 1.5, delay: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative z-20 max-w-5xl space-y-12"
          >
            {/* Playful/Historic Cartoon Style Icon */}
            <div className="mx-auto w-40 h-40 rounded-[3rem] bg-black/40 border border-white/20 flex items-center justify-center backdrop-blur-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] relative">
               <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/30 to-transparent rounded-[3rem]" />
               {showClosing ? (
                  <motion.div animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }} transition={{ repeat: Infinity, duration: 4 }}>
                    <Sparkles size={80} className="text-amber-400" />
                  </motion.div>
               ) : currentScene.sentiment === 'positive' ? (
                 <motion.div animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 3 }}>
                   <TrendingUp size={80} className="text-emerald-400 drop-shadow-[0_0_20px_rgba(52,211,153,0.5)]" />
                 </motion.div>
               ) : currentScene.sentiment === 'negative' ? (
                 <motion.div animate={{ y: [0, 10, -10, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                   <TrendingDown size={80} className="text-rose-400 drop-shadow-[0_0_20px_rgba(251,113,133,0.5)]" />
                 </motion.div>
               ) : (
                 <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 4 }}>
                   <Sparkles size={80} className="text-amber-400" />
                 </motion.div>
               )}
            </div>

            {/* Narration Text (ENGLISH ON SCREEN) */}
            <div className="space-y-6">
              <motion.h3 
                layoutId="onScreenText"
                className="text-4xl md:text-9xl font-black text-white italic uppercase tracking-tighter leading-[0.8] px-6 drop-shadow-[0_20px_40px_rgba(0,0,0,1)] font-sans"
              >
                {showClosing ? script.closingReflectionEnglish : currentScene.onScreenText}
              </motion.h3>
              <div className="flex items-center justify-center gap-8">
                 <div className="h-px w-24 bg-gradient-to-r from-transparent to-white/20" />
                 <p className="text-[14px] text-white/50 font-black uppercase tracking-[1em] italic flex items-center gap-3">
                   <Monitor size={14} className="text-indigo-400 animate-pulse" />
                   {showClosing ? "FINAL VERDICT" : `RECONSTRUCTION PT.${currentSceneIndex + 1}`}
                 </p>
                 <div className="h-px w-24 bg-gradient-to-l from-transparent to-white/20" />
              </div>
            </div>

            {/* Dynamic Metric */}
            {!showClosing && currentScene.metric && (
              <motion.div 
                initial={{ opacity: 0, scale: 0, rotate: -5 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                transition={{ delay: 1.5, type: 'spring', damping: 10 }}
                className={cn(
                  "inline-flex items-center gap-6 px-12 py-6 rounded-[2.5rem] border backdrop-blur-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700",
                  currentScene.sentiment === 'positive' ? "bg-emerald-500/10 border-emerald-500/40" : "bg-rose-500/10 border-rose-500/40"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full animate-ping",
                  currentScene.sentiment === 'positive' ? "bg-emerald-400" : "bg-rose-400"
                )} />
                <span className={cn(
                  "text-5xl md:text-7xl font-black font-mono tracking-tighter",
                  currentScene.sentiment === 'positive' ? "text-emerald-400" : "text-rose-400"
                )}>
                  {currentScene.metric}
                </span>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="relative z-10 p-12 bg-gradient-to-top from-black via-black/80 to-transparent">
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Progress Bars */}
          <div className="flex gap-2">
            {script.scenes.map((_, idx) => (
              <div key={idx} className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className={cn(
                    "h-full transition-all duration-150",
                    (idx < currentSceneIndex || showClosing) ? "bg-white/60" : idx === currentSceneIndex ? "bg-indigo-500" : "bg-transparent"
                  )}
                  style={{ 
                    width: (!showClosing && idx === currentSceneIndex) ? `${progress}%` : (idx < currentSceneIndex || showClosing) ? '100%' : '0%' 
                  }}
                />
              </div>
            ))}
            <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-150",
                  showClosing ? "bg-indigo-500" : "bg-transparent"
                )}
                style={{ width: showClosing ? `${progress}%` : '0%' }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-6">
                <button onClick={prevScene} className="text-white/40 hover:text-white transition-colors">
                  <SkipBack size={24} />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-16 h-16 bg-white text-black rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-xl shadow-white/10"
                >
                  {isPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                </button>
                <button onClick={nextScene} className="text-white/40 hover:text-white transition-colors">
                  <SkipForward size={24} />
                </button>
             </div>

             <div className="flex items-center gap-6 text-white/40">
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setIsMuted(!isMuted)}
                    className={cn("transition-colors hover:text-white", isMuted ? "text-rose-500" : "text-indigo-400")}
                  >
                    <Volume2 size={24} />
                  </button>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.1" 
                    value={volume}
                    onChange={(e) => setVolume(parseFloat(e.target.value))}
                    className="w-20 accent-indigo-500 cursor-pointer"
                  />
                </div>
                <button onClick={toggleFullscreen} className="hover:text-white transition-colors">
                   <Maximize2 size={24} />
                </button>
                <Monitor size={20} />
             </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/5">
             <div className="flex items-center gap-2">
                <Clapperboard size={14} className="text-indigo-400" />
                <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{currentSceneIndex + 1} / {script.scenes.length} Scenes Recorded</span>
             </div>
             <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest italic animate-pulse">Historic Hindi Narration Active</p>
          </div>
        </div>
      </div>
    </div>
  );
};
