import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, startOfWeek, endOfWeek, isSameMonth } from "date-fns";
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
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDayPnL = (day: Date) => {
    return trades
      .filter(t => {
        const tDate = new Date(t.date);
        return tDate.getUTCFullYear() === day.getFullYear() &&
               tDate.getUTCMonth() === day.getMonth() &&
               tDate.getUTCDate() === day.getDate();
      })
      .reduce((acc, t) => acc + t.pnl, 0);
  };

  const getDayTrades = (day: Date) => {
    return trades.filter(t => {
      const tDate = new Date(t.date);
      return tDate.getUTCFullYear() === day.getFullYear() &&
             tDate.getUTCMonth() === day.getMonth() &&
             tDate.getUTCDate() === day.getDate();
    });
  };

  const nextMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  const prevMonth = () => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));

  // Monthly stats
  const monthlyTrades = trades.filter(t => {
     const date = new Date(t.date);
     return date.getUTCMonth() === currentDate.getMonth() && date.getUTCFullYear() === currentDate.getFullYear();
  });
  const monthlyPnL = monthlyTrades.reduce((acc, t) => acc + t.pnl, 0);
  const greenDays = days.filter(d => getDayPnL(d) > 0).length;
  const redDays = days.filter(d => getDayPnL(d) < 0).length;
  
  const maxPnLInMonth = Math.max(...days.map(d => Math.abs(getDayPnL(d))), 1);

  const selectedDayTrades = selectedDate ? getDayTrades(selectedDate) : [];
  const selectedDayPnL = selectedDate ? getDayPnL(selectedDate) : 0;

  return (
    <div className="space-y-6 pb-24 px-2">
      <header className="relative">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-2"
        >
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic flex items-center justify-center gap-2">
            <span className="w-8 h-1 bg-indigo-500 rounded-full" />
            Time Ledger
            <span className="w-8 h-1 bg-indigo-500 rounded-full" />
          </h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Temporal Performance Logic</p>
        </motion.div>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/10 flex flex-col items-center justify-center relative overflow-hidden group">
           <div className="absolute top-0 right-0 p-2 opacity-5 group-hover:scale-150 transition-transform">
             <TrendingUp size={40} className="text-emerald-500" />
           </div>
           <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1 relative z-10">Monthly Alpha</p>
           <p className={cn(
             "font-black text-xl tracking-tighter relative z-10",
             monthlyPnL >= 0 ? "text-emerald-400" : "text-rose-400"
           )}>
             {monthlyPnL >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(monthlyPnL).toLocaleString('en-IN')}
           </p>
        </GlassCard>
        
        <div className="grid grid-rows-2 gap-3">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-2xl flex items-center justify-between px-4">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Green Days</span>
             <span className="text-emerald-400 font-black text-sm">{greenDays}</span>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 p-2 rounded-2xl flex items-center justify-between px-4">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Red Days</span>
             <span className="text-rose-400 font-black text-sm">{redDays}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between px-2">
         <button onClick={prevMonth} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 hover:text-indigo-500 transition-colors shadow-sm active:scale-90">
            <ChevronLeft size={20} />
         </button>
         <div className="text-center group cursor-pointer" onClick={() => { setCurrentDate(new Date()); setSelectedDate(new Date()); }}>
           <h2 className="text-slate-900 dark:text-white font-black text-xl uppercase tracking-tighter leading-none group-hover:text-indigo-500 transition-colors">{format(currentDate, 'MMMM')}</h2>
           <p className="text-indigo-500 font-black text-[10px] tracking-widest mt-1 opacity-50 group-hover:opacity-100 transition-opacity">{format(currentDate, 'yyyy')}</p>
         </div>
         <button onClick={nextMonth} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/5 rounded-2xl text-slate-400 hover:text-indigo-500 transition-colors shadow-sm active:scale-90">
            <ChevronRight size={20} />
         </button>
      </div>

      <div className="bg-white dark:bg-slate-900/40 border border-slate-200 dark:border-white/5 rounded-[32px] p-6 shadow-2xl relative overflow-hidden backdrop-blur-xl">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/5 blur-[60px]" />
        
        <div className="grid grid-cols-7 gap-y-4 gap-x-2 relative z-10">
          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((d, index) => (
            <div key={`${d}-${index}`} className="text-center text-slate-400 text-[8px] font-bold pb-2 tracking-[0.2em]">{d}</div>
          ))}

          {days.map((day) => {
            const pnl = getDayPnL(day);
            const tradesCount = getDayTrades(day).length;
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isSameMonthAsCurrent = isSameMonth(day, currentDate);
            const intensity = maxPnLInMonth > 0 ? Math.sqrt(Math.abs(pnl) / maxPnLInMonth) : 0;
            
            return (
              <motion.button
                key={day.toString()}
                whileHover={{ scale: 1.1, zIndex: 20 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setSelectedDate(day)}
                disabled={!isSameMonthAsCurrent}
                className={cn(
                  "aspect-square rounded-xl relative flex flex-col items-center justify-center transition-all border group overflow-hidden",
                  !isSameMonthAsCurrent && "opacity-10 cursor-default border-transparent",
                  isSelected 
                    ? "bg-indigo-500 border-indigo-400 shadow-xl shadow-indigo-500/40 ring-4 ring-indigo-500/20" 
                    : isToday(day) 
                      ? "bg-slate-200 dark:bg-slate-800 border-indigo-500/50" 
                      : "bg-slate-100/50 dark:bg-slate-800/30 border-slate-200 dark:border-white/5",
                )}
              >
                {/* Heatmap intensity indicator - only for month days that aren't selected */}
                {tradesCount > 0 && isSameMonthAsCurrent && !isSelected && (
                  <div 
                    className={cn(
                      "absolute inset-0 transition-opacity duration-500",
                      pnl > 0 ? "bg-emerald-500" : "bg-rose-500"
                    )}
                    style={{ 
                      opacity: (intensity * 0.4) + 0.1,
                      filter: `saturate(${1 + intensity})`
                    }}
                  />
                )}
                
                {/* Today indicator */}
                {isToday(day) && !isSelected && (
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
                )}

                <span className={cn(
                  "text-[11px] font-black relative z-10",
                  isSelected ? "text-white" : isToday(day) ? "text-indigo-500 dark:text-indigo-400" : "text-slate-500 dark:text-slate-400"
                )}>{format(day, 'd')}</span>
                
                {/* Dot indicator for trades */}
                {tradesCount > 0 && !isSelected && isSameMonthAsCurrent && (
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className={cn(
                       "w-1 h-1 rounded-full absolute bottom-1.5 z-10",
                       pnl >= 0 ? "bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]" : "bg-rose-400 shadow-[0_0_5px_rgba(251,113,133,0.8)]"
                    )} 
                  />
                )}
              </motion.button>
            );
          })}
        </div>
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
                   <motion.div 
                     key={trade.id} 
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     className="group flex items-center justify-between p-4 bg-slate-500/5 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5 hover:bg-slate-500/10 dark:hover:bg-white/20 transition-all active:scale-[0.98]"
                   >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-10 h-10 rounded-xl flex items-center justify-center shadow-lg",
                          trade.pnl >= 0 ? "bg-emerald-500/10 text-emerald-400 shadow-emerald-500/10" : "bg-rose-500/10 text-rose-400 shadow-rose-500/10"
                        )}>
                          {trade.pnl >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-slate-900 dark:text-white text-[11px] font-black uppercase leading-none mb-1 tracking-tighter">{trade.strategy}</span>
                           <div className="flex items-center gap-2">
                             <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">{trade.index}</span>
                             <span className="text-slate-600 text-[8px] font-bold px-1.5 py-0.5 bg-slate-800 rounded uppercase">{trade.type}</span>
                           </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right mr-2">
                          <span className={cn(
                            "text-sm font-black block leading-none mb-1",
                            trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                          )}>
                            {trade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(trade.pnl).toLocaleString('en-IN')}
                          </span>
                          <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest">RR: {trade.rr.toFixed(1)}</span>
                        </div>
                        <button 
                          onClick={(e) => { e.stopPropagation(); onEdit(trade); }}
                          className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                        >
                          <Edit3 size={14} />
                        </button>
                      </div>
                   </motion.div>
                 ))}
                 {selectedDayTrades.length === 0 && (
                   <div className="py-12 text-center flex flex-col items-center">
                      <motion.div 
                        animate={{ y: [0, -5, 0] }}
                        transition={{ duration: 2, repeat: Infinity }}
                        className="w-16 h-16 bg-slate-800/40 rounded-full flex items-center justify-center mb-4 text-slate-600 border border-white/5"
                      >
                         <Package size={28} />
                      </motion.div>
                      <p className="text-slate-500 text-[10px] uppercase font-black tracking-[0.2em]">No terminal data for this temporal point.</p>
                      <p className="text-slate-700 text-[8px] font-bold uppercase mt-1 tracking-widest">Session inactive</p>
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
