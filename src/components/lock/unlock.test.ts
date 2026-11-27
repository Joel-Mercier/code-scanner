import useLockSession from "@/stores/lockSession";
import useSettings from "@/stores/settings";
import {
	canLock,
	confirmIdentity,
	finishRequest,
	forgetSecrets,
	resolveMethod,
	unlockItems,
	useLockUi,
} from "./unlock";

jest.mock("@/services/lock", () => ({
	deviceAuth: jest.fn(async () => "faceId"),
	authenticateWithDevice: jest.fn(async () => true),
	hasPassword: jest.fn(async () => true),
	hasTotpSecret: jest.fn(async () => true),
	clearSecrets: jest.fn(async () => {}),
}));
const lock = jest.requireMock("@/services/lock");

/** Lets pending promises (the method lookup) settle. */
const flush = () => new Promise<void>((resolve) => setImmediate(resolve));

afterEach(() => {
	useSettings.getState().setLockMethod("device");
	useLockSession.setState({ itemsUnlocked: false });
	useLockUi.setState({ request: null, authenticating: false });
	jest.clearAllMocks();
});

describe("resolveMethod", () => {
	it("uses the method picked when its secret is there", async () => {
		await expect(resolveMethod("password")).resolves.toBe("password");
		await expect(resolveMethod("totp")).resolves.toBe("totp");
		await expect(resolveMethod("device")).resolves.toBe("device");
	});

	it("falls back to the phone's lock when the secret is gone", async () => {
		lock.hasPassword.mockResolvedValueOnce(false);
		await expect(resolveMethod("password")).resolves.toBe("device");
		lock.hasTotpSecret.mockResolvedValueOnce(false);
		await expect(resolveMethod("totp")).resolves.toBe("device");
	});

	it("has nothing to check on a phone without a passcode", async () => {
		lock.deviceAuth.mockResolvedValueOnce("none");
		await expect(resolveMethod("device")).resolves.toBe("none");
		lock.deviceAuth.mockResolvedValueOnce("none");
		await expect(canLock()).resolves.toBe(false);
	});
});

describe("unlockItems", () => {
	it("asks the phone once, then stays unlocked", async () => {
		await expect(unlockItems()).resolves.toBe(true);
		expect(useLockSession.getState().itemsUnlocked).toBe(true);
		await expect(unlockItems()).resolves.toBe(true);
		expect(lock.authenticateWithDevice).toHaveBeenCalledTimes(1);
	});

	it("stays locked when the prompt is turned down", async () => {
		lock.authenticateWithDevice.mockResolvedValueOnce(false);
		await expect(unlockItems()).resolves.toBe(false);
		expect(useLockSession.getState().itemsUnlocked).toBe(false);
		expect(useLockUi.getState().authenticating).toBe(false);
	});

	it("shows the pad for a password, and unlocks once it is answered", async () => {
		useSettings.getState().setLockMethod("password");
		const unlocking = unlockItems();
		await flush();
		expect(useLockUi.getState().request).toMatchObject({
			purpose: "items",
			method: "password",
		});
		finishRequest(true);
		await expect(unlocking).resolves.toBe(true);
		expect(useLockUi.getState().request).toBeNull();
		expect(useLockSession.getState().itemsUnlocked).toBe(true);
		expect(lock.authenticateWithDevice).not.toHaveBeenCalled();
	});

	it("turns down a pad that a newer request replaces", async () => {
		useSettings.getState().setLockMethod("totp");
		const first = confirmIdentity();
		await flush();
		const second = confirmIdentity();
		await flush();
		await expect(first).resolves.toBe(false);
		finishRequest(false);
		await expect(second).resolves.toBe(false);
	});
});

describe("confirmIdentity", () => {
	it("asks even while items are unlocked, and unlocks nothing", async () => {
		useLockSession.setState({ itemsUnlocked: true });
		await expect(confirmIdentity()).resolves.toBe(true);
		expect(lock.authenticateWithDevice).toHaveBeenCalledTimes(1);
	});
});

describe("forgetSecrets", () => {
	it("drops the forgotten secret and goes back to the phone's lock", async () => {
		useSettings.getState().setLockMethod("password");
		await expect(forgetSecrets()).resolves.toBe(true);
		expect(useSettings.getState().lockMethod).toBe("device");
		expect(lock.clearSecrets).toHaveBeenCalledWith();
	});

	it("says when the phone has no lock to fall back on", async () => {
		useSettings.getState().setLockMethod("totp");
		lock.deviceAuth.mockResolvedValueOnce("none");
		await expect(forgetSecrets()).resolves.toBe(false);
		expect(useSettings.getState().lockMethod).toBe("device");
	});
});
