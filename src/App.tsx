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
    <div className="w-full bg-[#050907] font-sans">
      {/* Global Navigation — shown on 3D hero page and solar app page */}
      {currentRoute !== 'login' && currentRoute !== 'investor' && (
        <nav className={`${
          currentRoute === 'home' ? 'fixed top-0 left-0 right-0' : 'sticky top-0'
        } z-[9999] px-4 sm:px-6 py-2.5 flex justify-between items-center bg-[#050907]/95 backdrop-blur-md border-b border-white/10 h-14`}>
          <div
            className="flex items-center space-x-2 text-white font-bold text-xl cursor-pointer select-none"
            onClick={() => setCurrentRoute('home')}
          >
            <Sun className="text-amber-400 w-6 h-6" />
            <span>Surya<span className="text-emerald-400">Punk</span></span>
          </div>

          <div className="flex items-center gap-3">
            {currentRoute === 'app' && (
              <button
                onClick={() => setCurrentRoute('home')}
                className="text-slate-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                ← Home
              </button>
            )}

            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-slate-400 hover:text-rose-400 transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-white/10 hover:border-rose-500/20"
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
              className="bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 px-5 py-2 rounded-full text-sm font-bold hover:bg-emerald-500/30 transition-all cursor-pointer shadow-sm hover:scale-105 active:scale-95"
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
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-lime-500 text-slate-900 rounded-full font-bold text-lg shadow-[0_0_30px_rgba(16,185,129,0.3)] hover:shadow-[0_0_50px_rgba(16,185,129,0.5)] transition-all transform hover:-translate-y-1 flex items-center cursor-pointer"
            >
              Start Your Solar Journey
              <span className="ml-2 text-2xl leading-none">→</span>
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
        /* Individual Solar sizing & assessment platform — full scrollable page */
        <div className="solar-page">
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