import { create } from 'zustand';

export type StatusType = 'loading' | 'success' | 'error';

interface StatusState {
  visible: boolean;
  message: string;
  type: StatusType;

  /** Show a loading bar with message. Does not auto-dismiss. */
  loading: (message: string) => void;
  /** Complete the bar and auto-dismiss after 2 s. */
  success: (message: string) => void;
  /** Show a persistent error. Stays until dismissed. */
  error: (message: string) => void;
  dismiss: () => void;
}

export const useStatusStore = create<StatusState>()((set) => ({
  visible: false,
  message: '',
  type: 'loading',

  loading: (message) => set({ visible: true, message, type: 'loading' }),
  success: (message) => set({ visible: true, message, type: 'success' }),
  error:   (message) => set({ visible: true, message, type: 'error' }),
  dismiss: ()        => set({ visible: false }),
}));
