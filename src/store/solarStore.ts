import { create } from 'zustand';
import { SiteInput, SolarAnalysisResult, VendorQuote, ChatMessage, AuthUser } from '../types/solar';

interface SolarStore {
  currentStep: number;
  siteInput: Partial<SiteInput>;
  detectedPolygon: [number, number][];
  detectedGrossArea: number;
  detectedUsableArea: number;
  detectionSource: string;
  analysisResult: SolarAnalysisResult | null;
  vendorQuotes: VendorQuote[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  // Auth state
  user: AuthUser | null;
  isAuthenticated: boolean;
  setUser: (user: AuthUser | null) => void;
  logout: () => void;
  setStep: (step: number) => void;
  updateSiteInput: (input: Partial<SiteInput>) => void;
  setDetectedRooftop: (data: {
    polygon: [number, number][];
    grossArea: number;
    usableArea: number;
    source: string;
  }) => void;
  setAnalysisResult: (result: SolarAnalysisResult | null) => void;
  setVendorQuotes: (quotes: VendorQuote[]) => void;
  addChatMessage: (msg: ChatMessage) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const getStoredUser = (): AuthUser | null => {
  try {
    const raw = localStorage.getItem('suryaease_user') || localStorage.getItem('suryapunk_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredSiteInput = (): Partial<SiteInput> => {
  try {
    const raw = localStorage.getItem('suryaease_site_input') || localStorage.getItem('suryapunk_site_input');
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    address: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
    propertyType: 'Residential',
    averageTariff: 8,
    monthlyBill: 2500,
    roofAreaSqft: 1200,
  };
};

const getStoredAnalysis = (): SolarAnalysisResult | null => {
  try {
    const raw = localStorage.getItem('suryaease_analysis') || localStorage.getItem('suryapunk_analysis');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const getStoredStep = (): number => {
  try {
    const raw = localStorage.getItem('suryaease_step') || localStorage.getItem('suryapunk_step');
    const step = raw ? parseInt(raw, 10) : 1;
    return isNaN(step) || step < 1 || step > 3 ? 1 : step;
  } catch {
    return 1;
  }
};

const initialUser = getStoredUser();
const initialSiteInput = getStoredSiteInput();
const initialAnalysis = getStoredAnalysis();
const initialStep = getStoredStep();

const defaultSiteInput: Partial<SiteInput> = {
  address: 'Indiranagar, Bengaluru',
  city: 'Bengaluru',
  state: 'Karnataka',
  latitude: 12.9784,
  longitude: 77.6408,
  propertyType: 'Residential' as const,
  averageTariff: 8,
  monthlyBill: 2500,
  roofAreaSqft: 1200,
};

const initialState = {
  currentStep: initialStep,
  siteInput: initialSiteInput,
  detectedPolygon: [] as [number, number][],
  detectedGrossArea: initialSiteInput.roofAreaSqft || 1200,
  detectedUsableArea: Math.round((initialSiteInput.roofAreaSqft || 1200) * 0.75),
  detectionSource: 'INITIAL',
  analysisResult: initialAnalysis,
  vendorQuotes: [],
  chatMessages: [
    {
      role: 'assistant' as const,
      content: 'Namaste! I am your PM Surya Ghar & Indian Solar Policy Assistant. Ask me anything about subsidies, net metering, or rooftop guidelines!'
    }
  ],
  isLoading: false,
  error: null,
  user: initialUser,
  isAuthenticated: !!initialUser,
};

export const useSolarStore = create<SolarStore>((set) => ({
  ...initialState,
  setUser: (user) => {
    if (user) {
      try { 
        localStorage.setItem('suryaease_user', JSON.stringify(user));
      } catch {}
      set({ user, isAuthenticated: true });
    } else {
      try { 
        localStorage.removeItem('suryaease_user');
        localStorage.removeItem('suryapunk_user');
      } catch {}
      set({ user: null, isAuthenticated: false });
    }
  },
  logout: () => {
    try { 
      localStorage.removeItem('suryaease_user');
      localStorage.removeItem('suryapunk_user');
    } catch {}
    set({ user: null, isAuthenticated: false });
  },
  setStep: (step) => {
    try { 
      localStorage.setItem('suryaease_step', String(step));
    } catch {}
    set({ currentStep: step });
  },
  updateSiteInput: (input) =>
    set((state) => {
      const updated = { ...state.siteInput, ...input };
      try { 
        localStorage.setItem('suryaease_site_input', JSON.stringify(updated));
      } catch {}
      return { siteInput: updated };
    }),
  setDetectedRooftop: (data) =>
    set((state) => {
      const updatedSite = {
        ...state.siteInput,
        roofAreaSqft: data.grossArea
      };
      try { 
        localStorage.setItem('suryaease_site_input', JSON.stringify(updatedSite));
      } catch {}
      return {
        detectedPolygon: data.polygon,
        detectedGrossArea: data.grossArea,
        detectedUsableArea: data.usableArea,
        detectionSource: data.source,
        siteInput: updatedSite
      };
    }),
  setAnalysisResult: (result) => {
    if (result) {
      try { 
        localStorage.setItem('suryaease_analysis', JSON.stringify(result));
      } catch {}
    } else {
      try { 
        localStorage.removeItem('suryaease_analysis');
        localStorage.removeItem('suryapunk_analysis');
      } catch {}
    }
    set({ analysisResult: result });
  },
  setVendorQuotes: (quotes) => set({ vendorQuotes: quotes }),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => {
    try {
      localStorage.removeItem('suryaease_site_input');
      localStorage.removeItem('suryapunk_site_input');
      localStorage.removeItem('suryaease_analysis');
      localStorage.removeItem('suryapunk_analysis');
      localStorage.setItem('suryaease_step', '1');
    } catch {}
    set({
      ...initialState,
      currentStep: 1,
      siteInput: defaultSiteInput,
      detectedGrossArea: 1200,
      detectedUsableArea: 900,
      analysisResult: null,
      vendorQuotes: [],
    });
  },
}));
