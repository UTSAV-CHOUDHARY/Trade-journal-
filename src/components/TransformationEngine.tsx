import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Brain, Zap, Shield, Mic, Activity, Target, AlertTriangle, TrendingUp, UserCheck, Eye, EyeOff, Clapperboard, Sparkles, Sword, UserPlus, Rocket, ShieldAlert, ChevronRight, CheckCircle2, User, Flame } from 'lucide-react';
import { useTrades } from '../context/TradeContext';
import { GlassCard } from './GlassCard';
import { analyzeTraderDNA, TraderDNA, getPrediction, generateWeeklyDocumentaryScript, DocumentaryScript, processVoiceTranscript, getAlterEgoDirectives, getCoachAdvice, CoachAdvice } from '../services/transformationService';
import { cn } from '../lib/utils';
import { useAuth } from '../context/AuthContext';
import { DocumentaryPlayer } from './DocumentaryPlayer';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export const TransformationEngine: React.FC = () => {
  const { trades, settings, updateSettings, setDraftTrade } = useTrades();
  const { user } = useAuth();
  const [dna, setDna] = useState<TraderDNA | null>(null);
  const [coachAdvice, setCoachAdvice] = useState<CoachAdvice | null>(null);
  const [isGeneratingAdvice, setIsGeneratingAdvice] = useState(false);
  const [prediction, setPrediction] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [docScript, setDocScript] = useState<DocumentaryScript | null>(null);
  const [viewMode, setViewMode] = useState<'dna' | 'control' | 'alterego'>('dna');
  const [selectedPersonality, setSelectedPersonality] = useState('The Sniper');
  const [directives, setDirectives] = useState<{ directives: string[], affirmation: string } | null>(null);
  const [isGeneratingDirectives, setIsGeneratingDirectives] = useState(false);
  const [streak, setStreak] = useState(0);
  const [scorecard, setScorecard] = useState({
    slSet: false,
    setupConfirmed: false,
    riskCalculated: false,
    moodCheck: false
  });

  // Automated Information Collection & Stats
  const [alterEgoStats, setAlterEgoStats] = useState({
    opportunityGap: 0,
    egoWinRate: 0,
    realWinRate: 0,
    riskReduction: 0,
    peakHour: 'N/A',
    bestDay: 'N/A'
  });

  useEffect(() => {
    if (!trades.length) return;

    // Calculate real vs optimized stats
    const realWins = trades.filter(t => t.pnl > 0).length;
    const realWinRate = (realWins / trades.length) * 100;

    // Filter out "Mistake Trades" to see potential win rate
    const disciplineTrades = trades.filter(t => !t.mistakes || t.mistakes.length === 0);
    const egoWins = disciplineTrades.filter(t => t.pnl > 0).length;
    const egoWinRate = disciplineTrades.length > 0 ? (egoWins / disciplineTrades.length) * 100 : realWinRate;

    // Capital preserved = sum of losses from mistakes
    const mistakeLosses = trades
      .filter(t => t.pnl < 0 && t.mistakes && t.mistakes.length > 0)
      .reduce((acc, t) => acc + Math.abs(t.pnl), 0);

    // Peak Performance Time
    const hours = trades.map(t => new Date(t.date).getHours());
    const hourCount = hours.reduce((acc: any, h) => ({ ...acc, [h]: (acc[h] || 0) + 1 }), {});
    const peakHour = Object.entries(hourCount).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '10';

    // Best Day
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const weekDays = trades.map(t => new Date(t.date).getDay());
    const dayCount = weekDays.reduce((acc: any, d) => ({ ...acc, [d]: (acc[d] || 0) + 1 }), {});
    const bestDayIdx = Object.entries(dayCount).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || '1';

    setAlterEgoStats({
      realWinRate,
      egoWinRate: Math.max(egoWinRate, realWinRate + 10),
      opportunityGap: mistakeLosses,
      riskReduction: trades.some(t => t.mistakes?.length > 0) ? 65 : 15,
      peakHour: `${peakHour}:00`,
      bestDay: days[parseInt(bestDayIdx)]
    });

    // Calculate streak
    let currentStreak = 0;
    const sortedTrades = [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const t of sortedTrades) {
      if (t.mistakes && t.mistakes.length === 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    setStreak(currentStreak);
  }, [trades]);

  const personalities = [
    { name: 'The Sniper', desc: 'Precision & Patience', icon: Target, accent: 'text-rose-500', bg: 'bg-rose-500/10' },
    { name: 'The Monk', desc: 'Emotional Stillness', icon: Brain, accent: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { name: 'The Shield', desc: 'Unbreakable Defense', icon: Shield, accent: 'text-emerald-400', bg: 'bg-emerald-500/10' },
    { name: 'The Visionary', desc: 'Long-term Strategy', icon: Eye, accent: 'text-amber-400', bg: 'bg-amber-500/10' }
  ];

  useEffect(() => {
    if (viewMode === 'alterego' && !directives) {
      handleGenerateDirectives('The Sniper');
    }
  }, [viewMode]);

  const handleGenerateDirectives = async (personality: string) => {
    setIsGeneratingDirectives(true);
    const result = await getAlterEgoDirectives(personality, trades);
    if (result) setDirectives(result);
    setIsGeneratingDirectives(false);
  };

  // Local state for editing limits
  const [tempLimits, setTempLimits] = useState({
    dailyTradeLimit: settings.dailyTradeLimit || 3,
    dailyLossLimit: settings.dailyLossLimit || 5000
  });

  useEffect(() => {
    setTempLimits({
      dailyTradeLimit: settings.dailyTradeLimit || 3,
      dailyLossLimit: settings.dailyLossLimit || 5000
    });
  }, [settings]);

  useEffect(() => {
    const loadPrediction = async () => {
      if (trades.length >= 3) {
        const p = await getPrediction(trades, settings);
        setPrediction(p);
      }
    };
    loadPrediction();
  }, [trades, settings]);

  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [recognition, setRecognition] = useState<any>(null);
  const [recognitionLang, setRecognitionLang] = useState<'en-IN' | 'hi-IN'>('en-IN');
  const [voiceResult, setVoiceResult] = useState<any>(null);

  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      
      rec.onresult = (event: any) => {
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            setTranscript(prev => prev + event.results[i][0].transcript + ' ');
          } else {
            interim += event.results[i][0].transcript;
          }
        }
      };

      rec.onerror = (event: any) => {
        console.error("Speech Rec Error:", event.error);
        setIsRecording(false);
        if (event.error === 'not-allowed') {
          alert("Microphone access denied. Please enable it in browser settings.");
        }
      };

      setRecognition(rec);
    }
  }, []);

  const handleToggleRecording = () => {
    if (!recognition) {
       alert("Speech recognition is not supported in this browser.");
       return;
    }
    
    if (isRecording) {
      recognition.stop();
    } else {
      setTranscript("");
      setVoiceResult(null);
      recognition.lang = recognitionLang;
      recognition.start();
    }
    setIsRecording(!isRecording);
  };

  const handleProcessVoiceEntry = async () => {
    if (!transcript.trim()) return;
    setIsAnalyzing(true);
    try {
      // Simulate multiple scanning phases for visual depth
      await new Promise(r => setTimeout(r, 800));
      const structuredData = await processVoiceTranscript(transcript);
      if (structuredData) {
        setVoiceResult(structuredData);
        setDraftTrade(structuredData);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { addTrade } = useTrades();
  const handleAutoSaveVoiceTrade = async () => {
    if (!voiceResult) return;
    
    setIsAnalyzing(true);
    try {
      // Normalize asset to IndexType
      let normalizedIndex: any = 'Stocks';
      const rawAsset = (voiceResult.asset || '').toLowerCase().replace(/\s+/g, '');
      
      if (rawAsset.includes('banknifty') || rawAsset.includes('bn')) normalizedIndex = 'Bank Nifty';
      else if (rawAsset.includes('midcap')) normalizedIndex = 'Midcap Nifty';
      else if (rawAsset.includes('finnifty')) normalizedIndex = 'Finnifty';
      else if (rawAsset.includes('sensex')) normalizedIndex = 'Sensex';
      else if (rawAsset.includes('nifty50') || rawAsset.includes('nifty')) normalizedIndex = 'Nifty 50';
      else if (voiceResult.asset) normalizedIndex = 'Stocks';

      // Map emotions to emoji-prefixed moods
      const emotionMap: Record<string, any> = {
        'Happy': '😃 Happy',
        'Neutral': '😐 Neutral',
        'Angry': '😡 Angry',
        'Frustrated': '😫 Frustrated',
        'Fearful': '😨 Fearful',
        'Greedy': '🤑 Greedy'
      };

      const tradeData = {
        type: (voiceResult.type === 'Sell' ? 'Sell' : 'Buy') as any,
        strategy: (voiceResult.strategy || 'Intraday') as any,
        index: normalizedIndex,
        entry: Number(voiceResult.price || 0),
        exit: Number(voiceResult.exit || voiceResult.price || 0),
        sl: Number(voiceResult.sl || 0),
        tp: Number(voiceResult.tp || 0),
        lotSize: Number(voiceResult.quantity || 1),
        notes: voiceResult.summary || transcript,
        entryTime: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        exitTime: new Date().toLocaleTimeString('en-IN', { hour12: false, hour: '2-digit', minute: '2-digit' }),
        date: new Date().toISOString(),
        mistakes: Array.isArray(voiceResult.mistakes) ? voiceResult.mistakes : [],
        mood: (emotionMap[voiceResult.emotion] || '😐 Neutral') as any,
        entryCondition: "Voice Journal Capture",
        exitCondition: "Voice Journal Capture",
        screenshot: ""
      };
      
      await addTrade(tradeData);
      alert("Trade Record Committed to Alpha Ledger!");
      setVoiceResult(null);
      setTranscript("");
    } catch (err) {
      console.error("Auto-Save Error:", err);
      alert("Failed to auto-save. Sending to manual draft.");
      setDraftTrade(voiceResult);
    }
    setIsAnalyzing(false);
  };

  const getVoiceStats = () => {
    if (!voiceResult) return null;
    const entry = Number(voiceResult.price);
    const exit = Number(voiceResult.exit || voiceResult.price);
    const qty = Number(voiceResult.quantity);
    const sl = Number(voiceResult.sl);
    const tp = Number(voiceResult.tp);
    const isBuy = voiceResult.type === 'Buy';

    const pnl = (isBuy ? exit - entry : entry - exit) * qty;
    const risk = Math.abs(entry - (sl || entry));
    const reward = Math.abs((tp || entry) - entry);
    const rr = risk > 0 ? (reward / risk).toFixed(1) : "1.0";

    return { pnl, rr, riskAmount: risk * qty };
  };

  const handleDNAAnalysis = async () => {
    if (!user) return;
    setIsAnalyzing(true);
    const result = await analyzeTraderDNA(user.uid, trades);
    if (result) setDna(result);
    setIsAnalyzing(false);
  };

  useEffect(() => {
    const fetchDNA = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'dna', user.uid);
        const snapshot = await getDoc(docRef);
        if (snapshot.exists()) {
          const dnaData = snapshot.data() as TraderDNA;
          setDna(dnaData);
          
          // Check for low discipline score to trigger Coach Mode
          if (dnaData.disciplineScore < 65 && !coachAdvice && !isGeneratingAdvice) {
            handleGetCoachAdvice(dnaData);
          }
        } else if (trades.length >= 10 && !isAnalyzing) {
          // Auto-trigger analysis if enough data exists but profile doesn't
          handleDNAAnalysis();
        }
      } catch (err) {
        console.error("Error fetching DNA:", err);
      }
    };
    fetchDNA();
  }, [user, trades.length]);

  const handleGetCoachAdvice = async (currentDna: TraderDNA) => {
    setIsGeneratingAdvice(true);
    const advice = await getCoachAdvice(currentDna, trades);
    if (advice) setCoachAdvice(advice);
    setIsGeneratingAdvice(false);
  };

  const handleToggleLockdown = async () => {
    const newState = !settings.isLockdownEnabled;
    await updateSettings({
      ...tempLimits,
      isLockdownEnabled: newState
    });
  };

  const handleGenerateDocumentary = async () => {
    setIsGeneratingDoc(true);
    const script = await generateWeeklyDocumentaryScript(trades.slice(0, 10));
    if (script) setDocScript(script);
    setIsGeneratingDoc(false);
  };

  return (
    <div className="space-y-6 pb-24 px-2">
      <header className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase italic">Transformation <span className="text-indigo-500 not-italic">System</span></h1>
          <p className="text-slate-500 font-bold text-[10px] uppercase tracking-[0.4em]">Behavioral Intelligence v2.0</p>
        </div>
        <div className="bg-indigo-500/10 p-3 rounded-2xl border border-indigo-500/20">
          <Activity size={24} className="text-indigo-400 animate-pulse" />
        </div>
      </header>

      {/* Prediction Engine */}
      <AnimatePresence>
        {prediction && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-[2rem] flex items-center gap-4"
          >
            <div className="w-12 h-12 bg-amber-500/20 rounded-2xl flex items-center justify-center shrink-0">
              <AlertTriangle className="text-amber-500" size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-amber-500/60 uppercase tracking-widest leading-none mb-1">Pre-Session Warning</p>
              <p className="text-amber-200 text-sm font-black italic tracking-tight">"{prediction}"</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex gap-2">
        {(['dna', 'control', 'alterego'] as const).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex-1 py-3 px-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
              viewMode === mode 
                ? "bg-indigo-500 text-white shadow-xl shadow-indigo-500/20" 
                : "bg-slate-900/40 text-slate-500 border border-white/5"
            )}
          >
            {mode}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'dna' && (
          <motion.div
            key="dna"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {!dna ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 bg-indigo-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-indigo-500/20 border-dashed">
                  <Brain size={40} className="text-indigo-400" />
                </div>
                <h3 className="text-xl font-black text-white uppercase italic">Profile Locked</h3>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-2 px-12 leading-relaxed">
                  Analyze your last 5 sessions to map your behavioral traits and biases.
                </p>
                <button
                  onClick={handleDNAAnalysis}
                  disabled={isAnalyzing || trades.length < 5}
                  className="mt-8 px-8 py-4 bg-indigo-500 hover:bg-indigo-600 disabled:bg-slate-800 disabled:text-slate-600 text-white font-black uppercase text-xs tracking-[0.2em] rounded-full transition-all active:scale-95 flex items-center gap-3 mx-auto"
                >
                  {isAnalyzing ? "Processing Neural Map..." : "Decode Trader DNA"}
                  <Zap size={16} />
                </button>
                {trades.length < 5 && <p className="text-rose-500 text-[8px] font-black uppercase mt-4">Need {5 - trades.length} more sessions to initialize DNA</p>}
              </div>
            ) : (
              <div className="space-y-6">
                <GlassCard className="p-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-10">
                    <UserCheck size={80} className="text-indigo-500" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-2">Archetype Identified</p>
                    <h2 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">{dna.archetype}</h2>
                    <p className="text-slate-400 text-sm font-medium leading-relaxed italic">"{dna.summary}"</p>
                  </div>
                </GlassCard>

                {/* Coach Mode: Triggered by low discipline */}
                <AnimatePresence>
                  {dna.disciplineScore < 65 && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="space-y-4"
                    >
                      <GlassCard className="p-6 bg-rose-500/10 border-rose-500/30 relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 opacity-10">
                          <Flame size={120} className="text-rose-500" />
                        </div>
                        
                        <div className="flex items-center gap-3 mb-6">
                           <div className="w-10 h-10 rounded-full bg-rose-500 flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.4)]">
                              <User size={20} className="text-white" />
                           </div>
                           <div>
                              <p className="text-[10px] font-black text-rose-500 uppercase tracking-[0.2em]">Coach Mode Engaged</p>
                              <h3 className="text-lg font-black text-white italic uppercase">Behavioral Intervention</h3>
                           </div>
                        </div>

                        {isGeneratingAdvice ? (
                          <div className="py-8 flex flex-col items-center gap-3">
                             <div className="w-8 h-8 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
                             <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Scanning psychological patterns...</p>
                          </div>
                        ) : coachAdvice ? (
                          <div className="space-y-6">
                             <div className="p-4 bg-black/40 rounded-2xl border border-white/5">
                                <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-2">Critical Insight</p>
                                <p className="text-sm font-bold text-slate-200 leading-relaxed italic">
                                   "{coachAdvice.criticalInsight}"
                                </p>
                             </div>

                             <div className="space-y-3">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Tactical Drills (Execute Immediately)</p>
                                {coachAdvice.tacticalDrills.map((drill, idx) => (
                                  <div key={idx} className="flex gap-4 items-start bg-white/5 p-3 rounded-xl border border-white/5">
                                     <span className="text-rose-500 font-black italic">#{idx + 1}</span>
                                     <p className="text-xs font-bold text-slate-300 tracking-tight leading-tight">{drill}</p>
                                  </div>
                                ))}
                             </div>

                             <div className="pt-4 border-t border-rose-500/20">
                                <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest text-center mb-2 animate-pulse">The Brutal Truth</p>
                                <p className="text-xl font-black text-white text-center italic tracking-tighter uppercase leading-none">
                                   "{coachAdvice.brutalTruth}"
                                </p>
                             </div>

                             <button 
                               onClick={() => handleGetCoachAdvice(dna)}
                               className="w-full py-2 text-[8px] font-black text-rose-500/60 uppercase tracking-[0.3em] hover:text-rose-400 transition-colors"
                             >
                               Re-analyze Behavioral Logic
                             </button>
                          </div>
                        ) : (
                          <button 
                            onClick={() => handleGetCoachAdvice(dna)}
                            className="w-full py-6 bg-rose-500 rounded-3xl text-white font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-500/20"
                          >
                            Access Coaching Advice
                          </button>
                        )}
                      </GlassCard>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-2 gap-4">
                  <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/20">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Core Traits</p>
                    <div className="space-y-2">
                      {dna.traits.map(t => (
                        <div key={t} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span className="text-[11px] font-black text-white uppercase tracking-tighter">{t}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                  <GlassCard className="p-4 bg-indigo-500/5 border-indigo-500/20">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Identified Biases</p>
                    <div className="space-y-2">
                      {dna.biases.map(b => (
                        <div key={b} className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                          <span className="text-[11px] font-black text-white uppercase tracking-tighter">{b}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Risk Propensity</span>
                      <span className="text-lg font-black text-indigo-400">{dna.riskScore}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dna.riskScore}%` }}
                        className="h-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Discipline Index</span>
                      <span className="text-lg font-black text-emerald-400">{dna.disciplineScore}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${dna.disciplineScore}%` }}
                        className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      />
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleDNAAnalysis}
                  className="w-full py-4 border border-white/5 bg-white/5 rounded-2xl text-[10px] font-black text-slate-500 uppercase tracking-widest hover:bg-white/10 transition-all"
                >
                  Refresh Neural Map
                </button>

                <button 
                  onClick={handleGenerateDocumentary}
                  disabled={isGeneratingDoc || trades.length < 3}
                  className="w-full py-6 bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-800 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-500/40 active:scale-[0.98] transition-all overflow-hidden relative group border border-white/20"
                >
                  <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  <div className="relative flex flex-col items-center gap-2">
                    <div className="flex items-center gap-3">
                      <Clapperboard size={20} className={cn("text-white", isGeneratingDoc && "animate-spin")} />
                      <span className="text-xs font-black uppercase tracking-[0.3em]">
                        {isGeneratingDoc ? "Directing Masterpiece..." : "Generate AI Documentary"}
                      </span>
                      <Sparkles size={16} className="text-amber-300 animate-pulse" />
                    </div>
                    <p className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">
                      {isGeneratingDoc ? "Analyzing your wins, losses & behavior" : "A cinematic recap of your performance"}
                    </p>
                  </div>
                </button>
              </div>
            )}
          </motion.div>
        )}

        {viewMode === 'control' && (
          <motion.div
            key="control"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className={cn(
              "p-6 rounded-[2.5rem] relative overflow-hidden border transition-all duration-500",
              settings.isLockdownEnabled ? "bg-rose-500/10 border-rose-500/40" : "bg-slate-900/40 border-white/5"
            )}>
              <Shield size={120} className={cn(
                "absolute -bottom-10 -right-10 transition-colors duration-500",
                settings.isLockdownEnabled ? "text-rose-500/10" : "text-white/5"
              )} />
              <h3 className="text-2xl font-black text-white italic uppercase mb-2">Self Control Protocol</h3>
              <p className={cn(
                "text-[10px] font-black uppercase tracking-widest mb-6",
                settings.isLockdownEnabled ? "text-rose-400" : "text-slate-500"
              )}>
                {settings.isLockdownEnabled ? "Real-time Rule Enforcement Active" : "Protocol Standby"}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-2xl flex items-center justify-center">
                      <Target className="text-indigo-400" size={20} />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Max Trades / Day</span>
                  </div>
                  <input 
                    type="number"
                    value={tempLimits.dailyTradeLimit}
                    onChange={(e) => setTempLimits({ ...tempLimits, dailyTradeLimit: parseInt(e.target.value) || 0 })}
                    className="w-16 bg-transparent text-right font-black text-indigo-400 focus:outline-none"
                  />
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-3xl border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-500/10 rounded-2xl flex items-center justify-center">
                      <Zap className="text-rose-400" size={20} />
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Daily Loss Cap</span>
                  </div>
                   <input 
                    type="number"
                    value={tempLimits.dailyLossLimit}
                    onChange={(e) => setTempLimits({ ...tempLimits, dailyLossLimit: parseInt(e.target.value) || 0 })}
                    className="w-24 bg-transparent text-right font-black text-rose-400 focus:outline-none font-sans"
                  />
                </div>
              </div>

              <div className="mt-8 flex items-center justify-between">
                <p className="text-[8px] text-slate-500 font-bold uppercase tracking-[0.2em] max-w-[60%]">Once limits are breached, the trade entry interface will be restricted.</p>
                <button 
                  onClick={handleToggleLockdown}
                  className={cn(
                    "px-8 py-3 font-black uppercase text-[10px] rounded-full transition-all shadow-xl",
                    settings.isLockdownEnabled 
                      ? "bg-rose-500 text-white shadow-rose-500/20" 
                      : "bg-white text-black shadow-white/10"
                  )}
                >
                  {settings.isLockdownEnabled ? "Stop Lockdown" : "Apply Lockdown"}
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4">
              <GlassCard className="p-6 relative overflow-hidden group">
                 <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Mic size={64} className="text-indigo-400" />
                 </div>
                 <div className="relative z-10 flex flex-col items-center text-center">
                    <div className="flex gap-2 mb-6 p-1 bg-black/40 rounded-full border border-white/5">
                      <button 
                        onClick={() => setRecognitionLang('en-IN')}
                        className={cn("px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all", recognitionLang === 'en-IN' ? "bg-indigo-500 text-white" : "text-slate-500")}
                      >
                        English
                      </button>
                      <button 
                        onClick={() => setRecognitionLang('hi-IN')}
                        className={cn("px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all", recognitionLang === 'hi-IN' ? "bg-indigo-500 text-white" : "text-slate-500")}
                      >
                        हिन्दी
                      </button>
                    </div>
                    <button 
                      onClick={handleToggleRecording}
                      className={cn(
                        "w-20 h-20 rounded-full flex items-center justify-center transition-all duration-500 mb-4 relative",
                        isRecording 
                          ? "bg-rose-500 shadow-2xl shadow-rose-500/40" 
                          : "bg-indigo-500 shadow-xl shadow-indigo-500/20"
                      )}
                    >
                      <AnimatePresence>
                        {isRecording && (
                          <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1.5, opacity: 0 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 1, repeat: Infinity }}
                            className="absolute inset-0 bg-rose-500 rounded-full"
                          />
                        )}
                      </AnimatePresence>
                      <div className="relative z-10">
                        {isRecording ? <div className="flex gap-1 items-center h-4">
                          {[1,2,3,4].map(idx => (
                            <motion.div
                              key={idx}
                              animate={{ height: [4, 16, 4] }}
                              transition={{ duration: 0.5, repeat: Infinity, delay: idx * 0.1 }}
                              className="w-1 bg-white rounded-full"
                            />
                          ))}
                        </div> : <Mic size={32} className="text-white" />}
                      </div>
                    </button>
                    
                    <span className="text-[11px] font-medium text-indigo-400 font-serif italic tracking-wider mb-1">Voice Journal Pro</span>
                    <p className="text-[7px] text-slate-500 font-bold uppercase tracking-[0.3em] leading-relaxed max-w-[200px]">
                      {isRecording ? "Listening to your performance details..." : "Speak naturally about your session."}
                    </p>

                    <AnimatePresence>
                      {(transcript || voiceResult) && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 w-full p-4 bg-black/40 rounded-2xl border border-white/10"
                        >
                           {!voiceResult ? (
                             <>
                               <p className="text-xs text-white/80 font-medium italic mb-4 leading-relaxed">
                                 "{transcript || 'Waiting for speech...'}"
                               </p>
                               <button 
                                 onClick={handleProcessVoiceEntry}
                                 disabled={isAnalyzing || !transcript.trim()}
                                 className="w-full h-12 bg-indigo-500 text-white rounded-xl text-[9px] font-bold uppercase tracking-[0.3em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50 relative overflow-hidden"
                               >
                                 {isAnalyzing && (
                                   <motion.div
                                     initial={{ x: '-100%' }}
                                     animate={{ x: '100%' }}
                                     transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                                     className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"
                                   />
                                 )}
                                 <span className="relative z-10">{isAnalyzing ? "Deep Analysis..." : "Analyze Session Data"}</span>
                                 {!isAnalyzing && <Zap size={12} className="relative z-10" />}
                               </button>
                             </>
                           ) : (
                             <div className="text-left space-y-3">
                               <div className="flex justify-between items-start">
                                 <div>
                                   <p className="text-[8px] font-black text-indigo-400 uppercase">Extracted Asset</p>
                                   <p className="text-sm font-black text-white italic">{voiceResult.asset}</p>
                                 </div>
                                 <div className="text-right">
                                   <p className="text-[8px] font-black text-slate-500 uppercase">Type</p>
                                   <p className={cn("text-xs font-black uppercase", voiceResult.type === 'Buy' ? "text-emerald-400" : "text-rose-400")}>{voiceResult.type}</p>
                                 </div>
                               </div>

                               <div className="grid grid-cols-2 gap-2">
                                  <div className="p-2 bg-white/5 rounded-lg">
                                    <p className="text-[7px] font-black text-slate-500 uppercase">Entry</p>
                                    <p className="text-xs font-bold text-white">₹{voiceResult.price}</p>
                                  </div>
                                  <div className="p-2 bg-white/5 rounded-lg">
                                    <p className="text-[7px] font-black text-slate-500 uppercase">Exit</p>
                                    <p className="text-xs font-bold text-white">₹{voiceResult.exit}</p>
                                  </div>
                               </div>

                               <p className="text-[9px] text-slate-400 font-medium leading-tight">
                                 <span className="text-indigo-400 font-black uppercase text-[7px] block mb-1">AI Logic</span>
                                 "{voiceResult.summary}"
                               </p>

                               {Array.isArray(voiceResult.mistakes) && voiceResult.mistakes.length > 0 && (
                                 <div className="flex flex-wrap gap-1 mt-2">
                                    {voiceResult.mistakes.map((m: string) => (
                                      <span key={m} className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[6px] font-black uppercase rounded">
                                        {m}
                                      </span>
                                    ))}
                                 </div>
                               )}

                               <div className="flex justify-between items-center bg-white/5 rounded-xl p-3 border border-white/5">
                                 <div>
                                   <p className="text-[7px] font-black text-slate-500 uppercase">Intelligent Forecast</p>
                                   <div className="flex gap-4 mt-1">
                                     <div>
                                       <p className="text-[6px] font-bold text-slate-600 uppercase">RR Ratio</p>
                                       <p className="text-xs font-black text-indigo-400">1:{getVoiceStats()?.rr || '1.0'}</p>
                                     </div>
                                     <div>
                                       <p className="text-[6px] font-bold text-slate-600 uppercase">Est. PnL</p>
                                       <p className={cn(
                                         "text-xs font-black",
                                         (getVoiceStats()?.pnl || 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                                       )}>
                                         ₹{getVoiceStats()?.pnl.toLocaleString() || '0'}
                                       </p>
                                     </div>
                                   </div>
                                 </div>
                                 <div className="text-right">
                                    <p className="text-[6px] font-bold text-slate-600 uppercase">Total Risk</p>
                                    <p className="text-xs font-black text-rose-500">₹{getVoiceStats()?.riskAmount.toLocaleString() || '0'}</p>
                                 </div>
                               </div>

                               <div className="flex gap-2 pt-2">
                                 <button 
                                   onClick={handleAutoSaveVoiceTrade}
                                   disabled={isAnalyzing}
                                   className="flex-1 py-3 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-1"
                                 >
                                   {isAnalyzing ? "Saving..." : "Commit To Ledger"}
                                   {!isAnalyzing && <CheckCircle2 size={12} />}
                                 </button>
                                 <button 
                                   onClick={() => {
                                      // detail matches the active navigation view IDs in App.tsx
                                      window.dispatchEvent(new CustomEvent('change-view', { detail: 'add' }));
                                   }}
                                   className="flex-1 py-3 bg-indigo-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20"
                                 >
                                   Fill Journal Form
                                 </button>
                                 <button 
                                   onClick={() => setVoiceResult(null)}
                                   className="px-4 py-3 bg-white/5 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all border border-white/5"
                                 >
                                   Reset
                                 </button>
                               </div>
                             </div>
                           )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {viewMode === 'alterego' && (
          <motion.div
            key="alterego"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            {/* Personality Selector */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Select Persona</p>
                   <h3 className="text-xl font-black text-white italic uppercase">{selectedPersonality}</h3>
                </div>
                <div className="flex items-center gap-4">
                   <div className="text-right">
                      <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Discipline Streak</p>
                      <p className="text-sm font-black text-white">{streak} DAYS</p>
                   </div>
                   <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                      <Zap size={20} className="text-emerald-400 fill-emerald-400/20" />
                   </div>
                </div>
              </div>
              
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {personalities.map((p) => {
                  const Icon = p.icon;
                  const isActive = selectedPersonality === p.name;
                  return (
                    <button
                      key={p.name}
                      onClick={() => {
                        setSelectedPersonality(p.name);
                        handleGenerateDirectives(p.name);
                      }}
                      className={cn(
                        "flex-shrink-0 w-32 p-4 rounded-3xl border transition-all duration-300 flex flex-col items-center text-center gap-2",
                        isActive 
                          ? cn("bg-indigo-500 text-white border-indigo-400 shadow-xl shadow-indigo-500/20")
                          : "bg-slate-900/40 border-white/5 text-slate-500 hover:border-white/10"
                      )}
                    >
                      <div className={cn(
                        "w-10 h-10 rounded-2xl flex items-center justify-center transition-colors",
                        isActive ? "bg-white/20" : "bg-slate-800"
                      )}>
                        <Icon size={20} className={isActive ? "text-white" : p.accent} />
                      </div>
                      <div>
                        <p className={cn("text-[9px] font-black uppercase tracking-tighter", isActive ? "text-white" : "text-slate-300")}>{p.name}</p>
                        <p className={cn("text-[7px] font-bold uppercase opacity-60", isActive ? "text-white" : "text-slate-500")}>{p.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Directives Section */}
            <div className="space-y-4">
               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sword size={16} className="text-rose-500" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Next Trade Blueprint</span>
                  </div>
                  <button 
                    onClick={() => handleGenerateDirectives(selectedPersonality)}
                    className="p-2 hover:bg-white/5 rounded-full transition-colors text-indigo-400"
                  >
                    <motion.div animate={isGeneratingDirectives ? { rotate: 360 } : {}}>
                      <Sparkles size={14} />
                    </motion.div>
                  </button>
               </div>

               <div className="space-y-3">
                 {directives?.directives.map((msg, i) => (
                   <motion.div
                     key={i}
                     initial={{ opacity: 0, x: -10 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: i * 0.1 }}
                     className="group flex items-start gap-4 p-4 rounded-[2rem] bg-indigo-500/5 border border-white/5 hover:bg-indigo-500/10 transition-colors"
                   >
                     <div className="w-6 h-6 rounded-lg bg-indigo-500/20 flex items-center justify-center text-[10px] font-black text-indigo-400 shrink-0">
                       0{i + 1}
                     </div>
                     <p className="text-xs font-bold text-slate-300 italic group-hover:text-white transition-colors">{msg}</p>
                   </motion.div>
                 ))}
               </div>

               {directives?.affirmation && (
                 <div className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-[2.5rem] border border-white/5 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-10" />
                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-2">Power Affirmation</p>
                    <p className="text-xl font-black text-white italic tracking-tighter leading-tight">"{directives.affirmation}"</p>
                 </div>
               )}
            </div>

            {/* Stats Projections */}
            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="flex items-center gap-2">
                 <Rocket size={16} className="text-emerald-500" />
                 <span className="text-[10px] font-black text-white uppercase tracking-widest">Projected Growth (with {selectedPersonality})</span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <GlassCard className="p-4 bg-emerald-500/5 border-emerald-500/10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-5">
                      <TrendingUp size={40} />
                   </div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Ego Win Rate</p>
                   <p className="text-2xl font-black text-emerald-400 tracking-tighter">{alterEgoStats.egoWinRate.toFixed(0)}%</p>
                   <p className="text-[7px] font-bold text-slate-500 uppercase mt-2">vs {alterEgoStats.realWinRate.toFixed(0)}% Real</p>
                </GlassCard>
                <GlassCard className="p-4 bg-rose-500/5 border-rose-500/10 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-2 opacity-5">
                      <ShieldAlert size={40} />
                   </div>
                   <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Capital Saved</p>
                   <p className="text-2xl font-black text-rose-400 tracking-tighter">₹{alterEgoStats.opportunityGap.toLocaleString('en-IN')}</p>
                   <p className="text-[7px] font-bold text-slate-500 uppercase mt-2">From Mistakes</p>
                </GlassCard>
              </div>

              {/* Automated Insights Panel */}
              <GlassCard className="p-4 bg-indigo-500/5 border-indigo-500/10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                  <Brain size={14} className="text-indigo-400" />
                  Behavioral Anomalies
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Peak Intensity</p>
                    <p className="text-sm font-black text-white italic">{alterEgoStats.peakHour} IST</p>
                  </div>
                  <div>
                    <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Dominant Edge Day</p>
                    <p className="text-sm font-black text-white italic">{alterEgoStats.bestDay}</p>
                  </div>
                </div>
              </GlassCard>

              <GlassCard className="p-6 bg-slate-900/60 border-white/5">
                 <div className="flex justify-between items-center mb-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Simulated Performance</p>
                    <div className="flex items-center gap-4">
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-slate-700" />
                          <span className="text-[8px] font-black text-slate-500 uppercase">Current</span>
                       </div>
                       <div className="flex items-center gap-1.5">
                          <div className="w-2 h-2 rounded-full bg-indigo-500" />
                          <span className="text-[8px] font-black text-indigo-500 uppercase">AlterEgo</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="h-24 flex items-end justify-between gap-1 px-2">
                    {trades.slice(-10).map((t, i) => {
                      const baseH = Math.min(Math.abs(t.pnl) / 1000 + 10, 80);
                      const disciplineH = (t.mistakes && t.mistakes.length > 0) ? baseH * 0.4 : baseH * 1.2;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                           <div className="w-full relative flex items-end gap-0.5 h-20">
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${baseH}%` }}
                                className="flex-1 bg-slate-800 rounded-t-sm"
                              />
                              <motion.div 
                                initial={{ height: 0 }}
                                animate={{ height: `${disciplineH}%` }}
                                className="flex-1 bg-indigo-500 rounded-t-sm group-hover:bg-indigo-400 transition-colors"
                              />
                           </div>
                        </div>
                      );
                    })}
                 </div>
                 <div className="flex justify-between mt-4 text-[7px] font-black text-slate-600 uppercase tracking-widest italic">
                    <span>Baseline Entry</span>
                    <span>Optimized Future</span>
                 </div>
              </GlassCard>

              {/* Pre-Trade Scorecard */}
              <div className="space-y-4">
                 <div className="flex items-center gap-2">
                    <CheckCircle2 size={16} className="text-indigo-400" />
                    <span className="text-[10px] font-black text-white uppercase tracking-widest">Next Trade Scorecard</span>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'slSet', label: 'Stop-Loss Defined', icon: Shield },
                      { id: 'setupConfirmed', label: 'Setup Confirmed', icon: Target },
                      { id: 'riskCalculated', label: 'Risk Calculated', icon: Activity },
                      { id: 'moodCheck', label: 'Emotion Neutral', icon: Brain }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isChecked = (scorecard as any)[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => setScorecard(prev => ({ ...prev, [item.id]: !isChecked }))}
                          className={cn(
                            "p-4 rounded-2xl border transition-all flex items-center gap-3 text-left",
                            isChecked 
                              ? "bg-indigo-500/20 border-indigo-500/50" 
                              : "bg-slate-900/40 border-white/5"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                            isChecked ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500"
                          )}>
                             <Icon size={16} />
                          </div>
                          <span className={cn(
                            "text-[9px] font-black uppercase tracking-tight leading-tight",
                            isChecked ? "text-white" : "text-slate-500"
                          )}>{item.label}</span>
                        </button>
                      );
                    })}
                 </div>
                 
                 <button 
                   disabled={!Object.values(scorecard).every(v => v)}
                   className={cn(
                     "w-full py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] transition-all",
                     Object.values(scorecard).every(v => v)
                       ? "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                       : "bg-slate-800 text-slate-600 border border-white/5"
                   )}
                 >
                   {Object.values(scorecard).every(v => v) ? "EGO SYNCHRONIZED - READY FOR ENTRY" : "Complete Scorecard to Synchronize"}
                 </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {docScript && (
          <DocumentaryPlayer 
            script={docScript} 
            onClose={() => setDocScript(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};
