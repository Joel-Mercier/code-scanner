const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

// ML Kit models the app relies on. expo-camera declares "barcode_ui"; text
// recognition (expo-text-extractor) runs on Google Play services' "ocr"
// model, which is otherwise fetched the first time a page is read. Listing
// it here lets the Play Store install it along with the app.
const DEPENDENCIES = "com.google.mlkit.vision.DEPENDENCIES";
const MODELS = "barcode_ui,ocr";

module.exports = function withMlKitModels(config) {
	return withAndroidManifest(config, (config) => {
		const manifest = config.modResults.manifest;
		manifest.$["xmlns:tools"] ??= "http://schemas.android.com/tools";
		const application = AndroidConfig.Manifest.getMainApplicationOrThrow(
			config.modResults,
		);
		const entries = (application["meta-data"] ?? []).filter(
			(entry) => entry.$["android:name"] !== DEPENDENCIES,
		);
		entries.push({
			$: {
				"android:name": DEPENDENCIES,
				"android:value": MODELS,
				// expo-camera's library manifest declares the same entry.
				"tools:replace": "android:value",
			},
		});
		application["meta-data"] = entries;
		return config;
	});
};
