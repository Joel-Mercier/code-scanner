import { createMMKV } from "react-native-mmkv";
import type { StateStorage } from "zustand/middleware";

/** The app's key-value store; every persisted zustand store lives here. */
export const storage = createMMKV();

export const zustandStorage: StateStorage = {
	setItem: (name, value) => storage.set(name, value),
	getItem: (name) => storage.getString(name) ?? null,
	removeItem: (name) => {
		storage.remove(name);
	},
};
