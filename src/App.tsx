import React, { useState } from 'react';
import SolarPunkHero from "./components/SolarPunkHero";
import SolarApp from "./components/solar/SolarApp";
import LoginPage from "./components/auth/LoginPage";
import InvestorWorkspace from "./investor/pages/InvestorWorkspace";
import { Sun, LogOut } from 'lucide-react';
import { useSolarStore } from './store/solarStore';

export default function App() {
  const [currentRoute, setCurrentRoute] = useState<'home' | 'login' | 'app' | 'investor'>('home');
  const [userRole, setUserRole] = useState<'individual' | 'investor'>('individual');
  const { isAuthenticated, user, logout } = useSolarStore();

  const handleProceed = () => {
    if (isAuthenticated) {
      setCurrentRoute(userRole === 'investor' ? 'investor' : 'app');
    } else {
      setCurrentRoute('login');
    }
  };

  const handleLoginSuccess = (role: 'individual' | 'investor') => {
    setUserRole(role);
    if (role === 'investor') {
      setCurrentRoute('investor');
    } else {
      setCurrentRoute('app');
    }
  };

  const handleLogout = () => {
    logout();
    setCurrentRoute('home');
  };

  return (
    <div className="w-full h-screen overflow-hidden bg-[#050907] font-sans flex flex-col">
      {/* Global Navigation — shown on 3D hero page and solar app page */}
      {currentRoute !== 'login' && currentRoute !== 'investor' && (
        <nav className={`${
          currentRoute === 'home' ? 'fixed top-0 left-0 right-0' : 'relative shrink-0'
        } z-[9999] px-4 sm:px-6 py-2.5 flex justify-between items-center bg-[#050907]/95 backdrop-blur-md border-b border-white/10 h-14`}>
          <div
            className="flex items-center space-x-2 text-white font-bold text-xl cursor-pointer select-none"
            onClick={() => setCurrentRoute('home')}
          >
            <Sun className="text-amber-400 w-6 h-6" />
            <span>Surya<span className="text-emerald-400">Ease</span></span>
          </div>

          <div className="flex items-center gap-3">
            {currentRoute === 'app' && (
              <button
                onClick={() => setCurrentRoute('home')}
                className="text-slate-300 hover:text-white text-sm font-semibold transition-all cursor-pointer px-4 py-2 rounded-xl border border-white/10 hover:border-white/25 bg-slate-900/70 hover:bg-slate-800 shadow-sm hover:scale-105 active:scale-95"
              >
                ← Home
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs sm:text-sm text-slate-300 hover:text-rose-400 font-semibold transition-all cursor-pointer px-4 py-2 rounded-xl border border-white/10 hover:border-rose-500/40 bg-slate-900/70 hover:bg-rose-500/10 shadow-sm hover:scale-105 active:scale-95"
                title="Sign out of your session"
              >
                Sign Out
              </button>
            )}

            <button
              onClick={() => {
                if (currentRoute === 'home') {
                  handleProceed();
                } else {
                  setCurrentRoute('home');
                }
              }}
              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-500/35 transition-all cursor-pointer shadow-md shadow-emerald-500/20 hover:scale-105 active:scale-95 hover:shadow-emerald-500/40"
            >
              {currentRoute === 'home' 
                ? (isAuthenticated ? 'Open Platform' : 'Sign In / Proceed') 
                : 'View Demo'
              }
            </button>
          </div>
        </nav>
      )}

      {/* Router View */}
      {currentRoute === 'home' && (
        /* Hero — overflow hidden so 3D canvas doesn't cause scroll */
        <div className="hero-page pt-0">
          <SolarPunkHero />
          {/* Proceed CTA Button */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-40">
            <button
              onClick={handleProceed}
              className="px-10 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 rounded-full font-black text-lg tracking-wide shadow-[0_0_36px_rgba(16,185,129,0.4)] hover:shadow-[0_0_60px_rgba(16,185,129,0.6)] transition-all transform hover:-translate-y-1.5 active:translate-y-0 hover:scale-105 flex items-center gap-3 cursor-pointer"
            >
              Start Your Solar Journey
              <span className="text-2xl leading-none">→</span>
            </button>
          </div>
        </div>
      )}

      {currentRoute === 'login' && (
        /* Glassmorphic Minimalist Login Screen with Individual & Investor Options */
        <LoginPage 
          onSuccess={handleLoginSuccess}
          onBackToHome={() => setCurrentRoute('home')}
        />
      )}

      {currentRoute === 'app' && (
        /* Individual Solar assessment platform — non-scrolling single viewport view */
        <div className="solar-page flex-1 h-[calc(100vh-56px)] overflow-hidden">
          <SolarApp />
        </div>
      )}

      {currentRoute === 'investor' && (
        /* Investor EV Charging Station Platform */
        <div className="w-full h-screen bg-black">
          <InvestorWorkspace onBack={() => setCurrentRoute('home')} />
        </div>
      )}
    </div>
  );
}