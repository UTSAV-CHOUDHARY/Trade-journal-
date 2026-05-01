import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { TrendingUp, TrendingDown, Target, Zap, Waves, Activity, Sword, ShieldCheck } from "lucide-react";
import { getStreak, getAccuracyRank } from "../utils";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export const Dashboard = () => {
  const { trades } = useTrades();
  
  const totalPnL = trades.reduce((acc, t) => acc + t.pnl, 0);
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = trades.length > 0 ? Math.round((winCount / trades.length) * 100) : 0;
  const streak = getStreak(trades);
  const level = getAccuracyRank(winRate);

  const grossProfit = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const grossLoss = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? '∞' : '0.00') : (grossProfit / grossLoss).toFixed(2);
  const expectancy = trades.length > 0 ? (totalPnL / trades.length).toFixed(0) : '0';

  const totalMistakes = trades.reduce((acc, t) => acc + t.mistakes.length, 0);
  const disciplineScore = Math.max(0, Math.min(100, Math.round(100 - ((totalMistakes / (trades.length || 1)) * 15))));
  
  const today = new Date().toISOString().split('T')[0];
  const todayPnL = trades
    .filter(t => t.date.startsWith(today))
    .reduce((acc, t) => acc + t.pnl, 0);

  const pieData = [
    { name: 'Wins', value: winCount },
    { name: 'Losses', value: trades.length - winCount },
  ];
  
  if (trades.length === 0) {
    pieData[0].value = 1; 
  }

  const COLORS = ['#10b981', '#f43f5e'];

  return (
    <div className="space-y-6 pb-24 px-2">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none italic">Trading Journal India</h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Operational Overview</p>
        </div>
        <div className={cn(
           "flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl border transition-all duration-500",
           winRate < 30 ? "bg-rose-500/20 border-rose-500/30 ring-4 ring-rose-500/5" : "bg-white dark:bg-slate-900 border-slate-200 dark:border-white/5"
        )}>
          <span className="text-2xl filter drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]">{level.icon}</span>
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Combat Rank</span>
            <span className={cn(
              "text-[11px] font-black uppercase tracking-tighter",
              winRate < 30 ? "text-rose-400 animate-pulse" : "text-slate-900 dark:text-white"
            )}>{level.name}</span>
          </div>
        </div>
      </header>

      {/* Primary Balance Card */}
      <GlassCard delay={0.1} className="relative overflow-hidden bg-white/80 dark:bg-slate-900/40 border border-slate-200 dark:border-white/10 p-6">
        <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 blur-[100px] -mr-24 -mt-24 rounded-full" />
        
        <div className="flex justify-between items-start relative z-10">
          <div className="space-y-1">
             <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.2em]">Cumulative Yield</p>
             <h2 className={cn(
               "text-4xl font-black tracking-tighter",
               totalPnL >= 0 ? "text-emerald-400" : "text-rose-400"
             )}>
               {totalPnL >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(totalPnL).toLocaleString('en-IN', { minimumFractionDigits: 0 })}
             </h2>
             <div className="flex items-center gap-2 mt-2">
                <div className={cn(
                  "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-tighter",
                  totalPnL >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
                )}>
                  {totalPnL >= 0 ? 'Surplus' : 'Deficit'}
                </div>
                <div className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">{trades.length} Executions</div>
             </div>
          </div>
          <div className="w-20 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={28} outerRadius={36} paddingAngle={2} dataKey="value" stroke="none">
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={trades.length === 0 ? '#1e293b' : COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 mt-8">
           <div className="bg-slate-500/5 dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/5">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Win Accuracy</p>
              <p className="text-slate-900 dark:text-white font-black text-lg tracking-tighter">{winRate}%</p>
           </div>
           <div className="bg-slate-500/5 dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/5 flex flex-col items-center">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Streak</p>
              <div className="flex items-center gap-1">
                <span className="text-slate-900 dark:text-white font-black text-lg tracking-tighter">{Math.abs(streak)}</span>
                {streak !== 0 && <Zap size={10} className={cn(streak > 0 ? "text-orange-400 fill-orange-400" : "text-blue-400 rotate-180 fill-blue-400")} />}
              </div>
           </div>
           <div className="bg-slate-500/5 dark:bg-white/5 rounded-2xl p-3 border border-slate-200 dark:border-white/5 text-right">
              <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Exp.</p>
              <p className="text-slate-900 dark:text-white font-black text-lg tracking-tighter">{trades.length}</p>
           </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard delay={0.2} className="p-5 bg-indigo-500/5 border-indigo-500/10 flex flex-col justify-between group overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-0">
             <ShieldCheck size={64} />
           </div>
           <ShieldCheck size={20} className="text-indigo-400 mb-4 relative z-10" />
           <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Discipline Index</p>
              <div className="flex items-end justify-between">
                 <h3 className="text-2xl font-black text-white tracking-tighter">{disciplineScore}%</h3>
                 <div className="w-12 h-1 bg-slate-800 rounded-full mb-2 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${disciplineScore}%` }} />
                 </div>
              </div>
           </div>
        </GlassCard>
        
        <GlassCard delay={0.3} className="p-5 bg-emerald-500/5 border-emerald-500/10 flex flex-col justify-between group overflow-hidden">
           <div className="absolute top-0 right-0 p-2 opacity-5 scale-150 -rotate-12 transition-transform group-hover:scale-175 group-hover:rotate-0">
             <Activity size={64} />
           </div>
           <Activity size={20} className="text-emerald-400 mb-4 relative z-10" />
           <div className="relative z-10">
              <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">Session Delta</p>
              <h3 className={cn(
                 "text-2xl font-black tracking-tighter",
                 todayPnL >= 0 ? "text-emerald-400" : "text-rose-400"
              )}>
                {todayPnL >= 0 ? '+' : '-'}<span className="font-sans text-lg">₹</span>{Math.abs(todayPnL).toLocaleString('en-IN')}
              </h3>
           </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard delay={0.4} className="p-5 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-orange-400" />
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Expectancy</p>
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase"><span className="font-sans">₹</span>{expectancy}</h3>
           <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter mt-1 italic">Expected Yield Per Execute</p>
        </GlassCard>
        <GlassCard delay={0.5} className="p-5 bg-white/50 dark:bg-slate-900/50 border-slate-200 dark:border-white/5">
           <div className="flex items-center gap-2 mb-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
              <p className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Profit Factor</p>
           </div>
           <h3 className="text-xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">{profitFactor}</h3>
           <p className="text-[8px] text-slate-600 font-bold uppercase tracking-tighter mt-1 italic">Gross Prof / Gross Loss</p>
        </GlassCard>
      </div>

      <div>
        <div className="flex justify-between items-center mb-4">
           <h3 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] ml-1">Recent Sessions</h3>
           <Sword size={14} className="text-slate-700" />
        </div>
        <div className="space-y-3">
          {trades.slice(0, 3).length > 0 ? trades.slice(0, 3).map((trade, idx) => (
            <motion.div 
              key={trade.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white dark:bg-slate-900/40 rounded-2xl border border-slate-200 dark:border-white/5 p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border",
                  trade.pnl >= 0 ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-rose-500/10 border-rose-500/20 text-rose-400"
                )}>
                  {trade.type === 'Buy' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                </div>
                <div>
                  <p className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tighter">{trade.strategy}</p>
                  <p className="text-slate-600 text-[9px] font-bold uppercase tracking-widest">{trade.index}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-black text-sm tracking-tighter",
                  trade.pnl >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {trade.pnl >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(trade.pnl).toLocaleString('en-IN')}
                </p>
                <div className="flex items-center justify-end gap-1 mt-0.5">
                   <Target size={8} className="text-slate-600" />
                   <p className="text-slate-500 text-[9px] font-black uppercase tracking-tighter">RR {trade.rr}</p>
                </div>
              </div>
            </motion.div>
          )) : (
            <div className="py-12 text-center border-2 border-dashed border-white/5 rounded-3xl">
               <Waves className="mx-auto text-slate-800 mb-2" size={32} />
               <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">Awaiting First Deployment</p>
            </div>
          )}
        </div>
      </div>

      {winRate > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className={cn(
            "p-5 rounded-3xl text-center border-2 border-dashed",
            winRate < 30 ? "bg-rose-500/5 border-rose-500/20 text-rose-400" : 
            winRate > 70 ? "bg-emerald-500/5 border-emerald-500/20 text-emerald-400" :
            "bg-indigo-500/5 border-indigo-500/20 text-indigo-400"
          )}
        >
          <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-2 opacity-60">Operational Advisory</p>
          <p className="text-sm font-black uppercase tracking-tighter italic">
            {winRate < 30 ? "Critical System Failure. Liquidity bleed detected. Stop execution immediately." :
             winRate > 70 ? "Peak Alpha Efficiency. Edge confirmed. Maintain size and stay grounded." :
             "Operational Stability Confirmed. Optimize risk parameters for next iteration."}
          </p>
        </motion.div>
      )}
    </div>
  );
};
