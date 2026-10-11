import { useSolarStore } from '../../store/solarStore';
import LocationStep from './steps/LocationStep';
import DetailsStep from './steps/DetailsStep';
import ReviewStep from './steps/ReviewStep';
import { Check } from 'lucide-react';

export default function WizardLayout({ onReportGenerated }: { onReportGenerated?: () => void }) {
  const { currentStep, setStep } = useSolarStore();
  return (
    <div className="solar-wizard">
      <ol className="wizard-progress" aria-label="Assessment progress">
        {['Rooftop', 'Energy use', 'Review'].map((label, index) => (
          <li key={label}><button disabled={index + 1 > currentStep} aria-current={currentStep === index + 1 ? 'step' : undefined} onClick={() => setStep(index + 1)}><span>{index + 1 < currentStep ? <Check size={14} /> : String(index + 1).padStart(2, '0')}</span>{label}</button></li>
        ))}
      </ol>
      <div className="wizard-content" key={currentStep}>
        {currentStep === 1 && <LocationStep />}
        {currentStep === 2 && <DetailsStep />}
        {currentStep === 3 && <ReviewStep onReportGenerated={onReportGenerated} />}
      </div>
    </div>
  );
}
