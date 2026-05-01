import React, { useState } from 'react';
import { signInWithGoogle } from '../lib/firebase';
import { GlassCard } from './GlassCard';
import { LogIn, Zap, Sword, ShieldCheck, Activity, TrendingUp, BarChart3, Fingerprint, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';

export const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      // Ignore cancelled popup request
      if (err.code !== 'auth/cancelled-popup-request') {
        console.error('Login error:', err);
        setError('Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors duration-700 px-4 overflow-hidden relative">
      {/* Background Orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 90, 0],
            x: [0, 50, 0],
            y: [0, 30, 0]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-600/20 blur-[140px]" 
        />
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            rotate: [0, -90, 0],
            x: [0, -40, 0],
            y: [0, -20, 0]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-emerald-600/10 blur-[140px]" 
        />
        <motion.div 
          animate={{ opacity: [0.1, 0.3, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.05)_0,transparent_70%)]" 
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-sm relative z-10"
      >
        <div className="text-center mb-10">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.2 }}
            className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 rounded-[2.5rem] shadow-[0_20px_50px_rgba(79,70,229,0.4)] mb-8 transform hover:rotate-12 transition-transform duration-500"
          >
            <Zap className="text-white fill-white" size={40} />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <h1 className="text-5xl font-black text-white tracking-tighter uppercase mb-3 leading-none italic">
              Trading Journal <span className="text-indigo-400 block not-italic mt-1">India</span>
            </h1>
            <p className="text-slate-400/80 font-bold text-[10px] uppercase tracking-[0.4em] mb-4">
              Enhance Your Trading Journey
            </p>
          </motion.div>

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: 40 }}
            transition={{ delay: 1, duration: 1 }}
            className="h-1 bg-indigo-500 mx-auto rounded-full"
          />
        </div>

        <GlassCard className="p-8 text-center bg-slate-100/50 dark:bg-slate-900/60 border-slate-200 dark:border-white/5 backdrop-blur-2xl">
          <div className="space-y-4">
            {error && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-rose-500 text-[10px] font-black uppercase tracking-widest mb-2"
              >
                {error}
              </motion.p>
            )}

            <div className="flex gap-3">
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-indigo-600 text-white font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(79,70,229,0.3)] hover:bg-indigo-500"
              >
                <Fingerprint size={18} />
                Sign Up
              </motion.button>
              <motion.button
                whileHover={{ scale: loading ? 1 : 1.05 }}
                whileTap={{ scale: loading ? 1 : 0.95 }}
                onClick={handleLogin}
                disabled={loading}
                className="flex-1 bg-emerald-600 text-white font-black py-4 px-4 rounded-2xl text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-[0_10px_20px_rgba(5,150,105,0.3)] hover:bg-emerald-500"
              >
                <LogIn size={18} />
                Log In
              </motion.button>
            </div>

            <motion.button
              whileHover={{ scale: loading ? 1 : 1.02, y: loading ? 0 : -2 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              onClick={handleLogin}
              disabled={loading}
              className="w-full bg-slate-900 dark:bg-white text-white dark:text-slate-950 font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_30px_rgba(255,255,255,0.1)] group relative overflow-hidden disabled:opacity-70"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 dark:via-slate-100 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              {loading ? <Loader2 size={20} className="animate-spin" /> : <Activity size={20} className="relative z-10" />}
              <span className="uppercase tracking-tight relative z-10">{loading ? 'Calibrating...' : 'Access Execution Terminal'}</span>
            </motion.button>
          </div>

          <div className="mt-8 pt-8 border-t border-white/5 grid grid-cols-3 gap-1">
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <TrendingUp size={16} className="text-indigo-400" />
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Execute</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity border-x border-white/5">
              <BarChart3 size={16} className="text-emerald-400" />
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Analyze</span>
            </div>
            <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <ShieldCheck size={16} className="text-orange-400" />
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest leading-none">Secure</span>
            </div>
          </div>
        </GlassCard>

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="text-center mt-10"
        >
          <p className="text-[9px] text-indigo-500 font-black uppercase tracking-[0.5em] mb-2">Alpha Protocol Active</p>
          <div className="flex justify-center items-center gap-4 text-slate-700">
             <div className="w-8 h-[1px] bg-slate-800/50" />
             <span className="text-[8px] font-bold uppercase whitespace-nowrap">v2.4.9 Secured Link</span>
             <div className="w-8 h-[1px] bg-slate-800/50" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};
