import { create } from "zustand";

export interface UiState {
	modal: string | null;
	consoleVisible: boolean;
	miniQueueOpen: boolean;
	toast: string | null;
	openModal: (name: string) => void;
	closeModal: () => void;
	toggleConsole: () => void;
	setConsole: (visible: boolean) => void;
	setMiniQueue: (open: boolean) => void;
	toggleMiniQueue: () => void;
	showToast: (message: string) => void;
	clearToast: () => void;
}

export const useUiStore = create<UiState>()((set, get) => ({
	modal: null,
	consoleVisible: false,
	miniQueueOpen: false,
	toast: null,
	openModal: (name) => set({ modal: name }),
	closeModal: () => set({ modal: null }),
	toggleConsole: () => set({ consoleVisible: !get().consoleVisible }),
	setConsole: (visible) => set({ consoleVisible: visible }),
	setMiniQueue: (open) => set({ miniQueueOpen: open }),
	toggleMiniQueue: () => set({ miniQueueOpen: !get().miniQueueOpen }),
	showToast: (message) => set({ toast: message }),
	clearToast: () => set({ toast: null }),
}));
