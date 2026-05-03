import { useState, useRef, useEffect } from "react";
import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { Trade, StrategyType, MistakeTag, TradeType, MoodType, IndexType } from "../types";
import { AlertCircle, CheckCircle2, ChevronRight, X, Camera, Clock, Target, ShieldAlert, Cpu, Save, Trash2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const AddTradeForm = ({ onComplete, tradeToEdit }: { onComplete: () => void, tradeToEdit?: Trade }) => {
  const { trades, settings, addTrade, updateTrade, draftTrade, setDraftTrade } = useTrades();
  const [step, setStep] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Self-Control Lock Logic
  const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD local
  const todayTrades = trades.filter(t => t.date.startsWith(today));
  const netPnL = todayTrades.reduce((acc, t) => acc + t.pnl, 0);

  const isLocked = !tradeToEdit && settings.isLockdownEnabled && (
    (settings.dailyTradeLimit && todayTrades.length >= settings.dailyTradeLimit) ||
    (settings.dailyLossLimit && netPnL <= -settings.dailyLossLimit)
  );

  const mistakes: MistakeTag[] = ['Fear', 'Overtrading', 'Late Entry', 'Early Exit', 'No Setup', 'Reversed Trade', 'Averaging Loss'];
  const strategies: StrategyType[] = ['Scalping', 'Intraday', 'Swing', 'Custom'];
  const indices: IndexType[] = ['Nifty 50', 'Bank Nifty', 'Finnifty', 'Midcap Nifty', 'Sensex', 'Stocks'];
  const moods: MoodType[] = ['😃 Happy', '😐 Neutral', '😡 Angry', '😫 Frustrated', '😨 Fearful', '🤑 Greedy'];

  const [formData, setFormData] = useState({
    type: tradeToEdit?.type || 'Buy',
    strategy: tradeToEdit?.strategy || 'Intraday',
    index: tradeToEdit?.index || 'Nifty 50',
    entry: tradeToEdit?.entry.toString() || '',
    exit: tradeToEdit?.exit.toString() || '',
    sl: tradeToEdit?.sl.toString() || '',
    tp: tradeToEdit?.tp.toString() || '',
    lotSize: tradeToEdit?.lotSize.toString() || '',
    notes: tradeToEdit?.notes || '',
    entryTime: tradeToEdit?.entryTime || new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    exitTime: tradeToEdit?.exitTime || new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
    date: tradeToEdit ? new Date(tradeToEdit.date).toISOString().split('T')[0] : new Date().toLocaleDateString('en-CA'),
    mood: tradeToEdit?.mood || '😐 Neutral',
    entryCondition: tradeToEdit?.entryCondition || '',
    exitCondition: tradeToEdit?.exitCondition || '',
    screenshot: tradeToEdit?.screenshot || ''
  });

  useEffect(() => {
    if (draftTrade && !tradeToEdit) {
      // Helper to try and match partial strings to options
      const findMatch = (options: string[], value?: string) => {
        if (!value) return null;
        return options.find(o => o.toLowerCase().includes(value.toLowerCase())) || null;
      };

      setFormData(prev => ({
        ...prev,
        type: draftTrade.type || prev.type,
        index: (findMatch(indices, draftTrade.asset) as IndexType) || prev.index,
        lotSize: draftTrade.quantity?.toString() || prev.lotSize,
        entry: draftTrade.price?.toString() || prev.entry,
        exit: draftTrade.exit?.toString() || prev.exit,
        sl: draftTrade.sl?.toString() || prev.sl,
        tp: draftTrade.tp?.toString() || prev.tp,
        strategy: (findMatch(strategies, draftTrade.strategy) as StrategyType) || prev.strategy,
        notes: draftTrade.summary || prev.notes,
        mood: draftTrade.emotion ? (findMatch(moods, draftTrade.emotion) as MoodType || prev.mood) : prev.mood
      }));

      if (draftTrade.mistakes && Array.isArray(draftTrade.mistakes)) {
        const validMistakes = draftTrade.mistakes.filter((m: string) => mistakes.includes(m as MistakeTag)) as MistakeTag[];
        setSelectedMistakes(validMistakes);
      }
      
      setDraftTrade(null); // Clear after consumption
    }
  }, [draftTrade, tradeToEdit, setDraftTrade, indices, strategies, moods, mistakes]);

  const [selectedMistakes, setSelectedMistakes] = useState<MistakeTag[]>(tradeToEdit?.mistakes || []);

  const handleCreate = () => {
    if (isLocked) return;
    
    const tradeData = {
      type: formData.type as TradeType,
      strategy: formData.strategy as StrategyType,
      index: formData.index as IndexType,
      entry: Number(formData.entry),
      exit: Number(formData.exit),
      sl: Number(formData.sl),
      tp: Number(formData.tp),
      lotSize: Number(formData.lotSize),
      notes: formData.notes,
      entryTime: formData.entryTime,
      exitTime: formData.exitTime,
      date: new Date(formData.date).toISOString(),
      mistakes: selectedMistakes,
      mood: formData.mood as MoodType,
      entryCondition: formData.entryCondition,
      exitCondition: formData.exitCondition,
      screenshot: formData.screenshot
    };

    if (tradeToEdit) {
      updateTrade(tradeToEdit.id, tradeData);
    } else {
      addTrade(tradeData);
    }
    
    setShowSuccess(true);
    setTimeout(() => {
      onComplete();
    }, 1500);
  };

  const handleImageUpload = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Image too large. Please select an image under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, screenshot: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="relative pb-10">
      <AnimatePresence mode="wait">
        {showSuccess ? (
          <motion.div
            key="success"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
              <CheckCircle2 size={48} className="text-white" />
            </div>
            <h3 className="text-3xl font-light font-serif italic text-white mb-2">Trade Captured</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em]">Integrity in every execution</p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="flex justify-between items-center mb-6 px-2">
              <div className="flex flex-col">
                <h2 className="text-2xl font-light font-serif italic text-white tracking-tight">
                  {tradeToEdit ? "Refine Trade Record" : "New Performance Entry"}
                </h2>
                <div className="flex gap-1.5 mt-2">
                   {[1, 2, 3].map(i => (
                     <div key={i} className={cn("h-[2px] transition-all duration-500", step >= i ? "bg-indigo-500 w-10" : "bg-slate-800 w-4")} />
                   ))}
                </div>
              </div>
              <button onClick={onComplete} className="p-3 bg-slate-800/80 rounded-2xl text-slate-400 hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            {isLocked && (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2rem] mb-8 text-center backdrop-blur-md"
              >
                <ShieldAlert size={32} className="text-rose-500 mx-auto mb-3" />
                <h3 className="text-xl font-light font-serif italic text-white">System Integrity Lock</h3>
                <p className="text-[8px] text-rose-300 font-bold uppercase tracking-[0.3em] mt-2 leading-relaxed">
                  Execution limits detected. Operational pause enforced to preserve terminal capital.
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center">
                   {settings.dailyTradeLimit && (
                     <div className="px-3 py-1 bg-rose-500/30 rounded-lg text-[9px] font-black text-white">TRADES: {todayTrades.length}/{settings.dailyTradeLimit}</div>
                   )}
                   {settings.dailyLossLimit && (
                     <div className="px-3 py-1 bg-rose-500/30 rounded-lg text-[9px] font-black text-white">PNL: ₹{netPnL}/{ -settings.dailyLossLimit }</div>
                   )}
                </div>
              </motion.div>
            )}

            <div className={cn("space-y-4", isLocked && "opacity-20 pointer-events-none grayscale")}>
              {step === 1 && (
                <div className="space-y-4">
                   <GlassCard className="p-4 bg-slate-900/60 border border-white/5">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                          onClick={() => setFormData({ ...formData, type: 'Buy' })}
                          className={cn(
                            "py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-sm tracking-widest",
                            formData.type === 'Buy' 
                              ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/30" 
                              : "bg-slate-800/50 text-slate-500 border border-white/5"
                          )}
                        >
                          BUY
                        </button>
                        <button
                          onClick={() => setFormData({ ...formData, type: 'Sell' })}
                          className={cn(
                            "py-4 rounded-2xl font-black flex items-center justify-center gap-2 transition-all text-sm tracking-widest",
                            formData.type === 'Sell' 
                              ? "bg-rose-500 text-white shadow-lg shadow-rose-500/30" 
                              : "bg-slate-800/50 text-slate-500 border border-white/5"
                          )}
                        >
                          SELL
                        </button>
                      </div>

                      <div className="space-y-3">
                         <div className="flex items-center gap-3 bg-slate-800/40 p-3 rounded-2xl border border-white/5">
                            <Cpu size={18} className="text-indigo-400" />
                            <select 
                              value={formData.index}
                              onChange={e => setFormData({ ...formData, index: e.target.value as IndexType })}
                              className="flex-1 bg-transparent text-white font-bold focus:outline-none appearance-none"
                            >
                               {indices.map(i => <option key={i} value={i} className="bg-slate-900">{i}</option>)}
                            </select>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 ml-1"><Target size={10}/> Entry Price</p>
                               <input
                                  type="number"
                                  placeholder="0.00"
                                  value={formData.entry}
                                  onChange={e => setFormData({ ...formData, entry: e.target.value })}
                                  className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 ml-1"><Target size={10}/> Exit Price</p>
                               <input
                                  type="number"
                                  placeholder="0.00"
                                  value={formData.exit}
                                  onChange={e => setFormData({ ...formData, exit: e.target.value })}
                                  className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                         </div>

                         <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 ml-1"><Clock size={10}/> Entry Time</p>
                               <input
                                  type="time"
                                  value={formData.entryTime}
                                  onChange={e => setFormData({ ...formData, entryTime: e.target.value })}
                                  className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                               <p className="text-[10px] font-black text-slate-500 uppercase flex items-center gap-1 ml-1"><Clock size={10}/> Exit Time</p>
                               <input
                                  type="time"
                                  value={formData.exitTime}
                                  onChange={e => setFormData({ ...formData, exitTime: e.target.value })}
                                  className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white font-mono focus:ring-2 focus:ring-indigo-500/50 outline-none"
                                />
                            </div>
                         </div>

                         <div className="grid grid-cols-3 gap-3">
                           <div className="col-span-1 flex flex-col gap-1 items-center">
                             <p className="text-[8px] font-black text-slate-600 uppercase">Lots</p>
                             <input
                               type="number" placeholder="Lots"
                               value={formData.lotSize}
                               onChange={e => setFormData({ ...formData, lotSize: e.target.value })}
                               className="w-full bg-slate-800/40 border border-white/5 rounded-xl p-3 text-white font-mono text-center outline-none focus:ring-2 focus:ring-indigo-500/50"
                             />
                           </div>
                           <div className="col-span-1 flex flex-col gap-1 items-center">
                             <p className="text-[8px] font-black text-rose-500/50 uppercase">Stop Loss</p>
                              <input
                               type="number" placeholder="SL"
                               value={formData.sl}
                               onChange={e => setFormData({ ...formData, sl: e.target.value })}
                               className="w-full bg-rose-500/5 border border-rose-500/20 rounded-xl p-3 text-white font-mono text-center outline-none focus:ring-2 focus:ring-rose-500/50"
                             />
                           </div>
                           <div className="col-span-1 flex flex-col gap-1 items-center">
                             <p className="text-[8px] font-black text-emerald-500/50 uppercase">Target</p>
                              <input
                               type="number" placeholder="TP"
                               value={formData.tp}
                               onChange={e => setFormData({ ...formData, tp: e.target.value })}
                               className="w-full bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-white font-mono text-center outline-none focus:ring-2 focus:ring-emerald-500/50"
                             />
                           </div>
                         </div>

                         {/* Potential PnL Preview */}
                         {(formData.entry && formData.exit && formData.lotSize) && (
                           <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white/5 rounded-2xl p-3 border border-white/10 flex justify-between items-center"
                           >
                              <div>
                                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Expected Outcome</p>
                                 <p className={cn(
                                   "text-lg font-black",
                                   (Number(formData.exit) - Number(formData.entry)) * (formData.type === 'Buy' ? 1 : -1) >= 0 ? "text-emerald-400" : "text-rose-400"
                                 )}>
                                   <span className="font-sans">₹</span>
                                   {(Math.abs(Number(formData.exit) - Number(formData.entry)) * Number(formData.lotSize)).toLocaleString('en-IN')}
                                 </p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest">Risk/Reward</p>
                                 <p className="text-white font-black">
                                   {Math.abs((Number(formData.tp) - Number(formData.entry)) / (Number(formData.entry) - Number(formData.sl) || 1)).toFixed(2)}:1
                                 </p>
                              </div>
                           </motion.div>
                         )}
                      </div>
                   </GlassCard>

                   <button
                    onClick={nextStep}
                    disabled={!formData.entry || !formData.exit || !formData.lotSize}
                    className="w-full p-4 bg-indigo-500 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 flex items-center justify-center gap-2 group transition-all disabled:opacity-50"
                  >
                    Next Logic <ChevronRight size={20} className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <GlassCard className="space-y-4 bg-slate-900/60 border border-white/5">
                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Market Strategy</p>
                       <div className="grid grid-cols-2 gap-2">
                          {strategies.map(s => (
                            <button
                              key={s}
                              onClick={() => setFormData({ ...formData, strategy: s })}
                              className={cn(
                                "py-3 rounded-xl text-xs font-black transition-all border",
                                formData.strategy === s 
                                  ? "bg-indigo-500 border-indigo-400 text-white shadow-md shadow-indigo-500/20" 
                                  : "bg-slate-800/40 border-white/5 text-slate-500"
                              )}
                            >
                              {s}
                            </button>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Setup Condition (Reason to Enter)</p>
                       <textarea
                         value={formData.entryCondition}
                         onChange={e => setFormData({ ...formData, entryCondition: e.target.value })}
                         placeholder="Breakout, Retest, EMA cross..."
                         className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[60px]"
                       />
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Exit Condition (Why did you exit?)</p>
                       <textarea
                         value={formData.exitCondition}
                         onChange={e => setFormData({ ...formData, exitCondition: e.target.value })}
                         placeholder="Target hit, Trailed SL, Panic exit..."
                         className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white text-sm focus:ring-2 focus:ring-indigo-500/50 outline-none min-h-[60px]"
                       />
                    </div>
                  </GlassCard>

                  <div className="flex gap-3">
                    <button onClick={prevStep} className="flex-1 p-4 bg-slate-800/50 text-slate-400 rounded-2xl font-black uppercase tracking-widest">Back</button>
                    <button onClick={nextStep} className="flex-[2] p-4 bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20">Final Review</button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4 px-1 pb-10">
                   <GlassCard className="space-y-4 bg-slate-900/60 border border-white/5">
                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Current Trading Mood</p>
                        <div className="grid grid-cols-3 gap-2">
                           {moods.map(m => (
                             <button
                               key={m}
                               onClick={() => setFormData({ ...formData, mood: m })}
                               className={cn(
                                 "py-2 rounded-xl text-xs transition-all border grayscale hover:grayscale-0",
                                 formData.mood === m ? "bg-indigo-500/20 border-indigo-500/50 grayscale-0" : "bg-slate-800/40 border-white/5"
                               )}
                             >
                               {m.split(' ')[0]} <br/> <span className="text-[8px] font-black">{m.split(' ')[1]}</span>
                             </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-[10px] font-black text-rose-500/80 uppercase tracking-widest flex items-center gap-1"><ShieldAlert size={10}/> Detected Errors</p>
                        <div className="flex flex-wrap gap-2">
                           {mistakes.map(m => (
                              <button
                                key={m}
                                onClick={() => {
                                  setSelectedMistakes(prev => 
                                    prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]
                                  )
                                }}
                                className={cn(
                                  "px-3 py-2 rounded-lg text-[10px] font-black border transition-all uppercase tracking-tighter",
                                  selectedMistakes.includes(m) 
                                    ? "bg-rose-500/10 border-rose-500 text-rose-500 shadow-md shadow-rose-500/10" 
                                    : "bg-slate-800/40 border-white/5 text-slate-500"
                                )}
                              >
                                {m}
                              </button>
                           ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Final Notes & Lessons</p>
                         <textarea
                            placeholder="Type session insights here..."
                            value={formData.notes}
                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                            className="w-full bg-slate-800/50 border border-white/5 rounded-xl p-3 text-white text-xs min-h-[80px] focus:ring-2 focus:ring-indigo-500/50 outline-none"
                         />
                      </div>

                      <div className="space-y-2">
                         <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Market Proof (Snapshot)</p>
                         <div 
                          onClick={() => fileInputRef.current?.click()}
                          className={cn(
                            "w-full h-32 rounded-xl border-2 border-dashed border-white/10 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-white/5 relative overflow-hidden",
                            formData.screenshot && "border-solid border-indigo-500/50"
                          )}
                         >
                            {formData.screenshot ? (
                              <>
                                <img src={formData.screenshot} className="w-full h-full object-cover opacity-50" />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                   <Camera className="text-white" />
                                </div>
                              </>
                            ) : (
                              <>
                                <Camera className="text-slate-500 mb-2" />
                                <span className="text-[10px] font-black text-slate-500 uppercase">Click to attach image</span>
                              </>
                            )}
                            <input
                              type="file" ref={fileInputRef} hidden accept="image/*"
                              onChange={handleImageUpload}
                            />
                         </div>
                      </div>

                      <input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className="w-full bg-slate-800/60 border border-white/5 rounded-xl p-3 text-white font-black text-xs uppercase tracking-widest outline-none"
                      />
                   </GlassCard>

                   <div className="flex gap-3">
                    <button onClick={prevStep} className="flex-1 p-4 bg-slate-800/50 text-slate-400 rounded-2xl font-black uppercase tracking-widest">Back</button>
                    <button onClick={handleCreate} className="flex-[2] p-4 bg-emerald-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-emerald-500/30 active:scale-95 transition-transform">
                      {tradeToEdit ? "Update Ledger" : "Commit To Ledger"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
