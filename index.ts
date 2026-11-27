import "expo-router/entry";
// Answers the day's automatic backup slot. Started here, not from a screen:
// Android can start the app for it with no UI at all.
import { startAutoBackupScheduler } from "@/features/settings/autoBackup";

// Guarded: a throw while the entry file loads would take the whole app down,
// for people who never turned automatic backups on too.
try {
	startAutoBackupScheduler();
} catch (error) {
	console.warn("[autoBackup] couldn't start", error);
}
