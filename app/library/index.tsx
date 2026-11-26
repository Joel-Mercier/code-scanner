import { LibraryScreen } from "@/features/library/LibraryScreen";

export { ErrorScreen as ErrorBoundary } from "@/components/ui/ErrorScreen";

export default function LibraryRoot() {
	return <LibraryScreen folderId={null} />;
}
