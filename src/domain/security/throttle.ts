/** Wrong guesses allowed before each further one makes you wait. */
export const FREE_ATTEMPTS = 5;

const DELAYS = [30_000, 60_000, 5 * 60_000, 15 * 60_000];

/**
 * How long to wait after `failures` wrong passwords or codes in a row:
 * nothing for the first few, then longer and longer.
 */
export const lockoutDelay = (failures: number) =>
	failures < FREE_ATTEMPTS
		? 0
		: DELAYS[Math.min(failures - FREE_ATTEMPTS, DELAYS.length - 1)];

/** Whole seconds left until `until`, rounded up (0 once it has passed). */
export const secondsLeft = (until: number, now: number) =>
	Math.max(0, Math.ceil((until - now) / 1000));
