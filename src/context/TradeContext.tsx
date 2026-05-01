import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade } from '../types';
import { calculatePnL, calculateRR } from '../utils';

interface TradeContextType {
  trades: Trade[];
  addTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'rr'>) => void;
  deleteTrade: (id: string) => void;
  updateTrade: (id: string, trade: Partial<Trade>) => void;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('tradeflow_trades');
    if (saved) {
      try {
        setTrades(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse trades', e);
      }
    }
  }, []);

  useEffect(() => {
    if (trades.length > 0) {
      localStorage.setItem('tradeflow_trades', JSON.stringify(trades));
    }
  }, [trades]);

  const addTrade = (tradeData: Omit<Trade, 'id' | 'pnl' | 'rr'>) => {
    const pnl = calculatePnL(tradeData.entry, tradeData.exit, tradeData.lotSize, tradeData.type);
    const rr = calculateRR(tradeData.entry, tradeData.sl, tradeData.tp);
    
    const newTrade: Trade = {
      ...tradeData,
      id: crypto.randomUUID(),
      pnl,
      rr
    };
    
    setTrades(prev => [newTrade, ...prev]);
  };

  const deleteTrade = (id: string) => {
    setTrades(prev => prev.filter(t => t.id !== id));
  };

  const updateTrade = (id: string, updatedFields: Partial<Trade>) => {
    setTrades(prev => prev.map(t => {
      if (t.id === id) {
        const merged = { ...t, ...updatedFields };
        // Recalculate pnl and rr if core values changed
        const pnl = calculatePnL(merged.entry, merged.exit, merged.lotSize, merged.type);
        const rr = calculateRR(merged.entry, merged.sl, merged.tp);
        return { ...merged, pnl, rr };
      }
      return t;
    }));
  };

  return (
    <TradeContext.Provider value={{ trades, addTrade, deleteTrade, updateTrade }}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrades must be used within a TradeProvider');
  return context;
};
