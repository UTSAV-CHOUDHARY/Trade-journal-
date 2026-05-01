import { Trade, TradeType } from './types';

export const calculatePnL = (entry: number, exit: number, lotSize: number, type: TradeType): number => {
  if (type === 'Buy') {
    return (exit - entry) * lotSize;
  }
  return (entry - exit) * lotSize;
};

export const calculateRR = (entry: number, sl: number, tp: number, type?: TradeType): number => {
  const risk = Math.abs(entry - sl);
  const reward = Math.abs(tp - entry);
  if (risk === 0) return 0;
  
  // Basic absolute RR
  return Number((reward / risk).toFixed(2));
};

export const getStreak = (trades: Trade[]) => {
  if (trades.length === 0) return 0;
  
  const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  let streak = 0;
  const firstPnL = sortedTrades[0].pnl;
  const isWinning = firstPnL > 0;

  for (const trade of sortedTrades) {
    if (isWinning && trade.pnl > 0) streak++;
    else if (!isWinning && trade.pnl < 0) streak++;
    else if (trade.pnl === 0) continue; // Skip breakeven in streak? Usually yes
    else break;
  }
  
  return isWinning ? streak : -streak;
};

export const getLongestStreaks = (trades: Trade[]) => {
  if (trades.length === 0) return { win: 0, loss: 0 };
  
  const sortedTrades = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  let maxWin = 0;
  let maxLoss = 0;
  let currentWin = 0;
  let currentLoss = 0;

  for (const trade of sortedTrades) {
    if (trade.pnl > 0) {
      currentWin++;
      currentLoss = 0;
      if (currentWin > maxWin) maxWin = currentWin;
    } else if (trade.pnl < 0) {
      currentLoss++;
      currentWin = 0;
      if (currentLoss > maxLoss) maxLoss = currentLoss;
    }
  }

  return { win: maxWin, loss: maxLoss };
};

export const getAccuracyRank = (winRate: number) => {
  if (winRate < 30) return { name: 'QUIT TRADING', icon: '🛑' };
  if (winRate < 50) return { name: 'Poor', icon: '📉' };
  if (winRate === 50) return { name: 'Average', icon: '😐' };
  if (winRate < 70) return { name: 'Good', icon: '👍' };
  if (winRate < 90) return { name: 'Excellent', icon: '🔥' };
  return { name: 'God Level', icon: '👑' };
};
