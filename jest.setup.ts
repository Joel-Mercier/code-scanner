// Native modules that have no JS fallback under Jest.

jest.mock("react-native-mmkv", () => {
	// An in-memory MMKV: what the app's storage helper and stores use.
	const createMMKV = () => {
		const values = new Map<string, string | number | boolean>();
		return {
			set: (key: string, value: string | number | boolean) =>
				values.set(key, value),
			getString: (key: string) => {
				const value = values.get(key);
				return typeof value === "string" ? value : undefined;
			},
			contains: (key: string) => values.has(key),
			remove: (key: string) => values.delete(key),
			clearAll: () => values.clear(),
			getAllKeys: () => [...values.keys()],
		};
	};
	return { createMMKV };
});
