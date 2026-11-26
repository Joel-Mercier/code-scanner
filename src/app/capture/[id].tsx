import { useLocalSearchParams } from "expo-router";
import { CaptureScreen } from "@/features/capture/CaptureScreen";

export { ErrorScreen as ErrorBoundary } from "@/features/errors/ErrorScreen";

export default function CaptureRoute() {
	const { id } = useLocalSearchParams<{ id: string }>();
	return <CaptureScreen id={id} />;
}
