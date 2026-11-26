import { useLocalSearchParams } from "expo-router";
import { CodeScreen } from "@/features/code/CodeScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function CodeRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <CodeScreen id={id} />;
}
