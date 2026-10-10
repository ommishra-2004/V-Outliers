import React, { useState } from 'react';
import WizardLayout from './WizardLayout';
import Dashboard from './Dashboard';
import VendorMarketplace from './VendorMarketplace';
import ChatWidget from './ChatWidget';
import { useSolarStore } from '../../store/solarStore';

export default function SolarApp() {
  const { analysisResult, reset } = useSolarStore();
  const [view, setView] = useState<'assessment' | 'dashboard' | 'marketplace'>('assessment');

  React.useEffect(() => {
    if (analysisResult && view === 'assessment') setView('dashboard');
    else if (!analysisResult && view !== 'assessment') setView('assessment');
  }, [analysisResult]);

  const handleReset = () => {
    reset();
    setView('assessment');
  };

  return (
    <div className="min-h-screen bg-[#050907] text-white">
      {/* Main Content Areas */}
      <main className="w-full">
        {view === 'assessment' && <WizardLayout />}
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
