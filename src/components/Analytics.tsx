import React, { useState } from "react";
import { isSameMonth, endOfMonth, differenceInDays } from "date-fns";
import { useTrades } from "../context/TradeContext";
import { GlassCard } from "./GlassCard";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { getLongestStreaks } from "../utils";
import { Activity, Award, BarChart3, TrendingUp, AlertTriangle, Target, Zap, ShieldX, CheckCircle, Calendar as CalendarIcon, Flag, Edit3, Loader2, TrendingDown, IndianRupee, Timer } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { cn } from "../lib/utils";

export const Analytics = () => {
  const { trades, monthlyGoal, setMonthlyGoal } = useTrades();
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(monthlyGoal.toString());
  const [isUpdating, setIsUpdating] = useState(false);

  const totalTrades = trades.length;
  const winCount = trades.filter(t => t.pnl > 0).length;
  const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
  
  const avgRR = totalTrades > 0 
    ? trades.reduce((acc, t) => acc + t.rr, 0) / totalTrades 
    : 0;

  const streaks = getLongestStreaks(trades);

  // Advanced Stats
  const totalWins = trades.filter(t => t.pnl > 0).reduce((acc, t) => acc + t.pnl, 0);
  const totalLosses = Math.abs(trades.filter(t => t.pnl < 0).reduce((acc, t) => acc + t.pnl, 0));
  const profitFactor = totalLosses > 0 ? (totalWins / totalLosses).toFixed(2) : totalWins > 0 ? '∞' : '0.00';
  const avgPnL = totalTrades > 0 ? trades.reduce((acc, t) => acc + t.pnl, 0) / totalTrades : 0;
  const avgWin = winCount > 0 ? totalWins / winCount : 0;
  const avgLoss = (totalTrades - winCount) > 0 ? totalLosses / (totalTrades - winCount) : 0;

  // Strategy performance calculation
  const strategyPerf = trades.reduce((acc: any, t) => {
    if (!acc[t.strategy]) acc[t.strategy] = { name: t.strategy, profit: 0, count: 0, wins: 0, totalLossAmount: 0, totalWinAmount: 0 };
    acc[t.strategy].profit += t.pnl;
    acc[t.strategy].count += 1;
    if (t.pnl > 0) {
      acc[t.strategy].wins += 1;
      acc[t.strategy].totalWinAmount += t.pnl;
    } else {
      acc[t.strategy].totalLossAmount += Math.abs(t.pnl);
    }
    return acc;
  }, {});

  const barData = Object.values(strategyPerf).map((s: any) => ({
    ...s,
    winRate: (s.wins / s.count) * 100,
    pf: s.totalLossAmount > 0 ? (s.totalWinAmount / s.totalLossAmount).toFixed(2) : s.totalWinAmount > 0 ? '∞' : '0.00'
  }));
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

  // Goal Progress (Current Month Only)
  const now = new Date();
  const currentMonthTrades = trades.filter(t => isSameMonth(new Date(t.date), now));
  const currentMonthPnL = currentMonthTrades.reduce((acc, t) => acc + t.pnl, 0);
  const goalProgress = Math.min(Math.max((currentMonthPnL / monthlyGoal) * 100, 0), 100);
  
  const daysLeftInMonth = differenceInDays(endOfMonth(now), now);
  const dailyPnLNeeded = (monthlyGoal - currentMonthPnL) / Math.max(daysLeftInMonth, 1);

  const handleUpdateGoal = async () => {
    setIsUpdating(true);
    try {
      await setMonthlyGoal(Number(goalInput));
      setIsEditingGoal(false);
    } catch (error) {
      console.error(error);
    } finally {
      setIsUpdating(false);
    }
  };

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
        <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Market Intel <span className="text-indigo-500 not-italic">India</span></h1>
        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Statistical Advantage Mapping</p>
      </header>

      {/* Monthly Goal Tracker */}
      <GlassCard className="bg-slate-900 dark:bg-slate-900 overflow-hidden relative border-none">
        <div className="absolute top-0 right-0 p-6 opacity-10">
          <Flag size={80} className="text-white" />
        </div>
        
        <div className="p-6 relative z-10">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-1">Monthly Target Progress</p>
              <div className="flex items-baseline gap-2">
                <h2 className="text-white text-4xl font-black tracking-tighter italic">
                  {Math.round(goalProgress)}%
                </h2>
                <span className="text-slate-500 text-xs font-black uppercase tracking-tighter">Completed</span>
              </div>
            </div>
            
            {!isEditingGoal ? (
              <button 
                onClick={() => {
                  setGoalInput(monthlyGoal.toString());
                  setIsEditingGoal(true);
                }}
                className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-colors"
              >
                <Edit3 size={16} className="text-white" />
              </button>
            ) : (
              <div className="flex gap-2">
                <button 
                  onClick={() => setIsEditingGoal(false)}
                  className="px-3 py-1 bg-rose-500/20 text-rose-400 rounded-lg text-[10px] font-black uppercase"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleUpdateGoal}
                  disabled={isUpdating}
                  className="px-3 py-1 bg-emerald-500 text-white rounded-lg text-[10px] font-black uppercase flex items-center gap-2"
                >
                  {isUpdating && <Loader2 size={10} className="animate-spin" />}
                  Save
                </button>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-end">
              <div className="flex flex-col">
                <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                  <TrendingUp size={10} className="text-emerald-400" /> Current Month PnL
                </span>
                <span className={cn(
                  "text-xl font-black tracking-tighter",
                  currentMonthPnL >= 0 ? "text-emerald-400" : "text-rose-400"
                )}>
                  {currentMonthPnL >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(currentMonthPnL).toLocaleString('en-IN')}
                </span>
              </div>
              
              {!isEditingGoal ? (
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest flex items-center justify-end gap-1">
                    <Timer size={10} className="text-white/50" /> {daysLeftInMonth} Days Left
                  </span>
                  <span className="text-white text-xl font-black tracking-tighter uppercase">
                    Goal: <span className="font-sans">₹</span>{monthlyGoal.toLocaleString('en-IN')}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col text-right">
                  <span className="text-slate-500 text-[9px] font-black uppercase tracking-widest">Update Target</span>
                  <input 
                    type="number"
                    value={goalInput}
                    onChange={(e) => setGoalInput(e.target.value)}
                    className="bg-white/10 border border-white/20 rounded-lg px-2 py-1 text-white text-right font-black text-lg w-32 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden p-0.5 border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${goalProgress}%` }}
                className={cn(
                  "h-full rounded-full relative overflow-hidden",
                  goalProgress >= 100 ? "bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" : "bg-gradient-to-r from-indigo-600 to-indigo-400"
                )}
                transition={{ duration: 1.5, ease: "easeOut" }}
              >
                <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.1)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.1)_50%,rgba(255,255,255,0.1)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[pulse_2s_ease-in-out_infinite]" />
              </motion.div>
            </div>
            
            <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest text-center italic">
              {goalProgress >= 100 
                ? "Objective Secured. Monthly target exceeded." 
                : currentMonthPnL > 0 
                  ? `Maintain ₹${Math.round(dailyPnLNeeded).toLocaleString('en-IN')}/day to hit milestone`
                  : `Need ₹${Math.round(dailyPnLNeeded).toLocaleString('en-IN')}/day to recover and hit target`}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Monthly Outliers */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="bg-slate-900/40 border-white/5 p-4">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                <Award size={14} className="text-emerald-400" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest">Monthly Peak</h3>
           </div>
           {currentMonthTrades.length > 0 ? (
             (() => {
               const topWin = [...currentMonthTrades].sort((a, b) => b.pnl - a.pnl)[0];
               return topWin && topWin.pnl > 0 ? (
                 <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-1 line-clamp-1 opacity-70">{topWin.strategy}</p>
                   <p className="text-emerald-400 font-black text-xl leading-none italic">+₹{topWin.pnl.toLocaleString('en-IN')}</p>
                 </div>
               ) : <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-2 italic">No wins recorded</p>;
             })()
           ) : <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-2 italic">Awaiting session</p>}
        </GlassCard>

        <GlassCard className="bg-slate-900/40 border-white/5 p-4">
           <div className="flex items-center gap-2 mb-3">
              <div className="w-6 h-6 rounded bg-rose-500/10 flex items-center justify-center">
                <ShieldX size={14} className="text-rose-400" />
              </div>
              <h3 className="text-slate-900 dark:text-white font-black text-[9px] uppercase tracking-widest">Risk Outlier</h3>
           </div>
           {currentMonthTrades.length > 0 ? (
             (() => {
               const topLoss = [...currentMonthTrades].sort((a, b) => a.pnl - b.pnl)[0];
               return topLoss && topLoss.pnl < 0 ? (
                 <div>
                   <p className="text-[10px] font-black text-white uppercase tracking-tighter mb-1 line-clamp-1 opacity-70">{topLoss.strategy}</p>
                   <p className="text-rose-400 font-black text-xl leading-none italic">₹{topLoss.pnl.toLocaleString('en-IN')}</p>
                 </div>
               ) : <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-2 italic">Preserved capital</p>;
             })()
           ) : <p className="text-slate-500 font-black text-[9px] uppercase tracking-widest mt-2 italic">Awaiting session</p>}
        </GlassCard>
      </div>

      {/* Detailed Profit/Loss System */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 bg-emerald-500/5 dark:bg-emerald-500/5 border-emerald-500/20 group hover:bg-emerald-500/10 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
              <TrendingUp size={16} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Profit Capture</p>
          </div>
          <h3 className="text-2xl font-black text-emerald-500 italic leading-none mb-1">
            <span className="font-sans">+₹</span>{totalWins.toLocaleString('en-IN')}
          </h3>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">Gross Positive Yield</p>
          <div className="mt-4 pt-4 border-t border-emerald-500/10 flex justify-between">
            <div className="text-center">
              <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Wins</p>
              <p className="text-emerald-400 text-xs font-black">{winCount}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Avg Win</p>
              <p className="text-emerald-400 text-xs font-black">₹{Math.round(avgWin).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-5 bg-rose-500/5 dark:bg-rose-500/5 border-rose-500/20 group hover:bg-rose-500/10 transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-400">
              <TrendingDown size={16} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Loss Leakage</p>
          </div>
          <h3 className="text-2xl font-black text-rose-500 italic leading-none mb-1">
            <span className="font-sans">-₹</span>{totalLosses.toLocaleString('en-IN')}
          </h3>
          <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-none">Gross Resource Burn</p>
          <div className="mt-4 pt-4 border-t border-rose-500/10 flex justify-between">
            <div className="text-center">
              <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Losses</p>
              <p className="text-rose-400 text-xs font-black">{totalTrades - winCount}</p>
            </div>
            <div className="text-center">
              <p className="text-slate-500 text-[7px] font-black uppercase tracking-widest">Avg Loss</p>
              <p className="text-rose-400 text-xs font-black">₹{Math.round(avgLoss).toLocaleString()}</p>
            </div>
          </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 bg-indigo-500/5 border-indigo-500/20">
           <Zap className="text-indigo-400 mb-3" size={24} />
           <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Efficiency</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white">{winRate.toFixed(1)}%</h3>
           <p className="text-indigo-400/60 text-[9px] uppercase font-black mt-1 tracking-tighter">Win Accuracy</p>
        </GlassCard>
        <GlassCard className="p-5 bg-emerald-500/5 border-emerald-500/20">
           <Target className="text-emerald-400 mb-3" size={24} />
           <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">Profit Factor</p>
           <h3 className="text-2xl font-black text-slate-900 dark:text-white">{profitFactor}</h3>
           <p className="text-emerald-400/60 text-[9px] uppercase font-black mt-1 tracking-tighter">Yield Multiplier</p>
        </GlassCard>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 bg-slate-900/40 border-white/5">
           <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Avg Execution</p>
           <h4 className={cn("text-xl font-black", avgPnL >= 0 ? "text-emerald-400" : "text-rose-400")}>
            <span className="font-sans">₹</span>{avgPnL.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
           </h4>
        </GlassCard>
        <GlassCard className="p-5 bg-slate-900/40 border-white/5">
           <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest mb-1">Execution Count</p>
           <h4 className="text-xl font-black text-slate-900 dark:text-white">{totalTrades}</h4>
        </GlassCard>
      </div>

      {/* Psychological Streaks */}
      <GlassCard className="bg-slate-900/60 border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp size={20} className="text-indigo-400" />
          <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Streak Records</h3>
        </div>
        <div className="flex gap-6">
          <div className="flex-1 p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl text-center">
            <p className="text-emerald-500/50 text-[8px] font-black uppercase tracking-widest mb-1">Max Win Streak</p>
            <h4 className="text-3xl font-black text-emerald-400 tracking-tighter">{streaks.win}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Sessions</p>
          </div>
          <div className="flex-1 p-4 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-center">
            <p className="text-rose-500/50 text-[8px] font-black uppercase tracking-widest mb-1">Max Loss Streak</p>
            <h4 className="text-3xl font-black text-rose-400 tracking-tighter">{streaks.loss}</h4>
            <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Sessions</p>
          </div>
        </div>
      </GlassCard>

      {/* Strategy Profile */}
      <GlassCard className="bg-slate-900/60 border-white/5">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 size={20} className="text-indigo-400" />
          <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Strategy Mapping</h3>
        </div>
        <div className="space-y-4">
          {barData.length > 0 ? barData.map((s: any) => (
            <div key={s.name} className="p-4 bg-slate-500/5 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter">{s.name}</h4>
                  <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest">{s.count} Executions</p>
                </div>
                <div className="text-right">
                  <p className={cn("text-lg font-black tracking-tighter", s.profit >= 0 ? "text-emerald-400" : "text-rose-400")}>
                    {s.profit >= 0 ? '+' : '-'}<span className="font-sans">₹</span>{Math.abs(s.profit).toLocaleString('en-IN')}
                  </p>
                  <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">Profit Factor: {s.pf}</p>
                </div>
              </div>
              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500" 
                  style={{ width: `${s.winRate}%` }} 
                />
                <div 
                  className="h-full bg-rose-500 opacity-50" 
                  style={{ width: `${100 - s.winRate}%` }} 
                />
              </div>
              <div className="flex justify-between mt-1">
                <span className="text-[8px] font-black text-emerald-500/80 uppercase">Win {Math.round(s.winRate)}%</span>
                <span className="text-[8px] font-black text-rose-500/80 uppercase">Loss {Math.round(100 - s.winRate)}%</span>
              </div>
            </div>
          )) : (
            <div className="text-center py-10 opacity-30">
              <p className="text-xs uppercase font-black tracking-widest">No strategy data recorded</p>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Best/Worst Segments */}
      <div className="grid grid-cols-2 gap-4">
        <GlassCard className="p-5 border-emerald-500/10">
           <div className="flex items-center gap-2 mb-3">
             <CheckCircle size={14} className="text-emerald-400" />
             <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Top Strategy</p>
           </div>
           <h4 className="text-slate-900 dark:text-white font-black text-lg truncate uppercase tracking-tighter">{bestStrategy?.name || "N/A"}</h4>
           <p className="text-emerald-400 text-xs font-bold mt-1">+₹{bestStrategy?.profit.toLocaleString('en-IN')}</p>
        </GlassCard>
        <GlassCard className="p-5 border-rose-500/10">
           <div className="flex items-center gap-2 mb-3">
             <ShieldX size={14} className="text-rose-400" />
             <p className="text-slate-500 text-[9px] uppercase font-black tracking-widest">Worst Edge</p>
           </div>
           <h4 className="text-slate-900 dark:text-white font-black text-lg truncate uppercase tracking-tighter">{worstStrategy?.name || "N/A"}</h4>
           <p className="text-rose-400 text-xs font-bold mt-1">₹{worstStrategy?.profit.toLocaleString('en-IN')}</p>
        </GlassCard>
      </div>

      <GlassCard className="bg-slate-900/60 transition-all hover:bg-slate-900/80">
        <div className="flex items-center gap-2 mb-6">
          <CalendarIcon size={20} className="text-indigo-400" />
          <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Weekday Edge Log</h3>
        </div>
        <div className="space-y-4">
          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((dayName) => {
            const data = (weekdayData.find((d: any) => d.name === dayName) || { profit: 0, wins: 0, count: 1 }) as any;
            const wRate = Math.round((data.wins / (data.count || 1)) * 100);
            
            return (
              <div key={dayName} className="flex items-center justify-between p-3 bg-slate-500/5 dark:bg-white/5 rounded-2xl border border-slate-200 dark:border-white/5">
                <div className="flex flex-col">
                  <span className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-tighter">{dayName}</span>
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
            <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Master Equity Curve</h3>
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
          <h3 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-widest">Behavioral Leakage (Mistakes)</h3>
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
                 <span className="text-slate-900 dark:text-white text-xs font-black uppercase tracking-tighter">{m.name}</span>
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
