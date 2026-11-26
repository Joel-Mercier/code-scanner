type Attempt<T> = { ok: true; value: T } | { ok: false; error: unknown };

/**
 * Runs `task` and reports failures as a value. Keeps try/catch out of
 * components, which React Compiler can't optimise yet.
 */
export const attempt = async <T>(
	task: () => Promise<T>,
): Promise<Attempt<T>> => {
	try {
		return { ok: true, value: await task() };
	} catch (error) {
		console.error(error);
		return { ok: false, error };
	}
};
