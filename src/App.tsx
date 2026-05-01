import { useState } from 'react';
import { TradeProvider } from './context/TradeContext';
import { Dashboard } from './components/Dashboard';
import { TradeHistory } from './components/TradeHistory';
import { Analytics } from './components/Analytics';
import { PnLCalendar } from './components/PnLCalendar';
import { AddTradeForm } from './components/AddTradeForm';
import { LayoutDashboard, History, PieChart, Calendar, Plus } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Trade } from './types';

type View = 'dashboard' | 'history' | 'analytics' | 'calendar' | 'add';

export default function App() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  const startEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setCurrentView('add');
  };

  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Home' },
    { id: 'history' as View, icon: History, label: 'Ledger' },
    { id: 'add' as View, icon: Plus, label: 'Add', primary: true },
    { id: 'analytics' as View, icon: PieChart, label: 'Insights' },
    { id: 'calendar' as View, icon: Calendar, label: 'Calendar' },
  ];

  return (
    <TradeProvider>
      <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
        {/* Ambient background effects */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
        </div>

        <main className="max-w-md mx-auto min-h-screen pt-8 pb-32 relative perspective-1000">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, rotateY: 10, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, rotateY: 0, x: 0, scale: 1 }}
              exit={{ opacity: 0, rotateY: -10, x: -20, scale: 0.95 }}
              transition={{ 
                type: 'spring',
                stiffness: 350,
                damping: 25,
                mass: 0.8
              }}
              className="px-4"
            >
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'history' && <TradeHistory onEdit={startEdit} />}
              {currentView === 'analytics' && <Analytics />}
              {currentView === 'calendar' && <PnLCalendar onEdit={startEdit} />}
              {currentView === 'add' && (
                <AddTradeForm 
                  tradeToEdit={editingTrade} 
                  onComplete={() => {
                    setCurrentView('dashboard');
                    setEditingTrade(undefined);
                  }} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-8 px-6 pointer-events-none">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-slate-900/90 backdrop-blur-3xl border border-white/10 p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-1 pointer-events-auto w-full max-w-sm"
          >
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              
              if (item.primary) {
                return (
                  <motion.button
                    key={item.id}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setEditingTrade(undefined);
                      setCurrentView(item.id);
                    }}
                    className={cn(
                      "w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-600",
                      isActive && "bg-indigo-600 ring-4 ring-indigo-500/20"
                    )}
                  >
                    <Icon size={28} className="text-white" />
                  </motion.button>
                );
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentView(item.id)}
                  className="flex-1 flex flex-col items-center gap-1 py-2 transition-all active:scale-95 group"
                >
                  <div className={cn(
                    "p-1 rounded-lg transition-all group-hover:bg-white/5",
                    isActive && "bg-indigo-500/10"
                  )}>
                    <Icon 
                      size={20} 
                      className={cn(
                        "transition-all duration-300",
                        isActive ? "text-indigo-400 scale-110" : "text-slate-500"
                      )} 
                    />
                  </div>
                  <span className={cn(
                    "text-[8px] font-black uppercase tracking-[0.2em] transition-all",
                    isActive ? "text-indigo-400 opacity-100" : "text-slate-600 opacity-80"
                  )}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </motion.div>
        </nav>
      </div>
    </TradeProvider>
  );
}
