import { useLocalSearchParams } from "expo-router";
import { PagesScreen } from "@/features/document/PagesScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function PagesRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <PagesScreen id={id} />;
}
