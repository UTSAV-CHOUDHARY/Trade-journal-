import React, { createContext, useContext, useState, useEffect } from 'react';
import { Trade } from '../types';
import { calculatePnL, calculateRR } from '../utils';
import { db, auth } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  where, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { useAuth } from './AuthContext';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: any;
}

const handleFirestoreError = (error: unknown, operationType: OperationType, path: string | null) => {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
};

interface TradeContextType {
  trades: Trade[];
  monthlyGoal: number;
  addTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'rr'>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  setMonthlyGoal: (goal: number) => Promise<void>;
  loading: boolean;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [monthlyGoal, setMonthlyGoalLocal] = useState<number>(100000);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTrades([]);
      setMonthlyGoalLocal(100000);
      setLoading(false);
      return;
    }

    // Fetch monthly goal
    const settingsPath = 'settings';
    const settingsUnsubscribe = onSnapshot(doc(db, settingsPath, user.uid), (doc) => {
      if (doc.exists()) {
        setMonthlyGoalLocal(doc.data().monthlyGoal || 100000);
      }
    }, (error) => {
      console.warn('Failed to fetch settings, using default goal', error);
    });

    const path = 'trades';
    const q = query(
      collection(db, path),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const tradeList: Trade[] = [];
      snapshot.forEach((doc) => {
        tradeList.push({ id: doc.id, ...doc.data() } as Trade);
      });
      setTrades(tradeList);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });

    return () => {
      unsubscribe();
      settingsUnsubscribe();
    };
  }, [user]);

  const setMonthlyGoal = async (goal: number) => {
    if (!user) return;
    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), {
        monthlyGoal: goal,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'pnl' | 'rr'>) => {
    if (!user) return;

    const path = 'trades';
    const id = crypto.randomUUID();
    const pnl = calculatePnL(tradeData.entry, tradeData.exit, tradeData.lotSize, tradeData.type);
    const rr = calculateRR(tradeData.entry, tradeData.sl, tradeData.tp);
    
    try {
      await setDoc(doc(db, path, id), {
        ...tradeData,
        userId: user.uid,
        pnl,
        rr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `${path}/${id}`);
    }
  };

  const deleteTrade = async (id: string) => {
    const path = `trades/${id}`;
    try {
      await deleteDoc(doc(db, 'trades', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const updateTrade = async (id: string, updatedFields: Partial<Trade>) => {
    const path = `trades/${id}`;
    const trade = trades.find(t => t.id === id);
    if (!trade) return;

    const merged = { ...trade, ...updatedFields };
    const pnl = calculatePnL(merged.entry, merged.exit, merged.lotSize, merged.type);
    const rr = calculateRR(merged.entry, merged.sl, merged.tp);

    try {
      await updateDoc(doc(db, 'trades', id), {
        ...updatedFields,
        pnl,
        rr,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  return (
    <TradeContext.Provider value={{ trades, monthlyGoal, addTrade, deleteTrade, updateTrade, setMonthlyGoal, loading }}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrades must be used within a TradeProvider');
  return context;
};
