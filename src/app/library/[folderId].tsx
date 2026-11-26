import { useLocalSearchParams } from "expo-router";
import { LibraryScreen } from "@/features/library/LibraryScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function LibraryFolderRoute() {
	const { folderId } = useLocalSearchParams<{ folderId: string }>();
	return <LibraryScreen folderId={folderId} />;
}
