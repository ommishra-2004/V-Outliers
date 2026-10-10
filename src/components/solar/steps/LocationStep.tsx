import React from 'react';
import { useSolarStore } from '../../../store/solarStore';
import RooftopMap from '../RooftopMap';

export default function LocationStep() {
  const { updateSiteInput, setStep } = useSolarStore();

  return (
    <div className="space-y-3">
      {/* ── Satellite Rooftop Identification Studio ── */}
      <RooftopMap
        onAreaConfirmed={(area) => {
          updateSiteInput({ roofAreaSqft: area });
          setStep(2); // Advance directly to Energy Details!
        }}
      />
    </div>
  );
}
