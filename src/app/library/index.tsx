import { LibraryScreen } from "@/features/library/LibraryScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function LibraryRoute() {
	return <LibraryScreen folderId={null} />;
}
