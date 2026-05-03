import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trophy, Star, Zap, Target, Shield, Sword, Lock, CheckCircle2, ChevronRight, Award, Flame, TrendingUp, Share2, Download, X } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { CareerProfile, Challenge, LEVELS, STATIC_CHALLENGES } from '../services/careerService';
import { GlassCard } from './GlassCard';
import { cn } from '../lib/utils';
import confetti from 'canvas-confetti';
import { toPng } from 'html-to-image';

export const CareerMode: React.FC = () => {
  const { user } = useAuth();
  const { trades } = useTrades();
  const [profile, setProfile] = useState<CareerProfile | null>(null);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [canClaim, setCanClaim] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const shareCardRef = useRef<HTMLDivElement>(null);

  const fireConfetti = useCallback(() => {
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 200 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval: any = setInterval(function() {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
      confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
    }, 250);
  }, []);

  useEffect(() => {
    if (showLevelUp) {
      fireConfetti();
      // Delay the claim button
      setCanClaim(false);
      const timer = setTimeout(() => setCanClaim(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [showLevelUp, fireConfetti]);

  useEffect(() => {
    if (!user) return;

    // Listen to career profile
    const profileUnsub = onSnapshot(doc(db, 'career', user.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data() as CareerProfile;
        if (profile && data.level > profile.level) {
          setShowLevelUp(true);
        }
        setProfile(data);
      }
      setLoading(false);
    });

    // Listen to challenges
    const challengesUnsub = onSnapshot(query(collection(db, 'career', user.uid, 'challenges')), (snap) => {
      const chals: Challenge[] = [];
      snap.forEach(d => chals.push(d.data() as Challenge));
      setChallenges(chals);
    });

    return () => {
      profileUnsub();
      challengesUnsub();
    };
  }, [user]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="w-8 h-8 border-2 border-indigo-500/20 border-t-indigo-500 rounded-full" />
    </div>
  );

  const xpProgress = profile ? (profile.currentXP / profile.nextLevelXP) * 100 : 0;

  const handleShareAchievement = async () => {
    if (!shareCardRef.current) return;
    setIsCapturing(true);
    try {
      // Small delay to ensure styles are applied
      await new Promise(r => setTimeout(r, 100));
      const dataUrl = await toPng(shareCardRef.current, {
        cacheBust: true,
        backgroundColor: '#020617', // Dark slate 950
        style: {
          transform: 'scale(1)',
        }
      });
      
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `achievement-${selectedAchievement?.toLowerCase().replace(/\s+/g, '-')}.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Achievement Unlocked!',
          text: `I just earned the "${selectedAchievement}" badge on Terminal v2.0! Level ${profile?.level} ${profile?.levelName}.`
        });
      } else {
        // Fallback: Download
        const link = document.createElement('a');
        link.download = `terminal-achievement.png`;
        link.href = dataUrl;
        link.click();
      }
    } catch (err) {
      console.error('Sharing failed:', err);
    } finally {
      setIsCapturing(false);
    }
  };

  return (
    <div className="space-y-6 pb-24 px-2">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-light font-serif italic text-slate-900 dark:text-white tracking-tight">Career Forge India</h1>
          <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.4em] mt-1">Professional Identity Progression</p>
        </div>
        <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
          <Trophy size={24} className="text-indigo-400" />
        </div>
      </header>

      {/* Level Card */}
      <GlassCard className="p-6 relative overflow-hidden bg-gradient-to-br from-indigo-600/10 via-transparent to-transparent border-indigo-500/20">
        <div className="absolute -top-10 -right-10 opacity-5 rotate-12">
          <Award size={200} className="text-indigo-500" />
        </div>
        
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Current Identity</p>
              <h2 className="text-3xl font-black text-white italic uppercase">{profile?.levelName || 'Beginner Trader'}</h2>
            </div>
            <div className="bg-indigo-500 text-white px-4 py-2 rounded-xl font-black text-xs italic shadow-lg shadow-indigo-500/30">
              LVL {profile?.level || 1}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-slate-500">
              <span>XP Progress</span>
              <span className="text-indigo-400">{profile?.currentXP.toLocaleString()} / {profile?.nextLevelXP.toLocaleString()} XP</span>
            </div>
            <div className="h-4 bg-slate-900/60 rounded-full p-1 border border-white/5">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(xpProgress, 100)}%` }}
                className="h-full bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)]"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
             <div className="flex-1 p-3 bg-white/5 rounded-2x border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Total Career XP</p>
                <p className="text-lg font-black text-white italic">{profile?.totalXP.toLocaleString()}</p>
             </div>
             <div className="flex-1 p-3 bg-white/5 rounded-2x border border-white/5">
                <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Active Streak</p>
                <div className="flex items-center gap-2">
                  <p className="text-lg font-black text-white italic">{profile?.streak || 0} Days</p>
                  <Flame size={16} className={cn(profile?.streak && profile.streak > 0 ? "text-orange-500" : "text-slate-700")} />
                </div>
             </div>
          </div>
        </div>
      </GlassCard>

      {/* Alpha Challenges */}
      <section className="space-y-4">
        <div className="flex justify-between items-end px-2">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Alpha Challenges</h3>
          <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Level Unlocks</p>
        </div>

        <div className="space-y-3">
          {STATIC_CHALLENGES.filter(c => c.minLevel <= (profile?.level || 1)).map((sc) => {
            const userChal = challenges.find(c => c.id === sc.id);
            const progress = userChal ? (userChal.current / userChal.target) * 100 : 0;
            const isCompleted = userChal?.isCompleted;

            return (
              <div key={sc.id}>
                <GlassCard className={cn("p-4 border-l-4 transition-all", isCompleted ? "border-l-emerald-500 opacity-60" : "border-l-indigo-500")}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <h4 className="text-sm font-black text-white uppercase italic mb-1">{sc.title}</h4>
                      <p className="text-[10px] text-slate-500 font-medium leading-tight mb-3">"{sc.description}"</p>
                      
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[8px] font-black text-slate-700 dark:text-slate-500 uppercase">
                          <span>{userChal?.current || 0} / {sc.target}</span>
                          <span>{Math.round(progress)}%</span>
                        </div>
                        <div className="h-1 bg-slate-900 rounded-full overflow-hidden">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(progress, 100)}%` }}
                            className={cn("h-full transition-colors", isCompleted ? "bg-emerald-500" : "bg-indigo-500")}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="text-center shrink-0">
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-1", isCompleted ? "bg-emerald-500 text-white" : "bg-white/5 text-indigo-400 border border-white/5")}>
                         {isCompleted ? <CheckCircle2 size={20} /> : <Zap size={18} />}
                      </div>
                      <p className="text-[8px] font-black text-indigo-500">+{sc.xpReward} XP</p>
                    </div>
                  </div>
                </GlassCard>
              </div>
            );
          })}
        </div>
      </section>

      {/* Locked/Future Progression */}
      <section className="space-y-4">
         <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Identity Path</h3>
         <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
            {LEVELS.map((lvl) => {
              const isLocked = lvl.level > (profile?.level || 1);
              return (
                <div 
                  key={lvl.level} 
                  className={cn(
                    "flex-shrink-0 w-32 p-4 rounded-[2rem] border transition-all",
                    isLocked ? "bg-slate-900/40 border-white/5 opacity-40" : "bg-indigo-500 text-white border-indigo-400 shadow-lg shadow-indigo-500/20"
                  )}
                >
                  <div className="flex flex-col items-center text-center gap-2">
                    <div className={cn("w-10 h-10 rounded-2xl flex items-center justify-center", isLocked ? "bg-white/5" : "bg-white/20")}>
                       {isLocked ? <Lock size={16} className="text-slate-600" /> : <Star size={20} className="fill-white" />}
                    </div>
                    <div>
                      <p className="text-[8px] font-black opacity-60 uppercase mb-1">LVL {lvl.level}</p>
                      <h5 className="text-[9px] font-black uppercase italic tracking-tighter leading-tight">{lvl.name}</h5>
                    </div>
                  </div>
                </div>
              );
            })}
         </div>
      </section>

      {/* Achievements / Badges */}
      <section className="space-y-4">
         <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest px-2">Hall of Fame</h3>
         <div className="grid grid-cols-4 gap-3 bg-slate-900/40 p-4 rounded-[2.5rem] border border-white/5">
            {profile?.achievements.map((ach, idx) => (
              <motion.div 
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                whileHover={{ scale: 1.1 }}
                onClick={() => setSelectedAchievement(ach)}
                className="aspect-square bg-indigo-500/10 rounded-2xl flex flex-col items-center justify-center p-2 border border-indigo-500/20 group cursor-pointer relative"
              >
                 <Award size={24} className="text-indigo-400 group-hover:text-indigo-300 transition-colors" />
                 <span className="text-[6px] font-black text-indigo-300 mt-2 text-center uppercase leading-none truncate w-full">{ach}</span>
                 <div className="absolute inset-0 bg-indigo-500/10 opacity-0 group-hover:opacity-100 rounded-2xl flex items-center justify-center transition-opacity">
                    <Share2 size={12} className="text-white" />
                 </div>
              </motion.div>
            ))}
            {(!profile?.achievements || profile.achievements.length === 0) && (
              <div className="col-span-4 py-8 text-center bg-white/5 rounded-3xl border border-dashed border-white/10">
                 <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">No Alpha Trophies Yet</p>
                 <p className="text-[7px] font-bold text-slate-700 uppercase mt-1">Complete challenges to earn badges</p>
              </div>
            )}
         </div>
      </section>

      {/* Level Up Overlay */}
      <AnimatePresence>
        {selectedAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6"
          >
            <div className="w-full max-w-sm flex flex-col items-center">
              {/* Share Card to Capture */}
              <div 
                ref={shareCardRef}
                className="w-full aspect-[4/5] bg-slate-950 rounded-[3rem] p-8 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center text-center shadow-2xl"
              >
                {/* Background Decor */}
                <div className="absolute inset-0 bg-gradient-to-t from-indigo-500/10 via-transparent to-transparent pointer-events-none" />
                <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
                <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl" />
                
                <div className="relative z-10 space-y-6">
                  <motion.div
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="w-24 h-24 bg-indigo-500 rounded-[2.5rem] mx-auto flex items-center justify-center shadow-[0_0_40px_rgba(99,102,241,0.4)]"
                  >
                    <Award size={48} className="text-white" />
                  </motion.div>

                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">Achievement Unlocked</p>
                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter leading-none">{selectedAchievement}</h3>
                  </div>

                  <div className="pt-8 border-t border-white/5 flex items-center justify-center gap-6">
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Rank</p>
                      <p className="text-sm font-black text-white italic uppercase">{profile?.levelName}</p>
                    </div>
                    <div className="w-px h-8 bg-white/5" />
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-500 uppercase">Level</p>
                      <p className="text-sm font-black text-white italic uppercase">LVL {profile?.level}</p>
                    </div>
                  </div>

                  <div className="absolute bottom-10 left-0 right-0 px-8 flex justify-between items-end opacity-40">
                    <div className="text-left">
                      <p className="text-[7px] font-black text-indigo-300 uppercase italic">Terminal v2.0</p>
                      <p className="text-[6px] font-bold text-slate-600 uppercase">Career Management System</p>
                    </div>
                    <Star size={16} className="text-indigo-400 opacity-20" />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 w-full mt-8">
                <button 
                  onClick={() => setSelectedAchievement(null)}
                  className="flex-1 py-4 bg-white/5 text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest border border-white/5 hover:bg-white/10 transition-all flex items-center justify-center gap-2"
                >
                  <X size={14} /> Close
                </button>
                <button 
                  onClick={handleShareAchievement}
                  disabled={isCapturing}
                  className="flex-[2] py-4 bg-indigo-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  {isCapturing ? <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="w-3 h-3 border border-white border-t-transparent rounded-full" /> : <Share2 size={14} />}
                  {isCapturing ? 'Generating...' : 'Share Achievement'}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Level Up Overlay */}
      <AnimatePresence>
        {showLevelUp && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-indigo-950/95 flex items-center justify-center p-6 backdrop-blur-xl"
          >
            <div className="relative w-full max-w-sm text-center">
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: [0, 1.5, 1], rotate: [0, 10, 0] }}
                transition={{ 
                  duration: 0.8,
                  times: [0, 0.6, 1],
                  type: 'spring', 
                  damping: 12 
                }}
                className="w-32 h-32 bg-indigo-500 rounded-[3rem] mx-auto flex items-center justify-center shadow-[0_0_50px_rgba(99,102,241,0.6)] mb-8"
              >
                <Star size={64} className="text-white fill-white" />
              </motion.div>

              <motion.h2 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-5xl font-black text-white uppercase italic tracking-tighter mb-2"
              >
                Level Up!
              </motion.h2>
              <motion.p 
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-indigo-400 text-sm font-black uppercase tracking-[0.3em] mb-8"
              >
                Ascended to {profile?.levelName}
              </motion.p>

              <div className="grid grid-cols-2 gap-4 mb-12">
                 <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ delay: 0.8 }}
                   className="p-4 bg-white/10 rounded-3xl border border-white/10"
                 >
                    <Zap className="text-indigo-400 mx-auto mb-2" size={24} />
                    <p className="text-[8px] font-black text-slate-400 uppercase">Features Unlocked</p>
                    <p className="text-xs font-black text-white uppercase mt-1">Advanced Perks</p>
                 </motion.div>
                 <motion.div 
                   initial={{ scale: 0.8, opacity: 0 }}
                   animate={{ scale: 1, opacity: 1 }}
                   transition={{ delay: 1.0 }}
                   className="p-4 bg-white/10 rounded-3xl border border-white/10"
                 >
                    <TrendingUp className="text-emerald-400 mx-auto mb-2" size={24} />
                    <p className="text-[8px] font-black text-slate-400 uppercase">Status Boost</p>
                    <p className="text-xs font-black text-white uppercase mt-1">Alpha Tier</p>
                 </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: canClaim ? 1 : 0.3, y: canClaim ? 0 : 20 }}
                className="relative"
              >
                <button 
                  onClick={() => canClaim && setShowLevelUp(false)}
                  disabled={!canClaim}
                  className={cn(
                    "w-full py-5 rounded-[2rem] font-black uppercase text-sm tracking-widest shadow-2xl transition-all active:scale-95",
                    canClaim 
                      ? "bg-white text-indigo-900 hover:bg-slate-100 cursor-pointer" 
                      : "bg-white/10 text-white/50 cursor-not-allowed"
                  )}
                >
                  {canClaim ? 'Claim Destiny' : 'Manifesting...'}
                </button>
              </motion.div>
            </div>
            
            {/* Particle effects simulation */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
               {[...Array(20)].map((_, i) => (
                 <motion.div
                   key={i}
                   initial={{ 
                     x: '50%', 
                     y: '50%', 
                     opacity: 1, 
                     scale: 1 
                   }}
                   animate={{ 
                     x: `${Math.random() * 100}%`, 
                     y: `${Math.random() * 100}%`, 
                     opacity: 0,
                     scale: 0 
                   }}
                   transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                   className="absolute w-2 h-2 bg-indigo-400 rounded-full"
                 />
               ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
