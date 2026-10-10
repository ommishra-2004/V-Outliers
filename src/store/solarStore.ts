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
    const raw = localStorage.getItem('suryapunk_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const initialUser = getStoredUser();

const initialState = {
  currentStep: 1,
  siteInput: {
    address: 'Indiranagar, Bengaluru',
    city: 'Bengaluru',
    state: 'Karnataka',
    latitude: 12.9784,
    longitude: 77.6408,
    propertyType: 'Residential' as const,
    averageTariff: 8,
    monthlyBill: 2000,
    roofAreaSqft: 1200,
  },
  detectedPolygon: [] as [number, number][],
  detectedGrossArea: 1200,
  detectedUsableArea: 900,
  detectionSource: 'INITIAL',
  analysisResult: null,
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
      try { localStorage.setItem('suryapunk_user', JSON.stringify(user)); } catch {}
      set({ user, isAuthenticated: true });
    } else {
      try { localStorage.removeItem('suryapunk_user'); } catch {}
      set({ user: null, isAuthenticated: false });
    }
  },
  logout: () => {
    try { localStorage.removeItem('suryapunk_user'); } catch {}
    set({ user: null, isAuthenticated: false });
  },
  setStep: (step) => set({ currentStep: step }),
  updateSiteInput: (input) =>
    set((state) => ({
      siteInput: { ...state.siteInput, ...input }
    })),
  setDetectedRooftop: (data) =>
    set((state) => ({
      detectedPolygon: data.polygon,
      detectedGrossArea: data.grossArea,
      detectedUsableArea: data.usableArea,
      detectionSource: data.source,
      siteInput: {
        ...state.siteInput,
        roofAreaSqft: data.grossArea
      }
    })),
  setAnalysisResult: (result) => set({ analysisResult: result }),
  setVendorQuotes: (quotes) => set({ vendorQuotes: quotes }),
  addChatMessage: (msg) =>
    set((state) => ({ chatMessages: [...state.chatMessages, msg] })),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set(initialState),
}));
