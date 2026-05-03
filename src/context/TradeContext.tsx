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
  orderBy,
  getDoc
} from 'firebase/firestore';
import { useAuth } from './AuthContext';
import { updateXP, CareerProfile, getCareerProfile, initializeCareerProfile } from '../services/careerService';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}
// ... (rest of imports and error handling)
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
  settings: {
    monthlyGoal: number;
    dailyTradeLimit?: number;
    dailyLossLimit?: number;
    isLockdownEnabled?: boolean;
  };
  careerProfile: CareerProfile | null;
  addTrade: (trade: Omit<Trade, 'id' | 'pnl' | 'rr'>) => Promise<void>;
  deleteTrade: (id: string) => Promise<void>;
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<void>;
  setMonthlyGoal: (goal: number) => Promise<void>;
  updateSettings: (newSettings: Partial<TradeContextType['settings']>) => Promise<void>;
  draftTrade: any | null;
  setDraftTrade: (data: any | null) => void;
  loading: boolean;
}

const TradeContext = createContext<TradeContextType | undefined>(undefined);

export const TradeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [settings, setSettingsLocal] = useState<TradeContextType['settings']>({ monthlyGoal: 100000 });
  const [draftTrade, setDraftTrade] = useState<any | null>(null);
  const [careerProfile, setCareerProfile] = useState<CareerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setTrades([]);
      setSettingsLocal({ monthlyGoal: 100000 });
      setCareerProfile(null);
      setLoading(false);
      return;
    }

    // Fetch career profile
    const careerPath = 'career';
    const careerUnsub = onSnapshot(doc(db, careerPath, user.uid), (doc) => {
      if (doc.exists()) {
        setCareerProfile(doc.data() as CareerProfile);
      } else {
        initializeCareerProfile(user.uid);
      }
    });

    // Fetch settings
    const settingsPath = 'settings';
    const settingsUnsubscribe = onSnapshot(doc(db, settingsPath, user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSettingsLocal({
          monthlyGoal: data.monthlyGoal || 100000,
          dailyTradeLimit: data.dailyTradeLimit,
          dailyLossLimit: data.dailyLossLimit,
          isLockdownEnabled: data.isLockdownEnabled
        });
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
      careerUnsub();
    };
  }, [user]);

  const updateSettings = async (newSettings: Partial<TradeContextType['settings']>) => {
    if (!user) return;
    const path = `settings/${user.uid}`;
    try {
      await setDoc(doc(db, 'settings', user.uid), {
        ...newSettings,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const setMonthlyGoal = async (goal: number) => {
    await updateSettings({ monthlyGoal: goal });
  };

  const addTrade = async (tradeData: Omit<Trade, 'id' | 'pnl' | 'rr'>) => {
    if (!user) return;

    const path = 'trades';
    const id = crypto.randomUUID();
    const pnl = calculatePnL(tradeData.entry, tradeData.exit, tradeData.lotSize, tradeData.type);
    const rr = calculateRR(tradeData.entry, tradeData.sl, tradeData.tp);
    
    try {
      const tradeObj: any = {
        ...tradeData,
        userId: user.uid,
        pnl,
        rr,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(doc(db, path, id), tradeObj);

      // Career System Integration
      // Fetch discipline score from DNA
      const dnaSnap = await getDoc(doc(db, 'dna', user.uid));
      const disciplineScore = dnaSnap.exists() ? dnaSnap.data().disciplineScore : 75; // Default to 75 if no DNA
      
      await updateXP(user.uid, { ...tradeObj, id }, disciplineScore);

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
    <TradeContext.Provider value={{ 
      trades, 
      monthlyGoal: settings.monthlyGoal, 
      settings, 
      careerProfile,
      addTrade, 
      deleteTrade, 
      updateTrade, 
      setMonthlyGoal, 
      updateSettings, 
      draftTrade, 
      setDraftTrade, 
      loading 
    }}>
      {children}
    </TradeContext.Provider>
  );
};

export const useTrades = () => {
  const context = useContext(TradeContext);
  if (!context) throw new Error('useTrades must be used within a TradeProvider');
  return context;
};
