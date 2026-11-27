import {
	type CSSTransitionProperties,
	cubicBezier,
	Easing,
	FadeOut,
	Keyframe,
	type WithTimingConfig,
} from "react-native-reanimated";

/**
 * The motion system, mirrored from the design's CSS keyframes. Every builder
 * returns a fresh `Keyframe` (their `delay()` mutates the instance).
 */

/** cubic-bezier(.2,.8,.2,1): rises, settles, toggles. */
export const easeOut = Easing.bezier(0.2, 0.8, 0.2, 1);
/** cubic-bezier(.2,.85,.25,1): objects lifting into place. */
export const easeLift = Easing.bezier(0.2, 0.85, 0.25, 1);
/** cubic-bezier(.2,.9,.3,1.25): a small overshoot. */
export const easePop = Easing.bezier(0.2, 0.9, 0.3, 1.25);
/** cubic-bezier(.2,.9,.25,1): sheets. */
export const easeSheet = Easing.bezier(0.2, 0.9, 0.25, 1);

/** `.v-ease`: every state change (pills, tabs, swatches, switches). */
export const ease: WithTimingConfig = { duration: 350, easing: easeOut };

/**
 * `.v-ease` as a Reanimated CSS transition, for a style that follows a prop
 * (`style={[{ opacity: on ? 1 : 0 }, transition("opacity")]}`).
 */
export const transition = (
	property: CSSTransitionProperties["transitionProperty"],
	duration = 350,
): CSSTransitionProperties => ({
	transitionProperty: property,
	transitionDuration: duration,
	transitionTimingFunction: cubicBezier(0.2, 0.8, 0.2, 1),
});

export const enter = {
	/** `.v-up`: fade in while rising 10px. */
	up: (delay = 0, duration = 500) =>
		new Keyframe({
			0: { opacity: 0, transform: [{ translateY: 10 }] },
			100: { opacity: 1, transform: [{ translateY: 0 }], easing: easeOut },
		})
			.duration(duration)
			.delay(delay),
	/** `.v-lift`: tilted back in perspective, then standing up. */
	lift: (delay = 0) =>
		new Keyframe({
			0: {
				opacity: 0,
				transform: [
					{ perspective: 900 },
					{ translateY: 22 },
					{ rotateX: "18deg" },
					{ scale: 0.94 },
				],
			},
			100: {
				opacity: 1,
				transform: [
					{ perspective: 900 },
					{ translateY: 0 },
					{ rotateX: "0deg" },
					{ scale: 1 },
				],
				easing: easeLift,
			},
		})
			.duration(750)
			.delay(delay),
	/** `.v-pop`: scale up from 0.9 with a hint of overshoot. */
	pop: (delay = 0) =>
		new Keyframe({
			0: { opacity: 0, transform: [{ scale: 0.9 }] },
			100: { opacity: 1, transform: [{ scale: 1 }], easing: easePop },
		})
			.duration(380)
			.delay(delay),
	/** `.v-fade` */
	fade: (delay = 0) =>
		new Keyframe({
			0: { opacity: 0 },
			100: { opacity: 1, easing: Easing.out(Easing.ease) },
		})
			.duration(300)
			.delay(delay),
};

export const exit = {
	fade: () => FadeOut.duration(160),
	/** Sinks 16px while fading out (floating bars leaving the bottom). */
	sink: () =>
		new Keyframe({
			0: { opacity: 1, transform: [{ translateY: 0 }] },
			100: {
				opacity: 0,
				transform: [{ translateY: 16 }],
				easing: Easing.in(Easing.ease),
			},
		}).duration(200),
};

/** Staggers a list without letting long lists wait forever. */
export const stagger = (index: number, step: number, base = 0, max = 8) =>
	base + Math.min(index, max) * step;
