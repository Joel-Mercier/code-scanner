import { Component, type ErrorInfo, type ReactNode } from "react";

type ErrorBoundaryProps = {
	children: ReactNode;
	/** What to show instead of the children once they have thrown. */
	fallback: (error: Error, reset: () => void) => ReactNode;
	/** Changing any of these clears the error (e.g. the item being shown). */
	resetKeys?: unknown[];
};

type ErrorBoundaryState = { error: Error | null };

const changed = (a: unknown[] = [], b: unknown[] = []) =>
	a.length !== b.length ||
	a.some((value, index) => !Object.is(value, b[index]));

/**
 * Catches render errors in a part of a screen, so one broken piece (a tile,
 * a thumbnail) doesn't take the whole screen down with it.
 */
export class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	state: ErrorBoundaryState = { error: null };

	static getDerivedStateFromError(error: Error): ErrorBoundaryState {
		return { error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error(error, info.componentStack);
	}

	componentDidUpdate(previous: ErrorBoundaryProps) {
		if (this.state.error && changed(previous.resetKeys, this.props.resetKeys)) {
			this.reset();
		}
	}

	reset = () => this.setState({ error: null });

	render() {
		if (this.state.error) {
			return this.props.fallback(this.state.error, this.reset);
		}
		return this.props.children;
	}
}
