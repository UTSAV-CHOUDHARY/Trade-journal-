import { db } from '../lib/firebase';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  serverTimestamp, 
  collection, 
  query, 
  getDocs, 
  where 
} from 'firebase/firestore';
import { Trade } from '../types';

export interface CareerProfile {
  level: number;
  levelName: string;
  currentXP: number;
  nextLevelXP: number;
  totalXP: number;
  streak: number;
  lastActivityDate: string | null;
  unlockedFeatures: string[];
  achievements: string[];
  updatedAt: any;
}

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: 'trade_count' | 'rr_follow' | 'discipline_score' | 'streak';
  target: number;
  current: number;
  xpReward: number;
  isCompleted: boolean;
  minLevel: number;
}

export const LEVELS = [
  { level: 1, name: 'Beginner Trader', threshold: 0 },
  { level: 2, name: 'Risk Manager', threshold: 5000 },
  { level: 3, name: 'Strategy Master', threshold: 15000 },
  { level: 4, name: 'Elite Trader', threshold: 40000 },
];

export const STATIC_CHALLENGES: Omit<Challenge, 'current' | 'isCompleted'>[] = [
  { id: 'beg_5_trades', title: 'The First Steps', description: 'Log 5 trades with a valid stop loss.', type: 'trade_count', target: 5, xpReward: 500, minLevel: 1 },
  { id: 'risk_10_rr', title: 'Precision Management', description: 'Maintain a 1:2 Risk-Reward ratio for 10 trades.', type: 'rr_follow', target: 10, xpReward: 1500, minLevel: 2 },
  { id: 'strat_consistent', title: 'Strategic Discipline', description: 'Follow the same strategy for 20 trades.', type: 'trade_count', target: 20, xpReward: 3000, minLevel: 3 },
  { id: 'elite_zen', title: 'The Zen state', description: 'Maintain a Discipline Score > 90 for 30 days.', type: 'discipline_score', target: 30, xpReward: 10000, minLevel: 4 },
];

export const getCareerProfile = async (userId: string): Promise<CareerProfile | null> => {
  const docRef = doc(db, 'career', userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data() as CareerProfile;
  }
  return null;
};

export const initializeCareerProfile = async (userId: string) => {
  const initialProfile: CareerProfile = {
    level: 1,
    levelName: LEVELS[0].name,
    currentXP: 0,
    nextLevelXP: LEVELS[1].threshold,
    totalXP: 0,
    streak: 0,
    lastActivityDate: null,
    unlockedFeatures: ['Basic Journaling'],
    achievements: [],
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, 'career', userId), initialProfile);
  return initialProfile;
};

export const updateXP = async (userId: string, trade: Trade, disciplineScore: number) => {
  const profile = await getCareerProfile(userId) || await initializeCareerProfile(userId);
  
  // XP Calculation Logics
  let xpGained = 50; // Base
  
  // Discipline Multiplier
  xpGained = Math.round(xpGained * (disciplineScore / 100));
  
  // Bonus Patterns
  if (trade.mistakes.length === 0) xpGained += 100;
  if (trade.rr >= 2) xpGained += 50;
  
  // Streak Logic
  const today = new Date().toISOString().split('T')[0];
  let newStreak = profile.streak;
  if (profile.lastActivityDate !== today) {
    newStreak += 1;
    xpGained += (newStreak * 10); // Streak bonus
  }

  const newTotalXP = profile.totalXP + xpGained;
  const newCurrentXP = profile.currentXP + xpGained;
  
  // Level Up Logic
  let newLevel = profile.level;
  let newLevelName = profile.levelName;
  let nextThreshold = profile.nextLevelXP;

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (newTotalXP >= LEVELS[i].threshold) {
      if (LEVELS[i].level > newLevel) {
        newLevel = LEVELS[i].level;
        newLevelName = LEVELS[i].name;
        nextThreshold = LEVELS[i+1]?.threshold || LEVELS[i].threshold * 2;
      }
      break;
    }
  }

  const updatedProfile: Partial<CareerProfile> = {
    level: newLevel,
    levelName: newLevelName,
    currentXP: newCurrentXP,
    totalXP: newTotalXP,
    nextLevelXP: nextThreshold,
    streak: newStreak,
    lastActivityDate: today,
    updatedAt: serverTimestamp(),
  };

  await updateDoc(doc(db, 'career', userId), updatedProfile);
  
  // Update Challenges
  await updateChallengeProgress(userId, trade, newLevel);
  
  return { xpGained, levelUp: newLevel > profile.level };
};

const updateChallengeProgress = async (userId: string, trade: Trade, userLevel: number) => {
  const challengesRef = collection(db, 'career', userId, 'challenges');
  
  for (const staticChallenge of STATIC_CHALLENGES) {
    if (userLevel < staticChallenge.minLevel) continue;
    
    const chalDocRef = doc(challengesRef, staticChallenge.id);
    const chalSnap = await getDoc(chalDocRef);
    
    let chalData: Challenge;
    if (!chalSnap.exists()) {
       chalData = { ...staticChallenge, current: 0, isCompleted: false };
    } else {
       chalData = chalSnap.data() as Challenge;
    }

    if (chalData.isCompleted) continue;

    // Progression logic based on challenge type
    let increment = 0;
    if (chalData.type === 'trade_count') increment = 1;
    if (chalData.type === 'rr_follow' && trade.rr >= 2) increment = 1;

    if (increment > 0) {
      const newCurrent = chalData.current + increment;
      const isNowCompleted = newCurrent >= chalData.target;
      
      await setDoc(chalDocRef, {
        ...chalData,
        current: newCurrent,
        isCompleted: isNowCompleted,
      });

      if (isNowCompleted) {
        // Reward user directly in profile
        const profileRef = doc(db, 'career', userId);
        const pSnap = await getDoc(profileRef);
        if (pSnap.exists()) {
           const pData = pSnap.data();
           await updateDoc(profileRef, {
             totalXP: pData.totalXP + chalData.xpReward,
             currentXP: pData.currentXP + chalData.xpReward,
             achievements: [...(pData.achievements || []), chalData.title]
           });
        }
      }
    }
  }
};
