import { useLocalSearchParams } from "expo-router";
import { DocumentScreen } from "@/features/document/DocumentScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function DocumentRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <DocumentScreen id={id} />;
}
