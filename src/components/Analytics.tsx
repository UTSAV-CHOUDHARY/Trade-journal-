import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { getLongestStreaks } from "../utils";
import { Activity, Award, BarChart3, TrendingUp, AlertTriangle, Target, Zap, ShieldX, CheckCircle, Calendar as CalendarIcon } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

export const Analytics = () => {
  const { trades } = useTrades();

  const totalTrades = trades.length;
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  
  const avgRR = totalTrades > 0 
    ? trades.reduce((acc, t) => acc + t.rr, 0) / totalTrades 
    : 0;

  const streaks = getLongestStreaks(trades);

  // Strategy performance calculation
  const strategyPerf = trades.reduce((acc: any, t) => {
    if (!acc[t.strategy]) acc[t.strategy] = { name: t.strategy, profit: 0, count: 0, wins: 0 };
    acc[t.strategy].profit += t.pnl;
    acc[t.strategy].count += 1;
    if (t.pnl > 0) acc[t.strategy].wins += 1;
    return acc;
  }, {});

  const barData = Object.values(strategyPerf);
  const bestStrategy = (barData.length > 0 ? barData.reduce((prev: any, current: any) => (prev.profit > current.profit) ? prev : current) : null) as any;
  const worstStrategy = (barData.length > 0 ? barData.reduce((prev: any, current: any) => (prev.profit < current.profit) ? prev : current) : null) as any;

  // Index performance calculation
  const indexPerf = trades.reduce((acc: any, t) => {
    if (!acc[t.index]) acc[t.index] = { name: t.index, profit: 0 };
    acc[t.index].profit += t.pnl;
    return acc;
  }, {});
  const indexData = Object.values(indexPerf).sort((a: any, b: any) => b.profit - a.profit);

  // Mood analysis
  const moodAnalysis = trades.reduce((acc: any, t) => {
    if (!acc[t.mood]) acc[t.mood] = { mood: t.mood, profit: 0, count: 0 };
    acc[t.mood].profit += t.pnl;
    acc[t.mood].count += 1;
    return acc;
  }, {});
  const moodData = Object.values(moodAnalysis).sort((a: any, b: any) => b.profit - a.profit);

  // Mistake frequency
  const mistakeFreq = trades.reduce((acc: any, t) => {
    t.mistakes.forEach(m => {
      if (!acc[m]) acc[m] = { name: m, count: 0 };
      acc[m].count += 1;
    });
    return acc;
  }, {});

  const mistakeData = Object.values(mistakeFreq).sort((a: any, b: any) => b.count - a.count);

  // Equity Growth
  let runningPnL = 0;
  const equityData = [...trades]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .map((t, idx) => {
      runningPnL += t.pnl;
      return { id: idx, pnl: Number(runningPnL.toFixed(2)), date: new Date(t.date).toLocaleDateString() };
    });

  // Weekday performance calculation
  const weekdayPerf = trades.reduce((acc: any, t) => {
    const day = new Date(t.date).getDay();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayName = days[day];
    
    if (!acc[dayName]) acc[dayName] = { name: dayName, profit: 0, count: 0, wins: 0, id: day };
    acc[dayName].profit += t.pnl;
    acc[dayName].count += 1;
    if (t.pnl > 0) acc[dayName].wins += 1;
    return acc;
  }, {});

  const weekdayData = Object.values(weekdayPerf)
    .filter((d: any) => d.id !== 0 && d.id !== 6) // Focus on trading days
    .sort((a: any, b: any) => a.id - b.id);

  return (
    <div className="space-y-6 pb-24 px-2">
      <header>
        <h1 className="text-3xl font-black text-white tracking-tighter uppercase">Market Intel</h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Statistical Advantage Mapping</p>
      </header>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 bg-indigo-500/5 border-indigo-500/20">
           <Zap className="text-indigo-400 mb-3" size={24} />
           <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Efficiency</p>
           <h3 className="text-2xl font-black text-white">{winRate.toFixed(1)}%</h3>
           <p className="text-indigo-400/60 text-[9px] uppercase font-black mt-1 tracking-tighter">Win Accuracy</p>
        </GlassCard>
        <GlassCard className="p-5 bg-emerald-500/5 border-emerald-500/20">
           <Target className="text-emerald-400 mb-3" size={24} />
           <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Avg RR</p>
           <h3 className="text-2xl font-black text-white">{avgRR.toFixed(2)}</h3>
           <p className="text-emerald-400/60 text-[9px] uppercase font-black mt-1 tracking-tighter">Reward Unit</p>
        </GlassCard>
      </div>

      {/* Best/Worst Segments */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 border-emerald-500/10">
           <div className="flex items-center gap-2 mb-3">
             <CheckCircle size={14} className="text-emerald-400" />
             <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Top Strategy</p>
           </div>
           <h4 className="text-white font-black text-lg truncate uppercase tracking-tighter">{bestStrategy?.name || "N/A"}</h4>
           <p className="text-emerald-400 text-xs font-bold mt-1">+₹{bestStrategy?.profit.toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard className="p-5 border-rose-500/10">
           <div className="flex items-center gap-2 mb-3">
             <ShieldX size={14} className="text-rose-400" />
             <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Worst Edge</p>
           </div>
           <h4 className="text-white font-black text-lg truncate uppercase tracking-tighter">{worstStrategy?.name || "N/A"}</h4>
           <p className="text-rose-400 text-xs font-bold mt-1">₹{worstStrategy?.profit.toLocaleString('en-IN')}</p>
        </GlassCard>
      </div>

      <GlassCard className="bg-slate-900/60 transition-all hover:bg-slate-900/80">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={20} className="text-indigo-400" />
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Weekday Edge Log</h3>
        </div>
        <div className="space-y-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName) => {
            const data = (weekdayData.find((d: any) => d.name === dayName) || { profit: 0, wins: 0, count: 1 }) as any;
            const wRate = Math.round((data.wins / (data.count || 1)) * 100);
            
            return (
              <div key={dayName} className="flex items-center justify-between p-3 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex flex-col">
                  <span className="text-white text-xs font-black uppercase tracking-tighter">{dayName}</span>
                  <span className={cn(
                    "text-[10px] font-black uppercase tracking-widest",
                    wRate >= 50 ? "text-emerald-500" : "text-rose-500"
                  )}>{wRate}% WIN RATE</span>
                </div>
                <div className="text-right">
                  <p className={cn(
                    "text-sm font-black tracking-tighter",
                    data.profit >= 0 ? "text-emerald-400" : "text-rose-400"
                  )}>
                    {data.profit >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(data.profit).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase">{data.count} SESSIONS</p>
                </div>
              </div>
            );
          })}
        </div>
      </GlassCard>

      <GlassCard className="bg-slate-900/60">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-400" size={20} />
            <h3 className="text-white font-black text-sm uppercase tracking-widest">Master Equity Curve</h3>
          </div>
          <div className={cn(
             "px-2 py-1 rounded text-[10px] font-black uppercase tracking-tighter",
             runningPnL >= 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-rose-500/10 text-rose-400"
          )}>
            {runningPnL >= 0 ? 'Bullish' : 'Bearish'} Bias
          </div>
        </div>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={equityData}>
              <defs>
                <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" hide />
              <YAxis hide />
              <Tooltip 
                contentStyle={{ backgroundColor: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '10px' }}
                itemStyle={{ color: '#6366f1' }}
              />
              <Area 
                type="monotone" 
                dataKey="pnl" 
                stroke="#6366f1" 
                strokeWidth={3} 
                fillOpacity={1} 
                fill="url(#colorPnL)" 
                animationDuration={2500}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <GlassCard>
        <div className="flex items-center gap-2 mb-6">
          <AlertTriangle className="text-rose-400" size={20} />
          <h3 className="text-white font-black text-sm uppercase tracking-widest">Behavioral Leakage (Mistakes)</h3>
        </div>
        <div className="space-y-4">
          {mistakeData.length > 0 ? mistakeData.slice(0, 5).map((m: any, idx: number) => (
            <motion.div 
               key={m.name} 
               initial={{ opacity: 0, x: -10 }}
               animate={{ opacity: 1, x: 0 }}
               transition={{ delay: idx * 0.1 }}
               className="flex items-center justify-between"
            >
              <div className="flex flex-col">
                 <span className="text-white text-xs font-black uppercase tracking-tighter">{m.name}</span>
                 <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider">{Math.round((m.count / totalTrades) * 100)}% Exposure</span>
              </div>
              <div className="w-32 h-2 bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(m.count / totalTrades) * 100}%` }}
                  className="h-full bg-rose-500" 
                  transition={{ duration: 1, ease: 'easeOut' }}
                 />
              </div>
            </motion.div>
          )) : (
            <p className="text-slate-600 text-center py-4 italic text-sm">No psychological friction detected yet.</p>
          )}
        </div>
      </GlassCard>

      <div className="px-2">
        <GlassCard className="bg-gradient-to-br from-indigo-500 to-indigo-800 border-none overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
               <Award size={80} />
            </div>
            <div className="relative z-10 text-center py-4">
              <h4 className="text-white font-black text-2xl mb-1 uppercase tracking-tighter">
                Edge Efficiency: <span className="font-sans">₹</span>{((trades.reduce((acc, t) => acc + t.pnl, 0) / (trades.length || 1))).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
              </h4>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-[0.2em]">Net Value Per Execution</p>
            </div>
        </GlassCard>
      </div>
    </div>
  );
};
