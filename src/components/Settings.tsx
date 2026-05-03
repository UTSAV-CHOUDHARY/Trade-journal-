import React, { useState, useEffect } from 'react';
import { GlassCard } from './GlassCard';
import { useAuth } from '../context/AuthContext';
import { useTrades } from '../context/TradeContext';
import { logout } from '../lib/firebase';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Languages, 
  LogOut, 
  User as UserIcon,
  Shield,
  Bell,
  Smartphone,
  Globe,
  Target,
  Zap,
  TrendingDown,
  ShieldAlert,
  Save,
  Activity
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const Settings = () => {
  const { user } = useAuth();
  const { settings, updateSettings } = useTrades();
  const [theme, setTheme] = useState<'light' | 'dark'>(
    (localStorage.getItem('tradeflow_theme') as 'light' | 'dark') || 'dark'
  );
  const [language, setLanguage] = useState(
    localStorage.getItem('tradeflow_lang') || 'English'
  );

  const [localSettings, setLocalSettings] = useState({
    monthlyGoal: settings.monthlyGoal,
    dailyTradeLimit: settings.dailyTradeLimit || 3,
    dailyLossLimit: settings.dailyLossLimit || 5000,
    isLockdownEnabled: settings.isLockdownEnabled || false
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalSettings({
      monthlyGoal: settings.monthlyGoal,
      dailyTradeLimit: settings.dailyTradeLimit || 3,
      dailyLossLimit: settings.dailyLossLimit || 5000,
      isLockdownEnabled: settings.isLockdownEnabled || false
    });
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    await updateSettings(localSettings);
    setIsSaving(false);
  };

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.style.colorScheme = 'dark';
    } else {
      root.classList.remove('dark');
      root.style.colorScheme = 'light';
    }
    localStorage.setItem('tradeflow_theme', theme);
  }, [theme]);

  const languages = ['English', 'Hindi', 'Spanish', 'Japanese', 'German'];

  const toggleLanguage = () => {
    const currentIndex = languages.indexOf(language);
    const nextIndex = (currentIndex + 1) % languages.length;
    const nextLang = languages[nextIndex];
    setLanguage(nextLang);
    localStorage.setItem('tradeflow_lang', nextLang);
  };

  return (
    <div className="space-y-6 pb-20">
      <header className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-2xl">
            <SettingsIcon className="text-indigo-400" size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-light font-serif italic text-slate-900 dark:text-white tracking-tight">Terminal Control</h2>
            <p className="text-slate-500 font-bold text-[9px] uppercase tracking-[0.4em] leading-none mt-1">Operational Protocol v2.5</p>
          </div>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="p-3 bg-indigo-500 text-white rounded-2xl shadow-lg shadow-indigo-500/20 active:scale-95 transition-all disabled:opacity-50"
        >
          {isSaving ? <Activity size={20} className="animate-spin" /> : <Save size={20} />}
        </button>
      </header>

      {/* Risk Architecture */}
      <div className="space-y-3">
         <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] px-2 mb-2 italic">Risk Architecture</p>
         <GlassCard className="p-5 space-y-4 bg-slate-900/40 border-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-500/10 rounded-xl">
                  <Target size={16} className="text-indigo-400" />
                </div>
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-tight">Monthly Target</h4>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Yield Goal</p>
                </div>
              </div>
              <input 
                type="number"
                value={localSettings.monthlyGoal}
                onChange={e => setLocalSettings({...localSettings, monthlyGoal: Number(e.target.value)})}
                className="w-24 bg-white/5 border border-white/10 rounded-xl p-2 text-right font-black text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-rose-500/10 rounded-xl">
                  <ShieldAlert size={16} className="text-rose-400" />
                </div>
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-tight">Trade Cap</h4>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Daily Limit</p>
                </div>
              </div>
              <input 
                type="number"
                value={localSettings.dailyTradeLimit}
                onChange={e => setLocalSettings({...localSettings, dailyTradeLimit: Number(e.target.value)})}
                className="w-24 bg-white/5 border border-white/10 rounded-xl p-2 text-right font-black text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 rounded-xl">
                  <TrendingDown size={16} className="text-amber-400" />
                </div>
                <div>
                  <h4 className="text-white font-black text-xs uppercase tracking-tight">Loss Floor</h4>
                  <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Max Session Deficit</p>
                </div>
              </div>
              <input 
                type="number"
                value={localSettings.dailyLossLimit}
                onChange={e => setLocalSettings({...localSettings, dailyLossLimit: Number(e.target.value)})}
                className="w-24 bg-white/5 border border-white/10 rounded-xl p-2 text-right font-black text-xs text-white focus:ring-1 focus:ring-indigo-500 outline-none"
              />
            </div>

            <div className="pt-2">
              <button 
                onClick={() => setLocalSettings({...localSettings, isLockdownEnabled: !localSettings.isLockdownEnabled})}
                className="w-full h-px bg-white/5 my-2" 
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "p-2 rounded-xl transition-colors",
                    localSettings.isLockdownEnabled ? "bg-rose-500/20" : "bg-slate-500/10"
                  )}>
                    <ShieldAlert size={16} className={localSettings.isLockdownEnabled ? "text-rose-400" : "text-slate-400"} />
                  </div>
                  <div>
                    <h4 className="text-white font-black text-xs uppercase tracking-tight">Lockdown Mode</h4>
                    <p className="text-slate-500 text-[8px] font-bold uppercase tracking-widest">Auto-Restrict on Limits</p>
                  </div>
                </div>
                <button 
                  onClick={() => setLocalSettings({...localSettings, isLockdownEnabled: !localSettings.isLockdownEnabled})}
                  className={cn(
                    "w-10 h-5 rounded-full relative transition-all duration-300",
                    localSettings.isLockdownEnabled ? "bg-rose-500" : "bg-slate-700"
                  )}
                >
                  <motion.div 
                    animate={{ x: localSettings.isLockdownEnabled ? 22 : 2 }}
                    className="absolute top-1 w-3 h-3 bg-white rounded-full shadow-lg"
                  />
                </button>
              </div>
            </div>
         </GlassCard>
      </div>

      {/* Profile Section */}
      <GlassCard className="p-6 bg-white dark:bg-slate-900/40 border-slate-200 dark:border-white/5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <img 
              src={user?.photoURL || ''} 
              alt="Profile" 
              className="w-16 h-16 rounded-[2rem] border-2 border-indigo-500/30 object-cover"
            />
            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full border-4 border-white dark:border-slate-900 flex items-center justify-center">
              <Shield size={10} className="text-white" />
            </div>
          </div>
          <div>
            <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tight text-lg">{user?.displayName || 'Operator'}</h3>
            <p className="text-slate-500 text-xs font-medium lowercase tracking-tight">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[8px] font-black uppercase rounded-md tracking-widest">Premium Execute</span>
              <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase rounded-md tracking-widest">Verified</span>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* App Settings */}
      <div className="space-y-3">
        <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] px-2 mb-2 italic">Interface Preferences</p>
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-full text-left"
        >
          <GlassCard className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500/10 rounded-2xl group-hover:bg-indigo-500/20 transition-colors">
                {theme === 'dark' ? <Moon size={20} className="text-indigo-400" /> : <Sun size={20} className="text-orange-400" />}
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">Theme Resonance</h4>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{theme === 'dark' ? 'Nocturnal (Dark)' : 'Diurnal (Light)'}</p>
              </div>
            </div>
            <div className={cn(
              "w-12 h-6 rounded-full relative transition-all duration-500 overflow-hidden border border-white/5",
              theme === 'dark' ? 'bg-indigo-500' : 'bg-slate-700'
            )}>
              <motion.div 
                animate={{ x: theme === 'dark' ? 24 : 4 }}
                className="absolute top-1 w-4 h-4 bg-white rounded-full shadow-lg"
              />
            </div>
          </GlassCard>
        </button>

        {/* Language Selection */}
        <button 
          onClick={toggleLanguage}
          className="w-full text-left"
        >
          <GlassCard className="p-5 flex items-center justify-between hover:bg-white/5 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl group-hover:bg-emerald-500/20 transition-colors">
                <Languages size={20} className="text-emerald-400" />
              </div>
              <div>
                <h4 className="text-slate-900 dark:text-white font-black text-sm uppercase tracking-tight">Linguistic Protocol</h4>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">{language}</p>
              </div>
            </div>
            <div className="text-emerald-500/50">
               <Globe size={18} />
            </div>
          </GlassCard>
        </button>

        {/* Other menu items (Static for UI variety) */}
        <div className="pt-2">
          <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em] px-2 mb-2 italic">Security & Core</p>
          <GlassCard className="p-4 flex items-center justify-between opacity-50 grayscale">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-slate-500/10 rounded-xl">
                <Bell size={16} className="text-slate-400" />
              </div>
              <h4 className="text-slate-400 font-bold text-xs uppercase tracking-tight">Signal Notifications</h4>
            </div>
            <div className="w-8 h-4 bg-slate-800 rounded-full" />
          </GlassCard>
        </div>

        {/* Relocated Logout Button */}
        <div className="pt-8">
          <button 
            onClick={logout}
            className="w-full group pt-4"
          >
            <div className="flex items-center justify-center gap-3 p-5 bg-rose-500/5 border border-rose-500/10 rounded-3xl group-hover:bg-rose-500/10 group-hover:border-rose-500/20 transition-all active:scale-95">
              <LogOut size={20} className="text-rose-400 group-hover:-translate-x-1 transition-transform" />
              <span className="text-rose-400 font-black uppercase tracking-[0.2em] text-sm">Terminate Session</span>
            </div>
          </button>
        </div>
      </div>

      <div className="text-center pt-8 opacity-20">
        <div className="flex justify-center gap-6 mb-2">
            <Smartphone size={14} className="text-slate-500" />
            <UserIcon size={14} className="text-slate-500" />
            <Shield size={14} className="text-slate-500" />
        </div>
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em]">TDF-PROTOCOL-AUTH-SECURED</p>
      </div>
    </div>
  );
};
