export type TradeType = 'Buy' | 'Sell';
export type StrategyType = 'Scalping' | 'Intraday' | 'Swing' | 'Custom';
export type MistakeTag = 'Fear' | 'Overtrading' | 'Late Entry' | 'Early Exit' | 'No Setup' | 'Reversed Trade' | 'Averaging Loss';
export type MoodType = '😃 Happy' | '😐 Neutral' | '😡 Angry' | '😫 Frustrated' | '😨 Fearful' | '🤑 Greedy';
export type IndexType = 'Nifty 50' | 'Bank Nifty' | 'Finnifty' | 'Midcap Nifty' | 'Sensex' | 'Stocks';

export interface Trade {
  id: string;
  date: string; // ISO date string
  entryTime: string;
  exitTime: string;
  entry: number;
  exit: number;
  sl: number;
  tp: number;
  lotSize: number;
  type: TradeType;
  strategy: StrategyType;
  index: IndexType;
  mood: MoodType;
  mistakes: MistakeTag[];
  entryCondition: string;
  exitCondition: string;
  notes: string;
  pnl: number;
  rr: number;
  screenshot?: string; // base64 data url
}

export interface JournalStats {
  totalPnL: number;
  winRate: number;
  totalTrades: number;
  currentStreak: number;
  avgRR: number;
  bestStrategy: string;
  commonMistake: string;
  winStreak: number;
  lossStreak: number;
}
