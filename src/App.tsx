import { useState } from 'react';
import { TradeProvider, useTrades } from './context/TradeContext';
import { Dashboard } from './components/Dashboard';
import { TradeHistory } from './components/TradeHistory';
import { Analytics } from './components/Analytics';
import { PnLCalendar } from './components/PnLCalendar';
import { AddTradeForm } from './components/AddTradeForm';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { useAuth } from './context/AuthContext';
import { LayoutDashboard, History, PieChart, Calendar, Plus, Settings as SettingsIcon } from 'lucide-react';
import { cn } from './lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { Trade } from './types';
import { logout } from './lib/firebase';

type View = 'dashboard' | 'history' | 'analytics' | 'calendar' | 'add' | 'settings';

function TerminalApp({ currentView, setCurrentView, startEdit, editingTrade, setEditingTrade, navItems }: any) {
  const { loading } = useTrades();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 transition-colors">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full"
        />
      </div>
    );
  }

const getViewTransition = (view: View) => {
    switch (view) {
      case 'dashboard':
        return {
          initial: { opacity: 0, scale: 1.1, rotateX: -10, translateZ: -200 },
          animate: { opacity: 1, scale: 1, rotateX: 0, translateZ: 0 },
          exit: { opacity: 0, scale: 0.9, rotateX: 10, translateZ: -100 }
        };
      case 'history':
        return {
          initial: { opacity: 0, x: -100, rotateY: 30 },
          animate: { opacity: 1, x: 0, rotateY: 0 },
          exit: { opacity: 0, x: 100, rotateY: -30 }
        };
      case 'analytics':
        return {
          initial: { opacity: 0, y: 50, rotateX: 45 },
          animate: { opacity: 1, y: 0, rotateX: 0 },
          exit: { opacity: 0, y: -50, rotateX: -45 }
        };
      case 'calendar':
        return {
          initial: { opacity: 0, scale: 0.5, rotate: -10 },
          animate: { opacity: 1, scale: 1, rotate: 0 },
          exit: { opacity: 0, scale: 1.5, rotate: 10 }
        };
      case 'add':
        return {
          initial: { opacity: 0, translateZ: 500, rotateY: 90 },
          animate: { opacity: 1, translateZ: 0, rotateY: 0 },
          exit: { opacity: 0, translateZ: -500, rotateY: -90 }
        };
      case 'settings':
        return {
          initial: { opacity: 0, x: 100, scale: 0.8 },
          animate: { opacity: 1, x: 0, scale: 1 },
          exit: { opacity: 0, x: -100, scale: 0.8 }
        };
      default:
        return {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          exit: { opacity: 0 }
        };
    }
  };

  const transition = getViewTransition(currentView);

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-200 font-sans selection:bg-indigo-500/30 overflow-x-hidden transition-colors duration-500">
      {/* Ambient background effects */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-500/10 blur-[120px]" />
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/5 blur-[120px]" />
      </div>

      <main className="max-w-md mx-auto min-h-screen pt-8 pb-32 relative" style={{ perspective: '2000px' }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={transition.initial}
            animate={transition.animate}
            exit={transition.exit}
            transition={{ 
              type: 'spring',
              stiffness: 300,
              damping: 30,
              mass: 1
            }}
            className="px-4"
          >
            {currentView === 'dashboard' && <Dashboard />}
            {currentView === 'history' && <TradeHistory onEdit={startEdit} />}
            {currentView === 'analytics' && <Analytics />}
            {currentView === 'calendar' && <PnLCalendar onEdit={startEdit} />}
            {currentView === 'settings' && <Settings />}
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
          className="bg-white/80 dark:bg-slate-900/90 backdrop-blur-3xl border border-slate-200 dark:border-white/10 p-2 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between gap-1 pointer-events-auto w-full max-w-lg transition-colors"
        >
          {navItems.map((item: any) => {
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
                    "w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30 transition-all hover:bg-indigo-600",
                    isActive && "bg-indigo-600 ring-4 ring-indigo-500/20"
                  )}
                >
                  <Icon size={24} className="text-white" />
                </motion.button>
              );
            }

            return (
              <button
                key={item.id}
                onClick={() => setCurrentView(item.id)}
                className="flex-1 flex flex-col items-center gap-1 py-1.5 transition-all active:scale-95 group"
              >
                <div className={cn(
                  "p-1.5 rounded-xl transition-all group-hover:bg-white/5",
                  isActive && "bg-indigo-500/10"
                )}>
                  <Icon 
                    size={16} 
                    className={cn(
                      "transition-all duration-300",
                      isActive ? "text-indigo-400 scale-110" : "text-slate-500"
                    )} 
                  />
                </div>
                <span className={cn(
                  "text-[7px] font-black uppercase tracking-[0.1em] transition-all",
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
  );
}

export default function App() {
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [editingTrade, setEditingTrade] = useState<Trade | undefined>(undefined);

  if (!user) {
    return <Login />;
  }

  const startEdit = (trade: Trade) => {
    setEditingTrade(trade);
    setCurrentView('add');
  };

  const navItems = [
    { id: 'dashboard' as View, icon: LayoutDashboard, label: 'Logs' },
    { id: 'history' as View, icon: History, label: 'Vault' },
    { id: 'add' as View, icon: Plus, label: 'Add', primary: true },
    { id: 'analytics' as View, icon: PieChart, label: 'Stats' },
    { id: 'settings' as View, icon: SettingsIcon, label: 'Config' },
  ];

  return (
    <TradeProvider>
      <TerminalApp 
        currentView={currentView} 
        setCurrentView={setCurrentView} 
        startEdit={startEdit} 
        editingTrade={editingTrade} 
        setEditingTrade={setEditingTrade} 
        navItems={navItems} 
      />
    </TradeProvider>
  );
}
