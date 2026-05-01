import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { useState } from "react";
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Edit3, BarChart, Package } from "lucide-react";
import { cn } from "../lib/utils";
import { motion, AnimatePresence } from "motion/react";
import { Trade } from "../types";

export const PnLCalendar = ({ onEdit }: { onEdit: (trade: Trade) => void }) => {
  const { trades } = useTrades();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getDayPnL = (day: Date) => {
    return trades
      .filter(t => isSameDay(new Date(t.date), day))
      .reduce((acc, t) => acc + t.pnl, 0);
  };

  const getDayTrades = (day: Date) => {
    return trades.filter(t => isSameDay(new Date(t.date), day));
  };

  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  // Monthly stats
  const monthlyTrades = trades.filter(t => {
     const date = new Date(t.date);
     return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  });
  const monthlyPnL = monthlyTrades.reduce((acc, t) => acc + t.pnl, 0);
  const greenDays = days.filter(d => getDayPnL(d) > 0).length;
  const redDays = days.filter(d => getDayPnL(d) < 0).length;

  const selectedDayTrades = selectedDate ? getDayTrades(selectedDate) : [];
  const selectedDayPnL = selectedDate ? getDayPnL(selectedDate) : 0;

  return (
    <div className="space-y-6 pb-24 px-2">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tighter text-center uppercase">Time Ledger</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest text-center">Monthly Distribution</p>
      </header>

      <GlassCard className="p-4 bg-indigo-500/5 grid grid-cols-3 gap-2">
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Monthly PnL</p>
            <p className={cn(
              "font-black text-sm",
              monthlyPnL >= 0 ? "text-emerald-400" : "text-rose-400"
            )}>
              {monthlyPnL >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(monthlyPnL).toLocaleString('en-IN')}
            </p>
         </div>
         <div className="text-center border-x border-white/5">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Green Sessions</p>
            <p className="text-emerald-400 font-black text-sm">{greenDays}</p>
         </div>
         <div className="text-center">
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Exposures</p>
            <p className="text-white font-black text-sm">{monthlyTrades.length}</p>
         </div>
      </GlassCard>

      <div className="flex items-center justify-between px-2">
         <button onClick={prevMonth} className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
            <ChevronLeft size={20} />
         </button>
         <h2 className="text-white font-black text-lg uppercase tracking-tighter">{format(currentDate, 'MMMM yyyy')}</h2>
         <button onClick={nextMonth} className="p-3 bg-slate-900 border border-white/5 rounded-2xl text-slate-400 hover:text-white transition-colors">
            <ChevronRight size={20} />
         </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, index) => (
          <div key={`${d}-${index}`} className="text-center text-slate-600 text-[8px] font-black py-2 tracking-[0.2em]">{d}</div>
        ))}
        {days.map((day, idx) => {
          const pnl = getDayPnL(day);
          const tradesCount = getDayTrades(day).length;
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          
          return (
            <motion.button
              key={day.toString()}
              whileTap={{ scale: 0.9 }}
              onClick={() => setSelectedDate(day)}
              className={cn(
                "aspect-square rounded-2xl relative flex flex-col items-center justify-center transition-all border",
                isSelected 
                  ? "bg-indigo-500 border-indigo-400 scale-105 z-10 shadow-xl shadow-indigo-500/30" 
                  : isToday(day) 
                    ? "bg-white/10 border-white/30" 
                    : "bg-slate-900/40 border-white/5",
                tradesCount > 0 && pnl > 0 && !isSelected && "bg-emerald-500/10 border-emerald-500/20",
                tradesCount > 0 && pnl < 0 && !isSelected && "bg-rose-500/10 border-rose-500/20",
              )}
            >
              <span className={cn(
                "text-xs font-black",
                isSelected ? "text-white" : "text-slate-400"
              )}>{format(day, 'd')}</span>
              {tradesCount > 0 && !isSelected && (
                <div className={cn(
                   "w-1.5 h-1.5 rounded-full mt-1",
                   pnl >= 0 ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"
                )} />
              )}
            </motion.button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {selectedDate && (
          <motion.div
            key={selectedDate.toString()}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <GlassCard className="p-6 bg-slate-900/60 border border-white/10 shadow-2xl">
               <div className="flex justify-between items-center mb-6">
                  <div>
                    <h4 className="text-white font-black uppercase tracking-tighter text-lg">{format(selectedDate, 'do MMMM')}</h4>
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Day Strategy Performance</p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-2xl font-black tracking-tighter leading-none mb-1",
                      selectedDayPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                    )}>
                      {selectedDayPnL >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(selectedDayPnL).toLocaleString('en-IN')}
                    </p>
                  </div>
               </div>
               
               <div className="space-y-3">
                 {selectedDayTrades.map(trade => (
                   <div key={trade.id} className="group flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all active:scale-[0.98]">
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center",
                          trade.pnl >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                        )}>
                          {trade.type === 'Buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-white text-[11px] font-black uppercase leading-none mb-1 tracking-tighter">{trade.strategy}</span>
                           <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{trade.index}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={cn(
                          "text-sm font-black",
                          trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                        )}>{trade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(trade.pnl).toLocaleString('en-IN')}</span>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                          className="w-8 h-8 rounded-lg bg-slate-800 text-slate-400 flex items-center justify-center hover:text-white transition-all scale-0 group-hover:scale-100"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                   </div>
                 ))}
                 {selectedDayTrades.length === 0 && (
                   <div className="py-8 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-800/40 rounded-full flex items-center justify-center mb-3 text-slate-600">
                         <Package size={24} />
                      </div>
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">No terminal data for this session.</p>
                   </div>
                 )}
               </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
