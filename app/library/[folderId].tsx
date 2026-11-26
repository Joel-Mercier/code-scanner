import { useLocalSearchParams } from "expo-router";
import { LibraryScreen } from "@/features/library/LibraryScreen";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

export default function LibraryFolder() {
	const { folderId } = useLocalSearchParams<{ folderId: string }>();
	return <LibraryScreen folderId={folderId} />;
}
