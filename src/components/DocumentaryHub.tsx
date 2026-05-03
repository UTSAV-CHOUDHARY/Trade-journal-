import React, { useState } from 'react';
import { useTrades } from '../context/TradeContext';
import { GlassCard } from './GlassCard';
import { Clapperboard, Play, Zap, History, TrendingUp, TrendingDown, Target, Info, Sparkles, Sword, Shield, Activity, Brain } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { generateTradeDocumentaryScript, DocumentaryScript } from '../services/transformationService';
import { DocumentaryPlayer } from './DocumentaryPlayer';
import { Trade } from '../types';

export const DocumentaryHub: React.FC = () => {
  const { trades } = useTrades();
  const [selectedGenre, setSelectedGenre] = useState('Conversational Analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeScript, setActiveScript] = useState<DocumentaryScript | null>(null);

  const genres = [
    { id: 'Conversational Analysis', label: 'Mentor Mode', icon: Brain },
    { id: 'Technical Breakdown', label: 'Data Review', icon: Activity },
    { id: 'Psychological Insight', label: 'Mindset Check', icon: Target },
    { id: 'Quick Summary', label: 'Briefing', icon: Zap }
  ];

  const handleGenerate = async (trade: Trade) => {
    setIsGenerating(true);
    const script = await generateTradeDocumentaryScript(trade, selectedGenre);
    if (script) {
      setActiveScript(script);
    }
    setIsGenerating(false);
  };

  const blockbuster = trades.reduce((prev, current) => (Math.abs(current.pnl) > Math.abs(prev?.pnl || 0)) ? current : prev, trades[0]);

  return (
    <div className="space-y-6 pb-24">
      <header className="px-2">
        <h1 className="text-4xl font-light font-serif italic text-slate-900 dark:text-white tracking-tight">Trade Cinema</h1>
        <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.4em] mt-1">Cinematic Performance Reconstruction</p>
      </header>

      {activeScript ? (
        <DocumentaryPlayer script={activeScript} onClose={() => setActiveScript(null)} />
      ) : (
        <div className="space-y-8">
          {/* Genre Tabs */}
          <div className="flex gap-2 p-1.5 bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-x-auto no-scrollbar">
             {genres.map(g => {
               const Icon = g.icon;
               const isActive = selectedGenre === g.id;
               return (
                 <button 
                  key={g.id}
                  onClick={() => setSelectedGenre(g.id)}
                  className={cn(
                    "flex-shrink-0 px-6 py-3 rounded-[1.5rem] flex items-center gap-2 transition-all",
                    isActive ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" : "text-slate-500 hover:text-slate-300"
                  )}
                 >
                   <Icon size={14} />
                   <span className="text-[10px] font-black uppercase tracking-widest">{g.label}</span>
                 </button>
               )
             })}
          </div>

          {/* Weekly Blockbuster */}
          {blockbuster && (
             <div className="relative group cursor-pointer" onClick={() => handleGenerate(blockbuster)}>
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 rounded-[3rem]" />
                <img 
                  src={`https://source.unsplash.com/featured/800x400?trading,cinema,${selectedGenre.split(' ')[1]}`} 
                  className="w-full h-56 object-cover rounded-[3rem] filter contrast-[1.1] grayscale group-hover:grayscale-0 transition-all duration-700" 
                />
                <div className="absolute top-4 left-6 z-20 bg-amber-500 text-black text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Global Premiere</div>
                <div className="absolute bottom-6 left-8 z-20 space-y-1">
                   <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.3em]">The Blockbuster</p>
                   <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">The {blockbuster.index} Redemption</h2>
                   <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-2">
                        <Play size={12} className="text-white fill-white" />
                        <span className="text-white text-[10px] font-black uppercase">Watch Feature Film</span>
                      </div>
                      <span className="text-white/40 text-[10px] italic">Based on actual trades</span>
                   </div>
                </div>
                <div className="absolute inset-0 border-2 border-white/5 rounded-[3rem] z-20 group-hover:border-indigo-500/30 transition-colors" />
             </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
               <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Execution Vault</span>
               <History size={14} className="text-slate-700" />
            </div>
            
            {trades.length === 0 ? (
              <div className="text-center py-20 bg-slate-900/20 rounded-[2.5rem] border border-dashed border-white/5">
                <Info size={32} className="mx-auto text-slate-800 mb-2" />
                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">No trades recorded yet</p>
              </div>
            ) : (
              <div className="grid gap-3">
                {trades.map((trade) => (
                  <motion.div
                    key={trade.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleGenerate(trade)}
                    className={cn(
                      "bg-white dark:bg-slate-900/40 rounded-[2rem] border border-slate-200 dark:border-white/5 p-5 flex items-center justify-between group cursor-button transition-all",
                      isGenerating && "opacity-50 pointer-events-none"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-2xl flex items-center justify-center border transition-all group-hover:scale-110",
                        trade.pnl >= 0 
                          ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" 
                          : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                      )}>
                        {trade.pnl >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                      </div>
                      <div>
                        <p className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tighter">{trade.index}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">{trade.date}</span>
                          <span className="text-[8px] px-1.5 py-0.5 bg-slate-800 rounded font-black text-slate-400 uppercase tracking-tighter">{trade.strategy}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                         <p className={cn(
                           "font-black text-base tracking-tighter",
                           trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                         )}>
                            {trade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(trade.pnl).toLocaleString('en-IN')}
                         </p>
                         <p className="text-[8px] text-slate-600 font-bold uppercase tracking-widest">RR {trade.rr}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:bg-indigo-400 transition-colors">
                         {isGenerating ? <Zap size={16} className="text-white animate-spin" /> : <Play size={16} className="text-white" fill="currentColor" />}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
