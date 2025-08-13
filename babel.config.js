// react-native-worklets/plugin has to be listed last.
module.exports = (api) => {
	api.cache(true);
	return {
		presets: ["babel-preset-expo"],
		plugins: ["react-native-worklets/plugin"],
	};
};
