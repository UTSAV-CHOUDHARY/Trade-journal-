import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { 
  TrendingUp, 
  TrendingDown, 
  Filter, 
  Search, 
  Calendar, 
  ChevronRight, 
  MoreHorizontal, 
  Edit3, 
  Trash2, 
  Clock, 
  Target, 
  Info, 
  Crosshair,
  Share2
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";
import { useState } from "react";
import { StrategyType, Trade } from "../types";

export const TradeHistory = ({ onEdit }: { onEdit: (trade: Trade) => void }) => {
  const { trades, deleteTrade } = useTrades();
  const [filterStrategy, setFilterStrategy] = useState<StrategyType | 'All'>('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);

  const shareTrade = async (trade: Trade) => {
    const text = `Trade Report: ${trade.strategy} on ${trade.index}\nType: ${trade.type}\nPnL: ₹${trade.pnl.toLocaleString('en-IN')}\nRR: ${trade.rr}:1\nMood: ${trade.mood}\nLogged on Terminal v2.0`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Alpha Trade Execution',
          text: text,
        });
      } catch (err) {
        console.error('Error sharing:', err);
      }
    } else {
      navigator.clipboard.writeText(text);
      // Small feedback would be nice, but to keep it simple I'll just use a native alert for now as requested "functional"
      alert('Trade details copied to clipboard!');
    }
  };

  const filteredTrades = trades.filter(t => {
    const matchesStrategy = filterStrategy === 'All' || t.strategy === filterStrategy;
    const matchesSearch = t.notes.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          t.strategy.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.index.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStrategy && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-24 relative">
      <header className="px-2">
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Alpha Ledger <span className="text-indigo-500 not-italic">India</span></h1>
        <p className="text-slate-500 font-medium text-xs uppercase tracking-widest">Historical Performance Log</p>
      </header>

      <div className="flex gap-3 px-2 overflow-x-auto no-scrollbar py-2">
        {['All', 'Scalping', 'Intraday', 'Swing'].map((s) => (
          <button
            key={s}
            onClick={() => setFilterStrategy(s as any)}
            className={cn(
              "px-5 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all",
              filterStrategy === s 
                ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20" 
                : "bg-slate-900/60 text-slate-500 border border-white/5"
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="relative px-2">
        <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600" />
        <input
          type="text"
          placeholder="Filter by setup, index, or notes..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="w-full bg-slate-900/60 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-medium text-sm"
        />
      </div>

      <div className="space-y-4 px-2">
        <AnimatePresence mode="popLayout">
          {filteredTrades.length === 0 ? (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-20 text-center flex flex-col items-center"
            >
               <div className="w-16 h-16 bg-slate-900 rounded-3xl flex items-center justify-center mb-4 text-slate-700">
                  <Search size={32} />
               </div>
               <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No matching sessions found</p>
            </motion.div>
          ) : (
            filteredTrades.map((trade, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8, x: -50 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                key={trade.id}
                onClick={() => setSelectedTrade(trade)}
              >
              <GlassCard className="p-5 group relative overflow-hidden transition-all hover:bg-white/5 active:scale-[0.98]">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center shadow-2xl transition-transform group-hover:scale-110",
                      trade.pnl >= 0 ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                    )}>
                      {trade.type === 'Buy' ? <TrendingUp size={28} /> : <TrendingDown size={28} />}
                    </div>
                    <div>
                      <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-lg leading-none mb-1 italic">{trade.strategy}</h4>
                      <div className="flex items-center gap-2">
                         <span className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">{trade.index}</span>
                         <span className="w-1 h-1 bg-slate-400 dark:bg-slate-700 rounded-full" />
                         <span className="text-slate-500 text-[10px] font-bold uppercase">{new Date(trade.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-xl font-black tracking-tighter leading-none mb-1",
                      trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {trade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(trade.pnl).toLocaleString('en-IN')}
                    </p>
                    <span className="bg-slate-800/80 text-white text-[9px] px-2 py-0.5 rounded-md font-black tracking-widest border border-white/5">
                      RR {trade.rr}:1
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between mt-3">
                   <div className="flex flex-wrap gap-1">
                      {trade.mistakes.slice(0, 2).map(m => (
                        <span key={m} className="text-[8px] text-rose-400 bg-rose-400/10 px-1.5 py-0.5 rounded border border-rose-400/10 font-bold uppercase">{m}</span>
                      ))}
                      {trade.mistakes.length > 2 && <span className="text-[8px] text-slate-500 font-bold">+{trade.mistakes.length - 2}</span>}
                   </div>
                   <div className="flex items-center gap-1 text-slate-500 group-hover:text-indigo-400 transition-colors">
                      <span className="text-[9px] font-black uppercase tracking-widest">Detail Summary</span>
                      <ChevronRight size={14} />
                   </div>
                </div>
              </GlassCard>
            </motion.div>
          ))
          )}
        </AnimatePresence>
      </div>

      {/* Trade Summary Overlay */}
      <AnimatePresence>
        {selectedTrade && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-white/20 dark:bg-slate-950/80 backdrop-blur-md flex items-end justify-center p-4 pb-20"
            onClick={() => setSelectedTrade(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-t-[40px] p-8 shadow-[0_-20px_50px_rgba(0,0,0,0.1)] dark:shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-12 h-1.5 bg-slate-400 dark:bg-slate-800 rounded-full mx-auto mb-6" />
              
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-2 uppercase tracking-tighter italic">{selectedTrade.strategy}</h3>
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1 text-indigo-400 text-xs font-black uppercase tracking-widest">
                       {selectedTrade.index}
                    </span>
                    <span className={cn(
                      "px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest",
                      selectedTrade.type === 'Buy' ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                    )}>
                      {selectedTrade.type}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                   <p className={cn(
                      "text-3xl font-black tracking-tighter leading-none mb-1",
                      selectedTrade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {selectedTrade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(selectedTrade.pnl).toLocaleString('en-IN')}
                    </p>
                    <p className="text-slate-500 text-xs font-bold uppercase">{new Date(selectedTrade.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-8">
                 <div className="bg-slate-500/5 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Clock size={12}/> Chronology</p>
                    <p className="text-slate-900 dark:text-white text-xs font-bold">Entry: {selectedTrade.entryTime}</p>
                    <p className="text-slate-900 dark:text-white text-xs font-bold">Exit: {selectedTrade.exitTime}</p>
                 </div>
                 <div className="bg-slate-500/5 dark:bg-slate-800/40 p-4 rounded-3xl border border-slate-200 dark:border-white/5">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1"><Crosshair size={12}/> Target Data</p>
                    <p className="text-slate-900 dark:text-white text-xs font-bold">SL: {selectedTrade.sl}</p>
                    <p className="text-slate-900 dark:text-white text-xs font-bold">Target: {selectedTrade.tp}</p>
                 </div>
              </div>

              {selectedTrade.screenshot && (
                <div className="mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-lg">
                   <img src={selectedTrade.screenshot} className="w-full object-cover max-h-48" />
                </div>
              )}

              <div className="space-y-4 mb-8">
                 <div className="bg-indigo-500/5 p-4 rounded-3xl border border-indigo-500/10">
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Psychology - {selectedTrade.mood}</p>
                    <p className="text-slate-300 text-sm leading-relaxed italic">"{selectedTrade.notes || "No psychological notes provided."}"</p>
                 </div>
                 {selectedTrade.mistakes.length > 0 && (
                   <div className="bg-rose-500/5 p-4 rounded-3xl border border-rose-500/10">
                      <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-2">Tactical Errors</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedTrade.mistakes.map(m => (
                          <span key={m} className="bg-rose-500/20 text-rose-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                            {m}
                          </span>
                        ))}
                      </div>
                   </div>
                 )}
              </div>

              <div className="flex gap-4">
                 <button 
                  onClick={() => { setSelectedTrade(null); onEdit(selectedTrade); }}
                  className="flex-2 py-4 bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all active:scale-95"
                >
                  <Edit3 size={18} /> Edit
                </button>
                <button 
                  onClick={() => shareTrade(selectedTrade)}
                  className="flex-1 py-4 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-3xl flex items-center justify-center gap-2 hover:bg-emerald-500/20 transition-all active:scale-95"
                >
                  <Share2 size={18} />
                </button>
                <button 
                  onClick={() => {
                    if (confirm("Permanently delete this alpha record?")) {
                      deleteTrade(selectedTrade.id);
                      setSelectedTrade(null);
                    }
                  }}
                  className="w-16 py-4 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center hover:bg-rose-500/20 transition-all"
                >
                  <Trash2 size={20} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

