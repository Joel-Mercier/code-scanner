// App variants: dev / preview / production builds installable side by side.
//
// Everything else lives in app.json — this file only overlays the identity
// fields that have to differ so Android and iOS treat the builds as separate
// apps. With APP_VARIANT unset (or "production") app.json is returned
// verbatim, so the production build keeps `com.jmercier.codescanner` and the
// name "Code Scanner".
//
// APP_VARIANT is read at prebuild time (see the `env` blocks in eas.json),
// because the identity it changes is baked into android/ and ios/, not into
// the JS bundle.
const VARIANTS = {
	development: {
		suffix: ".dev",
		name: "Code Scanner Dev",
		scheme: "codescanner-dev",
	},
	preview: {
		suffix: ".preview",
		name: "Code Scanner Preview",
		scheme: "codescanner-preview",
	},
};

module.exports = ({ config }) => {
	const variant = VARIANTS[process.env.APP_VARIANT ?? ""];
	if (!variant) return config;

	return {
		...config,
		name: variant.name,
		scheme: variant.scheme,
		android: {
			...config.android,
			package: `${config.android.package}${variant.suffix}`,
		},
		ios: {
			...config.ios,
			bundleIdentifier: `${config.ios.bundleIdentifier}${variant.suffix}`,
		},
	};
};
