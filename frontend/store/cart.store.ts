import { create } from 'zustand';

// Note: Actual cart logic is handled by backend + React Query. 
// This store is for UI triggers (e.g., opening a cart drawer if we implemented one)
// or managing checkout flow state.

interface CheckoutState {
  currentStep: number;
  setStep: (step: number) => void;
  shippingData: any;
  setShippingData: (data: any) => void;
  resetCheckout: () => void;
}

export const useCheckoutStore = create<CheckoutState>((set) => ({
  currentStep: 1,
  setStep: (step) => set({ currentStep: step }),
  shippingData: {},
  setShippingData: (data) => set({ shippingData: data }),
  resetCheckout: () => set({ currentStep: 1, shippingData: {} }),
}));