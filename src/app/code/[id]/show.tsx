import { useLocalSearchParams } from "expo-router";
import { ShowCodeScreen } from "@/features/code/ShowCodeScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function ShowCodeRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <ShowCodeScreen id={id} />;
}
