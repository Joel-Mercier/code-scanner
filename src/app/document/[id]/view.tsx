import { useLocalSearchParams } from "expo-router";
import { PageViewerScreen } from "@/features/document/PageViewerScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function PageViewerRoute() {
	const { id, page } = useLocalSearchParams<{ id: string; page?: string }>();
	return <PageViewerScreen id={id} page={Math.max(0, Number(page) || 0)} />;
}
