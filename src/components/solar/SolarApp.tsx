import React, { useState } from 'react';
import WizardLayout from './WizardLayout';
import Dashboard from './Dashboard';
import VendorMarketplace from './VendorMarketplace';
import ChatWidget from './ChatWidget';
import { useSolarStore } from '../../store/solarStore';

export default function SolarApp() {
  const { reset } = useSolarStore();
  // 'submitted' tracks whether the user has clicked "Generate Report" in ReviewStep.
  // We check localStorage to restore state after a page reload.
  const [view, setView] = useState<'assessment' | 'dashboard' | 'marketplace'>(() => {
    try {
      const submitted = localStorage.getItem('suryaease_submitted') || localStorage.getItem('suryapunk_submitted');
      if (submitted === '1') return 'dashboard';
    } catch {}
    return 'assessment';
  });

  const handleReportGenerated = () => {
    try { 
      localStorage.setItem('suryaease_submitted', '1');
    } catch {}
    setView('dashboard');
  };

  const handleReset = () => {
    try { 
      localStorage.removeItem('suryaease_submitted');
      localStorage.removeItem('suryapunk_submitted');
    } catch {}
    reset();
    setView('assessment');
  };

  return (
    <div className="consumer-app h-full w-full bg-[#050907] text-white flex flex-col overflow-hidden">
      {/* Main Content Areas */}
      <main className="w-full h-full flex-1 overflow-hidden flex flex-col">
        {view === 'assessment' && <WizardLayout onReportGenerated={handleReportGenerated} />}
        {view === 'dashboard' && (
          <Dashboard 
            onViewQuotes={() => setView('marketplace')} 
            onReset={handleReset}
          />
        )}
        {view === 'marketplace' && (
          <VendorMarketplace 
            onBack={() => setView('dashboard')} 
            onReset={handleReset}
          />
        )}
      </main>

      <ChatWidget />
    </div>
  );
}
